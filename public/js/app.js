// Tally AI — App Controller
const App = (() => {
  let currentYear = String(new Date().getFullYear());
  let currentMonth = MONTHS[new Date().getMonth()];
  let currentPage = 'dashboard';
  let currentUser = null;

  function navigate(page, year, month) {
    currentPage = page || currentPage;
    if (year) currentYear = year;
    if (month) currentMonth = month;

    document.querySelectorAll('.nav-link').forEach(l => {
      l.classList.toggle('active', l.dataset.page === currentPage);
    });

    updateTopBar();
    render();

    if (window.innerWidth <= 900) {
      document.getElementById('sidebar').classList.remove('open');
    }
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

  function updateSidebarBalance() {
    const m = DB.getMonth(currentYear, currentMonth);
    const balance = m?.summary?.endingBalance ?? 0;
    const balEl = document.getElementById('sidebar-balance');
    if (balEl) {
      balEl.textContent = fmt(balance);
      balEl.className = 'sidebar-balance ' + (balance >= 0 ? 'positive' : 'negative');
    }
    const monthEl = document.getElementById('sidebar-month');
    if (monthEl) monthEl.textContent = `${currentMonth.slice(0,3)} ${currentYear}`;
  }

  function updateUserBadge(user) {
    if (!user) return;
    const avatar = document.getElementById('user-badge-avatar');
    const name = document.getElementById('user-badge-name');
    const initial = (user.userName || user.name || '?')[0].toUpperCase();
    if (avatar) {
      avatar.textContent = initial;
      avatar.style.background = (user.userColor || '#7c6ef8') + '33';
      avatar.style.color = user.userColor || '#7c6ef8';
    }
    if (name) name.textContent = user.userName || user.name || '';
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

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/login.html';
      });
    }

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
  }

  return {
    init, navigate, render,
    get currentYear() { return currentYear; },
    get currentMonth() { return currentMonth; },
    get currentPage() { return currentPage; },
    get currentUser() { return currentUser; }
  };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
