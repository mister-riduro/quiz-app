# Plan 005: Refine Framer Motion Spring Physics, Motion Curves, and Compositor Transitions

**Commit:** `853df81`  
**Category:** Motion & Animation Craft (`improve-animations`)  
**Severity:** MEDIUM  
**Impact:** Replaces unnatural easing curves with realistic spring physics, eliminates matrix singular zero-scale glitches, fixes bottom sheet entry washouts, and stops layout thrashing caused by indiscriminate `transition-all`.  
**Target Files:**

- `src/features/presenter/VictoryScreen.tsx`
- `src/components/common/BottomSheetFeedback.tsx`
- `src/components/ui/TileToken.tsx`
- `src/components/ui/TactileButton.tsx`
- `src/components/ui/DuoCard.tsx`
- `src/features/dashboard/components/QuizCard.tsx`

---

## 1. Problem Statement & Evidence

### A. Matrix Singular Zero Scale Glitch (`scale: 0`)

In [`src/features/presenter/VictoryScreen.tsx#L306`](file:///d:/Gig/app-project/quiz-supabase/quiz-app/src/features/presenter/VictoryScreen.tsx#L306):

```tsx
<motion.div
  initial={{ scale: 0, opacity: 0, rotate: -35 }}
  animate={{ scale: 1, opacity: 1, rotate: 0 }}
  transition={{
    delay,
    type: 'spring',
    damping: 14,
    stiffness: 260,
    mass: 0.7,
  }}
>
```

Animating from `scale: 0` creates a singular transformation matrix ($M_{11}=0, M_{22}=0, \det(M)=0$). In browser rendering engines (Chromium & WebKit), matrix inversion during the first 1-2 frames can cause momentary flash/pop artifacts or layout jumps. Starting from `scale: 0.1` or `scale: 0.2` preserves matrix invertibility while delivering the exact same visual pop.

### B. Muddy Bottom Sheet Fade-Slide Combo

In [`src/components/common/BottomSheetFeedback.tsx#L98-L106`](file:///d:/Gig/app-project/quiz-supabase/quiz-app/src/components/common/BottomSheetFeedback.tsx#L98-L106):

```tsx
initial={{ y: '100%', opacity: 0 }}
animate={{ y: 0, opacity: 1 }}
exit={{ y: '100%', opacity: 0 }}
transition={{
  type: 'spring',
  damping: 24,
  stiffness: 280,
  mass: 0.8,
}}
```

Simultaneously animating `opacity` from 0 to 1 while springing `y` up from 100% washes out the bottom sheet during its ascent, eroding the physical illusion of a solid panel rising from the floor. Bottom sheets should enter with `opacity: 1` fixed, moving strictly on the `y` axis with high damping (`stiffness: 350, damping: 32`).

### C. Mechanical Linear Array Keyframing

In [`src/components/ui/TileToken.tsx#L58-L62`](file:///d:/Gig/app-project/quiz-supabase/quiz-app/src/components/ui/TileToken.tsx#L58-L62):

```tsx
case 'wrong':
  return {
    x: [-6, 6, -5, 5, -2, 2, 0],
    transition: { duration: 0.35, ease: 'easeInOut' },
  };
```

Hardcoding linear offsets (`[-6, 6, -5, ...]`) with `easeInOut` feels robotic and artificial compared to a true decaying spring impulse.

### D. Layout-Thrashing `transition-all` Anti-Pattern

Across `TactileButton.tsx`, `DuoCard.tsx`, and `QuizCard.tsx`, CSS classes specify `transition-all`. Because `all` monitors padding, margin, width, and height, any state change forces style recalibration and layout reflow across the subtree.

---

## 2. Implementation Steps

### Step 1: Fix Star3D Initial Scale and Physics in `VictoryScreen.tsx`

In `src/features/presenter/VictoryScreen.tsx`:
Change `scale: 0` to `scale: 0.15` and adjust damping to prevent excessive oscillations:

```tsx
const Star3D: React.FC<Star3DProps> = ({ index, isEarned, size, delay, isCenter = false }) => {
  return (
    <motion.div
      initial={{ scale: 0.15, opacity: 0, rotate: -25 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{
        delay,
        type: 'spring',
        stiffness: 320,
        damping: 18,
        mass: 0.6,
      }}
      className={...}
    >
      {/* SVG content */}
    </motion.div>
  );
};
```

### Step 2: Solid Bottom Sheet Spring in `BottomSheetFeedback.tsx`

In `src/components/common/BottomSheetFeedback.tsx`:
Remove the opacity fade; retain pure vertical spring translation:

```tsx
<motion.div
  key="bottom-sheet-feedback"
  initial={{ y: '100%' }}
  animate={{ y: 0 }}
  exit={{ y: '100%' }}
  transition={{
    type: 'spring',
    damping: 32,
    stiffness: 340,
    mass: 0.9,
  }}
  className={cn('fixed bottom-0 left-0 right-0 z-50 select-none shadow-2xl', ...)}
>
```

### Step 3: Natural Damped Spring Shake in `TileToken.tsx`

In `src/components/ui/TileToken.tsx`:
Replace linear array easing with a realistic damped physics curve:

```tsx
case 'wrong':
  return {
    x: [-8, 8, -6, 6, -3, 3, 0],
    transition: {
      type: 'spring',
      stiffness: 650,
      damping: 16,
      mass: 0.5,
    },
  };
```

### Step 4: Replace `transition-all` with Compositor-Only Properties

1. In `src/components/ui/TactileButton.tsx`:
   Change `transition-all duration-75` to:
   ```tsx
   "transition-[transform,border-color,background-color,filter] duration-75 ease-out";
   ```
2. In `src/components/ui/DuoCard.tsx`:
   Change `transition-all` to:
   ```tsx
   "transition-[transform,border-color,box-shadow] duration-150 ease-out";
   ```
3. In `src/features/dashboard/components/QuizCard.tsx`:
   Change `transition-all duration-200` to:
   ```tsx
   "transition-[transform,box-shadow,border-color] duration-150 ease-out";
   ```

---

## 3. Verification Plan

### Automated Verification

- Run `npm run typecheck` to confirm all types and Framer Motion prop types validate cleanly.

### Visual & Feel Verification (Emil Kowalski Standard)

1. **Star Entry Pop**:
   - Complete a quiz in Kiosk mode to trigger `VictoryScreen`.
   - Record the screen at 60fps or inspect in DevTools Animations drawer (10% speed).
   - Verify stars emerge smoothly without matrix collapsing or frame hitching.
2. **Bottom Sheet Physicality**:
   - Answer a question in Kiosk mode.
   - Observe the bottom sheet entry. Confirm it slides up as a solid physical panel without premature opacity wash.
3. **Tile Token Shake**:
   - Click an incorrect tile in Showcase mode.
   - Confirm the shake feels snappy, taut, and organic (like a mechanical keyboard key resisting a jam).
