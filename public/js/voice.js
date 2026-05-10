// Tally AI — Voice Recognition
const Voice = (() => {
  let recognition = null;
  let onResult = null;

  function isSupported() {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  function init() {
    if (!isSupported()) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
  }

  function start(callback) {
    if (!recognition) init();
    if (!recognition) { callback(null, 'Speech recognition not supported'); return; }
    onResult = callback;
    recognition.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
      const isFinal = e.results[e.results.length - 1].isFinal;
      if (isFinal) {
        const parsed = parseTranscript(transcript);
        callback({ transcript, parsed, isFinal: true });
      } else {
        callback({ transcript, isFinal: false });
      }
    };
    recognition.onerror = (e) => callback(null, e.error);
    recognition.onend = () => {};
    recognition.start();
  }

  function stop() {
    if (recognition) recognition.stop();
  }

  function parseTranscript(text) {
    const t = text.toLowerCase().trim();

    // Extract amount — look for $ or number patterns
    const amtMatch = t.match(/\$?(\d+(?:[.,]\d{1,2})?)/);
    const amount = amtMatch ? parseFloat(amtMatch[1].replace(',', '')) : null;

    // Detect direction
    const isIncome = /received|got|made|earned|income|paid me|deposited|salary|paycheck|bonus/.test(t);
    const isExpense = /spent|paid|bought|charged|owe|expense|cost|bill/.test(t);

    // Extract merchant/category from common patterns
    // "spent $45 on gas" / "paid $2250 rent" / "received $500 from Zah"
    let description = text;
    const onMatch = t.match(/on\s+(.+?)(?:\s+(?:yesterday|today|this week|last week|monday|tuesday|wednesday|thursday|friday|saturday|sunday))?$/i);
    const forMatch = t.match(/for\s+(.+?)(?:\s+(?:yesterday|today))?$/i);
    const fromMatch = t.match(/from\s+(.+?)(?:\s+(?:yesterday|today))?$/i);

    let itemDesc = '';
    if (onMatch) itemDesc = onMatch[1].trim();
    else if (forMatch) itemDesc = forMatch[1].trim();
    else if (fromMatch) itemDesc = fromMatch[1].trim();
    else {
      // strip amount and direction words
      itemDesc = t.replace(/\$?\d+(?:[.,]\d{1,2})?/, '').replace(/spent|paid|bought|received|got|made|earned|on|for|from|yesterday|today/g, '').trim();
    }

    // Detect account mention
    const accounts = DB.getSettings().accounts;
    let account = '';
    for (const a of accounts) {
      if (t.includes(a.toLowerCase())) { account = a; break; }
    }
    if (!account) {
      if (t.includes('capital one') || t.includes('capital')) account = 'Capital One';
      else if (t.includes('citi')) account = 'Citi';
      else if (t.includes('truliant')) account = 'Truliant Business';
      else if (t.includes('pnc')) account = 'PNC';
    }

    // Detect date
    const today = new Date();
    let date = today.toISOString().split('T')[0];
    if (t.includes('yesterday')) {
      const y = new Date(today); y.setDate(y.getDate() - 1);
      date = y.toISOString().split('T')[0];
    }

    const classified = autoClassify(itemDesc || text, amount);

    return {
      amount,
      description: itemDesc || text,
      section: isIncome ? 'income' : classified.section,
      category: classified.category,
      account,
      date,
      isIncome,
      rawText: text
    };
  }

  return { isSupported, init, start, stop, parseTranscript };
})();

// Voice Modal Controller
const VoiceModal = (() => {
  let parsedData = null;
  let currentYear, currentMonth;

  function open(year, month) {
    currentYear = year;
    currentMonth = month;
    parsedData = null;

    const modal = document.getElementById('voice-modal');
    const transcript = document.getElementById('voice-transcript');
    const parsed = document.getElementById('voice-parsed');
    const actions = document.getElementById('voice-actions');

    transcript.className = 'voice-transcript';
    parsed.className = 'voice-parsed';
    actions.style.display = 'none';
    transcript.textContent = '';
    parsed.textContent = '';

    modal.style.display = 'flex';

    if (!Voice.isSupported()) {
      transcript.className = 'voice-transcript show';
      transcript.textContent = '⚠ Voice recognition is not supported in this browser. Please use Chrome.';
      return;
    }

    startListening();
  }

  function startListening() {
    const btn = document.getElementById('voice-btn');
    btn.classList.add('listening');

    Voice.start((result, error) => {
      if (error) {
        showError(error);
        return;
      }
      const transcriptEl = document.getElementById('voice-transcript');
      transcriptEl.className = 'voice-transcript show';
      transcriptEl.textContent = `"${result.transcript}"`;

      if (result.isFinal) {
        btn.classList.remove('listening');
        parsedData = result.parsed;
        showParsed(result.parsed);
      }
    });
  }

  function showParsed(p) {
    const el = document.getElementById('voice-parsed');
    el.className = 'voice-parsed show';

    const section = p.section === 'income' ? 'Income' :
                    p.section === 'fixedExpenses' ? 'Fixed Expense' :
                    p.section === 'variableExpenses' ? 'Variable Expense' :
                    p.section === 'debt' ? 'Debt Payment' : 'Savings';

    el.innerHTML = `
      <strong>I heard:</strong><br>
      💰 Amount: <strong>${p.amount ? fmt(p.amount) : 'not detected'}</strong><br>
      📁 Type: <strong>${section}</strong><br>
      🏷 Category: <strong>${p.category}</strong><br>
      🏦 Account: <strong>${p.account || 'not specified'}</strong>
    `;
    document.getElementById('voice-actions').style.display = 'flex';
  }

  function showError(err) {
    document.getElementById('voice-btn').classList.remove('listening');
    const el = document.getElementById('voice-transcript');
    el.className = 'voice-transcript show';
    el.textContent = `Error: ${err}. Please try again.`;
  }

  function confirm() {
    if (!parsedData || !parsedData.amount) {
      showToast('Could not parse amount. Try again.', 'error');
      return;
    }
    const m = DB.getMonth(currentYear, currentMonth);
    if (!m) return;

    if (parsedData.section === 'income') {
      DB.addLineItem(currentYear, currentMonth, 'income', {
        source: parsedData.category,
        expected: 0,
        actual: parsedData.amount,
        account: parsedData.account,
        purpose: ''
      });
    } else if (parsedData.section === 'fixedExpenses') {
      DB.addLineItem(currentYear, currentMonth, 'fixedExpenses', {
        category: parsedData.category,
        budget: 0,
        actual: parsedData.amount,
        account: parsedData.account,
        dueDate: ''
      });
    } else {
      DB.addLineItem(currentYear, currentMonth, 'variableExpenses', {
        category: parsedData.category,
        budget: 0,
        actual: parsedData.amount,
        account: parsedData.account
      });
    }

    DB.updateSummary(currentYear, currentMonth);
    close();
    showToast(`✓ Added ${fmt(parsedData.amount)} to ${parsedData.category}`);
    App.render();
  }

  function close() {
    Voice.stop();
    document.getElementById('voice-modal').style.display = 'none';
    document.getElementById('voice-btn').classList.remove('listening');
  }

  function bindEvents() {
    document.getElementById('voice-cancel').onclick = close;
    document.getElementById('voice-confirm').onclick = confirm;
    document.getElementById('voice-retry').onclick = () => {
      document.getElementById('voice-parsed').className = 'voice-parsed';
      document.getElementById('voice-actions').style.display = 'none';
      startListening();
    };
    document.getElementById('voice-modal').onclick = (e) => {
      if (e.target === document.getElementById('voice-modal')) close();
    };
  }

  return { open, close, bindEvents };
})();
