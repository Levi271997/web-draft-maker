"use client";

import { useState } from "react";
import type { Recommendation } from "@/lib/types";

/**
 * The generated page is a complete HTML document written by the model, so it
 * renders in an iframe rather than as React components.
 *
 * `sandbox=""` applies every restriction: no scripts, no forms, no same-origin
 * access. The page is generated CSS-only, so nothing is lost, and nothing the
 * model wrote can touch this app.
 */

const DEVICES = [
  { id: "desktop", label: "Desktop", width: "100%" },
  { id: "mobile", label: "Mobile", width: "390px" },
] as const;

type DeviceId = (typeof DEVICES)[number]["id"];

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
            A real, self-contained page written for this brand — not assembled
            from a template.
          </p>
        </div>

        <div className="flex items-center gap-2">
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
            sandbox=""
            loading="lazy"
            className="h-180 border-0 bg-white transition-all sm:rounded-lg sm:shadow-lg"
            style={{ width: active.width, maxWidth: "100%" }}
          />
        </div>
      </div>

      <p className="mt-3 text-xs text-ink-soft">
        Scroll inside the frame to see the whole page. Imagery is drawn with CSS
        and SVG, so a real build would swap in your own photography.
      </p>
    </section>
  );
}
