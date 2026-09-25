import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { BuilderQuestion } from "@/stores/builderStore";
import { pluginRegistry } from "@/plugins/core/registry";
import { cn } from "@/utils/cn";
import { GripVertical, Trash2, Copy } from "lucide-react";
import { DuoMathRenderer } from "@/components/common/DuoMathRenderer";

export interface SortableQuestionItemProps {
  question: BuilderQuestion;
  index: number;
  isActive: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onDuplicate?: () => void;
  canRemove: boolean;
  timerMode?: "global" | "per_question";
  globalSeconds?: number;
}

export const SortableQuestionItem = React.memo<SortableQuestionItemProps>(
  ({
    question,
    index,
    isActive,
    onSelect,
    onRemove,
    onDuplicate,
    canRemove,
    timerMode = "global",
  }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: question.id });

    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
      zIndex: isDragging ? 50 : undefined,
    };

    // Get plugin title only (no icon as requested)
    let pluginTitle = "Soal";
    if (pluginRegistry.hasPlugin(question.type)) {
      pluginTitle = pluginRegistry.getPlugin(question.type).title;
    }

    return (
      <div
        ref={setNodeRef}
        style={style}
        onClick={onSelect}
        className={cn(
          "group relative flex items-start gap-2 p-2.5 rounded-xl border-2 transition-all cursor-pointer select-none bg-white",
          // Default State
          "border-slate-200 hover:border-slate-300 hover:shadow-sm",
          // Active State
          isActive &&
            "border-duo-blue bg-blue-50/20 shadow-sm ring-2 ring-duo-blue/30",
          // Dragging State
          isDragging &&
            "opacity-70 shadow-xl scale-105 border-duo-orange border-b-duo-orange-border",
        )}
      >
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="text-slate-300 hover:text-duo-dark cursor-grab active:cursor-grabbing p-1 -ml-1 mt-0.5 shrink-0"
          title="Geser untuk mengatur urutan"
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Left Column: Number Badge */}
        <span
          className={cn(
            "w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 mt-0.5",
            isActive
              ? "bg-duo-blue text-white"
              : "bg-slate-100 text-duo-dark group-hover:bg-slate-200",
          )}
        >
          {index + 1}
        </span>

        {/* Content Column: Type Name + Action Buttons, Prompt, and Points/Time below */}
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          {/* Top Row: Question Type & Actions Container (fill-container) */}
          <div className="w-full flex items-center justify-between gap-1 min-h-[22px]">
            <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider truncate">
              {pluginTitle}
            </span>

            {/* Actions: Duplicate & Delete (appear only on hover) */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              {onDuplicate && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate();
                  }}
                  className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-duo-blue hover:bg-duo-blue-light/50 transition-all cursor-pointer"
                  title="Duplikasi soal ini"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              )}

              {canRemove && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                  }}
                  className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-duo-red hover:bg-duo-red-light transition-all cursor-pointer"
                  title="Hapus soal ini"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Question Prompt */}
          <div
            className={cn(
              "text-xs truncate",
              question.titlePrompt
                ? "font-bold text-duo-dark"
                : "font-medium text-slate-400 italic",
            )}
          >
            {question.titlePrompt ? (
              <DuoMathRenderer content={question.titlePrompt} inlineOnly />
            ) : (
              "(Belum ada pertanyaan)"
            )}
          </div>

          {/* Bottom Row: Points & Time Limit */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <span
              className={cn(
                "text-[10px] font-extrabold px-1.5 py-0.5 rounded-md leading-none",
                question.points === 0
                  ? "bg-slate-100 text-slate-500"
                  : "bg-amber-50 text-amber-700 border border-amber-200/60",
              )}
              title={
                question.points === 0
                  ? "Tanpa Poin"
                  : `Nilai: ${question.points} Poin`
              }
            >
              {question.points === 0 ? "Tanpa Poin" : `${question.points} Poin`}
            </span>
            {timerMode === "per_question" && (
              <span
                className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 leading-none"
                title={`Durasi Soal: ${question.timeLimitSeconds ?? 30} Detik`}
              >
                {(question.timeLimitSeconds ?? 30) > 0
                  ? `${question.timeLimitSeconds ?? 30}s`
                  : "∞"}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  },
);

SortableQuestionItem.displayName = "SortableQuestionItem";

export default SortableQuestionItem;
