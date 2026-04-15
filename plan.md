# KanaKata — Development Plan

## Project Overview

**KanaKata** is a frontend-only web app for testing knowledge of hiragana and katakana, featuring two quiz modes, difficulty progression, and a reference table.

---

## Project Structure

```
KanaKata/
├── index.html
├── css/
│   ├── main.css          # Base styles, CSS variables, typography
│   ├── theme.css         # Dark/light theme tokens
│   └── components.css    # Buttons, cards, tables, quiz UI
├── data/
│   ├── hiragana.js       # Hiragana kana data (single + combos)
│   └── katakana.js       # Katakana kana data (single + combos)
├── js/
│   ├── quiz.js           # Core quiz logic, scoring, difficulty progression
│   ├── ui.js             # DOM manipulation, screen transitions
│   ├── theme.js          # Theme toggle + persistence (localStorage)
│   └── app.js            # Entry point, routing between modes
└── assets/
    └── favicon.ico
```

---

## Quiz Modes

### 1. Kana → Romaji

- User is presented with a kana character (single or combination) and must type the correct romaji using the keyboard.
- User can choose whether to test **hiragana** or **katakana**.
- If the answer is wrong, the user can choose to reveal the correct answer.
- A reference table of all kana is available as an overlay at any time.

### 2. Romaji → Kana

- The inverse: user is shown a romaji string and must select the correct kana.
- **No keyboard input** — the user answers by tapping/clicking an on-screen kana picker table.
- Same script selection, wrong-answer reveal, and reference table as Mode 1.

---

## Data Layer (`data/`)

Each data file exports an array of objects grouped by difficulty tier:

```js
{ kana: "あ", romaji: "a",   tier: 1 }   // basic vowels
{ kana: "か", romaji: "ka",  tier: 2 }   // basic consonant rows
{ kana: "きゃ", romaji: "kya", tier: 3 } // combination kana
```

### Difficulty Tiers

| Tier | Content |
|------|---------|
| 1 | 5 vowels: a, i, u, e, o |
| 2 | Core consonant rows: ka, sa, ta, na, ha, ma, ya, ra, wa |
| 3 | Dakuten variants: ga, za, da, ba, pa… |
| 4 | Combination kana: kya, sha, cha, nya… |

---

## Core Modules (`js/`)

### `quiz.js`
- Maintains quiz state: current question, score, streak, tier unlock progress.
- `generateQuestion(mode, script)` — picks a kana/romaji based on current tier.
- `checkAnswer(input, correct)` — validates and returns `{ correct, correctAnswer }`.
- `advanceTier()` — unlocks the next tier after N consecutive correct answers.
- Works identically for both quiz modes; the mode flag controls what is shown vs. what is input.

### `ui.js`
- `renderKanaToRomaji(question)` — displays large kana, text input box, submit button.
- `renderRomajiToKana(question)` — displays romaji label and on-screen kana picker table.
- `renderFeedback(result)` — correct ✓ / wrong ✗ with optional "Show Answer" reveal.
- `renderReferenceTable(script)` — full kana reference grid, toggled as overlay/drawer.
- `renderScoreboard()` — streak, score, tier badge.

### `theme.js`
- Reads preference from `localStorage` and `prefers-color-scheme`.
- Toggles `data-theme="dark" | "light"` on `<html>`.
- A single CSS variable set in `theme.css` drives all color changes.

### `app.js`
- Initialises on `DOMContentLoaded`.
- Home screen: choose **Kana → Romaji** or **Romaji → Kana**, then choose **Hiragana** or **Katakana**.
- Calls into `quiz.js` + `ui.js` to run the selected mode.

---

## UI Screens & Flow

```
Home
 ├─ [Kana → Romaji] ──► Script select (Hiragana / Katakana)
 │                          └─► Quiz screen
 │                                ├─ Question (large kana display)
 │                                ├─ Text input + Submit
 │                                ├─ Feedback (✓ / ✗ + reveal)
 │                                └─ [Reference Table] button → overlay
 │
 └─ [Romaji → Kana] ──► Script select
                            └─► Quiz screen
                                  ├─ Question (romaji label)
                                  ├─ On-screen kana picker (tap to answer)
                                  ├─ Feedback (✓ / ✗ + reveal)
                                  └─ [Reference Table] button → overlay
```

---

## Styling Approach (`css/`)

- **`theme.css`** defines two variable sets under `[data-theme="light"]` and `[data-theme="dark"]` covering background, surface, text, accent, error, and success colours.
- **`main.css`** sets base resets, fluid typography via `clamp()`, and layout shells.
- **`components.css`** builds on CSS variables: quiz card, kana picker grid, reference table, toggle button, feedback states.
- Mobile-first breakpoints throughout; the kana picker uses CSS Grid auto-fill so it reflows naturally on small screens.
- Large kana display uses a generous `font-size` (e.g. `clamp(4rem, 20vw, 8rem)`) for readability on phones.

---

## General Requirements

| Requirement | Implementation |
|-------------|---------------|
| Dark / Light theme | CSS variables + `data-theme` toggle, persisted in `localStorage` |
| Mobile & touch responsive | Mobile-first CSS, kana picker optimised for tap targets |
| Multiple files | ES modules (`type="module"`), separated by concern |
| No build tools | Plain HTML/CSS/JS, opens directly from `index.html` |
| Persistence | `localStorage` for theme preference and tier progress |

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| No framework / no bundler | Stays truly frontend-only; opens straight from `index.html` |
| ES modules (`type="module"`) | Clean imports between files without a bundler |
| `localStorage` for theme + progress | Persistence without a backend |
| Difficulty tiers rather than random all-at-once | Avoids overwhelming beginners; mirrors how kana is taught |
| Kana picker grid as answer input | Prevents mobile keyboard issues in Romaji → Kana mode |

---

## Implementation Order

1. **Data files** — `hiragana.js` + `katakana.js` with all tiers defined.
2. **`theme.js` + CSS variables** — get theming working early, as it affects every component.
3. **`quiz.js`** — pure logic, no DOM dependency; easy to test in the browser console.
4. **`ui.js`** — build screens one at a time: home → Kana→Romaji quiz → Romaji→Kana quiz → reference table overlay.
5. **`app.js`** — wire everything together and add screen transitions.
6. **Polish** — animations, streak effects, tier-unlock celebration, favicon.
