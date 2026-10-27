import React from 'react';

export const HowItWorksSection: React.FC = () => {
  return (
    <div className="mt-16 space-y-14 border-t border-stone-200 pt-12 dark:border-stone-800">
      {/* How It Works */}
      <section id="how-it-works" className="scroll-mt-20">
        <div className="max-w-2xl">
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
            Visual Learning Workflow
          </p>
          <h2
            style={{ textWrap: 'balance' }}
            className="mt-1.5 font-display text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100"
          >
            Built to help you understand the concept, not just copy an answer
          </h2>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-stone-200/90 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
            <p className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400 tabular-nums">
              01. Capture & Optimize
            </p>
            <h3 className="mt-2 font-display text-lg font-semibold text-stone-900 dark:text-stone-100">
              Snap any page, whiteboard, or diagram
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
              Upload from your laptop, paste a screenshot, or snap a photo on your phone. Images are validated and resized cleanly in your browser for fast uploads on campus Wi-Fi.
            </p>
          </div>

          <div className="rounded-2xl border border-stone-200/90 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
            <p className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400 tabular-nums">
              02. Gemma 4 Multimodal Reasoning
            </p>
            <h3 className="mt-2 font-display text-lg font-semibold text-stone-900 dark:text-stone-100">
              Structured step-by-step explanations
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
              Our secure backend sends your material to Google&apos;s open-weights Gemma 4 model with strict schema enforcement—producing clear steps, definitions, and honest clarity warnings if handwriting is blurry.
            </p>
          </div>

          <div className="rounded-2xl border border-stone-200/90 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
            <p className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400 tabular-nums">
              03. Active Recall & Tutor Q&A
            </p>
            <h3 className="mt-2 font-display text-lg font-semibold text-stone-900 dark:text-stone-100">
              Self-test before your exam
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
              Check your understanding with interactive multiple-choice and open-ended practice cards, then ask targeted follow-up questions with your uploaded image still in context.
            </p>
          </div>
        </div>
      </section>

      {/* Photo Tips */}
      <section
        id="photo-tips"
        className="scroll-mt-20 rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 dark:border-stone-800 dark:bg-stone-900"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4">
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
              Best Results Guide
            </p>
            <h2
              style={{ textWrap: 'balance' }}
              className="mt-1 font-display text-xl sm:text-2xl font-semibold text-stone-900 dark:text-stone-100"
            >
              Tips for photographing study materials clearly
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
              Clear visual inputs help Gemma 4 read small subscripts, arrows, and handwritten steps accurately.
            </p>
          </div>

          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                01. Crop to one concept or problem
              </h3>
              <p className="mt-1 text-xs sm:text-sm leading-relaxed text-stone-600 dark:text-stone-400">
                Focusing on a single diagram, derivation, or textbook section produces deeper step-by-step explanations and sharper quiz questions.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                02. Shoot straight-on in even light
              </h3>
              <p className="mt-1 text-xs sm:text-sm leading-relaxed text-stone-600 dark:text-stone-400">
                Hold your camera parallel to the notebook page to avoid steep perspective distortion or shadows across exponents and minus signs.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                03. Add a quick focus note when stuck
              </h3>
              <p className="mt-1 text-xs sm:text-sm leading-relaxed text-stone-600 dark:text-stone-400">
                Use the optional focus field to mention what confuses you—such as &ldquo;Why did they integrate by parts in line 3?&rdquo;
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                04. Keep diagrams and axes labels inside the frame
              </h3>
              <p className="mt-1 text-xs sm:text-sm leading-relaxed text-stone-600 dark:text-stone-400">
                Include figure captions, legends, and coordinate axis units so the explanation connects visual arrows to real physical quantities.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
