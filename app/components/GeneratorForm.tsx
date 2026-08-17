"use client";

import { useState } from "react";
import type { GenerateMode, GenerateResponse } from "@/lib/types";
import { STYLE_OPTIONS } from "@/lib/brief";
import BrandReadout from "./BrandReadout";
import HomepagePreview from "./HomepagePreview";
import SectionPlan from "./SectionPlan";

const EXAMPLES = ["stripe.com", "linear.app", "digitalfeet.com"];

const TABS: { id: GenerateMode; label: string; hint: string }[] = [
  {
    id: "url",
    label: "I have a website",
    hint: "We'll read your existing branding and rebuild around it.",
  },
  {
    id: "brief",
    label: "Starting from scratch",
    hint: "No site yet? Tell us about the business and we'll design one.",
  },
];

const inputClass =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-ink outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/25 disabled:bg-gray-50 disabled:text-gray-400";

export default function GeneratorForm() {
  const [mode, setMode] = useState<GenerateMode>("url");
  const [url, setUrl] = useState("");
  const [brief, setBrief] = useState({
    name: "",
    description: "",
    industry: "",
    audience: "",
    style: "",
    color: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);

  const canSubmit =
    mode === "url"
      ? url.trim().length > 0
      : brief.name.trim().length > 0 && brief.description.trim().length >= 20;

  function switchMode(next: GenerateMode) {
    if (next === mode || loading) return;
    setMode(next);
    setError(null);
  }

  function updateBrief(field: keyof typeof brief, value: string) {
    setBrief((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (loading || !canSubmit) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(mode === "url" ? { mode, url } : { mode, brief }),
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

  const activeTab = TABS.find((t) => t.id === mode)!;

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 sm:p-8">
        {/* Path picker */}
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
                  active
                    ? "bg-white text-brand shadow-sm"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <p className="mb-5 text-sm text-ink-soft">{activeTab.hint}</p>

        <form onSubmit={handleSubmit} noValidate>
          {mode === "url" ? (
            <>
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
                  className={`min-w-0 flex-1 ${inputClass}`}
                />
                <SubmitButton loading={loading} disabled={!canSubmit} />
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
            </>
          ) : (
            <>
              <h2 className="mb-2 font-heading text-h3-m font-bold text-ink">
                Tell us about your business
              </h2>
              <p className="mb-5 text-sm text-ink-soft">
                Two fields are required. The rest sharpen the result.
              </p>

              <div className="flex flex-col gap-4">
                <Field
                  id="brief-name"
                  label="Business name"
                  required
                  value={brief.name}
                  onChange={(v) => updateBrief("name", v)}
                  placeholder="Nordic Rail Consulting"
                  disabled={loading}
                />

                <div>
                  <label
                    htmlFor="brief-description"
                    className="mb-1.5 block text-sm font-semibold text-ink"
                  >
                    What do you do?{" "}
                    <span className="font-normal text-brand">required</span>
                  </label>
                  <textarea
                    id="brief-description"
                    rows={4}
                    value={brief.description}
                    onChange={(e) => updateBrief("description", e.target.value)}
                    placeholder="We help regional rail operators plan track maintenance so they cut unplanned downtime. We've run 40+ projects across Norway and Sweden."
                    disabled={loading}
                    className={`${inputClass} resize-y`}
                  />
                  <p className="mt-1 text-xs text-ink-soft">
                    {brief.description.trim().length < 20
                      ? "A sentence or two — what you sell and what makes you different."
                      : "Looks good."}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    id="brief-industry"
                    label="Industry"
                    value={brief.industry}
                    onChange={(v) => updateBrief("industry", v)}
                    placeholder="Rail infrastructure"
                    disabled={loading}
                  />
                  <Field
                    id="brief-audience"
                    label="Who is it for?"
                    value={brief.audience}
                    onChange={(v) => updateBrief("audience", v)}
                    placeholder="Operations managers at rail operators"
                    disabled={loading}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="brief-style"
                      className="mb-1.5 block text-sm font-semibold text-ink"
                    >
                      Style you want
                    </label>
                    <select
                      id="brief-style"
                      value={brief.style}
                      onChange={(e) => updateBrief("style", e.target.value)}
                      disabled={loading}
                      className={inputClass}
                    >
                      <option value="">No preference</option>
                      {STYLE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Field
                    id="brief-color"
                    label="Brand colour, if you have one"
                    value={brief.color}
                    onChange={(v) => updateBrief("color", v)}
                    placeholder="#1e1242 or 'deep navy'"
                    disabled={loading}
                  />
                </div>

                <div className="pt-1">
                  <SubmitButton loading={loading} disabled={!canSubmit} />
                </div>
              </div>
            </>
          )}
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

      {loading && <LoadingState mode={mode} />}

      {result && (
        <div className="df-fade-up flex flex-col gap-8">
          <BrandReadout
            mode={result.mode}
            brand={result.brand}
            recommendation={result.recommendation}
          />
          <HomepagePreview recommendation={result.recommendation} />
          <SectionPlan mode={result.mode} recommendation={result.recommendation} />
        </div>
      )}
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled,
  required = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled: boolean;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink">
        {label}{" "}
        {required && <span className="font-normal text-brand">required</span>}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={inputClass}
      />
    </div>
  );
}

function SubmitButton({
  loading,
  disabled,
}: {
  loading: boolean;
  disabled: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
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
          "Reading your brief",
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
