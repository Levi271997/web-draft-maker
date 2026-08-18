"use client";

import { GOALS } from "@/lib/goals";

/**
 * Lifted out of the wizard so both routes in ask the same question. It was the
 * one high-value answer the URL path never collected.
 */
export default function GoalPicker({
  value,
  onChange,
  disabled,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  }

  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {GOALS.map((goal) => {
        const active = value.includes(goal.id);
        return (
          <button
            key={goal.id}
            type="button"
            disabled={disabled}
            onClick={() => toggle(goal.id)}
            aria-pressed={active}
            className={`flex items-start gap-3 rounded-xl border-2 px-4 py-3.5 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
              active
                ? "border-brand bg-brand/5"
                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
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
            <span>
              <span className="block text-sm font-semibold text-ink">{goal.label}</span>
              <span className="block text-xs text-ink-soft">{goal.hint}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
