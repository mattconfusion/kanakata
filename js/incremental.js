const DRILL_MIN_CORRECT = 10;
const MIXED_QUESTIONS = 20;
const MIXED_ACCURACY_THRESHOLD = 0.8;

export function storageKey(script, direction) {
  return `incremental_${script}_${direction}`;
}

export function loadProgress(script, direction) {
  const raw = localStorage.getItem(storageKey(script, direction));
  if (!raw) return createInitialProgress();
  try {
    return JSON.parse(raw);
  } catch {
    return createInitialProgress();
  }
}

export function saveProgress(script, direction, progress) {
  localStorage.setItem(storageKey(script, direction), JSON.stringify(progress));
}

export function createInitialProgress() {
  return {
    currentPhase: 1,
    completedPhases: [],
    phaseStats: {},
    symbolStats: {},
    stage: 'intro',
    drillCorrect: 0,
    mixedAnswers: 0,
    mixedCorrect: 0,
  };
}

export function resetPhaseProgress(script, direction) {
  saveProgress(script, direction, createInitialProgress());
}

export function getUnlockedSymbols(progress, phases) {
  const unlocked = [];
  for (const phase of phases) {
    if (phase.id <= progress.currentPhase) {
      unlocked.push(...phase.symbols);
    }
  }
  return unlocked;
}

function weightedRandom(symbols, symbolStats) {
  const weights = symbols.map(s => {
    const stats = symbolStats[s.kana];
    if (!stats || stats.seen === 0) return 3;
    const accuracy = stats.correct / stats.seen;
    return 1 + (1 - accuracy) * 3;
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let rand = Math.random() * total;
  for (let i = 0; i < symbols.length; i++) {
    rand -= weights[i];
    if (rand <= 0) return symbols[i];
  }
  return symbols[symbols.length - 1];
}

export function generateDrillQuestion(phase, symbolStats, lastKana = null) {
  const pool = phase.symbols.length > 1
    ? phase.symbols.filter(s => s.kana !== lastKana)
    : phase.symbols;
  return weightedRandom(pool, symbolStats);
}

export function generateMixedQuestion(unlockedSymbols, symbolStats, lastKana = null) {
  const pool = unlockedSymbols.length > 1
    ? unlockedSymbols.filter(s => s.kana !== lastKana)
    : unlockedSymbols;
  return weightedRandom(pool, symbolStats);
}

export function recordAnswer(kana, correct, progress) {
  const stats = progress.symbolStats[kana] || { seen: 0, correct: 0 };
  stats.seen++;
  if (correct) stats.correct++;
  progress.symbolStats[kana] = stats;

  if (progress.stage === 'drill' && correct) {
    progress.drillCorrect++;
  } else if (progress.stage === 'mixed') {
    progress.mixedAnswers++;
    if (correct) progress.mixedCorrect++;
  }

  return progress;
}

export function isDrillComplete(progress) {
  return progress.drillCorrect >= DRILL_MIN_CORRECT;
}

export function isMixedRoundDone(progress) {
  return progress.mixedAnswers >= MIXED_QUESTIONS;
}

export function getMixedAccuracy(progress) {
  if (progress.mixedAnswers === 0) return 0;
  return progress.mixedCorrect / progress.mixedAnswers;
}

export function advanceToMixed(progress) {
  progress.stage = 'mixed';
  progress.mixedAnswers = 0;
  progress.mixedCorrect = 0;
  return progress;
}

export function resetMixedRound(progress) {
  progress.mixedAnswers = 0;
  progress.mixedCorrect = 0;
  return progress;
}

export function advancePhase(progress, phases) {
  const now = new Date().toISOString().split('T')[0];
  progress.phaseStats[progress.currentPhase] = {
    attempts: progress.mixedAnswers,
    correct: progress.mixedCorrect,
    completedAt: now,
  };
  if (!progress.completedPhases.includes(progress.currentPhase)) {
    progress.completedPhases.push(progress.currentPhase);
  }
  const next = progress.currentPhase + 1;
  if (next <= phases.length) {
    progress.currentPhase = next;
    progress.stage = 'intro';
    progress.drillCorrect = 0;
    progress.mixedAnswers = 0;
    progress.mixedCorrect = 0;
  }
  return progress;
}

export function getPhaseAccuracy(phaseId, phaseStats) {
  const s = phaseStats[phaseId];
  if (!s || s.attempts === 0) return null;
  return Math.round((s.correct / s.attempts) * 100);
}

export function getDrillConstants() {
  return { DRILL_MIN_CORRECT, MIXED_QUESTIONS, MIXED_ACCURACY_THRESHOLD };
}
