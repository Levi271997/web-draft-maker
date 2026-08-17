"use client";

import { useState } from "react";
import type { GenerateResponse } from "@/lib/types";
import BrandReadout from "./BrandReadout";
import HomepagePreview from "./HomepagePreview";
import SectionPlan from "./SectionPlan";

const EXAMPLES = ["stripe.com", "linear.app", "digitalfeet.com"];

export default function GeneratorForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }

      setResult(data as GenerateResponse);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 sm:p-8">
        <form onSubmit={handleSubmit} noValidate>
          <label
            htmlFor="site-url"
            className="mb-2 block font-heading text-h3-m font-bold text-ink"
          >
            Your website URL
          </label>
          <p className="mb-4 text-sm text-ink-soft">
            Enter the homepage you want us to analyse. We&apos;ll read whatever is
            publicly visible.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="site-url"
              type="text"
              inputMode="url"
              autoComplete="url"
              spellCheck={false}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="yourcompany.com"
              disabled={loading}
              aria-describedby={error ? "form-error" : undefined}
              className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-ink outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/25 disabled:bg-gray-50 disabled:text-gray-400"
            />

            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 font-heading text-base font-bold text-white shadow-sm transition hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55"
            >
              {loading && (
                <span
                  aria-hidden="true"
                  className="df-spin size-4 rounded-full border-2 border-white/40 border-t-white"
                />
              )}
              {loading ? "Generating…" : "Create Homepage"}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-ink-soft">Try:</span>
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                disabled={loading}
                onClick={() => setUrl(example)}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-ink-soft transition hover:bg-gray-200 hover:text-ink disabled:opacity-50"
              >
                {example}
              </button>
            ))}
          </div>
        </form>

        {error && (
          <p
            id="form-error"
            role="alert"
            className="df-fade-up mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}
      </section>

      {loading && <LoadingState />}

      {result && (
        <div className="df-fade-up flex flex-col gap-8">
          <BrandReadout brand={result.brand} recommendation={result.recommendation} />
          <HomepagePreview recommendation={result.recommendation} />
          <SectionPlan recommendation={result.recommendation} />
        </div>
      )}
    </div>
  );
}

function LoadingState() {
  const steps = [
    "Fetching your homepage",
    "Reading colors and typefaces",
    "Drafting your homepage",
  ];

  return (
    <section className="df-fade-up rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 sm:p-8">
      <h2 className="font-heading text-h3-m font-bold text-ink">
        Analysing your branding
      </h2>
      <ul className="mt-4 flex flex-col gap-3">
        {steps.map((step) => (
          <li key={step} className="flex items-center gap-3 text-sm text-ink-soft">
            <span
              aria-hidden="true"
              className="df-spin size-3.5 shrink-0 rounded-full border-2 border-brand/25 border-t-brand"
            />
            {step}
          </li>
        ))}
      </ul>
      <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div className="gradient-brand h-full w-1/3 rounded-full" />
      </div>
      <p className="mt-3 text-xs text-ink-soft">
        This usually takes 10–30 seconds.
      </p>
    </section>
  );
}
