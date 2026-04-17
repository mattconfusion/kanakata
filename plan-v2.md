# KanaKata — Incremental Learning Mode Plan

## Overview

The **Incremental Learning Mode** is a third top-level mode alongside the existing Kana→Romaji and Romaji→Kana quiz modes. It is designed for users who are learning kana from scratch, introducing a small set of new symbols per phase and drilling them with spaced repetition logic before unlocking the next phase.

It is available for both **Hiragana** and **Katakana** as separate, independently tracked progressions.

---

## How It Differs from Quiz Mode Tiers

| Aspect | Quiz Mode Tiers | Incremental Learning Phases |
|--------|----------------|-----------------------------|
| Purpose | Test existing knowledge | Build knowledge from zero |
| Organisation | By structural complexity (single → dakuten → combos) | By traditional teaching order (row by row) |
| Unlocking | N consecutive correct answers | Phase completion score threshold |
| Scope per step | Entire tier unlocked at once | 3–5 new symbols introduced at a time |
| Progress tracking | Shared across Kana→Romaji and Romaji→Kana | Completely separate per script, per direction |
| Session structure | Free-form: user picks any question | Guided: new symbols drilled before mixing |
| Reference table | Available as optional overlay | Shown automatically for new symbols |

---

## Mode Selection Flow

The incremental mode is accessible from the home screen as a distinct entry point:

```
Home
 ├─ [Kana → Romaji Quiz]
 ├─ [Romaji → Kana Quiz]
 └─ [Incremental Learning] ──► Direction select
                                  ├─ Kana → Romaji
                                  └─ Romaji → Kana
                                       └─► Script select
                                              ├─ Hiragana
                                              └─ Katakana
                                                   └─► Phase Map → Active Phase
```

---

## Phase Structure

Phases follow the **traditional gojūon teaching order**, introducing one row at a time with a small symbol count per phase. This is intentionally different from the quiz tier system, which groups by structural complexity.

### Hiragana & Katakana Phases (identical order, separate progress)

| Phase | Symbols introduced | Cumulative total | Notes |
|-------|--------------------|-----------------|-------|
| 1 | あ い う え お (a i u e o) | 5 | Vowels — always first |
| 2 | か き く け こ (ka ki ku ke ko) | 10 | K-row |
| 3 | さ し す せ そ (sa shi su se so) | 15 | S-row |
| 4 | た ち つ て と (ta chi tsu te to) | 20 | T-row |
| 5 | な に ぬ ね の (na ni nu ne no) | 25 | N-row |
| 6 | は ひ ふ へ ほ (ha hi fu he ho) | 30 | H-row |
| 7 | ま み む め も (ma mi mu me mo) | 35 | M-row |
| 8 | や ゆ よ (ya yu yo) | 38 | Y-row (3 symbols) |
| 9 | ら り る れ ろ (ra ri ru re ro) | 43 | R-row |
| 10 | わ を ん (wa wo n) | 46 | W-row + ん/ン |
| 11 | が ぎ ぐ げ ご … (voiced stops) | 56 | Dakuten — g/z/d/b rows |
| 12 | ぱ ぴ ぷ ぺ ぽ (pa pi pu pe po) | 61 | Handakuten — p-row |
| 13 | きゃ きゅ きょ … (k-combinations) | 67 | First combo set |
| 14 | しゃ しゅ しょ … (s/t-combinations) | 73 | Second combo set |
| 15 | ちゃ にゃ ひゃ … (remaining combos) | 81 | Final combo set |

> **Note:** Phases 11–15 cover the same material as Quiz Mode Tiers 3–4, but are introduced gradually in smaller batches rather than unlocked all at once.

---

## Phase Session Structure

Each phase follows a fixed three-stage flow:

### Stage 1 — Introduction
- The new symbols for the phase are displayed as a mini reference card (kana + romaji side by side).
- User reviews them before the drill begins.
- A "Ready" button starts the drill.

### Stage 2 — Drill (new symbols only)
- Questions are drawn **exclusively from the new symbols** of the current phase.
- Minimum of **10 correct answers** required to advance to Stage 3.
- Wrong answers requeue the symbol immediately (it will appear again soon).
- No mixing with previous phases yet.

### Stage 3 — Mixed Review
- Questions are drawn from **all symbols unlocked so far** (current phase + all previous phases).
- Must achieve **80% accuracy over 20 questions** to complete the phase and unlock the next.
- This stage reinforces retention and prevents siloed memorisation.

---

## Progress Tracking

Progress for Incremental Learning is stored separately in `localStorage` under its own keys, completely independent from quiz mode progress.

### Storage Schema

```js
// Key format: incremental_{script}_{direction}
// Example: incremental_hiragana_kanaToRomaji

{
  currentPhase: 3,
  completedPhases: [1, 2],
  phaseStats: {
    1: { attempts: 24, correct: 22, completedAt: "2025-04-17" },
    2: { attempts: 31, correct: 27, completedAt: "2025-04-18" }
  },
  symbolStats: {
    "あ": { seen: 12, correct: 11 },
    "き": { seen: 8,  correct: 6  }
    // ...one entry per unlocked symbol
  }
}
```

### Per-Symbol Accuracy Display
- The phase map shows a small accuracy indicator (e.g. coloured dot or percentage) for each completed phase.
- The reference card for any completed phase shows per-symbol accuracy so the user can identify weak spots.

---

## Phase Map Screen

After selecting script and direction, the user lands on a **Phase Map** — a visual overview of all phases showing:

- Locked phases (greyed out)
- Completed phases (with accuracy indicator)
- Current phase (highlighted, with a "Continue" button)
- A "Review" option on any completed phase to re-drill it without affecting progress

---

## New Data File

Incremental phase data is defined in a dedicated file, separate from the existing quiz data files:

```
data/
├── hiragana.js          # existing — quiz tier data
├── katakana.js          # existing — quiz tier data
├── hiragana_phases.js   # new — incremental phase data
└── katakana_phases.js   # new — incremental phase data
```

### Phase Data Format

```js
// hiragana_phases.js
export const phases = [
  {
    id: 1,
    label: "Vowels",
    symbols: [
      { kana: "あ", romaji: "a" },
      { kana: "い", romaji: "i" },
      { kana: "う", romaji: "u" },
      { kana: "え", romaji: "e" },
      { kana: "お", romaji: "o" },
    ]
  },
  {
    id: 2,
    label: "K-row",
    symbols: [
      { kana: "か", romaji: "ka" },
      // ...
    ]
  },
  // ...
];
```

---

## New JS Module

A dedicated module `js/incremental.js` handles all incremental mode logic:

```
js/
├── quiz.js           # existing
├── ui.js             # existing
├── theme.js          # existing
├── app.js            # existing
└── incremental.js    # new
```

### `incremental.js` Responsibilities

- `loadProgress(script, direction)` — reads from `localStorage`.
- `saveProgress(script, direction, state)` — writes to `localStorage`.
- `getActivePhase(progress)` — returns current phase object and its stage (intro / drill / mixed).
- `generateDrillQuestion(phase, symbolStats)` — picks a symbol from current phase; prioritises symbols with lower accuracy.
- `generateMixedQuestion(unlockedSymbols, symbolStats)` — picks from all unlocked symbols; weights toward weaker ones.
- `recordAnswer(symbol, correct, state)` — updates `symbolStats` and checks stage advancement conditions.
- `isPhaseComplete(phaseStats)` — returns true if mixed review threshold is met.

---

## UI Additions

### New screens (added to `ui.js` or a dedicated `ui_incremental.js`)

| Screen | Description |
|--------|-------------|
| `renderModeSelect()` | Updated home screen with Incremental Learning as third option |
| `renderDirectionSelect()` | Choose Kana→Romaji or Romaji→Kana within incremental mode |
| `renderPhaseMap(progress)` | Visual overview of all phases and their status |
| `renderIntroCard(phase)` | Shows new symbols as a reference card before drilling |
| `renderIncrementalQuiz(question, stage)` | Quiz screen, same input mechanics as main quiz but with stage indicator and phase progress bar |
| `renderPhaseComplete(phase, stats)` | Celebration screen shown when a phase is completed |

### Shared UI elements reused from main quiz
- Large kana display (Kana→Romaji direction)
- On-screen kana picker (Romaji→Kana direction)
- Feedback (✓ / ✗ + reveal)
- Theme toggle

---

## Implementation Order

1. **Data files** — `hiragana_phases.js` + `katakana_phases.js` with all 15 phases.
2. **`incremental.js`** — pure logic: progress load/save, question generation, answer recording, stage advancement.
3. **Phase Map screen** — visual entry point for the mode; build with placeholder data first.
4. **Intro Card screen** — simple display of new symbols, no logic beyond "Ready" button.
5. **Drill stage** — wire `incremental.js` logic to existing quiz UI components.
6. **Mixed Review stage** — same wiring, different question generator, accuracy threshold check.
7. **Phase Complete screen** — celebration and unlock of next phase.
8. **Home screen update** — add Incremental Learning as third option.
9. **Polish** — weak-symbol highlighting on phase map, per-symbol accuracy display, animations.
