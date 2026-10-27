export interface ProcessedImage {
  fileName: string;
  originalSizeBytes: number;
  width: number;
  height: number;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  previewDataUrl: string;
  base64Payload: string;
  thumbnailDataUrl: string;
}

const SUPPORTED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

const MAX_RAW_FILE_BYTES = 15 * 1024 * 1024; // 15 MB
const MAX_ANALYSIS_DIMENSION = 1280;
const MAX_THUMBNAIL_DIMENSION = 420;

export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageValidationError';
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

export function validateImageFile(file: File): void {
  if (!file) {
    throw new ImageValidationError('No image file was provided.');
  }

  const normalizedType = file.type.toLowerCase();
  if (!SUPPORTED_MIME_TYPES.has(normalizedType)) {
    throw new ImageValidationError(
      'Unsupported file format. Please upload a PNG, JPEG, or WebP study image.'
    );
  }

  if (file.size === 0) {
    throw new ImageValidationError('The selected file appears to be empty.');
  }

  if (file.size > MAX_RAW_FILE_BYTES) {
    throw new ImageValidationError(
      `Image is ${formatBytes(file.size)}, which exceeds the 15 MB limit. Please crop or choose a smaller photo.`
    );
  }
}

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(
        new ImageValidationError(
          'Could not decode this image file. Please try another photo or screenshot.'
        )
      );
    img.src = src;
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new ImageValidationError('Failed to read image data.'));
      }
    };
    reader.onerror = () =>
      reject(new ImageValidationError('Browser could not read the selected image file.'));
    reader.readAsDataURL(file);
  });
}

function renderScaledDataUrl(
  img: HTMLImageElement,
  maxDimension: number,
  outputMime: 'image/jpeg' | 'image/webp',
  quality: number
): { dataUrl: string; width: number; height: number } {
  const naturalW = img.naturalWidth || img.width;
  const naturalH = img.naturalHeight || img.height;

  const scale = Math.min(1, maxDimension / Math.max(naturalW, naturalH));
  const targetW = Math.max(1, Math.round(naturalW * scale));
  const targetH = Math.max(1, Math.round(naturalH * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new ImageValidationError('Browser canvas is unavailable for image processing.');
  }

  // Paint a clean white backing in case a transparent PNG diagram is converted to JPEG
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, targetW, targetH);
  ctx.drawImage(img, 0, 0, targetW, targetH);

  const dataUrl = canvas.toDataURL(outputMime, quality);
  return { dataUrl, width: targetW, height: targetH };
}

export async function processImageFile(file: File): Promise<ProcessedImage> {
  validateImageFile(file);

  const rawDataUrl = await readFileAsDataUrl(file);
  const img = await loadHtmlImage(rawDataUrl);

  const analysisRender = renderScaledDataUrl(img, MAX_ANALYSIS_DIMENSION, 'image/jpeg', 0.88);
  const thumbnailRender = renderScaledDataUrl(img, MAX_THUMBNAIL_DIMENSION, 'image/jpeg', 0.72);

  const commaIndex = analysisRender.dataUrl.indexOf(',');
  const base64Payload =
    commaIndex >= 0 ? analysisRender.dataUrl.slice(commaIndex + 1) : analysisRender.dataUrl;

  return {
    fileName: file.name || 'study-material.jpg',
    originalSizeBytes: file.size,
    width: analysisRender.width,
    height: analysisRender.height,
    mimeType: 'image/jpeg',
    previewDataUrl: analysisRender.dataUrl,
    base64Payload,
    thumbnailDataUrl: thumbnailRender.dataUrl,
  };
}

export async function processSampleImageUrl(
  url: string,
  fileName: string
): Promise<ProcessedImage> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new ImageValidationError('Could not load sample study material image.');
  }
  const blob = await response.blob();
  const mime = blob.type && SUPPORTED_MIME_TYPES.has(blob.type) ? blob.type : 'image/jpeg';
  const file = new File([blob], fileName, { type: mime });
  return processImageFile(file);
}
