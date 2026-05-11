// Tally AI — App Controller
const App = (() => {
  let currentYear = String(new Date().getFullYear());
  let currentMonth = MONTHS[new Date().getMonth()];
  let currentPage = 'dashboard';
  let currentUser = null;
  let currentTheme = localStorage.getItem('tally-theme') || 'classic';

  const themes = ['classic', 'blush', 'luxury'];
  const themeMeta = {
    classic: { label: 'Classic', icon: 'C', color: '#1a1a2e' },
    blush: { label: 'Blush', icon: 'B', color: '#f7ebe5' },
    luxury: { label: 'Luxury', icon: 'L', color: '#fff8f5' }
  };
  if (currentTheme === 'luxe') currentTheme = 'luxury';

  function normalizeTheme(theme) {
    if (theme === 'luxe') return 'luxury';
    return themes.includes(theme) ? theme : 'classic';
  }

  function nextTheme(theme) {
    const idx = themes.indexOf(normalizeTheme(theme));
    return themes[(idx + 1) % themes.length];
  }

  function applyTheme(theme, rerender = false) {
    currentTheme = normalizeTheme(theme);
    document.documentElement.dataset.theme = currentTheme;
    localStorage.setItem('tally-theme', currentTheme);

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = themeMeta[currentTheme].color;

    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
      const label = toggle.querySelector('.theme-toggle-label');
      const icon = toggle.querySelector('.theme-toggle-icon');
      toggle.classList.toggle('active', currentTheme !== 'classic');
      toggle.setAttribute('aria-pressed', currentTheme !== 'classic' ? 'true' : 'false');
      toggle.title = `Theme: ${themeMeta[currentTheme].label}. Click to switch.`;
      if (label) label.textContent = themeMeta[currentTheme].label;
      if (icon) icon.textContent = themeMeta[currentTheme].icon;
    }

    document.querySelectorAll('.theme-choice').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === currentTheme);
    });

    if (rerender) render();
  }
  const luxuryTuningVersion = 5;
  const defaultLuxuryTuning = {
    version: luxuryTuningVersion,
    transparency: 100,
    smoke: 17,
    glow: 100,
    hue: 12,
    saturation: 62,
    animation: 94,
    particleSpeed: 82,
    graphGlow: 100,
    graphGradient: 85,
    colorIncome: '#dc685d',
    colorExpense: '#e56285',
    colorLine: '#ffd7bf',
    colorHighlight: '#fffdf8',
    colorGlow: '#ffd7bf',
    colorChampagne: '#dfc990',
    colorBerry: '#de4a79',
    incomeTop: '#fffaf6',
    incomeMid: '#dc685d',
    incomeBottom: '#d75a52',
    expenseTop: '#ffffff',
    expenseMid: '#e56285',
    expenseBottom: '#de4a79',
    lineTop: '#fffdf8',
    lineMid: '#ffd7bf',
    lineBottom: '#d8a27f',
    gradientMidpoint: 63
  };
  let luxuryTuning = loadLuxuryTuning();
  let luxuryRenderTimer = null;

  function loadLuxuryTuning() {
    try {
      const saved = JSON.parse(localStorage.getItem('tally-luxury-tuning') || '{}');
      if (saved.version !== luxuryTuningVersion) return { ...defaultLuxuryTuning };
      return { ...defaultLuxuryTuning, ...saved };
    } catch {
      return { ...defaultLuxuryTuning };
    }
  }

  function clampNum(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  }

  function normalizeHex(value, fallback) {
    const v = String(value || '').trim();
    return /^#[0-9a-fA-F]{6}$/.test(v) ? v : fallback;
  }

  function normalizedLuxuryTuning(next = luxuryTuning) {
    return {
      version: luxuryTuningVersion,
      transparency: clampNum(next.transparency, 0, 100, defaultLuxuryTuning.transparency),
      smoke: clampNum(next.smoke, 0, 55, defaultLuxuryTuning.smoke),
      glow: clampNum(next.glow, 0, 100, defaultLuxuryTuning.glow),
      hue: clampNum(next.hue, -45, 45, defaultLuxuryTuning.hue),
      saturation: clampNum(next.saturation, 30, 95, defaultLuxuryTuning.saturation),
      animation: clampNum(next.animation, 0, 100, defaultLuxuryTuning.animation),
      particleSpeed: clampNum(next.particleSpeed, 0, 100, defaultLuxuryTuning.particleSpeed),
      graphGlow: clampNum(next.graphGlow, 0, 100, defaultLuxuryTuning.graphGlow),
      graphGradient: clampNum(next.graphGradient, 0, 100, defaultLuxuryTuning.graphGradient),
      colorIncome: normalizeHex(next.colorIncome, defaultLuxuryTuning.colorIncome),
      colorExpense: normalizeHex(next.colorExpense, defaultLuxuryTuning.colorExpense),
      colorLine: normalizeHex(next.colorLine, defaultLuxuryTuning.colorLine),
      colorHighlight: normalizeHex(next.colorHighlight, defaultLuxuryTuning.colorHighlight),
      colorGlow: normalizeHex(next.colorGlow, defaultLuxuryTuning.colorGlow),
      colorChampagne: normalizeHex(next.colorChampagne, defaultLuxuryTuning.colorChampagne),
      colorBerry: normalizeHex(next.colorBerry, defaultLuxuryTuning.colorBerry),
      incomeTop: normalizeHex(next.incomeTop, defaultLuxuryTuning.incomeTop),
      incomeMid: normalizeHex(next.incomeMid, defaultLuxuryTuning.incomeMid),
      incomeBottom: normalizeHex(next.incomeBottom, defaultLuxuryTuning.incomeBottom),
      expenseTop: normalizeHex(next.expenseTop, defaultLuxuryTuning.expenseTop),
      expenseMid: normalizeHex(next.expenseMid, defaultLuxuryTuning.expenseMid),
      expenseBottom: normalizeHex(next.expenseBottom, defaultLuxuryTuning.expenseBottom),
      lineTop: normalizeHex(next.lineTop, defaultLuxuryTuning.lineTop),
      lineMid: normalizeHex(next.lineMid, defaultLuxuryTuning.lineMid),
      lineBottom: normalizeHex(next.lineBottom, defaultLuxuryTuning.lineBottom),
      gradientMidpoint: clampNum(next.gradientMidpoint, 10, 90, defaultLuxuryTuning.gradientMidpoint)
    };
  }

  function applyLuxuryTuning(next = luxuryTuning, rerenderCharts = false) {
    luxuryTuning = normalizedLuxuryTuning(next);
    const root = document.documentElement;
    const glassOpacity = (100 - luxuryTuning.transparency) / 100;
    const glassAlpha = glassOpacity.toFixed(2);
    const smokeAlpha = (luxuryTuning.smoke / 100).toFixed(2);
    const backdropBlur = Math.min(26, glassOpacity * 75).toFixed(1) + 'px';
    const surfaceShineAlpha = (glassOpacity * (0.22 + luxuryTuning.glow / 260)).toFixed(2);
    const hoverGlassAlpha = Math.min(1, glassOpacity + (glassOpacity > 0 ? 0.04 : 0)).toFixed(2);
    const glowAlpha = (luxuryTuning.glow / 100).toFixed(2);
    const glowSoft = (0.06 + luxuryTuning.glow / 260).toFixed(2);
    const glowBorder = (0.24 + luxuryTuning.glow / 150).toFixed(2);
    const shineAlpha = (0.34 + luxuryTuning.glow / 180).toFixed(2);
    const shineSoft = (0.18 + luxuryTuning.glow / 320).toFixed(2);
    const shineBeam = (0.16 + luxuryTuning.glow / 340).toFixed(2);
    const shineVeil = (0.12 + luxuryTuning.glow / 420).toFixed(2);
    const sparkleAlpha = (0.12 + luxuryTuning.glow / 155).toFixed(2);
    const smokeSoft = (luxuryTuning.smoke / 125).toFixed(2);
    const animSeconds = (12 - (luxuryTuning.animation / 100) * 8).toFixed(1) + 's';
    const shineSeconds = (18 - (luxuryTuning.particleSpeed / 100) * 9).toFixed(1) + 's';
    const particleDrift = (16 - (luxuryTuning.particleSpeed / 100) * 7).toFixed(1) + 's';
    const graphGlow = (luxuryTuning.graphGlow / 100).toFixed(2);
    const graphGradient = (luxuryTuning.graphGradient / 100).toFixed(2);

    root.style.setProperty('--lux-glass-alpha', glassAlpha);
    root.style.setProperty('--lux-hover-glass-alpha', hoverGlassAlpha);
    root.style.setProperty('--lux-backdrop-blur', backdropBlur);
    root.style.setProperty('--lux-surface-shine-alpha', surfaceShineAlpha);
    root.style.setProperty('--lux-smoke-alpha', smokeAlpha);
    root.style.setProperty('--lux-glow-alpha', glowAlpha);
    root.style.setProperty('--lux-glow-soft', glowSoft);
    root.style.setProperty('--lux-glow-border', glowBorder);
    root.style.setProperty('--lux-shine-alpha', shineAlpha);
    root.style.setProperty('--lux-shine-soft', shineSoft);
    root.style.setProperty('--lux-shine-beam', shineBeam);
    root.style.setProperty('--lux-shine-veil', shineVeil);
    root.style.setProperty('--lux-sparkle-alpha', sparkleAlpha);
    root.style.setProperty('--lux-smoke-soft', smokeSoft);
    root.style.setProperty('--lux-shine-speed', shineSeconds);
    root.style.setProperty('--lux-particle-speed', particleDrift);
    root.style.setProperty('--lux-graph-glow', graphGlow);
    root.style.setProperty('--lux-graph-gradient', graphGradient);
    root.style.setProperty('--lux-chart-hue', luxuryTuning.hue);
    root.style.setProperty('--lux-chart-sat', luxuryTuning.saturation + '%');
    root.style.setProperty('--lux-color-income', luxuryTuning.colorIncome);
    root.style.setProperty('--lux-color-expense', luxuryTuning.colorExpense);
    root.style.setProperty('--lux-color-line', luxuryTuning.colorLine);
    root.style.setProperty('--lux-color-highlight', luxuryTuning.colorHighlight);
    root.style.setProperty('--lux-color-glow', luxuryTuning.colorGlow);
    root.style.setProperty('--lux-color-champagne', luxuryTuning.colorChampagne);
    root.style.setProperty('--lux-color-berry', luxuryTuning.colorBerry);
    root.style.setProperty('--lux-income-top', luxuryTuning.incomeTop);
    root.style.setProperty('--lux-income-mid', luxuryTuning.incomeMid);
    root.style.setProperty('--lux-income-bottom', luxuryTuning.incomeBottom);
    root.style.setProperty('--lux-expense-top', luxuryTuning.expenseTop);
    root.style.setProperty('--lux-expense-mid', luxuryTuning.expenseMid);
    root.style.setProperty('--lux-expense-bottom', luxuryTuning.expenseBottom);
    root.style.setProperty('--lux-line-top', luxuryTuning.lineTop);
    root.style.setProperty('--lux-line-mid', luxuryTuning.lineMid);
    root.style.setProperty('--lux-line-bottom', luxuryTuning.lineBottom);
    root.style.setProperty('--lux-gradient-midpoint', (luxuryTuning.gradientMidpoint / 100).toFixed(2));
    root.style.setProperty('--lux-aura-speed', animSeconds);

    document.querySelectorAll('[data-lux-value]').forEach(el => {
      const key = el.dataset.luxValue;
      if (key && luxuryTuning[key] !== undefined) el.textContent = luxuryTuning[key];
    });

    document.querySelectorAll('[data-lux-control]').forEach(input => {
      const key = input.dataset.luxControl;
      if (key && luxuryTuning[key] !== undefined && document.activeElement !== input) input.value = luxuryTuning[key];
    });

    if (rerenderCharts) {
      clearTimeout(luxuryRenderTimer);
      luxuryRenderTimer = setTimeout(() => render(), 90);
    }
  }

  function updateLuxuryTuning(partial, rerenderCharts = true) {
    applyLuxuryTuning({ ...luxuryTuning, ...partial }, rerenderCharts);
  }

  function saveLuxuryTuning() {
    luxuryTuning = normalizedLuxuryTuning(luxuryTuning);
    localStorage.setItem('tally-luxury-tuning', JSON.stringify(luxuryTuning));
    return luxuryTuning;
  }

  function resetLuxuryTuning(rerenderCharts = true) {
    luxuryTuning = { ...defaultLuxuryTuning };
    localStorage.removeItem('tally-luxury-tuning');
    applyLuxuryTuning(luxuryTuning, rerenderCharts);
    return luxuryTuning;
  }
  function navigate(page, year, month) {
    currentPage = page || currentPage;
    if (year) currentYear = year;
    if (month) currentMonth = month;

    document.querySelectorAll('.nav-link').forEach(l => {
      l.classList.toggle('active', l.dataset.page === currentPage);
    });

    // Sync bottom nav active tabs
    document.querySelectorAll('.bottom-nav .bn-tab[data-page]').forEach(t => {
      t.classList.toggle('active', t.dataset.page === currentPage);
    });
    // Sync more-drawer items
    document.querySelectorAll('.more-item[data-page]').forEach(t => {
      t.classList.toggle('active', t.dataset.page === currentPage);
    });

    updateTopBar();
    render();
  }

  function render() {
    const content = document.getElementById('page-content');
    if (!content) return;

    content.innerHTML = '';

    let result;
    switch (currentPage) {
      case 'dashboard':   result = Pages.dashboard(currentYear, currentMonth); break;
      case 'monthly':     result = Pages.monthly(currentYear, currentMonth); break;
      case 'yearly':      result = Pages.yearly(currentYear); break;
      case 'goals':       result = Pages.goals(currentYear, currentMonth); break;
      case 'debt':        result = Pages.debt(currentYear, currentMonth); break;
      case 'bills':       result = Pages.bills(currentYear, currentMonth); break;
      case 'advisor':     result = Pages.advisor(); break;
      case 'import':      result = Pages.importPage(); break;
      case 'settings':    result = Pages.settings(); break;
      default:            result = Pages.dashboard(currentYear, currentMonth);
    }

    if (result) content.appendChild(result);
    updateTopBar();
  }

  function updateTopBar() {
    const monthLabel = document.getElementById('current-month-label');
    if (monthLabel) monthLabel.textContent = `${currentMonth} ${currentYear}`;

    const titles = {
      dashboard: ['Dashboard', `${currentMonth} ${currentYear} Overview`],
      monthly:   ['Monthly Detail', `${currentMonth} ${currentYear} Budget`],
      yearly:    ['Year Overview', `${currentYear} Annual Summary`],
      goals:     ['Savings Goals', 'Track Your Targets'],
      debt:      ['Debt Tracker', 'Snowball Payoff Strategy'],
      bills:     ['Bills Calendar', `${currentMonth} ${currentYear} Due Dates`],
      advisor:   ['AI Advisor', 'Your personal financial coach'],
      import:    ['Import Data', 'Upload Excel Budget File'],
      settings:  ['Settings', 'Manage Your Profiles & Preferences']
    };

    const [title, sub] = titles[currentPage] || ['Dashboard', ''];
    const titleEl = document.getElementById('page-title');
    const subEl = document.getElementById('page-subtitle');
    if (titleEl) titleEl.textContent = title;
    if (subEl) subEl.textContent = sub;

    const monthNav = document.getElementById('month-nav');
    if (monthNav) {
      const showNav = ['dashboard', 'monthly', 'goals', 'debt', 'bills', 'advisor'].includes(currentPage);
      monthNav.style.display = showNav ? 'flex' : 'none';
    }

    updateSidebarBalance();
  }

  async function updateSidebarBalance() {
    const balEl = document.getElementById('sidebar-balance');
    const monthEl = document.getElementById('sidebar-month');
    const labelEl = document.getElementById('sidebar-balance-label');

    // 1) Try live Plaid cash on hand first — that's what "current balance" should mean
    let usedLive = false;
    if (balEl) {
      try {
        const r = await fetch('/api/plaid/balances');
        if (r.ok) {
          const d = await r.json();
          if (d.accounts && d.accounts.length && typeof d.cashOnHand === 'number') {
            balEl.textContent = fmt(d.cashOnHand);
            balEl.className = 'sidebar-balance ' + (d.cashOnHand >= 0 ? 'positive' : 'negative');
            if (labelEl) labelEl.textContent = 'CURRENT CASH';
            if (monthEl) monthEl.textContent = 'Live from bank';
            usedLive = true;
          }
        }
      } catch {}
    }

    // 2) Fallback — use the month's computed ending balance from live totals
    if (!usedLive) {
      const m = DB.getMonth(currentYear, currentMonth);
      const s = m?.summary || {};
      const net = (s.totalIncome || 0) - (s.totalExpenses || 0) - (s.debtPayments || 0) - (s.savingsContributions || 0);
      const balance = (s.startingBalance || 0) + net;
      if (balEl) {
        balEl.textContent = fmt(balance);
        balEl.className = 'sidebar-balance ' + (balance >= 0 ? 'positive' : 'negative');
      }
      if (labelEl) labelEl.textContent = 'CURRENT BALANCE';
      if (monthEl) monthEl.textContent = `${currentMonth.slice(0,3)} ${currentYear}`;
    }
  }

  function updateUserBadge(user) {
    if (!user) return;
    const initial = (user.userName || user.name || '?')[0].toUpperCase();
    const color   = user.userColor || '#7c6ef8';

    const avatar = document.getElementById('user-badge-avatar');
    const name   = document.getElementById('user-badge-name');
    if (avatar) { avatar.textContent = initial; avatar.style.background = color + '33'; avatar.style.color = color; }
    if (name)   name.textContent = user.userName || user.name || '';

    // More drawer
    const mAvatar = document.getElementById('more-user-avatar');
    const mName   = document.getElementById('more-user-name');
    const mRole   = document.getElementById('more-user-role');
    if (mAvatar) { mAvatar.textContent = initial; mAvatar.style.background = color + '33'; mAvatar.style.color = color; }
    if (mName)   mName.textContent = user.userName || user.name || '';
    if (mRole)   mRole.textContent = user.userColor ? 'Primary Account' : 'Signed in';
  }

  function bindEvents() {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        if (link.dataset.page === 'add') {
          Pages.openAddModal(currentYear, currentMonth);
        } else {
          navigate(link.dataset.page);
        }
      });
    });

    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('collapsed');
      });
    }

    const menuBtn = document.getElementById('menu-btn');
    if (menuBtn) {
      menuBtn.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
      });
    }

    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        const { year, month } = prevMonth(currentYear, currentMonth);
        currentYear = year; currentMonth = month; render();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const { year, month } = nextMonth(currentYear, currentMonth);
        currentYear = year; currentMonth = month; render();
      });
    }

    const voiceBtn = document.getElementById('voice-btn');
    if (voiceBtn) voiceBtn.addEventListener('click', () => VoiceModal.open(currentYear, currentMonth));

    const quickAdd = document.getElementById('quick-add-btn');
    if (quickAdd) quickAdd.addEventListener('click', () => Pages.openAddModal(currentYear, currentMonth));

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        applyTheme(nextTheme(currentTheme), true);
      });
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/login.html';
      });
    }

    // ── Mobile bottom nav ──
    document.querySelectorAll('.bottom-nav .bn-tab[data-page]').forEach(tab => {
      tab.addEventListener('click', e => {
        e.preventDefault();
        navigate(tab.dataset.page);
      });
    });

    const bnAdd = document.getElementById('bn-add');
    if (bnAdd) bnAdd.addEventListener('click', () => Pages.openAddModal(currentYear, currentMonth));

    // More drawer
    const moreOverlay = document.getElementById('more-overlay');
    const moreDrawer  = document.getElementById('more-drawer');
    const bnMore      = document.getElementById('bn-more');

    function openMoreDrawer() {
      moreDrawer.classList.add('open');
      moreOverlay.classList.add('open');
    }
    function closeMoreDrawer() {
      moreDrawer.classList.remove('open');
      moreOverlay.classList.remove('open');
    }

    if (bnMore)      bnMore.addEventListener('click', openMoreDrawer);
    if (moreOverlay) moreOverlay.addEventListener('click', closeMoreDrawer);

    document.querySelectorAll('.more-item[data-page]').forEach(item => {
      item.addEventListener('click', e => {
        e.preventDefault();
        closeMoreDrawer();
        navigate(item.dataset.page);
      });
    });

    const moreVoice = document.getElementById('more-voice');
    if (moreVoice) moreVoice.addEventListener('click', () => {
      closeMoreDrawer();
      VoiceModal.open(currentYear, currentMonth);
    });

    const moreLogout = document.getElementById('more-logout');
    if (moreLogout) moreLogout.addEventListener('click', async () => {
      await fetch('/api/logout', { method: 'POST' });
      window.location.href = '/login.html';
    });

    VoiceModal.bindEvents();

    document.addEventListener('click', e => {
      const sidebar = document.getElementById('sidebar');
      const mb = document.getElementById('menu-btn');
      if (window.innerWidth <= 900 && sidebar?.classList.contains('open') && !sidebar.contains(e.target) && e.target !== mb) {
        sidebar.classList.remove('open');
      }
    });
  }

  async function init() {
    applyTheme(currentTheme);

    // Check auth before anything else
    try {
      const res = await fetch('/api/me');
      if (res.status === 401) {
        window.location.href = '/login.html';
        return;
      }
      currentUser = await res.json();
    } catch {
      window.location.href = '/login.html';
      return;
    }

    await DB.init();

    // If DB.init() redirected (401 on /api/data), stop here
    if (window.location.pathname === '/login.html') return;

    const now = new Date();
    currentYear = String(now.getFullYear());
    currentMonth = MONTHS[now.getMonth()];

    if (!DB.getMonth(currentYear, currentMonth)) {
      const years = DB.getAllYears().sort().reverse();
      outer: for (const y of years) {
        const months = DB.getYearMonths(y);
        for (let i = months.length - 1; i >= 0; i--) {
          if (months[i].data?.summary?.totalIncome > 0) {
            currentYear = y; currentMonth = months[i].name; break outer;
          }
        }
      }
    }

    const hhEl = document.getElementById('household-name');
    if (hhEl) hhEl.textContent = DB.getSettings().householdName;

    updateUserBadge(currentUser);
    bindEvents();
    navigate('dashboard');
    applyTheme(currentTheme);
  }

  return {
    init, navigate, render, applyTheme, applyLuxuryTuning, updateLuxuryTuning, saveLuxuryTuning, resetLuxuryTuning,
    get currentYear() { return currentYear; },
    get currentMonth() { return currentMonth; },
    get currentPage() { return currentPage; },
    get currentUser() { return currentUser; },
    get currentTheme() { return currentTheme; },
    get luxuryTuning() { return { ...luxuryTuning }; }
  };
})();

document.addEventListener('DOMContentLoaded', () => App.init());

// ── PWA: register service worker + capture install prompt ──
window.PWA = (() => {
  let deferredPrompt = null;
  let isInstalled = false;

  function checkInstalled() {
    isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                  window.navigator.standalone === true;
    return isInstalled;
  }

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    document.dispatchEvent(new CustomEvent('pwa:installable'));
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    isInstalled = true;
    document.dispatchEvent(new CustomEvent('pwa:installed'));
  });

  async function install() {
    if (!deferredPrompt) return { outcome: 'unavailable' };
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    return { outcome };
  }

  function canInstall() { return !!deferredPrompt; }
  function installed()  { return checkInstalled(); }
  function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  }
  function isAndroid() { return /Android/.test(navigator.userAgent); }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.warn('SW registration failed:', err);
      });
    });
  }

  checkInstalled();
  return { install, canInstall, installed, isIOS, isAndroid };
})();
