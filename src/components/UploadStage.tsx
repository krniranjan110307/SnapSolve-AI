import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Camera,
  ImagePlus,
  Loader2,
  Maximize2,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import { SAMPLE_STUDY_MATERIALS, type SampleStudyMaterial } from '../data/sampleMaterials';
import {
  formatBytes,
  ImageValidationError,
  processImageFile,
  processSampleImageUrl,
  type ProcessedImage,
} from '../utils/imageProcessor';

interface UploadStageProps {
  currentImage: ProcessedImage | null;
  focusPrompt: string;
  isAnalyzing: boolean;
  onImageReady: (image: ProcessedImage, suggestedPrompt?: string) => void;
  onRemoveImage: () => void;
  onFocusPromptChange: (value: string) => void;
  onAnalyze: () => void;
  onCancelAnalysis: () => void;
  fileInputTriggerRef: React.MutableRefObject<(() => void) | null>;
}

export const UploadStage: React.FC<UploadStageProps> = ({
  currentImage,
  focusPrompt,
  isAnalyzing,
  onImageReady,
  onRemoveImage,
  onFocusPromptChange,
  onAnalyze,
  onCancelAnalysis,
  fileInputTriggerRef,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [loadingSampleId, setLoadingSampleId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [brokenSampleIds, setBrokenSampleIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fileInputTriggerRef.current = () => {
      fileInputRef.current?.click();
    };
  }, [fileInputTriggerRef]);

  // Support Ctrl+V / Cmd+V clipboard screenshot paste anywhere in the workspace
  useEffect(() => {
    const handlePaste = async (event: ClipboardEvent) => {
      if (isAnalyzing) return;
      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i += 1) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          if (blob) {
            event.preventDefault();
            await handleIncomingFile(blob);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  });

  // Close zoom lightbox on Escape
  useEffect(() => {
    if (!isZoomOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsZoomOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isZoomOpen]);

  const handleIncomingFile = async (file: File) => {
    setValidationError(null);
    setIsProcessingFile(true);
    try {
      const processed = await processImageFile(file);
      onImageReady(processed);
    } catch (err) {
      if (err instanceof ImageValidationError) {
        setValidationError(err.message);
      } else {
        setValidationError('Could not process that image. Please try a PNG, JPEG, or WebP file.');
      }
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleIncomingFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (isAnalyzing) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handleIncomingFile(file);
    }
  };

  const handleSelectSample = async (sample: SampleStudyMaterial) => {
    if (isAnalyzing || isProcessingFile) return;
    setValidationError(null);
    setLoadingSampleId(sample.id);
    try {
      const processed = await processSampleImageUrl(sample.imageUrl, sample.fileName);
      onImageReady(processed, sample.suggestedPrompt);
    } catch (err) {
      setValidationError(
        err instanceof Error ? err.message : 'Unable to load sample study image.'
      );
    } finally {
      setLoadingSampleId(null);
    }
  };

  return (
    <section
      aria-label="Study material upload and preview"
      className="flex flex-col gap-6"
    >
      {/* Hidden accessible file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="sr-only"
        aria-label="Choose study image from device"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="sr-only"
        aria-label="Capture study image using camera"
      />

      {/* Primary Upload / Preview Surface */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 dark:border-stone-800 dark:bg-stone-900">
        <div className="flex items-baseline justify-between gap-4 mb-4">
          <h2 className="font-display text-xl font-semibold text-stone-900 dark:text-stone-100">
            1. Study Material
          </h2>
          <span className="text-xs text-stone-500 dark:text-stone-400">
            PNG · JPG · WebP · Max 15 MB
          </span>
        </div>

        {validationError && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50/80 p-3.5 text-sm text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
            <div className="flex-1">
              <p className="font-semibold">Unable to use selected file</p>
              <p className="mt-0.5 text-xs leading-relaxed text-red-800 dark:text-red-300">
                {validationError}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setValidationError(null)}
              aria-label="Dismiss file validation message"
              className="min-h-[32px] min-w-[32px] inline-flex items-center justify-center rounded-lg text-red-700 hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-900/40 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {!currentImage ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              if (!isAnalyzing) setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center rounded-xl border border-dashed px-5 py-10 text-center transition-colors ${
              isDragging
                ? 'border-blue-600 bg-blue-50/60 dark:border-blue-400 dark:bg-blue-950/30'
                : 'border-stone-300 bg-stone-50/70 hover:border-stone-400 dark:border-stone-700 dark:bg-stone-950/50 dark:hover:border-stone-600'
            }`}
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-stone-200/70 text-stone-700 dark:bg-stone-800 dark:text-stone-200">
              {isProcessingFile ? (
                <Loader2 className="h-6 w-6 animate-spin text-blue-700 dark:text-blue-400" />
              ) : (
                <ImagePlus className="h-6 w-6" />
              )}
            </div>

            <p className="text-base font-semibold text-stone-900 dark:text-stone-100">
              {isProcessingFile
                ? 'Preparing your image for analysis...'
                : 'Drop a textbook page, diagram, or handwritten note'}
            </p>
            <p className="mt-1 max-w-sm text-xs leading-relaxed text-stone-600 dark:text-stone-400">
              Drag and drop an image here, paste a screenshot with{' '}
              <kbd className="font-mono font-medium text-stone-800 dark:text-stone-200">
                Ctrl+V
              </kbd>
              , or capture directly from your phone camera.
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                disabled={isProcessingFile}
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[44px] flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
              >
                <ImagePlus className="h-4 w-4" />
                Browse Image
              </button>

              <button
                type="button"
                disabled={isProcessingFile}
                onClick={() => cameraInputRef.current?.click()}
                className="min-h-[44px] flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-800 hover:bg-stone-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700"
              >
                <Camera className="h-4 w-4" />
                Take Photo
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Crisp Image Stage with Zoom Trigger */}
            <div className="group relative overflow-hidden rounded-xl border border-stone-200 bg-stone-100 dark:border-stone-800 dark:bg-stone-950">
              <img
                src={currentImage.previewDataUrl}
                alt={`Uploaded study material: ${currentImage.fileName}`}
                referrerPolicy="no-referrer"
                className="max-h-[380px] w-full object-contain mx-auto"
              />
              <button
                type="button"
                onClick={() => setIsZoomOpen(true)}
                aria-label="Inspect full-size study image"
                className="absolute bottom-3 right-3 min-h-[40px] inline-flex items-center gap-1.5 rounded-lg bg-stone-900/85 px-3 py-2 text-xs font-medium text-white backdrop-blur-sm hover:bg-stone-900 transition-opacity cursor-pointer"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                Inspect Full Size
              </button>
            </div>

            {/* Clean unboxed file metadata + Replace / Remove controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-600 dark:text-stone-400 tabular-nums">
                <span className="max-w-[180px] truncate font-medium text-stone-800 dark:text-stone-200">
                  {currentImage.fileName}
                </span>
                {currentImage.width > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>
                      {currentImage.width}×{currentImage.height}
                    </span>
                  </>
                )}
                {currentImage.originalSizeBytes > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{formatBytes(currentImage.originalSizeBytes)}</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isAnalyzing}
                  onClick={() => fileInputRef.current?.click()}
                  className="min-h-[40px] inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Replace
                </button>
                <button
                  type="button"
                  disabled={isAnalyzing}
                  onClick={() => {
                    setValidationError(null);
                    onRemoveImage();
                  }}
                  className="min-h-[40px] inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 dark:border-stone-700 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Optional Student Focus Prompt */}
        <div className="mt-5 pt-5 border-t border-stone-200/80 dark:border-stone-800">
          <div className="flex items-baseline justify-between gap-2 mb-2">
            <label
              htmlFor="focus-prompt-input"
              className="text-xs font-semibold text-stone-800 dark:text-stone-200"
            >
              2. Optional Question or Focus Area
            </label>
            <span className="text-xs font-mono tabular-nums text-stone-500 dark:text-stone-400">
              {focusPrompt.length}/300
            </span>
          </div>
          <textarea
            id="focus-prompt-input"
            rows={2}
            maxLength={300}
            disabled={isAnalyzing}
            value={focusPrompt}
            onChange={(e) => onFocusPromptChange(e.target.value)}
            placeholder="e.g., Explain step 2 of this derivation in simple terms, or help me understand the arrows in this diagram..."
            className="w-full rounded-xl border border-stone-300 bg-stone-50/60 px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-blue-600 focus:bg-white focus:outline-none dark:border-stone-700 dark:bg-stone-950/60 dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-blue-500 dark:focus:bg-stone-950"
          />

          <div className="mt-4">
            {isAnalyzing ? (
              <button
                type="button"
                onClick={onCancelAnalysis}
                className="min-h-[48px] w-full inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-stone-100 px-5 py-3 text-sm font-semibold text-stone-800 hover:bg-stone-200 transition-colors cursor-pointer dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700"
              >
                <X className="h-4 w-4" />
                Cancel Analysis
              </button>
            ) : (
              <button
                type="button"
                disabled={!currentImage || isProcessingFile}
                onClick={onAnalyze}
                className="min-h-[48px] w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500 dark:bg-blue-600 dark:hover:bg-blue-500 dark:disabled:bg-stone-800 dark:disabled:text-stone-500"
              >
                Analyze with Gemma 4
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Real Sample Study Materials for Instant Live Testing */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 dark:border-stone-800 dark:bg-stone-900">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
            No study photo handy? Try a real sample page
          </h3>
          <p className="mt-0.5 text-xs text-stone-600 dark:text-stone-400">
            Loads the actual image into the stage above so you can run a live Gemma 4 analysis.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SAMPLE_STUDY_MATERIALS.map((sample) => {
            const isLoadingThis = loadingSampleId === sample.id;
            const isBroken = brokenSampleIds[sample.id];

            return (
              <button
                key={sample.id}
                type="button"
                disabled={isAnalyzing || isProcessingFile || isLoadingThis}
                onClick={() => void handleSelectSample(sample)}
                className="group flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-stone-50/70 text-left hover:border-blue-600 transition-colors cursor-pointer disabled:opacity-50 dark:border-stone-800 dark:bg-stone-950/60 dark:hover:border-blue-500"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-200/70 dark:bg-stone-800">
                  {!isBroken ? (
                    <img
                      src={sample.imageUrl}
                      alt={sample.alt}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setBrokenSampleIds((prev) => ({ ...prev, [sample.id]: true }))
                      }
                      className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-stone-100 to-stone-200 p-3 text-center dark:from-stone-800 dark:to-stone-900">
                      <BookOpen className="h-5 w-5 text-stone-500 dark:text-stone-400" />
                      <span className="text-[11px] font-medium text-stone-700 dark:text-stone-300">
                        {sample.label}
                      </span>
                    </div>
                  )}
                  {isLoadingThis && (
                    <div className="absolute inset-0 flex items-center justify-center bg-stone-900/50 backdrop-blur-[1px]">
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold text-stone-900 truncate dark:text-stone-100">
                    {sample.label}
                  </p>
                  <p className="mt-0.5 text-[11px] text-stone-500 truncate dark:text-stone-400">
                    {sample.category}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Accessible Full-Screen Image Lightbox */}
      {isZoomOpen && currentImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Full size uploaded study material"
          className="fixed inset-0 z-50 flex flex-col bg-stone-950/90 backdrop-blur-sm p-4 sm:p-8"
          onClick={() => setIsZoomOpen(false)}
        >
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between pb-4">
            <p className="text-sm font-medium text-stone-200 truncate">
              {currentImage.fileName}
            </p>
            <button
              type="button"
              onClick={() => setIsZoomOpen(false)}
              className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-stone-800 px-4 py-2 text-xs font-semibold text-stone-100 hover:bg-stone-700 cursor-pointer"
            >
              <X className="h-4 w-4" />
              Close Preview
            </button>
          </div>
          <div
            className="flex-1 flex items-center justify-center overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentImage.previewDataUrl}
              alt={currentImage.fileName}
              referrerPolicy="no-referrer"
              className="max-h-full max-w-full rounded-lg object-contain"
            />
          </div>
        </div>
      )}
    </section>
  );
};
