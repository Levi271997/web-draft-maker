/**
 * Plain-language adjustments offered under the preview.
 *
 * A non-technical client can't articulate what's wrong with a design, but can
 * react to one — so each button re-runs generation with a fixed instruction.
 * The keys are a closed set: nothing the browser sends reaches the prompt as
 * free text.
 */

export const REFINEMENTS = [
  { id: "friendlier", label: "Friendlier" },
  { id: "formal", label: "More formal" },
  { id: "colours", label: "Different colours" },
  { id: "shorter", label: "Shorter text" },
  { id: "prices", label: "Add prices" },
  { id: "regenerate", label: "Try again" },
] as const;

export type RefineKey = (typeof REFINEMENTS)[number]["id"];

const INSTRUCTIONS: Record<RefineKey, string> = {
  friendlier:
    "REVISION: rewrite every line of copy in a warmer, more conversational voice — as if a person were talking to the customer. Keep the same block structure.",
  formal:
    "REVISION: rewrite every line of copy in a more formal, professional register. Keep the same block structure.",
  colours:
    "REVISION: choose a noticeably different palette. It must still suit the brand and keep strong text/background contrast.",
  shorter:
    "REVISION: cut every headline and paragraph substantially. Headlines under 7 words, body copy one short sentence. Keep the same block structure.",
  prices:
    "REVISION: include a pricing block with realistic, clearly-labelled packages for this business. Keep the rest of the page broadly as it was.",
  regenerate:
    "REVISION: produce a genuinely different take — different block selection, different angle on the copy. Do not simply repeat the previous version.",
};

const HEX_RE = /^#[0-9a-f]{6}$/i;

export function isRefineKey(value: unknown): value is RefineKey {
  return (
    typeof value === "string" &&
    REFINEMENTS.some((r) => r.id === value)
  );
}

/**
 * `avoidPrimary` comes from the browser, so it is only ever interpolated after
 * passing a strict hex test.
 */
export function refineInstruction(key: RefineKey, avoidPrimary?: unknown): string {
  const base = INSTRUCTIONS[key];

  const safeHex =
    typeof avoidPrimary === "string" && HEX_RE.test(avoidPrimary)
      ? avoidPrimary.toLowerCase()
      : null;

  if (safeHex && (key === "colours" || key === "regenerate")) {
    return `${base} The previous version used ${safeHex} as its primary — do not use that colour or a near-identical shade.`;
  }

  return base;
}
