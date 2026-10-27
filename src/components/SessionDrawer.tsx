import React, { useEffect, useState } from 'react';
import { BookOpen, Clock, Trash2, X } from 'lucide-react';
import type { StudySession } from '../types/study';

interface SessionDrawerProps {
  isOpen: boolean;
  sessions: StudySession[];
  activeSessionId: string | null;
  onClose: () => void;
  onSelectSession: (session: StudySession) => void;
  onDeleteSession: (sessionId: string) => void;
  onClearAll: () => void;
}

function formatSessionDate(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return 'Recent';
  }
}

export const SessionDrawer: React.FC<SessionDrawerProps> = ({
  isOpen,
  sessions,
  activeSessionId,
  onClose,
  onSelectSession,
  onDeleteSession,
  onClearAll,
}) => {
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setConfirmClearAll(false);
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Saved local study sessions"
      className="fixed inset-0 z-50 flex justify-end bg-stone-950/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-md flex-col border-l border-stone-200 bg-white shadow-xl dark:border-stone-800 dark:bg-stone-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-stone-200 px-5 py-4 dark:border-stone-800">
          <div>
            <h2 className="font-display text-lg font-semibold text-stone-900 dark:text-stone-100">
              Recent Study Sessions
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Saved privately in your browser ({sessions.length}/10)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close recent sessions drawer"
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-stone-600 hover:bg-stone-100 hover:text-stone-900 cursor-pointer dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                <Clock className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                No saved sessions yet
              </p>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-stone-600 dark:text-stone-400">
                Whenever you analyze a textbook page, diagram, or note, it will appear here automatically for quick review.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-stone-200 dark:divide-stone-800">
              {sessions.map((session) => {
                const isActive = session.id === activeSessionId;
                return (
                  <li key={session.id} className="py-3.5 first:pt-0 last:pb-0">
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectSession(session);
                          onClose();
                        }}
                        className="flex flex-1 items-start gap-3 text-left group cursor-pointer"
                      >
                        <div className="h-14 w-16 shrink-0 overflow-hidden rounded-lg border border-stone-200 bg-stone-100 dark:border-stone-800 dark:bg-stone-950">
                          {session.thumbnailDataUrl ? (
                            <img
                              src={session.thumbnailDataUrl}
                              alt={session.guide.title}
                              referrerPolicy="no-referrer"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <BookOpen className="h-4 w-4 text-stone-400" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm font-semibold truncate group-hover:text-blue-700 dark:group-hover:text-blue-400 ${
                              isActive
                                ? 'text-blue-700 dark:text-blue-400'
                                : 'text-stone-900 dark:text-stone-100'
                            }`}
                          >
                            {session.guide.title}
                          </p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                            <span>{session.guide.subject}</span>
                            <span aria-hidden="true">·</span>
                            <span>{formatSessionDate(session.createdAt)}</span>
                          </div>
                          {session.followUps.length > 0 && (
                            <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400 tabular-nums">
                              {session.followUps.length} follow-up{' '}
                              {session.followUps.length === 1 ? 'question' : 'questions'}
                            </p>
                          )}
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteSession(session.id)}
                        aria-label={`Delete saved session ${session.guide.title}`}
                        className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer dark:hover:bg-red-950/40 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer Clear Action (No browser confirm() dialogs) */}
        {sessions.length > 0 && (
          <div className="border-t border-stone-200 px-5 py-4 dark:border-stone-800">
            {!confirmClearAll ? (
              <button
                type="button"
                onClick={() => setConfirmClearAll(true)}
                className="min-h-[44px] w-full rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
              >
                Clear All Local History
              </button>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-red-700 dark:text-red-400">
                  Remove all {sessions.length} saved sessions?
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmClearAll(false)}
                    className="min-h-[38px] rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100 cursor-pointer dark:border-stone-700 dark:text-stone-300"
                  >
                    Keep
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClearAll();
                      setConfirmClearAll(false);
                    }}
                    className="min-h-[38px] rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 cursor-pointer"
                  >
                    Confirm Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
