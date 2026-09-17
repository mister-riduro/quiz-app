import React, { useState, useRef } from 'react';
import {
  MapPin,
  HelpCircle,
  Trash2,
  Crosshair,
  Image as ImageIcon,
  RotateCcw,
} from 'lucide-react';
import { EditorProps } from '@/plugins/core/types';
import { LabelledDiagramContent, DiagramLabel } from './types';
import { DuoCard } from '@/components/ui/DuoCard';
import { ImageUploader } from '@/components/common/ImageUploader';
import { Badge } from '@/components/ui/Badge';
import { useSoundEffect } from '@/hooks/useSoundEffect';
import { cn } from '@/utils/cn';

// High-quality default educational diagram: Anatomi Bunga Sempurna (Stylized SVG Illustration)
export const DEFAULT_DIAGRAM_IMAGE =
  'https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&w=1000&q=80';

export const DiagramEditor: React.FC<EditorProps<LabelledDiagramContent>> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const { playPop, playTap } = useSoundEffect();

  const imageUrl = value?.image_url || DEFAULT_DIAGRAM_IMAGE;
  const labels = value?.labels || [];
  const hint = value?.hint || '';

  const [activePinId, setActivePinId] = useState<string | null>(null);
  const [isDraggingPin, setIsDraggingPin] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update image URL
  const handleImageUrlChange = (url: string) => {
    onChange({
      ...value,
      image_url: url,
    });
  };

  // Add new pin on image click
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || isDraggingPin) return;
    if (!containerRef.current) return;

    // Do not trigger if clicking an existing pin directly
    const target = e.target as HTMLElement;
    if (target.closest('.diagram-pin-marker')) return;

    const rect = containerRef.current.getBoundingClientRect();
    const xPercent = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    const yPercent = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));

    const roundedX = Math.round(xPercent * 10) / 10;
    const roundedY = Math.round(yPercent * 10) / 10;

    playPop();
    const newId = `pin-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newLabel: DiagramLabel = {
      id: newId,
      text: `Bagian ${labels.length + 1}`,
      x: roundedX,
      y: roundedY,
    };

    onChange({
      ...value,
      labels: [...labels, newLabel],
    });
    setActivePinId(newId);
  };

  // Dragging pin across canvas to fine-tune percentage coordinates
  const handlePinPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    pinId: string
  ) => {
    if (disabled) return;
    e.stopPropagation();
    setActivePinId(pinId);
    setIsDraggingPin(true);

    const container = containerRef.current;
    if (!container) return;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const xPercent = Math.min(
        100,
        Math.max(0, ((moveEvent.clientX - rect.left) / rect.width) * 100)
      );
      const yPercent = Math.min(
        100,
        Math.max(0, ((moveEvent.clientY - rect.top) / rect.height) * 100)
      );

      const roundedX = Math.round(xPercent * 10) / 10;
      const roundedY = Math.round(yPercent * 10) / 10;

      onChange({
        ...value,
        labels: labels.map((p) =>
          p.id === pinId ? { ...p, x: roundedX, y: roundedY } : p
        ),
      });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      setTimeout(() => setIsDraggingPin(false), 50);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Update label text
  const handleLabelTextChange = (id: string, text: string) => {
    onChange({
      ...value,
      labels: labels.map((p) => (p.id === id ? { ...p, text } : p)),
    });
  };

  // Delete individual pin
  const handleDeletePin = (id: string) => {
    playTap();
    onChange({
      ...value,
      labels: labels.filter((p) => p.id !== id),
    });
    if (activePinId === id) {
      setActivePinId(null);
    }
  };

  // Clear all pins
  const handleClearAllPins = () => {
    playTap();
    onChange({
      ...value,
      labels: [],
    });
    setActivePinId(null);
  };

  // Update hint
  const handleHintChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...value,
      hint: e.target.value,
    });
  };

  return (
    <DuoCard elevated className="flex flex-col gap-6 text-left p-6 sm:p-7">
      {/* 1. Image Uploader Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
            <ImageIcon className="w-4 h-4 text-duo-blue" />
            <span>Unggah Gambar Diagram Soal</span>
          </label>
          {labels.length > 0 && (
            <Badge variant="blue" className="text-[10px]">
              {labels.length} Pin Target
            </Badge>
          )}
        </div>

        <ImageUploader
          value={imageUrl === DEFAULT_DIAGRAM_IMAGE ? '' : imageUrl}
          onChange={handleImageUrlChange}
          label="Pilih atau Drag File Diagram (JPG, PNG, WebP)"
        />
      </div>

      {/* 2. Interactive Canvas: Click to Place & Drag Pins */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-duo-green" />
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
              Kanvas Interaktif Penancapan Pin (0–100%)
            </h4>
          </div>
          <span className="text-xs font-bold text-slate-400">
            Klik gambar untuk menancapkan pin baru, geser pin untuk mengubah posisi
          </span>
        </div>

        <div
          ref={containerRef}
          onClick={handleCanvasClick}
          className={cn(
            'relative w-full rounded-3xl overflow-hidden border-2 border-slate-200 bg-slate-100 select-none cursor-crosshair',
            'min-h-[280px] max-h-[520px] flex items-center justify-center shadow-inner'
          )}
        >
          {/* Background Diagram Image */}
          <img
            src={imageUrl}
            alt="Diagram Target Soal"
            className="w-full h-auto max-h-[500px] object-contain pointer-events-none"
            draggable={false}
          />

          {/* Rendered Pins on Canvas */}
          {labels.map((pin, index) => {
            const isActive = pin.id === activePinId;

            return (
              <div
                key={pin.id}
                onPointerDown={(e) => handlePinPointerDown(e, pin.id)}
                style={{
                  left: `${pin.x}%`,
                  top: `${pin.y}%`,
                }}
                className={cn(
                  'diagram-pin-marker absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-grab active:cursor-grabbing touch-none',
                  'flex items-center justify-center group'
                )}
                title={`Pin #${index + 1}: ${pin.text} (${pin.x}%, ${pin.y}%)`}
              >
                {/* 44x44px Touch Target Container */}
                <div className="w-11 h-11 flex items-center justify-center">
                  {/* Outer Pulsing Ring */}
                  <span
                    className={cn(
                      'absolute w-8 h-8 rounded-full animate-ping opacity-40',
                      isActive ? 'bg-duo-blue' : 'bg-duo-green'
                    )}
                  />

                  {/* 3D Tactile Pin Head */}
                  <div
                    className={cn(
                      'relative w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center font-black text-xs text-white shadow-md transition-transform',
                      isActive
                        ? 'bg-duo-blue border-white scale-110 ring-4 ring-duo-blue/30'
                        : 'bg-duo-green border-white hover:scale-105'
                    )}
                  >
                    {index + 1}
                  </div>
                </div>

                {/* Floating Tooltip with Pin Name */}
                <div
                  className={cn(
                    'absolute bottom-full mb-1 px-2 py-0.5 rounded-lg bg-slate-900/80 text-white text-[10px] font-extrabold whitespace-nowrap shadow-sm pointer-events-none transition-opacity',
                    isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  )}
                >
                  {pin.text || `Pin #${index + 1}`} ({pin.x}%, {pin.y}%)
                </div>
              </div>
            );
          })}

          {/* Empty Prompt Overlay if No Pins Yet */}
          {labels.length === 0 && (
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] flex flex-col items-center justify-center p-6 text-center pointer-events-none">
              <div className="w-12 h-12 rounded-2xl bg-white/90 text-duo-blue flex items-center justify-center shadow-lg mb-2">
                <MapPin className="w-6 h-6" />
              </div>
              <p className="text-white font-black text-base drop-shadow-md">
                Klik di mana saja pada gambar diagram untuk menancapkan pin target
              </p>
              <p className="text-white/80 font-bold text-xs mt-1">
                Koordinat akan otomatis disimpan dalam nilai persentase responsif (0–100%)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 3. List of Pins & Label Text Inputs */}
      <div className="flex flex-col gap-3 p-4 sm:p-5 bg-slate-50/80 rounded-2xl border-2 border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-duo-blue" />
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-600">
              Daftar Label Target ({labels.length})
            </h4>
          </div>

          {labels.length > 0 && (
            <button
              type="button"
              disabled={disabled}
              onClick={handleClearAllPins}
              className="flex items-center gap-1.5 text-xs font-black text-slate-400 hover:text-duo-red transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Hapus Semua Pin</span>
            </button>
          )}
        </div>

        {labels.length === 0 ? (
          <div className="py-6 px-4 text-center border-2 border-dashed border-duo-gray rounded-xl bg-white">
            <span className="text-xs font-bold text-slate-400 italic">
              Belum ada pin target. Klik area gambar diagram di atas untuk menambahkan.
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {labels.map((pin, index) => {
              const isActive = pin.id === activePinId;

              return (
                <div
                  key={pin.id}
                  onClick={() => setActivePinId(pin.id)}
                  className={cn(
                    'flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl border-2 transition-all bg-white',
                    isActive
                      ? 'border-duo-blue ring-4 ring-duo-blue/10 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  {/* Pin Number Badge */}
                  <div className="w-8 h-8 rounded-xl bg-duo-green text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                    {index + 1}
                  </div>

                  {/* Pin Label Name Input */}
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      disabled={disabled}
                      value={pin.text}
                      onChange={(e) => handleLabelTextChange(pin.id, e.target.value)}
                      placeholder={`Nama Label #${index + 1}`}
                      className="w-full px-3 py-1.5 border-2 border-slate-200 rounded-xl font-bold text-sm text-duo-dark focus:outline-none focus:border-duo-blue focus:ring-2 focus:ring-duo-blue/15 transition-all"
                    />
                  </div>

                  {/* Relative Percentage Coordinates Badge */}
                  <div className="hidden sm:flex items-center gap-1 font-mono text-xs font-extrabold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                    <span>X: {pin.x}%</span>
                    <span>•</span>
                    <span>Y: {pin.y}%</span>
                  </div>

                  {/* Delete Pin Button */}
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePin(pin.id);
                    }}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-duo-red hover:bg-duo-red-light/50 transition-colors shrink-0"
                    title="Hapus pin ini"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Context Clue / Hint */}
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
          <HelpCircle className="w-4 h-4 text-duo-green" />
          <span>Petunjuk Soal / Konteks Diagram (Opsional)</span>
        </label>
        <textarea
          rows={2}
          disabled={disabled}
          value={hint}
          onChange={handleHintChange}
          placeholder="Contoh: Pasangkan nama bagian-bagian bunga sempurna dengan tepat."
          className="w-full px-4 py-3 border-2 border-duo-gray rounded-2xl font-semibold text-sm text-duo-dark placeholder:text-slate-400 focus:outline-none focus:border-duo-blue focus:ring-4 focus:ring-duo-blue/10 bg-white transition-all resize-none"
        />
      </div>
    </DuoCard>
  );
};
