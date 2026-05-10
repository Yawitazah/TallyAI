// Tally AI — Data Layer
const DB = (() => {
  let _data = null;

  async function init() {
    try {
      const res = await fetch('/api/data');
      if (res.status === 401) {
        window.location.href = '/login.html';
        return;
      }
      const saved = await res.json();
      if (saved && saved.settings) {
        _data = saved;
        migrate();
      } else {
        _data = JSON.parse(JSON.stringify(SEED_DATA));
        await save();
      }
    } catch (e) {
      _data = JSON.parse(JSON.stringify(SEED_DATA));
    }
  }

  function migrate() {
    const s = _data.settings;
    if (!s.users || s.users.length === 0) {
      s.users = [
        { id: 'person1', name: s.person1?.name || '', username: '', role: s.person1?.role || 'Primary', color: s.person1?.color || '#7c6ef8', passwordHash: '' },
        { id: 'person2', name: s.person2?.name || '', username: '', role: s.person2?.role || 'Partner', color: s.person2?.color || '#f4b942', passwordHash: '' }
      ];
    }
    // Ensure each user has username + passwordHash fields
    s.users.forEach(u => {
      if (!u.username) u.username = '';
      if (!u.passwordHash) u.passwordHash = u.pinHash || '';
      delete u.pinHash;
    });
    if (!s.aiProvider) s.aiProvider = 'claude';
    if (!s.openaiApiKey) s.openaiApiKey = '';
    if (!s.aiApiKey) s.aiApiKey = '';
    save();
  }

  async function save() {
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(_data)
      });
    } catch (e) {}
  }

  function get() { return _data; }
  function getSettings() { return _data.settings; }

  function getMonth(year, month) {
    return _data.data[year]?.months[month] || null;
  }

  function setMonth(year, month, data) {
    if (!_data.data[year]) _data.data[year] = { annualTotals: null, months: {} };
    _data.data[year].months[month] = data;
    save();
  }

  function addLineItem(year, month, section, item) {
    const m = getMonth(year, month);
    if (!m) return;
    if (!m[section]) m[section] = [];
    m[section].push(item);
    setMonth(year, month, m);
  }

  function updateLineItem(year, month, section, idx, updates) {
    const m = getMonth(year, month);
    if (!m || !m[section]) return;
    m[section][idx] = { ...m[section][idx], ...updates };
    setMonth(year, month, m);
  }

  function addEntry(year, month, section, itemIdx, entry) {
    const m = getMonth(year, month);
    if (!m || !m[section] || !m[section][itemIdx]) return;
    const item = m[section][itemIdx];
    if (!item.entries) item.entries = [];
    item.entries.push(entry);
    const amtField = section === 'income' ? 'actual' : section === 'debt' ? 'payment' : section === 'savings' ? 'contribution' : 'actual';
    item[amtField] = item.entries.reduce((s, e) => s + (e.amount || 0), 0);
    setMonth(year, month, m);
  }

  function deleteEntry(year, month, section, itemIdx, entryIdx) {
    const m = getMonth(year, month);
    if (!m || !m[section] || !m[section][itemIdx]) return;
    const item = m[section][itemIdx];
    if (!item.entries || !item.entries[entryIdx]) return;
    item.entries.splice(entryIdx, 1);
    const amtField = section === 'income' ? 'actual' : section === 'debt' ? 'payment' : section === 'savings' ? 'contribution' : 'actual';
    item[amtField] = item.entries.length ? item.entries.reduce((s, e) => s + (e.amount || 0), 0) : 0;
    setMonth(year, month, m);
  }

  function deleteLineItem(year, month, section, idx) {
    const m = getMonth(year, month);
    if (!m || !m[section]) return;
    m[section].splice(idx, 1);
    setMonth(year, month, m);
  }

  function updateSummary(year, month) {
    const m = getMonth(year, month);
    if (!m) return;
    const income = (m.income || []).reduce((s, i) => s + (i.actual || 0), 0);
    const fixed = (m.fixedExpenses || []).reduce((s, i) => s + (i.actual || 0), 0);
    const variable = (m.variableExpenses || []).reduce((s, i) => s + (i.actual || 0), 0);
    const debtPayments = (m.debt || []).reduce((s, i) => s + (i.payment || 0), 0);
    const savings = (m.savings || []).reduce((s, i) => s + (i.contribution || 0), 0);
    const expenses = fixed + variable;
    const net = income - expenses - debtPayments - savings;
    m.summary = {
      ...m.summary,
      totalIncome: income,
      totalExpenses: expenses,
      debtPayments,
      savingsContributions: savings,
      netCashFlow: net,
      endingBalance: (m.summary.startingBalance || 0) + net
    };
    setMonth(year, month, m);
    return m.summary;
  }

  function getYearMonths(year) {
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    return months.map(m => ({
      name: m,
      data: getMonth(year, m)
    }));
  }

  function getAllYears() {
    return Object.keys(_data.data).sort();
  }

  function importFromParsed(year, month, parsed) {
    if (!_data.data[year]) _data.data[year] = { annualTotals: null, months: {} };
    _data.data[year].months[month] = parsed;
    save();
  }

  return { init, get, save, getSettings, getMonth, setMonth, addLineItem, updateLineItem, deleteLineItem, addEntry, deleteEntry, updateSummary, getYearMonths, getAllYears, importFromParsed };
})();
