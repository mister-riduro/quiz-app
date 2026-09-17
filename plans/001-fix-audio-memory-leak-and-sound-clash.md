# Plan 001: Fix Audio Memory Leak, Web Audio Node Disconnect, and Dual Sound Clash

**Category:** Performance & Correctness (`improve-react`)  
**Severity:** HIGH  
**Impact:** Eliminates unbounded Web Audio node accumulation during classroom quizzes, prevents dual-audio trigger distortion, and stops global re-renders when mute is toggled.  
**Target Files:**
- [`src/lib/soundManager.ts`](file:///d:/Software/app-project/quiz-supabase/src/lib/soundManager.ts)
- [`src/hooks/useSoundEffect.ts`](file:///d:/Software/app-project/quiz-supabase/src/hooks/useSoundEffect.ts)
- [`src/hooks/useSound.ts`](file:///d:/Software/app-project/quiz-supabase/src/hooks/useSound.ts)
- [`src/plugins/questions/anagram/AnagramPlayer.tsx`](file:///d:/Software/app-project/quiz-supabase/src/plugins/questions/anagram/AnagramPlayer.tsx)
- [`src/plugins/questions/wordsearch/WordsearchPlayer.tsx`](file:///d:/Software/app-project/quiz-supabase/src/plugins/questions/wordsearch/WordsearchPlayer.tsx)
- [`src/plugins/questions/labelled-diagram/DiagramPlayer.tsx`](file:///d:/Software/app-project/quiz-supabase/src/plugins/questions/labelled-diagram/DiagramPlayer.tsx)
- [`src/plugins/questions/unjumble/UnjumblePlayer.tsx`](file:///d:/Software/app-project/quiz-supabase/src/plugins/questions/unjumble/UnjumblePlayer.tsx)

---

## 1. Problem Statement & Evidence

### A. Web Audio Node Memory Leak in `SoundManager`
In [`src/lib/soundManager.ts#L64-L216`](file:///d:/Software/app-project/quiz-supabase/src/lib/soundManager.ts#L64-L216):
Every time any sound (`tap`, `pop`, `balloon_pop`, `victory`, `correct`, `wrong`) is synthesized:
```typescript
const ctx = this.getAudioContext();
if (!ctx) return;

const now = ctx.currentTime;
const masterGain = ctx.createGain();
masterGain.gain.setValueAtTime(this.volume, now);
masterGain.connect(ctx.destination);
```
Every invocation instantiates a brand new `masterGain`, oscillators, and gain nodes, connects them to `ctx.destination`, but **never disconnects** them. Because nodes connected to `AudioContext.destination` remain retained in the Web Audio graph by browser engines (V8 / WebKit), hundreds of button taps across a 20-minute classroom quiz produce an unbounded leak of AudioNodes.

### B. Dual Clashing Audio Triggers
In [`src/features/presenter/PresenterKioskPage.tsx#L169-L173`](file:///d:/Software/app-project/quiz-supabase/src/features/presenter/PresenterKioskPage.tsx#L169-L173), answer evaluation triggers sound:
```typescript
if (isCorrect) {
  playVictory();
} else {
  playWrong();
}
```
Concurrently, individual player components (`AnagramPlayer.tsx#L78-L84`, `WordsearchPlayer.tsx#L78-L84`, `DiagramPlayer.tsx#L346-L352`, `UnjumblePlayer.tsx#L248-L253`) also run a `useEffect` on `isCorrect`:
```typescript
useEffect(() => {
  if (isCorrect === true) {
    playCorrect();
  } else if (isCorrect === false) {
    playWrong();
  }
}, [isCorrect, playCorrect, playWrong]);
```
Both play simultaneously on submission, producing a jarring acoustic clash (`victory` fanfare overlapping with `correct` chime).

### C. Over-subscription Re-renders via `useSoundEffect`
In [`src/hooks/useSoundEffect.ts#L22-L32`](file:///d:/Software/app-project/quiz-supabase/src/hooks/useSoundEffect.ts#L22-L32):
Every component that consumes `useSoundEffect()` subscribes to `soundManager.subscribe(...)` with local `useState` for `isMuted` and `volume`. Leaf components like `TileToken`, `TactileButton`, `QuizCard`, and `ImageUploader` that only trigger `playTap()` re-render whenever global volume or mute state changes in the Header.

---

## 2. Implementation Steps

### Step 1: Refactor `src/lib/soundManager.ts`
1. Maintain a persistent singleton `masterGainNode` connected to `destination` instead of creating one per trigger.
2. In `synthesizeSound()`, attach an `onended` listener or a timer to disconnect temporary synthesis nodes (`osc.disconnect()`, `gain.disconnect()`) once their playback ends.
3. Provide an explicit `dispose()` / `cleanup()` method for tests or unmounting.

```typescript
// Proposed structure for SoundManager
class SoundManager {
  private howlerSounds: Map<SoundEffectKey, Howl> = new Map();
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private muted: boolean = false;
  private volume: number = 0.7;
  private listeners: Set<SoundListener> = new Set();

  private getAudioContext(): { ctx: AudioContext; master: GainNode } | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.volume, this.audioCtx.currentTime);
        this.masterGain.connect(this.audioCtx.destination);
      }
    }
    if (this.audioCtx?.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    if (!this.audioCtx || !this.masterGain) return null;
    return { ctx: this.audioCtx, master: this.masterGain };
  }

  // In synthesizeSound:
  // e.g. for tap:
  // osc.onended = () => { osc.disconnect(); gain.disconnect(); };
}
```

### Step 2: Split `useSound` (Action-only) from `useSoundSettings` (Stateful)
1. Update `src/hooks/useSoundEffect.ts`:
   - Keep `useSoundEffect()` / `useSound()` as an action-only hook returning stable callbacks (`playTap`, `playPop`, etc.) **without** `useState` or `useEffect` subscription.
   - Create `useSoundSettings()` for components (`Header.tsx`, settings modals) that need `isMuted`, `volume`, and `toggleMute`.
2. This eliminates re-renders across all 15+ interactive leaf components when mute is clicked.

### Step 3: Remove Redundant Evaluation Sounds in Player Components
Remove the clashing `useEffect` evaluation listeners in:
- `src/plugins/questions/anagram/AnagramPlayer.tsx` (lines 78-84)
- `src/plugins/questions/wordsearch/WordsearchPlayer.tsx` (lines 78-84)
- `src/plugins/questions/labelled-diagram/DiagramPlayer.tsx` (lines 346-352)
- `src/plugins/questions/unjumble/UnjumblePlayer.tsx` (lines 248-253)

Centralize evaluation audio strictly in `PresenterKioskPage.tsx` or `BottomSheetFeedback.tsx`.

---

## 3. Verification Plan

### Automated Verification
- Run `npm run typecheck` to ensure no broken imports or missing properties.
- Run `npm run build` to verify Vite bundle compilation.

### Manual / DevTools Verification
1. **Memory Leak Check**:
   - Open Chrome DevTools > Memory > Allocation instrumentation on timeline.
   - Click various buttons in the showcase and kiosk mode 100 times.
   - Verify that `AudioNode`, `OscillatorNode`, and `GainNode` counts do not grow indefinitely and are properly collected.
2. **Audio Phasing Check**:
   - Answer a question in Kiosk mode.
   - Verify only a single clear fanfare chime plays, with no acoustic distortion or stutter.
3. **Re-render Check**:
   - Open React DevTools > Profiler ("Highlight updates when components render").
   - Click the Mute button in `Header.tsx`.
   - Verify only `Header` re-renders; `PresenterKioskPage`, `TileToken`, and game cards must NOT flash/re-render.
