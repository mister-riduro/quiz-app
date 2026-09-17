import React, { useState, useEffect, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { HelpCircle, RotateCcw, Check, Sparkles } from 'lucide-react';
import { PlayerProps } from '@/plugins/core/types';
import { SpellWordContent, SpellWordAnswer } from './types';
import { TileToken, TileTokenState } from '@/components/ui/TileToken';
import { TactileButton } from '@/components/ui/TactileButton';
import { useSoundEffect } from '@/hooks/useSoundEffect';
import { cn } from '@/utils/cn';

interface LetterItem {
  id: string;
  letter: string;
}

// Fisher-Yates array shuffle
function shuffleLetters<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Droppable Slot Container Component
 */
const DroppableSlot: React.FC<{
  index: number;
  item: LetterItem | null;
  disabled: boolean;
  state?: TileTokenState;
  onTap: () => void;
}> = ({ index, item, disabled, state = 'idle', onTap }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${index}`,
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'relative w-13 h-16 sm:w-16 sm:h-20 rounded-2xl transition-all duration-150 flex items-center justify-center',
        // Empty slot dashed style
        !item && 'border-2 border-dashed border-duo-gray bg-slate-50/80 shadow-xs',
        // Highlight when dragging over
        isOver && !disabled && 'border-duo-blue bg-duo-blue-light/50 ring-4 ring-duo-blue/20 scale-105',
        // Filled slot border
        item && 'border-transparent'
      )}
    >
      {item ? (
        <DraggableSlotTile
          item={item}
          slotIndex={index}
          disabled={disabled}
          state={state}
          onTap={onTap}
        />
      ) : (
        <span className="text-xs font-black text-slate-300 select-none">
          {index + 1}
        </span>
      )}
    </div>
  );
};

/**
 * Draggable Slot Tile Component (Inside a Slot)
 */
const DraggableSlotTile: React.FC<{
  item: LetterItem;
  slotIndex: number;
  disabled: boolean;
  state?: TileTokenState;
  onTap: () => void;
}> = ({ item, slotIndex, disabled, state = 'idle', onTap }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
    data: { fromSlotIndex: slotIndex, item },
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn('touch-none cursor-grab active:cursor-grabbing', isDragging && 'opacity-20')}
    >
      <TileToken
        label={item.letter}
        state={state}
        size="md"
        onClick={onTap}
        className="w-13 sm:w-16"
      />
    </div>
  );
};

/**
 * Draggable Bank Tile Component (In the Bank)
 */
const DraggableBankTile: React.FC<{
  item: LetterItem;
  disabled: boolean;
  onTap: () => void;
}> = ({ item, disabled, onTap }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
    data: { fromBank: true, item },
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn('touch-none cursor-pointer', isDragging && 'opacity-25')}
    >
      <TileToken
        label={item.letter}
        state="idle"
        size="md"
        onClick={onTap}
      />
    </div>
  );
};

export const SpellWordPlayer: React.FC<PlayerProps<SpellWordContent, SpellWordAnswer>> = ({
  content,
  submittedAnswer,
  onAnswerSubmit,
  isEvaluating = false,
  isCorrect,
}) => {
  const { playTap, playPop, playCorrect, playWrong } = useSoundEffect();

  const targetWord = useMemo(
    () => (content.targetWord || 'PLANET').toUpperCase().trim(),
    [content.targetWord]
  );
  const distractors = useMemo(() => content.distractors || [], [content.distractors]);
  const hint = content.hint;

  const targetLength = targetWord.length;

  // Track slots and remaining bank tokens
  const [slots, setSlots] = useState<(LetterItem | null)[]>(() =>
    new Array(targetLength).fill(null)
  );
  const [bank, setBank] = useState<LetterItem[]>([]);
  const [activeDragItem, setActiveDragItem] = useState<LetterItem | null>(null);

  // Initialize randomized letter bank
  useEffect(() => {
    const targetLetters = targetWord.split('').filter(Boolean);
    const distractorLetters = distractors.map((d) => d.toUpperCase().trim()).filter(Boolean);
    const combined = [...targetLetters, ...distractorLetters];

    const tokens: LetterItem[] = combined.map((char, index) => ({
      id: `token-${char}-${index}-${Math.random().toString(36).substr(2, 4)}`,
      letter: char,
    }));

    // If pre-existing submitted answer is provided, map into slots
    if (submittedAnswer && submittedAnswer.length > 0) {
      const initialSlots: (LetterItem | null)[] = new Array(targetLength).fill(null);
      const remainingTokens = [...tokens];

      submittedAnswer.forEach((ansChar, idx) => {
        if (idx < targetLength && ansChar) {
          const tokenIdx = remainingTokens.findIndex((t) => t.letter === ansChar);
          if (tokenIdx !== -1) {
            initialSlots[idx] = remainingTokens[tokenIdx]!;
            remainingTokens.splice(tokenIdx, 1);
          } else {
            initialSlots[idx] = { id: `manual-${idx}-${ansChar}`, letter: ansChar };
          }
        }
      });

      setSlots(initialSlots);
      setBank(remainingTokens);
    } else {
      setSlots(new Array(targetLength).fill(null));
      setBank(shuffleLetters(tokens));
    }
  }, [targetWord, distractors, targetLength, submittedAnswer]);

  // Sensor configuration for touch and mouse with tap sensitivity threshold
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px threshold allows tap clicks to pass through freely
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150, // Short press activates drag on touch screens
        tolerance: 6,
      },
    })
  );

  const isAnswered = submittedAnswer !== undefined;
  const isInteractionDisabled = isEvaluating || isAnswered;

  /**
   * 1. Tap Bank Tile -> moves to first empty slot
   */
  const handleTapBankTile = (item: LetterItem) => {
    if (isInteractionDisabled) return;

    const firstEmptyIndex = slots.findIndex((s) => s === null);
    if (firstEmptyIndex === -1) {
      // Slots are completely filled
      playTap();
      return;
    }

    playPop();
    setSlots((prev) => {
      const next = [...prev];
      next[firstEmptyIndex] = item;
      return next;
    });
    setBank((prev) => prev.filter((b) => b.id !== item.id));
  };

  /**
   * 2. Tap Slot Tile -> returns to letter bank
   */
  const handleTapSlotTile = (slotIndex: number) => {
    if (isInteractionDisabled) return;

    const item = slots[slotIndex];
    if (!item) return;

    playPop();
    setSlots((prev) => {
      const next = [...prev];
      next[slotIndex] = null;
      return next;
    });
    setBank((prev) => [...prev, item]);
  };

  /**
   * Reset all slots back to the bank
   */
  const handleResetSlots = () => {
    if (isInteractionDisabled) return;
    playPop();

    const placedItems = slots.filter((s): s is LetterItem => s !== null);
    if (placedItems.length === 0) return;

    setBank((prev) => [...prev, ...placedItems]);
    setSlots(new Array(targetLength).fill(null));
  };

  /**
   * 3. Drag and Drop handlers
   */
  const handleDragStart = (event: DragStartEvent) => {
    if (isInteractionDisabled) return;
    const { active } = event;
    const item = active.data.current?.item as LetterItem;
    if (item) {
      setActiveDragItem(item);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragItem(null);
    if (isInteractionDisabled) return;

    const { active, over } = event;
    if (!over) return;

    const activeItem = active.data.current?.item as LetterItem;
    if (!activeItem) return;

    const fromSlotIndex = active.data.current?.fromSlotIndex as number | undefined;
    const fromBank = active.data.current?.fromBank as boolean | undefined;

    // Dropped on Bank Dropzone -> return to bank
    if (over.id === 'bank-dropzone') {
      if (fromSlotIndex !== undefined) {
        playPop();
        setSlots((prev) => {
          const next = [...prev];
          next[fromSlotIndex] = null;
          return next;
        });
        setBank((prev) => [...prev, activeItem]);
      }
      return;
    }

    // Dropped on a Slot
    if (typeof over.id === 'string' && over.id.startsWith('slot-')) {
      const toSlotIndex = parseInt(over.id.replace('slot-', ''), 10);
      if (isNaN(toSlotIndex) || toSlotIndex < 0 || toSlotIndex >= targetLength) return;

      playPop();

      if (fromSlotIndex !== undefined) {
        // Move or Swap between slots
        if (fromSlotIndex === toSlotIndex) return;

        setSlots((prev) => {
          const next = [...prev];
          const targetItem = next[toSlotIndex];
          next[toSlotIndex] = activeItem;
          next[fromSlotIndex] = targetItem || null;
          return next;
        });
      } else if (fromBank) {
        // Dragged from bank into slot
        setSlots((prev) => {
          const next = [...prev];
          const previousSlotItem = next[toSlotIndex];

          next[toSlotIndex] = activeItem;

          // If slot was occupied, return previous item to bank
          if (previousSlotItem) {
            setBank((b) => [...b.filter((item) => item.id !== activeItem.id), previousSlotItem]);
          } else {
            setBank((b) => b.filter((item) => item.id !== activeItem.id));
          }

          return next;
        });
      }
    }
  };

  /**
   * Submit assembled answer
   */
  const isAllFilled = slots.every((s) => s !== null);

  const handleSubmit = () => {
    if (isInteractionDisabled) return;
    const answerArr = slots.map((s) => (s ? s.letter : ''));
    playTap();
    onAnswerSubmit(answerArr);
  };

  // Droppable bank container
  const { setNodeRef: setBankDropRef } = useDroppable({
    id: 'bank-dropzone',
    disabled: isInteractionDisabled,
  });

  // Play sound when evaluation completes
  useEffect(() => {
    if (isCorrect === true) {
      playCorrect();
    } else if (isCorrect === false) {
      playWrong();
    }
  }, [isCorrect, playCorrect, playWrong]);

  // Calculate tile states after submission
  const getSlotTileState = (index: number): TileTokenState => {
    if (!isAnswered) return 'idle';
    if (isCorrect === true) return 'correct';
    if (isCorrect === false) {
      const currentItem = slots[index];
      if (currentItem && currentItem.letter === targetWord[index]) {
        return 'correct';
      }
      return 'wrong';
    }
    return 'selected';
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col items-center w-full max-w-2xl mx-auto py-4 px-2 select-none">
        {/* Optional Media Image */}
        {content.mediaUrl && (
          <div className="flex justify-center w-full mb-5">
            <img
              src={content.mediaUrl}
              alt="Petunjuk Gambar"
              className="max-h-56 sm:max-h-64 w-auto object-contain rounded-2xl border-2 border-slate-200 bg-white p-1.5 shadow-sm"
            />
          </div>
        )}

        {/* Question Prompt / Hint */}
        {hint && (
          <div className="flex items-center gap-2 px-4 py-2 bg-duo-blue-light/50 border border-duo-blue/30 rounded-2xl mb-6 text-duo-blue-border font-bold text-sm sm:text-base text-center max-w-md">
            <HelpCircle className="w-5 h-5 shrink-0" />
            <span>{hint}</span>
          </div>
        )}

        <h3 className="text-xl sm:text-2xl font-black text-duo-dark mb-6 text-center">
          Susun Huruf Menjadi Kata Yang Tepat
        </h3>

        {/* 1. Baris Slot Huruf Kotak Bergaris Putus-Putus */}
        <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 p-4 sm:p-6 bg-white border-2 border-slate-200 border-b-4 rounded-3xl w-full min-h-[100px] shadow-sm mb-6 sm:mb-8">
          {slots.map((item, index) => (
            <DroppableSlot
              key={`slot-${index}`}
              index={index}
              item={item}
              disabled={isInteractionDisabled}
              state={getSlotTileState(index)}
              onTap={() => handleTapSlotTile(index)}
            />
          ))}
        </div>

        {/* Slot Controls: Reset Button */}
        {!isAnswered && slots.some((s) => s !== null) && (
          <div className="flex justify-end w-full mb-3 px-2">
            <button
              type="button"
              onClick={handleResetSlots}
              className="flex items-center gap-1.5 text-xs font-black text-slate-400 hover:text-duo-dark transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Kosongkan Semua Slot</span>
            </button>
          </div>
        )}

        {/* 2. Bank Huruf Acak Balok 3D (TileToken.tsx) */}
        <div className="w-full flex flex-col gap-2">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Bank Huruf Pilihan:
            </span>
            <span className="text-xs font-bold text-slate-400">
              {bank.length} huruf tersisa
            </span>
          </div>

          <div
            ref={setBankDropRef}
            className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 p-4 sm:p-5 bg-slate-100/80 border-2 border-dashed border-slate-300 rounded-3xl min-h-[96px] w-full transition-colors"
          >
            {bank.length === 0 ? (
              <span className="text-xs font-bold text-slate-400 italic">
                Semua huruf telah dimasukkan ke dalam slot di atas
              </span>
            ) : (
              bank.map((token) => (
                <DraggableBankTile
                  key={token.id}
                  item={token}
                  disabled={isInteractionDisabled}
                  onTap={() => handleTapBankTile(token)}
                />
              ))
            )}
          </div>
        </div>

        {/* 3. Action Button: Periksa Jawaban */}
        <div className="w-full mt-8 sm:mt-10">
          <TactileButton
            type="button"
            variant="green"
            size="lg"
            fullWidth
            disabled={!isAllFilled || isEvaluating || isAnswered}
            onClick={handleSubmit}
            className="py-4 text-lg font-black tracking-wider shadow-md"
          >
            {isAnswered ? 'Jawaban Terkirim' : 'Periksa Jawaban'}
          </TactileButton>
        </div>

        {/* Post-submission Feedback Banner */}
        {isAnswered && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'mt-6 p-4 sm:p-5 rounded-2xl border-2 flex items-center gap-3.5 w-full text-left',
              isCorrect
                ? 'bg-duo-green-light/60 border-duo-green text-duo-dark'
                : 'bg-duo-red-light/60 border-duo-red text-duo-dark'
            )}
          >
            <div
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs',
                isCorrect ? 'bg-duo-green text-white' : 'bg-duo-red text-white'
              )}
            >
              {isCorrect ? <Check className="w-6 h-6 stroke-[3]" /> : <Sparkles className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider">
                {isCorrect ? 'Susunan Huruf Sempurna!' : 'Kata Belum Tepat'}
              </h4>
              <p className="text-sm font-bold mt-0.5">
                {isCorrect
                  ? `Luar biasa! Kamu berhasil menyusun kata "${targetWord}".`
                  : `Kunci kata yang benar adalah: ${targetWord}.`}
              </p>
            </div>
          </motion.div>
        )}

        {/* Drag Overlay when moving a tile */}
        <DragOverlay>
          {activeDragItem ? (
            <TileToken
              label={activeDragItem.letter}
              state="selected"
              size="md"
              className="shadow-2xl scale-110 pointer-events-none"
            />
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
};
