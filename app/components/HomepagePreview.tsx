"use client";

import { useState } from "react";
import type { Recommendation } from "@/lib/types";

/**
 * The generated page is a complete HTML document written by the model, so it
 * renders in an iframe rather than as React components.
 *
 * `sandbox="allow-scripts"` lets its JavaScript run — menus, accordions and
 * sliders all need it — while withholding `allow-same-origin`, which keeps the
 * document on a unique opaque origin. It can script itself and nothing else.
 */

const DEVICES = [
  { id: "desktop", label: "Desktop", width: "100%" },
  { id: "mobile", label: "Mobile", width: "390px" },
] as const;

type DeviceId = (typeof DEVICES)[number]["id"];

const PREVIEW_PREFIX = "df-preview-";
const MAX_STORED = 5;

export default function HomepagePreview({
  recommendation,
}: {
  recommendation: Recommendation;
}) {
  const [device, setDevice] = useState<DeviceId>("desktop");
  const [copied, setCopied] = useState(false);

  const active = DEVICES.find((d) => d.id === device)!;

  async function copyHtml() {
    try {
      await navigator.clipboard.writeText(recommendation.html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  /**
   * Hands the document to a new tab through localStorage rather than writing it
   * into the window directly, which would run it on our own origin.
   */
  function openInNewWindow() {
    try {
      const key = Math.random().toString(36).slice(2, 10);

      // Keep only the most recent few — each holds a full document.
      const existing = Object.keys(window.localStorage)
        .filter((k) => k.startsWith(PREVIEW_PREFIX))
        .sort();
      for (const stale of existing.slice(0, Math.max(0, existing.length - (MAX_STORED - 1)))) {
        window.localStorage.removeItem(stale);
      }

      window.localStorage.setItem(PREVIEW_PREFIX + key, recommendation.html);
      window.open(`/preview?k=${key}`, "_blank", "noopener,noreferrer");
    } catch {
      // Storage blocked (private mode, quota). Fall back to the inline frame.
    }
  }

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 font-heading text-xs font-medium tracking-wide text-brand uppercase">
            Step 2 · Your generated homepage
          </p>
          <h2 className="font-heading text-h3-m font-bold text-ink sm:text-h4">
            Live preview
          </h2>
          <p className="mt-1 max-w-prose text-sm text-ink-soft">
            A real, working page — the menu, accordions and sliders all
            function. Click around inside it.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-0.5 rounded-lg bg-gray-100 p-0.5">
            {DEVICES.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDevice(d.id)}
                aria-pressed={device === d.id}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  device === d.id
                    ? "bg-white text-brand shadow-sm"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={copyHtml}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:border-brand hover:text-brand"
          >
            {copied ? "Copied ✓" : "Copy HTML"}
          </button>

          <button
            type="button"
            onClick={openInNewWindow}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-dark"
          >
            Open full screen
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M14 4h6v6M20 4l-8 8M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-gray-100 shadow-sm ring-1 ring-gray-200">
        {/* Browser chrome */}
        <div className="flex items-center gap-1.5 border-b border-black/5 bg-gray-100 px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-red-400" />
          <span className="size-2.5 rounded-full bg-amber-400" />
          <span className="size-2.5 rounded-full bg-emerald-500" />
          <span className="ml-3 truncate text-[11px] text-gray-400">
            {recommendation.brand.name.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com
          </span>
        </div>

        <div className="flex justify-center bg-gray-200/60 p-0 sm:p-4">
          <iframe
            key={`${device}-${recommendation.html.length}`}
            title={`${recommendation.brand.name} homepage preview`}
            srcDoc={recommendation.html}
            sandbox="allow-scripts"
            loading="lazy"
            className="h-180 border-0 bg-white transition-all sm:rounded-lg sm:shadow-lg"
            style={{ width: active.width, maxWidth: "100%" }}
          />
        </div>
      </div>

      <p className="mt-3 text-xs text-ink-soft">
        Scroll and click inside the frame, or open it full screen in a new tab.
        Photographs are placeholders from picsum.photos — a real build would use
        your own.
      </p>
    </section>
  );
}
