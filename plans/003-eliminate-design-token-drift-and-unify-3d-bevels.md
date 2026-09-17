# Plan 003: Eliminate Design Token Drift, Standardize Rounded Corners, and Unify 3D Tactile Bevels

**Commit:** `853df81`  
**Category:** Design & Visual Craft (`improve-ui`)  
**Severity:** HIGH  
**Impact:** Eradicates 120+ occurrences of hardcoded hex values, unifies fragmented button implementations onto `TactileButton`, establishes a strict 3-tier rounded corner hierarchy, and fixes broken 3D bevel illusions.  
**Target Files:**

- `src/components/ui/TactileButton.tsx`
- `src/components/ui/Button.tsx` (Deprecate or alias to TactileButton)
- `src/components/common/BottomSheetFeedback.tsx`
- `src/components/feedback/DuoBottomSheet.tsx` (Delete dead component)
- `src/features/presenter/VictoryScreen.tsx`
- `src/components/layout/Header.tsx`
- `src/components/ui/DuoCard.tsx`
- `src/App.tsx`
- `index.html`
- `tailwind.config.js`

---

## 1. Problem Statement & Evidence

### A. Extensive Design Token Drift (120+ Hardcoded Hex Colors)

1. **`BottomSheetFeedback.tsx#L111-L210`**:
   - Uses non-standard ad-hoc colors: `#58A700` (dark green), `#3C5A14` (olive green), `#EA2B2B` (red border), `#661B1B` (dark maroon), `#7F1D1D` (dark red), `#61DC02` (hover green), `#FF5C5C` (hover red).
2. **`Button.tsx#L10-L18`**:
   - Hardcodes raw hex codes for every single variant (`#58CC02`, `#46A302`, `#1CB0F6`, `#1899D6`, etc.) completely bypassing Tailwind's `duo-*` token definitions.
3. **`App.tsx`, `Header.tsx`, `ImageUploader.tsx`, `QuizCard.tsx`**:
   - Repeatedly hardcodes `text-[#777777]` and `text-[#3C3C3C]` instead of a semantic token for muted secondary text.
4. **`index.html#L22`**:
   - Hardcodes `bg-[#F7F9FA] text-[#4B4B4B] selection:bg-[#D7FFB8] selection:text-[#46A302]`.

### B. Broken 3D Bevel Physics & Inconsistent Active State

1. **`TactileButton.tsx#L59`**:
   ```tsx
   "border-b-4 border-r-2 border-solid";
   ```
   Missing `border-2`! Because top and left borders default to 0px, buttons rendered against non-white surfaces look asymmetrical and lack definition on their top and left edges.
2. **`BottomSheetFeedback.tsx#L208` & `VictoryScreen.tsx#L264`**:
   ```tsx
   "active:translate-y-1 active:border-b-0";
   ```
   Active state flattens the bottom border to `0px` (`active:border-b-0`). In Duolingo's tactile design system, a pressed 3D button compresses from `4px` to `2px` (`active:border-b-2`), maintaining the base illusion. Flattening to `0px` collapses the bevel and produces visual distortion.
3. **Redundant Duplicate Button Systems**:
   `Button.tsx` relies on `.btn-3d-press` in `index.css`, while `TactileButton.tsx` implements its own styling. `BottomSheetFeedback` and `VictoryScreen` construct raw `<button>` elements with inline Tailwind classes instead of consuming `TactileButton`.

### C. Arbitrary Rounded Corner Drift

Corner radiuses are applied inconsistently without architectural hierarchy:

- `sm` buttons use `rounded-xl`, `md` use `rounded-2xl`, `xl` in `Button.tsx` uses `rounded-3xl`.
- Modals and cards alternate between `rounded-2xl`, `rounded-3xl`, and `rounded-[32px]`.
- Badges alternate between `rounded-lg`, `rounded-xl`, and `rounded-full`.

---

## 2. Implementation Steps

### Step 1: Formalize Secondary Muted Token in `tailwind.config.js`

Extend `colors.duo` with `muted`:

```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      duo: {
        // ... existing colors ...
        muted: '#777777',
      },
    },
  },
}
```

### Step 2: Fix 3D Bevel Contract in `src/components/ui/TactileButton.tsx`

1. Add `border-2` so all 4 sides have a 2px baseline border, while `border-b-4` provides the bottom 3D bevel.
2. Ensure active press compresses to `active:border-b-2` and `active:translate-y-[2px]`:

```tsx
// src/components/ui/TactileButton.tsx
className={cn(
  'relative inline-flex items-center justify-center select-none uppercase tracking-wider font-extrabold transition-all duration-75',
  // Symmetrical 2px border with 4px bottom bevel & 2px right bevel
  'border-2 border-b-4 border-r-2 border-solid',
  // Active compression: translate 2px, compress bottom border from 4px to 2px
  'active:translate-y-[2px] active:border-b-2',
  variantStyles[variant],
  sizeStyles[size],
  // ...
)}
```

### Step 3: Unify Buttons in `BottomSheetFeedback.tsx` and `VictoryScreen.tsx`

1. In `src/components/common/BottomSheetFeedback.tsx`:
   - Replace the raw `<button>` with `<TactileButton variant={isCorrect ? 'green' : 'red'} size="lg">`.
   - Replace all hardcoded hex strings (`#58CC02`, `#58A700`, `#3C5A14`, `#EA2B2B`, `#661B1B`, `#7F1D1D`) with `bg-duo-green-light border-duo-green-border text-duo-dark` and `bg-duo-red-light border-duo-red-border text-duo-dark`.
2. In `src/features/presenter/VictoryScreen.tsx`:
   - Replace raw `<button>` elements with `<TactileButton variant="green" size="lg">` and `<TactileButton variant="blue" size="lg">`.

### Step 4: Codify 3-Tier Rounded Corner Design Rule

Apply the following strict hierarchy:

1. **Tier 1 (Micro / Sub-elements):** `rounded-xl` (12px) for badges, tags, and small icon buttons.
2. **Tier 2 (Interactive Controls):** `rounded-2xl` (16px) for all `TactileButton` sizes, inputs, and `TileToken`.
3. **Tier 3 (Surfaces & Cards):** `rounded-3xl` (24px) for `DuoCard`, dialog modals, and the `VictoryScreen` container.

### Step 5: Clean Up Dead Code

1. Delete `src/components/feedback/DuoBottomSheet.tsx` and remove its export from `src/components/feedback/index.ts`.
2. Refactor `src/components/ui/Button.tsx` to forward props directly to `TactileButton` or deprecate in favor of `TactileButton`.
3. Clean up `index.html` body classes to use `bg-duo-bg text-duo-dark selection:bg-duo-green-light selection:text-duo-green-border`.

---

## 3. Verification Plan

### Automated Verification

- Run `npm run typecheck` to ensure no component has missing imports or broken props.
- Run `git grep "#58A700" src/` to verify zero occurrences of non-token colors.

### Manual Visual Verification

1. **Bevel Alignment Check**:
   - Inspect `TactileButton` and `TileToken` in showcase mode.
   - Click and hold each button.
   - Verify that the button physically sinks 2px (`translate-y-[2px]`) while its bottom border reduces to 2px, giving an authentic Duolingo tactile feel without collapsing to 0px.
2. **Color Cohesion Check**:
   - Trigger correct and wrong answers in `PresenterKioskPage`.
   - Inspect the `BottomSheetFeedback` banner. Confirm background matches `duo-green-light` (`#D7FFB8`) and `duo-red-light` (`#FFDFE0`), with border matching `duo-green-border` (`#46A302`) and `duo-red-border` (`#EA2B2B`).
