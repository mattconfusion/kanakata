import { showNotification } from './ui.js';

const getContainer = () => document.getElementById('incremental-container');

export function renderPhaseMap(phases, progress) {
  const items = phases.map(phase => {
    const isCompleted = progress.completedPhases.includes(phase.id);
    const isCurrent = phase.id === progress.currentPhase && !isCompleted;
    const isLocked = phase.id > progress.currentPhase;

    let statusClass = 'locked';
    if (isCompleted) statusClass = 'completed';
    else if (isCurrent) statusClass = 'current';

    const accuracy = isCompleted ? getAccuracyLabel(phase.id, progress.phaseStats) : null;
    const symbolPreview = phase.symbols.slice(0, 5).map(s => s.kana).join(' ');

    let hint = '';
    if (isCurrent) hint = `<div class="phase-hint">${progress.stage === 'intro' ? 'Start' : 'Continue'} →</div>`;
    else if (isCompleted) hint = `<div class="phase-hint">Review →</div>`;
    else hint = `<div class="phase-hint">Preview →</div>`;

    return `
      <div class="phase-card ${statusClass}" data-inc-phase="${phase.id}" role="button" tabindex="0">
        <div class="phase-number">${phase.id}</div>
        <div class="phase-info">
          <div class="phase-label">${phase.label}</div>
          <div class="phase-symbols-preview">${symbolPreview}${phase.symbols.length > 5 ? '…' : ''}</div>
          ${accuracy !== null ? `<div class="phase-accuracy">${accuracy}% accuracy</div>` : ''}
        </div>
        ${hint}
      </div>
    `;
  }).join('');

  getContainer().innerHTML = `
    <h1>Phase Map</h1>
    <div class="phase-map">${items}</div>
    <button class="btn-outline" data-inc-back="script" style="margin-top: 0.5rem;">← Back to Kana Select</button>
  `;
}

function getAccuracyLabel(phaseId, phaseStats) {
  const s = phaseStats[phaseId];
  if (!s || s.attempts === 0) return 100;
  return Math.round((s.correct / s.attempts) * 100);
}

export function renderIntroCard(phase, isReview = false) {
  const symbolCards = phase.symbols.map(s => `
    <div class="intro-symbol-card">
      <span class="kana">${s.kana}</span>
      <span class="romaji">${s.romaji}</span>
    </div>
  `).join('');

  const title = isReview ? `Review — Phase ${phase.id}` : `Phase ${phase.id} — ${phase.label}`;
  const btnLabel = isReview ? 'Start Review' : 'Start Drill';

  getContainer().innerHTML = `
    <h1 style="margin-bottom: 0.25rem;">${title}</h1>
    <p style="color: var(--text-secondary); font-size: 0.875rem; text-align: center; margin-bottom: 1rem;">
      ${isReview ? 'Practice these symbols.' : 'Study these symbols, then drill them.'}
    </p>
    <div class="intro-symbols-grid">${symbolCards}</div>
    <button class="btn-primary" id="inc-start-drill" style="width: 100%; max-width: 500px; margin-top: 1rem;">${btnLabel}</button>
    ${phase.id > 1 ? `<button class="btn-outline" id="inc-start-mixed-review" style="width: 100%; max-width: 500px; margin-top: 0.5rem;">Mixed Review (Phases 1-${phase.id})</button>` : ''}
    <button class="btn-outline" data-inc-back="map" style="margin-top: 0.5rem;">← Back to Map</button>
  `;
}

function stageHeader(progress, isReview) {
  if (isReview) {
    const label = progress.stage === 'mixed' ? 'Mixed Review' : 'Review';
    return `<div class="stage-indicator">
      <span class="stage-badge" style="background-color: var(--text-secondary);">${label}</span>
    </div>`;
  }
  if (progress.stage === 'drill') {
    return `<div class="stage-indicator">
      <span class="stage-badge">Stage 2 — Drill</span>
      <span class="stage-progress-text">${progress.drillCorrect} / 10 correct</span>
    </div>`;
  }
  const pct = progress.mixedAnswers > 0
    ? Math.round((progress.mixedCorrect / progress.mixedAnswers) * 100)
    : 0;
  return `<div class="stage-indicator">
    <span class="stage-badge" style="background-color: var(--success-color);">Stage 3 — Mixed</span>
    <span class="stage-progress-text">${progress.mixedAnswers} / 20 | ${pct}%</span>
  </div>`;
}

export function renderKanaToRomajiQuiz(question, progress, isReview) {
  const kanaLen = question.kana.length;
  const fontSize = kanaLen <= 1 ? 'clamp(4rem, 25vw, 8rem)'
    : kanaLen <= 2 ? 'clamp(3.5rem, 20vw, 7rem)'
    : 'clamp(2.5rem, 15vw, 5rem)';

  getContainer().innerHTML = `
    ${stageHeader(progress, isReview)}
    <div class="quiz-card">
      <div class="large-kana" style="font-size: ${fontSize}">${question.kana}</div>
      <input type="text" id="inc-romaji-input" placeholder="Type romaji…" autocomplete="off" autofocus>
      <div class="nav-buttons" style="width: 100%; gap: 0.5rem; margin-top: 0.5rem;">
          <button class="btn-primary" id="inc-submit" style="flex: 1;">Submit</button>
          <button class="btn-outline hidden" id="inc-reveal-btn" style="flex: 1;">Reveal</button>
      </div>
    </div>
    <button class="btn-outline" data-inc-back="map" style="margin-top: 0.5rem; font-size: 0.875rem;">← Map</button>
  `;

  const input = document.getElementById('inc-romaji-input');
  if (input) {
    input.focus();
    input.addEventListener('blur', () => {
      const screen = document.getElementById('screen-incremental');
      if (document.getElementById('inc-romaji-input') && screen?.classList.contains('active')) {
        setTimeout(() => input.focus(), 10);
      }
    });
  }
}

export function renderRomajiToKanaQuiz(question, pickerSymbols, progress, isReview) {
  const romajiText = question.romaji;
  const len = String(romajiText).length;
  const fontSize = len <= 4 ? 'clamp(2rem, 15vw, 4rem)'
    : len <= 8 ? 'clamp(1.5rem, 10vw, 3rem)'
    : 'clamp(1.25rem, 8vw, 2.5rem)';

  const pickerButtons = pickerSymbols.map(s =>
    `<button class="picker-item inc-picker-item" data-inc-kana="${s.kana}">${s.kana}</button>`
  ).join('');

  getContainer().innerHTML = `
    ${stageHeader(progress, isReview)}
    <div class="quiz-card">
      <div class="romaji-label" style="font-size: ${fontSize}">${romajiText}</div>
      <div class="kana-picker">${pickerButtons}</div>
      <div class="nav-buttons" style="width: 100%; margin-top: 1rem;">
          <button class="btn-outline hidden" id="inc-reveal-btn" style="flex: 1;">Reveal</button>
      </div>
    </div>
    <button class="btn-outline" data-inc-back="map" style="margin-top: 0.5rem; font-size: 0.875rem;">← Map</button>
  `;
}

export function renderPhaseComplete(phase, stats, isLast) {
  const accuracy = stats.attempts > 0 ? Math.round((stats.correct / stats.attempts) * 100) : 100;

  getContainer().innerHTML = `
    <div class="quiz-card phase-complete-card">
      <div class="phase-complete-title">Phase ${phase.id} Complete!</div>
      <div class="phase-complete-stats">${stats.correct} / ${stats.attempts} correct (${accuracy}%)</div>
      ${isLast
        ? `<p style="color: var(--text-secondary); font-weight: 600;">You've completed all phases!</p>`
        : `<button class="btn-primary" id="inc-next-phase" style="width: 100%;">Next Phase →</button>`
      }
      <button class="btn-outline" data-inc-back="map" style="width: 100%; margin-top: 0.5rem;">Back to Map</button>
    </div>
  `;
}

export { showNotification };
