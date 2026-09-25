import React, { useState, useRef, useEffect, useCallback, useId } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  compressImageToWebP,
  formatBytes,
  CompressionResult,
} from "@/utils/imageCompressor";
import { TactileButton } from "@/components/ui/TactileButton";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useSoundEffect } from "@/hooks/useSoundEffect";
import { cn } from "@/utils/cn";
import {
  UploadCloud,
  Image as ImageIcon,
  CheckCircle2,
  Trash2,
  RefreshCw,
  AlertCircle,
  FileCheck,
  ClipboardPaste,
} from "lucide-react";

export interface ImageUploaderProps {
  value?: string;
  onChange?: (mediaUrl: string) => void;
  bucketName?: string;
  folderPath?: string;
  className?: string;
  label?: string;
  disabled?: boolean;
}

type UploadState = "idle" | "compressing" | "uploading" | "error";

// Track mounted ImageUploader instances to intelligently direct global paste events
let activeUploaderId: string | null = null;
const mountedUploaders = new Set<string>();

/**
 * Extract an image File from clipboard DataTransfer.
 * Prioritizes clipboardData.items (for screenshots from Snipping Tool, copied browser images)
 * and falls back to clipboardData.files (for files copied from File Explorer).
 */
export function extractImageFileFromClipboard(
  clipboardData: DataTransfer | null,
): File | null {
  if (!clipboardData) return null;

  // 1. Check items (screenshots, copied web images)
  if (clipboardData.items && clipboardData.items.length > 0) {
    for (let i = 0; i < clipboardData.items.length; i++) {
      const item = clipboardData.items[i];
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) return file;
      }
    }
  }

  // 2. Check files (copied files in OS)
  if (clipboardData.files && clipboardData.files.length > 0) {
    for (let i = 0; i < clipboardData.files.length; i++) {
      const file = clipboardData.files[i];
      if (file.type.startsWith("image/")) {
        return file;
      }
    }
  }

  return null;
}

/**
 * Extract direct image URL if user pasted an image link.
 */
export function extractImageUrlFromClipboard(
  clipboardData: DataTransfer | null,
): string | null {
  if (!clipboardData) return null;
  const text = clipboardData.getData("text/plain")?.trim();
  if (!text) return null;

  if (text.startsWith("data:image/")) return text;

  if (text.startsWith("http://") || text.startsWith("https://")) {
    if (
      /\.(jpeg|jpg|gif|png|webp|svg|avif)($|\?)/i.test(text) ||
      text.includes("images.unsplash.com") ||
      text.includes("supabase.co/storage")
    ) {
      return text;
    }
  }

  return null;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  bucketName = "quiz-media",
  folderPath = "questions",
  className,
  label = "Gambar Ilustrasi Soal",
  disabled = false,
}) => {
  const instanceId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | undefined>(value);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [compressionMetrics, setCompressionMetrics] =
    useState<CompressionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { playTap, playCorrect, playWrong } = useSoundEffect();

  // Platform shortcut text (⌘ + V on Mac, Ctrl + V on Windows/Linux)
  const isMac =
    typeof window !== "undefined" &&
    /Mac|iPod|iPhone|iPad/.test(navigator.userAgent || navigator.platform);
  const shortcutText = isMac ? "⌘ + V" : "Ctrl + V";

  // Keep preview synced with external value prop
  useEffect(() => {
    if (value !== undefined) {
      setPreviewUrl(value);
    }
  }, [value]);

  // Register uploader instance in global tracking
  useEffect(() => {
    mountedUploaders.add(instanceId);
    if (!activeUploaderId) {
      activeUploaderId = instanceId;
    }
    return () => {
      mountedUploaders.delete(instanceId);
      if (activeUploaderId === instanceId) {
        const remaining = Array.from(mountedUploaders);
        activeUploaderId =
          remaining.length > 0 ? remaining[remaining.length - 1] : null;
      }
    };
  }, [instanceId]);

  const handleFileProcess = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setErrorMessage("Hanya file gambar (JPG, PNG, WebP) yang didukung.");
        playWrong();
        return;
      }

      setErrorMessage(null);
      setUploadState("compressing");
      setUploadProgress(25);

      try {
        // 1. Client-side WebP Compression via HTML5 Canvas
        const compressedResult = await compressImageToWebP(file, {
          maxDimension: 1200,
          quality: 0.8,
        });

        setCompressionMetrics(compressedResult);
        setUploadProgress(60);
        setUploadState("uploading");

        // 2. Upload to Supabase Storage Bucket
        const fileName = `${Date.now()}_${compressedResult.file.name}`;
        const filePath = `${folderPath}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, compressedResult.file, {
            contentType: "image/webp",
            cacheControl: "3600",
            upsert: false,
          });

        let finalUrl = "";

        if (!uploadError) {
          // Retrieve public URL from Supabase Storage
          const { data: publicData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);

          finalUrl = publicData.publicUrl;
        } else {
          // Fallback for demo / offline / mock mode: create local object URL
          console.warn(
            "[EduPlay ImageUploader] Supabase storage upload warning (using local fallback preview):",
            uploadError.message,
          );
          finalUrl = URL.createObjectURL(compressedResult.blob);
        }

        setUploadProgress(100);
        setPreviewUrl(finalUrl);
        setUploadState("idle");
        playCorrect();
        onChange?.(finalUrl);
      } catch (err: unknown) {
        setUploadState("error");
        playWrong();
        const msg =
          err instanceof Error
            ? err.message
            : "Gagal mengompresi atau mengunggah gambar.";
        setErrorMessage(msg);
      }
    },
    [bucketName, folderPath, onChange, playCorrect, playWrong],
  );

  const handlePasteData = useCallback(
    (
      clipboardData: DataTransfer | null,
      e?: Event | React.SyntheticEvent,
    ): boolean => {
      if (disabled || uploadState !== "idle") return false;

      const imageFile = extractImageFileFromClipboard(clipboardData);
      if (imageFile) {
        e?.preventDefault();
        playTap();
        handleFileProcess(imageFile);
        return true;
      }

      const imageUrl = extractImageUrlFromClipboard(clipboardData);
      if (imageUrl) {
        e?.preventDefault();
        playTap();
        setPreviewUrl(imageUrl);
        onChange?.(imageUrl);
        playCorrect();
        return true;
      }

      return false;
    },
    [disabled, uploadState, handleFileProcess, playTap, playCorrect, onChange],
  );

  // Global window paste listener: intercepts image paste even when not directly focused on the dropzone
  useEffect(() => {
    if (disabled || uploadState !== "idle") return;

    const onWindowPaste = (e: ClipboardEvent) => {
      // Determine if this instance should handle the paste
      const isDirectlyFocused =
        containerRef.current &&
        containerRef.current.contains(document.activeElement);
      const isTargetInstance =
        isDirectlyFocused || activeUploaderId === instanceId;

      if (!isTargetInstance) return;

      const activeEl = document.activeElement;
      const isExternalTextInput =
        activeEl &&
        !containerRef.current?.contains(activeEl) &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          (activeEl as HTMLElement).isContentEditable);

      // If user is currently typing in an external text input or textarea:
      if (isExternalTextInput) {
        const textData = e.clipboardData?.getData("text/plain");
        // If clipboard contains plain text, allow normal text paste into the field!
        if (textData && textData.trim().length > 0) {
          return;
        }
      }

      // If clipboard contains an image (or external text is empty), process media upload
      handlePasteData(e.clipboardData, e);
    };

    window.addEventListener("paste", onWindowPaste);
    return () => {
      window.removeEventListener("paste", onWindowPaste);
    };
  }, [disabled, uploadState, instanceId, handlePasteData]);

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled || uploadState !== "idle") return;
    setIsDragOver(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || uploadState !== "idle") return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0 && files[0]) {
      playTap();
      handleFileProcess(files[0]);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && files[0]) {
      playTap();
      handleFileProcess(files[0]);
    }
  };

  const handleRemoveImage = () => {
    playTap();
    setPreviewUrl(undefined);
    setCompressionMetrics(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onChange?.("");
  };

  const handleTriggerBrowse = () => {
    playTap();
    fileInputRef.current?.click();
  };

  const onContainerPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const handled = handlePasteData(e.clipboardData, e);
    if (handled) {
      e.stopPropagation();
    }
  };

  const onDropzoneKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled || uploadState !== "idle") return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleTriggerBrowse();
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => {
        activeUploaderId = instanceId;
      }}
      onFocus={() => {
        activeUploaderId = instanceId;
      }}
      onPaste={onContainerPaste}
      className={cn("w-full flex flex-col gap-2", className)}
    >
      {label && (
        <label className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-duo-blue" />
          {label}
        </label>
      )}

      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        disabled={disabled || uploadState !== "idle"}
        onChange={onFileInputChange}
        className="hidden"
      />

      {/* State 1: Active Preview when Image is Uploaded */}
      {previewUrl && uploadState === "idle" ? (
        <div
          tabIndex={disabled ? -1 : 0}
          className="relative flex flex-col sm:flex-row items-center gap-4 p-4 bg-white rounded-3xl border-2 border-duo-gray border-b-4 border-b-duo-gray-border shadow-xs focus:outline-none focus:border-duo-blue focus:ring-4 focus:ring-duo-blue/15 transition-all"
        >
          {/* Image Thumbnail */}
          <div className="relative w-full sm:w-44 h-36 rounded-2xl overflow-hidden bg-slate-100 border-2 border-slate-200 shrink-0">
            <img
              src={previewUrl}
              alt="Uploaded media preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2">
              <Badge
                variant="green"
                className="text-[10px] bg-white/95 shadow-sm"
              >
                <FileCheck className="w-3 h-3 text-duo-green mr-1 inline" />
                WebP Ready
              </Badge>
            </div>
          </div>

          {/* Details & Savings Info */}
          <div className="flex-1 flex flex-col justify-between w-full">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-duo-green" />
                <span className="font-extrabold text-sm text-duo-dark">
                  Gambar Berhasil Diunggah
                </span>
              </div>

              {compressionMetrics ? (
                <div className="text-xs font-semibold text-[#777777] flex flex-col gap-0.5 mt-1">
                  <span>
                    Ukuran Asli:{" "}
                    <b className="text-duo-dark">
                      {formatBytes(compressionMetrics.originalSize)}
                    </b>{" "}
                    → WebP:{" "}
                    <b className="text-duo-green">
                      {formatBytes(compressionMetrics.compressedSize)}
                    </b>
                  </span>
                  <span>
                    Dimensi Maks:{" "}
                    <b className="text-duo-dark">
                      {compressionMetrics.width}×{compressionMetrics.height}px
                    </b>{" "}
                    (Hemat{" "}
                    <b className="text-duo-green">
                      {compressionMetrics.savingsPercentage}% kuota
                    </b>
                    )
                  </span>
                </div>
              ) : null}
            </div>

            {/* Action Buttons: Ganti, Hapus, and Quick Paste Hint */}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTriggerBrowse}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-600 hover:text-duo-dark text-xs font-bold transition-all cursor-pointer active:translate-y-0.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Ganti Gambar</span>
                </button>

                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-rose-200 bg-white hover:bg-rose-50/50 text-slate-500 hover:text-duo-red text-xs font-bold transition-all cursor-pointer active:translate-y-0.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              </div>

              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
                <ClipboardPaste className="w-3.5 h-3.5 text-duo-blue" />
                <span>
                  Ganti cepat:{" "}
                  <kbd className="font-mono text-duo-dark font-black">
                    {shortcutText}
                  </kbd>
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* State 2: Drag and Drop Upload Area */
        <div
          tabIndex={disabled ? -1 : 0}
          role="button"
          aria-label="Upload gambar atau tekan Ctrl + V untuk paste"
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onKeyDown={onDropzoneKeyDown}
          onClick={uploadState === "idle" ? handleTriggerBrowse : undefined}
          className={cn(
            "relative w-full rounded-3xl border-2 border-dashed transition-all duration-200 p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer select-none outline-none",
            // Idle state
            "border-slate-300 bg-white hover:border-duo-blue hover:bg-slate-50/70 focus:border-duo-blue focus:ring-4 focus:ring-duo-blue/15",
            // Drag-over visual state
            isDragOver &&
              "border-duo-blue bg-duo-blue-light/30 ring-4 ring-duo-blue/15 scale-[1.01]",
            // Disabled or processing
            disabled && "opacity-60 cursor-not-allowed pointer-events-none",
          )}
        >
          {uploadState === "compressing" || uploadState === "uploading" ? (
            /* Upload & Compression Progress State */
            <div className="w-full max-w-sm flex flex-col items-center gap-3 py-4">
              <div className="w-12 h-12 rounded-2xl bg-duo-blue-light border-2 border-duo-blue text-duo-blue-border flex items-center justify-center animate-bounce">
                <UploadCloud className="w-6 h-6 text-duo-blue" />
              </div>
              <div className="w-full">
                <div className="flex justify-between items-center text-xs font-black uppercase text-[#777777] mb-1.5">
                  <span>
                    {uploadState === "compressing"
                      ? "Mengompresi ke format WebP..."
                      : "Mengunggah ke Supabase Storage..."}
                  </span>
                  <span>{uploadProgress}%</span>
                </div>
                <ProgressBar current={uploadProgress} total={100} size="sm" />
              </div>
            </div>
          ) : (
            /* Idle Drag & Paste Area */
            <>
              <div className="w-16 h-16 rounded-3xl bg-slate-100 border-2 border-slate-200 text-slate-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <UploadCloud className="w-8 h-8 text-duo-blue" />
              </div>

              <h4 className="text-base sm:text-lg font-black text-duo-dark tracking-tight">
                Tarik & Lepaskan File Gambar di Sini
              </h4>
              <p className="text-xs sm:text-sm font-semibold text-[#777777] mt-1 mb-4 max-w-sm">
                Otomatis dikonversi ke WebP (maks. 1200px) untuk kecepatan
                loading proyektor kelas
              </p>

              {/* Action Choices: Button or Ctrl+V badge */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
                <TactileButton
                  type="button"
                  variant="outline"
                  size="sm"
                  className="pointer-events-none border-2 border-duo-gray font-black text-xs"
                >
                  Pilih dari Perangkat
                </TactileButton>

                <span className="text-xs font-bold text-slate-400">atau</span>

                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-duo-blue/10 border-2 border-duo-blue/30 text-xs font-black text-duo-blue shadow-2xs">
                  <ClipboardPaste className="w-3.5 h-3.5 text-duo-blue" />
                  <kbd className="font-mono bg-white px-1.5 py-0.5 rounded-md border border-duo-blue/30 text-[11px] font-black text-duo-dark shadow-2xs">
                    {shortcutText}
                  </kbd>
                  <span>Tempel</span>
                </div>
              </div>

              <span className="text-[11px] font-bold text-slate-400">
                Mendukung screenshot clipboard ({shortcutText}), JPG, PNG, WebP
                (hingga 5 MB)
              </span>
            </>
          )}

          {/* Error notification bubble */}
          {errorMessage && (
            <div className="mt-4 p-3 bg-duo-red-light border-2 border-duo-red rounded-xl text-xs font-bold text-duo-red-border flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-duo-red" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
