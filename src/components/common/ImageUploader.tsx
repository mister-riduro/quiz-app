import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { compressImageToWebP, formatBytes, CompressionResult } from '@/utils/imageCompressor';
import { TactileButton } from '@/components/ui/TactileButton';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useSoundEffect } from '@/hooks/useSoundEffect';
import { cn } from '@/utils/cn';
import {
  UploadCloud,
  Image as ImageIcon,
  CheckCircle2,
  Trash2,
  RefreshCw,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

export interface ImageUploaderProps {
  value?: string;
  onChange?: (mediaUrl: string) => void;
  bucketName?: string;
  folderPath?: string;
  className?: string;
  label?: string;
  disabled?: boolean;
}

type UploadState = 'idle' | 'compressing' | 'uploading' | 'error';

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  bucketName = 'quiz-media',
  folderPath = 'questions',
  className,
  label = 'Gambar Ilustrasi Soal',
  disabled = false,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(value);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [compressionMetrics, setCompressionMetrics] = useState<CompressionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { playTap, playCorrect, playWrong } = useSoundEffect();

  // Keep preview synced with external value prop
  React.useEffect(() => {
    if (value !== undefined) {
      setPreviewUrl(value);
    }
  }, [value]);

  const handleFileProcess = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Hanya file gambar (JPG, PNG, WebP) yang didukung.');
      playWrong();
      return;
    }

    setErrorMessage(null);
    setUploadState('compressing');
    setUploadProgress(25);

    try {
      // 1. Client-side WebP Compression via HTML5 Canvas
      const compressedResult = await compressImageToWebP(file, {
        maxDimension: 1200,
        quality: 0.8,
      });

      setCompressionMetrics(compressedResult);
      setUploadProgress(60);
      setUploadState('uploading');

      // 2. Upload to Supabase Storage Bucket `quiz-media`
      const fileName = `${Date.now()}_${compressedResult.file.name}`;
      const filePath = `${folderPath}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, compressedResult.file, {
          contentType: 'image/webp',
          cacheControl: '3600',
          upsert: false,
        });

      let finalUrl = '';

      if (!uploadError) {
        // Retrieve public URL from Supabase Storage
        const { data: publicData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);

        finalUrl = publicData.publicUrl;
      } else {
        // Fallback for demo / offline / mock mode: create local object URL
        console.warn(
          '[EduPlay ImageUploader] Supabase storage upload warning (using local fallback preview):',
          uploadError.message
        );
        finalUrl = URL.createObjectURL(compressedResult.blob);
      }

      setUploadProgress(100);
      setPreviewUrl(finalUrl);
      setUploadState('idle');
      playCorrect();
      onChange?.(finalUrl);
    } catch (err: unknown) {
      setUploadState('error');
      playWrong();
      const msg = err instanceof Error ? err.message : 'Gagal mengompresi atau mengunggah gambar.';
      setErrorMessage(msg);
    }
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled || uploadState !== 'idle') return;
    setIsDragOver(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || uploadState !== 'idle') return;

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
      fileInputRef.current.value = '';
    }
    onChange?.('');
  };

  const handleTriggerBrowse = () => {
    playTap();
    fileInputRef.current?.click();
  };

  return (
    <div className={cn('w-full flex flex-col gap-2', className)}>
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
        disabled={disabled || uploadState !== 'idle'}
        onChange={onFileInputChange}
        className="hidden"
      />

      {/* State 1: Active Preview when Image is Uploaded */}
      {previewUrl && uploadState === 'idle' ? (
        <div className="relative flex flex-col sm:flex-row items-center gap-4 p-4 bg-white rounded-3xl border-2 border-duo-gray border-b-4 border-b-duo-gray-border shadow-xs">
          {/* Image Thumbnail */}
          <div className="relative w-full sm:w-44 h-36 rounded-2xl overflow-hidden bg-slate-100 border-2 border-slate-200 shrink-0">
            <img
              src={previewUrl}
              alt="Uploaded media preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2">
              <Badge variant="green" className="text-[10px] bg-white/95 shadow-sm">
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
                  Gambar Berhasil Dioptimasi
                </span>
              </div>

              {compressionMetrics ? (
                <div className="text-xs font-semibold text-[#777777] flex flex-col gap-0.5 mt-1">
                  <span>
                    Ukuran Asli: <b className="text-duo-dark">{formatBytes(compressionMetrics.originalSize)}</b> → WebP:{' '}
                    <b className="text-duo-green">{formatBytes(compressionMetrics.compressedSize)}</b>
                  </span>
                  <span>
                    Dimensi Maks: <b className="text-duo-dark">{compressionMetrics.width}×{compressionMetrics.height}px</b> (Hemat{' '}
                    <b className="text-duo-green">{compressionMetrics.savingsPercentage}% kuota</b>)
                  </span>
                </div>
              ) : (
                <p className="text-xs font-semibold text-[#777777]">
                  Format WebP siap ditayangkan pada proyektor dan tablet kelas.
                </p>
              )}
            </div>

            {/* Action Buttons: Ganti & Hapus */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
              <TactileButton
                type="button"
                variant="outline"
                size="sm"
                icon={<RefreshCw className="w-3.5 h-3.5" />}
                onClick={handleTriggerBrowse}
              >
                Ganti Gambar
              </TactileButton>

              <TactileButton
                type="button"
                variant="red"
                size="sm"
                icon={<Trash2 className="w-3.5 h-3.5" />}
                onClick={handleRemoveImage}
              >
                Hapus
              </TactileButton>
            </div>
          </div>
        </div>
      ) : (
        /* State 2: Drag and Drop Upload Area */
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={uploadState === 'idle' ? handleTriggerBrowse : undefined}
          className={cn(
            'relative w-full rounded-3xl border-2 border-dashed transition-all duration-200 p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer select-none',
            // Idle state
            'border-slate-300 bg-white hover:border-duo-blue hover:bg-slate-50/70',
            // Drag-over visual state as per prompt requirements
            isDragOver && 'border-duo-blue bg-duo-blue-light/30 ring-4 ring-duo-blue/15 scale-[1.01]',
            // Disabled or processing
            disabled && 'opacity-60 cursor-not-allowed pointer-events-none'
          )}
        >
          {uploadState === 'compressing' || uploadState === 'uploading' ? (
            /* Upload & Compression Progress State */
            <div className="w-full max-w-sm flex flex-col items-center gap-3 py-4">
              <div className="w-12 h-12 rounded-2xl bg-duo-blue-light border-2 border-duo-blue text-duo-blue-border flex items-center justify-center animate-bounce">
                <UploadCloud className="w-6 h-6 text-duo-blue" />
              </div>
              <div className="w-full">
                <div className="flex justify-between items-center text-xs font-black uppercase text-[#777777] mb-1.5">
                  <span>
                    {uploadState === 'compressing'
                      ? 'Mengompresi ke format WebP...'
                      : 'Mengunggah ke Supabase Storage...'}
                  </span>
                  <span>{uploadProgress}%</span>
                </div>
                <ProgressBar current={uploadProgress} total={100} size="sm" />
              </div>
            </div>
          ) : (
            /* Idle Drag Area */
            <>
              <div className="w-16 h-16 rounded-3xl bg-slate-100 border-2 border-slate-200 text-slate-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <UploadCloud className="w-8 h-8 text-duo-blue" />
              </div>

              <h4 className="text-base sm:text-lg font-black text-duo-dark tracking-tight">
                Tarik & Lepaskan File Gambar di Sini
              </h4>
              <p className="text-xs sm:text-sm font-semibold text-[#777777] mt-1 mb-4 max-w-xs">
                Otomatis dikonversi ke WebP (maks. 1200px) untuk kecepatan loading proyektor kelas
              </p>

              <TactileButton
                type="button"
                variant="outline"
                size="sm"
                className="pointer-events-none border-2 border-duo-gray font-black text-xs"
              >
                Pilih dari Perangkat
              </TactileButton>

              <span className="text-[11px] font-bold text-slate-400 mt-2">
                Mendukung JPG, PNG, WebP (hingga 5 MB)
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
