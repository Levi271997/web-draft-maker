/**
 * The "no website yet" path.
 *
 * Written for a client who does not know web vocabulary: every question is
 * answered by pointing at something, and the only free text is one sentence
 * that arrives pre-filled. Nothing here asks them to describe a brand.
 */

export type BusinessType = {
  id: string;
  icon: string;
  label: string;
  industry: string;
  /** Pre-filled so nobody faces an empty box. */
  example: string;
};

export const BUSINESS_TYPES: BusinessType[] = [
  {
    id: "food",
    icon: "🍽️",
    label: "Restaurant or café",
    industry: "Food & hospitality",
    example:
      "We're a family-run café serving breakfast and lunch, with everything baked in-house each morning.",
  },
  {
    id: "trades",
    icon: "🔧",
    label: "Trades & repair",
    industry: "Trades & home services",
    example:
      "We fix boilers and heating for homes in the area, usually same-day, with no call-out fee.",
  },
  {
    id: "health",
    icon: "🩺",
    label: "Health & care",
    industry: "Health & wellbeing",
    example:
      "We're a small dental practice offering check-ups, hygiene and cosmetic treatments for families.",
  },
  {
    id: "retail",
    icon: "🛍️",
    label: "Shop or retail",
    industry: "Retail",
    example:
      "We sell handmade homeware and gifts from our shop, and ship anywhere in the country.",
  },
  {
    id: "professional",
    icon: "💼",
    label: "Professional services",
    industry: "Professional services",
    example:
      "We handle bookkeeping and year-end accounts for small businesses so owners can stop worrying about it.",
  },
  {
    id: "construction",
    icon: "🏗️",
    label: "Construction & property",
    industry: "Construction",
    example:
      "We build extensions and do full house renovations, managing the whole job from drawings to handover.",
  },
  {
    id: "beauty",
    icon: "💇",
    label: "Beauty & salon",
    industry: "Beauty & personal care",
    example:
      "We're a hair salon offering cuts, colour and treatments, with a team of six stylists.",
  },
  {
    id: "fitness",
    icon: "🏋️",
    label: "Fitness & sport",
    industry: "Fitness",
    example:
      "We run small-group strength training and one-to-one coaching for people getting back into exercise.",
  },
  {
    id: "realestate",
    icon: "🏡",
    label: "Property & lettings",
    industry: "Real estate",
    example:
      "We help people buy and sell homes in the region, and manage rentals for landlords.",
  },
  {
    id: "education",
    icon: "🎓",
    label: "Education & training",
    industry: "Education & training",
    example:
      "We run practical short courses that help people pick up a new skill in a few evenings.",
  },
  {
    id: "events",
    icon: "📸",
    label: "Events & photography",
    industry: "Events & creative",
    example:
      "We photograph weddings and events, and deliver an edited gallery within two weeks.",
  },
  {
    id: "other",
    icon: "✨",
    label: "Something else",
    industry: "",
    example: "",
  },
];

/**
 * The highest-value question on the form. A non-technical client answers this
 * instantly and correctly, and it maps straight onto block selection — which
 * the model would otherwise be guessing at.
 */
export type Goal = {
  id: string;
  label: string;
  hint: string;
  /** Blocks this outcome argues for. */
  blocks: string[];
};

export const GOALS: Goal[] = [
  {
    id: "calls",
    label: "Get phone calls",
    hint: "People ring you to get started",
    blocks: ["contact", "cta"],
  },
  {
    id: "bookings",
    label: "Take bookings",
    hint: "Appointments, tables or jobs booked in",
    blocks: ["contact", "steps"],
  },
  {
    id: "sell",
    label: "Sell online",
    hint: "Products or packages bought on the site",
    blocks: ["pricing", "features"],
  },
  {
    id: "showcase",
    label: "Show my work",
    hint: "Photos of past jobs, projects or results",
    blocks: ["blogs", "content", "testimonials"],
  },
  {
    id: "explain",
    label: "Explain my services",
    hint: "Make it clear what you do and for whom",
    blocks: ["features", "content", "faq"],
  },
  {
    id: "google",
    label: "Be found on Google",
    hint: "Get discovered by people searching",
    blocks: ["faq", "content"],
  },
];

/** Shown as small rendered mockups, never as adjectives. */
export type StylePreset = {
  id: string;
  label: string;
  /** How it should read, in the client's terms. */
  feel: string;
  /** Direction handed to the model. */
  direction: string;
  swatch: { primary: string; accent: string; bg: string; text: string };
  serif: boolean;
};

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: "clean",
    label: "Clean & modern",
    feel: "Simple, lots of space, easy to read",
    direction:
      "Clean and modern: a cool, restrained palette, generous whitespace, a geometric sans for headings.",
    swatch: { primary: "#2563eb", accent: "#0ea5e9", bg: "#ffffff", text: "#0f172a" },
    serif: false,
  },
  {
    id: "warm",
    label: "Warm & friendly",
    feel: "Approachable, human, not corporate",
    direction:
      "Warm and friendly: warm earthy tones, a soft off-white ground, a rounded humanist sans.",
    swatch: { primary: "#ea580c", accent: "#f59e0b", bg: "#fffbf5", text: "#3f2d20" },
    serif: false,
  },
  {
    id: "bold",
    label: "Bold & confident",
    feel: "Strong, high contrast, hard to ignore",
    direction:
      "Bold and confident: high contrast, near-black ground colours, one vivid accent, heavy headings.",
    swatch: { primary: "#111827", accent: "#f43f5e", bg: "#ffffff", text: "#111827" },
    serif: false,
  },
  {
    id: "classic",
    label: "Classic & trusted",
    feel: "Established, serious, dependable",
    direction:
      "Classic and trusted: deep navy or forest tones, a muted metallic accent, a serif for headings.",
    swatch: { primary: "#1e3a5f", accent: "#a68a64", bg: "#fdfdfb", text: "#1f2937" },
    serif: true,
  },
];

export const COLOR_CHOICES = [
  { id: "blue", label: "Deep blue", hex: "#1e40af" },
  { id: "green", label: "Forest green", hex: "#166534" },
  { id: "orange", label: "Warm orange", hex: "#ea580c" },
  { id: "charcoal", label: "Charcoal", hex: "#1f2937" },
  { id: "burgundy", label: "Burgundy", hex: "#881337" },
  { id: "teal", label: "Teal", hex: "#0f766e" },
];

export type Brief = {
  businessType: string;
  name: string;
  description: string;
  /** Optional Facebook page / listing we try to read extra copy from. */
  sourceUrl: string;
  goals: string[];
  style: string;
  color: string;
  extra: string;
};

const LIMITS = {
  name: 80,
  description: 1200,
  extra: 600,
  sourceUrl: 300,
};

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanList(value: unknown, allowed: string[]): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string")
    .filter((v) => allowed.includes(v))
    .slice(0, allowed.length);
}

/** Throws with a user-facing message when the required answers are missing. */
export function parseBrief(input: unknown): Brief {
  const raw = (input ?? {}) as Record<string, unknown>;

  const brief: Brief = {
    businessType: clean(raw.businessType, 40),
    name: clean(raw.name, LIMITS.name),
    description: clean(raw.description, LIMITS.description),
    sourceUrl: clean(raw.sourceUrl, LIMITS.sourceUrl),
    goals: cleanList(raw.goals, GOALS.map((g) => g.id)),
    style: clean(raw.style, 40),
    color: clean(raw.color, 40),
    extra: clean(raw.extra, LIMITS.extra),
  };

  if (!BUSINESS_TYPES.some((t) => t.id === brief.businessType)) {
    throw new Error("Please choose what kind of business this is.");
  }
  if (!brief.name) throw new Error("Please enter your business name.");
  if (brief.description.length < 20) {
    throw new Error("Please tell us in a sentence what you do for customers.");
  }
  if (brief.goals.length === 0) {
    throw new Error("Please pick at least one thing you want the website to do.");
  }

  return brief;
}

export function briefToPrompt(b: Brief, extraCopy?: string): string {
  const type = BUSINESS_TYPES.find((t) => t.id === b.businessType);
  const style = STYLE_PRESETS.find((s) => s.id === b.style);
  const color = COLOR_CHOICES.find((c) => c.id === b.color);

  const goals = b.goals
    .map((id) => GOALS.find((g) => g.id === id))
    .filter((g): g is Goal => Boolean(g));

  // Goals are the strongest structural signal we have, so state them as block
  // requirements rather than leaving the model to infer a page shape.
  const requiredBlocks = [...new Set(goals.flatMap((g) => g.blocks))];

  return [
    "This brand has NO existing website. Design its first homepage from this brief.",
    "",
    `Business name: ${b.name}`,
    type ? `Kind of business: ${type.label}${type.industry ? ` (${type.industry})` : ""}` : "",
    "",
    "What they do, in their own words:",
    b.description,
    "",
    "What they want the website to achieve:",
    ...goals.map((g) => `- ${g.label} (${g.hint})`),
    "",
    `Because of those goals, strongly prefer including these blocks: ${requiredBlocks.join(", ")}. Drop any that genuinely do not fit the business.`,
    "",
    style ? `Look and feel they chose: ${style.label}. ${style.direction}` : "",
    color ? `Colour they leaned towards: ${color.label} (${color.hex}). Build the palette around it — you may adjust the exact shade for contrast.` : "",
    b.extra ? `\nAnything else they told us:\n${b.extra}` : "",
    extraCopy
      ? `\nCopy pulled from a page they gave us (${b.sourceUrl}) — use it for real detail, names and proof:\n${extraCopy}`
      : "",
    "",
    "This client is not technical and has never had a website. Keep every line of copy plain and concrete — no jargon, no marketing abstractions.",
    "Because there is no current homepage to critique, use `improvements` for 4-6 things this brand should prepare or decide before launch (photos to take, proof to collect, details to confirm). Write them as plain instructions a non-technical owner could act on.",
  ]
    .filter(Boolean)
    .join("\n");
}
