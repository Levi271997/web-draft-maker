"use client";

import { SECTION_CHOICES, normalizeSections } from "@/lib/sections";

/**
 * Shared by both routes in, because "what should the page have on it" is the
 * same question whether or not they already own a website.
 *
 * Header, hero and footer render ticked and locked: a homepage without them
 * isn't a homepage, and offering the choice only invites a broken page.
 */
export default function SectionPicker({
  value,
  onChange,
  disabled,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  function toggle(id: string) {
    const choice = SECTION_CHOICES.find((s) => s.id === id);
    if (!choice || choice.required) return;

    onChange(
      normalizeSections(
        value.includes(id) ? value.filter((v) => v !== id) : [...value, id],
      ),
    );
  }

  const optional = SECTION_CHOICES.filter((s) => !s.required);
  const chosen = optional.filter((s) => value.includes(s.id)).length;

  return (
    <div>
      <div className="grid gap-2 sm:grid-cols-2">
        {SECTION_CHOICES.map((section) => {
          const locked = Boolean(section.required);
          const active = locked || value.includes(section.id);

          return (
            <button
              key={section.id}
              type="button"
              disabled={disabled || locked}
              onClick={() => toggle(section.id)}
              aria-pressed={active}
              className={`flex items-start gap-3 rounded-xl border-2 px-3.5 py-3 text-left transition ${
                active ? "border-brand bg-brand/5" : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
              } ${locked ? "cursor-default opacity-90" : ""} ${
                disabled && !locked ? "cursor-not-allowed opacity-50" : ""
              }`}
            >
              <span
                aria-hidden="true"
                className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-2 ${
                  active ? "border-brand bg-brand text-white" : "border-gray-300"
                }`}
              >
                {active && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path
                      d="m5 13 4 4L19 7"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>

              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-semibold text-ink">{section.label}</span>
                  {locked && (
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-ink-soft uppercase">
                      Always on
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-xs text-ink-soft">{section.hint}</span>
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-ink-soft">
        {chosen} of {optional.length} optional sections chosen. They&apos;ll be
        built in the order shown — we&apos;ll write what goes in each one.
      </p>
    </div>
  );
}
