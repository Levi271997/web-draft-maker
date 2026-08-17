import OpenAI from "openai";
import type { ScrapedBrand } from "./scrape";
import { briefToPrompt, type Brief } from "./brief";
import type { Block, BlockItem, Palette, Recommendation } from "./types";
import {
  BLOCK_LIBRARY,
  BLOCK_TYPES,
  VARIANTS,
  blockCatalogueForPrompt,
  resolveVariant,
  type BlockType,
} from "./blocks";

/** Strict JSON schema — every property is required, per structured-output rules. */
const ITEM_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "description", "meta", "value", "bullets"],
  properties: {
    title: { type: "string", description: "Primary label. Empty string if unused." },
    description: { type: "string", description: "Supporting sentence. Empty string if unused." },
    meta: { type: "string", description: "Secondary label (role, category, period). Empty if unused." },
    value: { type: "string", description: "Figure, price, step number, rating or date. Empty if unused." },
    bullets: {
      type: "array",
      description: "Only for pricing plans — what the plan includes. Otherwise an empty array.",
      items: { type: "string" },
    },
  },
} as const;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["brand", "palette", "typography", "nav", "blocks", "seo", "improvements"],
  properties: {
    brand: {
      type: "object",
      additionalProperties: false,
      required: ["name", "industry", "voice", "summary"],
      properties: {
        name: { type: "string", description: "The brand or company name." },
        industry: { type: "string", description: "Short industry/category label." },
        voice: { type: "string", description: "3-6 word description of the brand tone of voice." },
        summary: { type: "string", description: "Two sentences on what this brand does and who it serves." },
      },
    },
    palette: {
      type: "object",
      additionalProperties: false,
      required: [
        "primary", "primaryDark", "accent", "background",
        "surface", "text", "textMuted", "rationale",
      ],
      properties: {
        primary: { type: "string", description: "Primary brand color as a 6-digit hex, e.g. #4826ad" },
        primaryDark: { type: "string", description: "Darker primary for hover/dark surfaces, 6-digit hex." },
        accent: { type: "string", description: "Accent color used for eyebrows and highlights, 6-digit hex." },
        background: { type: "string", description: "Page background, 6-digit hex. Usually very light." },
        surface: { type: "string", description: "Card surface color, 6-digit hex." },
        text: { type: "string", description: "Body text color, 6-digit hex. Must be readable on background." },
        textMuted: { type: "string", description: "Secondary text color, 6-digit hex." },
        rationale: { type: "string", description: "One or two sentences on why this palette fits the brand." },
      },
    },
    typography: {
      type: "object",
      additionalProperties: false,
      required: ["headingFont", "bodyFont", "rationale"],
      properties: {
        headingFont: { type: "string", description: "Heading typeface. Prefer one the site already uses; otherwise a Google Font." },
        bodyFont: { type: "string", description: "Body typeface, available on Google Fonts." },
        rationale: { type: "string", description: "One sentence on why this pairing suits the brand." },
      },
    },
    nav: {
      type: "object",
      additionalProperties: false,
      required: ["items", "ctaLabel"],
      properties: {
        items: { type: "array", description: "4-5 top-level navigation labels.", items: { type: "string" } },
        ctaLabel: { type: "string", description: "Nav button label, 2-3 words." },
      },
    },
    blocks: {
      type: "array",
      description:
        "6-8 blocks in the order they appear. The first must be a hero and the last should be a contact or cta block.",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "blockType", "variant", "purpose", "eyebrow",
          "headline", "body", "primaryCta", "secondaryCta", "items",
        ],
        properties: {
          blockType: { type: "string", enum: [...BLOCK_TYPES], description: "Which approved block to use." },
          variant: { type: "string", enum: [...VARIANTS], description: "Layout variant. Must be one the block supports." },
          purpose: { type: "string", description: "One sentence on the job this block does for THIS brand." },
          eyebrow: { type: "string", description: "Short kicker above the heading, 1-4 words. Empty string if not needed." },
          headline: { type: "string", description: "Section heading, ready to use." },
          body: { type: "string", description: "1-2 sentences of supporting copy. Empty string if the block needs none." },
          primaryCta: { type: "string", description: "Filled button label. Empty string if the block has no button." },
          secondaryCta: { type: "string", description: "Outline button label. Empty string if not needed." },
          items: { type: "array", description: "The block's repeated elements. Empty array if the block takes none.", items: ITEM_SCHEMA },
        },
      },
    },
    seo: {
      type: "object",
      additionalProperties: false,
      required: ["title", "metaDescription"],
      properties: {
        title: { type: "string", description: "SEO title tag, under 60 characters." },
        metaDescription: { type: "string", description: "Meta description, 140-158 characters." },
      },
    },
    improvements: {
      type: "array",
      description: "4-6 specific, actionable recommendations. See the user message for what to aim them at.",
      items: { type: "string" },
    },
  },
} as const;

const SYSTEM_PROMPT = `You are a senior brand and conversion designer at Digitalfeet.

You are given either (a) branding signals scraped from a client's existing website, or (b) a short brief from a client who has no website yet. From that, you assemble a homepage using ONLY the approved Digitalfeet block library below. Each block is an existing, signed-off template — you choose which blocks to use, in what order, with which variant, and you write the copy that fills them.

APPROVED BLOCK LIBRARY
${blockCatalogueForPrompt()}

Composition rules:
- Use 6-8 blocks. The first block must be "hero". The last should be "contact" or "cta".
- Never repeat a block type, with one exception: "content" may appear at most twice, and if it does, alternate split-left and split-right.
- Only use a variant listed for that block type.
- Choose blocks that fit the brand's actual business. A service agency needs steps and testimonials; a SaaS product needs pricing and features; a firm with no public pricing should not get a pricing block.
- Respect each block's item count and item shape exactly. Fields a block doesn't use must be an empty string or empty array — never filler text, never "N/A".

Branding rules:
- Ground every choice in the evidence provided. When a site was scraped, reuse its own colors and typefaces where they work.
- A scraped color list is ranked by prominence but is noisy: it includes framework defaults and greys. Pick the hexes that read as genuine brand colors, and only invent a hex when the evidence gives you nothing usable.
- When there is no existing website, design the identity from scratch: choose a palette and type pairing that suit the stated industry, audience and style preference. If the client named a colour they want, build the palette around it.
- "accent" is used for small eyebrow labels and highlights, so it should differ from "primary", which is used for buttons.
- Ensure strong contrast between "text" and "background". Never return a light-on-light or dark-on-dark pair.
- All colors must be 6-digit hex, lowercase, with a leading #.
- Write copy in the brand's own voice and language. If the site is not in English, write the copy in the site's language.
- Be concrete. No filler like "Lorem ipsum", "Your Company", or "Welcome to our website".`;

export type BrandSource =
  | { kind: "url"; brand: ScrapedBrand }
  | { kind: "brief"; brief: Brief; extraCopy?: string };

function buildUserPrompt(source: BrandSource): string {
  if (source.kind === "brief") {
    return briefToPrompt(source.brief, source.extraCopy);
  }

  const b = source.brand;
  const lines: string[] = [
    `Website: ${b.finalUrl}`,
    b.siteName ? `Site name: ${b.siteName}` : "",
    b.title ? `Page title: ${b.title}` : "",
    b.description ? `Meta description: ${b.description}` : "",
    "",
    `Colors found (ranked by prominence): ${b.colors.length ? b.colors.join(", ") : "none detected"}`,
    `Typefaces found: ${b.fonts.length ? b.fonts.join(", ") : "none detected"}`,
    "",
    b.navLabels.length ? `Navigation: ${b.navLabels.join(" | ")}` : "",
    b.headings.length ? `Headings:\n- ${b.headings.join("\n- ")}` : "",
    b.buttonLabels.length ? `Existing CTAs: ${b.buttonLabels.join(" | ")}` : "",
    "",
    "Visible page copy (truncated):",
    b.bodyText || "(no readable copy found)",
    "",
    "Use `improvements` for 4-6 specific fixes to their CURRENT homepage.",
  ];

  return lines.filter(Boolean).join("\n");
}

const HEX_RE = /^#[0-9a-f]{6}$/;

function toHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;

  if (d === 0) return { h: 0, s: 0, l };

  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === r) h = 60 * (((g - b) / d) % 6);
  else if (max === g) h = 60 * ((b - r) / d + 2);
  else h = 60 * ((r - g) / d + 4);

  return { h: (h + 360) % 360, s, l };
}

/**
 * "Different colours" must look different to a non-designer. Models tend to
 * nudge the shade (#ea580c -> #d35400) rather than change hue, which reads as
 * a broken button.
 */
function tooSimilar(a: string, b: string): boolean {
  if (!HEX_RE.test(a) || !HEX_RE.test(b)) return false;

  const x = toHsl(a);
  const y = toHsl(b);

  // Both effectively neutral: only a clear lightness shift counts as different.
  if (x.s < 0.15 && y.s < 0.15) return Math.abs(x.l - y.l) < 0.25;

  const hueGap = Math.min(Math.abs(x.h - y.h), 360 - Math.abs(x.h - y.h));
  return hueGap < 40;
}

/** Guard against a malformed hex slipping into inline styles. */
function sanitizePalette(p: Palette): Palette {
  const fallback: Record<string, string> = {
    primary: "#4826ad",
    primaryDark: "#3d2788",
    accent: "#fab84f",
    background: "#f7fafc",
    surface: "#ffffff",
    text: "#131028",
    textMuted: "#4a5568",
  };

  const out = { ...p };
  for (const key of Object.keys(fallback)) {
    const k = key as keyof typeof fallback;
    let v = String((out as Record<string, string>)[k] ?? "").trim().toLowerCase();
    if (v.length === 4 && v.startsWith("#")) {
      v = "#" + v.slice(1).split("").map((c) => c + c).join("");
    }
    if (!HEX_RE.test(v)) v = fallback[k];
    (out as Record<string, string>)[k] = v;
  }
  return out;
}

/** Models routinely put the step numeral in `title`; move it where it belongs. */
function normalizeItem(type: BlockType, item: BlockItem): BlockItem {
  const out = { ...item };

  if (type === "steps" && /^\s*#?\d{1,2}[.)]?\s*$/.test(out.title)) {
    if (!out.value.trim()) out.value = out.title.replace(/[^\d]/g, "").padStart(2, "0");
    // The numeral was standing in for the step name, so there is no name left.
    out.title = "";
  }

  if (type === "testimonials") {
    // The template draws its own quote marks around the quote.
    out.description = out.description.trim().replace(/^["“”'']+|["“”'']+$/g, "");
  }

  return out;
}

/**
 * Keep the composition inside the rules the prompt states, so a stray model
 * choice can't produce a block the renderer has no template for.
 */
function sanitizeBlocks(blocks: Block[]): Block[] {
  const seen = new Map<BlockType, number>();

  const cleaned = (blocks ?? [])
    .filter((b) => b && BLOCK_TYPES.includes(b.blockType))
    .filter((b) => {
      // "content" may repeat once; everything else is unique.
      const count = seen.get(b.blockType) ?? 0;
      const limit = b.blockType === "content" ? 2 : 1;
      if (count >= limit) return false;
      seen.set(b.blockType, count + 1);
      return true;
    })
    .map((b) => {
      const spec = BLOCK_LIBRARY[b.blockType];
      const [, max] = spec.itemRange;
      return {
        ...b,
        variant: resolveVariant(b.blockType, b.variant),
        items: (b.items ?? [])
          .slice(0, max)
          .map((item) => normalizeItem(b.blockType, {
            title: item?.title ?? "",
            description: item?.description ?? "",
            meta: item?.meta ?? "",
            value: item?.value ?? "",
            bullets: Array.isArray(item?.bullets) ? item.bullets.slice(0, 6) : [],
          })),
      };
    })
    .slice(0, 8);

  // Alternate the two content splits if the model returned the same side twice.
  const contentIdx = cleaned
    .map((b, i) => (b.blockType === "content" ? i : -1))
    .filter((i) => i >= 0);
  if (contentIdx.length === 2) {
    const [a, c] = contentIdx;
    if (cleaned[a].variant === cleaned[c].variant && cleaned[a].variant !== "accent") {
      cleaned[c] = { ...cleaned[c], variant: cleaned[a].variant === "split-left" ? "split-right" : "split-left" };
    }
  }

  return cleaned;
}

export type GenerateOptions = {
  refinement?: string;
  /** When set, a returned palette too close to this hue is retried once. */
  avoidPrimary?: string;
};

export async function generateHomepage(
  source: BrandSource,
  options: GenerateOptions = {},
): Promise<Recommendation> {
  const { refinement, avoidPrimary } = options;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey.startsWith("sk-your") || apiKey === "REPLACE_ME") {
    throw new Error(
      "OPENAI_API_KEY is not set. Add your key to the .env file in the project root, then restart the dev server.",
    );
  }

  const client = new OpenAI({ apiKey, timeout: 120_000, maxRetries: 2 });
  const model = process.env.OPENAI_MODEL || "gpt-4o";

  const basePrompt = buildUserPrompt(source);

  async function requestOnce(extra?: string): Promise<Recommendation> {
    const userPrompt = [basePrompt, refinement, extra].filter(Boolean).join("\n\n");

    let completion;
    try {
      completion = await client.chat.completions.create({
        model,
        // A refinement should visibly differ from what they just rejected.
        temperature: refinement ? 0.9 : 0.7,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "homepage_recommendation", strict: true, schema: SCHEMA },
        },
      });
    } catch (err) {
      const e = err as { status?: number; message?: string };
      if (e.status === 401) throw new Error("OpenAI rejected the API key. Check OPENAI_API_KEY in .env.");
      if (e.status === 429) throw new Error("OpenAI rate limit or quota reached. Check your plan and billing.");
      if (e.status === 404) {
        throw new Error(`The model "${model}" isn't available to this key. Set OPENAI_MODEL in .env to one you have access to.`);
      }
      throw new Error(e.message || "The OpenAI request failed.");
    }

    const choice = completion.choices[0];
    if (choice?.message?.refusal) {
      throw new Error(`OpenAI declined the request: ${choice.message.refusal}`);
    }

    const raw = choice?.message?.content;
    if (!raw) throw new Error("OpenAI returned an empty response. Try again.");

    let parsed: Recommendation;
    try {
      parsed = JSON.parse(raw) as Recommendation;
    } catch {
      throw new Error("Couldn't parse the model response. Try again.");
    }

    parsed.palette = sanitizePalette(parsed.palette);
    parsed.blocks = sanitizeBlocks(parsed.blocks);
    parsed.nav = {
      items: (parsed.nav?.items ?? []).slice(0, 5),
      ctaLabel: parsed.nav?.ctaLabel || "Get in touch",
    };
    parsed.improvements = parsed.improvements ?? [];

    if (parsed.blocks.length === 0) {
      throw new Error("The model returned no usable blocks. Try again.");
    }

    return parsed;
  }

  const first = await requestOnce();

  // The model tends to nudge the shade rather than change hue. If the client
  // asked for different colours and got the same family back, insist once.
  if (avoidPrimary && tooSimilar(first.palette.primary, avoidPrimary)) {
    try {
      const retry = await requestOnce(
        `The palette you would normally choose is too close to ${avoidPrimary.toLowerCase()}. Pick a primary from a clearly DIFFERENT colour family — its hue must be at least 60 degrees away on the colour wheel. Do not simply darken or lighten the previous colour.`,
      );
      if (!tooSimilar(retry.palette.primary, avoidPrimary)) return retry;
    } catch {
      // A failed retry shouldn't cost the user the result we already have.
    }
  }

  return first;
}
