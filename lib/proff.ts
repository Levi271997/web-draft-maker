/**
 * SIMULATED company-register lookup.
 *
 * There is no Proff API call in this file. There is no network request of any
 * kind. It exists so the qualification step in the process diagram can be
 * demonstrated before the integration is built, and nothing more.
 *
 * TWO PROPERTIES THAT MAKE THIS SAFE TO SHIP AS A DEMO
 *
 * 1. It is display-only. The result is rendered in the loading screen and is
 *    never sent to the model, never stored, and never reaches the generated
 *    page. Fabricated registry data cannot leak into a client's homepage.
 *
 * 2. It is deterministic. The same input always produces the same match, so it
 *    doesn't flicker between renders and a demo can be repeated.
 *
 * WHEN THE REAL LOOKUP LANDS
 * Replace `simulateRegisterLookup` with a server-side call and return the same
 * shape. Worth checking Brønnøysundregistrene first — data.brreg.no publishes
 * name, org number, org form, registration date, NACE code and employee count
 * as a free, open, no-auth REST API, which is everything this shape holds.
 * Proff earns its fee on financials, credit scoring and Nordic coverage, none
 * of which the generator uses.
 *
 * Whoever does that work: delete SIMULATED_LOOKUP below, and the badge in the
 * loading screen disappears with it.
 */

/** Flipped to false by whoever wires up the real call. Drives the UI marker. */
export const SIMULATED_LOOKUP = true;

export type RegisterMatch = {
  name: string;
  orgNumber: string;
  orgForm: string;
  registered: string;
  employees: string;
  /** Only set when the client told us — never invented. */
  area: string;
  industry: string;
};

/** FNV-1a. Small, dependency-free, and stable across renders. */
function hash(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function pick<T>(options: T[], seed: number): T {
  return options[seed % options.length];
}

/** yourcompany.com -> Yourcompany. Good enough for a loading state. */
function nameFromUrl(url: string): string {
  const host = url
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0];

  const label = host.split(".")[0] || host;

  return label
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const ORG_FORMS = ["AS", "AS", "AS", "ENK"];
const EMPLOYEE_BANDS = ["1–4", "5–9", "10–19", "20–49"];

export function simulateRegisterLookup(input: {
  subject: string;
  /** From the brief's business type. Empty on the URL path. */
  industry?: string;
  /** From the details panel. Left empty rather than invented. */
  area?: string;
  isUrl: boolean;
}): RegisterMatch {
  const subject = input.subject.trim();
  const seed = hash(subject.toLowerCase() || "unknown");

  const orgForm = pick(ORG_FORMS, seed);
  const base = String(800_000_000 + (seed % 199_999_999));
  const orgNumber = `${base.slice(0, 3)} ${base.slice(3, 6)} ${base.slice(6, 9)}`;

  const name = input.isUrl ? nameFromUrl(subject) : subject;

  return {
    name: orgForm === "ENK" ? name : `${name} ${orgForm}`,
    orgNumber,
    orgForm,
    registered: String(1996 + ((seed >>> 7) % 26)),
    employees: pick(EMPLOYEE_BANDS, seed >>> 3),
    area: input.area?.trim() ?? "",
    industry: input.industry?.trim() ?? "",
  };
}
