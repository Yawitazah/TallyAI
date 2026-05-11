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
    recognition.onresult = async (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
      const isFinal = e.results[e.results.length - 1].isFinal;
      if (isFinal) {
        const parsed = await parseTranscript(transcript);
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

  async function parseTranscript(text) {
    const settings = DB.getSettings();
    const cfg = settings.aiConfig || {};
    const provider = cfg.provider || 'claude';
    const apiKey = provider === 'openai' ? cfg.openaiApiKey : cfg.aiApiKey;

    if (apiKey) {
      try {
        const resp = await fetch('/api/voice/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcript: text,
            apiKey,
            provider,
            accounts: settings.accounts || []
          })
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data.amount) {
            const today = new Date();
            let date = today.toISOString().split('T')[0];
            if (text.toLowerCase().includes('yesterday')) {
              const y = new Date(today); y.setDate(y.getDate() - 1);
              date = y.toISOString().split('T')[0];
            }
            return {
              amount: data.amount,
              description: data.description || text,
              section: data.section || 'variableExpenses',
              category: data.category || 'Other',
              account: data.account || '',
              date,
              isIncome: data.section === 'income',
              rawText: text
            };
          }
        }
      } catch (e) {
        // fall through to regex
      }
    }

    return parseTranscriptRegex(text);
  }

  function parseTranscriptRegex(text) {
    const t = text.toLowerCase().trim();

    // Extract amount — handles STT decimal artifacts before standard patterns
    // e.g. "24 or 45" / "24 and 45" → $24.45 (speech-to-text says "or"/"and" for the decimal point)
    let amount = null;
    let amtMatch;
    // Priority 1: explicit $ sign  "$24.45" or "$ 24 45"
    amtMatch = t.match(/\$\s*(\d+(?:[.,]\d{1,2})?)/);
    if (amtMatch) {
      amount = parseFloat(amtMatch[1].replace(',', '.'));
    }
    // Priority 2: spoken decimal artifacts  "24 or 45"  "24 and 45"
    if (!amount) {
      amtMatch = t.match(/\b(\d{1,5})\s+(?:or|and)\s+(\d{2})\b/);
      if (amtMatch) amount = parseFloat(`${amtMatch[1]}.${amtMatch[2]}`);
    }
    // Priority 3: standard decimal  "24.45"  "24,45"
    if (!amount) {
      amtMatch = t.match(/\b(\d+[.,]\d{1,2})\b/);
      if (amtMatch) amount = parseFloat(amtMatch[1].replace(',', '.'));
    }
    // Priority 4: two bare numbers after a spend verb  "spent 24 45"  "paid 24 45"
    if (!amount) {
      amtMatch = t.match(/(?:spent|paid|cost|bought|charged|owe)\s+(\d{1,5})\s+(\d{2})\b/);
      if (amtMatch) amount = parseFloat(`${amtMatch[1]}.${amtMatch[2]}`);
    }
    // Priority 5: plain integer fallback
    if (!amount) {
      amtMatch = t.match(/\b(\d+)\b/);
      if (amtMatch) amount = parseFloat(amtMatch[1]);
    }

    const isIncome = /received|got|made|earned|income|paid me|deposited|salary|paycheck|bonus/.test(t);

    let itemDesc = '';
    const onMatch = t.match(/on\s+(.+?)(?:\s+(?:yesterday|today|this week|last week|monday|tuesday|wednesday|thursday|friday|saturday|sunday))?$/i);
    const forMatch = t.match(/for\s+(.+?)(?:\s+(?:yesterday|today))?$/i);
    const fromMatch = t.match(/from\s+(.+?)(?:\s+(?:yesterday|today))?$/i);
    if (onMatch) itemDesc = onMatch[1].trim();
    else if (forMatch) itemDesc = forMatch[1].trim();
    else if (fromMatch) itemDesc = fromMatch[1].trim();
    else {
      itemDesc = t.replace(/\$?\d+(?:[.,]\d{1,2})?/, '').replace(/spent|paid|bought|received|got|made|earned|on|for|from|yesterday|today/g, '').trim();
    }

    const accounts = [...DB.getSettings().accounts].sort((a, b) => b.length - a.length);
    let account = '';
    for (const a of accounts) {
      if (t.includes(a.toLowerCase())) { account = a; break; }
    }
    if (!account) {
      const acctFallbacks = [
        ['bank of america', 'Bank of America'],
        ['american express', 'Amex'],
        ['wells fargo', 'Wells Fargo'],
        ['capital one', 'Capital One'],
        ['apple card', 'Apple'],
        ['apple pay', 'Apple'],
        ['cash app', 'Cash App'],
        ['truliant', 'Truliant Business'],
        ['discover', 'Discover'],
        ['paypal', 'PayPal'],
        ['venmo', 'Venmo'],
        ['zelle', 'Zelle'],
        ['chase', 'Chase'],
        ['capital', 'Capital One'],
        ['amex', 'Amex'],
        ['citi', 'Citi'],
        ['pnc', 'PNC'],
      ];
      for (const [kw, name] of acctFallbacks) {
        if (t.includes(kw)) { account = name; break; }
      }
    }

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
