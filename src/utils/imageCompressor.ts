export interface CompressionOptions {
  maxDimension?: number;
  quality?: number;
}

export interface CompressionResult {
  file: File;
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  savingsPercentage: number;
  width: number;
  height: number;
}

/**
 * Compresses an image file in the browser using HTML5 Canvas and converts it to WebP format.
 * - Caps max dimension to 1200px while maintaining aspect ratio.
 * - Compresses at 0.8 (80%) quality.
 * - Returns a lightweight WebP File object ready for upload.
 */
export async function compressImageToWebP(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const { maxDimension = 1200, quality = 0.8 } = options;

  return new Promise((resolve, reject) => {
    // 1. Create an image element to read original dimensions
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let targetWidth = img.width;
      let targetHeight = img.height;

      // 2. Scale proportionally if larger than maxDimension
      if (targetWidth > maxDimension || targetHeight > maxDimension) {
        if (targetWidth >= targetHeight) {
          targetHeight = Math.round((targetHeight * maxDimension) / targetWidth);
          targetWidth = maxDimension;
        } else {
          targetWidth = Math.round((targetWidth * maxDimension) / targetHeight);
          targetHeight = maxDimension;
        }
      }

      // 3. Render onto HTML5 Canvas
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('[EduPlay Compressor] Gagal menginisialisasi 2D Canvas context.'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // 4. Export to WebP format via canvas.toBlob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('[EduPlay Compressor] Gagal membuat WebP Blob dari canvas.'));
            return;
          }

          // Build clean WebP filename
          const originalName = file.name;
          const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
          const webpFileName = `${baseName}.webp`;

          const webpFile = new File([blob], webpFileName, {
            type: 'image/webp',
            lastModified: Date.now(),
          });

          const originalSize = file.size;
          const compressedSize = blob.size;
          const savings = Math.max(
            0,
            Math.round(((originalSize - compressedSize) / originalSize) * 100)
          );

          resolve({
            file: webpFile,
            blob,
            originalSize,
            compressedSize,
            savingsPercentage: savings,
            width: targetWidth,
            height: targetHeight,
          });
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('[EduPlay Compressor] Gagal memuat file gambar. Format tidak didukung.'));
    };

    img.src = objectUrl;
  });
}

/**
 * Format bytes to readable string (e.g. 1.2 MB or 450 KB)
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

