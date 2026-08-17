"use client";

import type { GenerateResponse } from "@/lib/types";

export type Version = {
  result: GenerateResponse;
  /** What produced it — "Original", "Friendlier", "Fresh take"… */
  label: string;
};

/**
 * Every generation is kept, because free-form output varies run to run and a
 * client who asks to see another design frequently prefers the first one.
 * Without this, regenerating destroys the version they were about to pick.
 */
export default function VersionBar({
  versions,
  activeIndex,
  disabled,
  onSelect,
}: {
  versions: Version[];
  activeIndex: number;
  disabled: boolean;
  onSelect: (index: number) => void;
}) {
  if (versions.length < 2) return null;

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200 sm:px-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div>
          <p className="font-heading text-sm font-bold text-ink">
            Your designs
          </p>
          <p className="text-xs text-ink-soft">
            Nothing is lost — switch back any time.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {versions.map((version, index) => {
            const active = index === activeIndex;
            return (
              <button
                key={index}
                type="button"
                disabled={disabled}
                onClick={() => onSelect(index)}
                aria-current={active ? "true" : undefined}
                className={`flex items-center gap-2 rounded-full border-2 py-1.5 pr-4 pl-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                  active
                    ? "border-brand bg-brand/5 text-brand"
                    : "border-gray-200 text-ink-soft hover:border-gray-300 hover:text-ink"
                }`}
              >
                <span
                  className="flex size-6 items-center justify-center rounded-full text-[11px]"
                  style={{
                    backgroundColor: version.result.recommendation.palette.primary,
                    color: version.result.recommendation.palette.surface,
                  }}
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                {version.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
