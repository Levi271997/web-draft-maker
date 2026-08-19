/**
 * The point the funnel converts.
 *
 * Everything before this is anonymous and free. A lead is only created when
 * someone states intent by handing over contact details — not on every
 * generation, which would fill the pipeline with people who typed a URL once.
 *
 * The context block is the part worth having. Which design they settled on,
 * how many they went through, and what they said they wanted tells whoever
 * takes the call more than any form field does.
 */

export type LeadContext = {
  mode: string;
  brandName: string;
  /** How many designs they generated before asking to talk. */
  versionCount: number;
  /** Which one they were looking at when they asked. */
  versionLabel: string;
  goals: string[];
  sections: string[];
};

export type Lead = {
  name: string;
  email: string;
  notes: string;
  consent: boolean;
  context: LeadContext;
};

const LIMITS = {
  name: 120,
  email: 200,
  notes: 1000,
  label: 60,
  brand: 120,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanList(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim().slice(0, 40))
    .filter(Boolean)
    .slice(0, max);
}

/** Throws with a user-facing message. Same contract as parseBrief. */
export function parseLead(input: unknown): Lead {
  const raw = (input ?? {}) as Record<string, unknown>;
  const context = (raw.context ?? {}) as Record<string, unknown>;

  const lead: Lead = {
    name: clean(raw.name, LIMITS.name),
    email: clean(raw.email, LIMITS.email).toLowerCase(),
    notes: clean(raw.notes, LIMITS.notes),
    consent: raw.consent === true,
    context: {
      mode: context.mode === "brief" ? "brief" : "url",
      brandName: clean(context.brandName, LIMITS.brand),
      versionCount:
        typeof context.versionCount === "number" && Number.isFinite(context.versionCount)
          ? Math.max(0, Math.min(99, Math.round(context.versionCount)))
          : 0,
      versionLabel: clean(context.versionLabel, LIMITS.label),
      goals: cleanList(context.goals, 10),
      sections: cleanList(context.sections, 20),
    },
  };

  if (!lead.name) throw new Error("Please enter your name.");
  if (!EMAIL_RE.test(lead.email)) throw new Error("Please enter a valid email address.");
  if (!lead.consent) {
    throw new Error("Please tick the box to say how we can use your details.");
  }

  return lead;
}
