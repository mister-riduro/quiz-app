import React, { useState, useEffect, useMemo, useCallback } from "react";
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
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  RotateCcw,
  Check,
  Sparkles,
  MoveHorizontal,
} from "lucide-react";
import { PlayerProps } from "@/plugins/core/types";
import { UnjumbleContent, UnjumbleAnswer, UnjumbleTokenItem } from "./types";
import { TactileButton } from "@/components/ui/TactileButton";
import { useSoundEffect } from "@/hooks/useSoundEffect";
import { cn } from "@/utils/cn";

/**
 * Fisher-Yates array shuffle that attempts to avoid returning the exact same order
 */
function shuffleTokens(tokens: UnjumbleTokenItem[]): UnjumbleTokenItem[] {
  if (tokens.length <= 1) return [...tokens];
  const copy = [...tokens];
  let attempts = 0;
  const originalOrder = tokens.map((t) => t.text).join(" ");

  do {
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    attempts++;
  } while (
    copy.map((t) => t.text).join(" ") === originalOrder &&
    attempts < 10
  );

  return copy;
}

/**
 * Component for a placed word tile inside the upper Wadah Kalimat
 */
interface PlacedSortableTileProps {
  item: UnjumbleTokenItem;
  index: number;
  disabled: boolean;
  isAnswered: boolean;
  isCorrect?: boolean | null;
  targetToken?: string;
  onTap: () => void;
}

const PlacedSortableTile: React.FC<PlacedSortableTileProps> = ({
  item,
  index,
  disabled,
  isAnswered,
  isCorrect,
  targetToken,
  onTap,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    disabled,
    data: { fromUpper: true, item, index },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  // Determine styling based on evaluation state
  const getStyleState = () => {
    if (!isAnswered) {
      return "bg-white text-duo-dark border-slate-200 border-b-slate-300 hover:border-duo-blue hover:border-b-duo-blue-border hover:bg-slate-50";
    }
    if (isCorrect === true) {
      return "bg-duo-green-light text-duo-green-border border-duo-green border-b-duo-green-border ring-2 ring-duo-green/30";
    }
    if (isCorrect === false) {
      const isWordInTargetPos =
        targetToken &&
        item.text.trim().toLowerCase() === targetToken.trim().toLowerCase();
      if (isWordInTargetPos) {
        return "bg-duo-green-light text-duo-green-border border-duo-green border-b-duo-green-border ring-2 ring-duo-green/30";
      }
      return "bg-duo-red-light text-duo-red-border border-duo-red border-b-duo-red-border ring-2 ring-duo-red/30";
    }
    return "bg-white text-duo-dark border-slate-200 border-b-slate-300";
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={!disabled ? onTap : undefined}
      className={cn(
        "relative inline-flex items-center justify-center font-black select-none transition-all duration-150",
        "px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl border-2 border-b-4 border-solid shadow-sm text-base sm:text-lg",
        !disabled
          ? "cursor-grab active:cursor-grabbing hover:-translate-y-0.5 active:translate-y-0.5"
          : "cursor-default",
        isDragging && "opacity-25 scale-95",
        getStyleState(),
      )}
    >
      <span className="tracking-tight drop-shadow-xs">{item.text}</span>
    </div>
  );
};

/**
 * Component for a word bubble in the lower Bank
 */
interface BankTileProps {
  item: UnjumbleTokenItem;
  isPlaced: boolean;
  disabled: boolean;
  onTap: () => void;
}

const BankTile: React.FC<BankTileProps> = ({
  item,
  isPlaced,
  disabled,
  onTap,
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
    disabled: disabled || isPlaced,
    data: { fromBank: true, item },
  });

  // If already placed, show a 3D ghost silhouette placeholder so layout doesn't jump
  if (isPlaced) {
    return (
      <div
        className="inline-flex items-center justify-center font-black select-none px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-200/40 text-transparent text-base sm:text-lg pointer-events-none"
        aria-hidden="true"
      >
        <span className="opacity-0">{item.text}</span>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={!disabled ? onTap : undefined}
      className={cn(
        "relative inline-flex items-center justify-center font-black select-none transition-all duration-150",
        "px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl border-2 border-b-4 border-solid shadow-sm text-base sm:text-lg",
        "bg-white text-duo-dark border-slate-200 border-b-slate-300",
        !disabled
          ? "cursor-pointer hover:border-duo-blue hover:border-b-duo-blue-border hover:-translate-y-1 hover:scale-105 active:translate-y-1 active:border-b-2"
          : "cursor-default opacity-60",
        isDragging && "opacity-25",
      )}
    >
      <span className="tracking-tight">{item.text}</span>
    </div>
  );
};

export const UnjumblePlayer: React.FC<
  PlayerProps<UnjumbleContent, UnjumbleAnswer>
> = ({
  content,
  submittedAnswer,
  onAnswerSubmit,
  isEvaluating = false,
  isCorrect,
}) => {
  const { playTap, playPop, playCorrect, playWrong } = useSoundEffect();

  // Target tokens from content
  const targetTokens = useMemo(() => {
    if (content.tokens && content.tokens.length > 0) {
      return content.tokens;
    }
    return (content.fullSentence || "").trim().split(/\s+/).filter(Boolean);
  }, [content.tokens, content.fullSentence]);

  // Master tokens with stable IDs
  const masterTokens: UnjumbleTokenItem[] = useMemo(() => {
    return targetTokens.map((text, index) => ({
      id: `token-${index}-${text.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
      text,
      originalIndex: index,
    }));
  }, [targetTokens]);

  // State: Bank pool (shuffled order) and Placed tokens in upper container
  const [bankTokens, setBankTokens] = useState<UnjumbleTokenItem[]>([]);
  const [placedTokens, setPlacedTokens] = useState<UnjumbleTokenItem[]>([]);
  const [activeDragItem, setActiveDragItem] =
    useState<UnjumbleTokenItem | null>(null);

  // Initialize or reset tokens
  useEffect(() => {
    if (masterTokens.length === 0) return;

    if (
      submittedAnswer &&
      Array.isArray(submittedAnswer) &&
      submittedAnswer.length > 0
    ) {
      // Reconstruct from submittedAnswer
      const remaining = [...masterTokens];
      const arranged: UnjumbleTokenItem[] = [];

      submittedAnswer.forEach((ansText) => {
        const foundIdx = remaining.findIndex(
          (t) => t.text.trim().toLowerCase() === ansText.trim().toLowerCase(),
        );
        if (foundIdx !== -1) {
          arranged.push(remaining[foundIdx]!);
          remaining.splice(foundIdx, 1);
        } else {
          arranged.push({
            id: `external-${ansText}-${Math.random().toString(36).substr(2, 4)}`,
            text: ansText,
            originalIndex: -1,
          });
        }
      });

      setPlacedTokens(arranged);
      setBankTokens(shuffleTokens(masterTokens));
    } else {
      setPlacedTokens([]);
      setBankTokens(shuffleTokens(masterTokens));
    }
  }, [masterTokens, submittedAnswer]);

  // Play audio on evaluation
  useEffect(() => {
    if (isCorrect === true) {
      playCorrect();
    } else if (isCorrect === false) {
      playWrong();
    }
  }, [isCorrect, playCorrect, playWrong]);

  // Sensor configuration for touch and mouse
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px threshold allows tap clicks to pass through without initiating drag
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 6,
      },
    }),
  );

  const isAnswered = submittedAnswer !== undefined;
  const isInteractionDisabled = isEvaluating || isAnswered;

  // Droppable containers for Sentence Tray (Upper) and Bank Tray (Lower)
  const { setNodeRef: setSentenceTrayRef, isOver: isOverSentenceTray } =
    useDroppable({
      id: "sentence-tray",
      disabled: isInteractionDisabled,
    });

  const { setNodeRef: setBankTrayRef } = useDroppable({
    id: "bank-tray",
    disabled: isInteractionDisabled,
  });

  /**
   * 1. Tap word in Bank -> leaps into upper Wadah Kalimat
   */
  const handleTapBankToken = (item: UnjumbleTokenItem) => {
    if (isInteractionDisabled) return;
    playPop();
    setPlacedTokens((prev) => [...prev, item]);
  };

  /**
   * 2. Tap word in upper Wadah Kalimat -> returns to Bank
   */
  const handleTapPlacedToken = (item: UnjumbleTokenItem) => {
    if (isInteractionDisabled) return;
    playPop();
    setPlacedTokens((prev) => prev.filter((t) => t.id !== item.id));
  };

  /**
   * 3. Reset all placed tokens back to the bank
   */
  const handleResetTray = () => {
    if (isInteractionDisabled || placedTokens.length === 0) return;
    playPop();
    setPlacedTokens([]);
  };

  /**
   * 4. Drag and Drop handlers
   */
  const handleDragStart = (event: DragStartEvent) => {
    if (isInteractionDisabled) return;
    const { active } = event;
    const item = (active.data.current?.item as UnjumbleTokenItem) || null;
    setActiveDragItem(item);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragItem(null);
    if (isInteractionDisabled) return;

    const { active, over } = event;
    if (!over) return;

    const activeItem = active.data.current?.item as
      | UnjumbleTokenItem
      | undefined;
    if (!activeItem) return;

    const fromUpper = Boolean(active.data.current?.fromUpper);
    const fromBank = Boolean(active.data.current?.fromBank);

    // Case A: Dropped onto Bank Tray -> remove from upper tray if it came from upper
    if (over.id === "bank-tray") {
      if (fromUpper) {
        playPop();
        setPlacedTokens((prev) => prev.filter((t) => t.id !== activeItem.id));
      }
      return;
    }

    // Case B: Reordering or inserting within upper Wadah Kalimat
    if (fromUpper) {
      if (active.id !== over.id) {
        const oldIndex = placedTokens.findIndex((t) => t.id === active.id);
        const newIndex = placedTokens.findIndex((t) => t.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          playPop();
          setPlacedTokens((prev) => arrayMove(prev, oldIndex, newIndex));
        }
      }
      return;
    }

    // Case C: Dragged from Bank into upper Wadah Kalimat
    if (fromBank) {
      // Check if it's already in placedTokens
      const isAlreadyPlaced = placedTokens.some((t) => t.id === activeItem.id);
      if (isAlreadyPlaced) return;

      playPop();

      if (over.id === "sentence-tray") {
        // Appended to the end of tray
        setPlacedTokens((prev) => [...prev, activeItem]);
      } else {
        // Dropped over a specific token in upper tray -> insert at that index
        const overIndex = placedTokens.findIndex((t) => t.id === over.id);
        if (overIndex !== -1) {
          setPlacedTokens((prev) => [
            ...prev.slice(0, overIndex),
            activeItem,
            ...prev.slice(overIndex),
          ]);
        } else {
          setPlacedTokens((prev) => [...prev, activeItem]);
        }
      }
    }
  };

  // Submit assembled sentence
  const handleSubmit = useCallback(() => {
    if (isInteractionDisabled || placedTokens.length === 0) return;
    playTap();
    const answerList = placedTokens.map((t) => t.text);
    onAnswerSubmit(answerList);
  }, [isInteractionDisabled, placedTokens, playTap, onAnswerSubmit]);

  const placedIds = useMemo(
    () => placedTokens.map((t) => t.id),
    [placedTokens],
  );
  const isAllPlaced =
    masterTokens.length > 0 && placedTokens.length === masterTokens.length;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col items-center w-full max-w-3xl mx-auto py-4 px-2 select-none">
        {/* Optional Media Image */}
        {content.mediaUrl && !(content as any)._hideMedia && (
          <div className="flex justify-center w-full mb-5">
            <img
              src={content.mediaUrl}
              alt="Petunjuk Gambar"
              className="max-h-56 sm:max-h-64 w-auto object-contain rounded-2xl border-2 border-slate-200 bg-white p-1.5 shadow-sm"
            />
          </div>
        )}

        {/* Hint / Context Clue */}
        {content.hint && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-duo-blue-light/50 border border-duo-blue/30 rounded-2xl mb-6 text-duo-blue-border font-bold text-sm sm:text-base text-center max-w-lg">
            <HelpCircle className="w-5 h-5 shrink-0" />
            <span>{content.hint}</span>
          </div>
        )}

        {/* Title & Gesture Instruction */}
        <div className="flex flex-col items-center gap-1.5 mb-6 text-center">
          <h3 className="text-xl sm:text-2xl font-black text-duo-dark">
            Susun Balok Kata Menjadi Kalimat Utuh
          </h3>
          <p className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
            <MoveHorizontal className="w-4 h-4 text-duo-blue" />
            <span>
              Ketuk kata untuk memindahkan, atau geser untuk menyisipkan posisi
            </span>
          </p>
        </div>

        {/* Header Bar: Tray Word Count & Reset */}
        <div className="flex items-center justify-between w-full mb-2.5 px-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Wadah Kalimat:
            </span>
            <span className="text-xs font-extrabold text-duo-blue bg-duo-blue-light/50 px-2.5 py-0.5 rounded-lg border border-duo-blue/20">
              {placedTokens.length} / {masterTokens.length} Kata
            </span>
          </div>

          {!isAnswered && placedTokens.length > 0 && (
            <button
              type="button"
              onClick={handleResetTray}
              className="flex items-center gap-1.5 text-xs font-black text-slate-400 hover:text-duo-red transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Kosongkan Wadah</span>
            </button>
          )}
        </div>

        {/* 1. AREA ATAS: "Wadah Kalimat" dengan background abu-abu halus dan garis batas melengkung */}
        <div
          ref={setSentenceTrayRef}
          className={cn(
            "relative flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 p-5 sm:p-7 w-full",
            "min-h-[140px] sm:min-h-[160px] rounded-3xl transition-all duration-200",
            "bg-slate-100/90 border-2 border-slate-300 shadow-inner",
            isOverSentenceTray &&
              !isInteractionDisabled &&
              "border-duo-blue bg-duo-blue-light/20 ring-4 ring-duo-blue/20",
          )}
        >
          {/* Subtle lined baseline guide lines */}
          <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 h-[1px] border-b border-dashed border-slate-300 pointer-events-none opacity-60" />

          <SortableContext items={placedIds} strategy={rectSortingStrategy}>
            <AnimatePresence>
              {placedTokens.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-1.5 py-4 text-center select-none z-10">
                  <span className="text-sm sm:text-base font-bold text-slate-400">
                    Ketuk kata di bawah atau seret ke sini untuk menyusun
                    kalimat
                  </span>
                  <span className="text-xs font-semibold text-slate-300">
                    Balok-balok kata akan berbaris rapi di wadah ini
                  </span>
                </div>
              ) : (
                placedTokens.map((item, index) => (
                  <PlacedSortableTile
                    key={item.id}
                    item={item}
                    index={index}
                    disabled={isInteractionDisabled}
                    isAnswered={isAnswered}
                    isCorrect={isCorrect}
                    targetToken={targetTokens[index]}
                    onTap={() => handleTapPlacedToken(item)}
                  />
                ))
              )}
            </AnimatePresence>
          </SortableContext>
        </div>

        {/* 2. AREA BAWAH: Kumpulan gelembung kata acak bertekstur 3D */}
        <div className="w-full flex flex-col gap-2.5 mt-8">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Kumpulan Gelembung Kata:
            </span>
            <span className="text-xs font-bold text-slate-400">
              {masterTokens.length - placedTokens.length} kata tersedia
            </span>
          </div>

          <div
            ref={setBankTrayRef}
            className="flex flex-wrap justify-center items-center gap-2.5 sm:gap-3.5 p-5 sm:p-6 bg-slate-50/90 border-2 border-slate-200 border-b-4 rounded-3xl min-h-[120px] w-full shadow-xs"
          >
            {bankTokens.map((item) => {
              const isPlaced = placedTokens.some((t) => t.id === item.id);
              return (
                <BankTile
                  key={item.id}
                  item={item}
                  isPlaced={isPlaced}
                  disabled={isInteractionDisabled}
                  onTap={() => handleTapBankToken(item)}
                />
              );
            })}
          </div>
        </div>

        {/* 3. Action Button: Periksa Jawaban */}
        <div className="w-full mt-8 sm:mt-10">
          <TactileButton
            type="button"
            variant="green"
            size="lg"
            fullWidth
            disabled={!isAllPlaced || isEvaluating || isAnswered}
            onClick={handleSubmit}
            className="py-4 text-lg font-black tracking-wider shadow-md"
          >
            {isAnswered ? "Jawaban Terkirim" : "Periksa Jawaban"}
          </TactileButton>
        </div>

        {/* Post-submission Educational Feedback Banner */}
        {isAnswered && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "mt-6 p-4 sm:p-5 rounded-2xl border-2 flex items-center gap-3.5 w-full text-left",
              isCorrect
                ? "bg-duo-green-light/60 border-duo-green text-duo-dark"
                : "bg-duo-red-light/60 border-duo-red text-duo-dark",
            )}
          >
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs",
                isCorrect ? "bg-duo-green text-white" : "bg-duo-red text-white",
              )}
            >
              {isCorrect ? (
                <Check className="w-6 h-6 stroke-[3]" />
              ) : (
                <Sparkles className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider">
                {isCorrect
                  ? "Kalimat Berhasil Disusun Sempurna!"
                  : "Susunan Kalimat Belum Tepat"}
              </h4>
              <p className="text-sm font-bold mt-0.5">
                {isCorrect
                  ? "Luar biasa! Seluruh balok kata berada pada posisi yang tepat."
                  : `Kalimat yang benar adalah: "${content.fullSentence || targetTokens.join(" ")}"`}
              </p>
            </div>
          </motion.div>
        )}

        {/* Drag Overlay when moving a word tile */}
        <DragOverlay>
          {activeDragItem ? (
            <div className="inline-flex items-center justify-center font-black px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl border-2 border-b-4 border-duo-blue bg-duo-blue-light text-duo-blue-border text-base sm:text-lg shadow-2xl scale-110 pointer-events-none">
              <span className="tracking-tight drop-shadow-xs">
                {activeDragItem.text}
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
};
