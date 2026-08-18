/**
 * What the client wants the page to achieve.
 *
 * Asked on both routes in, because a scrape reveals what a business *has* and
 * never what it *wants* — and the gap between those two is usually the reason
 * someone is looking at a redesign at all. Without it the URL path faithfully
 * rebuilds the status quo, prettier.
 *
 * A non-technical client answers this instantly and correctly, and it maps
 * straight onto emphasis and block weighting, which the model would otherwise
 * be guessing at.
 */

export type Goal = {
  id: string;
  label: string;
  hint: string;
  /** What the page must therefore do — stated as intent, not as a template. */
  demands: string;
};

export const GOALS: Goal[] = [
  {
    id: "calls",
    label: "Get phone calls",
    hint: "People ring you to get started",
    demands:
      "the phone number must be impossible to miss — in the header, repeated mid-page, and in a closing call to action",
  },
  {
    id: "bookings",
    label: "Take bookings",
    hint: "Appointments, tables or jobs booked in",
    demands:
      "a prominent booking or enquiry form, plus a short explanation of what happens after they book",
  },
  {
    id: "sell",
    label: "Sell online",
    hint: "Products or packages bought on the site",
    demands:
      "clearly priced products or packages with what each includes, and an obvious buying action",
  },
  {
    id: "showcase",
    label: "Show my work",
    hint: "Photos of past jobs, projects or results",
    demands:
      "a strong visual gallery or case-study section carrying real weight on the page, backed by customer proof",
  },
  {
    id: "explain",
    label: "Explain my services",
    hint: "Make it clear what you do and for whom",
    demands:
      "a clear breakdown of services and who each is for, written so a first-time visitor understands immediately",
  },
  {
    id: "google",
    label: "Be found on Google",
    hint: "Get discovered by people searching",
    demands:
      "substantial descriptive text, location and service keywords used naturally, and an answers/FAQ section",
  },
];

const ORDER = new Map(GOALS.map((g, i) => [g.id, i]));

/** Ids only, deduplicated, in canonical order. Empty is valid on the URL path. */
export function parseGoals(input: unknown): string[] {
  if (!Array.isArray(input)) return [];

  const ids = new Set(
    input
      .filter((v): v is string => typeof v === "string")
      .filter((v) => ORDER.has(v)),
  );

  return [...ids].sort((a, b) => (ORDER.get(a) ?? 0) - (ORDER.get(b) ?? 0));
}

export function goalsToPrompt(ids: string[]): string {
  const chosen = parseGoals(ids)
    .map((id) => GOALS.find((g) => g.id === id))
    .filter((g): g is Goal => Boolean(g));

  if (chosen.length === 0) return "";

  return [
    "WHAT THE CLIENT WANTS THIS PAGE TO ACHIEVE — this decides what gets weight, what goes above the fold, and what every call to action points at:",
    ...chosen.map((g) => `- ${g.label}: so ${g.demands}.`),
  ].join("\n");
}
