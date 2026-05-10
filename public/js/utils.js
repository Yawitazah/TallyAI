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

  // Income keywords
  const incomeKw = { 'salary':'BBB Salary','paycheck':'BBB Salary','zah brand':'Zah Brand Solutions','plannet':'PlanNet','freelance':'Content/Freelance','content':'Content/Freelance','gift':'Gifts','tax refund':'Tax Refund','refund':'Refunds','dejzah':'Dejzah.Life' };
  for (const [k,v] of Object.entries(incomeKw)) {
    if (d.includes(k)) return { section: 'income', category: v };
  }

  // Fixed expense keywords
  const fixedKw = { 'rent':'Rent','wifi':'Wifi','internet':'Wifi','comporium':'Wifi','electric':'Utilities','utilities':'Utilities','power':'Utilities','netflix':'Netflix','spotify':'Spotify','amazon prime':'Amazon Prime','apple ':'Apple','chatgpt':'ChatGPT','canva':'Canva','att ':'ATT','phone':'ATT','la fitness':'LA Fitness','gym':'LA Fitness','nelnet':'Nelnet','student loan':'Nelnet','insurance':'Car Insurance','dance':'Dance','suno':'Suno','adobe':'Adobe','capcut':'CapCut','elevenlabs':'ElevenLabs','gamma':'Gamma','google one':'Google One','higgsfield':'Higgsfield','wix':'Wix: HOY','plannet':'PlanNet Subscription','doordash dash':'Doordash DashPass','instacart+':'Instacart+','allowance':'Dejah Allowance','renters':'Renters Insurance','godaddy':'GoDaddy' };
  for (const [k,v] of Object.entries(fixedKw)) {
    if (d.includes(k)) return { section: 'fixedExpenses', category: v };
  }

  // Variable keywords
  const variableKw = { 'grocery':'Groceries','kroger':'Groceries','walmart':'Groceries','aldi':'Groceries','target':'Groceries','costco':'Groceries','food':'Eating Out','restaurant':'Eating Out','doordash':'Eating Out','ubereats':'Eating Out','chick-fil':'Eating Out','mcdonald':'Eating Out','gas':'Gas','shell':'Gas','bp ':'Gas','exxon':'Gas','chevron':'Gas','car wash':'Gas','mechanic':'Auto / Car Maintenance','oil change':'Auto / Car Maintenance','entertainment':'Entertainment / Date','movie':'Entertainment / Date','date':'Entertainment / Date','clothing':'Clothes Shopping','clothes':'Clothes Shopping','fashion':'Clothes Shopping','shoes':'Clothes Shopping','household':'Household Shopping','home depot':'Household Shopping','lowes':'Household Shopping','personal care':'Personal Care','hair':'Personal Care','nail':'Personal Care','salon':'Personal Care','spa':'Personal Care','doctor':'Medical / Health','pharmacy':'Medical / Health','medical':'Medical / Health','school':'School / Extra-Curricular','tuition':'School / Extra-Curricular','baby':'Baby','diaper':'Baby','charity':'Charity','church':'Charity','travel':'Travel','hotel':'Travel','flight':'Travel','airbnb':'Travel','business':'Misc Business Expenses' };
  for (const [k,v] of Object.entries(variableKw)) {
    if (d.includes(k)) return { section: 'variableExpenses', category: v };
  }

  // Default: if starts with $ and big amount assume variable
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
