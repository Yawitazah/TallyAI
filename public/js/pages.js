// Tally AI — Page Renderers
const Pages = (() => {

  // ===== DASHBOARD =====
  function dashboard(year, month) {
    const monthData = DB.getMonth(year, month);
    const yearMonths = DB.getYearMonths(year);
    const s = monthData?.summary || {};

    const income = s.totalIncome || 0;
    const expenses = s.totalExpenses || 0;
    const debtPay = s.debtPayments || 0;
    const savings = s.savingsContributions || 0;
    const net = s.netCashFlow || 0;
    const ending = s.endingBalance || 0;

    const incomeEl = el('div', 'stat-card income');
    incomeEl.innerHTML = `<div class="stat-icon">💚</div><div class="stat-label">Total Income</div><div class="stat-value positive">${fmt(income)}</div><div class="stat-sub">${month} ${year}</div>`;

    const expEl = el('div', 'stat-card expenses');
    expEl.innerHTML = `<div class="stat-icon">🔴</div><div class="stat-label">Total Expenses</div><div class="stat-value negative">${fmt(expenses)}</div><div class="stat-sub">Fixed + Variable</div>`;

    const debtEl = el('div', 'stat-card expenses');
    debtEl.style.cssText = '--card-accent: #ffb347';
    debtEl.innerHTML = `<div class="stat-icon">⚡</div><div class="stat-label">Debt Payments</div><div class="stat-value" style="color:var(--warning)">${fmt(debtPay)}</div><div class="stat-sub">Loans + Credit</div>`;

    const netEl = el('div', 'stat-card net');
    const netClass = net >= 0 ? 'positive' : 'negative';
    netEl.innerHTML = `<div class="stat-icon">✦</div><div class="stat-label">Net Cash Flow</div><div class="stat-value ${netClass}">${fmt(net)}</div><div class="stat-sub">Ending: ${fmt(ending)}</div>`;

    const statsGrid = el('div', 'stats-grid');
    statsGrid.append(incomeEl, expEl, debtEl, netEl);

    // Charts
    const chartsGrid = el('div', 'charts-grid');

    const barCard = el('div', 'chart-card');
    barCard.innerHTML = `<div class="chart-header"><span class="chart-title">📊 Income vs Expenses — ${year}</span><span class="chart-meta">Monthly View</span></div><div class="chart-wrap"><canvas id="chart-bar"></canvas></div>`;

    const donutCard = el('div', 'chart-card');
    donutCard.innerHTML = `<div class="chart-header"><span class="chart-title">🥧 Expense Breakdown</span><span class="chart-meta">${month}</span></div><div class="chart-wrap"><canvas id="chart-donut"></canvas></div>`;

    chartsGrid.append(barCard, donutCard);

    // Bottom: upcoming bills + top categories
    const bottomGrid = el('div', 'bottom-grid');

    const billsCard = el('div', 'section-card');
    const bills = getBillsForMonth(monthData);
    billsCard.innerHTML = `
      <div class="section-header open" style="cursor:default">
        <div class="section-title-row"><span class="section-dot fixed"></span><span class="section-title">📅 Bills This Month</span></div>
        <span class="chip chip-primary">${bills.length} items</span>
      </div>
      <div class="section-body open" style="max-height:320px;overflow-y:auto">
        <div class="bills-list">${bills.slice(0,10).map(b => `
          <div class="bill-item">
            <div class="bill-day"><span class="bill-day-num">${b.day}</span><span class="bill-day-label">Due</span></div>
            <div class="bill-info"><div class="bill-name">${b.name}</div><div class="bill-account">${b.account}</div></div>
            <span class="bill-amount">${fmt(b.amount)}</span>
            <span class="bill-status ${b.paid ? 'paid' : 'upcoming'}">${b.paid ? 'Paid' : 'Due'}</span>
          </div>`).join('')}
        </div>
      </div>`;

    const topVarCard = el('div', 'section-card');
    topVarCard.innerHTML = `
      <div class="section-header open" style="cursor:default">
        <div class="section-title-row"><span class="section-dot variable"></span><span class="section-title">🏆 Top Variable Spends</span></div>
      </div>
      <div class="section-body open"><div class="chart-wrap" style="height:200px;padding:12px"><canvas id="chart-var"></canvas></div></div>`;

    bottomGrid.append(billsCard, topVarCard);

    const div = el('div');
    div.append(statsGrid, chartsGrid, bottomGrid);

    // Render charts after DOM append
    setTimeout(() => {
      Charts.incomeVsExpenses('chart-bar', yearMonths);
      Charts.expenseBreakdown('chart-donut', monthData);
      Charts.categorySpend('chart-var', monthData || {}, 'variableExpenses');
    }, 50);

    return div;
  }

  function getBillsForMonth(monthData) {
    if (!monthData) return [];
    return (monthData.fixedExpenses || []).map(item => {
      const dayStr = item.dueDate || '';
      const dayMatch = dayStr.match(/(\d+)/);
      const day = dayMatch ? parseInt(dayMatch[1]) : 99;
      return {
        name: item.category,
        account: item.account,
        amount: item.budget || item.actual || 0,
        day,
        paid: (item.actual || 0) > 0
      };
    }).sort((a, b) => a.day - b.day);
  }

  // ===== MONTHLY DETAIL =====
  function monthly(year, month) {
    const monthData = DB.getMonth(year, month);
    const s = monthData?.summary || {};

    if (!monthData) {
      return el('div', 'empty-state', `<div class="empty-icon">📋</div><div class="empty-title">No data for ${month} ${year}</div><div class="empty-desc">Add transactions or import your spreadsheet.</div>`);
    }

    const income = s.totalIncome || 0;
    const expenses = s.totalExpenses || 0;
    const debt = s.debtPayments || 0;
    const sav = s.savingsContributions || 0;
    const net = s.netCashFlow || 0;

    const div = el('div');

    // Summary bar
    const sumCard = el('div', 'summary-card');
    sumCard.innerHTML = `
      <div class="summary-grid">
        <div class="summary-item"><div class="summary-label">Starting Balance</div><div class="summary-value font-mono" style="color:var(--text2)">${fmt(s.startingBalance || 0)}</div></div>
        <div class="summary-item"><div class="summary-label">Total Income</div><div class="summary-value font-mono text-success">${fmt(income)}</div></div>
        <div class="summary-item"><div class="summary-label">Total Expenses</div><div class="summary-value font-mono text-danger">${fmt(expenses)}</div></div>
      </div>
      <hr class="summary-divider">
      <div class="net-flow">
        <div>
          <div class="summary-label">Debt Payments: <strong class="font-mono" style="color:var(--warning)">${fmt(debt)}</strong> &nbsp;|&nbsp; Savings: <strong class="font-mono text-primary">${fmt(sav)}</strong></div>
        </div>
        <div class="net-value ${net >= 0 ? 'text-success' : 'text-danger'}">
          Net: ${fmt(net)}
        </div>
      </div>`;

    div.appendChild(sumCard);

    // Sections
    div.appendChild(renderSection('income', 'Income', monthData, year, month));
    div.appendChild(renderSection('fixedExpenses', 'Fixed Expenses', monthData, year, month));
    div.appendChild(renderSection('variableExpenses', 'Variable Expenses', monthData, year, month));
    div.appendChild(renderSection('debt', 'Debt Repayment', monthData, year, month));
    div.appendChild(renderSection('savings', 'Savings Plan', monthData, year, month));

    return div;
  }

  function renderSection(sectionKey, title, monthData, year, month) {
    const items = monthData[sectionKey] || [];
    const dotClass = sectionKey === 'income' ? 'income' : sectionKey === 'fixedExpenses' ? 'fixed' : sectionKey === 'variableExpenses' ? 'variable' : sectionKey === 'debt' ? 'debt' : 'savings';

    let totalBudget = 0, totalActual = 0;
    if (sectionKey === 'income') {
      totalBudget = items.reduce((s, i) => s + (i.expected || 0), 0);
      totalActual = items.reduce((s, i) => s + (i.actual || 0), 0);
    } else if (sectionKey === 'debt') {
      totalActual = items.reduce((s, i) => s + (i.payment || 0), 0);
    } else if (sectionKey === 'savings') {
      totalActual = items.reduce((s, i) => s + (i.contribution || 0), 0);
    } else {
      totalBudget = items.reduce((s, i) => s + (i.budget || 0), 0);
      totalActual = items.reduce((s, i) => s + (i.actual || 0), 0);
    }

    const diff = sectionKey === 'income' ? totalActual - totalBudget : totalBudget - totalActual;

    const card = el('div', 'section-card mb-16');
    const header = el('div', 'section-header open');
    header.innerHTML = `
      <div class="section-title-row">
        <span class="section-dot ${dotClass}"></span>
        <span class="section-title">${title}</span>
      </div>
      <div class="section-totals">
        ${totalBudget > 0 ? `<div><div class="section-total-label">Budget</div><div class="section-total-val text-muted">${fmt(totalBudget)}</div></div>` : ''}
        <div><div class="section-total-label">Actual</div><div class="section-total-val">${fmt(totalActual)}</div></div>
        ${totalBudget > 0 ? `<div><div class="section-total-label">Diff</div><div class="section-total-val ${diff >= 0 ? 'text-success' : 'text-danger'}">${diff >= 0 ? '+' : ''}${fmt(diff)}</div></div>` : ''}
        <span class="section-expand">▼</span>
      </div>`;

    header.onclick = () => {
      header.classList.toggle('open');
      body.classList.toggle('open');
    };

    const body = el('div', 'section-body open');

    const list = el('ul', 'line-items');

    items.forEach((item, idx) => {
      const li = buildLineItem(sectionKey, item, idx, year, month);
      list.appendChild(li);
    });

    // Add button
    const addRow = el('div', 'flex-between', '');
    addRow.style.cssText = 'padding:10px 20px;border-top:1px solid var(--border)';
    const addBtn = el('button', 'btn btn-ghost', `+ Add ${title.replace(' Plan','').replace(' Repayment','')} Item`);
    addBtn.style.fontSize = '0.78rem';
    addBtn.onclick = () => openAddModal(year, month, sectionKey);
    addRow.appendChild(addBtn);

    body.appendChild(list);
    body.appendChild(addRow);
    card.append(header, body);
    return card;
  }

  function buildLineItem(section, item, idx, year, month) {
    const li = el('li', 'line-item');
    const supportsEntries = ['income', 'fixedExpenses', 'variableExpenses'].includes(section);
    const entries = item.entries || [];
    const hasEntries = entries.length > 0;

    // ── Main row (built entirely with appendChild — no innerHTML +=) ──
    const row = el('div', 'li-row');
    const mainDiv = el('div', 'li-main');

    // Expand button (kept as a real reference, never overwritten by innerHTML)
    const expandBtn = el('button', 'li-expand-btn', '▶');
    expandBtn.title = 'Show / hide entries';
    if (supportsEntries) mainDiv.appendChild(expandBtn);

    // Name/info cell (inner div — safe to use innerHTML here, no listeners inside)
    const nameDiv = el('div');
    if (section === 'income') {
      nameDiv.innerHTML = `<div class="li-name">${item.source || '—'}${hasEntries ? `<span class="entry-count">(${entries.length})</span>` : ''}</div><div class="li-account">${item.account || ''} ${item.purpose ? '· '+item.purpose : ''}</div>`;
    } else if (section === 'fixedExpenses' || section === 'variableExpenses') {
      const fillW = budgetFillWidth(item.actual || 0, item.budget || 0);
      const fillC = budgetFillClass(item.actual || 0, item.budget || 0);
      nameDiv.innerHTML = `<div class="li-name">${item.category || '—'}${hasEntries ? `<span class="entry-count">(${entries.length})</span>` : ''}</div><div class="li-account">${item.account || ''}${item.dueDate ? ' · Due: '+item.dueDate : ''}</div>${item.budget > 0 ? `<div class="budget-bar"><div class="budget-fill ${fillC}" style="width:${fillW}%"></div></div>` : ''}`;
      const over = item.budget > 0 && (item.actual || 0) > item.budget;
      if (over) li.classList.add('over-budget');
      else if ((item.actual || 0) > 0) li.classList.add('under-budget');
    } else if (section === 'debt') {
      nameDiv.innerHTML = `<div class="li-name">${item.category || '—'}</div><div class="li-account">${item.account || ''}${item.interestRate ? ' · '+item.interestRate+'% APR' : ''}</div>`;
    } else if (section === 'savings') {
      const pct = item.target > 0 ? Math.min(100, Math.round(((item.currentBalance||0)/item.target)*100)) : 0;
      nameDiv.innerHTML = `<div class="li-name">${item.goal || '—'}</div><div class="li-account">${item.account || ''}</div><div class="budget-bar" style="margin-top:6px"><div class="budget-fill ok" style="width:${pct}%"></div></div>`;
    }
    mainDiv.appendChild(nameDiv);

    // Stat cells
    const c1 = el('div'), c2 = el('div'), c3 = el('div');
    if (section === 'income') {
      const diff = (item.actual || 0) - (item.expected || 0);
      c1.className = 'li-budget text-muted';        c1.textContent = fmt(item.expected || 0);
      c2.className = `li-actual ${(item.actual||0)>0?'text-success':''}`;  c2.textContent = fmt(item.actual || 0);
      c3.className = `li-diff ${diff>=0?'positive':'negative'}`;           c3.textContent = (diff>=0?'+':'')+fmt(diff);
    } else if (section === 'fixedExpenses' || section === 'variableExpenses') {
      const diff = (item.budget || 0) - (item.actual || 0);
      c1.className = 'li-budget'; c1.textContent = item.budget > 0 ? fmt(item.budget) : '';
      c2.className = 'li-actual'; c2.textContent = fmt(item.actual || 0);
      c3.className = `li-diff ${diff>=0?'positive':'negative'}`; c3.textContent = item.budget > 0 ? (diff>=0?'under':'OVER') : '';
    } else if (section === 'debt') {
      c1.className = 'li-actual text-danger';  c1.innerHTML = `${fmt(item.balance||0)} <span class="text-muted" style="font-size:0.7rem">balance</span>`;
      c2.className = 'li-actual text-warning'; c2.innerHTML = `${fmt(item.payment||0)} <span class="text-muted" style="font-size:0.7rem">payment</span>`;
    } else if (section === 'savings') {
      c1.className = 'li-budget'; c1.innerHTML = `${fmt(item.target||0)} <span class="text-muted" style="font-size:0.7rem">goal</span>`;
      c2.className = 'li-actual text-primary'; c2.textContent = fmt(item.currentBalance||0);
      c3.className = 'li-actual text-success'; c3.innerHTML = `${fmt(item.contribution||0)} <span class="text-muted" style="font-size:0.7rem">/mo</span>`;
    }

    const editBtn = el('button', 'li-edit-btn', '✏ Edit');
    editBtn.onclick = (e) => { e.stopPropagation(); openEditModal(year, month, section, idx, item); };

    row.appendChild(mainDiv);
    row.appendChild(c1);
    row.appendChild(c2);
    row.appendChild(c3);
    row.appendChild(editBtn);
    li.appendChild(row);

    if (!supportsEntries) return li;

    // ── Entries panel ──
    const panel = el('div', 'entries-panel');
    if (hasEntries) { panel.classList.add('open'); expandBtn.classList.add('open'); }

    function renderEntries() {
      panel.innerHTML = '';
      const currentItem = DB.getMonth(year, month)?.[section]?.[idx];
      const ents = currentItem?.entries || [];

      if (ents.length) {
        const entryList = el('div', 'entry-list');
        ents.forEach((e, eIdx) => {
          const eRow = el('div', 'entry-row');
          const infoDiv = el('div');
          infoDiv.innerHTML = `<div class="entry-desc">${e.desc || 'Entry'}</div><div class="entry-meta">${e.account || ''}</div>`;
          const dateDiv = el('div', 'entry-date'); dateDiv.textContent = e.date || '';
          const amtDiv  = el('div', 'entry-amount'); amtDiv.textContent = fmt(e.amount || 0);
          const delBtn  = el('button', 'entry-del', '✕');
          delBtn.title = 'Remove entry';
          delBtn.onclick = () => {
            DB.deleteEntry(year, month, section, idx, eIdx);
            DB.updateSummary(year, month);
            renderEntries();
            // Refresh the totals row without full re-render
            const fresh = DB.getMonth(year, month)?.[section]?.[idx];
            c2.textContent = fmt(fresh?.actual || fresh?.payment || fresh?.contribution || 0);
          };
          eRow.appendChild(infoDiv);
          eRow.appendChild(dateDiv);
          eRow.appendChild(amtDiv);
          eRow.appendChild(delBtn);
          entryList.appendChild(eRow);
        });
        panel.appendChild(entryList);
      }

      // Add entry form
      const accounts = DB.getSettings().accounts || [];
      const today = new Date().toISOString().split('T')[0];
      const form = el('div', 'entry-add-form');

      const descInput  = el('input'); descInput.className = 'input-desc';   descInput.type = 'text';   descInput.placeholder = 'Description (e.g. Kroger, Shell)';
      const amtInput   = el('input'); amtInput.className  = 'input-amount'; amtInput.type  = 'number'; amtInput.placeholder = 'Amount'; amtInput.step = '0.01'; amtInput.min = '0';
      const dateInput  = el('input'); dateInput.className = 'input-date';   dateInput.type = 'date';   dateInput.value = today;
      const acctSelect = document.createElement('select'); acctSelect.className = 'input-account';
      acctSelect.innerHTML = `<option value="">Account…</option>${accounts.map(a=>`<option value="${a}">${a}</option>`).join('')}`;
      const addBtn = el('button', 'entry-add-btn', '+ Add');

      addBtn.onclick = () => {
        const amt = parseFloat(amtInput.value);
        if (!amt || isNaN(amt)) { showToast('Enter a valid amount', 'error'); return; }
        DB.addEntry(year, month, section, idx, {
          desc: descInput.value.trim() || 'Entry',
          amount: amt,
          date: dateInput.value,
          account: acctSelect.value
        });
        DB.updateSummary(year, month);
        renderEntries();
        // Update totals in the row
        const fresh = DB.getMonth(year, month)?.[section]?.[idx];
        c2.textContent = fmt(fresh?.actual || fresh?.payment || fresh?.contribution || 0);
        descInput.value = ''; amtInput.value = '';
        showToast(`Entry added!`);
      };

      // Submit on Enter in amount field
      amtInput.addEventListener('keydown', e => { if (e.key === 'Enter') addBtn.click(); });

      form.appendChild(descInput);
      form.appendChild(amtInput);
      form.appendChild(dateInput);
      form.appendChild(acctSelect);
      form.appendChild(addBtn);
      panel.appendChild(form);
    }

    renderEntries();

    expandBtn.onclick = (e) => {
      e.stopPropagation();
      const nowOpen = panel.classList.toggle('open');
      expandBtn.classList.toggle('open', nowOpen);
    };

    li.appendChild(panel);
    return li;
  }

  // ===== YEARLY OVERVIEW =====
  function yearly(year) {
    const yearMonths = DB.getYearMonths(year);
    const totals = DB.get().data[year]?.annualTotals;

    const div = el('div');

    if (totals) {
      const card = el('div', 'stats-grid mb-24');
      const tIncome = totals.income?.actual || 0;
      const tExp = totals.totalExpenses?.actual || 0;
      const tNet = totals.netIncome?.actual || 0;
      card.innerHTML = `
        <div class="stat-card income"><div class="stat-icon">💚</div><div class="stat-label">Yearly Income</div><div class="stat-value positive">${fmt(tIncome)}</div><div class="stat-sub">Budget: ${fmt(totals.income?.estimated||0)}</div></div>
        <div class="stat-card expenses"><div class="stat-icon">🔴</div><div class="stat-label">Yearly Expenses</div><div class="stat-value negative">${fmt(tExp)}</div><div class="stat-sub">Budget: ${fmt(totals.totalExpenses?.estimated||0)}</div></div>
        <div class="stat-card net"><div class="stat-icon">✦</div><div class="stat-label">Yearly Net</div><div class="stat-value ${tNet>=0?'positive':'negative'}">${fmt(tNet)}</div></div>
        <div class="stat-card savings"><div class="stat-icon">📊</div><div class="stat-label">Fixed Expenses</div><div class="stat-value" style="color:var(--primary)">${fmt(totals.fixedExpenses?.actual||0)}</div></div>`;
      div.appendChild(card);
    }

    // Monthly grid
    const grid = el('div', 'yearly-grid');
    yearMonths.forEach(m => {
      const s = m.data?.summary;
      const hasData = s && (s.totalIncome > 0 || s.totalExpenses > 0);
      const card = el('div', `year-month-card${hasData ? '' : ' ym-empty'}`);
      card.innerHTML = `
        <div class="ym-name">${m.name}</div>
        ${hasData ? `
          <div class="ym-income">${fmt(s.totalIncome)}</div>
          <div class="ym-expense">${fmt(s.totalExpenses)}</div>
          <div class="ym-net ${(s.netCashFlow||0)>=0?'pos':'neg'}">${fmt(s.netCashFlow||0)} net</div>
        ` : '<div class="ym-income text-muted">No data</div>'}`;
      card.onclick = () => App.navigate('monthly', year, m.name);
      grid.appendChild(card);
    });
    div.appendChild(grid);

    // Big bar chart
    const chartCard = el('div', 'chart-card');
    chartCard.innerHTML = `<div class="chart-header"><span class="chart-title">📊 ${year} Monthly Summary</span></div><div class="chart-wrap" style="height:280px"><canvas id="chart-yearly-bar"></canvas></div>`;
    div.appendChild(chartCard);

    setTimeout(() => Charts.incomeVsExpenses('chart-yearly-bar', yearMonths), 50);

    return div;
  }

  // ===== GOALS =====
  function goals(year, month) {
    const monthData = DB.getMonth(year, month);
    const savingsItems = monthData?.savings || [];

    const div = el('div');

    if (!savingsItems.length) {
      div.innerHTML = `<div class="empty-state"><div class="empty-icon">🎯</div><div class="empty-title">No savings goals yet</div><div class="empty-desc">Add goals in the Monthly Detail view.</div></div>`;
      return div;
    }

    const grid = el('div', 'goals-grid');
    savingsItems.forEach(item => {
      const p = item.target > 0 ? Math.min(100, Math.round(((item.currentBalance||0)/item.target)*100)) : 0;
      const remaining = (item.target||0) - (item.currentBalance||0);
      const moToGo = item.contribution > 0 && remaining > 0 ? Math.ceil(remaining / item.contribution) : null;

      const card = el('div', 'goal-card');
      card.innerHTML = `
        <div class="goal-header">
          <div><div class="goal-name">${item.goal}</div><div class="goal-account">${item.account}</div></div>
          <span class="goal-pct">${p}%</span>
        </div>
        <div class="goal-amounts">
          <div><div class="goal-current">${fmt(item.currentBalance||0)}</div><div class="text-muted" style="font-size:0.7rem">saved</div></div>
          <div class="goal-target"><div style="font-size:0.75rem;color:var(--text3)">of ${fmt(item.target||0)}</div><div style="font-size:0.75rem;color:var(--text3)">${fmt(remaining)} left</div></div>
        </div>
        <div class="goal-progress"><div class="goal-fill" style="width:${p}%"></div></div>
        <div class="goal-footer">
          <span>Monthly: ${fmt(item.contribution||0)}</span>
          ${moToGo ? `<span>${moToGo} months to go</span>` : '<span>Goal reached! 🎉</span>'}
        </div>`;
      grid.appendChild(card);
    });

    // Total savings summary
    const totalSaved = savingsItems.reduce((s, i) => s + (i.currentBalance||0), 0);
    const totalTarget = savingsItems.reduce((s, i) => s + (i.target||0), 0);
    const totalMonthly = savingsItems.reduce((s, i) => s + (i.contribution||0), 0);

    const summary = el('div', 'summary-card mt-24');
    summary.innerHTML = `
      <div class="summary-grid">
        <div class="summary-item"><div class="summary-label">Total Saved</div><div class="summary-value font-mono text-success">${fmt(totalSaved)}</div></div>
        <div class="summary-item"><div class="summary-label">Total Goals</div><div class="summary-value font-mono text-primary">${fmt(totalTarget)}</div></div>
        <div class="summary-item"><div class="summary-label">Monthly Contributions</div><div class="summary-value font-mono text-gold">${fmt(totalMonthly)}</div></div>
      </div>`;

    div.appendChild(grid);
    div.appendChild(summary);

    // Dave Ramsey callout if relevant
    const callout = el('div', 'section-card mt-24');
    callout.innerHTML = `
      <div class="section-header open" style="cursor:default">
        <div class="section-title-row"><span class="section-dot savings"></span><span class="section-title">💡 Dave Ramsey — 7 Baby Steps</span></div>
      </div>
      <div class="section-body open">
        <ul class="line-items">
          ${[['$1,000 Emergency Fund','chip-success'],['Pay off all debt (Debt Snowball)','chip-warning'],['3-6 months expenses in full emergency fund','chip-warning'],['Invest 15% of income for retirement','chip-primary'],["Save for children's future",'chip-primary'],['Pay off home early','chip-primary'],['Build wealth & give','chip-primary']].map((s,i) => `<li class="line-item" style="grid-template-columns:2rem 1fr auto"><span class="fw-700 text-muted">${i+1}</span><div class="li-name">${s[0]}</div><span class="chip ${s[1]}">${i < 1 ? 'In Progress' : i < 2 ? 'Active' : 'Future'}</span></li>`).join('')}
        </ul>
      </div>`;
    div.appendChild(callout);

    return div;
  }

  // ===== DEBT TRACKER =====
  function debt(year, month) {
    const monthData = DB.getMonth(year, month);
    const debtItems = monthData?.debt || [];
    const div = el('div');

    if (!debtItems.length) {
      div.innerHTML = `<div class="empty-state"><div class="empty-icon">⚡</div><div class="empty-title">No debt recorded</div><div class="empty-desc">Add debts in the Monthly Detail view.</div></div>`;
      return div;
    }

    const totalBalance = debtItems.reduce((s, i) => s + (i.balance||0), 0);
    const totalPayment = debtItems.reduce((s, i) => s + (i.payment||0), 0);

    const summary = el('div', 'stats-grid mb-24');
    summary.innerHTML = `
      <div class="stat-card expenses"><div class="stat-icon">💳</div><div class="stat-label">Total Debt Balance</div><div class="stat-value negative">${fmt(totalBalance)}</div></div>
      <div class="stat-card"><div class="stat-icon">📅</div><div class="stat-label">Monthly Payments</div><div class="stat-value" style="color:var(--warning)">${fmt(totalPayment)}</div></div>
      <div class="stat-card net"><div class="stat-icon">📆</div><div class="stat-label">Payoff Est. (avg)</div><div class="stat-value text-primary">${totalPayment > 0 ? Math.ceil(totalBalance/totalPayment) + ' mo' : '—'}</div></div>
      <div class="stat-card income"><div class="stat-icon">🏆</div><div class="stat-label">Debts Tracked</div><div class="stat-value positive">${debtItems.length}</div></div>`;
    div.appendChild(summary);

    const grid = el('div', 'debt-grid');
    const sorted = [...debtItems].sort((a,b) => (a.balance||0) - (b.balance||0));
    sorted.forEach(item => {
      const moLeft = item.payment > 0 ? Math.ceil((item.balance||0)/item.payment) : null;
      const card = el('div', 'debt-card');
      card.innerHTML = `
        <div class="debt-top">
          <span class="debt-name">${item.category}</span>
          ${item.interestRate ? `<span class="debt-rate">${item.interestRate}% APR</span>` : ''}
        </div>
        <div class="debt-row"><span class="debt-key">Current Balance</span><span class="debt-val text-danger">${fmt(item.balance||0)}</span></div>
        <div class="debt-row"><span class="debt-key">Monthly Payment</span><span class="debt-val text-warning">${fmt(item.payment||0)}</span></div>
        ${item.account ? `<div class="debt-row"><span class="debt-key">Account</span><span class="debt-val">${item.account}</span></div>` : ''}
        ${moLeft ? `<div class="debt-row"><span class="debt-key">Est. Payoff</span><span class="debt-val text-success">${moLeft} months</span></div>` : ''}
        <div class="debt-progress"><div class="debt-fill" style="width:${Math.min(100,((item.payment||0)/(item.balance||1))*100*12)}%"></div></div>`;
      grid.appendChild(card);
    });

    // Snowball order tip
    const tip = el('div', 'section-card mt-24');
    tip.innerHTML = `
      <div class="section-header open" style="cursor:default"><div class="section-title-row"><span class="section-dot debt"></span><span class="section-title">❄ Debt Snowball Order (Smallest → Largest)</span></div></div>
      <div class="section-body open">
        <ul class="line-items">
          ${sorted.map((d,i) => `<li class="line-item" style="grid-template-columns:2rem 1fr auto auto">
            <span class="fw-700 text-muted">${i+1}</span>
            <div class="li-name">${d.category}</div>
            <span class="li-actual text-danger">${fmt(d.balance||0)}</span>
            <span class="chip ${i===0?'chip-success':'chip-primary'}">${i===0?'🎯 Focus Here':'Upcoming'}</span>
          </li>`).join('')}
        </ul>
      </div>`;

    div.append(grid, tip);
    return div;
  }

  // ===== BILLS CALENDAR =====
  function bills(year, month) {
    const monthData = DB.getMonth(year, month);
    const billList = getBillsForMonth(monthData);
    const today = new Date().getDate();

    const div = el('div');

    if (!billList.length) {
      div.innerHTML = `<div class="empty-state"><div class="empty-icon">🗓</div><div class="empty-title">No bills for ${month}</div><div class="empty-desc">Add fixed expenses in Monthly Detail.</div></div>`;
      return div;
    }

    const totalDue = billList.reduce((s, b) => s + b.amount, 0);
    const paid = billList.filter(b => b.paid).length;

    const statsBar = el('div', 'stats-grid mb-24');
    statsBar.style.gridTemplateColumns = 'repeat(3,1fr)';
    statsBar.innerHTML = `
      <div class="stat-card fixed"><div class="stat-label">Total Bills</div><div class="stat-value">${billList.length}</div></div>
      <div class="stat-card"><div class="stat-label">Paid</div><div class="stat-value positive">${paid}</div></div>
      <div class="stat-card expenses"><div class="stat-label">Total Amount</div><div class="stat-value negative">${fmt(totalDue)}</div></div>`;
    statsBar.querySelectorAll('.stat-card')[0].style.setProperty('--card-accent','var(--primary)');
    statsBar.querySelectorAll('.stat-card')[1].style.setProperty('--card-accent','var(--success)');
    div.appendChild(statsBar);

    const list = el('div', 'bills-list');
    billList.forEach(b => {
      const isToday = b.day === today;
      const isOverdue = b.day < today && !b.paid;
      const status = b.paid ? 'paid' : isOverdue ? 'overdue' : 'upcoming';
      const item = el('div', 'bill-item');
      if (isToday) item.style.border = '1px solid var(--gold)';
      item.innerHTML = `
        <div class="bill-day" style="background:${isToday ? 'var(--gold)' : ''}; color:${isToday ? '#1a0f00' : ''}">
          <span class="bill-day-num" style="color:${isToday ? '#1a0f00' : ''}">${b.day < 99 ? b.day : '?'}</span>
          <span class="bill-day-label" style="color:${isToday ? '#1a0f00' : ''}">Due</span>
        </div>
        <div class="bill-info"><div class="bill-name">${b.name}</div><div class="bill-account">${b.account}</div></div>
        <span class="bill-amount">${fmt(b.amount)}</span>
        <span class="bill-status ${status}">${status === 'paid' ? '✓ Paid' : status === 'overdue' ? '⚠ Overdue' : '⏳ Upcoming'}</span>`;
      list.appendChild(item);
    });

    div.appendChild(list);
    return div;
  }

  // ===== IMPORT =====
  function importPage() {
    const div = el('div');
    div.innerHTML = `
      <div class="section-page-header"><h2>Import Spreadsheet</h2><p>Upload your House of Yawitazah Excel budget file to sync all data.</p></div>

      <div class="import-zone" id="import-zone">
        <div class="import-icon">📊</div>
        <div class="import-title">Drop your Excel file here</div>
        <div class="import-sub">or click to browse · Supports .xlsx, .xls files</div>
        <input type="file" id="file-input" accept=".xlsx,.xls" style="display:none">
      </div>

      <div class="import-progress" id="import-progress">
        <div style="background:var(--surface);border-radius:var(--radius-sm);height:8px;margin:16px 0"><div id="progress-bar" style="height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--primary),var(--gold));width:0%;transition:width 0.3s"></div></div>
        <p id="progress-label" style="text-align:center;color:var(--text3);font-size:0.85rem">Processing…</p>
      </div>

      <div id="import-result"></div>

      <div class="section-card mt-24">
        <div class="section-header open" style="cursor:default"><div class="section-title-row"><span class="section-dot income"></span><span class="section-title">📋 How Import Works</span></div></div>
        <div class="section-body open">
          <ul class="line-items">
            ${['Your spreadsheet columns are automatically recognized','Each monthly sheet becomes a monthly budget','Income, Fixed, Variable, Debt & Savings sections are all imported','Existing data is preserved — only new months are added','Review parsed data before confirming the import'].map(t => `<li class="line-item" style="grid-template-columns:1.5rem 1fr"><span>✓</span><div class="li-name">${t}</div></li>`).join('')}
          </ul>
        </div>
      </div>`;

    setTimeout(() => {
      const zone = document.getElementById('import-zone');
      const fileInput = document.getElementById('file-input');

      zone.onclick = () => fileInput.click();
      zone.ondragover = (e) => { e.preventDefault(); zone.classList.add('drag-over'); };
      zone.ondragleave = () => zone.classList.remove('drag-over');
      zone.ondrop = (e) => { e.preventDefault(); zone.classList.remove('drag-over'); handleFile(e.dataTransfer.files[0]); };
      fileInput.onchange = (e) => handleFile(e.target.files[0]);
    }, 50);

    return div;
  }

  function handleFile(file) {
    if (!file) return;
    const progress = document.getElementById('import-progress');
    const bar = document.getElementById('progress-bar');
    const label = document.getElementById('progress-label');
    const result = document.getElementById('import-result');

    progress.style.display = 'block';
    bar.style.width = '20%';
    label.textContent = 'Reading file…';

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        bar.style.width = '50%';
        label.textContent = 'Parsing sheets…';

        const wb = XLSX.read(e.target.result, { type: 'array', cellFormula: true, cellNF: false });
        const parsed = parseWorkbook(wb);

        bar.style.width = '80%';
        label.textContent = 'Organizing data…';

        // Detect year from filename
        const yearMatch = file.name.match(/20\d\d/);
        const year = yearMatch ? yearMatch[0] : new Date().getFullYear().toString();

        bar.style.width = '100%';
        label.textContent = `Found ${Object.keys(parsed).length} months`;

        setTimeout(() => {
          showImportPreview(result, year, parsed, file.name);
          progress.style.display = 'none';
        }, 400);

      } catch (err) {
        label.textContent = 'Error: ' + err.message;
        bar.style.background = 'var(--danger)';
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function parseWorkbook(wb) {
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const result = {};

    wb.SheetNames.forEach(sheetName => {
      const found = months.find(m => sheetName.toLowerCase().includes(m.toLowerCase()));
      if (!found) return;

      const ws = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      const parsed = parseMonthSheet(rows, ws);
      if (parsed) result[found] = parsed;
    });

    return result;
  }

  // Parse a formula string like "77.21+151.59+33.16" → [77.21, 151.59, 33.16]
  // Returns [] if it's not a simple numeric addition.
  function parseAddFormula(f) {
    if (!f || typeof f !== 'string') return [];
    const clean = f.replace(/^=/, '').replace(/\s/g, '');
    if (!/^-?[\d.]+([\+\-]-?[\d.]+)+$/.test(clean)) return [];
    const parts = clean.split('+').map(v => parseFloat(v)).filter(v => !isNaN(v) && v > 0);
    return parts.length >= 2 ? parts : [];
  }

  // For a given row index and column index, build an entries[] array
  // from the formula in that cell (if it is a sum-of-numbers formula).
  function entriesFromCell(ws, rowIdx, colIdx, accountName) {
    if (!ws) return [];
    const addr = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx });
    const cell = ws[addr];
    if (!cell || !cell.f) return [];
    const parts = parseAddFormula(cell.f);
    return parts.map((amt, i) => ({
      desc: `Entry ${i + 1}`,
      amount: Math.round(amt * 100) / 100,
      date: '',
      account: accountName || ''
    }));
  }

  function parseMonthSheet(rows, ws) {
    const month = { income: [], fixedExpenses: [], variableExpenses: [], debt: [], savings: [], summary: { startingBalance:0, totalIncome:0, totalExpenses:0, debtPayments:0, savingsContributions:0, netCashFlow:0, endingBalance:0 } };

    let section = null;
    // Iterate the original rows so we know each row's real index in the sheet
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      if (!row || !row.some(c => c !== '' && c !== null && c !== undefined)) continue;

      const first = String(row[0] || '').trim().toUpperCase();

      if (first.includes('INCOME') && !first.includes('NET') && !first.includes('TOTAL')) { section = 'income'; continue; }
      if (first.includes('FIXED EXPENSE')) { section = 'fixed'; continue; }
      if (first.includes('VARIABLE EXPENSE')) { section = 'variable'; continue; }
      if (first.includes('DEBT')) { section = 'debt'; continue; }
      if (first.includes('SAVINGS')) { section = 'savings'; continue; }
      if (first.includes('SUMMARY')) { section = 'summary'; continue; }

      const isHeader = first.includes('SOURCE') || first.includes('CATEGORY') || first.includes('GOAL') || first.includes('EXPENSE CATEGORY') || first.includes('INCOME SOURCE') || first.includes('DEBT CATEGORY') || first === 'COLUMN 1';
      if (isHeader) continue;

      const name = String(row[0] || '').trim();
      if (!name || name.toUpperCase().startsWith('TOTAL')) {
        // Capture totals
        if (section === 'summary') {
          if (first.includes('STARTING BALANCE')) month.summary.startingBalance = parseNum(row[1]);
          if (first.includes('TOTAL INCOME')) month.summary.totalIncome = parseNum(row[1]);
          if (first.includes('TOTAL EXPENSE') || first.includes('TOTAL EXPENSE')) month.summary.totalExpenses = parseNum(row[1]);
          if (first.includes('DEBT') && first.includes('PAYMENT')) month.summary.debtPayments = parseNum(row[1]);
          if (first.includes('SAVINGS')) month.summary.savingsContributions = parseNum(row[1]);
          if (first.includes('NET')) month.summary.netCashFlow = parseNum(row[1]);
          if (first.includes('ENDING')) month.summary.endingBalance = parseNum(row[1]);
        }
        continue;
      }

      if (section === 'income') {
        const account = String(row[5]||row[4]||'').trim();
        month.income.push({ source: name, expected: parseNum(row[1]), actual: parseNum(row[2]), account, purpose: String(row[6]||'').trim(), entries: entriesFromCell(ws, r, 2, account) });
      } else if (section === 'fixed') {
        const account = String(row[4]||'').trim();
        month.fixedExpenses.push({ category: name, budget: parseNum(row[1]), actual: parseNum(row[2]), account, dueDate: String(row[5]||'').trim(), entries: entriesFromCell(ws, r, 2, account) });
      } else if (section === 'variable') {
        const account = String(row[4]||'').trim();
        month.variableExpenses.push({ category: name, budget: parseNum(row[1]), actual: parseNum(row[2]), account, entries: entriesFromCell(ws, r, 2, account) });
      } else if (section === 'debt') {
        const bal = parseNum(row[1]);
        if (bal > 0 || name) {
          const account = String(row[6]||row[4]||'').trim();
          month.debt.push({ category: name, balance: bal, interestRate: parseNum(row[2]) * (parseNum(row[2]) < 1 ? 100 : 1), payment: parseNum(row[3]), account, entries: entriesFromCell(ws, r, 3, account) });
        }
      } else if (section === 'savings') {
        const account = String(row[6]||row[5]||'').trim();
        month.savings.push({ goal: name, target: parseNum(row[1]), contribution: parseNum(row[2]), currentBalance: parseNum(row[3]), account, entries: entriesFromCell(ws, r, 2, account) });
      }
    }
    return month;
  }

  function parseNum(v) {
    if (v === null || v === undefined || v === '') return 0;
    if (typeof v === 'number') return Math.abs(v);
    const s = String(v).replace(/[$,\s]/g,'');
    const n = parseFloat(s);
    return isNaN(n) ? 0 : Math.abs(n);
  }

  function showImportPreview(container, year, parsed, filename) {
    const months = Object.keys(parsed);
    container.innerHTML = `
      <div class="section-card mt-16">
        <div class="section-header open" style="cursor:default">
          <div class="section-title-row"><span class="section-dot income"></span><span class="section-title">✅ Ready to Import: ${filename}</span></div>
          <span class="chip chip-success">${months.length} months found</span>
        </div>
        <div class="section-body open">
          <table class="preview-table" style="margin-bottom:16px">
            <thead><tr><th>Month</th><th>Income</th><th>Expenses</th><th>Net</th><th>Status</th></tr></thead>
            <tbody>
              ${months.map(m => {
                const s = parsed[m].summary;
                const net = (s.netCashFlow || s.totalIncome - s.totalExpenses);
                return `<tr><td>${m}</td><td class="text-success">${fmt(s.totalIncome)}</td><td class="text-danger">${fmt(s.totalExpenses)}</td><td class="${net>=0?'text-success':'text-danger'}">${fmt(net)}</td><td><span class="chip chip-primary">Ready</span></td></tr>`;
              }).join('')}
            </tbody>
          </table>
          <div style="display:flex;gap:10px">
            <button class="btn btn-gold" id="confirm-import">⬆ Import ${months.length} Months into ${year}</button>
            <button class="btn btn-ghost" id="cancel-import">Cancel</button>
          </div>
        </div>
      </div>`;

    document.getElementById('confirm-import').onclick = () => {
      months.forEach(m => DB.importFromParsed(year, m, parsed[m]));
      showToast(`✓ Imported ${months.length} months into ${year}!`);
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">✅</div><div class="empty-title">Import Complete!</div><div class="empty-desc">${months.length} months added to ${year}.</div></div>`;
      App.render();
    };
    document.getElementById('cancel-import').onclick = () => container.innerHTML = '';
  }

  // ===== ADD TRANSACTION MODAL =====
  function openAddModal(year, month, defaultSection = 'variableExpenses') {
    const modal = document.getElementById('add-modal');
    const body = document.getElementById('add-modal-body');
    modal.style.display = 'flex';

    const settings = DB.getSettings();
    const sections = { income:'income', fixedExpenses:'fixed', variableExpenses:'variable', debt:'debt', savings:'savings' };

    body.innerHTML = `
      <div class="add-form">
        <div class="form-group">
          <label class="form-label">Transaction Type</label>
          <div class="type-selector">
            ${Object.entries({ income:['💚','Income'], fixedExpenses:['🔵','Fixed'], variableExpenses:['🟡','Variable'], debt:['🔴','Debt'], savings:['🟣','Savings'] }).map(([k,[icon,label]]) => `
              <div class="type-btn${k===defaultSection?' active':''}" data-section="${k}"><span class="type-icon">${icon}</span>${label}</div>`).join('')}
          </div>
        </div>

        <div id="add-fields"><!-- rendered by section --></div>

        <div class="modal-footer" style="border:none;padding:0">
          <button class="btn btn-ghost" id="add-cancel">Cancel</button>
          <button class="btn btn-gold" id="add-save">Save Transaction</button>
        </div>
      </div>`;

    let selectedSection = defaultSection;
    renderAddFields(selectedSection, settings);

    body.querySelectorAll('.type-btn').forEach(btn => {
      btn.onclick = () => {
        body.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedSection = btn.dataset.section;
        renderAddFields(selectedSection, settings);
      };
    });

    document.getElementById('add-cancel').onclick = closeAddModal;
    document.getElementById('add-save').onclick = () => saveAddModal(year, month, selectedSection);
  }

  function renderAddFields(section, settings) {
    const fields = document.getElementById('add-fields');
    const accountOpts = settings.accounts.map(a => `<option>${a}</option>`).join('');

    if (section === 'income') {
      const cats = settings.incomeCategories.map(c => `<option>${c}</option>`).join('');
      fields.innerHTML = `
        <div class="form-row cols-2">
          <div class="form-group"><label class="form-label">Income Source</label><select class="form-select" id="f-category"><option value="">Select…</option>${cats}</select></div>
          <div class="form-group"><label class="form-label">Amount Received</label><div class="amount-input-wrap"><span class="amount-prefix">$</span><input type="number" class="form-input" id="f-actual" placeholder="0.00" step="0.01"></div></div>
        </div>
        <div class="form-row cols-2">
          <div class="form-group"><label class="form-label">Expected Amount</label><div class="amount-input-wrap"><span class="amount-prefix">$</span><input type="number" class="form-input" id="f-expected" placeholder="0.00" step="0.01"></div></div>
          <div class="form-group"><label class="form-label">Account</label><select class="form-select" id="f-account"><option value="">Select…</option>${accountOpts}</select></div>
        </div>`;
    } else if (section === 'fixedExpenses') {
      const cats = settings.fixedCategories.map(c => `<option>${c}</option>`).join('');
      fields.innerHTML = `
        <div class="form-row cols-2">
          <div class="form-group"><label class="form-label">Category</label><select class="form-select" id="f-category"><option value="">Select…</option>${cats}</select></div>
          <div class="form-group"><label class="form-label">Actual Spend</label><div class="amount-input-wrap"><span class="amount-prefix">$</span><input type="number" class="form-input" id="f-actual" placeholder="0.00" step="0.01"></div></div>
        </div>
        <div class="form-row cols-3">
          <div class="form-group"><label class="form-label">Budget</label><div class="amount-input-wrap"><span class="amount-prefix">$</span><input type="number" class="form-input" id="f-budget" placeholder="0.00" step="0.01"></div></div>
          <div class="form-group"><label class="form-label">Account</label><select class="form-select" id="f-account"><option value="">Select…</option>${accountOpts}</select></div>
          <div class="form-group"><label class="form-label">Due Date</label><input type="text" class="form-input" id="f-due" placeholder="e.g. 10th"></div>
        </div>`;
    } else if (section === 'variableExpenses') {
      const cats = settings.variableCategories.map(c => `<option>${c}</option>`).join('');
      fields.innerHTML = `
        <div class="form-row cols-2">
          <div class="form-group"><label class="form-label">Category</label><select class="form-select" id="f-category"><option value="">Select…</option>${cats}</select></div>
          <div class="form-group"><label class="form-label">Actual Spend</label><div class="amount-input-wrap"><span class="amount-prefix">$</span><input type="number" class="form-input" id="f-actual" placeholder="0.00" step="0.01"></div></div>
        </div>
        <div class="form-row cols-2">
          <div class="form-group"><label class="form-label">Budget</label><div class="amount-input-wrap"><span class="amount-prefix">$</span><input type="number" class="form-input" id="f-budget" placeholder="0.00" step="0.01"></div></div>
          <div class="form-group"><label class="form-label">Account</label><select class="form-select" id="f-account"><option value="">Select…</option>${accountOpts}</select></div>
        </div>`;
    } else if (section === 'debt') {
      const cats = settings.debtCategories.map(c => `<option>${c}</option>`).join('');
      fields.innerHTML = `
        <div class="form-row cols-2">
          <div class="form-group"><label class="form-label">Debt Name</label><select class="form-select" id="f-category"><option value="">Select…</option>${cats}</select></div>
          <div class="form-group"><label class="form-label">Current Balance</label><div class="amount-input-wrap"><span class="amount-prefix">$</span><input type="number" class="form-input" id="f-balance" placeholder="0.00" step="0.01"></div></div>
        </div>
        <div class="form-row cols-3">
          <div class="form-group"><label class="form-label">Monthly Payment</label><div class="amount-input-wrap"><span class="amount-prefix">$</span><input type="number" class="form-input" id="f-payment" placeholder="0.00" step="0.01"></div></div>
          <div class="form-group"><label class="form-label">Interest Rate %</label><input type="number" class="form-input" id="f-rate" placeholder="e.g. 6.54" step="0.01"></div>
          <div class="form-group"><label class="form-label">Account</label><select class="form-select" id="f-account"><option value="">Select…</option>${accountOpts}</select></div>
        </div>`;
    } else if (section === 'savings') {
      const cats = settings.savingsCategories.map(c => `<option>${c}</option>`).join('');
      fields.innerHTML = `
        <div class="form-row cols-2">
          <div class="form-group"><label class="form-label">Savings Goal</label><select class="form-select" id="f-category"><option value="">Select…</option>${cats}</select></div>
          <div class="form-group"><label class="form-label">Current Balance</label><div class="amount-input-wrap"><span class="amount-prefix">$</span><input type="number" class="form-input" id="f-balance" placeholder="0.00" step="0.01"></div></div>
        </div>
        <div class="form-row cols-3">
          <div class="form-group"><label class="form-label">Target Amount</label><div class="amount-input-wrap"><span class="amount-prefix">$</span><input type="number" class="form-input" id="f-target" placeholder="0.00" step="0.01"></div></div>
          <div class="form-group"><label class="form-label">Monthly Contribution</label><div class="amount-input-wrap"><span class="amount-prefix">$</span><input type="number" class="form-input" id="f-contribution" placeholder="0.00" step="0.01"></div></div>
          <div class="form-group"><label class="form-label">Account</label><select class="form-select" id="f-account"><option value="">Select…</option>${accountOpts}</select></div>
        </div>`;
    }

    // Re-bind save/cancel
    const saveBtn = document.getElementById('add-save');
    if (saveBtn) saveBtn.onclick = () => saveAddModal(App.currentYear, App.currentMonth, section);
  }

  function saveAddModal(year, month, section) {
    const val = id => document.getElementById(id);
    const num = id => parseFloat(val(id)?.value || '0') || 0;
    const str = id => val(id)?.value?.trim() || '';

    let item;
    if (section === 'income') {
      const category = str('f-category');
      if (!category) { showToast('Please select an income source', 'error'); return; }
      item = { source: category, expected: num('f-expected'), actual: num('f-actual'), account: str('f-account'), purpose: '' };
    } else if (section === 'fixedExpenses') {
      const category = str('f-category');
      if (!category) { showToast('Please select a category', 'error'); return; }
      item = { category, budget: num('f-budget'), actual: num('f-actual'), account: str('f-account'), dueDate: str('f-due') };
    } else if (section === 'variableExpenses') {
      const category = str('f-category');
      if (!category) { showToast('Please select a category', 'error'); return; }
      item = { category, budget: num('f-budget'), actual: num('f-actual'), account: str('f-account') };
    } else if (section === 'debt') {
      const category = str('f-category');
      if (!category) { showToast('Please select a debt type', 'error'); return; }
      item = { category, balance: num('f-balance'), payment: num('f-payment'), interestRate: num('f-rate'), account: str('f-account') };
    } else if (section === 'savings') {
      const goal = str('f-category');
      if (!goal) { showToast('Please select a savings goal', 'error'); return; }
      item = { goal, target: num('f-target'), contribution: num('f-contribution'), currentBalance: num('f-balance'), account: str('f-account') };
    }

    DB.addLineItem(year, month, section, item);
    DB.updateSummary(year, month);
    closeAddModal();
    showToast('✓ Transaction added!');
    App.render();
  }

  function closeAddModal() {
    document.getElementById('add-modal').style.display = 'none';
  }

  function openEditModal(year, month, section, idx, item) {
    // Reuse add modal but pre-fill
    openAddModal(year, month, section);
    setTimeout(() => {
      const v = id => document.getElementById(id);
      if (section === 'income') {
        if (v('f-category')) v('f-category').value = item.source || '';
        if (v('f-actual')) v('f-actual').value = item.actual || '';
        if (v('f-expected')) v('f-expected').value = item.expected || '';
        if (v('f-account')) v('f-account').value = item.account || '';
      } else if (section === 'fixedExpenses' || section === 'variableExpenses') {
        if (v('f-category')) v('f-category').value = item.category || '';
        if (v('f-actual')) v('f-actual').value = item.actual || '';
        if (v('f-budget')) v('f-budget').value = item.budget || '';
        if (v('f-account')) v('f-account').value = item.account || '';
        if (v('f-due')) v('f-due').value = item.dueDate || '';
      } else if (section === 'debt') {
        if (v('f-category')) v('f-category').value = item.category || '';
        if (v('f-balance')) v('f-balance').value = item.balance || '';
        if (v('f-payment')) v('f-payment').value = item.payment || '';
        if (v('f-rate')) v('f-rate').value = item.interestRate || '';
        if (v('f-account')) v('f-account').value = item.account || '';
      } else if (section === 'savings') {
        if (v('f-category')) v('f-category').value = item.goal || '';
        if (v('f-balance')) v('f-balance').value = item.currentBalance || '';
        if (v('f-target')) v('f-target').value = item.target || '';
        if (v('f-contribution')) v('f-contribution').value = item.contribution || '';
        if (v('f-account')) v('f-account').value = item.account || '';
      }

      // Override save to update instead of add
      document.getElementById('add-save').onclick = () => {
        const num = id => parseFloat(document.getElementById(id)?.value || '0') || 0;
        const str = id => document.getElementById(id)?.value?.trim() || '';
        let updates;
        if (section === 'income') updates = { source: str('f-category'), expected: num('f-expected'), actual: num('f-actual'), account: str('f-account') };
        else if (section === 'fixedExpenses') updates = { category: str('f-category'), budget: num('f-budget'), actual: num('f-actual'), account: str('f-account'), dueDate: str('f-due') };
        else if (section === 'variableExpenses') updates = { category: str('f-category'), budget: num('f-budget'), actual: num('f-actual'), account: str('f-account') };
        else if (section === 'debt') updates = { category: str('f-category'), balance: num('f-balance'), payment: num('f-payment'), interestRate: num('f-rate'), account: str('f-account') };
        else if (section === 'savings') updates = { goal: str('f-category'), target: num('f-target'), contribution: num('f-contribution'), currentBalance: num('f-balance'), account: str('f-account') };
        DB.updateLineItem(year, month, section, idx, updates);
        DB.updateSummary(year, month);
        closeAddModal();
        showToast('✓ Updated!');
        App.render();
      };
    }, 100);
  }

  // ===== SETTINGS =====
  function settings() {
    const s = DB.getSettings();
    if (!s.users) s.users = [
      { id: 'person1', name: '', role: 'Primary', color: '#7c6ef8', pinHash: '' },
      { id: 'person2', name: '', role: 'Partner', color: '#f4b942', pinHash: '' }
    ];
    if (!s.aiProvider) s.aiProvider = 'claude';

    const u0 = s.users[0] || {};
    const u1 = s.users[1] || {};

    function profileCard(u, idx) {
      const initial = u.name ? u.name[0].toUpperCase() : '?';
      const hasPassword = !!u.passwordHash;
      return `
        <div class="profile-card">
          <div class="profile-header">
            <div class="profile-avatar" style="background:${u.color}22;color:${u.color};border:2px solid ${u.color}">${initial}</div>
            <div>
              <div class="profile-name-display">${u.name || 'Person ' + (idx+1)}</div>
              <div class="profile-role-display">${u.role || ''}</div>
              <div style="font-size:0.7rem;margin-top:2px;color:${hasPassword ? 'var(--success)' : 'var(--warning)'}">
                ${hasPassword ? '🔒 Password set' : '⚠ No password — set one below'}
              </div>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <input type="text" class="form-input" id="s-u${idx}-name" placeholder="Full name" value="${u.name||''}" style="width:100%">
            <input type="text" class="form-input" id="s-u${idx}-role" placeholder="Role (e.g. Husband, Wife)" value="${u.role||''}" style="width:100%">
            <div style="display:flex;align-items:center;gap:8px">
              <label style="font-size:0.8rem;color:var(--text3)">Color</label>
              <input type="color" id="s-u${idx}-color" value="${u.color||'#7c6ef8'}" style="width:40px;height:32px;border:none;background:none;cursor:pointer;padding:0">
            </div>
            <div style="border-top:1px solid var(--border);padding-top:10px;margin-top:2px;display:flex;flex-direction:column;gap:8px">
              <div style="font-size:0.78rem;font-weight:600;color:var(--text2)">Login Credentials</div>
              <input type="text" class="form-input" id="s-u${idx}-username" placeholder="Username (used to sign in)" value="${u.username||''}" autocomplete="off" style="width:100%">
              <input type="password" class="form-input" id="s-u${idx}-password" placeholder="${hasPassword ? 'New password (leave blank to keep)' : 'Set a password'}" autocomplete="new-password" style="width:100%">
              <button class="btn btn-primary btn-sm" id="s-u${idx}-cred-save" style="align-self:flex-start">Save Credentials</button>
            </div>
          </div>
        </div>`;
    }

    const div = el('div');
    div.innerHTML = `
      <div class="settings-section">
        <div class="settings-title">Household</div>
        <div class="settings-row">
          <div><div class="settings-key">Household Name</div><div class="settings-desc">Shown throughout the app and in the sidebar</div></div>
          <input type="text" class="form-input" id="s-name" value="${s.householdName}" style="width:240px">
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-title">Member Profiles</div>
        <div class="profiles-grid">
          ${profileCard(u0, 0)}
          ${profileCard(u1, 1)}
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-title">Bank Accounts</div>
        <div class="accounts-list" id="accounts-list">
          ${s.accounts.map((a, i) => `<span class="account-tag">${a}<button data-idx="${i}" title="Remove">✕</button></span>`).join('')}
        </div>
        <div style="display:flex;gap:8px;margin-top:8px">
          <input type="text" class="form-input" id="s-new-account" placeholder="Add account (e.g. Chase Checking)" style="flex:1">
          <button class="btn btn-primary" id="s-add-account">Add</button>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-title">Connected Banks (Plaid)</div>
        <div class="settings-desc" style="margin-bottom:12px">
          Link your bank accounts to auto-import transactions as itemized entries.
          Plaid handles authentication securely — Tally never sees your bank password.
        </div>
        <div id="plaid-items-list" class="plaid-items-list"></div>
        <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
          <button class="btn btn-primary" id="plaid-connect-btn">🏦 Connect a Bank</button>
          <button class="btn btn-ghost" id="plaid-sync-btn">↻ Sync Transactions</button>
          <button class="btn btn-ghost" id="plaid-insights-btn">📊 Refresh Insights</button>
        </div>
        <div id="plaid-sync-status" style="margin-top:10px;font-size:0.85rem;color:var(--text3)"></div>
      </div>

      <div class="settings-section" id="plaid-insights-wrap" style="display:none">
        <div class="settings-title">💰 Cash Snapshot</div>
        <div id="plaid-balances" class="plaid-balances"></div>
      </div>

      <div class="settings-section" id="plaid-recurring-wrap" style="display:none">
        <div class="settings-title">🔁 Recurring Charges Detected</div>
        <div class="settings-desc" style="margin-bottom:12px">
          Plaid automatically detects subscriptions and recurring bills. We've cross-referenced them
          with your existing budget — anything in <span style="color:var(--warning)">"Missing from your budget"</span> is
          a real recurring charge you may have forgotten to add.
        </div>
        <div class="plaid-recurring-section">
          <h4 class="plaid-section-h success">✓ Matched to your budget</h4>
          <div id="plaid-recurring-matched" class="plaid-recurring-list"></div>
        </div>
        <div class="plaid-recurring-section" style="margin-top:18px">
          <h4 class="plaid-section-h warning">⚠ Missing from your budget</h4>
          <div id="plaid-recurring-missing" class="plaid-recurring-list"></div>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-title">AI Advisor</div>
        <div class="settings-row" style="flex-direction:column;align-items:flex-start;gap:12px">
          <div><div class="settings-key">AI Provider</div><div class="settings-desc">Choose which AI powers your financial advisor — both work great, ChatGPT costs less per message</div></div>
          <div class="provider-tabs">
            <button class="provider-tab ${s.aiProvider !== 'openai' ? 'active' : ''}" id="tab-claude">✦ Claude (Anthropic)</button>
            <button class="provider-tab openai ${s.aiProvider === 'openai' ? 'active' : ''}" id="tab-openai">⚡ ChatGPT (OpenAI)</button>
          </div>
        </div>
        <div class="settings-row" style="flex-direction:column;align-items:flex-start;gap:8px">
          <div><div class="settings-key">Anthropic API Key</div><div class="settings-desc">console.anthropic.com → API Keys</div></div>
          <div style="display:flex;gap:8px;width:100%">
            <input type="password" class="form-input" id="s-claude-key" placeholder="sk-ant-api03-…" value="${s.aiApiKey||''}" style="flex:1;font-family:monospace;font-size:0.82rem">
            <button class="btn btn-ghost" data-toggle="s-claude-key">Show</button>
          </div>
        </div>
        <div class="settings-row" style="flex-direction:column;align-items:flex-start;gap:8px">
          <div><div class="settings-key">OpenAI API Key</div><div class="settings-desc">platform.openai.com → API Keys (uses gpt-4o-mini — very affordable)</div></div>
          <div style="display:flex;gap:8px;width:100%">
            <input type="password" class="form-input" id="s-openai-key" placeholder="sk-proj-…" value="${s.openaiApiKey||''}" style="flex:1;font-family:monospace;font-size:0.82rem">
            <button class="btn btn-ghost" data-toggle="s-openai-key">Show</button>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-title">Data Management</div>
        <div class="settings-row">
          <div><div class="settings-key">Export Data</div><div class="settings-desc">Download all your budget data as a JSON backup</div></div>
          <button class="btn btn-ghost" id="s-export">Export</button>
        </div>
        <div class="settings-row">
          <div><div class="settings-key">Reset All Data</div><div class="settings-desc">Restore to original imported spreadsheet data — cannot be undone</div></div>
          <button class="btn btn-danger" id="s-reset">Reset</button>
        </div>
      </div>

      <div style="display:flex;gap:10px;margin-top:8px">
        <button class="btn btn-primary" id="s-save" style="min-width:160px">Save Settings</button>
      </div>`;

    setTimeout(() => {
      // Provider tabs
      document.getElementById('tab-claude').onclick = (e) => {
        document.getElementById('tab-claude').classList.add('active');
        document.getElementById('tab-openai').classList.remove('active');
        document.getElementById('tab-openai').classList.remove('active');
      };
      document.getElementById('tab-openai').onclick = () => {
        document.getElementById('tab-openai').classList.add('active');
        document.getElementById('tab-claude').classList.remove('active');
      };

      // Show/hide key toggles
      div.querySelectorAll('button[data-toggle]').forEach(btn => {
        btn.onclick = () => {
          const input = document.getElementById(btn.dataset.toggle);
          const showing = input.type === 'text';
          input.type = showing ? 'password' : 'text';
          btn.textContent = showing ? 'Show' : 'Hide';
        };
      });

      // Credential save for each user
      async function syncUserLogin(user, password = '') {
        if (!user?.username) return true;
        const res = await fetch('/api/set-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            username: user.username,
            password,
            name: user.name,
            role: user.role,
            color: user.color
          })
        });
        return res.ok;
      }

      [0, 1].forEach(idx => {
        const credBtn = document.getElementById(`s-u${idx}-cred-save`);
        if (!credBtn) return;
        credBtn.onclick = async () => {
          const username = document.getElementById(`s-u${idx}-username`).value.trim();
          const password = document.getElementById(`s-u${idx}-password`).value;
          if (!username) { showToast('Username is required', 'error'); return; }
          // Update username in local settings
          const cfg = DB.getSettings();
          if (cfg.users[idx]) cfg.users[idx].username = username;
          DB.save();
          if (!(await syncUserLogin(cfg.users[idx], password))) { showToast('Failed to save login', 'error'); return; }
          showToast('Credentials saved!');
          App.render();
        };
      });

      // Account removal
      document.getElementById('accounts-list').addEventListener('click', e => {
        const btn = e.target.closest('button[data-idx]');
        if (!btn) return;
        DB.getSettings().accounts.splice(parseInt(btn.dataset.idx), 1);
        DB.save(); App.render();
      });

      document.getElementById('s-add-account').onclick = () => {
        const val = document.getElementById('s-new-account').value.trim();
        if (val && !DB.getSettings().accounts.includes(val)) {
          DB.getSettings().accounts.push(val);
          DB.save(); showToast('Account added!'); App.render();
        }
      };

      document.getElementById('s-export').onclick = () => {
        const blob = new Blob([JSON.stringify(DB.get(), null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = 'tally-ai-backup.json'; a.click();
      };

      document.getElementById('s-reset').onclick = () => {
        if (confirm('Reset ALL data to original spreadsheet import? This cannot be undone.')) location.reload();
      };

      document.getElementById('s-save').onclick = async () => {
        const cfg = DB.getSettings();
        cfg.householdName = document.getElementById('s-name').value.trim() || cfg.householdName;
        [0, 1].forEach(idx => {
          if (!cfg.users[idx]) return;
          cfg.users[idx].name     = document.getElementById(`s-u${idx}-name`).value.trim();
          cfg.users[idx].role     = document.getElementById(`s-u${idx}-role`).value.trim();
          cfg.users[idx].color    = document.getElementById(`s-u${idx}-color`).value;
          cfg.users[idx].username = document.getElementById(`s-u${idx}-username`).value.trim();
        });
        cfg.aiProvider   = document.getElementById('tab-openai').classList.contains('active') ? 'openai' : 'claude';
        cfg.aiApiKey     = document.getElementById('s-claude-key').value.trim();
        cfg.openaiApiKey = document.getElementById('s-openai-key').value.trim();
        const hhEl = document.getElementById('household-name');
        if (hhEl) hhEl.textContent = cfg.householdName;
        DB.save();
        for (const user of cfg.users) {
          if (user.username && !(await syncUserLogin(user))) {
            showToast(`Could not sync login for ${user.username}`, 'error');
            return;
          }
        }
        showToast('Settings saved!');
      };

      // ── Plaid integration ──
      const plaidListEl   = document.getElementById('plaid-items-list');
      const plaidSyncEl   = document.getElementById('plaid-sync-status');
      const plaidConnect  = document.getElementById('plaid-connect-btn');
      const plaidSync     = document.getElementById('plaid-sync-btn');

      async function refreshPlaidItems() {
        try {
          const res = await fetch('/api/plaid/items');
          const { items } = await res.json();
          if (!items || items.length === 0) {
            plaidListEl.innerHTML = '<div style="color:var(--text3);font-size:0.85rem;padding:8px 0">No banks connected yet.</div>';
            return;
          }
          const accountOptions = (DB.getSettings().accounts || []).map(a => `<option value="${a}">${a}</option>`).join('');
          plaidListEl.innerHTML = items.map(it => `
            <div class="plaid-item">
              <div class="plaid-item-head">
                <div>
                  <div class="plaid-item-name">${it.institutionName}</div>
                  <div class="plaid-item-meta">${it.accounts?.length || 0} accounts · last sync: ${it.lastSync ? new Date(it.lastSync).toLocaleString() : 'never'}</div>
                </div>
                <button class="btn btn-ghost plaid-remove" data-id="${it.id}" title="Disconnect">✕</button>
              </div>
              <div class="plaid-accounts">
                ${(it.accounts || []).map(a => `
                  <div class="plaid-account">
                    <div class="plaid-account-info">
                      <span class="plaid-account-name">${a.name} ····${a.mask || ''}</span>
                      <span class="plaid-account-type">${a.subtype || a.type}</span>
                    </div>
                    <select class="form-select plaid-account-map" data-item="${it.id}" data-account="${a.id}">
                      <option value="">Map to account…</option>
                      ${accountOptions.replace(/value="([^"]+)"/g, (m, v) => v === a.appAccount ? `value="${v}" selected` : m)}
                    </select>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('');

          plaidListEl.querySelectorAll('.plaid-remove').forEach(b => {
            b.onclick = async () => {
              if (!confirm(`Disconnect ${b.closest('.plaid-item').querySelector('.plaid-item-name').textContent}? This won't delete entries already synced.`)) return;
              await fetch('/api/plaid/item/' + b.dataset.id, { method: 'DELETE' });
              showToast('Bank disconnected.');
              await DB.init();
              refreshPlaidItems();
            };
          });

          plaidListEl.querySelectorAll('.plaid-account-map').forEach(sel => {
            sel.onchange = async () => {
              await fetch('/api/plaid/item/' + sel.dataset.item + '/account-map', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accountId: sel.dataset.account, appAccount: sel.value })
              });
              showToast('Account mapping saved.');
            };
          });
        } catch (e) {
          plaidListEl.innerHTML = `<div style="color:var(--danger);font-size:0.85rem">Could not load banks: ${e.message}</div>`;
        }
      }
      refreshPlaidItems();

      if (plaidConnect) plaidConnect.onclick = async () => {
        plaidConnect.disabled = true;
        plaidConnect.textContent = 'Loading…';
        try {
          const r = await fetch('/api/plaid/link-token', { method: 'POST' });
          const { link_token, error } = await r.json();
          if (error) throw new Error(error);
          if (!window.Plaid) throw new Error('Plaid Link script did not load.');
          const handler = window.Plaid.create({
            token: link_token,
            onSuccess: async (public_token, metadata) => {
              const exch = await fetch('/api/plaid/exchange', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ public_token, metadata })
              });
              const out = await exch.json();
              if (out.error) { showToast('Connect failed: ' + out.error, 'error'); return; }
              showToast(`✓ ${metadata.institution.name} connected — ${out.accounts.length} accounts.`);
              // Refresh the in-memory data so subsequent settings saves include the new Plaid item
              await DB.init();
              refreshPlaidItems();
            },
            onExit: (err) => {
              if (err) showToast('Plaid Link exited: ' + (err.error_message || err.error_code || 'cancelled'));
            }
          });
          handler.open();
        } catch (e) {
          showToast('Plaid error: ' + e.message, 'error');
        } finally {
          plaidConnect.disabled = false;
          plaidConnect.textContent = '🏦 Connect a Bank';
        }
      };

      const plaidInsights = document.getElementById('plaid-insights-btn');
      const balancesEl    = document.getElementById('plaid-balances');
      const recMatchedEl  = document.getElementById('plaid-recurring-matched');
      const recMissingEl  = document.getElementById('plaid-recurring-missing');
      const insightsWrap  = document.getElementById('plaid-insights-wrap');
      const recurringWrap = document.getElementById('plaid-recurring-wrap');

      function fmtMoney(n) { return '$' + (Math.round((n||0)*100)/100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

      async function refreshInsights() {
        if (!plaidInsights) return;
        plaidInsights.disabled = true;
        const orig = plaidInsights.textContent;
        plaidInsights.textContent = 'Loading…';
        try {
          // ── Balances
          const bRes = await fetch('/api/plaid/balances');
          const bData = await bRes.json();
          if (bData.error) {
            insightsWrap.style.display = 'block';
            balancesEl.innerHTML = `<div style="color:var(--danger)">Error: ${bData.error}</div>`;
          } else if (bData.accounts && bData.accounts.length) {
            insightsWrap.style.display = 'block';
            const cashCard = `
              <div class="plaid-balance-headline">
                <div class="plaid-balance-num positive">${fmtMoney(bData.cashOnHand)}</div>
                <div class="plaid-balance-label">Cash on hand (checking + savings)</div>
              </div>`;
            const creditCard = bData.creditOwed > 0 ? `
              <div class="plaid-balance-headline">
                <div class="plaid-balance-num negative">${fmtMoney(bData.creditOwed)}</div>
                <div class="plaid-balance-label">Credit balance owed${bData.creditLimit ? ` of ${fmtMoney(bData.creditLimit)} limit` : ''}</div>
              </div>` : '';
            const accList = bData.accounts.map(a => {
              const bal = a.balance || {};
              const main = a.type === 'credit' ? (bal.current || 0) : (bal.available != null ? bal.available : (bal.current || 0));
              const sign = a.type === 'credit' ? 'negative' : (main >= 0 ? 'positive' : 'negative');
              return `
                <div class="plaid-balance-row">
                  <div class="plaid-balance-info">
                    <div class="plaid-balance-name">${a.name} ····${a.mask || ''}</div>
                    <div class="plaid-balance-sub">${a.institutionName} · ${a.subtype || a.type}</div>
                  </div>
                  <div class="plaid-balance-amt ${sign}">${fmtMoney(main)}</div>
                </div>`;
            }).join('');
            balancesEl.innerHTML = `${cashCard}${creditCard}<div class="plaid-balance-list">${accList}</div>`;
          } else {
            insightsWrap.style.display = 'block';
            balancesEl.innerHTML = '<div style="color:var(--text3)">No connected accounts.</div>';
          }

          // ── Recurring
          const rRes = await fetch('/api/plaid/recurring');
          const rData = await rRes.json();
          if (rData.error) {
            recurringWrap.style.display = 'block';
            recMatchedEl.innerHTML = '';
            recMissingEl.innerHTML = `<div style="color:var(--danger)">Error: ${rData.error}</div>`;
          } else if ((rData.matched && rData.matched.length) || (rData.missing && rData.missing.length)) {
            recurringWrap.style.display = 'block';
            const renderStream = (s, isMissing) => {
              const freqLabel = (s.freq || 'unknown').toLowerCase().replace('_', ' ');
              return `
                <div class="plaid-stream ${isMissing ? 'missing' : 'matched'}">
                  <div class="plaid-stream-info">
                    <div class="plaid-stream-name">${s.merchantName}</div>
                    <div class="plaid-stream-meta">${freqLabel} · last seen ${s.lastDate || '—'} · ${s.account || s.institution}</div>
                    ${s.matchedTo ? `<div class="plaid-stream-match">→ matches "${s.matchedTo.name}" in your budget (${fmtMoney(s.matchedTo.amount)})</div>` : ''}
                  </div>
                  <div class="plaid-stream-amt">${fmtMoney(s.amount)}</div>
                </div>`;
            };
            recMatchedEl.innerHTML = (rData.matched || []).length
              ? rData.matched.map(s => renderStream(s, false)).join('')
              : '<div style="color:var(--text3);font-size:0.85rem">Nothing matched yet — sync your transactions first if you just connected.</div>';
            recMissingEl.innerHTML = (rData.missing || []).length
              ? rData.missing.map(s => renderStream(s, true)).join('')
              : '<div style="color:var(--success);font-size:0.85rem">✓ Every detected subscription is already in your budget.</div>';
          }
        } catch (e) {
          showToast('Insights error: ' + e.message, 'error');
        } finally {
          plaidInsights.disabled = false;
          plaidInsights.textContent = orig;
        }
      }
      if (plaidInsights) plaidInsights.onclick = refreshInsights;
      // Auto-load insights when settings page opens, if any banks are connected
      setTimeout(async () => {
        const r = await fetch('/api/plaid/items');
        const d = await r.json();
        if (d.items && d.items.length) refreshInsights();
      }, 200);

      if (plaidSync) plaidSync.onclick = async () => {
        plaidSync.disabled = true;
        plaidSyncEl.textContent = 'Syncing transactions from all linked banks…';
        try {
          const r = await fetch('/api/plaid/sync', { method: 'POST' });
          const out = await r.json();
          if (out.error) {
            plaidSyncEl.innerHTML = `<span style="color:var(--danger)">Sync failed: ${out.error}</span>`;
          } else {
            plaidSyncEl.innerHTML = `✓ Added <b>${out.added}</b> new transactions across ${out.items.length} bank(s).`;
            await DB.init(); // reload data
            showToast(`✓ Synced ${out.added} transactions!`);
            refreshPlaidItems();
          }
        } catch (e) {
          plaidSyncEl.innerHTML = `<span style="color:var(--danger)">Network error: ${e.message}</span>`;
        } finally {
          plaidSync.disabled = false;
        }
      };
    }, 50);

    return div;
  }

  // ===== AI ADVISOR =====
  function advisor() {
    const s = DB.getSettings();
    const provider = s.aiProvider || 'claude';
    const apiKey = provider === 'openai' ? s.openaiApiKey : s.aiApiKey;
    const hasKey = !!apiKey;
    const chatHistory = [];

    const div = el('div');
    div.innerHTML = `
      <div class="advisor-wrap">
        <div class="advisor-header">
          <div class="advisor-avatar">✦</div>
          <div class="advisor-info">
            <div class="advisor-name">Tally &mdash; AI Financial Advisor</div>
            <div class="${hasKey ? 'advisor-status' : 'advisor-no-key'}">${hasKey ? `● Online &mdash; Powered by ${provider === 'openai' ? 'ChatGPT (OpenAI)' : 'Claude (Anthropic)'}` : '⚠ No API key set &mdash; go to Settings to connect Claude or ChatGPT'}</div>
          </div>
        </div>

        ${!hasKey ? `
        <div class="advisor-setup">
          <div style="font-size:3rem">✦</div>
          <h3>Connect Tally</h3>
          <p>Tally analyzes your real budget data and gives personalized financial guidance. Works with <strong>Claude (Anthropic)</strong> or <strong>ChatGPT (OpenAI)</strong> — add either API key in Settings to get started.</p>
          <div class="api-key-input-row">
            <input type="password" class="form-input" id="inline-api-key" placeholder="sk-ant-api03-…" style="flex:1">
            <button class="btn btn-primary" id="inline-save-key">Connect</button>
          </div>
          <p style="font-size:0.75rem">Get a free key at <strong>console.anthropic.com</strong> — your key is stored locally only.</p>
        </div>
        ` : `
        <div class="chat-messages" id="chat-messages">
          <div class="chat-msg assistant">
            <div class="chat-msg-avatar">✦</div>
            <div class="chat-bubble">Hey! I'm Tally, your personal AI financial advisor. I have full access to your budget data for ${App.currentMonth} ${App.currentYear}. What would you like to work through today? I can help you build a spending plan, identify savings opportunities, prioritize debt payoff, or just talk through any financial decision.</div>
          </div>
        </div>
        <div class="chat-suggestions" id="chat-suggestions">
          <button class="chat-suggestion">Where is most of my money going?</button>
          <button class="chat-suggestion">How can I increase my savings?</button>
          <button class="chat-suggestion">What debt should I pay off first?</button>
          <button class="chat-suggestion">Am I on track this month?</button>
          <button class="chat-suggestion">Give me a 3-month plan</button>
        </div>
        <div class="chat-dictate-bar" id="chat-dictate-bar" style="display:none">
          <span class="dictate-pulse"></span><span id="dictate-status-text">Listening…</span>
          <span class="dictate-interim" id="dictate-interim"></span>
        </div>
        <div class="chat-input-row">
          <button class="chat-mic" id="chat-mic" title="Dictate">🎤</button>
          <textarea class="chat-input" id="chat-input" placeholder="Ask Tally anything about your finances…" rows="1"></textarea>
          <button class="chat-send" id="chat-send">➤</button>
        </div>
        `}
      </div>`;

    setTimeout(() => {
      if (!hasKey) {
        const inlineBtn = document.getElementById('inline-save-key');
        if (inlineBtn) {
          inlineBtn.onclick = () => {
            const key = document.getElementById('inline-api-key').value.trim();
            if (!key) return;
            DB.getSettings().aiApiKey = key;
            DB.save();
            showToast('API key saved! Loading advisor…');
            App.render();
          };
        }
        return;
      }

      const messagesEl = document.getElementById('chat-messages');
      const inputEl = document.getElementById('chat-input');
      const sendBtn = document.getElementById('chat-send');
      const suggestionsEl = document.getElementById('chat-suggestions');

      function buildContext() {
        const year = App.currentYear;
        const month = App.currentMonth;
        const m = DB.getMonth(year, month);
        const s2 = m?.summary || {};
        const yearData = DB.get().data[year];

        const topExpenses = (m?.variableExpenses || [])
          .sort((a,b) => (b.actual||0)-(a.actual||0)).slice(0,5)
          .map(e => `  - ${e.category}: $${(e.actual||0).toFixed(2)}`).join('\n');

        const debts = (m?.debt || [])
          .map(d => `  - ${d.creditor||d.category}: balance $${(d.balance||0).toFixed(2)}, payment $${(d.payment||0).toFixed(2)}`).join('\n');

        const goals = (m?.savings || [])
          .map(g => `  - ${g.goal||g.account||g.category}: $${(g.contribution||0).toFixed(2)}/mo`).join('\n');

        const annualSummary = yearData?.annualTotals
          ? `Income: $${yearData.annualTotals.income?.actual?.toFixed(2)||0} | Expenses: $${yearData.annualTotals.totalExpenses?.actual?.toFixed(2)||0}`
          : null;

        const cfg = DB.getSettings();
        const members = [cfg.person1?.name, cfg.person2?.name].filter(Boolean).join(' & ') || 'Not specified';

        return {
          householdName: cfg.householdName,
          month, year,
          income: (s2.totalIncome||0).toFixed(2),
          expenses: (s2.totalExpenses||0).toFixed(2),
          debtPayments: (s2.debtPayments||0).toFixed(2),
          savings: (s2.savingsContributions||0).toFixed(2),
          net: (s2.netCashFlow||0).toFixed(2),
          endingBalance: (s2.endingBalance||0).toFixed(2),
          topExpenses, debts, goals, annualSummary, members
        };
      }

      function appendMessage(role, text) {
        const wrapper = document.createElement('div');
        wrapper.className = `chat-msg ${role}`;
        wrapper.innerHTML = `
          <div class="chat-msg-avatar">${role === 'assistant' ? '✦' : '👤'}</div>
          <div class="chat-bubble">${text.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>`;
        messagesEl.appendChild(wrapper);
        messagesEl.scrollTop = messagesEl.scrollHeight;
        return wrapper;
      }

      function showTyping() {
        const wrapper = document.createElement('div');
        wrapper.className = 'chat-msg assistant';
        wrapper.id = 'typing-indicator';
        wrapper.innerHTML = `<div class="chat-msg-avatar">✦</div><div class="chat-bubble chat-typing"><span></span><span></span><span></span></div>`;
        messagesEl.appendChild(wrapper);
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }

      function removeTyping() {
        document.getElementById('typing-indicator')?.remove();
      }

      async function sendMessage(text) {
        if (!text.trim()) return;
        if (suggestionsEl) suggestionsEl.style.display = 'none';

        appendMessage('user', text);
        chatHistory.push({ role: 'user', content: text });
        inputEl.value = '';
        inputEl.style.height = 'auto';
        sendBtn.disabled = true;
        showTyping();

        try {
          const cfg = DB.getSettings();
          const prov = cfg.aiProvider || 'claude';
          const key = prov === 'openai' ? cfg.openaiApiKey : cfg.aiApiKey;
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: chatHistory,
              apiKey: key,
              provider: prov,
              context: buildContext()
            })
          });
          removeTyping();
          let data;
          try { data = await res.json(); } catch { data = {}; }
          if (data.reply) {
            appendMessage('assistant', data.reply);
            chatHistory.push({ role: 'assistant', content: data.reply });
          } else {
            const errMsg = data.error || 'Something went wrong.';
            appendMessage('assistant', `⚠ ${errMsg}`);
          }
        } catch (e) {
          removeTyping();
          appendMessage('assistant', '⚠ Could not reach the server. Make sure Tally AI is running.');
        }

        sendBtn.disabled = false;
        inputEl.focus();
      }

      sendBtn.onclick = () => sendMessage(inputEl.value);

      inputEl.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(inputEl.value); }
      });

      inputEl.addEventListener('input', () => {
        inputEl.style.height = 'auto';
        const cap = window.innerWidth <= 768 ? 100 : 120;
        inputEl.style.height = Math.min(inputEl.scrollHeight, cap) + 'px';
      });

      // ── Dictation ──
      const micBtn      = document.getElementById('chat-mic');
      const dictateBar  = document.getElementById('chat-dictate-bar');
      const dictateInterim = document.getElementById('dictate-interim');
      const dictateStatusText = document.getElementById('dictate-status-text');

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        micBtn.title = 'Speech recognition not supported in this browser (use Chrome)';
        micBtn.style.opacity = '0.35';
        micBtn.style.cursor = 'not-allowed';
      } else {
        const recognition = new SpeechRecognition();
        recognition.continuous      = true;
        recognition.interimResults  = true;
        recognition.lang            = 'en-US';
        recognition.maxAlternatives = 1;

        let listening  = false;
        let baseText   = '';   // text already in box before dictation started
        let finalText  = '';   // accumulated confirmed words this session

        function startDictation() {
          baseText  = inputEl.value.trimEnd();
          finalText = '';
          listening = true;
          micBtn.classList.add('recording');
          micBtn.title = 'Stop dictating';
          dictateBar.style.display = 'flex';
          dictateInterim.textContent = '';
          dictateStatusText.textContent = 'Listening…';
          recognition.start();
        }

        function stopDictation() {
          listening = false;
          recognition.stop();
          micBtn.classList.remove('recording');
          micBtn.title = 'Dictate';
          dictateBar.style.display = 'none';
          dictateInterim.textContent = '';
          // Commit whatever we have
          const committed = (baseText + (baseText && finalText ? ' ' : '') + finalText).trim();
          inputEl.value = committed;
          inputEl.style.height = 'auto';
          inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
          inputEl.focus();
        }

        recognition.onresult = (e) => {
          let interimChunk = '';
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const transcript = e.results[i][0].transcript;
            if (e.results[i].isFinal) {
              // Capitalise first character if finalText is empty and baseText is empty
              const prefix = (!finalText && !baseText) ? transcript.charAt(0).toUpperCase() + transcript.slice(1) : transcript;
              finalText += (finalText ? ' ' : '') + prefix.trim();
            } else {
              interimChunk += transcript;
            }
          }

          // Show confirmed text in textarea, interim in the bar
          const confirmed = (baseText + (baseText && finalText ? ' ' : '') + finalText).trim();
          inputEl.value = confirmed;
          inputEl.style.height = 'auto';
          inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
          dictateInterim.textContent = interimChunk ? `"${interimChunk}"` : '';
        };

        recognition.onspeechend = () => {
          dictateStatusText.textContent = 'Processing…';
        };

        recognition.onerror = (e) => {
          const friendly = {
            'not-allowed'  : 'Microphone access denied. Allow mic in browser settings.',
            'no-speech'    : 'No speech detected — try again.',
            'network'      : 'Network error during speech recognition.',
            'aborted'      : null,
          }[e.error] || `Speech error: ${e.error}`;
          stopDictation();
          if (friendly) showToast(friendly);
        };

        recognition.onend = () => {
          // If user hasn't manually stopped (e.g. browser auto-ended), clean up
          if (listening) stopDictation();
        };

        micBtn.onclick = () => {
          if (listening) stopDictation();
          else startDictation();
        };
      }

      if (suggestionsEl) {
        suggestionsEl.addEventListener('click', e => {
          const btn = e.target.closest('.chat-suggestion');
          if (btn) sendMessage(btn.textContent);
        });
      }
    }, 50);

    return div;
  }

  return { dashboard, monthly, yearly, goals, debt, bills, importPage, advisor, settings, openAddModal, closeAddModal, getBillsForMonth };
})();
