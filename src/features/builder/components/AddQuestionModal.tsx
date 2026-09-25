import React, { useEffect } from "react";
import { pluginRegistry } from "@/plugins/core/registry";
import { QuestionTypeEnum } from "@/types/database";
import { useSoundEffect } from "@/hooks/useSoundEffect";
import { X, Sparkles, ArrowRight } from "lucide-react";

export interface AddQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: QuestionTypeEnum) => void;
}

export const AddQuestionModal: React.FC<AddQuestionModalProps> = ({
  isOpen,
  onClose,
  onSelectType,
}) => {
  const { playTap, playPop } = useSoundEffect();
  const allRegisteredPlugins = pluginRegistry.getAllPlugins();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-duo-dark/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-3xl border-2 border-slate-200 border-b-4 border-b-slate-300 shadow-2xl p-5 sm:p-7 flex flex-col gap-4 sm:gap-5 max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b-2 border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-duo-blue-light border-2 border-duo-blue text-duo-blue flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-duo-dark tracking-tight">
                Pilih Format Mini-Game Soal
              </h2>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Tersedia {allRegisteredPlugins.length} format mini-game
                interaktif untuk kuis Anda.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              playTap();
              onClose();
            }}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-duo-dark flex items-center justify-center transition-all cursor-pointer shrink-0"
            aria-label="Tutup Dialog"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Plugin Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5 overflow-y-auto max-h-[62vh] pr-1 py-1">
          {allRegisteredPlugins.map((plugin) => {
            const Icon = plugin.icon;
            return (
              <button
                key={plugin.type}
                type="button"
                onClick={() => {
                  playPop();
                  onSelectType(plugin.type);
                  onClose();
                }}
                className="group p-3.5 sm:p-4 rounded-2xl border-2 border-slate-200 hover:border-duo-blue bg-white hover:bg-duo-blue-light/15 text-left transition-all duration-150 cursor-pointer shadow-xs hover:shadow-md active:translate-y-0.5 flex items-start gap-3.5"
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-duo-blue/10 group-hover:bg-duo-blue text-duo-blue group-hover:text-white flex items-center justify-center shrink-0 transition-colors shadow-2xs mt-0.5">
                  <Icon className="w-5 h-5 stroke-[2.2]" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5">
                    <h3 className="text-sm sm:text-base font-black text-duo-dark group-hover:text-duo-blue transition-colors">
                      {plugin.title}
                    </h3>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-duo-blue group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                  <p className="text-xs font-medium text-slate-500 mt-1 leading-relaxed">
                    {plugin.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AddQuestionModal;
