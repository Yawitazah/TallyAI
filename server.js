const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');
const crypto = require('crypto');
const session = require('express-session');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3141;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.json({ limit: '50mb' }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'tally-ai-hoy-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

function hashPin(pin) {
  if (!pin) return '';
  return crypto.createHash('sha256').update(pin + 'tally-pin-salt').digest('hex');
}

function readData() {
  if (!fs.existsSync(DATA_FILE)) return null;
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch { return null; }
}

function requireAuth(req, res, next) {
  if (req.session.userId) return next();
  res.status(401).json({ error: 'Not authenticated' });
}

// ── Static files (login.html accessible without auth) ──
app.use(express.static(path.join(__dirname, 'public')));

// ── Auth endpoints ──
app.get('/api/me', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  res.json({ userId: req.session.userId, userName: req.session.userName, userColor: req.session.userColor });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password are required.' });

  const data = readData();
  const users = data?.settings?.users || [];

  // First-run: no users have credentials set yet → let anyone in as person1
  const anyConfigured = users.some(u => u.username);
  if (!anyConfigured) {
    const first = users[0] || { id: 'person1', name: '', role: 'Primary', color: '#7c6ef8' };
    first.username = username;
    first.passwordHash = hashPin(password);
    if (data) fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    req.session.userId = first.id;
    req.session.userName = first.name || first.role;
    req.session.userColor = first.color;
    return res.json({ success: true, firstRun: true, user: first });
  }

  const user = users.find(u => u.username && u.username.toLowerCase() === username.toLowerCase());
  if (!user) return res.status(401).json({ error: 'Invalid username or password.' });

  // Password not yet set for this user — first login sets it
  if (!user.passwordHash) {
    user.passwordHash = hashPin(password);
    if (data) fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } else if (user.passwordHash !== hashPin(password)) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  req.session.userId = user.id;
  req.session.userName = user.name || user.role;
  req.session.userColor = user.color;
  res.json({ success: true, user: { id: user.id, name: user.name, color: user.color, role: user.role } });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

// ── Data API (protected) ──
app.get('/api/data', requireAuth, (req, res) => {
  const data = readData();
  res.json(data || null);
});

app.post('/api/data', requireAuth, (req, res) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Set password (protected) ──
app.post('/api/set-password', requireAuth, (req, res) => {
  const { userId, password } = req.body;
  const data = readData();
  if (!data) return res.status(500).json({ error: 'No data' });
  const user = (data.settings.users || []).find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.passwordHash = password ? hashPin(password) : '';
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  res.json({ success: true });
});

// ── AI Chat (protected, dual provider) ──
app.post('/api/chat', requireAuth, (req, res) => {
  const { messages, apiKey, context, provider } = req.body;
  if (!apiKey) return res.status(400).json({ error: 'No API key provided. Add your API key in Settings.' });

  const systemPrompt = `You are Tally, a warm and expert personal financial advisor for the ${context.householdName || 'household'}. You have full access to their real budget data and give direct, practical advice.

CURRENT FINANCIAL SNAPSHOT (${context.month} ${context.year}):
- Total Income: $${context.income}
- Total Expenses: $${context.expenses}
- Debt Payments: $${context.debtPayments}
- Savings Contributions: $${context.savings}
- Net Cash Flow: $${context.net}
- Ending Balance: $${context.endingBalance}

ANNUAL CONTEXT (${context.year}):
${context.annualSummary || 'No annual data available.'}

TOP VARIABLE EXPENSES THIS MONTH:
${context.topExpenses || 'No data.'}

ACTIVE DEBTS:
${context.debts || 'No debt data.'}

SAVINGS GOALS:
${context.goals || 'No savings goals.'}

HOUSEHOLD MEMBERS: ${context.members || 'Not specified'}
CURRENT USER: ${req.session.userName || 'Unknown'}

Give concise, actionable advice using specific dollar amounts from their data. Be encouraging but honest about problem areas. Use bullet points for clarity. Never invent numbers not in the data above.`;

  function friendlyError(msg, provider) {
    if (!msg) return 'Unknown error from AI provider.';
    if (msg.includes('quota') || msg.includes('insufficient') || msg.includes('billing') || msg.includes('credit')) {
      return provider === 'openai'
        ? 'Your OpenAI account has no credits. Add billing at platform.openai.com → Billing.'
        : 'Your Anthropic account has no credits. Add credits at console.anthropic.com → Billing.';
    }
    if (msg.includes('invalid') || msg.includes('Incorrect') || msg.includes('authentication') || msg.includes('API key')) {
      return `Invalid API key. Double-check your ${provider === 'openai' ? 'OpenAI' : 'Anthropic'} key in Settings.`;
    }
    if (msg.includes('rate')) return 'Rate limit hit. Wait a moment and try again.';
    return msg;
  }

  if (provider === 'openai') {
    const payload = JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      max_tokens: 1024
    });
    const opts = {
      hostname: 'api.openai.com', path: '/v1/chat/completions', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, 'Content-Length': Buffer.byteLength(payload) }
    };
    const apiReq = https.request(opts, apiRes => {
      let data = '';
      apiRes.on('data', c => data += c);
      apiRes.on('end', () => {
        try {
          const p = JSON.parse(data);
          if (p.error) return res.status(400).json({ error: friendlyError(p.error.message, 'openai') });
          if (!p.choices || !p.choices[0]) return res.status(500).json({ error: 'Unexpected response from OpenAI.' });
          res.json({ reply: p.choices[0].message.content });
        } catch (e) { res.status(500).json({ error: 'Could not parse OpenAI response: ' + e.message }); }
      });
    });
    apiReq.on('error', e => res.status(500).json({ error: 'Network error reaching OpenAI: ' + e.message }));
    apiReq.write(payload);
    apiReq.end();
  } else {
    // Claude (Anthropic)
    const payload = JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages
    });
    const opts = {
      hostname: 'api.anthropic.com', path: '/v1/messages', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Length': Buffer.byteLength(payload) }
    };
    const apiReq = https.request(opts, apiRes => {
      let data = '';
      apiRes.on('data', c => data += c);
      apiRes.on('end', () => {
        try {
          const p = JSON.parse(data);
          if (p.error) return res.status(400).json({ error: friendlyError(p.error.message, 'claude') });
          if (!p.content || !p.content[0]) return res.status(500).json({ error: 'Unexpected response from Claude.' });
          res.json({ reply: p.content[0].text });
        } catch (e) { res.status(500).json({ error: 'Could not parse Claude response: ' + e.message }); }
      });
    });
    apiReq.on('error', e => res.status(500).json({ error: 'Network error reaching Anthropic: ' + e.message }));
    apiReq.write(payload);
    apiReq.end();
  }
});

app.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════╗');
  console.log('║       TALLY AI is running!         ║');
  console.log(`║   http://localhost:${PORT}          ║`);
  console.log('╚════════════════════════════════════╝\n');
  if (process.platform === 'win32') setTimeout(() => exec(`start http://localhost:${PORT}`), 500);
});
