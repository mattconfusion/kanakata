export const screens = {
  home: () => document.getElementById('screen-home'),
  scriptSelect: () => document.getElementById('screen-script-select'),
  quizMode1: () => document.getElementById('screen-quiz-mode-1'),
  quizMode2: () => document.getElementById('screen-quiz-mode-2'),
  quizMode3: () => document.getElementById('screen-quiz-mode-3'),
  overlay: () => document.getElementById('overlay')
};

export function switchScreen(screenId) {
  const screenEntries = Object.entries(screens);
  screenEntries.forEach(([id, getEl]) => {
    const el = getEl();
    if (el) el.classList.remove('active');
  });
  
  const target = screens[screenId]();
  if (target) target.classList.add('active');
}

export function showNotification(message, duration = 3000) {
  const container = document.getElementById('notification-container');
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  
  container.appendChild(notification);
  
  // Force reflow
  notification.offsetHeight;
  
  notification.classList.add('show');
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (container.contains(notification)) {
        container.removeChild(notification);
      }
    }, 300);
  }, duration);
}

export function renderKanaToRomaji(question, scoreboard) {
  const container = document.getElementById('quiz-1-container');
  container.innerHTML = `
    <div class="scoreboard">
      <span>Tier: ${scoreboard.tier}</span>
      <span>Score: ${scoreboard.score}</span>
      <span>Streak: ${scoreboard.streak}</span>
      <span>✓ ${scoreboard.correct}</span>
      <span>✗ ${scoreboard.wrong}</span>
    </div>
    <div class="quiz-card">
      <div class="large-kana">${question.kana}</div>
      <input type="text" id="romaji-input" placeholder="Type romaji..." autocomplete="off" autofocus>
      <div class="nav-buttons" style="width: 100%; gap: 0.5rem;">
          <button class="btn-primary" id="submit-answer" style="flex: 1;">Submit</button>
          <button class="btn-outline hidden" id="reveal-btn" style="flex: 1;">Reveal</button>
      </div>
      <div id="feedback-1" class="feedback hidden"></div>
    </div>
  `;
  
  const input = document.getElementById('romaji-input');
  input.focus();
  // Keep keyboard open on mobile by re-focusing on blur if still on quiz screen
  input.addEventListener('blur', () => {
    if (document.getElementById('romaji-input') && screens.quizMode1().classList.contains('active')) {
        setTimeout(() => input.focus(), 10);
    }
  });
}

export function showRevealButton() {
  const btn = document.getElementById('reveal-btn');
  if (btn) btn.classList.remove('hidden');
}

export function renderRomajiToKana(question, scriptData, scoreboard, composition = []) {
  const container = document.getElementById('quiz-2-container');
  const unlockedKana = scriptData.filter(item => item.tier <= scoreboard.tier);

  // For words, we show placeholders for characters
  let compositionDisplay = '';
  if (composition.length > 0 || (question.kana.length > 1 && !composition.length)) {
    // Simple logic to show built string so far
    compositionDisplay = `<div class="composition-display">${composition.join('')}</div>`;
  }

  container.innerHTML = `
    <div class="scoreboard">
      <span>Tier: ${scoreboard.tier}</span>
      <span>Score: ${scoreboard.score}</span>
      <span>Streak: ${scoreboard.streak}</span>
      <span>✓ ${scoreboard.correct}</span>
      <span>✗ ${scoreboard.wrong}</span>
    </div>
    <div class="quiz-card">
      <div class="romaji-label">${question.phonetic || question.romaji}</div>
      ${compositionDisplay}
      <div id="feedback-2" class="feedback hidden"></div>
      <div class="kana-picker">
        ${unlockedKana.map(item => `<button class="picker-item" data-kana="${item.kana}">${item.kana}</button>`).join('')}
      </div>
    </div>
  `;
}

export function renderNihongoToRomaji(question, scoreboard) {
  const container = document.getElementById('quiz-3-container');
  container.innerHTML = `
    <div class="scoreboard">
      <span>Tier: ${scoreboard.tier}</span>
      <span>Score: ${scoreboard.score}</span>
      <span>Streak: ${scoreboard.streak}</span>
      <span>✓ ${scoreboard.correct}</span>
      <span>✗ ${scoreboard.wrong}</span>
    </div>
    <div class="quiz-card">
      <div class="large-kana">${question.kana}</div>
      <input type="text" id="romaji-input" placeholder="Type romaji..." autocomplete="off" autofocus>
      <div class="nav-buttons" style="width: 100%; gap: 0.5rem;">
          <button class="btn-primary" id="submit-answer" style="flex: 1;">Submit</button>
          <button class="btn-outline hidden" id="reveal-btn" style="flex: 1;">Reveal</button>
      </div>
      <div id="feedback-3" class="feedback hidden"></div>
    </div>
  `;
  const input = document.getElementById('romaji-input');
  input.focus();
  // Keep keyboard open on mobile by re-focusing on blur if still on quiz screen
  input.addEventListener('blur', () => {
    if (document.getElementById('romaji-input') && screens.quizMode3().classList.contains('active')) {
        setTimeout(() => input.focus(), 10);
    }
  });
}

export function renderFeedback(result, feedbackId, showAnswer = false) {
  const feedbackEl = document.getElementById(feedbackId);
  feedbackEl.classList.remove('hidden', 'correct', 'wrong');
  
  if (result.correct) {
    let message = 'Correct! ✓';
    if (result.translation) {
      const transStr = Array.isArray(result.translation) ? result.translation.join(' / ') : result.translation;
      message += ` (${transStr})`;
    }
    if (result.tierUnlocked) {
      message += ' — New Tier Unlocked! 🎉';
    }
    feedbackEl.textContent = message;
    feedbackEl.classList.add('correct');
  } else {
    feedbackEl.textContent = showAnswer 
      ? `Wrong ✗ (Correct was: ${result.correctAnswer} / ${result.kanaAnswer})`
      : 'Wrong ✗ — Try again!';
    feedbackEl.classList.add('wrong');
  }
}

export function renderReferenceTable(scriptData) {
  const grid = document.getElementById('ref-grid');
  grid.innerHTML = scriptData.map(item => {
    const romajiDisplay = item.phonetic ? `${item.phonetic} (${Array.isArray(item.romaji) ? item.romaji.join(', ') : item.romaji})` : item.romaji;
    return `
      <div class="ref-item">
        <span class="kana">${item.kana}</span>
        <span class="romaji">${romajiDisplay}</span>
      </div>
    `;
  }).join('');
}
