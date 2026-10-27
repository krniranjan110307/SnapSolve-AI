import React, { useState } from 'react';
import { CheckCircle2, Eye, EyeOff, HelpCircle, RotateCcw, XCircle } from 'lucide-react';
import type { PracticeQuestion } from '../types/study';

interface PracticeQuizViewProps {
  questions: PracticeQuestion[];
}

export const PracticeQuizView: React.FC<PracticeQuizViewProps> = ({ questions }) => {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});
  const [visibleHints, setVisibleHints] = useState<Record<string, boolean>>({});
  const [draftResponses, setDraftResponses] = useState<Record<string, string>>({});

  if (!questions || questions.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-stone-600 dark:text-stone-400">
        No practice questions were generated for this upload. Try re-analyzing with a focus prompt.
      </div>
    );
  }

  const mcqQuestions = questions.filter(
    (q) => q.type === 'multiple_choice' && q.options && q.options.length >= 2
  );
  const answeredMcqCount = mcqQuestions.filter((q) => selectedOptions[q.id] !== undefined).length;
  const correctMcqCount = mcqQuestions.filter(
    (q) =>
      selectedOptions[q.id] !== undefined &&
      selectedOptions[q.id] === (q.correctOptionIndex ?? 0)
  ).length;

  const handleResetQuiz = () => {
    setSelectedOptions({});
    setRevealedAnswers({});
    setVisibleHints({});
    setDraftResponses({});
  };

  const hasAnyInteraction =
    Object.keys(selectedOptions).length > 0 ||
    Object.keys(revealedAnswers).length > 0 ||
    Object.keys(draftResponses).length > 0;

  return (
    <div className="space-y-6">
      {/* Score & Reset Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600 dark:text-stone-400 font-mono tabular-nums">
          <span className="font-semibold text-stone-900 dark:text-stone-100">
            {questions.length} Practice Questions
          </span>
          {mcqQuestions.length > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span>
                Answered {answeredMcqCount}/{mcqQuestions.length} Multiple Choice
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-blue-700 dark:text-blue-400">
                Score: {correctMcqCount}/{answeredMcqCount || mcqQuestions.length}
              </span>
            </>
          )}
        </div>

        {hasAnyInteraction && (
          <button
            type="button"
            onClick={handleResetQuiz}
            className="min-h-[38px] inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Practice
          </button>
        )}
      </div>

      {/* Question List Separated by Clean Hairline Dividers */}
      <div className="divide-y divide-stone-200 dark:divide-stone-800">
        {questions.map((q, index) => {
          const isMcq = q.type === 'multiple_choice' && q.options && q.options.length >= 2;
          const chosenIdx = selectedOptions[q.id];
          const isAnswered = chosenIdx !== undefined;
          const correctIdx = q.correctOptionIndex ?? 0;
          const isCorrect = isAnswered && chosenIdx === correctIdx;
          const isHintShown = Boolean(visibleHints[q.id]);
          const isShortRevealed = Boolean(revealedAnswers[q.id]);

          return (
            <article key={q.id} className="py-6 first:pt-1 last:pb-1">
              {/* Quiet inline metadata kicker */}
              <div className="flex items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 font-mono tabular-nums">
                  <span className="font-semibold text-stone-800 dark:text-stone-200">
                    Question 0{index + 1}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{isMcq ? 'Multiple Choice' : 'Self-Check Concept'}</span>
                </div>

                {q.hint && (
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleHints((prev) => ({ ...prev, [q.id]: !prev[q.id] }))
                    }
                    className="min-h-[36px] inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-stone-800"
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                    {isHintShown ? 'Hide Hint' : 'Show Hint'}
                  </button>
                )}
              </div>

              <h4 className="text-base font-semibold leading-snug text-stone-900 dark:text-stone-100">
                {q.question}
              </h4>

              {isHintShown && q.hint && (
                <div className="mt-3 rounded-xl border border-amber-200/80 bg-amber-50/70 px-4 py-3 text-xs leading-relaxed text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                  <span className="font-semibold">Study Hint: </span>
                  {q.hint}
                </div>
              )}

              {isMcq && q.options ? (
                <div className="mt-4 space-y-2.5">
                  {q.options.map((opt, optIdx) => {
                    const optionLetter = String.fromCharCode(65 + optIdx);
                    const isThisSelected = chosenIdx === optIdx;
                    const isThisCorrect = optIdx === correctIdx;

                    let buttonStyle =
                      'border-stone-200 bg-stone-50/60 text-stone-800 hover:border-stone-400 hover:bg-stone-100/70 dark:border-stone-800 dark:bg-stone-950/50 dark:text-stone-200 dark:hover:border-stone-600';

                    if (isAnswered) {
                      if (isThisCorrect) {
                        buttonStyle =
                          'border-emerald-600 bg-emerald-50/80 text-emerald-950 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-100';
                      } else if (isThisSelected && !isThisCorrect) {
                        buttonStyle =
                          'border-red-500 bg-red-50/80 text-red-950 dark:border-red-500 dark:bg-red-950/40 dark:text-red-100';
                      } else {
                        buttonStyle =
                          'border-stone-200/70 bg-stone-50/30 text-stone-500 dark:border-stone-800/70 dark:bg-stone-950/30 dark:text-stone-500';
                      }
                    }

                    return (
                      <button
                        key={`${q.id}-opt-${optIdx}`}
                        type="button"
                        disabled={isAnswered}
                        onClick={() =>
                          setSelectedOptions((prev) => ({ ...prev, [q.id]: optIdx }))
                        }
                        className={`min-h-[46px] w-full flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors cursor-pointer disabled:cursor-default ${buttonStyle}`}
                      >
                        <span className="flex items-start gap-2.5">
                          <span className="font-mono font-semibold shrink-0">
                            {optionLetter}.
                          </span>
                          <span>{opt}</span>
                        </span>

                        {isAnswered && isThisCorrect && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 shrink-0 dark:text-emerald-400">
                            <CheckCircle2 className="h-4 w-4" />
                            Correct
                          </span>
                        )}
                        {isAnswered && isThisSelected && !isThisCorrect && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 shrink-0 dark:text-red-400">
                            <XCircle className="h-4 w-4" />
                            Your Pick
                          </span>
                        )}
                      </button>
                    );
                  })}

                  {isAnswered && (
                    <div
                      className={`mt-3 rounded-xl border p-4 text-sm leading-relaxed ${
                        isCorrect
                          ? 'border-emerald-200 bg-emerald-50/50 text-stone-800 dark:border-emerald-900/50 dark:bg-emerald-950/25 dark:text-stone-200'
                          : 'border-amber-200 bg-amber-50/50 text-stone-800 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-stone-200'
                      }`}
                    >
                      <p className="font-semibold mb-1 flex items-center gap-1.5">
                        {isCorrect ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            <span>Spot on — Why this works:</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                            <span>Review Rationale:</span>
                          </>
                        )}
                      </p>
                      <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300">
                        {q.explanation || q.answer}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <textarea
                    rows={2}
                    value={draftResponses[q.id] || ''}
                    onChange={(e) =>
                      setDraftResponses((prev) => ({ ...prev, [q.id]: e.target.value }))
                    }
                    placeholder="Jot down your own reasoning first before revealing the answer..."
                    aria-label={`Your practice response for question ${index + 1}`}
                    className="w-full rounded-xl border border-stone-300 bg-stone-50/60 px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-blue-600 focus:bg-white focus:outline-none dark:border-stone-700 dark:bg-stone-950/60 dark:text-stone-100 dark:placeholder:text-stone-500"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setRevealedAnswers((prev) => ({ ...prev, [q.id]: !prev[q.id] }))
                    }
                    className="min-h-[44px] inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700"
                  >
                    {isShortRevealed ? (
                      <>
                        <EyeOff className="h-4 w-4" />
                        Hide Model Answer
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4" />
                        Reveal Model Answer
                      </>
                    )}
                  </button>

                  {isShortRevealed && (
                    <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm leading-relaxed dark:border-stone-800 dark:bg-stone-950/70">
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">
                        Model Answer
                      </p>
                      <p className="text-stone-900 dark:text-stone-100">{q.answer}</p>
                      {q.explanation && q.explanation !== q.answer && (
                        <p className="mt-2 pt-2 border-t border-stone-200/80 text-xs text-stone-600 dark:border-stone-800 dark:text-stone-400">
                          {q.explanation}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
};
