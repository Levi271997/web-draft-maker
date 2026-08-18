"use client";

import { useCallback, useMemo, useState } from "react";
import {
  BUSINESS_TYPES,
  COLOR_CHOICES,
  STYLE_PRESETS,
  type Brief,
} from "@/lib/brief";
import type { Facts } from "@/lib/facts";
import { getSection } from "@/lib/sections";
import DetailsPanel from "./DetailsPanel";
import GoalPicker from "./GoalPicker";
import SectionPicker from "./SectionPicker";

/**
 * Six guided steps for a client who has never had a website. Nearly every
 * question is answered by pointing at something, and the free-text fields
 * either arrive pre-filled or are explicitly optional, so nobody meets a blank
 * box they feel obliged to fill.
 */

const STEPS = [
  { title: "What kind of business is it?", sub: "Pick the closest one." },
  { title: "What's it called?", sub: "And one line on what you do." },
  { title: "What should the website do?", sub: "Choose as many as you like." },
  {
    title: "What should be on the page?",
    sub: "We've ticked the usual ones — add or remove any.",
  },
  {
    title: "How do people reach you?",
    sub: "Anything you skip, we leave off the page rather than making it up.",
  },
  { title: "Which of these feels like you?", sub: "Just go with your gut." },
];

/** Where the picker lives — also where the summary strip jumps to. */
const SECTION_STEP = 3;

const EMPTY: Brief = {
  businessType: "",
  name: "",
  description: "",
  sourceUrl: "",
  style: "",
  color: "",
  extra: "",
};

export default function BriefWizard({
  loading,
  sections,
  onSectionsChange,
  goals,
  onGoalsChange,
  facts,
  onFactsChange,
  onSubmit,
}: {
  loading: boolean;
  /** All three are lifted to the parent so answers survive a switch of tabs. */
  sections: string[];
  onSectionsChange: (next: string[]) => void;
  goals: string[];
  onGoalsChange: (next: string[]) => void;
  facts: Facts;
  onFactsChange: (next: Facts) => void;
  onSubmit: (brief: Brief) => void;
}) {
  const [step, setStep] = useState(0);
  const [brief, setBrief] = useState<Brief>(EMPTY);
  // Tracks whether the user edited the pre-filled line, so switching business
  // type doesn't silently overwrite something they wrote.
  const [touchedDescription, setTouchedDescription] = useState(false);
  // Set when the picker is opened from the summary strip, so it behaves as a
  // detour and drops them back where they were rather than mid-sequence.
  const [returnStep, setReturnStep] = useState<number | null>(null);

  const stepValid = useCallback(
    (index: number) => {
      if (index === 0) return brief.businessType !== "";
      if (index === 1) return brief.name.trim() !== "" && brief.description.trim().length >= 20;
      if (index === 2) return goals.length > 0;
      return true;
    },
    [brief, goals],
  );

  const canAdvance = useMemo(() => stepValid(step), [stepValid, step]);
  const detouring = step === SECTION_STEP && returnStep !== null;

  function set<K extends keyof Brief>(key: K, value: Brief[K]) {
    setBrief((prev) => ({ ...prev, [key]: value }));
  }

  function chooseType(id: string) {
    const type = BUSINESS_TYPES.find((t) => t.id === id);
    setBrief((prev) => ({
      ...prev,
      businessType: id,
      description:
        touchedDescription || !type?.example ? prev.description : type.example,
    }));
    // Choosing is a decision — move them straight on.
    setStep(1);
  }

  function editSections() {
    setReturnStep(step);
    setStep(SECTION_STEP);
  }

  function endDetour() {
    setStep(returnStep ?? SECTION_STEP);
    setReturnStep(null);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (detouring) {
      endDetour();
      return;
    }

    if (step < STEPS.length - 1) {
      if (canAdvance) setStep(step + 1);
      return;
    }

    // Backstop. Nothing in the normal sequence can reach the end with a step
    // unanswered, but a detour makes forward jumps possible — so send them to
    // the first gap instead of posting a brief the server will reject.
    const missing = [0, 1, 2].find((index) => !stepValid(index));
    if (missing !== undefined) {
      setStep(missing);
      return;
    }

    onSubmit(brief);
  }

  const isLast = step === STEPS.length - 1;

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Progress */}
      <div className="mb-5 flex items-center gap-3">
        <div className="flex gap-1.5" aria-hidden="true">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-6 bg-brand" : i < step ? "w-1.5 bg-brand" : "w-1.5 bg-gray-300"
              }`}
            />
          ))}
        </div>
        <span className="text-xs font-medium text-ink-soft">
          Step {step + 1} of {STEPS.length}
        </span>
      </div>

      <h2 className="font-heading text-h3-m font-bold text-ink">
        {STEPS[step].title}
      </h2>
      <p className="mt-1 mb-5 text-sm text-ink-soft">{STEPS[step].sub}</p>

      {/* ---------------- Step 1: business type ---------------- */}
      {step === 0 && (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {BUSINESS_TYPES.map((type) => {
            const active = brief.businessType === type.id;
            return (
              <button
                key={type.id}
                type="button"
                disabled={loading}
                onClick={() => chooseType(type.id)}
                aria-pressed={active}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 px-3 py-4 text-center transition ${
                  active
                    ? "border-brand bg-brand/5"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <span className="text-2xl" aria-hidden="true">
                  {type.icon}
                </span>
                <span className="text-xs font-semibold text-ink">{type.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ---------------- Step 2: name + one line ---------------- */}
      {step === 1 && (
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="w-name" className="mb-1.5 block text-sm font-semibold text-ink">
              Business name
            </label>
            <input
              id="w-name"
              type="text"
              value={brief.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Bergen Boiler Care"
              disabled={loading}
              autoFocus
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-ink outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/25"
            />
          </div>

          <div>
            <label htmlFor="w-desc" className="mb-1.5 block text-sm font-semibold text-ink">
              In one line, what do you do for customers?
            </label>
            <textarea
              id="w-desc"
              rows={3}
              value={brief.description}
              onChange={(e) => {
                setTouchedDescription(true);
                set("description", e.target.value);
              }}
              disabled={loading}
              className="w-full resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-ink outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/25"
            />
            <p className="mt-1.5 text-xs text-ink-soft">
              We&apos;ve written a starting point — change it to match your
              business. Say it how you&apos;d say it to a customer.
            </p>
          </div>

          <div className="rounded-xl bg-cream p-4">
            <label htmlFor="w-source" className="mb-1.5 block text-sm font-semibold text-ink">
              Got a Facebook page or online listing?{" "}
              <span className="font-normal text-ink-soft">optional</span>
            </label>
            <input
              id="w-source"
              type="text"
              inputMode="url"
              value={brief.sourceUrl}
              onChange={(e) => set("sourceUrl", e.target.value)}
              placeholder="facebook.com/yourbusiness"
              disabled={loading}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/25"
            />
            <p className="mt-1.5 text-xs text-ink-soft">
              Paste it and we&apos;ll pull in whatever we can read. If it&apos;s
              private we&apos;ll just skip it — nothing breaks.
            </p>
          </div>
        </div>
      )}

      {/* ---------------- Step 3: goals ---------------- */}
      {step === 2 && (
        <GoalPicker value={goals} onChange={onGoalsChange} disabled={loading} />
      )}

      {/* ---------------- Step 4: sections ---------------- */}
      {step === SECTION_STEP && (
        <SectionPicker
          value={sections}
          onChange={onSectionsChange}
          disabled={loading}
        />
      )}

      {/* ---------------- Step 5: contact details and credentials ---------------- */}
      {step === 4 && (
        <DetailsPanel value={facts} onChange={onFactsChange} disabled={loading} />
      )}

      {/* ---------------- Step 6: look and feel ---------------- */}
      {step === 5 && (
        <div className="flex flex-col gap-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {STYLE_PRESETS.map((preset) => {
              const active = brief.style === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  disabled={loading}
                  onClick={() => set("style", active ? "" : preset.id)}
                  aria-pressed={active}
                  className={`overflow-hidden rounded-xl border-2 text-left transition ${
                    active ? "border-brand" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <StyleThumb preset={preset} />
                  <span className="block bg-white px-3 py-2.5">
                    <span className="block text-sm font-semibold text-ink">
                      {preset.label}
                    </span>
                    <span className="block text-xs text-ink-soft">{preset.feel}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-ink">
              Any colour you&apos;d like us to use?{" "}
              <span className="font-normal text-ink-soft">optional</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {COLOR_CHOICES.map((choice) => {
                const active = brief.color === choice.id;
                return (
                  <button
                    key={choice.id}
                    type="button"
                    disabled={loading}
                    onClick={() => set("color", active ? "" : choice.id)}
                    aria-pressed={active}
                    className={`flex items-center gap-2 rounded-full border-2 py-1 pr-3 pl-1 text-xs font-medium transition ${
                      active ? "border-brand text-ink" : "border-gray-200 text-ink-soft hover:border-gray-300"
                    }`}
                  >
                    <span
                      className="size-6 rounded-full ring-1 ring-black/10"
                      style={{ backgroundColor: choice.hex }}
                    />
                    {choice.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="w-extra" className="mb-1.5 block text-sm font-semibold text-ink">
              Anything else we should know?{" "}
              <span className="font-normal text-ink-soft">optional</span>
            </label>
            <textarea
              id="w-extra"
              rows={2}
              value={brief.extra}
              onChange={(e) => set("extra", e.target.value)}
              placeholder="e.g. we're the only certified installer in the county"
              disabled={loading}
              className="w-full resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/25"
            />
          </div>
        </div>
      )}

      {/* Sits above the controls, so it's on the path of every step rather than
          only visible to someone who happens to reach step 4. */}
      {step !== SECTION_STEP && (
        <SectionSummary sections={sections} disabled={loading} onEdit={editSections} />
      )}

      {/* ---------------- Controls ---------------- */}
      <div className="mt-6 flex items-center justify-between gap-3">
        {step > 0 ? (
          <button
            type="button"
            disabled={loading}
            onClick={() => (detouring ? endDetour() : setStep(step - 1))}
            className="rounded-xl px-4 py-3 text-sm font-semibold text-ink-soft transition hover:text-ink disabled:opacity-50"
          >
            ← Back
          </button>
        ) : (
          <span />
        )}

        <button
          type="submit"
          disabled={loading || !canAdvance}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 font-heading text-base font-bold text-white shadow-sm transition hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55"
        >
          {loading && (
            <span
              aria-hidden="true"
              className="df-spin size-4 rounded-full border-2 border-white/40 border-t-white"
            />
          )}
          {loading
            ? "Generating…"
            : detouring
              ? "Done"
              : isLast
                ? "Create Homepage"
                : "Next →"}
        </button>
      </div>
    </form>
  );
}

/**
 * Keeps the page structure on screen throughout the wizard. Without it the
 * section choice is invisible until step 4, and a client who looks for it on
 * step 1 concludes the option doesn't exist.
 */
function SectionSummary({
  sections,
  disabled,
  onEdit,
}: {
  sections: string[];
  disabled: boolean;
  onEdit: () => void;
}) {
  const labels = sections
    .map((id) => getSection(id)?.label)
    .filter((label): label is string => Boolean(label));

  const shown = labels.slice(0, 4);
  const rest = labels.length - shown.length;

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-cream px-4 py-3">
      <p className="min-w-0 text-xs text-ink-soft">
        <span className="font-semibold text-ink">Your page will have: </span>
        {shown.join(" · ")}
        {rest > 0 && ` · +${rest} more`}
      </p>

      <button
        type="button"
        onClick={onEdit}
        disabled={disabled}
        className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
      >
        Change sections
      </button>
    </div>
  );
}

/** A tiny rendered page, so the choice is visual rather than an adjective. */
function StyleThumb({ preset }: { preset: (typeof STYLE_PRESETS)[number] }) {
  const { swatch, serif } = preset;
  return (
    <span
      className="block px-3 py-3"
      style={{ backgroundColor: swatch.bg }}
      aria-hidden="true"
    >
      <span className="mb-2 flex items-center justify-between">
        <span
          className="block h-1.5 w-8 rounded-full"
          style={{ backgroundColor: swatch.primary }}
        />
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="block h-1 w-3 rounded-full"
              style={{ backgroundColor: `${swatch.text}40` }}
            />
          ))}
        </span>
      </span>
      <span
        className="block text-[13px] leading-tight font-bold"
        style={{
          color: swatch.text,
          fontFamily: serif ? "Georgia, serif" : "system-ui, sans-serif",
        }}
      >
        Grow your business
      </span>
      <span
        className="mt-1 block h-1 w-full rounded-full"
        style={{ backgroundColor: `${swatch.text}26` }}
      />
      <span
        className="mt-1 block h-1 w-2/3 rounded-full"
        style={{ backgroundColor: `${swatch.text}26` }}
      />
      <span className="mt-2.5 flex gap-1.5">
        <span
          className="block h-4 w-12 rounded"
          style={{ backgroundColor: swatch.primary }}
        />
        <span
          className="block h-4 w-10 rounded border"
          style={{ borderColor: swatch.primary }}
        />
      </span>
      <span className="mt-2.5 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="block h-5 flex-1 rounded"
            style={{ backgroundColor: `${swatch.accent}2e` }}
          />
        ))}
      </span>
    </span>
  );
}
