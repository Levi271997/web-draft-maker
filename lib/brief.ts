/**
 * The "no website yet" path. Instead of scraping branding signals, we collect
 * the minimum a designer would ask for in a first call and hand that to the
 * same generator.
 */

export const STYLE_OPTIONS = [
  "Modern & minimal",
  "Bold & energetic",
  "Warm & approachable",
  "Classic & trustworthy",
  "Technical & precise",
] as const;

export type StylePreference = (typeof STYLE_OPTIONS)[number];

export type Brief = {
  name: string;
  description: string;
  industry: string;
  audience: string;
  style: string;
  color: string;
};

const LIMITS = {
  name: 80,
  description: 1200,
  industry: 80,
  audience: 160,
  style: 60,
  color: 40,
};

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/** Throws with a user-facing message when the required fields are missing. */
export function parseBrief(input: unknown): Brief {
  const raw = (input ?? {}) as Record<string, unknown>;

  const brief: Brief = {
    name: clean(raw.name, LIMITS.name),
    description: clean(raw.description, LIMITS.description),
    industry: clean(raw.industry, LIMITS.industry),
    audience: clean(raw.audience, LIMITS.audience),
    style: clean(raw.style, LIMITS.style),
    color: clean(raw.color, LIMITS.color),
  };

  if (!brief.name) throw new Error("Please enter your business name.");
  if (brief.description.length < 20) {
    throw new Error(
      "Tell us a bit more about what you do — at least a sentence or two.",
    );
  }

  return brief;
}

export function briefToPrompt(b: Brief): string {
  return [
    "This brand has NO existing website. Design its first homepage from this brief.",
    "",
    `Business name: ${b.name}`,
    b.industry ? `Industry: ${b.industry}` : "",
    b.audience ? `Target audience: ${b.audience}` : "",
    b.style ? `Preferred style: ${b.style}` : "",
    b.color ? `Colour they want to use: ${b.color}` : "",
    "",
    "What they do, in their words:",
    b.description,
  ]
    .filter(Boolean)
    .join("\n");
}
