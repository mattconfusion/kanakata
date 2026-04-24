export const screens = {
  home: () => document.getElementById('screen-home'),
  scriptSelect: () => document.getElementById('screen-script-select'),
  quizMode1: () => document.getElementById('screen-quiz-mode-1'),
  quizMode2: () => document.getElementById('screen-quiz-mode-2'),
  quizMode3: () => document.getElementById('screen-quiz-mode-3'),
  incremental: () => document.getElementById('screen-incremental'),
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

export function showNotification(message, duration = 3000, type = '') {
  const container = document.getElementById('notification-container');
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
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
    }, 400);
  }, duration);
}

function getKanaFontSize(kana) {
  const len = kana.length;
  if (len <= 1) return 'clamp(4rem, 25vw, 8rem)';
  if (len <= 2) return 'clamp(3.5rem, 20vw, 7rem)';
  if (len <= 4) return 'clamp(2.5rem, 15vw, 5rem)';
  if (len <= 6) return 'clamp(2rem, 12vw, 4rem)';
  return 'clamp(1.5rem, 10vw, 3rem)';
}

export function renderKanaToRomaji(question, scoreboard) {
  const container = document.getElementById('quiz-1-container');
  const fontSize = getKanaFontSize(question.kana);
  container.innerHTML = `
    <div class="scoreboard">
      <span>Tier: ${scoreboard.tier}</span>
      <span>Score: ${scoreboard.score}</span>
      <span>Streak: ${scoreboard.streak}</span>
      <span>✓ ${scoreboard.correct}</span>
      <span>✗ ${scoreboard.wrong}</span>
    </div>
    <div class="quiz-card">
      <div class="large-kana" style="font-size: ${fontSize}">${question.kana}</div>
      <input type="text" id="romaji-input" placeholder="Type romaji..." autocomplete="off" autofocus>
      <div class="nav-buttons" style="width: 100%; gap: 0.5rem;">
          <button class="btn-primary" id="submit-answer" style="flex: 1;">Submit</button>
          <button class="btn-outline hidden" id="reveal-btn" style="flex: 1;">Reveal</button>
      </div>
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

function getRomajiFontSize(romaji) {
  const text = String(romaji);
  const len = text.length;
  if (len <= 4) return 'clamp(2rem, 15vw, 4rem)';
  if (len <= 8) return 'clamp(1.5rem, 10vw, 3rem)';
  if (len <= 12) return 'clamp(1.25rem, 8vw, 2.5rem)';
  return 'clamp(1rem, 6vw, 2rem)';
}

export function renderRomajiToKana(question, scriptData, scoreboard, composition = []) {
  const container = document.getElementById('quiz-2-container');
  const unlockedKana = scriptData.filter(item => item.tier <= scoreboard.tier);

  // Always show composition if there is any, even if just finished
  const compositionDisplay = `<div class="composition-display">${composition.join('')}</div>`;

  const romajiText = question.phonetic || question.romaji;
  const fontSize = getRomajiFontSize(romajiText);

  container.innerHTML = `
    <div class="scoreboard">
      <span>Tier: ${scoreboard.tier}</span>
      <span>Score: ${scoreboard.score}</span>
      <span>Streak: ${scoreboard.streak}</span>
      <span>✓ ${scoreboard.correct}</span>
      <span>✗ ${scoreboard.wrong}</span>
    </div>
    <div class="quiz-card">
      <div class="romaji-label" style="font-size: ${fontSize}">${romajiText}</div>
      ${compositionDisplay}
      <div class="kana-picker">
        ${unlockedKana.map(item => `<button class="picker-item" data-kana="${item.kana}">${item.kana}</button>`).join('')}
      </div>
      <div class="nav-buttons" style="width: 100%; margin-top: 1rem;">
          <button class="btn-outline hidden" id="reveal-btn" style="flex: 1;">Reveal</button>
      </div>
    </div>
  `;
}

export function renderNihongoToRomaji(question, scoreboard) {
  const container = document.getElementById('quiz-3-container');
  const fontSize = getKanaFontSize(question.kana);
  container.innerHTML = `
    <div class="scoreboard">
      <span>Tier: ${scoreboard.tier}</span>
      <span>Score: ${scoreboard.score}</span>
      <span>Streak: ${scoreboard.streak}</span>
      <span>✓ ${scoreboard.correct}</span>
      <span>✗ ${scoreboard.wrong}</span>
    </div>
    <div class="quiz-card">
      <div class="large-kana" style="font-size: ${fontSize}">${question.kana}</div>
      <input type="text" id="romaji-input" placeholder="Type romaji..." autocomplete="off" autofocus>
      <div class="nav-buttons" style="width: 100%; gap: 0.5rem;">
          <button class="btn-primary" id="submit-answer" style="flex: 1;">Submit</button>
          <button class="btn-outline hidden" id="reveal-btn" style="flex: 1;">Reveal</button>
      </div>
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
  if (result.correct) {
    let message = 'Correct! ✓';
    if (result.translation) {
      const transStr = Array.isArray(result.translation) ? result.translation.join(' / ') : result.translation;
      message += ` (${transStr})`;
    }
    if (result.tierUnlocked) {
      message += ' — New Tier Unlocked! 🎉';
    }
    showNotification(message, 2500, 'correct');
  } else {
    const message = showAnswer 
      ? `Wrong ✗ (Correct was: ${result.correctAnswer} / ${result.kanaAnswer})`
      : 'Wrong ✗ — Try again!';
    showNotification(message, 3000, 'wrong');
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
