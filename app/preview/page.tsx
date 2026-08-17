"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export const PREVIEW_PREFIX = "df-preview-";

/**
 * Full-window view of a generated page.
 *
 * The document still renders inside an iframe, but one sandboxed with
 * `allow-scripts` and WITHOUT `allow-same-origin` — so the page gets a unique
 * opaque origin. Its JavaScript runs, which is the point, but it cannot read
 * this app's storage, cookies or DOM. Writing model-authored HTML directly into
 * a same-origin window would hand it our origin, so we never do that.
 */
function PreviewInner() {
  const params = useSearchParams();
  const key = params.get("k");

  const [html, setHtml] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!key) {
      setMissing(true);
      return;
    }
    try {
      const stored = window.localStorage.getItem(PREVIEW_PREFIX + key);
      if (stored) setHtml(stored);
      else setMissing(true);
    } catch {
      setMissing(true);
    }
  }, [key]);

  if (missing) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream px-6">
        <div className="max-w-md text-center">
          <p className="font-heading text-sm font-medium tracking-wide text-brand uppercase">
            Digitalfeet
          </p>
          <h1 className="mt-2 font-heading text-h1-m font-bold text-ink">
            This preview has expired
          </h1>
          <p className="mt-3 text-base text-ink-soft">
            Previews are held in this browser only. Go back to the generator and
            open it again from the design you want to see.
          </p>
          <a
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 font-heading text-base font-bold text-white transition hover:bg-brand-dark"
          >
            ← Back to the generator
          </a>
        </div>
      </main>
    );
  }

  if (!html) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream">
        <span
          aria-label="Loading preview"
          className="df-spin size-8 rounded-full border-3 border-brand/25 border-t-brand"
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <iframe
        title="Generated homepage"
        srcDoc={html}
        sandbox="allow-scripts"
        className="h-screen w-screen border-0"
      />
    </main>
  );
}

export default function PreviewPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-cream">
          <span
            aria-label="Loading preview"
            className="df-spin size-8 rounded-full border-3 border-brand/25 border-t-brand"
          />
        </main>
      }
    >
      <PreviewInner />
    </Suspense>
  );
}
