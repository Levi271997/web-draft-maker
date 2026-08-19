"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { LeadContext } from "@/lib/lead";

/**
 * The conversion point.
 *
 * A modal rather than a link out, because sending someone to a generic contact
 * page loses everything they just told us — which design they settled on, how
 * many they tried, what they said they wanted. All of that rides along in
 * `context` without them retyping any of it.
 *
 * The booking link still exists; it moved to the success state, so they confirm
 * who they are first and pick a time second.
 *
 * PORTALLED TO document.body, and it has to be. `.df-fade-up` animates a
 * transform with fill-mode `both`, so the results column keeps a transform
 * after the animation ends — and a transformed ancestor becomes the containing
 * block for `position: fixed`. Rendered in place, the overlay covers that
 * column rather than the screen.
 */

const FIELD =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/25 disabled:bg-gray-50 disabled:text-gray-400";

export default function BookCallModal({
  open,
  onClose,
  brandName,
  bookingUrl,
  context,
}: {
  open: boolean;
  onClose: () => void;
  brandName: string;
  bookingUrl: string;
  context: LeadContext;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(false);

  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const titleId = useId();
  const nameRef = useRef<HTMLInputElement | null>(null);
  // So focus goes back where it came from rather than to the top of the page.
  const opener = useRef<Element | null>(null);

  // document.body isn't there during the server render.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;

    opener.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Autofocus after paint, or the dialog animates in around a focused field.
    const focus = setTimeout(() => nameRef.current?.focus(), 60);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      clearTimeout(focus);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      (opener.current as HTMLElement | null)?.focus?.();
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (sending) return;

    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, notes, consent, context }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }

      setSent(true);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop. A button so dismissing by click is reachable by keyboard too. */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="fixed inset-0 cursor-default bg-ink/50 backdrop-blur-[2px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="df-fade-up relative z-10 max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-7"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {sent ? (
          <div className="py-2">
            <span
              aria-hidden="true"
              className="mb-4 flex size-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="m5 13 4 4L19 7"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>

            <h2 id={titleId} className="font-heading text-h3-m font-bold text-ink">
              Thanks — we&apos;ve got your details
            </h2>
            <p className="mt-2 text-sm text-ink-soft">
              We&apos;ll be in touch about your homepage draft. If you&apos;d
              rather lock in a time now, pick one straight from the calendar.
            </p>

            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3.5 font-heading text-base font-bold text-ink shadow-sm transition hover:bg-accent-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              Pick a time
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

            <button
              type="button"
              onClick={onClose}
              className="mt-2 w-full rounded-xl px-6 py-2.5 text-sm font-semibold text-ink-soft transition hover:text-ink"
            >
              Back to my design
            </button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <h2 id={titleId} className="pr-8 font-heading text-h3-m font-bold text-ink">
              Book a call
            </h2>
            <p className="mt-1.5 mb-5 text-sm text-ink-soft">
              We&apos;ll walk through your homepage draft
              {brandName ? ` for ${brandName}` : ""} and what to do next.
            </p>

            <div className="flex flex-col gap-4">
              <div>
                <label htmlFor="lead-name" className="mb-1.5 block text-sm font-semibold text-ink">
                  Full name <span className="text-red-500">*</span>
                </label>
                <input
                  id="lead-name"
                  ref={nameRef}
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  disabled={sending}
                  className={FIELD}
                />
              </div>

              <div>
                <label htmlFor="lead-email" className="mb-1.5 block text-sm font-semibold text-ink">
                  Work email <span className="text-red-500">*</span>
                </label>
                <input
                  id="lead-email"
                  type="text"
                  inputMode="email"
                  autoComplete="email"
                  spellCheck={false}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  disabled={sending}
                  className={FIELD}
                />
              </div>

              <div>
                <label htmlFor="lead-notes" className="mb-1.5 block text-sm font-semibold text-ink">
                  Anything we should know?{" "}
                  <span className="font-normal text-ink-soft">(optional)</span>
                </label>
                <textarea
                  id="lead-notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Preferred times, context, etc."
                  disabled={sending}
                  className={`${FIELD} resize-y`}
                />
              </div>

              <label className="flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  disabled={sending}
                  className="mt-0.5 size-4 shrink-0 rounded border-gray-300 text-brand focus:ring-2 focus:ring-brand/25"
                />
                <span className="text-sm text-ink-soft">
                  I agree to how Digitalfeet stores and uses my data.{" "}
                  <span className="text-red-500">*</span>
                </span>
              </label>
            </div>

            {error && (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={sending}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3.5 font-heading text-base font-bold text-ink shadow-sm transition hover:bg-accent-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending ? (
                <span
                  aria-hidden="true"
                  className="df-spin size-4 rounded-full border-2 border-ink/25 border-t-ink"
                />
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 1.9.6 2.8a2 2 0 0 1-.4 2.1L8.1 9.8a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.8.6a2 2 0 0 1 1.8 2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              {sending ? "Sending…" : "Request my call"}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
