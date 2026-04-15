import { hiragana } from '../data/hiragana.js';
import { katakana } from '../data/katakana.js';
import { hiragana_words } from '../data/hiragana_words.js';
import { katakana_words } from '../data/katakana_words.js';
import { Quiz } from './quiz.js';
import * as ui from './ui.js';
import { initTheme, toggleTheme } from './theme.js';

let currentQuiz = null;
let currentMode = null; // 1 or 2
let currentScript = 'hiragana'; 
let isWordMode = false;

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
      isWordMode = !!e.target.dataset.words; // Set isWordMode based on the attribute
      startQuiz();
    });
  });

  document.getElementById('reset-tier').addEventListener('click', () => {
    if (confirm('Reset all progress to Tier 1?')) {
      localStorage.setItem('tierProgress', 1);
      ui.showNotification('Progress reset to Tier 1.');
    }
  });

// --- Global Navigation ---
  let lastScrollY = window.scrollY;
  const header = document.querySelector('header');

  window.addEventListener('scroll', () => {
    const isQuizActive = ['screen-quiz-mode-1', 'screen-quiz-mode-2', 'screen-quiz-mode-3'].some(id => 
      document.getElementById(id).classList.contains('active')
    );

    if (isQuizActive) {
      if (window.scrollY > lastScrollY && window.scrollY > 50) {
        // Scrolling down
        header.classList.add('header-hidden');
      } else {
        // Scrolling up
        header.classList.remove('header-hidden');
      }
    } else {
      // Ensure header is visible on non-quiz screens
      header.classList.remove('header-hidden');
    }
    lastScrollY = window.scrollY;
  });

  document.getElementById('toggle-theme').addEventListener('click', toggleTheme);
  document.getElementById('go-home').addEventListener('click', () => ui.switchScreen('home'));
  
  document.getElementById('show-reference').addEventListener('click', () => {
    let data;
    if (currentMode === 3) {
      data = currentScript === 'katakana' ? katakana_words : hiragana_words;
    } else {
      data = currentScript === 'katakana' ? katakana : hiragana;
    }
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
    if (e.key === 'Enter' && (currentMode === 1 || currentMode === 3)) {
      handleAnswerSubmit();
    }
  });
});

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
  // Mode 3 is now handled by isWordMode flag within Mode 1 or Mode 2 logic if needed,
  // but for consistency in UI screen selection, we might map word modes to existing screens.
  // Assuming Mode 1 and Mode 2 screens are generic enough to handle word data.
  // If Mode 3 screen is distinct, we'd need to add it to ui.js screens object and handle it here.
  // For now, keeping it simple:
  else if (currentMode === 3) ui.switchScreen('quizMode3'); // Keep this if quizMode3 has a distinct layout
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

  if (currentMode === 1) { // Kana -> Romaji
    ui.renderKanaToRomaji(question, scoreboard);
  } else if (currentMode === 2) { // Romaji -> Kana
    const data = currentScript === 'katakana' ? katakana : hiragana;
    ui.renderRomajiToKana(question, data, scoreboard, currentQuiz.composition);
  } else if (currentMode === 3) { // Nihongo -> Romaji (transcription)
    ui.renderNihongoToRomaji(question, scoreboard);
  }
}

function handleAnswerSubmit() {
  const input = document.getElementById('romaji-input');
  if (!input || !input.value) return;

  // Determine correct feedback element based on current mode
  const feedbackId = (currentMode === 1 || currentMode === 3) ? 'feedback-1' : 'feedback-2'; // Mode 1 and 3 use feedback-1, Mode 2 uses feedback-2 (this might need adjustment based on UI)
  const result = currentQuiz.checkAnswer(input.value, currentMode);
  ui.renderFeedback(result, feedbackId);

  if (result.correct) {
    // If correct and it's a word mode, we might need to clear input and wait for next question
    if (isWordMode && currentMode === 2) { 
      // For composition, we don't auto-advance until fully composed.
      // This block handles cases where the entire word is answered correctly in one go (though unlikely with composition)
      // Or if it's a single character answer in Mode 2 (which is less likely for words)
    } else if (currentMode === 1 || currentMode === 3) {
      // For transcription modes, advance after a delay
      setTimeout(nextQuestion, 3000);
    }
    // For Mode 2 (Romaji->Kana, single character), it's handled by handlePickerAnswer
    // If Mode 2 + words, composition handles advancement.
  } else {
    ui.showRevealButton();
    input.value = '';
    input.focus();
  }
}

function handleReveal() {
  const feedbackId = (currentMode === 1 || currentMode === 3) ? 'feedback-1' : 'feedback-2'; // Adjust feedback ID based on mode
  const q = currentQuiz.currentQuestion;
  const answer = q.phonetic || (Array.isArray(q.romaji) ? q.romaji[0] : q.romaji);
  
  const result = { 
    correct: false, 
    correctAnswer: answer, 
    kanaAnswer: q.kana,
    // If in word mode R->K, reveal should show the full correct word
    translation: (currentMode === 2 && isWordMode) ? q.kana : null 
  };
  ui.renderFeedback(result, feedbackId, true);
  setTimeout(nextQuestion, 3000);
}

function handlePickerAnswer(kana) {
  const result = currentQuiz.checkAnswer(kana, currentMode);
  
  // Determine the correct feedback element ID
  const feedbackId = (currentMode === 1 || currentMode === 3) ? 'feedback-1' : 'feedback-2';

  if (result.correct) {
    if (result.complete) { // Full word composition complete
      ui.renderFeedback(result, feedbackId, true); // Show translation and mark correct
      setTimeout(nextQuestion, result.tierUnlocked ? 4000 : 3500); // Longer delay if tier unlocked
    } else { // Partial composition
      ui.renderFeedback(result, feedbackId, false); // Show partial correct feedback
      // Update UI with current composition
      const data = currentScript === 'katakana' ? katakana : hiragana;
      ui.renderRomajiToKana(currentQuiz.currentQuestion, data, {
          tier: currentQuiz.currentTier,
          streak: currentQuiz.streak,
          score: currentQuiz.score,
          correct: currentQuiz.totalCorrect,
          wrong: currentQuiz.totalWrong
      }, currentQuiz.composition);
    }
  } else { // Incorrect answer
    ui.renderFeedback(result, feedbackId, true); // Show correct answer in feedback
    // Disable picker while showing feedback
    document.querySelectorAll('.picker-item').forEach(btn => btn.disabled = true);
    setTimeout(() => {
      nextQuestion();
    }, 2000);
  }
}
