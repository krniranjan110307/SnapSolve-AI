import React, { useState } from 'react';
import { AlertTriangle, Loader2, RefreshCw, Send } from 'lucide-react';
import type { FollowUpTurn } from '../types/study';

interface FollowUpPanelProps {
  suggestedFollowUps: string[];
  turns: FollowUpTurn[];
  isAsking: boolean;
  error: string | null;
  onAskQuestion: (question: string) => Promise<void>;
}

export const FollowUpPanel: React.FC<FollowUpPanelProps> = ({
  suggestedFollowUps,
  turns,
  isAsking,
  error,
  onAskQuestion,
}) => {
  const [input, setInput] = useState('');
  const [lastAttemptedQuestion, setLastAttemptedQuestion] = useState<string | null>(null);

  const submitQuestion = async (rawQuestion: string) => {
    const trimmed = rawQuestion.trim();
    if (!trimmed || isAsking) return;
    setLastAttemptedQuestion(trimmed);
    setInput('');
    await onAskQuestion(trimmed);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submitQuestion(input);
  };

  const unusedSuggestions = suggestedFollowUps.filter(
    (s) => !turns.some((t) => t.question.toLowerCase() === s.toLowerCase())
  );

  return (
    <section
      aria-label="Follow-up tutor questions"
      className="mt-8 pt-6 border-t border-stone-200 dark:border-stone-800"
    >
      <div className="mb-4">
        <h3 className="font-display text-lg font-semibold text-stone-900 dark:text-stone-100">
          Ask a Follow-Up Question
        </h3>
        <p className="mt-0.5 text-xs text-stone-600 dark:text-stone-400">
          Gemma 4 keeps your uploaded study image and explanation in context so you can clarify any step.
        </p>
      </div>

      {/* Starter Follow-Up Prompts */}
      {unusedSuggestions.length > 0 && (
        <div className="mb-4 flex flex-col gap-2">
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
            Suggested questions for this material:
          </p>
          <div className="flex flex-wrap gap-2">
            {unusedSuggestions.map((prompt) => (
              <button
                key={prompt}
                type="button"
                disabled={isAsking}
                onClick={() => void submitQuestion(prompt)}
                className="min-h-[40px] rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2 text-left text-xs font-medium text-stone-700 hover:border-blue-600 hover:text-blue-700 transition-colors cursor-pointer disabled:opacity-50 dark:border-stone-800 dark:bg-stone-950/60 dark:text-stone-300 dark:hover:border-blue-500 dark:hover:text-blue-400"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Existing Q&A Thread */}
      {turns.length > 0 && (
        <div className="mb-5 space-y-4">
          {turns.map((turn) => (
            <div
              key={turn.id}
              className="rounded-xl border border-stone-200/90 bg-stone-50/70 p-4 dark:border-stone-800 dark:bg-stone-950/60"
            >
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                Your Question
              </p>
              <p className="mt-0.5 text-sm font-medium text-stone-900 dark:text-stone-100">
                {turn.question}
              </p>
              <div className="mt-3 pt-3 border-t border-stone-200/80 dark:border-stone-800">
                <p className="text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Tutor Explanation
                </p>
                <div className="space-y-2 text-sm leading-relaxed text-stone-800 whitespace-pre-line dark:text-stone-200">
                  {turn.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loading Indicator */}
      {isAsking && (
        <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-xs font-medium text-stone-700 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-300">
          <Loader2 className="h-4 w-4 animate-spin text-blue-700 dark:text-blue-400" />
          <span>Inspecting your uploaded material to answer your question...</span>
        </div>
      )}

      {/* Error Recovery */}
      {error && (
        <div
          role="alert"
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-xs text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
            <span>{error}</span>
          </div>
          {lastAttemptedQuestion && (
            <button
              type="button"
              disabled={isAsking}
              onClick={() => void submitQuestion(lastAttemptedQuestion)}
              className="min-h-[36px] inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 font-semibold text-red-800 hover:bg-red-50 cursor-pointer dark:border-red-800 dark:bg-stone-900 dark:text-red-200"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          )}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleFormSubmit} className="flex items-center gap-2.5">
        <label htmlFor="followup-question-input" className="sr-only">
          Ask a follow-up question about this study material
        </label>
        <input
          id="followup-question-input"
          type="text"
          maxLength={1000}
          disabled={isAsking}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about a specific symbol, line, or concept in this image..."
          className="min-h-[46px] flex-1 rounded-xl border border-stone-300 bg-stone-50/60 px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-blue-600 focus:bg-white focus:outline-none dark:border-stone-700 dark:bg-stone-950/60 dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || isAsking}
          className="min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-45 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
        >
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline">Ask Tutor</span>
        </button>
      </form>
    </section>
  );
};
