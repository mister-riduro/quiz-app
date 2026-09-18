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
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  Check,
  Sparkles,
  RotateCcw,
  Crosshair,
  X,
} from "lucide-react";
import { PlayerProps } from "@/plugins/core/types";
import {
  LabelledDiagramContent,
  LabelledDiagramAnswer,
  DiagramLabel,
} from "./types";
import { TactileButton } from "@/components/ui/TactileButton";
import { useSoundEffect } from "@/hooks/useSoundEffect";
import { cn } from "@/utils/cn";

// Fisher-Yates array shuffle
function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Droppable Target Pin on Canvas
 */
interface TargetPinProps {
  pin: DiagramLabel;
  index: number;
  attachedLabel?: DiagramLabel | null;
  isSelectedForPlacement: boolean;
  disabled: boolean;
  isAnswered: boolean;
  isCorrect?: boolean | null;
  onTapPin: () => void;
  onDetachLabel: () => void;
}

const TargetPin: React.FC<TargetPinProps> = ({
  pin,
  index,
  attachedLabel,
  isSelectedForPlacement,
  disabled,
  isAnswered,
  isCorrect,
  onTapPin,
  onDetachLabel,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: pin.id,
    disabled,
    data: { pin },
  });

  const hasLabel = Boolean(attachedLabel);
  const isLabelCorrect = isAnswered && isCorrect === true;
  const isLabelWrong = isAnswered && isCorrect === false;

  // Decide badge placement offset (place above if y > 25%, else place below)
  const placeAbove = pin.y > 22;

  return (
    <div
      ref={setNodeRef}
      style={{
        left: `${pin.x}%`,
        top: `${pin.y}%`,
      }}
      className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto"
    >
      {/* 44x44px minimum touch target for accessibility and smart boards */}
      <div
        onClick={!disabled ? onTapPin : undefined}
        className={cn(
          "relative w-11 h-11 flex items-center justify-center cursor-pointer select-none rounded-full transition-transform",
          !disabled && "hover:scale-110 active:scale-95",
        )}
        title={`Pin #${index + 1}: ${attachedLabel ? attachedLabel.text : "Belum berlabel"}`}
      >
        {/* Pulsing Ripple Rings (Active when no label attached) */}
        {!hasLabel && (
          <>
            <motion.span
              animate={{
                scale: [1, 1.8, 2.2],
                opacity: [0.8, 0.4, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 2.2,
                ease: "easeOut",
              }}
              className={cn(
                "absolute w-8 h-8 rounded-full pointer-events-none",
                isOver || isSelectedForPlacement
                  ? "bg-duo-blue"
                  : "bg-duo-yellow",
              )}
            />
            <motion.span
              animate={{
                scale: [1, 1.5, 1.9],
                opacity: [0.6, 0.3, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 2.2,
                delay: 0.6,
                ease: "easeOut",
              }}
              className={cn(
                "absolute w-8 h-8 rounded-full pointer-events-none",
                isOver || isSelectedForPlacement
                  ? "bg-duo-blue"
                  : "bg-duo-yellow",
              )}
            />
          </>
        )}

        {/* Central Anchor Dot */}
        <div
          className={cn(
            "relative w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center font-black text-[11px] sm:text-xs shadow-md transition-all",
            // Default unattached state
            !hasLabel &&
              !isOver &&
              !isSelectedForPlacement &&
              "bg-duo-yellow border-white text-duo-dark",
            // Drag-over or Tap-selected state
            (isOver || isSelectedForPlacement) &&
              "bg-duo-blue border-white text-white ring-4 ring-duo-blue/40 scale-125",
            // Attached label states
            hasLabel &&
              !isAnswered &&
              "bg-duo-blue border-white text-white ring-2 ring-duo-blue/30",
            hasLabel &&
              isLabelCorrect &&
              "bg-duo-green border-white text-white ring-4 ring-duo-green/40 shadow-[0_0_12px_#58cc02]",
            hasLabel &&
              isLabelWrong &&
              "bg-duo-red border-white text-white ring-4 ring-duo-red/40 shadow-[0_0_12px_#ea2b2b]",
          )}
        >
          {index + 1}
        </div>
      </div>

      {/* Attached Label Card & Glowing Connector Line */}
      <AnimatePresence>
        {attachedLabel && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: placeAbove ? 6 : -6 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", stiffness: 450, damping: 25 }}
            style={{
              transformOrigin: placeAbove ? "bottom center" : "top center",
            }}
            className={cn(
              "absolute left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-auto",
              placeAbove ? "bottom-full mb-1" : "top-full mt-1",
            )}
          >
            {/* Glowing Connector Stem */}
            <div
              className={cn(
                "w-1 transition-all duration-300",
                placeAbove ? "h-3" : "h-3 order-first",
                !isAnswered && "bg-duo-blue",
                isLabelCorrect && "bg-duo-green shadow-[0_0_8px_#58cc02]",
                isLabelWrong && "bg-duo-red shadow-[0_0_8px_#ea2b2b]",
              )}
            />

            {/* Tactile 3D Label Badge */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (!disabled) onDetachLabel();
              }}
              className={cn(
                "relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-b-4 font-black text-xs sm:text-sm whitespace-nowrap shadow-md select-none transition-all",
                !disabled
                  ? "cursor-pointer hover:scale-105 active:scale-95"
                  : "cursor-default",
                // Pre-submit appearance
                !isAnswered &&
                  "bg-white text-duo-dark border-duo-blue border-b-duo-blue-border hover:bg-duo-blue-light/30",
                // Correct evaluation appearance
                isLabelCorrect &&
                  "bg-duo-green-light text-duo-green-border border-duo-green border-b-duo-green-border shadow-[0_0_12px_rgba(88,204,2,0.4)]",
                // Wrong evaluation appearance
                isLabelWrong &&
                  "bg-duo-red-light text-duo-red-border border-duo-red border-b-duo-red-border shadow-[0_0_12px_rgba(255,75,75,0.4)]",
              )}
            >
              <span>{attachedLabel.text}</span>

              {/* Detach button icon when playing */}
              {!isAnswered && !disabled && (
                <button
                  type="button"
                  className="p-0.5 ml-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-duo-red transition-colors"
                  title="Lepaskan label dari pin"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Draggable / Tappable Word Badge in Lower Tray
 */
interface TrayLabelBadgeProps {
  label: DiagramLabel;
  isAttached: boolean;
  isSelected: boolean;
  disabled: boolean;
  onTap: () => void;
}

const TrayLabelBadge: React.FC<TrayLabelBadgeProps> = ({
  label,
  isAttached,
  isSelected,
  disabled,
  onTap,
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: label.id,
    disabled: disabled || isAttached,
    data: { label },
  });

  // If already placed on a pin, show a subtle ghost slot so the tray doesn't jump
  if (isAttached) {
    return (
      <div
        className="px-4 py-2.5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-200/40 text-transparent font-black text-sm select-none pointer-events-none"
        aria-hidden="true"
      >
        <span>{label.text}</span>
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
        "px-4 py-2.5 rounded-2xl border-2 border-b-4 border-solid shadow-sm text-sm sm:text-base",
        !disabled
          ? "cursor-pointer hover:border-duo-blue hover:border-b-duo-blue-border hover:-translate-y-0.5 active:translate-y-1 active:border-b-2"
          : "cursor-default opacity-60",
        isSelected
          ? "bg-duo-blue-light text-duo-blue-border border-duo-blue border-b-duo-blue-border ring-4 ring-duo-blue/20 scale-105"
          : "bg-white text-duo-dark border-slate-200 border-b-slate-300",
        isDragging && "opacity-25",
      )}
    >
      <span className="tracking-tight">{label.text}</span>
    </div>
  );
};

export const DiagramPlayer: React.FC<
  PlayerProps<LabelledDiagramContent, LabelledDiagramAnswer>
> = ({
  content,
  submittedAnswer,
  onAnswerSubmit,
  isEvaluating = false,
  isCorrect,
}) => {
  const { playTap, playPop, playCorrect, playWrong } = useSoundEffect();

  const imageUrl =
    content?.image_url ||
    (content as any)?.imageUrl ||
    (content as any)?.mediaUrl ||
    "";
  const pins = useMemo(() => content.labels || [], [content.labels]);
  const hint = content.hint;

  // Shuffled labels for the tray
  const [trayLabels, setTrayLabels] = useState<DiagramLabel[]>([]);
  // Placements state: maps pinId -> DiagramLabel
  const [placements, setPlacements] = useState<Record<string, DiagramLabel>>(
    {},
  );
  // Selected label for Tap-to-Place mode
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);
  const [activeDragLabel, setActiveDragLabel] = useState<DiagramLabel | null>(
    null,
  );

  // Initialize randomized tray labels and restore submitted answer if present
  useEffect(() => {
    if (pins.length === 0) return;

    // Build shuffled tray labels
    setTrayLabels(shuffleArray(pins));

    // Restore submitted answer if provided
    if (
      submittedAnswer &&
      typeof submittedAnswer === "object" &&
      !Array.isArray(submittedAnswer) &&
      Object.keys(submittedAnswer).length > 0
    ) {
      const restored: Record<string, DiagramLabel> = {};
      Object.entries(submittedAnswer).forEach(([pinId, answerValue]) => {
        const valStr =
          typeof answerValue === "string"
            ? answerValue
            : String(answerValue ?? "");
        const found = pins.find(
          (p) =>
            p.text.toLowerCase() === valStr.toLowerCase() || p.id === valStr,
        );
        if (found) {
          restored[pinId] = found;
        }
      });
      setPlacements(restored);
    } else {
      setPlacements({});
    }
  }, [pins, submittedAnswer]);

  // Sensor configuration for touch and mouse
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px threshold allows tap clicks without accidental drag
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

  // Sound feedback on evaluation
  useEffect(() => {
    if (isCorrect === true) {
      playCorrect();
    } else if (isCorrect === false) {
      playWrong();
    }
  }, [isCorrect, playCorrect, playWrong]);

  /**
   * 1. Tap label in tray (Tap-to-Place Mode)
   */
  const handleTapTrayLabel = (label: DiagramLabel) => {
    if (isInteractionDisabled) return;

    playTap();
    if (selectedLabelId === label.id) {
      // Deselect if tapping the same label
      setSelectedLabelId(null);
    } else {
      setSelectedLabelId(label.id);
    }
  };

  /**
   * 2. Tap target pin on canvas
   */
  const handleTapPin = (pin: DiagramLabel) => {
    if (isInteractionDisabled) return;

    // If a label is selected in tray, snap it to this pin!
    if (selectedLabelId) {
      const targetLabel = pins.find((l) => l.id === selectedLabelId);
      if (targetLabel) {
        playPop();
        setPlacements((prev) => {
          const next = { ...prev };
          // If label was attached elsewhere, detach it
          Object.keys(next).forEach((k) => {
            if (next[k]?.id === targetLabel.id) {
              delete next[k];
            }
          });
          next[pin.id] = targetLabel;
          return next;
        });
        setSelectedLabelId(null);
        return;
      }
    }

    // If no label is selected and pin is already occupied, detach it
    if (placements[pin.id]) {
      handleDetachLabel(pin.id);
    }
  };

  /**
   * 3. Detach label from pin
   */
  const handleDetachLabel = (pinId: string) => {
    if (isInteractionDisabled) return;
    playPop();
    setPlacements((prev) => {
      const next = { ...prev };
      delete next[pinId];
      return next;
    });
  };

  /**
   * 4. Reset all placements back to tray
   */
  const handleResetPlacements = () => {
    if (isInteractionDisabled) return;
    playPop();
    setPlacements({});
    setSelectedLabelId(null);
  };

  /**
   * 5. Drag-and-Drop handlers
   */
  const handleDragStart = (event: DragStartEvent) => {
    if (isInteractionDisabled) return;
    const label = (event.active.data.current?.label as DiagramLabel) || null;
    setActiveDragLabel(label);
    setSelectedLabelId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragLabel(null);
    if (isInteractionDisabled) return;

    const { active, over } = event;
    if (!over) return;

    const label = active.data.current?.label as DiagramLabel | undefined;
    if (!label) return;

    // Check if dropped onto a pin target
    const targetPinId = String(over.id);
    const targetPin = pins.find((p) => p.id === targetPinId);

    if (targetPin) {
      playPop();
      setPlacements((prev) => {
        const next = { ...prev };
        // Remove label from any other pin it was already attached to
        Object.keys(next).forEach((k) => {
          if (next[k]?.id === label.id) {
            delete next[k];
          }
        });
        next[targetPinId] = label;
        return next;
      });
    }
  };

  /**
   * 6. Submit Answer
   */
  const totalPinsCount = pins.length;
  const placedCount = Object.keys(placements).length;
  const isAllPlaced = totalPinsCount > 0 && placedCount === totalPinsCount;

  const handleSubmit = useCallback(() => {
    if (isInteractionDisabled || placedCount === 0) return;
    playTap();

    // Map pinId -> label text
    const answerMap: LabelledDiagramAnswer = {};
    Object.entries(placements).forEach(([pinId, label]) => {
      answerMap[pinId] = label.text;
    });

    onAnswerSubmit(answerMap);
  }, [isInteractionDisabled, placedCount, placements, playTap, onAnswerSubmit]);

  // Selected label object for indicator
  const selectedLabel = useMemo(
    () => pins.find((p) => p.id === selectedLabelId) || null,
    [pins, selectedLabelId],
  );

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col items-center w-full max-w-3xl mx-auto py-4 px-2 select-none">
        {/* Hint / Context Clue */}
        {hint && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-duo-blue-light/50 border border-duo-blue/30 rounded-2xl mb-6 text-duo-blue-border font-bold text-sm sm:text-base text-center max-w-lg">
            <HelpCircle className="w-5 h-5 shrink-0" />
            <span>{hint}</span>
          </div>
        )}

        {/* Title & Gesture Instructions */}
        <div className="flex flex-col items-center gap-1.5 mb-5 text-center">
          <h3 className="text-xl sm:text-2xl font-black text-duo-dark">
            Pasangkan Label Pada Titik Diagram Yang Tepat
          </h3>
          <p className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
            <Crosshair className="w-4 h-4 text-duo-blue" />
            <span>
              Seret kartu label ke titik target, atau ketuk label lalu ketuk
              titik pin
            </span>
          </p>
        </div>

        {/* Header Bar: Progress & Reset */}
        <div className="flex items-center justify-between w-full mb-3 px-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Label Terpasang:
            </span>
            <span className="text-xs font-extrabold text-duo-blue bg-duo-blue-light/50 px-2.5 py-0.5 rounded-lg border border-duo-blue/20">
              {placedCount} / {totalPinsCount} Label
            </span>
          </div>

          {!isAnswered && placedCount > 0 && (
            <button
              type="button"
              onClick={handleResetPlacements}
              className="flex items-center gap-1.5 text-xs font-black text-slate-400 hover:text-duo-red transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Semua Posisi</span>
            </button>
          )}
        </div>

        {/* 1. AREA DIAGRAM INTERAKTIF */}
        <div className="relative w-full rounded-3xl overflow-hidden border-2 border-slate-200 bg-slate-100 shadow-sm flex items-center justify-center min-h-[300px] max-h-[560px]">
          {/* Diagram Image */}
          <img
            src={imageUrl}
            alt="Diagram Interaktif Soal"
            className="w-full h-auto max-h-[540px] object-contain pointer-events-none select-none"
            draggable={false}
          />

          {/* Render All Target Pins on Relative Percentage Coordinates */}
          {pins.map((pin, index) => {
            const attached = placements[pin.id] || null;
            return (
              <TargetPin
                key={pin.id}
                pin={pin}
                index={index}
                attachedLabel={attached}
                isSelectedForPlacement={Boolean(selectedLabelId)}
                disabled={isInteractionDisabled}
                isAnswered={isAnswered}
                isCorrect={
                  isAnswered
                    ? attached
                      ? attached.text.trim().toLowerCase() ===
                        pin.text.trim().toLowerCase()
                      : false
                    : null
                }
                onTapPin={() => handleTapPin(pin)}
                onDetachLabel={() => handleDetachLabel(pin.id)}
              />
            );
          })}
        </div>

        {/* Selected Label Notification Bar (Tap-to-Place Guide) */}
        {selectedLabel && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mt-3 p-2.5 rounded-2xl bg-duo-blue-light/60 border border-duo-blue/30 flex items-center justify-between text-duo-blue-border text-xs font-bold px-4"
          >
            <span>
              Label terpilih:{" "}
              <b className="text-duo-dark underline">{selectedLabel.text}</b>.
              Ketuk titik target pin pada gambar di atas untuk menancapkannya.
            </span>
            <button
              type="button"
              onClick={() => setSelectedLabelId(null)}
              className="p-1 text-slate-400 hover:text-duo-red transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* 2. NAMPAN LABEL NAMA (AREA BAWAH) */}
        <div className="w-full flex flex-col gap-2.5 mt-6">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Nampan Kartu Label:
            </span>
            <span className="text-xs font-bold text-slate-400">
              {totalPinsCount - placedCount} kartu belum terpasang
            </span>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-2.5 sm:gap-3 p-5 sm:p-6 bg-slate-50/90 border-2 border-slate-200 border-b-4 rounded-3xl min-h-[96px] w-full shadow-xs">
            {trayLabels.map((label) => {
              const isAttached = Object.values(placements).some(
                (p) => p.id === label.id,
              );
              const isSelected = selectedLabelId === label.id;

              return (
                <TrayLabelBadge
                  key={label.id}
                  label={label}
                  isAttached={isAttached}
                  isSelected={isSelected}
                  disabled={isInteractionDisabled}
                  onTap={() => handleTapTrayLabel(label)}
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
                  ? "Semua Label Terpasang Tepat!"
                  : "Posisi Label Belum Tepat"}
              </h4>
              <p className="text-sm font-bold mt-0.5">
                {isCorrect
                  ? "Luar biasa! Seluruh label bagian diagram berhasil dipasangkan dengan akurat."
                  : "Cermati kembali bagian-bagian diagram dan coba periksa posisi pin yang berwarna merah."}
              </p>
            </div>
          </motion.div>
        )}

        {/* Drag Overlay when moving a label card */}
        <DragOverlay>
          {activeDragLabel ? (
            <div className="inline-flex items-center justify-center font-black px-4 py-2.5 rounded-2xl border-2 border-b-4 border-duo-blue bg-duo-blue-light text-duo-blue-border text-base shadow-2xl scale-110 pointer-events-none">
              <span className="tracking-tight">{activeDragLabel.text}</span>
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
};
