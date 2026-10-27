import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BookOpenCheck,
  Check,
  Copy,
  FileText,
  GraduationCap,
  Layers,
  Loader2,
  RefreshCw,
  X,
} from 'lucide-react';
import type { FollowUpTurn, StudyGuide } from '../types/study';
import { PracticeQuizView } from './PracticeQuizView';
import { FollowUpPanel } from './FollowUpPanel';

export type StudyTabId = 'explanation' | 'concepts' | 'quiz';

interface StudyDeckProps {
  guide: StudyGuide | null;
  isAnalyzing: boolean;
  analysisError: { message: string; retryable: boolean } | null;
  hasUploadedImage: boolean;
  onRetryAnalysis: () => void;
  onCancelAnalysis: () => void;
  followUpTurns: FollowUpTurn[];
  isAskingFollowUp: boolean;
  followUpError: string | null;
  onAskFollowUp: (question: string) => Promise<void>;
}

function buildMarkdownExport(guide: StudyGuide): string {
  const lines: string[] = [
    `# ${guide.title}`,
    `${guide.subject} · ${guide.topic} · ${guide.difficulty}`,
    '',
    '## Overview',
    guide.plainEnglishOverview,
    '',
    '## Executive Summary',
    ...guide.executiveSummary.map((item) => `- ${item}`),
    '',
    '## Step-by-Step Explanation',
    ...guide.explanationSteps.map(
      (s) =>
        `${s.stepNumber}. **${s.heading}**: ${s.explanation}${
          s.formulaOrNote ? `\n   Formula / Note: \`${s.formulaOrNote}\`` : ''
        }`
    ),
    '',
    '## Key Concepts',
    ...guide.keyConcepts.map(
      (c) =>
        `- **${c.term}**${c.formulaOrSymbol ? ` (${c.formulaOrSymbol})` : ''}: ${c.definition} — *${c.whyItMatters}*`
    ),
  ];
  return lines.join('\n');
}

export const StudyDeck: React.FC<StudyDeckProps> = ({
  guide,
  isAnalyzing,
  analysisError,
  hasUploadedImage,
  onRetryAnalysis,
  onCancelAnalysis,
  followUpTurns,
  isAskingFollowUp,
  followUpError,
  onAskFollowUp,
}) => {
  const [activeTab, setActiveTab] = useState<StudyTabId>('explanation');
  const [copied, setCopied] = useState(false);

  // Reset to explanation tab whenever a fresh study guide arrives
  useEffect(() => {
    if (guide) {
      setActiveTab('explanation');
    }
  }, [guide]);

  const handleCopyNotes = async () => {
    if (!guide) return;
    try {
      await navigator.clipboard.writeText(buildMarkdownExport(guide));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable in restricted contexts
    }
  };

  // 1. Loading State
  if (isAnalyzing) {
    return (
      <section
        aria-live="polite"
        aria-busy="true"
        className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 dark:border-stone-800 dark:bg-stone-900"
      >
        <div className="flex items-start justify-between gap-4 pb-6 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-stone-900 dark:text-stone-100">
                Analyzing your study material with Gemma 4...
              </h2>
              <p className="mt-0.5 text-xs text-stone-600 dark:text-stone-400">
                Inspecting visual labels, formulas, and notes to build your structured study guide.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancelAnalysis}
            className="min-h-[40px] inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            <X className="h-3.5 w-3.5" />
            Cancel
          </button>
        </div>

        {/* Calm Skeleton Layout Preserving Spatial Rhythm */}
        <div className="mt-6 space-y-6 animate-pulse">
          <div className="space-y-2.5">
            <div className="h-3.5 w-48 rounded bg-stone-200 dark:bg-stone-800" />
            <div className="h-7 w-3/4 rounded bg-stone-200 dark:bg-stone-800" />
          </div>

          <div className="space-y-2 pt-2">
            <div className="h-4 w-full rounded bg-stone-100 dark:bg-stone-800/70" />
            <div className="h-4 w-11/12 rounded bg-stone-100 dark:bg-stone-800/70" />
            <div className="h-4 w-4/5 rounded bg-stone-100 dark:bg-stone-800/70" />
          </div>

          <div className="pt-4 border-t border-stone-200/70 dark:border-stone-800 space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="space-y-2">
                <div className="h-4 w-56 rounded bg-stone-200 dark:bg-stone-800" />
                <div className="h-3.5 w-full rounded bg-stone-100 dark:bg-stone-800/70" />
                <div className="h-3.5 w-5/6 rounded bg-stone-100 dark:bg-stone-800/70" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // 2. Error Recovery State
  if (analysisError) {
    return (
      <section
        role="alert"
        className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 dark:border-stone-800 dark:bg-stone-900"
      >
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-xl font-semibold text-stone-900 dark:text-stone-100">
              Analysis could not be completed
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
              {analysisError.message}
            </p>

            {analysisError.retryable && hasUploadedImage && (
              <div className="mt-5">
                <button
                  type="button"
                  onClick={onRetryAnalysis}
                  className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Analysis Again
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  // 3. Zero / Empty State
  if (!guide) {
    return (
      <section
        aria-label="Study guide output area"
        className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-10 dark:border-stone-800 dark:bg-stone-900"
      >
        <div className="max-w-xl">
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
            Interactive Study Notebook · Powered by Gemma 4
          </p>
          <h2
            style={{ textWrap: 'balance' }}
            className="mt-2 font-display text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100"
          >
            {hasUploadedImage
              ? 'Your image is ready — click "Analyze with Gemma 4" to generate your study guide'
              : 'Turn static textbook pages and class notes into active understanding'}
          </h2>
          <p className="mt-3 text-sm sm:text-base leading-relaxed text-stone-600 dark:text-stone-400">
            Upload a photo on the left (or pick one of the real sample pages) to receive a genuine multimodal breakdown tailored for studying—never canned answers.
          </p>

          <div className="mt-8 divide-y divide-stone-200 border-t border-b border-stone-200 dark:divide-stone-800 dark:border-stone-800">
            <div className="py-4 flex items-start gap-3.5">
              <FileText className="h-5 w-5 shrink-0 mt-0.5 text-blue-700 dark:text-blue-400" />
              <div>
                <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  01. Plain-English Overview & Step-by-Step Walkthrough
                </h3>
                <p className="mt-0.5 text-xs leading-relaxed text-stone-600 dark:text-stone-400">
                  Breaks dense derivations, biological pathways, and textbook passages into clear, logical stages.
                </p>
              </div>
            </div>

            <div className="py-4 flex items-start gap-3.5">
              <Layers className="h-5 w-5 shrink-0 mt-0.5 text-blue-700 dark:text-blue-400" />
              <div>
                <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  02. Executive Summary & Key Concept Glossary
                </h3>
                <p className="mt-0.5 text-xs leading-relaxed text-stone-600 dark:text-stone-400">
                  Extracts core vocabulary, formulas, and why each concept matters on an exam.
                </p>
              </div>
            </div>

            <div className="py-4 flex items-start gap-3.5">
              <GraduationCap className="h-5 w-5 shrink-0 mt-0.5 text-blue-700 dark:text-blue-400" />
              <div>
                <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  03. Interactive Practice Quiz & Contextual Tutor Q&A
                </h3>
                <p className="mt-0.5 text-xs leading-relaxed text-stone-600 dark:text-stone-400">
                  Test yourself with multiple-choice and reveal-answer cards, then ask follow-up questions about any detail in your photo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // 4. Populated Study Guide State
  return (
    <section
      aria-label="Generated study guide"
      className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-8 dark:border-stone-800 dark:bg-stone-900"
    >
      {/* Header Metadata (Unboxed Clean Typography) + Copy Button */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-stone-200 dark:border-stone-800">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
            <span className="font-medium text-stone-800 dark:text-stone-200">
              {guide.subject}
            </span>
            <span aria-hidden="true">·</span>
            <span>{guide.topic}</span>
            <span aria-hidden="true">·</span>
            <span>{guide.difficulty}</span>
            <span aria-hidden="true">·</span>
            <span>{guide.detectedMaterialType}</span>
          </div>

          <h2
            style={{ textWrap: 'balance' }}
            className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100"
          >
            {guide.title}
          </h2>
        </div>

        <button
          type="button"
          onClick={() => void handleCopyNotes()}
          className="min-h-[40px] inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              Copied Markdown
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy Notes
            </>
          )}
        </button>
      </div>

      {/* Honest Readability Warning if Photo Was Blurry or Cropped */}
      {guide.readabilityWarning && (
        <div
          role="status"
          className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/75 p-4 text-xs sm:text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/35 dark:text-amber-200"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-700 dark:text-amber-400" />
          <div>
            <p className="font-semibold">Image Clarity Note</p>
            <p className="mt-0.5 leading-relaxed">{guide.readabilityWarning}</p>
          </div>
        </div>
      )}

      {/* Big-Picture Overview */}
      <div className="mt-5">
        <p className="text-sm sm:text-base leading-relaxed text-stone-800 dark:text-stone-200">
          {guide.plainEnglishOverview}
        </p>
      </div>

      {/* Segmented Study Mode Tabs */}
      <div
        role="tablist"
        aria-label="Study guide sections"
        className="mt-6 flex items-center gap-1 overflow-x-auto rounded-xl bg-stone-100 p-1 dark:bg-stone-950"
      >
        <button
          role="tab"
          type="button"
          aria-selected={activeTab === 'explanation'}
          onClick={() => setActiveTab('explanation')}
          className={`min-h-[40px] flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'explanation'
              ? 'bg-white text-stone-900 shadow-xs dark:bg-stone-800 dark:text-stone-100'
              : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200'
          }`}
        >
          <BookOpenCheck className="h-4 w-4" />
          Explanation ({guide.explanationSteps.length})
        </button>

        <button
          role="tab"
          type="button"
          aria-selected={activeTab === 'concepts'}
          onClick={() => setActiveTab('concepts')}
          className={`min-h-[40px] flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'concepts'
              ? 'bg-white text-stone-900 shadow-xs dark:bg-stone-800 dark:text-stone-100'
              : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200'
          }`}
        >
          <Layers className="h-4 w-4" />
          Summary & Concepts ({guide.keyConcepts.length})
        </button>

        <button
          role="tab"
          type="button"
          aria-selected={activeTab === 'quiz'}
          onClick={() => setActiveTab('quiz')}
          className={`min-h-[40px] flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
            activeTab === 'quiz'
              ? 'bg-white text-stone-900 shadow-xs dark:bg-stone-800 dark:text-stone-100'
              : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200'
          }`}
        >
          <GraduationCap className="h-4 w-4" />
          Practice Quiz ({guide.practiceQuestions.length})
        </button>
      </div>

      {/* Active Tab Panel */}
      <div className="mt-6">
        {activeTab === 'explanation' && (
          <div className="divide-y divide-stone-200 dark:divide-stone-800">
            {guide.explanationSteps.map((step, idx) => (
              <article key={`${step.stepNumber}-${idx}`} className="py-5 first:pt-1 last:pb-1">
                <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
                  <span className="font-mono tabular-nums text-blue-700 dark:text-blue-400 mr-2">
                    0{step.stepNumber}.
                  </span>
                  {step.heading}
                </h3>
                <p className="mt-2 text-sm sm:text-[15px] leading-relaxed text-stone-700 dark:text-stone-300 max-w-[72ch]">
                  {step.explanation}
                </p>
                {step.formulaOrNote && (
                  <div className="mt-3 rounded-xl border border-stone-200/90 bg-stone-50 px-4 py-2.5 font-mono text-xs sm:text-sm text-stone-900 overflow-x-auto dark:border-stone-800 dark:bg-stone-950 dark:text-stone-200">
                    {step.formulaOrNote}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        {activeTab === 'concepts' && (
          <div className="space-y-8">
            {/* Executive Summary */}
            <div>
              <h3 className="font-display text-lg font-semibold text-stone-900 dark:text-stone-100 mb-3">
                Key Takeaways
              </h3>
              <ul className="space-y-2.5">
                {guide.executiveSummary.map((point, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 text-sm sm:text-[15px] leading-relaxed text-stone-700 dark:text-stone-300"
                  >
                    <span className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400 mt-1 shrink-0 tabular-nums">
                      0{idx + 1}.
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Key Concepts Glossary */}
            <div className="pt-6 border-t border-stone-200 dark:border-stone-800">
              <h3 className="font-display text-lg font-semibold text-stone-900 dark:text-stone-100 mb-2">
                Core Concepts & Definitions
              </h3>
              <div className="divide-y divide-stone-200 dark:divide-stone-800">
                {guide.keyConcepts.map((concept, idx) => (
                  <div key={`${concept.term}-${idx}`} className="py-4 first:pt-2 last:pb-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h4 className="text-sm sm:text-base font-semibold text-stone-900 dark:text-stone-100">
                        {concept.term}
                      </h4>
                      {concept.formulaOrSymbol && (
                        <code className="font-mono text-xs text-blue-700 dark:text-blue-400">
                          {concept.formulaOrSymbol}
                        </code>
                      )}
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
                      {concept.definition}
                    </p>
                    {concept.whyItMatters && (
                      <p className="mt-1.5 text-xs leading-relaxed text-stone-500 dark:text-stone-400">
                        <span className="font-semibold text-stone-700 dark:text-stone-300">
                          Why it matters:{' '}
                        </span>
                        {concept.whyItMatters}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'quiz' && (
          <PracticeQuizView questions={guide.practiceQuestions} />
        )}
      </div>

      {/* Contextual Follow-Up Tutor Q&A */}
      <FollowUpPanel
        suggestedFollowUps={guide.suggestedFollowUps}
        turns={followUpTurns}
        isAsking={isAskingFollowUp}
        error={followUpError}
        onAskQuestion={onAskFollowUp}
      />
    </section>
  );
};
