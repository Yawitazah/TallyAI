const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');
const crypto = require('crypto');
const session = require('express-session');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3141;
const DEFAULT_DATA_DIR = fs.existsSync('/data') ? '/data' : path.join(__dirname, 'data');
const DATA_DIR = process.env.DATA_DIR || DEFAULT_DATA_DIR;
const LEGACY_DATA_FILE = path.join(__dirname, 'data.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJson(file, fallback = null) {
  if (!fs.existsSync(file)) return fallback;
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}

function writeJson(file, data) {
  ensureDataDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function userDataFile(userId) {
  return path.join(DATA_DIR, `user-${userId}.json`);
}

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

function makeId() {
  return crypto.randomBytes(12).toString('hex');
}

function publicUser(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}

function defaultSettings(user = {}) {
  return {
    householdName: user.householdName || `${user.name || user.username || 'My'} Budget`,
    users: [
      {
        id: user.id || 'person1',
        name: user.name || user.username || '',
        username: user.username || '',
        role: 'Primary',
        color: user.color || '#7c6ef8',
        passwordHash: ''
      },
      {
        id: 'person2',
        name: '',
        username: '',
        role: 'Partner',
        color: '#f4b942',
        passwordHash: ''
      }
    ],
    aiProvider: 'claude',
    aiApiKey: '',
    openaiApiKey: '',
    accounts: ['Checking', 'Savings', 'Credit Card', 'Cash'],
    incomeCategories: ['Salary', 'Business', 'Freelance', 'Gifts', 'Refunds', 'Other Income'],
    fixedCategories: ['Rent', 'Mortgage', 'Utilities', 'Phone', 'Internet', 'Insurance', 'Subscriptions', 'Other Fixed'],
    variableCategories: ['Groceries', 'Eating Out', 'Gas', 'Shopping', 'Personal Care', 'Medical / Health', 'Travel', 'Entertainment', 'Other'],
    debtCategories: ['Credit Card', 'Student Loan', 'Car Loan', 'Medical Bills', 'Other Debt'],
    savingsCategories: ['Emergency Fund', 'Home Fund', 'Vacation', 'Investments', 'Other Savings']
  };
}

function blankMonth() {
  return {
    income: [],
    fixedExpenses: [],
    variableExpenses: [],
    debt: [],
    savings: [],
    summary: {
      startingBalance: 0,
      totalIncome: 0,
      totalExpenses: 0,
      debtPayments: 0,
      savingsContributions: 0,
      netCashFlow: 0,
      endingBalance: 0
    }
  };
}

function createBlankData(user = {}) {
  const year = String(new Date().getFullYear());
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return {
    settings: defaultSettings(user),
    data: {
      [year]: {
        annualTotals: null,
        months: Object.fromEntries(months.map(month => [month, blankMonth()]))
      }
    }
  };
}

function readUsers() {
  return readJson(USERS_FILE, []);
}

function saveUsers(users) {
  writeJson(USERS_FILE, users);
}

function readUserData(userId) {
  return readJson(userDataFile(userId), null);
}

function saveUserData(userId, data) {
  writeJson(userDataFile(userId), data);
}

function ensureUserData(user) {
  let data = readUserData(user.id);
  if (!data) {
    data = createBlankData(user);
    saveUserData(user.id, data);
  }
  return data;
}

function migrateLegacyDataIfNeeded() {
  ensureDataDir();
  const users = readUsers();
  if (users.length || !fs.existsSync(LEGACY_DATA_FILE)) return users;

  const legacy = readJson(LEGACY_DATA_FILE, null);
  const legacyUsers = legacy?.settings?.users || [];
  const configured = legacyUsers.filter(u => u.username);
  const migratedUsers = (configured.length ? configured : [{ username: 'admin', name: 'Primary', role: 'Primary', color: '#7c6ef8', passwordHash: '' }]).map((u, idx) => ({
    id: u.id || makeId(),
    username: u.username || (idx === 0 ? 'admin' : `user${idx + 1}`),
    name: u.name || u.role || u.username || `User ${idx + 1}`,
    color: u.color || (idx === 0 ? '#7c6ef8' : '#f4b942'),
    role: u.role || 'Primary',
    passwordHash: u.passwordHash || ''
  }));

  saveUsers(migratedUsers);
  if (legacy) {
    saveUserData(migratedUsers[0].id, legacy);
    for (const user of migratedUsers.slice(1)) saveUserData(user.id, createBlankData(user));
  }
  return migratedUsers;
}

function requireAuth(req, res, next) {
  if (req.session.userId) return next();
  res.status(401).json({ error: 'Not authenticated' });
}

function startUserSession(req, user) {
  req.session.userId = user.id;
  req.session.userName = user.name || user.username || user.role;
  req.session.userColor = user.color;
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

  const normalizedUsername = username.trim().toLowerCase();
  const users = migrateLegacyDataIfNeeded();
  const user = users.find(u => u.username && u.username.toLowerCase() === normalizedUsername);

  // First-run: no users have credentials set yet → let anyone in as person1
  if (!user) return res.status(401).json({ error: 'No account found for that username. Create an account first.' });


  // Password not yet set for this user — first login sets it
  if (!user.passwordHash) {
    user.passwordHash = hashPin(password);
    saveUsers(users);
  } else if (user.passwordHash !== hashPin(password)) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  startUserSession(req, user);
  res.json({ success: true, created: false, user: publicUser(user) });
});

app.post('/api/signup', (req, res) => {
  const { username, password, name } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password are required.' });
  if (String(password).length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters.' });

  const nextUsername = String(username).trim();
  const normalizedUsername = nextUsername.toLowerCase();
  const users = migrateLegacyDataIfNeeded();
  const existing = users.find(u => u.username && u.username.toLowerCase() === normalizedUsername);
  if (existing) return res.status(409).json({ error: 'That username already exists. Sign in instead.' });

  const user = {
    id: makeId(),
    username: nextUsername,
    name: String(name || nextUsername).trim() || nextUsername,
    color: '#7c6ef8',
    role: 'Primary',
    passwordHash: hashPin(password)
  };

  users.push(user);
  saveUsers(users);
  saveUserData(user.id, createBlankData(user));
  startUserSession(req, user);
  res.status(201).json({ success: true, created: true, user: publicUser(user) });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

// ── Data API (protected) ──
app.get('/api/data', requireAuth, (req, res) => {
  const users = migrateLegacyDataIfNeeded();
  const user = users.find(u => u.id === req.session.userId) || { id: req.session.userId, username: req.session.userName };
  const data = ensureUserData(user);
  res.json(data);
});

app.post('/api/data', requireAuth, (req, res) => {
  try {
    saveUserData(req.session.userId, req.body);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Set password (protected) ──
app.post('/api/set-password', requireAuth, (req, res) => {
  const { userId, password, username, name, role, color } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID is required' });

  const data = ensureUserData({ id: req.session.userId, username: req.session.userName });
  const profile = (data.settings.users || []).find(u => u.id === userId);
  const nextUsername = String(username || profile?.username || '').trim();
  if (!nextUsername) return res.status(400).json({ error: 'Username is required' });

  const users = migrateLegacyDataIfNeeded();
  let user = users.find(u => u.id === userId);
  const duplicate = users.find(u => u.id !== userId && u.username.toLowerCase() === nextUsername.toLowerCase());
  if (duplicate) return res.status(409).json({ error: 'That username is already taken' });

  if (!user) {
    user = {
      id: userId,
      username: nextUsername,
      name: name || profile?.name || nextUsername,
      role: role || profile?.role || 'Primary',
      color: color || profile?.color || '#7c6ef8',
      passwordHash: ''
    };
    users.push(user);
    saveUserData(user.id, createBlankData(user));
  }

  user.username = nextUsername;
  user.name = name || profile?.name || user.name || nextUsername;
  user.role = role || profile?.role || user.role || 'Primary';
  user.color = color || profile?.color || user.color || '#7c6ef8';
  if (password) user.passwordHash = hashPin(password);
  saveUsers(users);
  res.json({ success: true, user: publicUser(user) });
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
  if (process.platform === 'win32' && process.env.AUTO_OPEN_BROWSER !== 'false') {
    setTimeout(() => exec(`start http://localhost:${PORT}`), 500);
  }
});
