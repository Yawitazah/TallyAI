// Tally AI — Utilities
const fmt = n => {
  if (n === null || n === undefined || isNaN(n)) return '$0.00';
  const abs = Math.abs(n);
  const str = abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n < 0 ? `-$${str}` : `$${str}`;
};

const fmtShort = n => {
  if (!n) return '$0';
  const abs = Math.abs(n);
  let str;
  if (abs >= 1000) str = '$' + (abs / 1000).toFixed(1) + 'k';
  else str = '$' + abs.toFixed(0);
  return n < 0 ? '-' + str : str;
};

const pct = (a, b) => b ? Math.round((a / b) * 100) : 0;

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function prevMonth(year, month) {
  const idx = MONTHS.indexOf(month);
  if (idx === 0) return { year: String(Number(year) - 1), month: MONTHS[11] };
  return { year, month: MONTHS[idx - 1] };
}

function nextMonth(year, month) {
  const idx = MONTHS.indexOf(month);
  if (idx === 11) return { year: String(Number(year) + 1), month: MONTHS[0] };
  return { year, month: MONTHS[idx + 1] };
}

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3000);
}

function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}

function diffClass(diff) {
  if (diff > 0) return 'positive';
  if (diff < 0) return 'negative';
  return '';
}

function budgetFillClass(actual, budget) {
  if (!budget) return 'ok';
  const ratio = actual / budget;
  if (ratio > 1) return 'over';
  if (ratio > 0.85) return 'warn';
  return 'ok';
}

function budgetFillWidth(actual, budget) {
  if (!budget) return actual > 0 ? 100 : 0;
  return Math.min(100, (actual / budget) * 100);
}

function autoClassify(description, amount) {
  const d = description.toLowerCase();
  const settings = DB.getSettings();

  // Each map is sorted longest-key-first before iterating so that specific
  // multi-word merchants ("food lion", "whole foods") always win over the
  // shorter substring they contain ("food").

  // Income keywords
  const incomeKw = { 'tax refund':'Tax Refund','zah brand':'Zah Brand Solutions','paycheck':'BBB Salary','freelance':'Content/Freelance','content':'Content/Freelance','plannet':'PlanNet','dejzah':'Dejzah.Life','salary':'BBB Salary','refund':'Refunds','gift':'Gifts' };
  for (const [k,v] of Object.entries(incomeKw).sort((a,b) => b[0].length - a[0].length)) {
    if (d.includes(k)) return { section: 'income', category: v };
  }

  // Fixed expense keywords
  const fixedKw = { 'amazon prime':'Amazon Prime','student loan':'Nelnet','doordash dash':'Doordash DashPass','google one':'Google One','la fitness':'LA Fitness','renters':'Renters Insurance','instacart+':'Instacart+','allowance':'Dejah Allowance','comporium':'Wifi','internet':'Wifi','electric':'Utilities','utilities':'Utilities','insurance':'Car Insurance','higgsfield':'Higgsfield','elevenlabs':'ElevenLabs','godaddy':'GoDaddy','capcut':'CapCut','chatgpt':'ChatGPT','netflix':'Netflix','spotify':'Spotify','plannet':'PlanNet Subscription','nelnet':'Nelnet','adobe':'Adobe','canva':'Canva','gamma':'Gamma','suno':'Suno','apple ':'Apple','power':'Utilities','phone':'ATT','dance':'Dance','wifi':'Wifi','rent':'Rent','gym':'LA Fitness','wix':'Wix: HOY','att ':'ATT' };
  for (const [k,v] of Object.entries(fixedKw).sort((a,b) => b[0].length - a[0].length)) {
    if (d.includes(k)) return { section: 'fixedExpenses', category: v };
  }

  // Variable keywords — multi-word merchants listed explicitly so they beat
  // any shorter key they contain (e.g. "food lion" beats "food")
  const variableKw = {
    // Grocery stores (specific chains first, then generic)
    'harris teeter':'Groceries','trader joe':'Groceries','whole foods':'Groceries','food lion':'Groceries','food 4 less':'Groceries','grocery outlet':'Groceries',
    'grocery':'Groceries','kroger':'Groceries','walmart':'Groceries','publix':'Groceries','safeway':'Groceries','wegmans':'Groceries','sprouts':'Groceries','lidl':'Groceries','aldi':'Groceries','target':'Groceries','costco':'Groceries',
    // Restaurants / delivery
    'chick-fil':'Eating Out','mcdonald':'Eating Out','doordash':'Eating Out','ubereats':'Eating Out','grubhub':'Eating Out','chipotle':'Eating Out','starbucks':'Eating Out','dunkin':'Eating Out','subway':'Eating Out','restaurant':'Eating Out',
    // "food" last — generic and easily shadowed by merchant names above
    'food':'Eating Out',
    // Gas
    'oil change':'Auto / Car Maintenance','car wash':'Gas','exxon':'Gas','chevron':'Gas','shell':'Gas','bp ':'Gas','gas':'Gas',
    // Auto
    'mechanic':'Auto / Car Maintenance',
    // Entertainment
    'home depot':'Household Shopping','entertainment':'Entertainment / Date','movie':'Entertainment / Date','date':'Entertainment / Date',
    // Shopping
    'household':'Household Shopping','lowes':'Household Shopping','clothing':'Clothes Shopping','clothes':'Clothes Shopping','fashion':'Clothes Shopping','shoes':'Clothes Shopping',
    // Personal care
    'personal care':'Personal Care','salon':'Personal Care','hair':'Personal Care','nail':'Personal Care','spa':'Personal Care',
    // Health
    'pharmacy':'Medical / Health','medical':'Medical / Health','doctor':'Medical / Health',
    // Other
    'school':'School / Extra-Curricular','tuition':'School / Extra-Curricular','diaper':'Baby','baby':'Baby','church':'Charity','charity':'Charity','airbnb':'Travel','flight':'Travel','travel':'Travel','hotel':'Travel','business':'Misc Business Expenses',
  };
  for (const [k,v] of Object.entries(variableKw).sort((a,b) => b[0].length - a[0].length)) {
    if (d.includes(k)) return { section: 'variableExpenses', category: v };
  }

  return { section: 'variableExpenses', category: 'Other' };
}

function parseDateStr(str) {
  if (!str) return new Date();
  const d = new Date(str);
  if (!isNaN(d)) return d;
  return new Date();
}

function getOrdinal(n) {
  const s = ["th","st","nd","rd"];
  const v = n % 100;
  return n + (s[(v-20)%10] || s[v] || s[0]);
}
