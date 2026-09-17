import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { BuilderQuestion } from "@/stores/builderStore";
import { pluginRegistry } from "@/plugins/core/registry";
import { cn } from "@/utils/cn";
import { GripVertical, Trash2, HelpCircle } from "lucide-react";

export interface SortableQuestionItemProps {
  question: BuilderQuestion;
  index: number;
  isActive: boolean;
  onSelect: () => void;
  onRemove: () => void;
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
    canRemove,
    timerMode = "global",
    globalSeconds = 30,
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

    // Get plugin icon if available
    let PluginIcon: React.ComponentType<{ className?: string }> = HelpCircle;
    let pluginTitle = "Soal";
    if (pluginRegistry.hasPlugin(question.type)) {
      const plugin = pluginRegistry.getPlugin(question.type);
      PluginIcon = plugin.icon;
      pluginTitle = plugin.title;
    }

    const effectiveSeconds =
      timerMode === "per_question"
        ? (question.timeLimitSeconds ?? 30)
        : (globalSeconds ?? 30);

    return (
      <div
        ref={setNodeRef}
        style={style}
        onClick={onSelect}
        className={cn(
          "group relative flex items-center gap-2 p-3 rounded-2xl border-2 transition-all cursor-pointer select-none bg-white",
          // Default border
          "border-duo-gray border-b-4 border-b-duo-gray-border hover:border-slate-300",
          // Active Question State
          isActive &&
            "border-duo-blue border-b-duo-blue-border bg-duo-blue-light/15 ring-2 ring-duo-blue/30",
          // Dragging State
          isDragging &&
            "opacity-70 shadow-xl scale-105 border-duo-orange border-b-duo-orange-border",
        )}
      >
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="text-slate-300 hover:text-duo-dark cursor-grab active:cursor-grabbing p-1 -ml-1 shrink-0"
          title="Geser untuk mengatur urutan"
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Number Badge */}
        <span
          className={cn(
            "w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0",
            isActive
              ? "bg-duo-blue text-white"
              : "bg-slate-100 text-duo-dark group-hover:bg-slate-200",
          )}
        >
          {index + 1}
        </span>

        {/* Type Icon & Info */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-duo-dark shrink-0">
            <PluginIcon className="w-4 h-4 text-duo-blue" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="block text-[11px] font-black uppercase text-slate-400 truncate">
                {pluginTitle}
              </span>
              <span className="text-[10px] font-extrabold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md shrink-0">
                {effectiveSeconds > 0 ? `${effectiveSeconds}s` : "∞"}
              </span>
            </div>
            <p className="text-xs font-bold text-duo-dark truncate">
              {question.titlePrompt || "Pertanyaan baru"}
            </p>
          </div>
        </div>

        {/* Remove Button */}
        {canRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-duo-red hover:bg-duo-red-light rounded-lg transition-all shrink-0"
            title="Hapus soal ini"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  },
);

SortableQuestionItem.displayName = "SortableQuestionItem";

export default SortableQuestionItem;
