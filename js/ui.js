export const screens = {
  home: () => document.getElementById('screen-home'),
  scriptSelect: () => document.getElementById('screen-script-select'),
  quizMode1: () => document.getElementById('screen-quiz-mode-1'),
  quizMode2: () => document.getElementById('screen-quiz-mode-2'),
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

export function renderKanaToRomaji(question, scoreboard) {
  const container = document.getElementById('quiz-1-container');
  container.innerHTML = `
    <div class="scoreboard">
      <div>Tier: ${scoreboard.tier} | Score: ${scoreboard.score}</div>
      <div>Streak: ${scoreboard.streak} | Correct: ${scoreboard.correct} | Wrong: ${scoreboard.wrong}</div>
    </div>
    <div class="quiz-card">
      <div class="large-kana">${question.kana}</div>
      <input type="text" id="romaji-input" placeholder="Type romaji..." autocomplete="off">
      <div class="nav-buttons" style="width: 100%; gap: 0.5rem;">
          <button class="btn-primary" id="submit-answer" style="flex: 1;">Submit</button>
          <button class="btn-outline hidden" id="reveal-btn" style="flex: 1;">Reveal</button>
      </div>
      <div id="feedback-1" class="feedback hidden"></div>
    </div>
  `;
  document.getElementById('romaji-input').focus();
}

export function showRevealButton() {
  const btn = document.getElementById('reveal-btn');
  if (btn) btn.classList.remove('hidden');
}

export function renderRomajiToKana(question, scriptData, scoreboard) {
  const container = document.getElementById('quiz-2-container');
  const unlockedKana = scriptData.filter(item => item.tier <= scoreboard.tier);

  container.innerHTML = `
    <div class="scoreboard">
      <div>Tier: ${scoreboard.tier} | Score: ${scoreboard.score}</div>
      <div>Streak: ${scoreboard.streak} | Correct: ${scoreboard.correct} | Wrong: ${scoreboard.wrong}</div>
    </div>
    <div class="quiz-card">
      <div class="romaji-label">${question.romaji}</div>
      <div id="feedback-2" class="feedback hidden"></div>
      <div class="kana-picker">
        ${unlockedKana.map(item => `<button class="picker-item" data-kana="${item.kana}">${item.kana}</button>`).join('')}
      </div>
    </div>
  `;
}

export function renderFeedback(result, feedbackId, showAnswer = false) {
  const feedbackEl = document.getElementById(feedbackId);
  feedbackEl.classList.remove('hidden', 'correct', 'wrong');
  
  if (result.correct) {
    let message = 'Correct! ✓';
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
  grid.innerHTML = scriptData.map(item => `
    <div class="ref-item">
      <span class="kana">${item.kana}</span>
      <span class="romaji">${item.romaji}</span>
    </div>
  `).join('');
}
