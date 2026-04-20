import { hiragana } from '../data/hiragana.js';
import { katakana } from '../data/katakana.js';
import { hiragana_words } from '../data/hiragana_words.js';
import { katakana_words } from '../data/katakana_words.js';
import { phases as hiraganaPhases } from '../data/hiragana_phases.js';
import { phases as katakanaPhases } from '../data/katakana_phases.js';
import { Quiz } from './quiz.js';
import * as ui from './ui.js';
import { initTheme, toggleTheme } from './theme.js';
import * as inc from './incremental.js';
import * as uiInc from './ui_incremental.js';

let currentQuiz = null;
let currentMode = null; // 1, 2, or 3
let currentScript = 'hiragana';
let isWordMode = false;

// --- Incremental mode state ---
const incState = {
  active: false,
  direction: null,   // 'kanaToRomaji' | 'romajiToKana'
  script: null,      // 'hiragana' | 'katakana'
  phases: null,
  progress: null,
  currentQuestion: null,
  lastKana: null,
  isReview: false,
  isMixedReview: false,
  reviewPhase: null,
};

// --- Event Listeners ---

document.addEventListener('DOMContentLoaded', () => {
  initTheme();

  // Home Screen: Mode Selection
  document.querySelectorAll('[data-mode]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      currentMode = parseInt(e.target.dataset.mode);
      ui.switchScreen('scriptSelect');
    });
  });

  // Script Selection
  document.querySelectorAll('[data-script]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      currentScript = e.target.dataset.script;
      if (e.target.dataset.incremental) {
        const direction = currentMode === 2 ? 'romajiToKana' : 'kanaToRomaji';
        startIncrementalModeForScript(currentScript, direction);
      } else {
        isWordMode = !!e.target.dataset.words;
        startQuiz();
      }
    });
  });

  updateTierButtons();
  document.querySelectorAll('.tier-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tier = parseInt(e.target.dataset.tier);
      localStorage.setItem('tierProgress', tier);
      updateTierButtons();
      ui.showNotification(`Tier ${tier} set.`);
    });
  });

  // --- Global Navigation ---
  let lastScrollY = window.scrollY;
  const header = document.querySelector('header');

  window.addEventListener('scroll', () => {
    const quizScreenIds = [
      'screen-quiz-mode-1', 'screen-quiz-mode-2', 'screen-quiz-mode-3', 'screen-incremental'
    ];
    const isQuizActive = quizScreenIds.some(id =>
      document.getElementById(id)?.classList.contains('active')
    );

    if (isQuizActive) {
      if (window.scrollY > lastScrollY && window.scrollY > 50) {
        header.classList.add('header-hidden');
      } else {
        header.classList.remove('header-hidden');
      }
    } else {
      header.classList.remove('header-hidden');
    }
    lastScrollY = window.scrollY;
  });

  document.getElementById('toggle-theme').addEventListener('click', toggleTheme);
  document.getElementById('go-home').addEventListener('click', () => {
    incState.active = false;
    ui.switchScreen('home');
  });

  document.getElementById('show-reference').addEventListener('click', () => {
    const scriptToOpen = incState.active ? incState.script : currentScript;
    openReference(scriptToOpen);
    ui.screens.overlay().classList.add('active');
  });

  document.querySelectorAll('.ref-switch').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const script = e.target.dataset.refScript;
      openReference(script);
    });
  });

  document.getElementById('close-overlay').addEventListener('click', () => {
    ui.screens.overlay().classList.remove('active');
  });

  // Quiz Interaction (Event Delegation)
  document.addEventListener('click', (e) => {
    // Main quiz
    if (e.target.id === 'submit-answer') handleAnswerSubmit();
    if (e.target.id === 'reveal-btn') handleReveal();
    if (e.target.classList.contains('picker-item') && !e.target.classList.contains('inc-picker-item')) {
      handlePickerAnswer(e.target.dataset.kana);
    }

    // Incremental mode
    if (e.target.id === 'inc-submit') handleIncSubmit();
    if (e.target.classList.contains('inc-picker-item')) handleIncPicker(e.target.dataset.incKana);
    if (e.target.id === 'inc-start-drill') startIncDrill();
    if (e.target.id === 'inc-start-mixed-review') startIncMixedReview();
    if (e.target.id === 'inc-next-phase') showIncPhaseMap();

    // Incremental navigation
    const incPhaseEl = e.target.closest('[data-inc-phase]');
    if (incPhaseEl) openIncPhase(parseInt(incPhaseEl.dataset.incPhase));

    const incBackEl = e.target.closest('[data-inc-back]');
    if (incBackEl) handleIncBack(incBackEl.dataset.incBack);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      if (incState.active && incState.direction === 'kanaToRomaji') {
        handleIncSubmit();
      } else if (!incState.active && (currentMode === 1 || currentMode === 3)) {
        handleAnswerSubmit();
      }
    }
  });
});

function updateTierButtons() {
  const current = parseInt(localStorage.getItem('tierProgress')) || 1;
  document.querySelectorAll('.tier-btn').forEach(btn => {
    const active = parseInt(btn.dataset.tier) === current;
    btn.classList.toggle('tier-btn-active', active);
  });
}

// --- Quiz Logic ---

function startQuiz() {
  let data;
  if (isWordMode) {
    data = currentScript === 'katakana' ? katakana_words : hiragana_words;
  } else {
    data = currentScript === 'katakana' ? katakana : hiragana;
  }

  currentQuiz = new Quiz(data, isWordMode);
  nextQuestion();

  if (currentMode === 1) ui.switchScreen('quizMode1');
  else if (currentMode === 2) ui.switchScreen('quizMode2');
  else if (currentMode === 3) ui.switchScreen('quizMode3');
}

function nextQuestion() {
  const question = currentQuiz.generateQuestion();
  const scoreboard = {
    tier: currentQuiz.currentTier,
    streak: currentQuiz.streak,
    score: currentQuiz.score,
    correct: currentQuiz.totalCorrect,
    wrong: currentQuiz.totalWrong
  };

  if (currentMode === 1) {
    ui.renderKanaToRomaji(question, scoreboard);
  } else if (currentMode === 2) {
    const data = currentScript === 'katakana' ? katakana : hiragana;
    ui.renderRomajiToKana(question, data, scoreboard, currentQuiz.composition);
  } else if (currentMode === 3) {
    ui.renderNihongoToRomaji(question, scoreboard);
  }
}

function handleAnswerSubmit() {
  const input = document.getElementById('romaji-input');
  if (!input || !input.value) return;

  const feedbackId = (currentMode === 1 || currentMode === 3) ? 'feedback-1' : 'feedback-2';
  const result = currentQuiz.checkAnswer(input.value, currentMode);
  ui.renderFeedback(result, feedbackId);

  if (result.correct) {
    if (currentMode === 1 || currentMode === 3) {
      setTimeout(nextQuestion, 3000);
    }
  } else {
    ui.showRevealButton();
    input.value = '';
    input.focus();
  }
}

function handleReveal() {
  const feedbackId = (currentMode === 1 || currentMode === 3) ? 'feedback-1' : 'feedback-2';
  const q = currentQuiz.currentQuestion;
  const answer = q.phonetic || (Array.isArray(q.romaji) ? q.romaji[0] : q.romaji);

  const result = {
    correct: false,
    correctAnswer: answer,
    kanaAnswer: q.kana,
    translation: (currentMode === 2 && isWordMode) ? q.kana : null
  };
  ui.renderFeedback(result, feedbackId, true);
  setTimeout(nextQuestion, 3000);
}

function handlePickerAnswer(kana) {
  const result = currentQuiz.checkAnswer(kana, currentMode);

  const data = currentScript === 'katakana' ? katakana : hiragana;
  ui.renderRomajiToKana(currentQuiz.currentQuestion, data, {
    tier: currentQuiz.currentTier,
    streak: currentQuiz.streak,
    score: currentQuiz.score,
    correct: currentQuiz.totalCorrect,
    wrong: currentQuiz.totalWrong
  }, currentQuiz.composition);

  if (result.correct) {
    if (result.complete) {
      ui.renderFeedback(result, null, true);
      setTimeout(nextQuestion, result.tierUnlocked ? 4000 : 3500);
    }
  } else {
    ui.renderFeedback(result, null, true);
    document.querySelectorAll('.picker-item').forEach(btn => btn.disabled = true);
    setTimeout(nextQuestion, 2000);
  }
}

// --- Incremental Mode ---

function startIncrementalModeForScript(script, direction) {
  incState.active = true;
  incState.direction = direction;
  incState.script = script;
  incState.phases = script === 'katakana' ? katakanaPhases : hiraganaPhases;
  incState.progress = inc.loadProgress(script, direction);
  incState.isReview = false;
  ui.switchScreen('incremental');
  showIncPhaseMap();
}

function showIncPhaseMap() {
  incState.isReview = false;
  incState.isMixedReview = false;
  uiInc.renderPhaseMap(incState.phases, incState.progress);
}

function openIncPhase(phaseId) {
  const phase = incState.phases.find(p => p.id === phaseId);
  if (!phase) return;

  const isActivePhase = phaseId === incState.progress.currentPhase &&
    !incState.progress.completedPhases.includes(phaseId);

  incState.isMixedReview = false;
  if (isActivePhase) {
    incState.isReview = false;
    if (incState.progress.stage === 'intro') {
      uiInc.renderIntroCard(phase, false);
    } else {
      incNextQuestion();
    }
  } else {
    incState.isReview = true;
    incState.reviewPhase = phase;
    incState.lastKana = null;
    uiInc.renderIntroCard(phase, true);
  }
}

function startIncDrill() {
  if (incState.isReview) {
    incState.lastKana = null;
    incNextQuestion();
    return;
  }
  incState.progress.stage = 'drill';
  inc.saveProgress(incState.script, incState.direction, incState.progress);
  incNextQuestion();
}

function startIncMixedReview() {
  incState.isReview = true;
  incState.isMixedReview = true;
  incState.lastKana = null;
  incNextQuestion();
}

function incNextQuestion() {
  if (incState.isReview) {
    let q;
    if (incState.isMixedReview) {
      const unlocked = inc.getUnlockedSymbols(incState.progress, incState.phases, incState.reviewPhase.id);
      q = inc.generateMixedQuestion(unlocked, incState.progress.symbolStats, incState.lastKana);
    } else {
      q = inc.generateDrillQuestion(incState.reviewPhase, incState.progress.symbolStats, incState.lastKana);
    }
    incState.currentQuestion = q;
    incState.lastKana = q.kana;
    renderIncQuiz(q);
    return;
  }

  const phase = incState.phases.find(p => p.id === incState.progress.currentPhase);
  if (!phase) return;

  let q;
  if (incState.progress.stage === 'drill') {
    q = inc.generateDrillQuestion(phase, incState.progress.symbolStats, incState.lastKana);
  } else {
    const unlocked = inc.getUnlockedSymbols(incState.progress, incState.phases);
    q = inc.generateMixedQuestion(unlocked, incState.progress.symbolStats, incState.lastKana);
  }
  incState.currentQuestion = q;
  incState.lastKana = q.kana;
  renderIncQuiz(q);
}

function renderIncQuiz(question) {
  const fakeProgress = incState.isReview
    ? {
        stage: incState.isMixedReview ? 'mixed' : 'review',
        drillCorrect: 0,
        mixedAnswers: 0,
        mixedCorrect: 0
      }
    : incState.progress;

  if (incState.direction === 'kanaToRomaji') {
    uiInc.renderKanaToRomajiQuiz(question, fakeProgress, incState.isReview);
  } else {
    let pickerSymbols;
    if (incState.isReview) {
      if (incState.isMixedReview) {
        pickerSymbols = inc.getUnlockedSymbols(incState.progress, incState.phases, incState.reviewPhase.id);
      } else {
        pickerSymbols = incState.reviewPhase.symbols;
      }
    } else if (incState.progress.stage === 'drill') {
      pickerSymbols = incState.phases.find(p => p.id === incState.progress.currentPhase).symbols;
    } else {
      pickerSymbols = inc.getUnlockedSymbols(incState.progress, incState.phases);
    }
    uiInc.renderRomajiToKanaQuiz(question, pickerSymbols, fakeProgress, incState.isReview);
  }
}

function handleIncSubmit() {
  const input = document.getElementById('inc-romaji-input');
  if (!input || !input.value.trim()) return;

  const answer = input.value.trim().toLowerCase();
  const correct = answer === incState.currentQuestion.romaji.toLowerCase();
  processIncAnswer(correct);
  if (!correct) {
    input.value = '';
    input.focus();
  }
}


function handleIncPicker(kana) {
  const correct = kana === incState.currentQuestion.kana;
  processIncAnswer(correct);
}

function processIncAnswer(correct) {
  const q = incState.currentQuestion;

  const delay = correct ? 1800 : 2500;

  if (correct) {
    ui.showNotification(`Correct! ${q.kana} = ${q.romaji}`, 1800, 'correct');
  } else {
    ui.showNotification(`Wrong — ${q.kana} = ${q.romaji}`, 2500, 'wrong');
  }

  if (incState.isReview) {
    setTimeout(incNextQuestion, delay);
    return;
  }

  inc.recordAnswer(q.kana, correct, incState.progress);
  const { MIXED_ACCURACY_THRESHOLD } = inc.getDrillConstants();

  if (incState.progress.stage === 'drill' && inc.isDrillComplete(incState.progress)) {
    inc.advanceToMixed(incState.progress);
    inc.saveProgress(incState.script, incState.direction, incState.progress);
    ui.showNotification('Drill complete! Now mixed review…', 2500);
    setTimeout(incNextQuestion, delay);
    return;
  }

  if (incState.progress.stage === 'mixed' && inc.isMixedRoundDone(incState.progress)) {
    const accuracy = inc.getMixedAccuracy(incState.progress);
    if (accuracy >= MIXED_ACCURACY_THRESHOLD) {
      const phase = incState.phases.find(p => p.id === incState.progress.currentPhase);
      const stats = {
        attempts: incState.progress.mixedAnswers,
        correct: incState.progress.mixedCorrect,
      };
      const isLast = incState.progress.currentPhase >= incState.phases.length;
      inc.advancePhase(incState.progress, incState.phases);
      inc.saveProgress(incState.script, incState.direction, incState.progress);
      setTimeout(() => uiInc.renderPhaseComplete(phase, stats, isLast), delay);
      return;
    } else {
      const score = incState.progress.mixedCorrect;
      inc.resetMixedRound(incState.progress);
      inc.saveProgress(incState.script, incState.direction, incState.progress);
      ui.showNotification(`${score}/20 — need 80% to pass. Try again!`, 3000, 'wrong');
      setTimeout(incNextQuestion, delay);
      return;
    }
  }

  inc.saveProgress(incState.script, incState.direction, incState.progress);
  setTimeout(incNextQuestion, correct ? 1800 : 2500);
}

function handleIncBack(target) {
  if (target === 'map') {
    incState.isReview = false;
    showIncPhaseMap();
  } else if (target === 'script') {
    incState.active = false;
    ui.switchScreen('scriptSelect');
  }
}

function openReference(script) {
  let data;
  const isWords = !incState.active && isWordMode;
  
  if (isWords) {
    data = script === 'katakana' ? katakana_words : hiragana_words;
  } else {
    data = script === 'katakana' ? katakana : hiragana;
  }

  document.getElementById('ref-title').textContent = `${script.charAt(0).toUpperCase() + script.slice(1)} ${isWords ? 'Words' : ''} Reference`;
  
  // Highlight active button
  document.querySelectorAll('.ref-switch').forEach(btn => {
    btn.classList.toggle('btn-primary', btn.dataset.refScript === script);
    btn.classList.toggle('btn-outline', btn.dataset.refScript !== script);
  });
  
  ui.renderReferenceTable(data);
}
