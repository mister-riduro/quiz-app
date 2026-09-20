import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { Reorder } from "framer-motion";
import { Shuffle, HelpCircle, MoveHorizontal } from "lucide-react";
import { PlayerProps } from "@/plugins/core/types";
import { AnagramContent, AnagramAnswer } from "./types";
import { TactileButton } from "@/components/ui/TactileButton";
import { useSoundEffect } from "@/hooks/useSoundEffect";
import { cn } from "@/utils/cn";

interface AnagramTile {
  id: string;
  letter: string;
}

export const AnagramPlayer: React.FC<
  PlayerProps<AnagramContent, AnagramAnswer>
> = ({
  content,
  submittedAnswer,
  onAnswerSubmit,
  isEvaluating = false,
  isCorrect,
}) => {
  const { playTap, playPop, playCorrect, playWrong } = useSoundEffect();

  const targetWord = useMemo(
    () => (content.targetWord || "MATAHARI").toUpperCase().trim(),
    [content.targetWord],
  );
  const hint = content.hint;

  // Scramble helper that ensures result differs from targetWord if possible
  const scrambleTiles = useCallback(
    (tiles: AnagramTile[]): AnagramTile[] => {
      if (tiles.length <= 1) return tiles;
      const copy = [...tiles];
      let attempts = 0;
      do {
        for (let i = copy.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        attempts++;
      } while (
        copy.map((t) => t.letter).join("") === targetWord &&
        attempts < 10
      );
      return copy;
    },
    [targetWord],
  );

  // State for draggable reorderable tiles
  const [items, setItems] = useState<AnagramTile[]>([]);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);

  // Prevent tile from becoming selected when dropped after a drag operation
  const isDraggingRef = useRef(false);
  const dragEndTimeRef = useRef(0);

  // Initialize or reset tiles
  useEffect(() => {
    setSelectedTileId(null);
    const chars = targetWord.split("").filter(Boolean);
    const initialTiles: AnagramTile[] = chars.map((char, index) => ({
      id: `tile-${char}-${index}-${Math.random().toString(36).substr(2, 4)}`,
      letter: char,
    }));

    if (submittedAnswer) {
      // If already answered, align according to submittedAnswer safely
      let answerStr = "";
      if (typeof submittedAnswer === "string") {
        answerStr = submittedAnswer;
      } else if (Array.isArray(submittedAnswer as any)) {
        answerStr = (submittedAnswer as any[]).join("");
      }
      const answerChars: string[] = answerStr.toUpperCase().split("");
      const pool = [...initialTiles];
      const arranged: AnagramTile[] = [];

      answerChars.forEach((c: string) => {
        const foundIdx = pool.findIndex((p) => p.letter === c);
        if (foundIdx !== -1) {
          arranged.push(pool[foundIdx]!);
          pool.splice(foundIdx, 1);
        }
      });
      // Append any leftovers
      arranged.push(...pool);
      setItems(arranged);
    } else {
      setItems(scrambleTiles(initialTiles));
    }
  }, [targetWord, submittedAnswer, scrambleTiles]);

  // Audio feedback on evaluation
  useEffect(() => {
    if (isCorrect === true) {
      playCorrect();
    } else if (isCorrect === false) {
      playWrong();
    }
  }, [isCorrect, playCorrect, playWrong]);

  const isAnswered = submittedAnswer !== undefined;
  const isInteractionDisabled = isEvaluating || isAnswered;

  // Shuffle button handler
  const handleShuffle = () => {
    if (isInteractionDisabled) return;
    playPop();
    setSelectedTileId(null);
    setItems((prev) => scrambleTiles(prev));
  };

  // Tap-to-swap handler for easy interaction on proyektor / touchscreens
  const handleTileClick = (item: AnagramTile) => {
    if (isInteractionDisabled) return;
    playTap();
    if (!selectedTileId) {
      setSelectedTileId(item.id);
    } else if (selectedTileId === item.id) {
      setSelectedTileId(null);
    } else {
      // Swap two tiles
      setItems((prev) => {
        const idxA = prev.findIndex((p) => p.id === selectedTileId);
        const idxB = prev.findIndex((p) => p.id === item.id);
        if (idxA === -1 || idxB === -1) return prev;
        const copy = [...prev];
        const temp = copy[idxA]!;
        copy[idxA] = copy[idxB]!;
        copy[idxB] = temp;
        return copy;
      });
      playPop();
      setSelectedTileId(null);
    }
  };

  // Submit assembled word
  const currentWord = items.map((i) => i.letter).join("");

  const handleSubmit = () => {
    if (isInteractionDisabled) return;
    playTap();
    onAnswerSubmit(currentWord);
  };

  // Dynamic responsive tile configuration based on character count:
  // Tiles fill container width (flex-1), with taller height and bold adaptive letter typography
  const tileConfig = useMemo(() => {
    const len = items.length;
    if (len <= 6) {
      return {
        tileClass:
          "flex-1 min-w-[54px] max-w-[76px] h-[80px] sm:h-[94px] px-2 sm:px-3 rounded-2xl",
        textClass: "text-3xl sm:text-4xl",
        subTextClass: "text-xs font-black",
        gapClass: "gap-2.5 sm:gap-3.5",
        containerPad: "p-4 sm:p-6",
        minTrayHeight: "min-h-[125px] sm:min-h-[145px]",
      };
    }
    if (len <= 8) {
      return {
        tileClass:
          "flex-1 min-w-[44px] max-w-[66px] h-[72px] sm:h-[86px] px-1.5 sm:px-2.5 rounded-2xl",
        textClass: "text-2xl sm:text-3xl",
        subTextClass: "text-[10px] sm:text-xs font-black",
        gapClass: "gap-2 sm:gap-2.5",
        containerPad: "p-3.5 sm:p-5",
        minTrayHeight: "min-h-[115px] sm:min-h-[135px]",
      };
    }
    if (len <= 11) {
      return {
        tileClass:
          "flex-1 min-w-[36px] max-w-[54px] h-[64px] sm:h-[76px] px-1 sm:px-2 rounded-xl sm:rounded-2xl",
        textClass: "text-xl sm:text-2xl",
        subTextClass: "text-[9px] sm:text-[10px] font-bold",
        gapClass: "gap-1.5 sm:gap-2",
        containerPad: "p-3 sm:p-4",
        minTrayHeight: "min-h-[105px] sm:min-h-[125px]",
      };
    }
    return {
      tileClass:
        "flex-1 min-w-[30px] max-w-[46px] h-[58px] sm:h-[68px] px-1 sm:px-1.5 rounded-lg sm:rounded-xl",
      textClass: "text-lg sm:text-xl",
      subTextClass: "text-[8px] sm:text-[9px] font-bold",
      gapClass: "gap-1 sm:gap-1.5",
      containerPad: "p-2.5 sm:p-3.5",
      minTrayHeight: "min-h-[95px] sm:min-h-[115px]",
    };
  }, [items.length]);

  // Tile visual state styling
  const getTileStyle = (
    index: number,
    letter: string,
    isSelected?: boolean,
  ) => {
    if (isSelected) {
      return "bg-duo-blue-light text-duo-blue-border border-duo-blue border-b-duo-blue-border border-r-duo-blue-border ring-4 ring-duo-blue/40 scale-105 z-20 shadow-md";
    }
    if (!isAnswered) {
      return "bg-white text-duo-dark border-duo-gray border-b-duo-gray-border border-r-duo-gray-border hover:bg-slate-50";
    }
    if (isCorrect === true) {
      return "bg-duo-green-light text-duo-green-border border-duo-green border-b-duo-green-border border-r-duo-green-border ring-2 ring-duo-green/30";
    }
    if (isCorrect === false) {
      const isCharMatchingTarget = letter === targetWord[index];
      if (isCharMatchingTarget) {
        return "bg-duo-green-light text-duo-green-border border-duo-green border-b-duo-green-border border-r-duo-green-border ring-2 ring-duo-green/30";
      }
      return "bg-duo-red-light text-duo-red-border border-duo-red border-b-duo-red-border border-r-duo-red-border ring-2 ring-duo-red/30";
    }
    return "bg-duo-blue-light text-duo-blue-border border-duo-blue border-b-duo-blue-border border-r-duo-blue-border";
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto py-4 px-2 select-none">
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
      {hint && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-duo-blue-light/50 border border-duo-blue/30 rounded-2xl mb-6 text-duo-blue-border font-bold text-sm sm:text-base text-center max-w-lg">
          <HelpCircle className="w-5 h-5 shrink-0" />
          <span>{hint}</span>
        </div>
      )}

      {/* Title & Gesture Instruction */}
      <div className="flex flex-col items-center gap-1.5 mb-6 text-center">
        <h3 className="text-xl sm:text-2xl font-black text-duo-dark">
          Tukar & Susun Kembali Balok Huruf
        </h3>
        <p className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-400 text-center flex-wrap">
          <MoveHorizontal className="w-4 h-4 text-duo-blue shrink-0" />
          <span>
            Geser balok huruf untuk mengubah urutan, atau ketuk 2 balok untuk
            menukar posisi
          </span>
        </p>
      </div>

      {/* Header Bar with Shuffle Button */}
      <div className="flex items-center justify-between w-full mb-3 px-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400">
            Kata Saat Ini:
          </span>
          <span className="font-mono font-black text-base text-duo-blue tracking-widest bg-duo-blue-light/40 px-2.5 py-0.5 rounded-lg border border-duo-blue/20">
            {currentWord}
          </span>
        </div>

        {!isAnswered && items.length > 1 && (
          <TactileButton
            type="button"
            variant="outline"
            size="sm"
            disabled={isInteractionDisabled}
            onClick={handleShuffle}
            icon={<Shuffle className="w-3.5 h-3.5 text-duo-blue" />}
            className="text-xs font-black border-2 border-slate-200"
          >
            Acak Ulang
          </TactileButton>
        )}
      </div>

      {/* Reorderable Horizontal 3D Tile Container with Safe Horizontal Scrolling & Auto-Scaling */}
      <div className="w-full overflow-x-auto py-3 px-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        <Reorder.Group
          axis="x"
          values={items}
          onReorder={(newOrder) => {
            if (isInteractionDisabled) return;
            playPop();
            setItems(newOrder);
            setSelectedTileId(null);
          }}
          as="div"
          className={cn(
            "flex items-center w-full min-w-fit mx-auto justify-center",
            tileConfig.gapClass,
            tileConfig.containerPad,
            tileConfig.minTrayHeight,
            "bg-white border-2 border-slate-200 border-b-4 rounded-3xl shadow-sm",
          )}
        >
          {items.map((item, index) => {
            const isSelected = selectedTileId === item.id;
            return (
              <Reorder.Item
                key={item.id}
                value={item}
                as="div"
                onDragStart={() => {
                  isDraggingRef.current = true;
                  setSelectedTileId(null);
                }}
                onDragEnd={() => {
                  dragEndTimeRef.current = Date.now();
                  setTimeout(() => {
                    isDraggingRef.current = false;
                  }, 100);
                }}
                onClick={() => {
                  // If mouseup was from finishing a drag, do not select or swap tile
                  if (
                    isDraggingRef.current ||
                    Date.now() - dragEndTimeRef.current < 250
                  ) {
                    return;
                  }
                  handleTileClick(item);
                }}
                dragListener={!isInteractionDisabled}
                dragMomentum={false}
                dragElastic={0}
                whileHover={
                  !isInteractionDisabled ? { scale: 1.04, y: -2 } : undefined
                }
                whileDrag={{
                  scale: 1.05,
                  boxShadow: "0 16px 28px -4px rgba(0, 0, 0, 0.25)",
                  zIndex: 50,
                }}
                transition={{
                  layout: { type: "spring", stiffness: 600, damping: 35 },
                }}
                className={cn(
                  "relative flex flex-col items-center justify-between font-black select-none shrink-0 transition-colors duration-150",
                  "border-2 border-b-4 border-r-2 shadow-sm",
                  tileConfig.tileClass,
                  !isInteractionDisabled
                    ? "cursor-grab active:cursor-grabbing touch-none"
                    : "cursor-default",
                  getTileStyle(index, item.letter, isSelected),
                )}
              >
                {/* Letter character fills the upper & central portion of the tile */}
                <div className="flex-1 flex items-center justify-center w-full min-h-0">
                  <span
                    className={cn(
                      "tracking-tight drop-shadow-xs leading-none select-none font-black text-center",
                      tileConfig.textClass,
                    )}
                  >
                    {item.letter}
                  </span>
                </div>

                {/* Index number neatly placed at bottom */}
                <span
                  className={cn(
                    "opacity-55 leading-none pb-1.5 select-none",
                    tileConfig.subTextClass,
                  )}
                >
                  {index + 1}
                </span>
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
      </div>

      {/* Action Button: Periksa Jawaban */}
      <div className="w-full mt-8 sm:mt-10">
        <TactileButton
          type="button"
          variant="green"
          size="lg"
          fullWidth
          disabled={isInteractionDisabled}
          onClick={handleSubmit}
          className="py-4 text-lg font-black tracking-wider shadow-md"
        >
          {isAnswered ? "Jawaban Terkirim" : "Periksa Jawaban"}
        </TactileButton>
      </div>
    </div>
  );
};
