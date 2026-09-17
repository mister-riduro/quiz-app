# Plan 002: Prevent Question State Leakage, Optimize Re-renders, and Clean Up State Stores

**Commit:** `853df81`  
**Category:** Performance & Correctness (`improve-react`)  
**Severity:** HIGH  
**Impact:** Prevents corrupted question state and visual flickering when navigating between questions of identical plugin types, stops keystroke re-render cascades in QuizBuilder, and cleans up dead store code and unhandled Supabase auth subscriptions.  
**Target Files:**

- `src/features/presenter/PresenterKioskPage.tsx`
- `src/features/builder/QuizBuilderPage.tsx`
- `src/features/builder/components/SortableQuestionItem.tsx`
- `src/plugins/questions/wordsearch/WordsearchPlayer.tsx`
- `src/stores/authStore.ts`
- `src/stores/useQuizBuilderStore.ts` (Deprecate/Remove)
- `src/stores/index.ts`

---

## 1. Problem Statement & Evidence

### A. Question State Leakage via Missing Component Key

In [`src/features/presenter/PresenterKioskPage.tsx#L384-L394`](file:///d:/Gig/app-project/quiz-supabase/quiz-app/src/features/presenter/PresenterKioskPage.tsx#L384-L394):

```tsx
{
  activePlugin && (
    <div className="w-full flex justify-center">
      <activePlugin.PlayerComponent
        content={activeQuestion.content}
        submittedAnswer={answers[activeQuestion.id]}
        onAnswerSubmit={handleAnswerSubmit}
        isEvaluating={feedbackState.isOpen}
        isCorrect={evaluations[activeQuestion.id]}
      />
    </div>
  );
}
```

When moving from question $N$ to $N+1$, if both questions use the same plugin engine (e.g. `true_false` $\to$ `true_false`, or `anagram` $\to$ `anagram`), React preserves the component instance across renders because no `key` prop is provided. Local component states (`items` in Anagram, `guessedLetters` in Hangman, `slots` in SpellWord, `placements` in Diagram) do not unmount, leading to stale closures, race conditions with `useEffect`, and answer leakage.

### B. Hot-Path Re-render Cascade on Title Keystrokes in QuizBuilder

In [`src/features/builder/QuizBuilderPage.tsx#L380-L391`](file:///d:/Gig/app-project/quiz-supabase/quiz-app/src/features/builder/QuizBuilderPage.tsx#L380-L391):

```tsx
<textarea
  value={activeQuestion.titlePrompt}
  onChange={(e) =>
    updateQuestion(activeQuestionIndex, {
      titlePrompt: e.target.value,
    })
  }
/>
```

Every keystroke updates the store's `questions` array. In [`src/features/builder/components/SortableQuestionItem.tsx`](file:///d:/Gig/app-project/quiz-supabase/quiz-app/src/features/builder/components/SortableQuestionItem.tsx), the component is not wrapped in `React.memo`. As a result, every item in the sidebar question list re-renders on every single keystroke.

### C. 100-Cell Synchronous Re-render on Pointer Drag in Wordsearch

In [`src/plugins/questions/wordsearch/WordsearchPlayer.tsx#L167-L173`](file:///d:/Gig/app-project/quiz-supabase/quiz-app/src/plugins/questions/wordsearch/WordsearchPlayer.tsx#L167-L173):
`pointermove` fires at 60-120Hz during a swipe, invoking `setActiveSelection(path)`. The 100 cell elements (`grid.map(row => row.map(char => ...))`) are unmemoized and entirely re-render on every pixel move.

### D. Duplicate Dead-Store Code & Unhandled Auth Listener

1. `src/stores/useQuizBuilderStore.ts` is an obsolete duplicate of `src/stores/builderStore.ts`, yet remains exported in `src/stores/index.ts`.
2. In `src/stores/authStore.ts#L192`, `supabase.auth.onAuthStateChange` is called inside `initialize()` without storing the `{ data: { subscription } }` reference or providing an unsubscribe mechanism, creating duplicate event listeners when remounting.

---

## 2. Implementation Steps

### Step 1: Add Key Prop and AnimatePresence to PresenterKioskPage

In `src/features/presenter/PresenterKioskPage.tsx`, wrap the active question renderer in `AnimatePresence mode="wait"` and supply `key={activeQuestion.id}`:

```tsx
// Around line 384
<AnimatePresence mode="wait">
  {activePlugin && activeQuestion && (
    <motion.div
      key={activeQuestion.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="w-full flex justify-center"
    >
      <activePlugin.PlayerComponent
        key={activeQuestion.id}
        content={activeQuestion.content}
        submittedAnswer={answers[activeQuestion.id]}
        onAnswerSubmit={handleAnswerSubmit}
        isEvaluating={feedbackState.isOpen}
        isCorrect={evaluations[activeQuestion.id]}
      />
    </motion.div>
  )}
</AnimatePresence>
```

### Step 2: Memoize `SortableQuestionItem`

In `src/features/builder/components/SortableQuestionItem.tsx`:
Wrap the exported component with `React.memo`:

```tsx
export const SortableQuestionItem = React.memo<SortableQuestionItemProps>(
  ({ question, index, isActive, onSelect, onRemove, canRemove }) => {
    // Existing implementation
  },
);
```

### Step 3: Memoize Wordsearch Grid Cells

In `src/plugins/questions/wordsearch/WordsearchPlayer.tsx`:
Extract cell rendering into a memoized child component `WordsearchCell`:

```tsx
interface WordsearchCellProps {
  char: string;
  cellKey: string;
  isSelected: boolean;
  lockedPalette?: PastelPalette;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
}

const WordsearchCell = React.memo<WordsearchCellProps>(
  ({ char, isSelected, lockedPalette, onPointerDown }) => {
    return (
      <div
        onPointerDown={onPointerDown}
        className={cn(
          "aspect-square rounded-xl sm:rounded-2xl border-2 flex items-center justify-center font-black select-none cursor-pointer",
          isSelected &&
            "bg-duo-blue text-white border-duo-blue-border scale-105 z-10 shadow-md ring-2 ring-duo-blue/40",
          lockedPalette && !isSelected && "shadow-2xs font-extrabold",
          !lockedPalette &&
            !isSelected &&
            "bg-white text-duo-dark border-duo-gray hover:bg-duo-gray-light",
        )}
        style={{
          backgroundColor:
            !isSelected && lockedPalette ? lockedPalette.bg : undefined,
          color: !isSelected && lockedPalette ? lockedPalette.text : undefined,
          borderColor:
            !isSelected && lockedPalette ? lockedPalette.border : undefined,
        }}
      >
        <span className="drop-shadow-xs">{char}</span>
      </div>
    );
  },
);
```

### Step 4: Fix Auth Store Listener Cleanup & Remove Dead Store

1. In `src/stores/authStore.ts`:
   Store `authSubscription: { unsubscribe: () => void } | null` in state or module scope. Before calling `supabase.auth.onAuthStateChange`, unsubscribe from any prior subscription:

   ```typescript
   let authListenerSubscription: { unsubscribe: () => void } | null = null;

   // In initialize():
   if (authListenerSubscription) {
     authListenerSubscription.unsubscribe();
   }
   const { data } = supabase.auth.onAuthStateChange(async (_event, newSession) => { ... });
   authListenerSubscription = data.subscription;
   ```

2. Remove `src/stores/useQuizBuilderStore.ts` and remove its re-export from `src/stores/index.ts`.

---

## 3. Verification Plan

### Automated Verification

- Run `npm run typecheck` to confirm no broken imports after removing `useQuizBuilderStore`.
- Run `npm run build` to verify Vite bundle output.

### Manual / Profiler Verification

1. **State Isolation Check**:
   - In Presenter Kiosk mode, create two consecutive Anagram or Hangman questions.
   - Guess letters in question 1, click "Lanjutkan".
   - Confirm Question 2 starts completely fresh with zero residual state from Question 1.
2. **React Profiler Keystroke Check**:
   - Open React DevTools Profiler ("Record why each component rendered while profiling").
   - Type 10 characters into Title Prompt in `QuizBuilderPage`.
   - Confirm inactive `SortableQuestionItem` components report 0 renders.
3. **Wordsearch Pointer Move Check**:
   - Drag across the 10x10 matrix in Wordsearch.
   - Confirm only touched cells re-render instead of all 100 cells.
