/**
 * The approved Digitalfeet block library.
 *
 * Each entry mirrors a block from the signed-off Elementor template set: what
 * the section is for, which layout variants exist, and how the generic `items`
 * array maps onto that block's elements. The model picks from this catalogue,
 * so a generated homepage is always assembled from blocks the team already
 * builds — only the copy and palette change per brand.
 */

export const BLOCK_TYPES = [
  "hero",
  "logos",
  "features",
  "content",
  "stats",
  "steps",
  "testimonials",
  "pricing",
  "faq",
  "team",
  "blogs",
  "contact",
  "cta",
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

export const VARIANTS = [
  "centered",
  "split-left",
  "split-right",
  "grid-2",
  "grid-3",
  "cards",
  "accent",
  "minimal",
] as const;

export type Variant = (typeof VARIANTS)[number];

type BlockSpec = {
  label: string;
  /** What the block is for — shown to the user in the plan. */
  purpose: string;
  /** Variants this block actually supports. */
  variants: Variant[];
  /** How `items` maps onto this block's elements, for the model. */
  itemShape: string;
  /** Sensible item count. */
  itemRange: [number, number];
};

export const BLOCK_LIBRARY: Record<BlockType, BlockSpec> = {
  hero: {
    label: "Hero",
    purpose: "Above-the-fold promise and the primary conversion action.",
    variants: ["centered", "split-left", "split-right"],
    itemShape:
      "items = up to 3 short proof points (title only, e.g. a benefit line). Leave empty for the centered variant.",
    itemRange: [0, 3],
  },
  logos: {
    label: "Logo strip",
    purpose: "Borrowed credibility from recognisable customers or partners.",
    variants: ["centered", "minimal"],
    itemShape: "items = client or partner names (title only).",
    itemRange: [4, 6],
  },
  features: {
    label: "Feature grid",
    purpose: "The core capabilities, scanned quickly as icon + label + line.",
    variants: ["grid-3", "grid-2", "cards", "centered"],
    itemShape: "items = title (short label) + description (1 sentence).",
    itemRange: [3, 6],
  },
  content: {
    label: "Content split",
    purpose: "One idea explained properly, with an image beside the copy.",
    variants: ["split-left", "split-right", "accent"],
    itemShape: "items = checkmark bullets (title only, short).",
    itemRange: [0, 4],
  },
  stats: {
    label: "Stats band",
    purpose: "Hard numbers that make the claim concrete.",
    variants: ["centered", "accent", "split-left"],
    itemShape:
      "items = value (the figure, e.g. '200+') + title (what it counts) + description (optional context).",
    itemRange: [3, 4],
  },
  steps: {
    label: "Numbered steps",
    purpose: "How the process works, in order, to remove uncertainty.",
    variants: ["grid-3", "cards", "minimal"],
    itemShape:
      "items = value (ONLY the numeral: '01', '02', …) + title (the step NAME in 2-4 words, never a number) + description (what happens).",
    itemRange: [3, 6],
  },
  testimonials: {
    label: "Testimonials",
    purpose: "Social proof in the customer's own words.",
    variants: ["cards", "grid-2", "centered"],
    itemShape:
      "items = description (the quote) + title (person's name) + meta ('Role at Company') + value (rating 1-5 as a string).",
    itemRange: [2, 3],
  },
  pricing: {
    label: "Pricing plans",
    purpose: "Packages and what each one includes.",
    variants: ["cards", "centered"],
    itemShape:
      "items = title (plan name) + value (price, e.g. '$19') + meta (billing period) + description (who it suits) + bullets (what's included).",
    itemRange: [2, 3],
  },
  faq: {
    label: "FAQ",
    purpose: "Answers to the objections that stall a decision.",
    variants: ["centered", "grid-2", "split-left"],
    itemShape: "items = title (the question) + description (the answer).",
    itemRange: [4, 6],
  },
  team: {
    label: "Team",
    purpose: "The people behind the work, for trust.",
    variants: ["grid-3", "cards"],
    itemShape: "items = title (name) + meta (job title).",
    itemRange: [3, 4],
  },
  blogs: {
    label: "Insights",
    purpose: "Recent thinking, for depth and SEO.",
    variants: ["cards", "grid-3", "minimal"],
    itemShape:
      "items = title (article title) + description (excerpt) + meta (category) + value (a plausible date).",
    itemRange: [3, 3],
  },
  contact: {
    label: "Contact",
    purpose: "The conversion form, paired with a reason to fill it in.",
    variants: ["split-left", "split-right", "centered"],
    itemShape: "items = checkmark reassurance bullets (title only).",
    itemRange: [0, 3],
  },
  cta: {
    label: "Closing CTA",
    purpose: "One last, unambiguous ask before the footer.",
    variants: ["centered", "accent", "split-right"],
    itemShape: "items = optional reassurance line (title only), e.g. a no-risk note.",
    itemRange: [0, 2],
  },
};

/** Catalogue rendered into the system prompt so the model picks real blocks. */
export function blockCatalogueForPrompt(): string {
  return (Object.keys(BLOCK_LIBRARY) as BlockType[])
    .map((key) => {
      const b = BLOCK_LIBRARY[key];
      return [
        `- ${key} (${b.label}) — ${b.purpose}`,
        `  variants: ${b.variants.join(", ")}`,
        `  items (${b.itemRange[0]}-${b.itemRange[1]}): ${b.itemShape}`,
      ].join("\n");
    })
    .join("\n");
}

/** Fall back to a variant the block actually supports. */
export function resolveVariant(type: BlockType, variant: string): Variant {
  const spec = BLOCK_LIBRARY[type];
  if (!spec) return "centered";
  return spec.variants.includes(variant as Variant)
    ? (variant as Variant)
    : spec.variants[0];
}
