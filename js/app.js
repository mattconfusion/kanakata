import { hiragana } from '../data/hiragana.js';
import { katakana } from '../data/katakana.js';
import { Quiz } from './quiz.js';
import * as ui from './ui.js';
import { initTheme, toggleTheme } from './theme.js';

let currentQuiz = null;
let currentMode = null; // 1 or 2
let currentScript = 'hiragana'; // Default script for reference if not started

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
      startQuiz();
    });
  });

  document.getElementById('reset-tier').addEventListener('click', () => {
    if (confirm('Reset all progress to Tier 1?')) {
      localStorage.setItem('tierProgress', 1);
      alert('Progress reset to Tier 1.');
    }
  });

  // Global Navigation
  document.getElementById('toggle-theme').addEventListener('click', toggleTheme);
  document.getElementById('go-home').addEventListener('click', () => ui.switchScreen('home'));
  
  document.getElementById('show-reference').addEventListener('click', () => {
    const data = currentScript === 'katakana' ? katakana : hiragana;
    document.getElementById('ref-title').textContent = `${currentScript === 'katakana' ? 'Katakana' : 'Hiragana'} Reference`;
    ui.renderReferenceTable(data);
    ui.screens.overlay().classList.add('active');
  });

  document.getElementById('close-overlay').addEventListener('click', () => {
    ui.screens.overlay().classList.remove('active');
  });

  // Quiz Interaction (Event Delegation)
  document.addEventListener('click', (e) => {
    if (e.target.id === 'submit-answer') {
      handleAnswerSubmit();
    }
    if (e.target.id === 'reveal-btn') {
      handleReveal();
    }
    if (e.target.classList.contains('picker-item')) {
      handlePickerAnswer(e.target.dataset.kana);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && currentMode === 1) {
      handleAnswerSubmit();
    }
  });
});

// --- Quiz Logic ---

function startQuiz() {
  const data = currentScript === 'katakana' ? katakana : hiragana;
  currentQuiz = new Quiz(data);
  nextQuestion();
  ui.switchScreen(currentMode === 1 ? 'quizMode1' : 'quizMode2');
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
  } else {
    const data = currentScript === 'katakana' ? katakana : hiragana;
    ui.renderRomajiToKana(question, data, scoreboard);
  }
}

function handleAnswerSubmit() {
  const input = document.getElementById('romaji-input');
  if (!input || !input.value) return;

  const result = currentQuiz.checkAnswer(input.value);
  ui.renderFeedback(result, 'feedback-1');

  if (result.correct) {
    setTimeout(nextQuestion, 1000);
  } else {
    ui.showRevealButton();
    input.value = '';
    input.focus();
    // In Mode 1, we don't auto-advance on wrong answer if we want them to try again or reveal
  }
}

function handleReveal() {
  const result = { correct: false, correctAnswer: currentQuiz.currentQuestion.romaji, kanaAnswer: currentQuiz.currentQuestion.kana };
  ui.renderFeedback(result, 'feedback-1', true);
  setTimeout(nextQuestion, 2000);
}

function handlePickerAnswer(kana) {
  const result = currentQuiz.checkAnswer(kana);
  ui.renderFeedback(result, 'feedback-2', true);
  
  // Disable picker while showing feedback
  document.querySelectorAll('.picker-item').forEach(btn => btn.disabled = true);
  
  setTimeout(() => {
    nextQuestion();
  }, result.correct ? 1000 : 2000);
}
