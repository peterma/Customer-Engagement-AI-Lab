// --- Constants ---
const ESCALATION_KEYWORDS = [
    "scam", "stolen", "urgent", "not working", "fraud", "emergency", "locked", "security",
    "panic", "chargeback", "hold", "verification"
  ];
  const BOT_NAME = "Support Bot";
  const HUMAN_NAME = "Mary from Customer Care";
  const ESCALATION_WAIT_TIME = 5 * 60; // 5 minutes in seconds
  
  const GLOSSARY = {
    "chargeback": "A chargeback is a refund requested by your bank for a disputed transaction.",
    "hold": "A hold means your funds are temporarily unavailable, often for verification or security checks.",
    "verification": "Verification is the process of confirming your identity or transaction details for security."
  };
  
  // --- DOM Elements ---
  const chatHistory = document.getElementById('chat-history');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const escalateBtn = document.getElementById('escalate-btn');
  const progressIndicator = document.getElementById('progress-indicator');
  const downloadBtn = document.getElementById('download-summary-btn');
  const callbackOptions = document.getElementById('callback-options');
  const callbackNowBtn = document.getElementById('callback-now-btn');
  const callbackLaterBtn = document.getElementById('callback-later-btn');
  const glossaryTooltip = document.getElementById('glossary-tooltip');
  const schedulePicker = document.getElementById('schedule-picker');
  const callbackDatetime = document.getElementById('callback-datetime');
  const confirmScheduleBtn = document.getElementById('confirm-schedule-btn');
  const moduleDescription = document.getElementById('module-description');
  const toggleDescriptionBtn = document.getElementById('toggle-description-btn');
  const moduleDescriptionContent = document.getElementById('module-description-content');
  const toggleDescriptionIcon = document.getElementById('toggle-description-icon');
  const toggleDescriptionIconBtn = document.getElementById('toggle-description-icon-btn');
  
  // --- State ---
  let chat = [];
  let escalated = false;
  let escalationStart = null;
  let escalationTimer = null;
  
  // --- LocalStorage Helpers ---
  function saveChat() {
    localStorage.setItem('margaret_support_chat', JSON.stringify(chat));
    localStorage.setItem('margaret_support_escalated', JSON.stringify(escalated));
    localStorage.setItem('margaret_support_escalation_start', escalationStart ? escalationStart.toString() : "");
  }
  function loadChat() {
    chat = JSON.parse(localStorage.getItem('margaret_support_chat') || '[]');
    escalated = JSON.parse(localStorage.getItem('margaret_support_escalated') || 'false');
    const start = localStorage.getItem('margaret_support_escalation_start');
    escalationStart = start ? parseInt(start) : null;
  }
  
  // --- UI Helpers ---
  function renderChat() {
    chatHistory.innerHTML = '';
    chat.forEach(msg => {
      const div = document.createElement('div');
      div.className = `message ${msg.role}`;
      div.innerHTML = addGlossaryTooltips(`<span>${msg.text}</span>`) +
        (msg.timestamp ? `<div style="font-size:0.7em;color:#888;">${msg.timestamp}</div>` : '');
      chatHistory.appendChild(div);
    });
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }
  
  function showProgress(text) {
    progressIndicator.textContent = text;
  }
  function clearProgress() {
    progressIndicator.textContent = '';
  }
  
  // --- Glossary Tooltip Logic ---
  function addGlossaryTooltips(html) {
    // Replace glossary terms with <span> that shows tooltip on hover/click
    Object.keys(GLOSSARY).forEach(term => {
      const regex = new RegExp(`\\b(${term})\\b`, 'gi');
      html = html.replace(regex, `<span class="glossary-term" tabindex="0" data-term="$1">$1</span>`);
    });
    return html;
  }
  
  chatHistory.addEventListener('mouseover', showGlossaryTooltip);
  chatHistory.addEventListener('focusin', showGlossaryTooltip);
  chatHistory.addEventListener('mouseout', hideGlossaryTooltip);
  chatHistory.addEventListener('focusout', hideGlossaryTooltip);
  
  function showGlossaryTooltip(e) {
    const target = e.target.closest('.glossary-term');
    if (target && GLOSSARY[target.textContent.toLowerCase()]) {
      glossaryTooltip.textContent = GLOSSARY[target.textContent.toLowerCase()];
      glossaryTooltip.style.display = 'block';
      const rect = target.getBoundingClientRect();
      glossaryTooltip.style.top = (window.scrollY + rect.bottom + 6) + 'px';
      glossaryTooltip.style.left = (window.scrollX + rect.left) + 'px';
    }
  }
  function hideGlossaryTooltip() {
    glossaryTooltip.style.display = 'none';
  }
  
  // --- Chatbot Logic ---
  function botReply(userText) {
    // Escalation logic
    if (ESCALATION_KEYWORDS.some(word => userText.toLowerCase().includes(word))) {
      escalateToHuman("I see this is urgent. Let me connect you to a real person right away.");
      return;
    }
  
    // Simulate bot responses
    let reply;
    if (userText.toLowerCase().includes("hello") || userText.toLowerCase().includes("hi")) {
      reply = "Hello Margaret! How can I help you today?";
    } else if (userText.toLowerCase().includes("password")) {
      reply = "If you need to reset your password, I can guide you step by step. Would you like to proceed?";
    } else if (userText.toLowerCase().includes("thank")) {
      reply = "You're very welcome! If you need anything else, just let me know.";
    } else if (userText.toLowerCase().includes("chargeback")) {
      reply = "A chargeback is a refund requested by your bank for a disputed transaction.";
    } else if (userText.toLowerCase().includes("hold")) {
      reply = "A hold means your funds are temporarily unavailable, often for verification or security checks.";
    } else if (userText.toLowerCase().includes("verification")) {
      reply = "Verification is the process of confirming your identity or transaction details for security.";
    } else {
      reply = "Thank you, Margaret—we’re on it. If you need to speak to a real person, just click 'Speak to a Human' below.";
    }
    addMessage('bot', reply);
  }
  
  function escalateToHuman(acknowledgeText) {
    if (escalated) return;
    escalated = true;
    escalationStart = Date.now();
    addMessage('bot', acknowledgeText || "Connecting you to a real person…");
    showProgress("Escalating to human support… Estimated wait: 5:00 minutes");
    saveChat();
    startEscalationTimer();
  
    setTimeout(() => {
      addMessage('bot', "Thanks, Margaret. A real person is reviewing this now. We’ll update you shortly.");
      addMessage('human', `Hi Margaret, this is ${HUMAN_NAME}. I’m here to help you. How can I assist? (You can also request a callback below.)`);
      showProgress("You are now chatting with a real person.");
      callbackOptions.style.display = "flex";
      saveChat();
    }, 5000); // Simulate 5 seconds for demo; in real, would be up to 5 minutes
  }
  
  function startEscalationTimer() {
    if (escalationTimer) clearInterval(escalationTimer);
    escalationTimer = setInterval(() => {
      if (!escalationStart) return;
      const elapsed = Math.floor((Date.now() - escalationStart) / 1000);
      const remaining = Math.max(0, ESCALATION_WAIT_TIME - elapsed);
      const min = String(Math.floor(remaining / 60)).padStart(1, '0');
      const sec = String(remaining % 60).padStart(2, '0');
      if (remaining > 0 && !document.querySelector('.message.human')) {
        showProgress(`Escalating to human support… Estimated wait: ${min}:${sec} minutes`);
      } else {
        clearInterval(escalationTimer);
      }
    }, 1000);
  }
  
  // --- Message Handling ---
  function addMessage(role, text) {
    const timestamp = new Date().toLocaleString();
    chat.push({ role, text, timestamp });
    saveChat();
    renderChat();
  }
  
  // --- Download Chat Summary ---
  downloadBtn.addEventListener('click', () => {
    let summary = "Support Chat Summary\n\n";
    chat.forEach(msg => {
      summary += `[${msg.timestamp}] ${msg.role === 'user' ? 'You' : msg.role === 'bot' ? BOT_NAME : HUMAN_NAME}: ${msg.text}\n`;
    });
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'support_chat_summary.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
  
  // --- Callback Options ---
  callbackNowBtn.addEventListener('click', () => {
    addMessage('human', "We'll call you right away at your registered number. Please keep your phone nearby.");
    callbackOptions.style.display = "none";
  });
  callbackLaterBtn.addEventListener('click', () => {
    schedulePicker.style.display = "block";
  });

  confirmScheduleBtn.addEventListener('click', () => {
    const dt = callbackDatetime.value;
    if (dt) {
      const dateObj = new Date(dt);
      addMessage('human', `Your callback is scheduled for ${dateObj.toLocaleString()}. We'll call you then!`);
      schedulePicker.style.display = "none";
      callbackOptions.style.display = "none";
      callbackDatetime.value = "";
    } else {
      alert("Please select a date and time for your callback.");
    }
  });
  
  // --- Event Listeners ---
  chatForm.addEventListener('submit', e => {
    e.preventDefault();
    const userText = chatInput.value.trim();
    if (!userText) return;
    addMessage('user', userText);
    chatInput.value = '';
    renderChat();
    showProgress("Processing…");
    setTimeout(() => {
      clearProgress();
      if (!escalated) botReply(userText);
    }, 800);
  });
  
  escalateBtn.addEventListener('click', () => {
    if (!escalated) {
      escalateToHuman("Thanks, Margaret—we’re on it. Connecting you to a real person now.");
    }
  });
  
  // --- Accessibility: Focus chat on new message ---
  const observer = new MutationObserver(() => {
    chatHistory.focus();
  });
  observer.observe(chatHistory, { childList: true });

  // Collapsible module description logic
  if (moduleDescription && toggleDescriptionBtn && moduleDescriptionContent && toggleDescriptionIcon && toggleDescriptionIconBtn) {
    moduleDescription.setAttribute('aria-collapsed', 'false');
    toggleDescriptionBtn.addEventListener('click', () => {
      const collapsed = moduleDescription.getAttribute('aria-collapsed') === 'true';
      moduleDescription.setAttribute('aria-collapsed', collapsed ? 'false' : 'true');
      toggleDescriptionBtn.setAttribute('aria-expanded', collapsed ? 'true' : 'false');
      toggleDescriptionIcon.textContent = collapsed ? '▼' : '►';
    });
    toggleDescriptionIconBtn.addEventListener('click', () => {
      moduleDescription.setAttribute('aria-collapsed', 'false');
      toggleDescriptionBtn.setAttribute('aria-expanded', 'true');
      toggleDescriptionIcon.textContent = '▼';
    });
  }
  
  // --- Initialization ---
  function init() {
    loadChat();
    renderChat();
    if (escalated) {
      showProgress("You are now chatting with a real person.");
      callbackOptions.style.display = "flex";
      startEscalationTimer();
    }
  }
  init();