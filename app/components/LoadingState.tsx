"use client";

import { useEffect, useMemo, useState } from "react";
import { SIMULATED_LOOKUP, simulateRegisterLookup } from "@/lib/proff";

/**
 * The wait, staged.
 *
 * The request takes 30-60 seconds and reports no progress, so the sequence here
 * is driven by timers rather than by anything real. The verification steps
 * complete on a schedule; the generation steps below simply spin until the
 * response lands, which is honest — we genuinely don't know how far along it is.
 *
 * The register match is a SIMULATION. See lib/proff: it never leaves this
 * component, and the badge below says so out loud for as long as that is true.
 */

type Stage = { id: string; label: string; ms: number };

const GENERATION_STEPS = [
  "Reading colours, typefaces and photography",
  "Choosing blocks and writing copy",
];

export default function LoadingState({
  subject,
  area,
}: {
  /** The URL they entered. */
  subject: string;
  area?: string;
}) {

  const stages: Stage[] = useMemo(
    () => [
      {
        id: "connect",
        label: "Connecting to the company register",
        ms: 900,
      },
      {
        id: "match",
        label: `Matching ${subject || "your website"} to a registered company`,
        ms: 1400,
      },
      {
        id: "verify",
        label: "Confirming the company is active",
        ms: 1100,
      },
    ],
    [subject],
  );

  const match = useMemo(
    () => simulateRegisterLookup({ subject, area }),
    [subject, area],
  );

  const [done, setDone] = useState(0);

  useEffect(() => {
    setDone(0);

    const timers: ReturnType<typeof setTimeout>[] = [];
    let elapsed = 0;

    stages.forEach((stage, index) => {
      elapsed += stage.ms;
      timers.push(setTimeout(() => setDone(index + 1), elapsed));
    });

    return () => timers.forEach(clearTimeout);
  }, [stages]);

  const verified = done >= stages.length;

  return (
    <section className="df-fade-up rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 sm:p-8">
      <h2 className="font-heading text-h3-m font-bold text-ink">
        {verified ? "Analysing your branding" : "Verifying your business"}
      </h2>

      {/* ---------------- Verification ---------------- */}
      <ul className="mt-4 flex flex-col gap-3">
        {stages.map((stage, index) => {
          const complete = done > index;
          const active = done === index;

          return (
            <li
              key={stage.id}
              className={`flex items-center gap-3 text-sm transition-opacity ${
                complete || active ? "text-ink-soft opacity-100" : "text-ink-soft opacity-40"
              }`}
            >
              {complete ? (
                <span
                  aria-hidden="true"
                  className="flex size-3.5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white"
                >
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
                    <path
                      d="m5 13 4 4L19 7"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              ) : (
                <span
                  aria-hidden="true"
                  className={`size-3.5 shrink-0 rounded-full border-2 ${
                    active
                      ? "df-spin border-brand/25 border-t-brand"
                      : "border-gray-200"
                  }`}
                />
              )}
              {stage.label}
            </li>
          );
        })}
      </ul>

      {/* ---------------- The match ---------------- */}
      {verified && (
        <div className="df-fade-up mt-5 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
              Match found
            </span>
            <span className="font-heading text-sm font-bold text-ink">{match.name}</span>
          </div>

          <dl className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-ink-soft">
            <div className="flex gap-1.5">
              <dt className="font-semibold text-ink">Org.</dt>
              <dd>{match.orgNumber}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="font-semibold text-ink">Registered</dt>
              <dd>{match.registered}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="font-semibold text-ink">Employees</dt>
              <dd>{match.employees}</dd>
            </div>
            {match.area && (
              <div className="flex gap-1.5">
                <dt className="font-semibold text-ink">Area</dt>
                <dd>{match.area}</dd>
              </div>
            )}
          </dl>

          {SIMULATED_LOOKUP && (
            <p className="mt-3 border-t border-emerald-200 pt-2.5 text-[11px] text-ink-soft">
              <span className="font-semibold">Simulated.</span> No register was
              contacted and these details are placeholders for the flow — they
              are not used to build your page.
            </p>
          )}
        </div>
      )}

      {/* ---------------- Generation ---------------- */}
      {verified && (
        <ul className="df-fade-up mt-5 flex flex-col gap-3 border-t border-gray-100 pt-5">
          {GENERATION_STEPS.map((step) => (
            <li key={step} className="flex items-center gap-3 text-sm text-ink-soft">
              <span
                aria-hidden="true"
                className="df-spin size-3.5 shrink-0 rounded-full border-2 border-brand/25 border-t-brand"
              />
              {step}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div className="gradient-brand h-full w-1/3 rounded-full" />
      </div>

      <p className="mt-3 text-xs text-ink-soft">
        This usually takes under a minute. Please keep the page open.
      </p>
    </section>
  );
}
