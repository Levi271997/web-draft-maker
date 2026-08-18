"use client";

import { useState } from "react";
import type { LeadContext } from "@/lib/lead";
import { REFINEMENTS, type RefineKey } from "@/lib/refine";
import BookCallModal from "./BookCallModal";

/**
 * The reason the preview isn't the end of the journey. Clients can't say what's
 * wrong with a design, but they can react to one — and each reaction is a
 * re-generation, not a trip back to the form.
 *
 * "Start over" is deliberately separated from the tweaks: wanting a different
 * design entirely is a different intent from wanting warmer copy, and it was
 * getting lost in a row of pills.
 */

const TWEAKS = REFINEMENTS.filter((r) => r.id !== "regenerate");

export default function RefineBar({
  loading,
  pending,
  versionCount,
  onRefine,
  bookingUrl,
  brandName,
  context,
}: {
  loading: boolean;
  pending: RefineKey | null;
  versionCount: number;
  onRefine: (key: RefineKey) => void;
  bookingUrl: string;
  brandName: string;
  context: LeadContext;
}) {
  const regenerating = pending === "regenerate";
  const [booking, setBooking] = useState(false);

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
        {TWEAKS.map((option) => (
          <button
            key={option.id}
            type="button"
            disabled={loading}
            onClick={() => onRefine(option.id)}
            className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-ink transition hover:border-brand hover:bg-brand/5 hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending === option.id && (
              <span
                aria-hidden="true"
                className="df-spin size-3.5 rounded-full border-2 border-brand/25 border-t-brand"
              />
            )}
            {option.label}
          </button>
        ))}
      </div>

      {/* A different design entirely — its own decision, not a tweak. */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-cream px-5 py-4">
        <div className="min-w-0">
          <p className="font-heading text-sm font-bold text-ink">
            Don&apos;t like this design at all?
          </p>
          <p className="mt-0.5 text-xs text-ink-soft">
            Start again from scratch — a different layout, structure and look.
            {versionCount > 1
              ? " Your earlier designs stay saved above."
              : " We'll keep this one so you can compare."}
          </p>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={() => onRefine("regenerate")}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border-2 border-brand bg-white px-5 py-2.5 font-heading text-sm font-bold text-brand transition hover:bg-brand hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {regenerating ? (
            <span
              aria-hidden="true"
              className="df-spin size-4 rounded-full border-2 border-brand/25 border-t-brand"
            />
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M20 11A8 8 0 1 0 18.6 15M20 5v6h-6"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
          {regenerating ? "Designing…" : "Generate a new design"}
        </button>
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
        <button
          type="button"
          onClick={() => setBooking(true)}
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
        </button>
      </div>

      <BookCallModal
        open={booking}
        onClose={() => setBooking(false)}
        brandName={brandName}
        bookingUrl={bookingUrl}
        context={context}
      />
    </section>
  );
}
