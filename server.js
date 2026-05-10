// Load .env if present (no error if missing — Railway sets vars directly)
try { require('dotenv').config(); } catch (_) {}

const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');
const crypto = require('crypto');
const session = require('express-session');
const { exec } = require('child_process');
const { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } = require('plaid');

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

// ── Plaid client ──
const PLAID_ENV = process.env.PLAID_ENV || 'sandbox';
const PLAID_SECRET = PLAID_ENV === 'production'
  ? process.env.PLAID_PRODUCTION_SECRET
  : process.env.PLAID_SANDBOX_SECRET;

const plaidClient = (process.env.PLAID_CLIENT_ID && PLAID_SECRET)
  ? new PlaidApi(new Configuration({
      basePath: PlaidEnvironments[PLAID_ENV],
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
          'PLAID-SECRET': PLAID_SECRET,
          'Plaid-Version': '2020-09-14'
        }
      }
    }))
  : null;

if (plaidClient) console.log(`✓ Plaid configured (${PLAID_ENV})`);
else console.log('⚠ Plaid not configured — set PLAID_CLIENT_ID and PLAID_SANDBOX_SECRET in .env');

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
    // Preserve server-managed fields that the front-end shouldn't be allowed to overwrite
    // (Plaid items are mutated only by the /api/plaid/* endpoints — they should never be
    // wiped by a generic settings save that happened to load stale data.)
    const existing = readUserData(req.session.userId) || {};
    const incoming = req.body || {};
    if (existing.settings?.plaidItems) {
      incoming.settings = incoming.settings || {};
      incoming.settings.plaidItems = existing.settings.plaidItems;
    }
    saveUserData(req.session.userId, incoming);
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

// ───────────────────────────────────────────────
// CSV EXPORT (tax + general reports)
// ───────────────────────────────────────────────
function csvEscape(v) {
  if (v == null) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function rowsToCsv(headers, rows) {
  return [headers.join(','), ...rows.map(r => headers.map(h => csvEscape(r[h])).join(','))].join('\r\n');
}
function flattenMonth(year, monthName, monthData) {
  const out = [];
  const sections = [
    { key: 'income',           label: 'Income',           nameKey: 'source',   amtKey: 'actual',       sign: +1 },
    { key: 'fixedExpenses',    label: 'Fixed Expense',    nameKey: 'category', amtKey: 'actual',       sign: -1 },
    { key: 'variableExpenses', label: 'Variable Expense', nameKey: 'category', amtKey: 'actual',       sign: -1 },
    { key: 'debt',             label: 'Debt Payment',     nameKey: 'category', amtKey: 'payment',      sign: -1 },
    { key: 'savings',          label: 'Savings',          nameKey: 'goal',     amtKey: 'contribution', sign: -1 }
  ];
  for (const s of sections) {
    for (const item of (monthData?.[s.key] || [])) {
      const groupName = item[s.nameKey] || '—';
      const account   = item.account || '';
      if (item.entries && item.entries.length) {
        for (const e of item.entries) {
          out.push({
            Date: e.date || '',
            Year: year,
            Month: monthName,
            Section: s.label,
            Category: groupName,
            Description: e.desc || '',
            Account: e.account || account,
            Amount: ((e.amount || 0) * s.sign).toFixed(2),
            'Plaid ID': e.plaidId || ''
          });
        }
      } else {
        out.push({
          Date: '', Year: year, Month: monthName,
          Section: s.label, Category: groupName,
          Description: '(monthly total)',
          Account: account,
          Amount: ((item[s.amtKey] || 0) * s.sign).toFixed(2),
          'Plaid ID': ''
        });
      }
    }
  }
  return out;
}

// Full month CSV (every entry, signed)
app.get('/api/export/month/:year/:month.csv', requireAuth, (req, res) => {
  const data = readUserData(req.session.userId);
  const md = data?.data?.[req.params.year]?.months?.[req.params.month];
  if (!md) return res.status(404).send('Month not found');
  const rows = flattenMonth(req.params.year, req.params.month, md);
  const headers = ['Date','Year','Month','Section','Category','Description','Account','Amount','Plaid ID'];
  const csv = rowsToCsv(headers, rows);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="tally-${req.params.year}-${req.params.month}.csv"`);
  res.send(csv);
});

// Full year CSV (every entry across all months)
app.get('/api/export/year/:year.csv', requireAuth, (req, res) => {
  const data = readUserData(req.session.userId);
  const yd = data?.data?.[req.params.year];
  if (!yd) return res.status(404).send('Year not found');
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const rows = [];
  for (const m of months) {
    const md = yd.months?.[m];
    if (!md) continue;
    rows.push(...flattenMonth(req.params.year, m, md));
  }
  const headers = ['Date','Year','Month','Section','Category','Description','Account','Amount','Plaid ID'];
  const csv = rowsToCsv(headers, rows);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="tally-${req.params.year}-full.csv"`);
  res.send(csv);
});

// Tax-focused CSV: grouped & totaled by IRS-relevant buckets
app.get('/api/export/tax/:year.csv', requireAuth, (req, res) => {
  const data = readUserData(req.session.userId);
  const yd = data?.data?.[req.params.year];
  if (!yd) return res.status(404).send('Year not found');
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  // Buckets relevant for tax filing (Schedule A itemized + Schedule C self-employed + 1099 income)
  const bucketRules = [
    { bucket: '1099/Self-Employment Income', test: (s, c) => s === 'Income' && /business|freelance|1099|brand|content|misc/i.test(c) },
    { bucket: 'W-2 / Salary Income',          test: (s, c) => s === 'Income' && /salary|wages|w-?2/i.test(c) },
    { bucket: 'Other Income',                 test: (s, c) => s === 'Income' },

    { bucket: 'Charitable Contributions',     test: (s, c) => /charit|tithe|donat/i.test(c) },
    { bucket: 'Medical & Dental',             test: (s, c) => /medical|health|dental|pharmacy|vision/i.test(c) },
    { bucket: 'Mortgage / Rent / Utilities',  test: (s, c) => /rent|mortgage|util|wifi|electric|gas\b|water/i.test(c) },
    { bucket: 'Education',                    test: (s, c) => /school|education|tuition|extra-curricular/i.test(c) },
    { bucket: 'Childcare',                    test: (s, c) => /childcare|daycare|baby/i.test(c) },
    { bucket: 'Business Expenses',            test: (s, c) => /business|misc business|office/i.test(c) },
    { bucket: 'Auto Expenses',                test: (s, c) => /auto|car|gas\b|vehicle|maintenance|insurance/i.test(c) },
    { bucket: 'Student-Loan Interest',        test: (s, c) => /student loan/i.test(c) }
  ];
  function bucketize(section, category) {
    for (const r of bucketRules) if (r.test(section, category)) return r.bucket;
    return null;
  }

  const summary = {};
  const detail  = [];

  for (const m of months) {
    const md = yd.months?.[m];
    if (!md) continue;
    const flat = flattenMonth(req.params.year, m, md);
    for (const r of flat) {
      const bucket = bucketize(r.Section, r.Category);
      if (!bucket) continue;
      const amt = parseFloat(r.Amount) || 0;
      summary[bucket] = (summary[bucket] || 0) + amt;
      detail.push({ ...r, 'Tax Bucket': bucket });
    }
  }

  // Build a CSV with two stacked sections: Summary then Detail
  const sumRows = Object.entries(summary)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .map(([Bucket, Total]) => ({ Bucket, Total: Total.toFixed(2) }));

  const lines = [];
  lines.push(`Tally AI — Tax Report for ${req.params.year}`);
  lines.push(`Generated ${new Date().toISOString().split('T')[0]}`);
  lines.push('');
  lines.push('— SUMMARY —');
  lines.push(rowsToCsv(['Bucket','Total'], sumRows));
  lines.push('');
  lines.push('— DETAIL —');
  lines.push(rowsToCsv(['Date','Year','Month','Section','Category','Description','Account','Amount','Plaid ID','Tax Bucket'], detail));

  const csv = lines.join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="tally-tax-${req.params.year}.csv"`);
  res.send(csv);
});

// ───────────────────────────────────────────────
// PLAID INTEGRATION
// ───────────────────────────────────────────────
function ensurePlaid(res) {
  if (!plaidClient) { res.status(503).json({ error: 'Plaid is not configured on the server.' }); return false; }
  return true;
}

// Public storage diagnostic — confirms whether the Railway volume is actually mounted
app.get('/api/debug/storage', (req, res) => {
  function safeList(dir) {
    try { return fs.readdirSync(dir).map(f => {
      try {
        const st = fs.statSync(path.join(dir, f));
        return { name: f, size: st.size, isDir: st.isDirectory(), mtime: st.mtime };
      } catch { return { name: f }; }
    }); } catch { return null; }
  }
  res.json({
    cwd: process.cwd(),
    __dirname,
    DATA_DIR,
    DATA_DIR_env: process.env.DATA_DIR || null,
    slashDataExists: fs.existsSync('/data'),
    DATA_DIR_exists: fs.existsSync(DATA_DIR),
    DATA_DIR_contents: safeList(DATA_DIR),
    slashDataContents: safeList('/data'),
    legacyExists: fs.existsSync(LEGACY_DATA_FILE),
    rootListing: safeList('/').slice(0, 30)
  });
});

// Public status check — no auth required, no secrets exposed
app.get('/api/plaid/status', (req, res) => {
  res.json({
    configured: !!plaidClient,
    env: PLAID_ENV,
    hasClientId: !!process.env.PLAID_CLIENT_ID,
    hasSandboxSecret: !!process.env.PLAID_SANDBOX_SECRET,
    hasProductionSecret: !!process.env.PLAID_PRODUCTION_SECRET
  });
});

// Plaid → app-category mapping (uses Plaid's Personal Finance Category taxonomy)
// Returns { type: 'income'|'fixedExpenses'|'variableExpenses'|'debt'|'savings', categoryHint: '...' }
function mapPlaidCategory(personal_finance_category) {
  const detailed = personal_finance_category?.detailed || '';
  const primary  = personal_finance_category?.primary || '';

  // INCOME
  if (primary === 'INCOME') return { type: 'income', categoryHint: '' };

  // DEBT PAYMENTS
  if (primary === 'LOAN_PAYMENTS') return { type: 'debt', categoryHint: '' };
  if (detailed === 'TRANSFER_OUT_SAVINGS') return { type: 'savings', categoryHint: '' };

  // FIXED EXPENSES (recurring bills)
  const fixedMap = {
    'RENT_AND_UTILITIES_RENT': 'Rent',
    'RENT_AND_UTILITIES_INTERNET_AND_CABLE': 'Wifi',
    'RENT_AND_UTILITIES_GAS_AND_ELECTRICITY': 'Utilities',
    'RENT_AND_UTILITIES_WATER': 'Utilities',
    'RENT_AND_UTILITIES_TELEPHONE': 'Wifi',
    'RENT_AND_UTILITIES_OTHER_UTILITIES': 'Utilities',
    'GENERAL_SERVICES_INSURANCE': 'Car insurance',
    'GENERAL_SERVICES_AUTOMOTIVE': 'Car insurance',
    'GENERAL_SERVICES_STORAGE': 'Storage'
  };
  if (fixedMap[detailed]) return { type: 'fixedExpenses', categoryHint: fixedMap[detailed] };

  // VARIABLE EXPENSES
  const varMap = {
    'FOOD_AND_DRINK_GROCERIES':                   'Groceries',
    'FOOD_AND_DRINK_RESTAURANTS':                 'Eating Out',
    'FOOD_AND_DRINK_FAST_FOOD':                   'Eating Out',
    'FOOD_AND_DRINK_COFFEE':                      'Eating Out',
    'FOOD_AND_DRINK_BEER_WINE_AND_LIQUOR':        'Eating Out',
    'FOOD_AND_DRINK_VENDING_MACHINES':            'Eating Out',
    'FOOD_AND_DRINK_OTHER_FOOD_AND_DRINK':        'Eating Out',
    'TRANSPORTATION_GAS':                         'Gas',
    'TRANSPORTATION_PARKING':                     'Auto / Car Maintenance',
    'TRANSPORTATION_TOLLS':                       'Auto / Car Maintenance',
    'TRANSPORTATION_PUBLIC_TRANSIT':              'Gas',
    'TRANSPORTATION_TAXIS_AND_RIDE_SHARES':       'Entertainment / Date',
    'GENERAL_SERVICES_AUTOMOTIVE':                'Auto / Car Maintenance',
    'ENTERTAINMENT_TV_AND_MOVIES':                'Entertainment / Date',
    'ENTERTAINMENT_MUSIC_AND_AUDIO':              'Entertainment / Date',
    'ENTERTAINMENT_VIDEO_GAMES':                  'Entertainment / Date',
    'ENTERTAINMENT_SPORTING_EVENTS_AMUSEMENT_PARKS_AND_MUSEUMS': 'Entertainment / Date',
    'ENTERTAINMENT_CASINOS_AND_GAMBLING':         'Entertainment / Date',
    'ENTERTAINMENT_OTHER_ENTERTAINMENT':          'Entertainment / Date',
    'GENERAL_MERCHANDISE_CLOTHING_AND_ACCESSORIES': 'Clothes Shopping',
    'GENERAL_MERCHANDISE_DEPARTMENT_STORES':      'Household Shopping',
    'GENERAL_MERCHANDISE_DISCOUNT_STORES':        'Household Shopping',
    'GENERAL_MERCHANDISE_SUPERSTORES':            'Household Shopping',
    'GENERAL_MERCHANDISE_ONLINE_MARKETPLACES':    'Household Shopping',
    'GENERAL_MERCHANDISE_BOOKSTORES_AND_NEWSSTANDS': 'Household Shopping',
    'GENERAL_MERCHANDISE_CONVENIENCE_STORES':     'Household Shopping',
    'GENERAL_MERCHANDISE_ELECTRONICS':            'Household Shopping',
    'GENERAL_MERCHANDISE_GIFTS_AND_NOVELTIES':    'Gifts',
    'GENERAL_MERCHANDISE_OFFICE_SUPPLIES':        'Misc Business Expenses',
    'GENERAL_MERCHANDISE_PET_SUPPLIES':           'Household Shopping',
    'GENERAL_MERCHANDISE_SPORTING_GOODS':         'Household Shopping',
    'GENERAL_MERCHANDISE_TOBACCO_AND_VAPE':       'Personal Care',
    'GENERAL_MERCHANDISE_OTHER_GENERAL_MERCHANDISE': 'Household Shopping',
    'HOME_IMPROVEMENT_FURNITURE':                 'Household Shopping',
    'HOME_IMPROVEMENT_HARDWARE':                  'Household Shopping',
    'HOME_IMPROVEMENT_REPAIR_AND_MAINTENANCE':    'Household Shopping',
    'HOME_IMPROVEMENT_SECURITY':                  'Household Shopping',
    'HOME_IMPROVEMENT_OTHER_HOME_IMPROVEMENT':    'Household Shopping',
    'MEDICAL_DENTAL_CARE':                        'Medical / Health',
    'MEDICAL_EYE_CARE':                           'Medical / Health',
    'MEDICAL_NURSING_CARE':                       'Medical / Health',
    'MEDICAL_PHARMACIES_AND_SUPPLEMENTS':         'Medical / Health',
    'MEDICAL_PRIMARY_CARE':                       'Medical / Health',
    'MEDICAL_VETERINARY_SERVICES':                'Medical / Health',
    'MEDICAL_OTHER_MEDICAL':                      'Medical / Health',
    'PERSONAL_CARE_GYMS_AND_FITNESS_CENTERS':     'Personal Care',
    'PERSONAL_CARE_HAIR_AND_BEAUTY':              'Personal Care',
    'PERSONAL_CARE_LAUNDRY_AND_DRY_CLEANING':     'Personal Care',
    'PERSONAL_CARE_OTHER_PERSONAL_CARE':          'Personal Care',
    'GENERAL_SERVICES_CHILDCARE':                 'School / Extra-Curricular',
    'GENERAL_SERVICES_CONSULTING_AND_LEGAL':      'Misc Business Expenses',
    'GENERAL_SERVICES_EDUCATION':                 'School / Extra-Curricular',
    'TRAVEL_FLIGHTS':                             'Travel',
    'TRAVEL_LODGING':                             'Travel',
    'TRAVEL_RENTAL_CARS':                         'Travel',
    'TRAVEL_OTHER_TRAVEL':                        'Travel',
    'GOVERNMENT_AND_NON_PROFIT_DONATIONS':        'Charity',
    'GOVERNMENT_AND_NON_PROFIT_OTHER_GOVERNMENT_AND_NON_PROFIT': 'Charity'
  };
  if (varMap[detailed]) return { type: 'variableExpenses', categoryHint: varMap[detailed] };

  // Fallback by primary category
  const primaryFallback = {
    'FOOD_AND_DRINK': 'Eating Out',
    'TRANSPORTATION': 'Gas',
    'GENERAL_MERCHANDISE': 'Household Shopping',
    'ENTERTAINMENT': 'Entertainment / Date',
    'PERSONAL_CARE': 'Personal Care',
    'MEDICAL': 'Medical / Health',
    'TRAVEL': 'Travel'
  };
  if (primaryFallback[primary]) return { type: 'variableExpenses', categoryHint: primaryFallback[primary] };

  return { type: 'variableExpenses', categoryHint: '' };
}

// Create a Plaid Link token (to be used by the front-end Plaid Link UI)
app.post('/api/plaid/link-token', requireAuth, async (req, res) => {
  if (!ensurePlaid(res)) return;
  try {
    const r = await plaidClient.linkTokenCreate({
      user: { client_user_id: req.session.userId || 'tally-user' },
      client_name: 'Tally AI',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en'
    });
    res.json({ link_token: r.data.link_token });
  } catch (e) {
    console.error('Plaid link-token error:', e?.response?.data || e.message);
    res.status(500).json({ error: e?.response?.data?.error_message || e.message });
  }
});

// Exchange the public_token from Plaid Link for a long-lived access_token, and store it
app.post('/api/plaid/exchange', requireAuth, async (req, res) => {
  if (!ensurePlaid(res)) return;
  try {
    const { public_token, metadata } = req.body;
    const r = await plaidClient.itemPublicTokenExchange({ public_token });
    const access_token = r.data.access_token;
    const item_id      = r.data.item_id;

    // Get account info for this item
    const acc = await plaidClient.accountsGet({ access_token });
    const accounts = (acc.data.accounts || []).map(a => ({
      id:       a.account_id,
      name:     a.name,
      mask:     a.mask,
      type:     a.type,
      subtype:  a.subtype,
      appAccount: ''
    }));

    // Persist on data.json
    const data = readUserData(req.session.userId) || { settings: {}, data: {} };
    if (!data.settings) data.settings = {};
    if (!data.settings.plaidItems) data.settings.plaidItems = [];
    data.settings.plaidItems.push({
      id: item_id,
      accessToken: access_token,
      institutionName: metadata?.institution?.name || 'Bank',
      institutionId:   metadata?.institution?.institution_id || '',
      linkedBy:        req.session.userId,
      linkedAt:        new Date().toISOString(),
      lastSync:        null,
      cursor:          null,
      accounts
    });
    saveUserData(req.session.userId, data);

    res.json({ success: true, item_id, accounts });
  } catch (e) {
    console.error('Plaid exchange error:', e?.response?.data || e.message);
    res.status(500).json({ error: e?.response?.data?.error_message || e.message });
  }
});

// List linked banks (without exposing access tokens)
app.get('/api/plaid/items', requireAuth, (req, res) => {
  const data = readUserData(req.session.userId);
  const items = (data?.settings?.plaidItems || []).map(it => ({
    id: it.id, institutionName: it.institutionName, linkedBy: it.linkedBy,
    linkedAt: it.linkedAt, lastSync: it.lastSync, accounts: it.accounts
  }));
  res.json({ items });
});

// Remove a linked bank
app.delete('/api/plaid/item/:id', requireAuth, async (req, res) => {
  if (!ensurePlaid(res)) return;
  try {
    const data = readUserData(req.session.userId);
    if (!data?.settings?.plaidItems) return res.json({ success: true });
    const it = data.settings.plaidItems.find(x => x.id === req.params.id);
    if (it?.accessToken) {
      try { await plaidClient.itemRemove({ access_token: it.accessToken }); } catch(_) {}
    }
    data.settings.plaidItems = data.settings.plaidItems.filter(x => x.id !== req.params.id);
    saveUserData(req.session.userId, data);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Update which app-account a Plaid account maps to
app.post('/api/plaid/item/:id/account-map', requireAuth, (req, res) => {
  const data = readUserData(req.session.userId);
  const it = data?.settings?.plaidItems?.find(x => x.id === req.params.id);
  if (!it) return res.status(404).json({ error: 'Item not found' });
  const { accountId, appAccount } = req.body;
  const acc = it.accounts.find(a => a.id === accountId);
  if (!acc) return res.status(404).json({ error: 'Account not found' });
  acc.appAccount = appAccount || '';
  saveUserData(req.session.userId, data);
  res.json({ success: true });
});

// Live balances across all linked accounts
app.get('/api/plaid/balances', requireAuth, async (req, res) => {
  if (!ensurePlaid(res)) return;
  try {
    const data = readUserData(req.session.userId);
    const items = data?.settings?.plaidItems || [];
    const out = [];
    for (const item of items) {
      try {
        const r = await plaidClient.accountsBalanceGet({ access_token: item.accessToken });
        for (const a of r.data.accounts) {
          out.push({
            itemId: item.id,
            institutionName: item.institutionName,
            accountId: a.account_id,
            name: a.name,
            mask: a.mask,
            type: a.type,
            subtype: a.subtype,
            balance: {
              available: a.balances.available,
              current:   a.balances.current,
              limit:     a.balances.limit,
              currency:  a.balances.iso_currency_code || 'USD'
            }
          });
        }
      } catch (e) {
        out.push({ itemId: item.id, institutionName: item.institutionName, error: e?.response?.data?.error_message || e.message });
      }
    }
    // Cash on hand = sum of depository (checking/savings) balances.
    // Plaid returns `available` for some banks and only `current` for others
    // (especially Capital One savings) — fall back to `current` when `available` is null.
    const depositories = out.filter(a => a.type === 'depository');
    const cashOnHand = depositories.reduce((s, a) => {
      const bal = a.balance || {};
      const v = bal.available != null ? bal.available : (bal.current != null ? bal.current : 0);
      return s + v;
    }, 0);
    // Credit utilisation
    const credits = out.filter(a => a.type === 'credit');
    const creditOwed   = credits.reduce((s, a) => s + (a.balance?.current || 0), 0);
    const creditLimit  = credits.reduce((s, a) => s + (a.balance?.limit   || 0), 0);

    res.json({ accounts: out, cashOnHand, creditOwed, creditLimit });
  } catch (e) {
    console.error('Plaid balances error:', e?.response?.data || e.message);
    res.status(500).json({ error: e?.response?.data?.error_message || e.message });
  }
});

// Recurring streams (subscriptions, bills) — matched to existing items, plus what's missing
app.get('/api/plaid/recurring', requireAuth, async (req, res) => {
  if (!ensurePlaid(res)) return;
  try {
    const data = readUserData(req.session.userId);
    const items = data?.settings?.plaidItems || [];

    // Gather all existing fixedExpenses across the latest year for matching
    const years = Object.keys(data?.data || {}).sort().reverse();
    const latestYear = years[0];
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const existingFixed = [];
    if (latestYear) {
      for (const m of months) {
        const md = data.data[latestYear].months?.[m];
        if (!md) continue;
        for (const it of (md.fixedExpenses || [])) {
          existingFixed.push({ name: (it.category || '').toLowerCase(), amount: it.actual || it.budget || 0 });
        }
        for (const it of (md.variableExpenses || [])) {
          if ((it.category || '').toLowerCase().includes('subscription') || (it.category || '').toLowerCase().includes('netflix') || (it.category || '').toLowerCase().includes('spotify')) {
            existingFixed.push({ name: (it.category || '').toLowerCase(), amount: it.actual || it.budget || 0 });
          }
        }
      }
    }
    const seen = new Map();
    for (const ef of existingFixed) {
      if (!seen.has(ef.name) || (ef.amount > seen.get(ef.name))) seen.set(ef.name, ef.amount);
    }

    const matched = [], missing = [];
    for (const item of items) {
      try {
        const r = await plaidClient.transactionsRecurringGet({
          access_token: item.accessToken,
          account_ids: item.accounts?.map(a => a.id)
        });
        const streams = [...(r.data.outflow_streams || []), ...(r.data.inflow_streams || [])];
        for (const s of streams) {
          if (s.is_active === false) continue;
          const merchantName = s.merchant_name || s.description || 'Unknown';
          const amount = Math.abs(s.average_amount?.amount || s.last_amount?.amount || 0);
          const freq   = s.frequency || 'UNKNOWN';
          const lastDate = s.last_date || s.last_transaction_date || '';
          // match heuristic: any existing item whose name contains the merchant or vice-versa
          let matchedTo = null;
          const lowerMerchant = merchantName.toLowerCase();
          for (const [name, amt] of seen) {
            if (name.includes(lowerMerchant.split(' ')[0]) || lowerMerchant.includes(name.split(' ')[0])) {
              matchedTo = { name, amount: amt };
              break;
            }
          }
          const stream = {
            merchantName, amount, freq, lastDate,
            type: s.category?.[0] || 'Unknown',
            isInflow: !!(r.data.inflow_streams || []).find(x => x.stream_id === s.stream_id),
            institution: item.institutionName,
            account: item.accounts?.find(a => a.id === s.account_id)?.name || ''
          };
          if (matchedTo) {
            stream.matchedTo = matchedTo;
            matched.push(stream);
          } else {
            missing.push(stream);
          }
        }
      } catch (e) {
        // Some plans don't include recurring — degrade gracefully
        console.warn('Plaid recurring error for item', item.id, e?.response?.data?.error_message || e.message);
      }
    }
    res.json({ matched, missing });
  } catch (e) {
    res.status(500).json({ error: e?.response?.data?.error_message || e.message });
  }
});

// Sync transactions from all linked items into entries[]
app.post('/api/plaid/sync', requireAuth, async (req, res) => {
  if (!ensurePlaid(res)) return;
  try {
    const data = readUserData(req.session.userId);
    if (!data?.settings?.plaidItems?.length) return res.json({ added: 0, items: [] });

    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    let totalAdded = 0;
    const results = [];

    for (const item of data.settings.plaidItems) {
      let cursor = item.cursor || null;
      let added = 0, modified = 0, removed = 0;
      const allTxns = [];

      // Walk Plaid /transactions/sync until has_more is false
      let hasMore = true;
      while (hasMore) {
        const r = await plaidClient.transactionsSync({
          access_token: item.accessToken,
          cursor: cursor || undefined
        });
        allTxns.push(...r.data.added);
        added    += r.data.added.length;
        modified += r.data.modified.length;
        removed  += r.data.removed.length;
        cursor    = r.data.next_cursor;
        hasMore   = r.data.has_more;
      }

      // Build entries by year/month/section/category
      for (const tx of allTxns) {
        if (tx.pending) continue;
        const dateStr = tx.date; // YYYY-MM-DD
        const d = new Date(dateStr + 'T00:00:00');
        const year = String(d.getFullYear());
        const monthName = months[d.getMonth()];

        // Plaid amounts are positive for outflow (debit), negative for inflow (credit)
        // We store positive values in entries; income vs expense is determined by the section.
        const amount = Math.abs(tx.amount);
        if (!amount) continue;

        const map = mapPlaidCategory(tx.personal_finance_category);
        const isIncome = map.type === 'income';

        // Income only when Plaid reports a credit/inflow (negative amount); skip refunds otherwise.
        if (isIncome && tx.amount > 0) continue;
        if (!isIncome && tx.amount < 0) continue;

        // Find this Plaid account's appAccount mapping
        const plaidAcc = item.accounts.find(a => a.id === tx.account_id);
        const appAccount = plaidAcc?.appAccount || item.institutionName;

        // Ensure year/month exist in data
        if (!data.data[year]) data.data[year] = { annualTotals: null, months: {} };
        if (!data.data[year].months[monthName]) {
          data.data[year].months[monthName] = {
            income: [], fixedExpenses: [], variableExpenses: [], debt: [], savings: [],
            summary: { startingBalance: 0, totalIncome: 0, totalExpenses: 0, debtPayments: 0, savingsContributions: 0, netCashFlow: 0, endingBalance: 0 }
          };
        }
        const monthData = data.data[year].months[monthName];

        // Find or create the right line item by category hint
        const sectionArr = monthData[map.type];
        const labelKey = map.type === 'income' ? 'source' : (map.type === 'savings' ? 'goal' : 'category');
        let lineItem = null;

        if (map.categoryHint) {
          lineItem = sectionArr.find(x => (x[labelKey] || '').toLowerCase() === map.categoryHint.toLowerCase());
        }
        if (!lineItem) {
          // Create a "needs review" bucket if no mapping
          const fallbackName = map.categoryHint || 'Plaid — Needs Review';
          lineItem = sectionArr.find(x => x[labelKey] === fallbackName);
          if (!lineItem) {
            lineItem = { [labelKey]: fallbackName, account: appAccount, entries: [] };
            if (map.type === 'fixedExpenses' || map.type === 'variableExpenses') {
              lineItem.budget = 0; lineItem.actual = 0;
            } else if (map.type === 'debt') {
              lineItem.balance = 0; lineItem.payment = 0;
            } else if (map.type === 'savings') {
              lineItem.target = 0; lineItem.contribution = 0; lineItem.currentBalance = 0;
            } else {
              lineItem.expected = 0; lineItem.actual = 0;
            }
            sectionArr.push(lineItem);
          }
        }
        if (!lineItem.entries) lineItem.entries = [];

        // De-dupe: skip if an entry with the same plaidId or (date+amount+desc) already exists
        const desc = (tx.merchant_name || tx.name || 'Transaction').slice(0, 60);
        const dup = lineItem.entries.find(e =>
          (e.plaidId && e.plaidId === tx.transaction_id) ||
          (e.date === dateStr && Math.abs((e.amount||0) - amount) < 0.005 && (e.desc||'').toLowerCase() === desc.toLowerCase())
        );
        if (dup) {
          if (!dup.plaidId) dup.plaidId = tx.transaction_id;
          continue;
        }

        lineItem.entries.push({
          desc,
          amount: Math.round(amount * 100) / 100,
          date: dateStr,
          account: appAccount,
          plaidId: tx.transaction_id
        });

        // Recompute the line item total from entries
        const amtField = map.type === 'income' ? 'actual' : map.type === 'debt' ? 'payment' : map.type === 'savings' ? 'contribution' : 'actual';
        lineItem[amtField] = Math.round(lineItem.entries.reduce((s, e) => s + (e.amount || 0), 0) * 100) / 100;

        totalAdded++;
      }

      item.cursor = cursor;
      item.lastSync = new Date().toISOString();
      results.push({ id: item.id, institutionName: item.institutionName, added, modified, removed });
    }

    saveUserData(req.session.userId, data);
    res.json({ added: totalAdded, items: results });
  } catch (e) {
    console.error('Plaid sync error:', e?.response?.data || e.message);
    res.status(500).json({ error: e?.response?.data?.error_message || e.message });
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
