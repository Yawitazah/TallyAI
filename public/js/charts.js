// Tally AI - Charts
const Charts = (() => {
  const instances = {};

  function activeTheme() {
    const theme = document.documentElement.dataset.theme;
    return theme === 'luxe' ? 'luxury' : theme;
  }

  function isLuxury() { return activeTheme() === 'luxury'; }
  function isBlush() { return activeTheme() === 'blush'; }
  function isLightTheme() { return isLuxury() || isBlush(); }

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }


  function hexToRgba(hex, alpha = 1) {
    const raw = String(hex || '').trim().replace('#', '');
    if (!/^[0-9a-fA-F]{6}$/.test(raw)) return `rgba(233,163,141,${alpha})`;
    const n = parseInt(raw, 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function luxColor(name, fallback) {
    return cssVar(`--lux-color-${name}`) || fallback;
  }
  function chartHue(offset = 0) {
    const base = Number(cssVar('--lux-chart-hue') || 12);
    return (base + offset + 360) % 360;
  }

  function chartSat(delta = 0) {
    const sat = Number(String(cssVar('--lux-chart-sat') || '62').replace('%', ''));
    return Math.max(25, Math.min(98, sat + delta));
  }

  function hsl(offset, satDelta, light, alpha = 1) {
    return `hsla(${chartHue(offset)}, ${chartSat(satDelta)}%, ${light}%, ${alpha})`;
  }



  function luxGradientMidpoint() {
    return Math.max(0.1, Math.min(0.9, Number(cssVar('--lux-gradient-midpoint') || 0.42)));
  }

  function luxStop(name, fallback) {
    return cssVar(`--lux-${name}`) || fallback;
  }
  function luxGraphGlow() {
    return Math.max(0, Math.min(1, Number(cssVar('--lux-graph-glow') || 0.64)));
  }

  function luxGraphGradient() {
    return Math.max(0, Math.min(1, Number(cssVar('--lux-graph-gradient') || 0.62)));
  }

  function verticalGradient(context, fallback, stops) {
    const chart = context.chart;
    const area = chart.chartArea;
    if (!area) return fallback;
    const gradient = chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
    stops.forEach(stop => gradient.addColorStop(stop[0], stop[1]));
    return gradient;
  }

  function luxuryBarGradient(offset, satDelta, fallback) {
    return context => {
      const intensity = luxGraphGradient();
      const midPoint = luxGradientMidpoint();
      const isExpense = offset < -10;
      const top = isExpense ? luxStop('expense-top', '#fff4f8') : luxStop('income-top', '#fffaf6');
      const mid = isExpense ? luxStop('expense-mid', '#f17fa3') : luxStop('income-mid', '#e9a38d');
      const bottom = isExpense ? luxStop('expense-bottom', '#c85b7d') : luxStop('income-bottom', '#c96d5c');
      return verticalGradient(context, fallback, [
        [0, hexToRgba(top, 0.72 + intensity * 0.28)],
        [Math.max(0.08, midPoint * 0.38), hexToRgba(top, 0.46 + intensity * 0.22)],
        [midPoint, hexToRgba(mid, 0.9 + intensity * 0.08)],
        [1, hexToRgba(bottom, 0.9)]
      ]);
    };
  }

  function luxuryLineStroke(fallback) {
    return context => {
      const midPoint = luxGradientMidpoint();
      return verticalGradient(context, fallback, [
        [0, hexToRgba(luxStop('line-top', '#fffdf8'), 1)],
        [Math.max(0.08, midPoint * 0.34), hexToRgba(luxStop('line-top', '#fffdf8'), 0.96)],
        [midPoint, hexToRgba(luxStop('line-mid', '#ffd7bf'), 0.98)],
        [1, hexToRgba(luxStop('line-bottom', '#d8a27f'), 0.96)]
      ]);
    };
  }

  function luxuryLineFill(fallback) {
    return context => {
      const intensity = luxGraphGradient();
      return verticalGradient(context, fallback, [
        [0, hexToRgba('#d56b8b', 0.34 + intensity * 0.28)],
        [0.34, hexToRgba('#d56b8b', 0.2 + intensity * 0.18)],
        [0.68, hexToRgba('#d56b8b', 0.08 + intensity * 0.08)],
        [1, hexToRgba('#d56b8b', 0)]
      ]);
    };
  }

  function palette() {
    const luxury = isLuxury();
    const light = isLightTheme();
    return {
      primary: cssVar('--primary') || '#7c6ef8',
      gold: cssVar('--gold') || '#f4b942',
      success: cssVar('--success') || '#52d9a4',
      danger: cssVar('--danger') || '#ff6b6b',
      warning: cssVar('--warning') || '#ffb347',
      info: cssVar('--info') || '#5bc0eb',
      muted: cssVar('--text3') || '#6b6888',
      text: cssVar('--text') || '#f0eeff',
      text2: cssVar('--text2') || '#a9a6c9',
      surface: light ? 'rgba(255,255,255,0.86)' : '#22223a',
      border: cssVar('--border') || '#2e2e4a',
      grid: light ? 'rgba(100,54,45,0.14)' : 'rgba(255,255,255,0.04)',
      doughnutBorder: light ? 'rgba(255,244,238,0.95)' : '#1a1a2e',
      incomeFill: luxury ? hexToRgba(luxStop('income-mid', '#e9a38d'), 0.78) : light ? 'rgba(80,159,122,0.72)' : 'rgba(82,217,164,0.7)',
      incomeLine: luxury ? luxStop('income-mid', '#e9a38d') : cssVar('--success') || '#52d9a4',
      expenseFill: luxury ? hexToRgba(luxStop('expense-mid', '#f17fa3'), 0.8) : light ? 'rgba(228,83,122,0.74)' : 'rgba(255,107,107,0.7)',
      expenseLine: luxury ? luxStop('expense-mid', '#f17fa3') : cssVar('--danger') || '#ff6b6b',
      lineFill: luxury ? hexToRgba(luxStop('line-mid', '#ffd7bf'), 0.16) : light ? 'rgba(201,130,106,0.18)' : 'rgba(124,110,248,0.1)',
      graphGlow: luxury ? luxGraphGlow() : 0,
      glowA: luxury ? luxColor('glow', '#ffe2d1') : '#ffd0c3',
      glowB: luxury ? luxColor('expense', '#f17fa3') : '#ff8daa',
      palette: luxury
        ? [luxColor('income', '#e9a38d'), luxColor('champagne', '#dfc990'), luxColor('expense', '#f17fa3'), luxColor('berry', '#c85b7d'), luxColor('line', '#e9a38d'), luxColor('glow', '#ffe2d1'), luxColor('highlight', '#fffaf6'), luxColor('income', '#e9a38d')]
        : ['rgba(188,103,79,0.88)', 'rgba(212,161,100,0.86)', 'rgba(228,83,122,0.9)', 'rgba(130,121,223,0.86)', '#c9785f', '#d79b6d', '#a66f86', '#e9a79a']
    };
  }
  const digitalGlowPlugin = {
    id: 'digitalGlow',
    beforeDatasetDraw(chart, args) {
      if (!isLuxury()) return;
      const ctx = chart.ctx;
      const dataset = chart.data.datasets[args.index] || {};
      const glow = dataset.glowColor || (Array.isArray(dataset.borderColor) ? dataset.borderColor[0] : dataset.borderColor) || '#f0a18f';
      ctx.save();
      ctx.shadowColor = glow;
      ctx.shadowBlur = chart.config.type === 'doughnut' ? 32 + luxGraphGlow() * 26 : 28 + luxGraphGlow() * 52;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    },
    afterDatasetDraw(chart) {
      if (!isLuxury()) return;
      chart.ctx.restore();
    }
  };

  const luxuryLineGlowPlugin = {
    id: 'luxuryLineGlow',
    afterDatasetDraw(chart, args) {
      if (!isLuxury() || chart.config.type !== 'line') return;
      const meta = chart.getDatasetMeta(args.index);
      if (!meta?.dataset || meta.hidden) return;
      const ctx = chart.ctx;
      const points = meta.data || [];
      const hot = luxStop('line-top', '#fffdf8');
      const mid = luxStop('line-mid', '#ff9c8d');

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.shadowColor = hexToRgba(hot, 0.92);
      ctx.shadowBlur = 32 + luxGraphGlow() * 18;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = hexToRgba(mid, 0.36);
      ctx.lineWidth = 13;
      meta.dataset.draw(ctx);

      ctx.shadowColor = hexToRgba(mid, 0.72);
      ctx.shadowBlur = 18 + luxGraphGlow() * 18;
      ctx.strokeStyle = hexToRgba(hot, 0.88);
      ctx.lineWidth = 3.2;
      meta.dataset.draw(ctx);

      points.forEach(point => {
        const { x, y } = point.getProps(['x', 'y'], true);
        const halo = ctx.createRadialGradient(x, y, 0, x, y, 28);
        halo.addColorStop(0, hexToRgba(hot, 0.96));
        halo.addColorStop(0.36, hexToRgba(mid, 0.35));
        halo.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(x, y, 28, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowColor = hexToRgba(hot, 0.94);
        ctx.shadowBlur = 13;
        ctx.fillStyle = '#fffdf8';
        ctx.beginPath();
        ctx.arc(x, y, 6.8, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }
  };
  function plugins(extra = []) {
    return isLuxury() ? [digitalGlowPlugin, luxuryLineGlowPlugin, ...extra] : extra;
  }

  function defaults(colors) {
    return {
      color: colors.text,
      font: { family: 'Inter', size: 12 },
      plugins: {
        legend: { labels: { color: colors.text2, font: { size: 11 } } },
        tooltip: {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          titleColor: colors.text,
          bodyColor: colors.text2,
          padding: 12,
          callbacks: { label: ctx => ` ${fmt(ctx.raw)}` }
        }
      },
      scales: {
        x: { grid: { color: colors.grid }, ticks: { color: colors.muted } },
        y: { grid: { color: colors.grid }, ticks: { color: colors.muted, callback: v => fmtShort(v) } }
      }
    };
  }

  function destroy(id) {
    if (instances[id]) { instances[id].destroy(); delete instances[id]; }
  }

  function incomeVsExpenses(canvasId, yearMonths) {
    destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const dataMonths = yearMonths.filter(m => m.data?.summary?.totalIncome > 0);
    const labels = dataMonths.map(m => m.name.slice(0,3));
    const income = dataMonths.map(m => m.data.summary.totalIncome || 0);
    const expenses = dataMonths.map(m => (m.data.summary.totalExpenses || 0) + (m.data.summary.debtPayments || 0));
    const COLORS = palette();
    const base = defaults(COLORS);

    instances[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Income', data: income, backgroundColor: isLuxury() ? luxuryBarGradient(0, 2, COLORS.incomeFill) : COLORS.incomeFill, borderColor: COLORS.incomeLine, borderWidth: isLuxury() ? 2 : 1.5, borderRadius: 7, hoverBorderWidth: 3, glowColor: COLORS.glowA },
          { label: 'Expenses', data: expenses, backgroundColor: isLuxury() ? luxuryBarGradient(-24, 8, COLORS.expenseFill) : COLORS.expenseFill, borderColor: COLORS.expenseLine, borderWidth: isLuxury() ? 2 : 1.5, borderRadius: 7, hoverBorderWidth: 3, glowColor: COLORS.glowB }
        ]
      },
      options: {
        ...base,
        responsive: true,
        maintainAspectRatio: false,
        plugins: { ...base.plugins, legend: { ...base.plugins.legend, position: 'top' } },
        scales: base.scales
      },
      plugins: plugins()
    });
  }

  function expenseBreakdown(canvasId, monthData) {
    destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas || !monthData) return;

    const fixed = (monthData.fixedExpenses || []).reduce((s, i) => s + (i.actual || 0), 0);
    const variable = (monthData.variableExpenses || []).reduce((s, i) => s + (i.actual || 0), 0);
    const debt = (monthData.debt || []).reduce((s, i) => s + (i.payment || 0), 0);
    const savings = (monthData.savings || []).reduce((s, i) => s + (i.contribution || 0), 0);
    if (!fixed && !variable && !debt && !savings) return;

    const COLORS = palette();
    const base = defaults(COLORS);
    const luxeColors = COLORS.palette.slice(0, 4);
    const blushColors = ['rgba(188,103,79,0.88)', 'rgba(212,161,100,0.86)', 'rgba(228,83,122,0.9)', 'rgba(130,121,223,0.86)'];

    instances[canvasId] = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Fixed Expenses', 'Variable Expenses', 'Debt Payments', 'Savings'],
        datasets: [{
          data: [fixed, variable, debt, savings],
          backgroundColor: isLuxury() ? luxeColors : blushColors,
          borderColor: COLORS.doughnutBorder,
          borderWidth: isLuxury() ? 4 : 3,
          hoverOffset: 10,
          hoverBorderWidth: 5,
          glowColor: COLORS.glowA
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { ...base.plugins, legend: { position: 'bottom', labels: { color: COLORS.text2, padding: 16, font: { size: 11 } } } },
        cutout: '65%'
      },
      plugins: plugins()
    });
  }

  function netFlow(canvasId, yearMonths, currentMonthData, currentMonthName) {
    destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const hasData = yearMonths.filter(m => m.data?.summary?.totalIncome > 0);
    const monthLabel = (currentMonthName || hasData[hasData.length - 1]?.name || 'May').slice(0, 3);
    const labels = [`${monthLabel} 1`, `${monthLabel} 5`, `${monthLabel} 8`, `${monthLabel} 11`, `${monthLabel} 14`, `${monthLabel} 17`, `${monthLabel} 20`, `${monthLabel} 23`, `${monthLabel} 25`, `${monthLabel} 28`, `${monthLabel} 30`];
    const periodTotal = currentMonthData?.summary?.totalIncome || hasData[hasData.length - 1]?.data?.summary?.totalIncome || 0;
    const shape = [0.14, 0.22, 0.38, 0.36, 0.52, 0.68, 0.56, 0.84, 0.70, 0.62, 1];
    const values = shape.map(mult => Math.max(0, periodTotal * mult));
    const COLORS = palette();
    const base = defaults(COLORS);
    const luxury = isLuxury();

    instances[canvasId] = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Income Flow',
          data: values,
          borderColor: luxury ? luxuryLineStroke(COLORS.primary) : COLORS.primary,
          backgroundColor: luxury ? luxuryLineFill(COLORS.lineFill) : COLORS.lineFill,
          fill: true,
          tension: luxury ? 0.48 : 0.4,
          borderWidth: luxury ? 3.4 : 3,
          pointBackgroundColor: luxury ? '#fffdf8' : COLORS.incomeLine,
          pointBorderColor: luxury ? 'rgba(255,255,255,0.96)' : COLORS.doughnutBorder,
          pointBorderWidth: luxury ? 2 : 1.5,
          pointRadius: luxury ? 6.8 : 5,
          pointHoverRadius: luxury ? 8.5 : 7,
          glowColor: hexToRgba(luxStop('line-mid', '#ff9c8d'), 0.82)
        }]
      },
      options: {
        ...base,
        responsive: true,
        maintainAspectRatio: false,
        layout: luxury ? { padding: { top: 30, right: 22, bottom: 4, left: 2 } } : base.layout,
        interaction: { intersect: false, mode: 'index' },
        plugins: { ...base.plugins, legend: { display: false } },
        scales: {
          x: {
            ...base.scales.x,
            grid: { color: luxury ? 'rgba(255,255,255,0.28)' : COLORS.grid, drawBorder: false },
            ticks: { color: luxury ? 'rgba(72,46,42,0.82)' : COLORS.muted, font: { size: luxury ? 14 : 12 } }
          },
          y: {
            ...base.scales.y,
            border: { display: false },
            grid: { color: luxury ? 'rgba(255,255,255,0.36)' : COLORS.grid, drawBorder: false },
            ticks: { color: luxury ? 'rgba(72,46,42,0.86)' : COLORS.muted, font: { size: luxury ? 14 : 12 }, callback: v => fmtShort(v) }
          }
        }
      },
      plugins: plugins()
    });
  }

  function categorySpend(canvasId, monthData, section) {
    destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const items = (monthData[section] || []).filter(i => (i.actual || 0) > 0).sort((a,b) => (b.actual||0)-(a.actual||0)).slice(0,8);
    if (!items.length) return;
    const COLORS = palette();
    const base = defaults(COLORS);
    const key = section === 'income' ? 'source' : 'category';
    const luxeBars = COLORS.palette;
    const blushBars = ['rgba(188,103,79,0.88)', 'rgba(212,161,100,0.86)', COLORS.success, COLORS.info, COLORS.danger, COLORS.warning, '#c9b8f8', '#a0d8ef'];
    const barColors = isLuxury() ? luxeBars : blushBars;

    instances[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: items.map(i => i[key]?.length > 14 ? i[key].slice(0,14)+'...' : i[key]),
        datasets: [{ data: items.map(i => i.actual || 0), backgroundColor: barColors, borderColor: barColors, borderWidth: 1.5, borderRadius: 7, glowColor: COLORS.glowA }]
      },
      options: {
        ...base,
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { ...base.plugins, legend: { display: false } },
        scales: { x: base.scales.x, y: { grid: { display: false }, ticks: { color: COLORS.text2, font: { size: 11 } } } }
      },
      plugins: plugins()
    });
  }

  return { incomeVsExpenses, expenseBreakdown, netFlow, categorySpend, destroy };
})();


