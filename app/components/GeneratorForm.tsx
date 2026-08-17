"use client";

import { useRef, useState } from "react";
import type { GenerateMode, GenerateResponse } from "@/lib/types";
import type { Brief } from "@/lib/brief";
import { REFINEMENTS, type RefineKey } from "@/lib/refine";
import BriefWizard from "./BriefWizard";
import BrandReadout from "./BrandReadout";
import HomepagePreview from "./HomepagePreview";
import SectionPlan from "./SectionPlan";
import RefineBar from "./RefineBar";
import VersionBar, { type Version } from "./VersionBar";

/** Keeps memory bounded — each version carries a full HTML document. */
const MAX_VERSIONS = 10;

function versionLabel(refine: RefineKey | undefined, index: number): string {
  if (!refine) return "Original";
  if (refine === "regenerate") return `Fresh take ${index}`;
  return REFINEMENTS.find((r) => r.id === refine)?.label ?? `Version ${index}`;
}

const EXAMPLES = ["stripe.com", "linear.app", "digitalfeet.com"];

const TABS: { id: GenerateMode; label: string; hint: string }[] = [
  {
    id: "url",
    label: "I have a website",
    hint: "We'll read your existing branding and rebuild around it.",
  },
  {
    id: "brief",
    label: "I don't have one yet",
    hint: "Answer four quick questions and we'll design your first one.",
  },
];

/** What produced the current result, so a refine can re-send the same input. */
type LastRequest =
  | { mode: "url"; url: string }
  | { mode: "brief"; brief: Brief };

export default function GeneratorForm({ bookingUrl }: { bookingUrl: string }) {
  const [mode, setMode] = useState<GenerateMode>("url");
  const [url, setUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [refining, setRefining] = useState<RefineKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const lastRequest = useRef<LastRequest | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  const result: GenerateResponse | null = versions[activeIndex]?.result ?? null;

  async function run(
    request: LastRequest,
    refine?: RefineKey,
    avoidPrimary?: string,
  ) {
    if (loading) return;

    lastRequest.current = request;
    setLoading(true);
    setRefining(refine ?? null);
    setError(null);
    // A fresh submit starts a new set; a refine keeps the old design on screen
    // so the page doesn't collapse under the user mid-scroll.
    if (!refine) {
      setVersions([]);
      setActiveIndex(0);
    }

    try {
      const body =
        request.mode === "url"
          ? { mode: "url", url: request.url, refine, avoidPrimary }
          : { mode: "brief", brief: request.brief, refine, avoidPrimary };

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }

      // A refine appends to the set; a fresh submit starts a new one.
      const base = refine ? versions : [];
      const next: Version = {
        result: data as GenerateResponse,
        label: versionLabel(refine, base.length + 1),
      };

      const combined = [...base, next].slice(-MAX_VERSIONS);
      setVersions(combined);
      setActiveIndex(combined.length - 1);

      if (refine) {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
      setRefining(null);
    }
  }

  function handleRefine(key: RefineKey) {
    if (!lastRequest.current) return;
    run(lastRequest.current, key, result?.recommendation.palette.primary);
  }

  function switchMode(next: GenerateMode) {
    if (next === mode || loading) return;
    setMode(next);
    setError(null);
  }

  const activeTab = TABS.find((t) => t.id === mode)!;

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 sm:p-8">
        <div
          role="tablist"
          aria-label="How would you like to start?"
          className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1"
        >
          {TABS.map((tab) => {
            const active = tab.id === mode;
            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={active}
                disabled={loading}
                onClick={() => switchMode(tab.id)}
                className={`rounded-lg px-3 py-2.5 font-heading text-sm font-bold transition disabled:cursor-not-allowed ${
                  active ? "bg-white text-brand shadow-sm" : "text-ink-soft hover:text-ink"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {mode === "url" ? (
          <>
            <p className="mb-5 text-sm text-ink-soft">{activeTab.hint}</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (url.trim()) run({ mode: "url", url });
              }}
              noValidate
            >
              <label
                htmlFor="site-url"
                className="mb-2 block font-heading text-h3-m font-bold text-ink"
              >
                Your website URL
              </label>
              <p className="mb-4 text-sm text-ink-soft">
                Enter the homepage you want us to analyse. We&apos;ll read
                whatever is publicly visible.
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
          </>
        ) : (
          <BriefWizard
            loading={loading}
            onSubmit={(brief) => run({ mode: "brief", brief })}
          />
        )}

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

      {loading && !result && <LoadingState mode={mode} />}

      {result && (
        <div
          ref={resultsRef}
          className={`df-fade-up flex flex-col gap-8 transition-opacity ${
            loading ? "opacity-50" : ""
          }`}
        >
          <VersionBar
            versions={versions}
            activeIndex={activeIndex}
            disabled={loading}
            onSelect={setActiveIndex}
          />
          <BrandReadout
            mode={result.mode}
            brand={result.brand}
            recommendation={result.recommendation}
          />
          <HomepagePreview recommendation={result.recommendation} />
          <RefineBar
            loading={loading}
            pending={refining}
            versionCount={versions.length}
            onRefine={handleRefine}
            bookingUrl={bookingUrl}
          />
          <SectionPlan mode={result.mode} recommendation={result.recommendation} />
        </div>
      )}
    </div>
  );
}

function LoadingState({ mode }: { mode: GenerateMode }) {
  const steps =
    mode === "url"
      ? [
          "Fetching your homepage",
          "Reading colors and typefaces",
          "Choosing blocks and writing copy",
        ]
      : [
          "Reading your answers",
          "Designing a palette and type pairing",
          "Choosing blocks and writing copy",
        ];

  return (
    <section className="df-fade-up rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 sm:p-8">
      <h2 className="font-heading text-h3-m font-bold text-ink">
        {mode === "url" ? "Analysing your branding" : "Designing your homepage"}
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
