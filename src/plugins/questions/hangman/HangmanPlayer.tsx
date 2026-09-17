import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Tag, RotateCcw, Frown, Award } from 'lucide-react';
import { PlayerProps } from '@/plugins/core/types';
import { HangmanContent, HangmanAnswer } from './types';
import { useSoundEffect } from '@/hooks/useSoundEffect';
import { cn } from '@/utils/cn';

// Vibrant Balloon Colors
const BALLOON_COLORS = [
  { main: '#FF4B4B', border: '#EA2B2B', highlight: '#FF8585' },
  { main: '#1CB0F6', border: '#1899D6', highlight: '#70D4FF' },
  { main: '#58CC02', border: '#46A302', highlight: '#88E83A' },
  { main: '#FFC800', border: '#D4A500', highlight: '#FFE066' },
  { main: '#A855F7', border: '#9333EA', highlight: '#C084FC' },
  { main: '#FF9600', border: '#D97F00', highlight: '#FFB84D' },
];

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

export const HangmanPlayer: React.FC<PlayerProps<HangmanContent, HangmanAnswer>> = ({
  content,
  submittedAnswer,
  onAnswerSubmit,
  isEvaluating = false,
}) => {
  const { playTap, playCorrect, playWrong, playBalloonPop, playVictory } = useSoundEffect();

  const secretWord = useMemo(
    () => (content.secretWord || 'INDONESIA').toUpperCase(),
    [content.secretWord]
  );
  const maxLives = Math.min(6, Math.max(3, content.maxLives || 5));
  const category = content.category || content.hint;

  // Track guessed letters
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [poppedIndex, setPoppedIndex] = useState<number | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  // Derive unique letters in secretWord (excluding spaces)
  const uniqueLetters = useMemo(() => {
    const set = new Set<string>();
    for (const char of secretWord) {
      if (char >= 'A' && char <= 'Z') {
        set.add(char);
      }
    }
    return set;
  }, [secretWord]);

  // Wrong guesses
  const wrongGuesses = useMemo(() => {
    return guessedLetters.filter((l) => !uniqueLetters.has(l));
  }, [guessedLetters, uniqueLetters]);

  const remainingLives = Math.max(0, maxLives - wrongGuesses.length);
  const isWon = uniqueLetters.size > 0 && Array.from(uniqueLetters).every((l) => guessedLetters.includes(l));
  const isLost = remainingLives <= 0;
  const isGameOver = isWon || isLost || submittedAnswer !== undefined;

  // Handle letter guess
  const handleGuess = useCallback(
    (letter: string) => {
      if (isGameOver || isEvaluating || guessedLetters.includes(letter)) return;

      const upper = letter.toUpperCase();
      const isRightLetter = uniqueLetters.has(upper);
      const nextGuessed = [...guessedLetters, upper];
      setGuessedLetters(nextGuessed);

      if (isRightLetter) {
        playCorrect();
        // Check if this guess completed the word
        const won = Array.from(uniqueLetters).every((l) => nextGuessed.includes(l));
        if (won) {
          playVictory();
          onAnswerSubmit({
            guessedLetters: nextGuessed,
            isWon: true,
            revealedWord: secretWord,
          });
        }
      } else {
        // Wrong letter -> Balloon pops!
        const nextWrongCount = nextGuessed.filter((l) => !uniqueLetters.has(l)).length;
        setPoppedIndex(maxLives - nextWrongCount);
        setIsShaking(true);
        playBalloonPop();

        setTimeout(() => {
          setPoppedIndex(null);
          setIsShaking(false);
        }, 600);

        if (nextWrongCount >= maxLives) {
          playWrong();
          onAnswerSubmit({
            guessedLetters: nextGuessed,
            isWon: false,
            revealedWord: secretWord,
          });
        }
      }
    },
    [
      isGameOver,
      isEvaluating,
      guessedLetters,
      uniqueLetters,
      maxLives,
      secretWord,
      playCorrect,
      playVictory,
      playBalloonPop,
      playWrong,
      onAnswerSubmit,
    ]
  );

  // Physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver || isEvaluating) return;
      const key = e.key.toUpperCase();
      if (key >= 'A' && key <= 'Z') {
        handleGuess(key);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleGuess, isGameOver, isEvaluating]);

  // Restart game for demo / player replay
  const handleRestart = () => {
    playTap();
    setGuessedLetters([]);
    setPoppedIndex(null);
    setIsShaking(false);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto py-3 px-2 select-none">
      {/* 1. TOP STATUS BAR: Category & Hearts Indicator */}
      <div className="flex items-center justify-between w-full mb-3 px-2">
        {category ? (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white border-2 border-slate-200 rounded-full text-xs font-black text-duo-dark shadow-xs">
            <Tag className="w-3.5 h-3.5 text-duo-orange" />
            <span className="text-slate-400 font-semibold">Kategori:</span>
            <span className="text-duo-dark">{category}</span>
          </div>
        ) : (
          <span />
        )}

        {/* Heart Lives Indicator */}
        <div className="flex items-center gap-1.5 bg-duo-red-light/40 px-3 py-1.5 rounded-2xl border border-duo-red/30">
          <div className="flex items-center gap-1">
            {Array.from({ length: maxLives }).map((_, idx) => {
              const hasHeart = idx < remainingLives;
              return (
                <motion.div
                  key={`heart-${idx}`}
                  animate={hasHeart ? { scale: [1, 1.15, 1] } : { scale: 0.85 }}
                  transition={{ duration: 0.3 }}
                >
                  <Heart
                    className={cn(
                      'w-4 h-4 sm:w-5 sm:h-5 transition-colors',
                      hasHeart
                        ? 'fill-duo-red text-duo-red drop-shadow-xs'
                        : 'text-slate-300 fill-slate-200'
                    )}
                  />
                </motion.div>
              );
            })}
          </div>
          <span className="font-black text-xs sm:text-sm text-duo-red ml-1">
            {remainingLives}/{maxLives}
          </span>
        </div>
      </div>

      {/* 2. FRIENDLY MASCOT WITH COLORFUL BALLOONS STAGE */}
      <motion.div
        animate={isShaking ? { x: [-8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
        transition={{ duration: 0.4 }}
        className="relative flex flex-col items-center justify-end w-full py-4 px-6 bg-gradient-to-b from-sky-50 to-emerald-50/50 border-2 border-slate-200 rounded-3xl mb-6 shadow-xs overflow-hidden min-h-[220px]"
      >
        {/* Soft Background Clouds */}
        <div className="absolute top-4 left-6 w-16 h-6 bg-white/70 rounded-full blur-[1px]" />
        <div className="absolute top-8 right-8 w-20 h-7 bg-white/70 rounded-full blur-[1px]" />

        {/* Floating Balloons Cluster */}
        <div className="relative flex items-center justify-center gap-2 sm:gap-3 mb-2 z-10">
          {Array.from({ length: maxLives }).map((_, idx) => {
            const isAlive = idx < remainingLives;
            const color = BALLOON_COLORS[idx % BALLOON_COLORS.length]!;
            const floatDelay = idx * 0.2;
            const isJustPopped = poppedIndex === idx;

            return (
              <div key={`balloon-${idx}`} className="relative flex flex-col items-center">
                <AnimatePresence>
                  {isAlive ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{
                        scale: 1,
                        y: [-3, 3, -3],
                        rotate: idx % 2 === 0 ? [-2, 2, -2] : [2, -2, 2],
                      }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{
                        y: { repeat: Infinity, duration: 2.5 + floatDelay, ease: 'easeInOut' },
                        rotate: { repeat: Infinity, duration: 3 + floatDelay, ease: 'easeInOut' },
                        scale: { duration: 0.25 },
                      }}
                      className="relative w-10 h-13 sm:w-12 sm:h-15 rounded-full shadow-md flex items-center justify-center"
                      style={{
                        backgroundColor: color.main,
                        border: `2px solid ${color.border}`,
                      }}
                    >
                      {/* Glossy Balloon Highlight */}
                      <div
                        className="absolute top-1.5 left-2 w-3.5 h-4.5 rounded-full rotate-[-25deg] opacity-60"
                        style={{ backgroundColor: color.highlight }}
                      />

                      {/* Balloon Knot */}
                      <div
                        className="absolute -bottom-1.5 w-2 h-1.5 rounded-sm"
                        style={{ backgroundColor: color.border }}
                      />
                    </motion.div>
                  ) : isJustPopped ? (
                    /* POP! Burst Effect Animation */
                    <motion.div
                      initial={{ scale: 0.6, opacity: 1 }}
                      animate={{ scale: 1.4, opacity: 0 }}
                      transition={{ duration: 0.45 }}
                      className="absolute inset-0 flex items-center justify-center text-xs font-black text-duo-red pointer-events-none"
                    >
                      💥 POP!
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                {/* Balloon String connecting to mascot */}
                <div
                  className={cn(
                    'w-0.5 h-10 transition-opacity duration-300',
                    isAlive ? 'bg-slate-400/80' : 'opacity-0'
                  )}
                />
              </div>
            );
          })}
        </div>

        {/* Cute Mascot Character (Kiki the Cheerful Creature) */}
        <motion.div
          animate={
            isWon
              ? { y: [0, -10, 0] }
              : isLost
              ? { rotate: [-2, 2, -2] }
              : { y: [0, -2, 0] }
          }
          transition={{ repeat: Infinity, duration: isWon ? 0.6 : 2, ease: 'easeInOut' }}
          className="relative z-10 flex flex-col items-center"
        >
          <svg
            width="84"
            height="84"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-md"
          >
            {/* Mascot Body */}
            <circle cx="50" cy="55" r="38" fill={isLost ? '#94A3B8' : '#58CC02'} />
            <circle cx="50" cy="55" r="38" stroke={isLost ? '#64748B' : '#46A302'} strokeWidth="4" />

            {/* Belly Patch */}
            <ellipse cx="50" cy="62" rx="24" ry="20" fill={isLost ? '#CBD5E1' : '#D7FFB8'} />

            {/* Cute Ears / Horns */}
            <path
              d="M26 28 C22 14 36 18 36 28 Z"
              fill={isLost ? '#64748B' : '#46A302'}
            />
            <path
              d="M74 28 C78 14 64 18 64 28 Z"
              fill={isLost ? '#64748B' : '#46A302'}
            />

            {/* Eyes */}
            {isWon ? (
              /* Star / Happy Eyes */
              <>
                <path d="M32 46 Q38 40 44 46" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" />
                <path d="M56 46 Q62 40 68 46" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" />
              </>
            ) : isLost ? (
              /* Dizzy / Sad Eyes */
              <>
                <circle cx="38" cy="46" r="5" stroke="#334155" strokeWidth="3" />
                <circle cx="62" cy="46" r="5" stroke="#334155" strokeWidth="3" />
              </>
            ) : (
              /* Cheerful Big Eyes */
              <>
                <circle cx="38" cy="46" r="6" fill="#1E293B" />
                <circle cx="40" cy="44" r="2.5" fill="white" />
                <circle cx="62" cy="46" r="6" fill="#1E293B" />
                <circle cx="64" cy="44" r="2.5" fill="white" />
              </>
            )}

            {/* Blush Cheeks */}
            {!isLost && (
              <>
                <ellipse cx="28" cy="54" rx="5" ry="3" fill="#FF8585" opacity="0.6" />
                <ellipse cx="72" cy="54" rx="5" ry="3" fill="#FF8585" opacity="0.6" />
              </>
            )}

            {/* Beak / Snout */}
            <polygon points="50,50 44,57 56,57" fill="#FF9600" />

            {/* Smile / Mouth */}
            {isLost ? (
              <path d="M44 68 Q50 62 56 68" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
            ) : (
              <path d="M43 64 Q50 71 57 64" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
            )}
          </svg>

          {/* Hands holding string */}
          <div className="absolute top-[50px] -right-2 w-4 h-4 rounded-full bg-[#46A302] border-2 border-white shadow-xs" />
        </motion.div>
      </motion.div>

      {/* 3. MYSTERY WORD DISPLAY WITH THICK UNDERLINES _ _ _ _ */}
      <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 py-3 px-4 mb-6 min-h-[64px] w-full">
        {secretWord.split('').map((char, index) => {
          if (char === ' ') {
            return <div key={`char-${index}`} className="w-4 sm:w-6" />;
          }

          const isRevealed = guessedLetters.includes(char) || isGameOver;
          const isCorrectlyGuessed = guessedLetters.includes(char);

          return (
            <div
              key={`char-${index}`}
              className={cn(
                'min-w-[36px] sm:min-w-[44px] h-12 sm:h-14 flex items-center justify-center font-black text-2xl sm:text-3xl transition-all',
                'border-b-[4px] sm:border-b-[5px]',
                isCorrectlyGuessed
                  ? 'border-duo-green text-duo-dark'
                  : isLost
                  ? 'border-duo-red text-duo-red'
                  : 'border-duo-dark/40 text-transparent'
              )}
            >
              {isRevealed ? (
                <motion.span
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                >
                  {char}
                </motion.span>
              ) : (
                <span className="opacity-0">_</span>
              )}
            </div>
          );
        })}
      </div>

      {/* 4. GAME OVER FEEDBACK BANNER */}
      {isGameOver && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className={cn(
            'flex items-center justify-between p-4 rounded-2xl border-2 w-full mb-6 shadow-xs',
            isWon
              ? 'bg-duo-green-light/60 border-duo-green text-duo-dark'
              : 'bg-duo-red-light/60 border-duo-red text-duo-dark'
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0',
                isWon ? 'bg-duo-green' : 'bg-duo-red'
              )}
            >
              {isWon ? <Award className="w-6 h-6" /> : <Frown className="w-6 h-6" />}
            </div>
            <div>
              <h4 className="font-black text-sm uppercase tracking-wider">
                {isWon ? 'Tebakan Hebat! Kamu Menang!' : 'Yah, Balon Telah Habis!'}
              </h4>
              <p className="text-xs sm:text-sm font-semibold text-[#4B4B4B]">
                {isWon
                  ? `Kamu sukses menyelamatkan balon dan menebak "${secretWord}".`
                  : `Kata rahasia yang tepat adalah: "${secretWord}".`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRestart}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-slate-200 rounded-xl text-xs font-black text-duo-dark hover:bg-slate-50 transition-colors shrink-0 ml-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Main Lagi</span>
          </button>
        </motion.div>
      )}

      {/* 5. VIRTUAL ON-SCREEN KEYBOARD (QWERTY with minimum 44x44px touch targets) */}
      <div className="flex flex-col items-center gap-2 w-full pt-2">
        {KEYBOARD_ROWS.map((row, rowIdx) => (
          <div key={`keyboard-row-${rowIdx}`} className="flex justify-center gap-1.5 sm:gap-2 w-full">
            {row.map((letter) => {
              const isGuessed = guessedLetters.includes(letter);
              const isCorrectLetter = isGuessed && uniqueLetters.has(letter);
              const isWrongLetter = isGuessed && !uniqueLetters.has(letter);
              const isKeyDisabled = isGuessed || isGameOver || isEvaluating;

              return (
                <button
                  key={`key-${letter}`}
                  type="button"
                  disabled={isKeyDisabled}
                  onClick={() => handleGuess(letter)}
                  className={cn(
                    // Accessibility touch target minimum 44x44px
                    'min-w-[32px] sm:min-w-[44px] min-h-[44px] sm:min-h-[48px] flex-1 max-w-[48px] rounded-xl font-black text-sm sm:text-base select-none transition-all flex items-center justify-center',
                    // Key States
                    !isGuessed &&
                      'bg-white text-duo-dark border-2 border-slate-200 border-b-4 border-b-slate-300 hover:bg-slate-50 active:translate-y-0.5 active:border-b-2 shadow-xs cursor-pointer',
                    isCorrectLetter &&
                      'bg-duo-green text-white border-2 border-duo-green-border border-b-2 shadow-none cursor-default opacity-95',
                    isWrongLetter &&
                      'bg-slate-200 text-slate-400 border-2 border-slate-300 border-b-2 shadow-none cursor-default opacity-50'
                  )}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
