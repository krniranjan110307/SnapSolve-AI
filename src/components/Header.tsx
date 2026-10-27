import React from 'react';

interface HeaderProps {
  onNewUpload: () => void;
  onOpenSessions: () => void;
  savedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onNewUpload,
  onOpenSessions,
  savedCount,
}) => {
  return (
    <header className="sticky top-0 z-30 h-14 border-b border-stone-200/90 bg-stone-50/90 backdrop-blur-md dark:border-stone-800 dark:bg-stone-950/90">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#workspace"
          className="font-display text-lg font-semibold tracking-tight text-stone-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 dark:text-stone-100"
        >
          SnapSolve AI
        </a>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600 dark:text-stone-400"
        >
          <a
            href="#workspace"
            className="hover:text-stone-900 hover:underline hover:underline-offset-4 transition-colors whitespace-nowrap shrink-0 dark:hover:text-stone-100"
          >
            Workspace
          </a>
          <button
            type="button"
            onClick={onOpenSessions}
            className="hover:text-stone-900 hover:underline hover:underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer dark:hover:text-stone-100 tabular-nums"
          >
            {savedCount > 0 ? `Recent (${savedCount})` : 'Recent'}
          </button>
          <a
            href="#how-it-works"
            className="hover:text-stone-900 hover:underline hover:underline-offset-4 transition-colors whitespace-nowrap shrink-0 dark:hover:text-stone-100"
          >
            How It Works
          </a>
          <a
            href="#photo-tips"
            className="hover:text-stone-900 hover:underline hover:underline-offset-4 transition-colors whitespace-nowrap shrink-0 dark:hover:text-stone-100"
          >
            Photo Tips
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onNewUpload}
            className="min-h-[40px] px-4 py-2 text-xs font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            New Upload
          </button>
        </div>
      </div>
    </header>
  );
};
