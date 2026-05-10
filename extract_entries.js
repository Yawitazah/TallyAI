// Reads both budget Excel files, extracts formula breakdowns from "actual" cells,
// and writes them as entries[] into the existing data.json.
const XLSX = require('C:/Users/user/scoop/persist/nodejs-lts/bin/node_modules/xlsx');
const fs   = require('fs');
const path = require('path');

const DATA_FILE  = path.join(__dirname, 'data.json');
const FILES = [
  { path: 'D:/downloads/2025 House of Yawitazah Budget.xlsx', year: '2025' },
  { path: 'D:/downloads/2026 House of Yawitazah Budget.xlsx', year: '2026' }
];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// Parse a formula string like "77.21+151.59+33.16" → [77.21, 151.59, 33.16]
// Returns null if it's not a simple numeric addition formula
function parseAddFormula(f) {
  if (!f || typeof f !== 'string') return null;
  const clean = f.replace(/\s/g, '');
  // Allow only numbers, dots, and + signs (ignore SUM(), cell refs, etc.)
  if (!/^-?[\d.]+([\+\-]-?[\d.]+)+$/.test(clean)) return null;
  const parts = clean.split('+').map(v => parseFloat(v)).filter(v => !isNaN(v) && v > 0);
  return parts.length >= 2 ? parts : null;
}

// Find which column index holds "actual" values for a given section
// based on what we know of the spreadsheet layout
function identifyActualCol(headerRow, sectionKey) {
  if (!headerRow) return null;
  const words = {
    income:           ['actual', 'received'],
    fixedExpenses:    ['actual', 'spent'],
    variableExpenses: ['actual', 'spend', 'spent'],
    debt:             ['payment', 'monthly'],
    savings:          ['contribution', 'contributed']
  }[sectionKey] || ['actual'];

  for (let c = 0; c < headerRow.length; c++) {
    const cell = String(headerRow[c] || '').toLowerCase();
    if (words.some(w => cell.includes(w))) return c;
  }
  return null;
}

function detectSection(text) {
  const t = String(text || '').toUpperCase().trim();
  if (t.includes('VARIABLE')) return 'variableExpenses';
  if (t.includes('FIXED'))    return 'fixedExpenses';
  if (t.includes('INCOME'))   return 'income';
  if (t.includes('DEBT'))     return 'debt';
  if (t.includes('SAVING'))   return 'savings';
  return null;
}

// For a given item, get the "actual" field name
function actualField(section) {
  if (section === 'income')   return 'actual';
  if (section === 'debt')     return 'payment';
  if (section === 'savings')  return 'contribution';
  return 'actual';
}

// For a given item, get the "category" field name
function categoryField(section) {
  if (section === 'income')  return 'source';
  if (section === 'savings') return 'goal';
  return 'category';
}

const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
let totalEntriesAdded = 0;

for (const { path: filePath, year } of FILES) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠  File not found: ${filePath}`);
    continue;
  }

  console.log(`\n📂 Reading ${filePath} …`);
  const wb = XLSX.readFile(filePath, { cellFormula: true, cellNF: false, raw: true });

  for (const sheetName of MONTHS) {
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;

    const monthData = data.data?.[year]?.months?.[sheetName];
    if (!monthData) { console.log(`  skip ${sheetName} — not in data.json`); continue; }

    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true });
    const wsRef = ws['!ref'] ? XLSX.utils.decode_range(ws['!ref']) : null;

    let section       = null;
    let headerRow     = null;
    let actualCol     = null;
    let categoryCol   = 0;

    // Track per-section how many items we've matched
    const sectionCounters = {
      income: 0, fixedExpenses: 0, variableExpenses: 0, debt: 0, savings: 0
    };

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      const cellA = String(row?.[0] || '').trim();

      // Detect section header rows (e.g. "VARIABLE EXPENSES")
      const detected = detectSection(cellA);
      if (detected) {
        section     = detected;
        headerRow   = null;
        actualCol   = null;
        categoryCol = 0;
        continue;
      }

      if (!section) continue;

      // Detect the column-header row (contains "Budget", "Actual", etc.)
      const isHeaderRow = row.some(c => {
        const s = String(c || '').toLowerCase();
        return s.includes('budget') || s.includes('actual') || s.includes('balance') || s.includes('expense category') || s.includes('income source');
      });
      if (isHeaderRow && !actualCol) {
        headerRow   = row;
        actualCol   = identifyActualCol(row, section);
        categoryCol = 0; // category is always col A
        continue;
      }

      if (actualCol === null) continue;

      // Skip total / summary rows
      if (/^total/i.test(cellA)) continue;

      // Must have a category name
      if (!cellA) continue;

      // Get the cell address for the "actual" column
      const addr = XLSX.utils.encode_cell({ r, c: actualCol });
      const cell = ws[addr];
      if (!cell) continue;

      const formula = cell.f;
      const parsed  = parseAddFormula(formula);
      if (!parsed) continue; // no multi-value formula, skip

      // Match to existing data item by section + position
      const items   = monthData[section] || [];
      const itemIdx = sectionCounters[section];
      const item    = items[itemIdx];
      sectionCounters[section]++;

      if (!item) continue;

      // Build entries (no descriptions since spreadsheet has none)
      const entries = parsed.map((amt, i) => ({
        desc:    `Entry ${i + 1}`,
        amount:  Math.round(amt * 100) / 100,
        date:    '',
        account: item.account || ''
      }));

      item.entries = entries;
      // Keep item.actual in sync with sum (should already match, but ensure it)
      item[actualField(section)] = Math.round(parsed.reduce((s,v)=>s+v,0) * 100) / 100;

      const cat = item[categoryField(section)] || cellA;
      console.log(`  ✓ ${sheetName} › ${section} › ${cat}: ${parsed.length} entries [${parsed.map(v=>'$'+v).join(' + ')}]`);
      totalEntriesAdded += parsed.length;
    }
  }
}

fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
console.log(`\n✅ Done. ${totalEntriesAdded} individual amounts extracted and saved to data.json.`);
