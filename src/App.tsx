/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef, useState } from 'react';
import { History, Moon, Sun } from 'lucide-react';
import { Header } from './components/Header';
import { UploadStage } from './components/UploadStage';
import { StudyDeck } from './components/StudyDeck';
import { SessionDrawer } from './components/SessionDrawer';
import { HowItWorksSection } from './components/HowItWorksSection';
import { useTheme } from './hooks/useTheme';
import { useLocalStorageSessions } from './hooks/useLocalStorageSessions';
import type { ProcessedImage } from './utils/imageProcessor';
import {
  requestFollowUpAnswer,
  requestStudyAnalysis,
  StudyApiClientError,
} from './utils/studyApi';
import type { FollowUpTurn, StudyGuide, StudySession } from './types/study';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const {
    sessions,
    saveSession,
    updateSessionFollowUps,
    deleteSession,
    clearAllSessions,
  } = useLocalStorageSessions();

  const [currentImage, setCurrentImage] = useState<ProcessedImage | null>(null);
  const [focusPrompt, setFocusPrompt] = useState('');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [studyGuide, setStudyGuide] = useState<StudyGuide | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<{
    message: string;
    retryable: boolean;
  } | null>(null);

  const [followUpTurns, setFollowUpTurns] = useState<FollowUpTurn[]>([]);
  const [isAskingFollowUp, setIsAskingFollowUp] = useState(false);
  const [followUpError, setFollowUpError] = useState<string | null>(null);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const fileInputTriggerRef = useRef<(() => void) | null>(null);

  const handleImageReady = (image: ProcessedImage, suggestedPrompt?: string) => {
    abortControllerRef.current?.abort();
    setCurrentImage(image);
    if (suggestedPrompt !== undefined) {
      setFocusPrompt(suggestedPrompt);
    }
    setActiveSessionId(null);
    setStudyGuide(null);
    setAnalysisError(null);
    setFollowUpTurns([]);
    setFollowUpError(null);
  };

  const handleRemoveImage = () => {
    abortControllerRef.current?.abort();
    setCurrentImage(null);
    setFocusPrompt('');
    setActiveSessionId(null);
    setStudyGuide(null);
    setAnalysisError(null);
    setFollowUpTurns([]);
    setFollowUpError(null);
  };

  const handleNewUploadAction = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (currentImage) {
      handleRemoveImage();
    }
    window.setTimeout(() => {
      fileInputTriggerRef.current?.();
    }, 120);
  };

  const handleAnalyze = async () => {
    if (!currentImage || isAnalyzing) return;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsAnalyzing(true);
    setAnalysisError(null);
    setFollowUpError(null);

    try {
      const guide = await requestStudyAnalysis(
        {
          imageBase64: currentImage.base64Payload,
          mimeType: currentImage.mimeType,
          focusPrompt: focusPrompt.trim() || undefined,
        },
        controller.signal
      );

      const newSessionId = `session-${Date.now()}`;
      const sessionRecord: StudySession = {
        id: newSessionId,
        createdAt: new Date().toISOString(),
        fileName: currentImage.fileName,
        thumbnailDataUrl: currentImage.thumbnailDataUrl,
        imageMimeType: currentImage.mimeType,
        focusPrompt: focusPrompt.trim() || undefined,
        guide,
        followUps: [],
      };

      setStudyGuide(guide);
      setActiveSessionId(newSessionId);
      setFollowUpTurns([]);
      saveSession(sessionRecord);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      if (err instanceof StudyApiClientError) {
        setAnalysisError({
          message: err.message,
          retryable: err.retryable,
        });
      } else {
        setAnalysisError({
          message: 'Something went wrong while analyzing your study image. Please try again.',
          retryable: true,
        });
      }
    } finally {
      if (abortControllerRef.current === controller) {
        setIsAnalyzing(false);
      }
    }
  };

  const handleCancelAnalysis = () => {
    abortControllerRef.current?.abort();
    setIsAnalyzing(false);
  };

  const handleAskFollowUp = async (question: string) => {
    if (!studyGuide || isAskingFollowUp) return;

    setIsAskingFollowUp(true);
    setFollowUpError(null);

    try {
      const result = await requestFollowUpAnswer({
        imageBase64: currentImage?.base64Payload,
        mimeType: currentImage?.mimeType,
        studyContext: {
          title: studyGuide.title,
          subject: studyGuide.subject,
          topic: studyGuide.topic,
          plainEnglishOverview: studyGuide.plainEnglishOverview,
          executiveSummary: studyGuide.executiveSummary,
        },
        history: followUpTurns.map((t) => ({ question: t.question, answer: t.answer })),
        question,
      });

      const newTurn: FollowUpTurn = {
        id: `turn-${Date.now()}`,
        question,
        answer: result.answer,
        createdAt: new Date().toISOString(),
      };

      const updatedTurns = [...followUpTurns, newTurn];
      setFollowUpTurns(updatedTurns);

      if (activeSessionId) {
        updateSessionFollowUps(activeSessionId, updatedTurns);
      }
    } catch (err) {
      if (err instanceof StudyApiClientError) {
        setFollowUpError(err.message);
      } else {
        setFollowUpError('Could not answer that follow-up question right now. Please retry.');
      }
    } finally {
      setIsAskingFollowUp(false);
    }
  };

  const handleSelectSavedSession = (session: StudySession) => {
    abortControllerRef.current?.abort();
    setIsAnalyzing(false);
    setAnalysisError(null);
    setFollowUpError(null);

    const commaIdx = session.thumbnailDataUrl.indexOf(',');
    const thumbBase64 =
      commaIdx >= 0 ? session.thumbnailDataUrl.slice(commaIdx + 1) : session.thumbnailDataUrl;

    setCurrentImage({
      fileName: session.fileName,
      originalSizeBytes: 0,
      width: 0,
      height: 0,
      mimeType: 'image/jpeg',
      previewDataUrl: session.thumbnailDataUrl,
      base64Payload: thumbBase64,
      thumbnailDataUrl: session.thumbnailDataUrl,
    });
    setFocusPrompt(session.focusPrompt || '');
    setActiveSessionId(session.id);
    setStudyGuide(session.guide);
    setFollowUpTurns(session.followUps || []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <Header
        onNewUpload={handleNewUploadAction}
        onOpenSessions={() => setIsHistoryOpen(true)}
        savedCount={sessions.length}
      />

      <main
        id="workspace"
        className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-16"
      >
        {/* Workspace Intro & Secondary Controls Bar */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-stone-200/90 dark:border-stone-800">
          <div>
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
              Open-Source Visual Study Assistant · Gemma 4 Multimodal
            </p>
            <h1
              style={{ textWrap: 'balance' }}
              className="mt-1 font-display text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100"
            >
              Understand any textbook page, diagram, or handwritten note
            </h1>
          </div>

          {/* Workspace Toolbar (Theme & Mobile History Trigger) */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              className="min-h-[42px] inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              <History className="h-4 w-4" />
              Saved Sessions ({sessions.length})
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                theme === 'light'
                  ? 'Switch to dark study notebook mode'
                  : 'Switch to light study notebook mode'
              }
              className="min-h-[42px] inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="h-4 w-4" />
                  Dark Desk
                </>
              ) : (
                <>
                  <Sun className="h-4 w-4" />
                  Paper Light
                </>
              )}
            </button>
          </div>
        </div>

        {/* Two-Zone Responsive Sandbox Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          <div className="lg:col-span-5 lg:sticky lg:top-20">
            <UploadStage
              currentImage={currentImage}
              focusPrompt={focusPrompt}
              isAnalyzing={isAnalyzing}
              onImageReady={handleImageReady}
              onRemoveImage={handleRemoveImage}
              onFocusPromptChange={setFocusPrompt}
              onAnalyze={() => void handleAnalyze()}
              onCancelAnalysis={handleCancelAnalysis}
              fileInputTriggerRef={fileInputTriggerRef}
            />
          </div>

          <div className="lg:col-span-7">
            <StudyDeck
              guide={studyGuide}
              isAnalyzing={isAnalyzing}
              analysisError={analysisError}
              hasUploadedImage={Boolean(currentImage)}
              onRetryAnalysis={() => void handleAnalyze()}
              onCancelAnalysis={handleCancelAnalysis}
              followUpTurns={followUpTurns}
              isAskingFollowUp={isAskingFollowUp}
              followUpError={followUpError}
              onAskFollowUp={handleAskFollowUp}
            />
          </div>
        </div>

        <HowItWorksSection />
      </main>

      <footer className="border-t border-stone-200/90 bg-white/60 py-6 dark:border-stone-800 dark:bg-stone-950">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 text-xs text-stone-500 dark:text-stone-400">
          <p>SnapSolve AI — Open-Source Visual Learning Assistant</p>
          <p>Powered server-side by Google Gemma 4 (gemma-4-31b-it)</p>
        </div>
      </footer>

      <SessionDrawer
        isOpen={isHistoryOpen}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onClose={() => setIsHistoryOpen(false)}
        onSelectSession={handleSelectSavedSession}
        onDeleteSession={deleteSession}
        onClearAll={clearAllSessions}
      />
    </div>
  );
}
