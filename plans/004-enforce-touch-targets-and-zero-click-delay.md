# Plan 004: Enforce 44x44px Minimum Touch Targets and Eliminate 300ms Tablet Click Delay

**Commit:** `853df81`  
**Category:** Accessibility & Responsiveness (`improve-ui` & `improve-animations`)  
**Severity:** HIGH  
**Impact:** Guarantees all interactive elements and mini-game controls comply with the 44x44px minimum touch target standard (WCAG 2.5.5) and eliminates 300ms double-tap delay on iPads and touchscreen tablets in classroom environments.  
**Target Files:**

- `src/index.css`
- `src/components/ui/TactileButton.tsx`
- `src/components/layout/Header.tsx`
- `src/features/presenter/PresenterKioskPage.tsx`
- `src/plugins/questions/crossword/CrosswordPlayer.tsx`
- `src/plugins/questions/hangman/HangmanPlayer.tsx`
- `src/plugins/questions/wordsearch/WordsearchPlayer.tsx`
- `src/plugins/questions/labelled-diagram/DiagramPlayer.tsx`
- `src/plugins/questions/spell-the-word/SpellWordPlayer.tsx`

---

## 1. Problem Statement & Evidence

### A. Sub-44px Touch Targets Across Mini-Games

1. **`TactileButton.tsx#L27`**:
   ```tsx
   sm: "px-3 py-1.5 text-xs rounded-xl font-bold gap-1.5";
   ```
   Rendered total height is only ~32px (`py-1.5` = 12px vertical padding + 16px text line-height + 4px border). Used in Kiosk floating controls, header buttons, and answer options.
2. **`CrosswordPlayer.tsx#L433 & L581`**:
   - Grid cells: `gridTemplateColumns: repeat(cols, minmax(36px, 50px))`. Minimum cell target is only 36px.
   - On-screen keyboard keys: `min-w-[28px] sm:min-w-[40px] min-h-[40px] sm:min-h-[44px]`. Under 640px viewport, touch target is only 28x40px.
3. **`HangmanPlayer.tsx#L452`**:
   - On-screen keyboard keys: `min-w-[32px] sm:min-w-[44px]`. Width is only 32px on mobile and portrait tablets.
4. **`WordsearchPlayer.tsx#L315`**:
   - 10x10 matrix in `max-w-[450px]` container: cells are only 28px to 35px in width/height.
5. **`Header.tsx#L47` & `PresenterKioskPage.tsx#L289, L411, L427`**:
   - Header sound toggle is `w-10 h-10` (40x40px).
   - Exit button is `w-10 h-10` (40x40px).
   - Floating teacher skip/back controls are `w-9 h-9` (36x36px).

### B. Tablet Click Delay (300ms Double-Tap Wait)

In WebKit (Safari on iPad, Chrome on Android tablets), browsers default to a 300ms gesture delay on touch start to discern between a single click and a double-tap-to-zoom gesture unless `touch-action: manipulation` is declared.
In [`src/index.css#L36-L39`](file:///d:/Gig/app-project/quiz-supabase/quiz-app/src/index.css#L36-L39):

```css
* {
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
}
```

`touch-action: manipulation;` is completely missing from global styles and interactive components.

---

## 2. Implementation Steps

### Step 1: Add Global `touch-action: manipulation` to `src/index.css`

Update `src/index.css` under `@layer base`:

```css
@layer base {
  *,
  ::before,
  ::after {
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none;
  }

  html,
  body {
    touch-action: manipulation;
  }

  button,
  a,
  input,
  select,
  textarea,
  [role="button"] {
    touch-action: manipulation;
  }
}
```

### Step 2: Enforce Minimum 44px Height on `TactileButton`

In `src/components/ui/TactileButton.tsx`:
Ensure `sm` has a minimum height of 44px (e.g. `min-h-[44px] px-3.5 py-2`):

```tsx
const sizeStyles: Record<ButtonSize, string> = {
  sm: "min-h-[44px] px-3.5 py-2 text-xs rounded-2xl font-bold gap-1.5",
  md: "min-h-[48px] px-5 py-2.5 text-sm rounded-2xl font-extrabold gap-2",
  lg: "min-h-[54px] px-7 py-3.5 text-base tracking-wide rounded-2xl font-black gap-2.5",
  icon: "w-11 h-11 min-h-[44px] min-w-[44px] p-0 text-sm rounded-2xl justify-center",
};
```

### Step 3: Upgrade Header & Kiosk Floating Controls to 44x44px

1. In `src/components/layout/Header.tsx`:
   Change sound toggle from `w-10 h-10` to `w-11 h-11 min-w-[44px] min-h-[44px]`.
2. In `src/features/presenter/PresenterKioskPage.tsx`:
   - Change Exit button from `w-10 h-10` to `w-11 h-11 min-w-[44px] min-h-[44px]`.
   - Change floating skip/back buttons from `w-9 h-9` to `w-11 h-11 min-w-[44px] min-h-[44px]`.

### Step 4: Fix Crossword, Hangman, and Wordsearch Touch Sizing

1. **Crossword Player (`CrosswordPlayer.tsx`)**:
   - Set grid cell minimum to 44px:
     ```tsx
     gridTemplateColumns: `repeat(${gridSize.cols}, minmax(44px, 56px))`,
     gridTemplateRows: `repeat(${gridSize.rows}, minmax(44px, 56px))`,
     ```
   - Set on-screen keyboard keys to `min-h-[48px] min-w-[32px] sm:min-w-[44px]`, with `touch-action: manipulation`.
2. **Hangman Player (`HangmanPlayer.tsx`)**:
   - Set on-screen keyboard keys to `min-h-[48px] sm:min-h-[50px] min-w-[34px] sm:min-w-[46px]`.
3. **Wordsearch Player (`WordsearchPlayer.tsx`)**:
   - Ensure the grid matrix container allows horizontal scrolling or scales with a minimum cell target of `min-w-[40px] sm:min-w-[44px] aspect-square`, with `touch-action: none` restricted solely to the active swipe canvas.

---

## 3. Verification Plan

### Automated Verification

- Run `npm run typecheck` to confirm syntax and prop consistency.

### Touch & Tablet Verification

1. **Chrome DevTools Touch Simulation**:
   - Open DevTools > Device Toolbar > Select "iPad Air" / "iPad Mini".
   - Open More Tools > Rendering > Enable "Emulate a touch screen".
2. **Touch Target Dimensions Verification**:
   - Inspect elements in the DOM:
     - Header sound toggle: compute bounding box $\ge 44 \times 44\text{px}$.
     - Kiosk previous/next buttons: compute bounding box $\ge 44 \times 44\text{px}$.
     - Crossword grid cells: compute bounding box $\ge 44 \times 44\text{px}$.
     - `TactileButton` with `size="sm"`: compute bounding box $\ge 44\text{px}$ height.
3. **Click Latency Check**:
   - Tap repeatedly on virtual keyboard keys in Crossword and Hangman on an iPad / touchscreen.
   - Confirm immediate tactile feedback without the 300ms double-tap hesitation.
