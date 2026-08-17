"use client";

import { REFINEMENTS, type RefineKey } from "@/lib/refine";

/**
 * The reason the preview isn't the end of the journey. Clients can't say what's
 * wrong with a design, but they can react to one — and each reaction is a
 * re-generation, not a trip back to the form.
 */
export default function RefineBar({
  loading,
  pending,
  onRefine,
  bookingUrl,
}: {
  loading: boolean;
  pending: RefineKey | null;
  onRefine: (key: RefineKey) => void;
  bookingUrl: string;
}) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 sm:p-8">
      <h2 className="font-heading text-h3-m font-bold text-ink">
        Not quite right?
      </h2>
      <p className="mt-1 mb-4 max-w-prose text-sm text-ink-soft">
        Tell us what to change in plain words and we&apos;ll redraw it. You
        don&apos;t need to know any design terms.
      </p>

      <div className="flex flex-wrap gap-2">
        {REFINEMENTS.map((option) => {
          const isPending = pending === option.id;
          return (
            <button
              key={option.id}
              type="button"
              disabled={loading}
              onClick={() => onRefine(option.id)}
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-ink transition hover:border-brand hover:bg-brand/5 hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending && (
                <span
                  aria-hidden="true"
                  className="df-spin size-3.5 rounded-full border-2 border-brand/25 border-t-brand"
                />
              )}
              {option.label}
            </button>
          );
        })}
      </div>

      {/* The sneak peek converts here, not on the preview itself. */}
      <div className="mt-7 rounded-xl bg-purple px-6 py-6 sm:px-8">
        <h3 className="font-heading text-h3-m font-bold text-white">
          Like where this is going?
        </h3>
        <p className="mt-2 max-w-prose text-sm text-white/75">
          This is a first draft, generated in seconds. Book a call and
          we&apos;ll turn it into a real website — your photos, your words, built
          properly and launched.
        </p>
        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 font-heading text-base font-bold text-ink shadow-sm transition hover:bg-accent-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          Book a call with Digitalfeet
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M5 12h14m-6-6 6 6-6 6"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </div>
    </section>
  );
}
