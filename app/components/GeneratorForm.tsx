"use client";

import { useRef, useState } from "react";
import type { GenerateMode, GenerateResponse } from "@/lib/types";
import type { Brief } from "@/lib/brief";
import { EMPTY_FACTS, hasAnyFact, type Facts } from "@/lib/facts";
import { REFINEMENTS, type RefineKey } from "@/lib/refine";
import { DEFAULT_SECTIONS } from "@/lib/sections";
import { BUSINESS_TYPES } from "@/lib/brief";
import BriefWizard from "./BriefWizard";
import BrandReadout from "./BrandReadout";
import DetailsPanel from "./DetailsPanel";
import GoalPicker from "./GoalPicker";
import LoadingState from "./LoadingState";
import HomepagePreview from "./HomepagePreview";
import SectionPicker from "./SectionPicker";
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
    hint: "Answer a few quick questions and we'll design your first one.",
  },
];

/**
 * What produced the current result, so a refine can re-send the same input.
 * Sections are snapshotted here rather than read live: retouching the picker
 * after a result shouldn't silently change what "Friendlier" regenerates.
 */
type LastRequest = { sections: string[]; goals: string[]; facts: Facts } & (
  | { mode: "url"; url: string }
  | { mode: "brief"; brief: Brief }
);

export default function GeneratorForm({ bookingUrl }: { bookingUrl: string }) {
  const [mode, setMode] = useState<GenerateMode>("url");
  const [url, setUrl] = useState("");
  // Shared across both tabs — these three questions are the same either way,
  // whether or not the client already has a site to scrape.
  const [sections, setSections] = useState<string[]>(DEFAULT_SECTIONS);
  const [goals, setGoals] = useState<string[]>([]);
  const [facts, setFacts] = useState<Facts>(EMPTY_FACTS);

  const [loading, setLoading] = useState(false);
  const [refining, setRefining] = useState<RefineKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  // What the loading screen shows while the request is in flight. Held in state
  // rather than read off lastRequest, which is a ref and wouldn't re-render.
  const [pending, setPending] = useState<{
    subject: string;
    industry: string;
    area: string;
  } | null>(null);

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
    setPending({
      subject: request.mode === "url" ? request.url : request.brief.name,
      industry:
        request.mode === "brief"
          ? (BUSINESS_TYPES.find((t) => t.id === request.brief.businessType)?.industry ?? "")
          : "",
      area: request.facts.area,
    });
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
      const common = {
        sections: request.sections,
        goals: request.goals,
        facts: request.facts,
        refine,
        avoidPrimary,
      };
      const body =
        request.mode === "url"
          ? { mode: "url", url: request.url, ...common }
          : { mode: "brief", brief: request.brief, ...common };

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
                if (url.trim()) run({ mode: "url", url, sections, goals, facts });
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

              {/* Not folded away. A scrape shows what the site has and never
                  what the business wants, and that gap is usually the reason
                  they're here — so this one question is worth the friction. */}
              <div className="mt-6 border-t border-gray-200 pt-5">
                <h3 className="font-heading text-sm font-bold text-ink">
                  What should the new homepage do?
                </h3>
                <p className="mt-0.5 mb-3 text-xs text-ink-soft">
                  We can read your branding, but not what you want out of a
                  redesign. Pick as many as you like.
                </p>
                <GoalPicker value={goals} onChange={setGoals} disabled={loading} />
              </div>

              {/* Folded away — the paste-and-go path stays intact for anyone
                  who just wants to see what the tool does. */}
              <details className="mt-4 rounded-xl border border-gray-200 bg-cream">
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-ink marker:content-none">
                  <span className="flex items-center justify-between gap-3">
                    <span>
                      Sections and your details{" "}
                      <span className="font-normal text-ink-soft">
                        {sections.length} sections
                        {hasAnyFact(facts) ? " · details added" : ""}
                      </span>
                    </span>
                    <span aria-hidden="true" className="text-ink-soft">
                      Edit
                    </span>
                  </span>
                </summary>
                <div className="flex flex-col gap-6 border-t border-gray-200 px-4 py-4">
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-ink">
                      Which sections should the page have?
                    </h4>
                    <SectionPicker
                      value={sections}
                      onChange={setSections}
                      disabled={loading}
                    />
                  </div>

                  <div className="border-t border-gray-200 pt-5">
                    <h4 className="mb-2 text-sm font-semibold text-ink">
                      Your contact details and credentials
                    </h4>
                    <DetailsPanel value={facts} onChange={setFacts} disabled={loading} />
                  </div>
                </div>
              </details>
            </form>
          </>
        ) : (
          <BriefWizard
            loading={loading}
            sections={sections}
            onSectionsChange={setSections}
            goals={goals}
            onGoalsChange={setGoals}
            facts={facts}
            onFactsChange={setFacts}
            onSubmit={(brief) => run({ mode: "brief", brief, sections, goals, facts })}
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

      {loading && !result && (
        <LoadingState
          mode={mode}
          subject={pending?.subject ?? ""}
          industry={pending?.industry}
          area={pending?.area}
        />
      )}

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
            brandName={result.recommendation.brand.name}
            context={{
              mode: result.mode,
              brandName: result.recommendation.brand.name,
              versionCount: versions.length,
              versionLabel: versions[activeIndex]?.label ?? "Original",
              goals,
              sections,
            }}
          />
          <SectionPlan mode={result.mode} recommendation={result.recommendation} />
        </div>
      )}
    </div>
  );
}

