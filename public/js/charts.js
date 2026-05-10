// Tally AI — Charts
const Charts = (() => {
  const instances = {};

  const COLORS = {
    primary: '#7c6ef8',
    gold: '#f4b942',
    success: '#52d9a4',
    danger: '#ff6b6b',
    warning: '#ffb347',
    info: '#5bc0eb',
    muted: '#6b6888'
  };

  const defaults = {
    color: '#f0eeff',
    font: { family: 'Inter', size: 12 },
    plugins: {
      legend: { labels: { color: '#a9a6c9', font: { size: 11 } } },
      tooltip: {
        backgroundColor: '#22223a',
        borderColor: '#2e2e4a',
        borderWidth: 1,
        titleColor: '#f0eeff',
        bodyColor: '#a9a6c9',
        padding: 12,
        callbacks: {
          label: ctx => ` ${fmt(ctx.raw)}`
        }
      }
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6b6888' } },
      y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6b6888', callback: v => fmtShort(v) } }
    }
  };

  function destroy(id) {
    if (instances[id]) { instances[id].destroy(); delete instances[id]; }
  }

  function incomeVsExpenses(canvasId, yearMonths) {
    destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const labels = yearMonths.filter(m => m.data?.summary?.totalIncome > 0).map(m => m.name.slice(0,3));
    const income = yearMonths.filter(m => m.data?.summary?.totalIncome > 0).map(m => m.data.summary.totalIncome || 0);
    const expenses = yearMonths.filter(m => m.data?.summary?.totalIncome > 0).map(m => (m.data.summary.totalExpenses || 0) + (m.data.summary.debtPayments || 0));

    instances[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Income', data: income, backgroundColor: 'rgba(82,217,164,0.7)', borderColor: COLORS.success, borderWidth: 1, borderRadius: 6 },
          { label: 'Expenses', data: expenses, backgroundColor: 'rgba(255,107,107,0.7)', borderColor: COLORS.danger, borderWidth: 1, borderRadius: 6 }
        ]
      },
      options: {
        ...defaults,
        responsive: true, maintainAspectRatio: false,
        plugins: { ...defaults.plugins, legend: { ...defaults.plugins.legend, position: 'top' } },
        scales: defaults.scales
      }
    });
  }

  function expenseBreakdown(canvasId, monthData) {
    destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    if (!monthData) return;

    const fixed = (monthData.fixedExpenses || []).reduce((s, i) => s + (i.actual || 0), 0);
    const variable = (monthData.variableExpenses || []).reduce((s, i) => s + (i.actual || 0), 0);
    const debt = (monthData.debt || []).reduce((s, i) => s + (i.payment || 0), 0);
    const savings = (monthData.savings || []).reduce((s, i) => s + (i.contribution || 0), 0);

    if (!fixed && !variable && !debt && !savings) return;

    instances[canvasId] = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Fixed Expenses', 'Variable Expenses', 'Debt Payments', 'Savings'],
        datasets: [{
          data: [fixed, variable, debt, savings],
          backgroundColor: [COLORS.primary, COLORS.gold, COLORS.danger, COLORS.info],
          borderColor: '#1a1a2e',
          borderWidth: 3,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          ...defaults.plugins,
          legend: { position: 'bottom', labels: { color: '#a9a6c9', padding: 16, font: { size: 11 } } }
        },
        cutout: '65%'
      }
    });
  }

  function netFlow(canvasId, yearMonths) {
    destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const hasData = yearMonths.filter(m => m.data?.summary?.totalIncome > 0);
    const labels = hasData.map(m => m.name.slice(0,3));
    const nets = hasData.map(m => m.data.summary.netCashFlow || 0);

    instances[canvasId] = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Net Cash Flow',
          data: nets,
          borderColor: COLORS.primary,
          backgroundColor: 'rgba(124,110,248,0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: nets.map(n => n >= 0 ? COLORS.success : COLORS.danger),
          pointRadius: 5
        }]
      },
      options: {
        ...defaults,
        responsive: true, maintainAspectRatio: false,
        plugins: { ...defaults.plugins, legend: { display: false } },
        scales: {
          ...defaults.scales,
          y: { ...defaults.scales.y, ticks: { color: '#6b6888', callback: v => fmtShort(v) } }
        }
      }
    });
  }

  function categorySpend(canvasId, monthData, section) {
    destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const items = (monthData[section] || []).filter(i => (i.actual || 0) > 0).sort((a,b) => (b.actual||0)-(a.actual||0)).slice(0,8);
    if (!items.length) return;

    const key = section === 'income' ? 'source' : 'category';
    instances[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: items.map(i => i[key]?.length > 14 ? i[key].slice(0,14)+'…' : i[key]),
        datasets: [{
          data: items.map(i => i.actual || 0),
          backgroundColor: [COLORS.primary,COLORS.gold,COLORS.success,COLORS.info,COLORS.danger,COLORS.warning,'#c9b8f8','#a0d8ef'],
          borderRadius: 6
        }]
      },
      options: {
        ...defaults,
        indexAxis: 'y',
        responsive: true, maintainAspectRatio: false,
        plugins: { ...defaults.plugins, legend: { display: false } },
        scales: {
          x: defaults.scales.x,
          y: { grid: { display: false }, ticks: { color: '#a9a6c9', font: { size: 11 } } }
        }
      }
    });
  }

  return { incomeVsExpenses, expenseBreakdown, netFlow, categorySpend, destroy };
})();
