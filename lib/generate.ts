import OpenAI from "openai";
import type { ScrapedBrand } from "./scrape";
import { briefToPrompt, type Brief } from "./brief";
import type { Identity, Palette, Recommendation } from "./types";

/**
 * Two passes.
 *
 * 1. Identity — a small strict-JSON call that settles the brand, palette, type
 *    pairing and page outline.
 * 2. Page — a free-form call where the model writes the actual HTML and CSS.
 *    Nothing constrains the layout: no block library, no fixed section types.
 *
 * Splitting them keeps the metadata reliably parseable while letting the page
 * pass spend its whole budget on markup instead of JSON escaping.
 */

const IDENTITY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["brand", "palette", "typography", "nav", "outline", "seo", "improvements"],
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
        primaryDark: { type: "string", description: "Darker primary for hover and deep surfaces, 6-digit hex." },
        accent: { type: "string", description: "Accent color for eyebrows and highlights, 6-digit hex. Should differ from primary." },
        background: { type: "string", description: "Page background, 6-digit hex." },
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
        headingFont: { type: "string", description: "Heading typeface. MUST be a real Google Fonts family name." },
        bodyFont: { type: "string", description: "Body typeface. MUST be a real Google Fonts family name." },
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
    outline: {
      type: "array",
      description:
        "The sections this specific homepage needs, in order, invented for this brand. 6-10 entries. Do not default to a generic template.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "intent"],
        properties: {
          title: { type: "string", description: "Short name for the section." },
          intent: { type: "string", description: "One sentence: the job it does and roughly how it should look." },
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

const IDENTITY_SYSTEM = `You are a senior brand and conversion designer.

You are given either (a) branding signals scraped from a client's existing website, or (b) a short brief from a client who has no website yet. Decide the brand identity and the shape of their homepage.

You are NOT working from a template. Invent the section list this particular brand needs — a restaurant, a law firm and a SaaS product should produce visibly different pages. Skip sections that don't earn their place, and add unusual ones where the business calls for them.

Rules:
- Ground every choice in the evidence. When a site was scraped, reuse its own colors and typefaces where they work.
- A scraped color list is ranked by prominence but noisy: it includes framework defaults and greys. Pick the hexes that read as genuine brand colors.
- With no existing site, design the identity from scratch to suit the stated industry, audience and style. If the client named a colour, build around it.
- "accent" is for small highlights and should differ from "primary", which carries buttons.
- Strong contrast between "text" and "background". Never light-on-light or dark-on-dark.
- All colors: 6-digit lowercase hex with a leading #.
- Both typefaces must be real Google Fonts families.
- Write in the brand's own language. If the site is not in English, work in the site's language.
- Be concrete. No "Lorem ipsum", no "Your Company".`;

function pageSystemPrompt(id: Identity): string {
  const { palette, typography, brand, nav } = id;

  return `You are a senior web designer and front-end developer. Write the complete homepage for "${brand.name}" as a single self-contained HTML document.

BRAND
- Name: ${brand.name}
- Industry: ${brand.industry}
- Voice: ${brand.voice}
- About: ${brand.summary}

PALETTE (use exactly these, as CSS custom properties)
--primary: ${palette.primary}
--primary-dark: ${palette.primaryDark}
--accent: ${palette.accent}
--bg: ${palette.background}
--surface: ${palette.surface}
--text: ${palette.text}
--text-muted: ${palette.textMuted}

TYPE
- Headings: "${typography.headingFont}"
- Body: "${typography.bodyFont}"
- Load both from Google Fonts with a <link> in the head.

NAVIGATION: ${nav.items.join(", ")} — with a "${nav.ctaLabel}" button.

TECHNICAL REQUIREMENTS
- Output ONE complete document: <!doctype html> through </html>. Nothing before or after it.
- All CSS inside a single <style> block in the head. No external stylesheets except the Google Fonts link.
- ZERO JavaScript. No <script> tags. The page renders in a sandbox where scripts never run, so anything requiring JS will simply appear broken.
- No external images — every remote URL will fail. Create all imagery with CSS gradients, geometric shapes, or inline SVG you write yourself.
- Fully responsive. Use CSS grid and flexbox, clamp() for type, and at least one media query for narrow screens.
- Semantic HTML: header, nav, main, section, footer, real heading hierarchy.
- Accessible: sufficient contrast, alt text or aria-hidden on decorative SVG, visible focus styles.

DESIGN DIRECTION
- Design this page for THIS brand. Do not reach for a default SaaS layout unless the business is a SaaS product.
- Vary section rhythm: alternate full-bleed colour bands, contained sections, split layouts and grids. Avoid six identical centred sections stacked in a row.
- Real, specific copy throughout — names, numbers, plausible detail. Never "Lorem ipsum", never "Feature One".
- Consider using inline SVG for icons and illustrative shapes; it is the only way to get real imagery here.

SECTIONS TO BUILD (in order)
${id.outline.map((s, i) => `${i + 1}. ${s.title} — ${s.intent}`).join("\n")}

Return only the HTML document.`;
}

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

  if (x.s < 0.15 && y.s < 0.15) return Math.abs(x.l - y.l) < 0.25;

  const hueGap = Math.min(Math.abs(x.h - y.h), 360 - Math.abs(x.h - y.h));
  return hueGap < 40;
}

/** Guard against a malformed hex reaching the generated stylesheet. */
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

/**
 * The page renders in a script-free sandbox, but strip script and event
 * handlers anyway — defence in depth, and it stops a stray <script> from
 * silently swallowing the markup after it.
 */
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<script\b[^>]*\/?>/gi, "")
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript:/gi, "#");
}

/** Models often wrap the document in a markdown fence despite instructions. */
function unfence(raw: string): string {
  let text = raw.trim();

  const fence = text.match(/^```(?:html)?\s*\n([\s\S]*?)\n?```$/i);
  if (fence) text = fence[1].trim();

  const start = text.search(/<!doctype html|<html\b/i);
  if (start > 0) text = text.slice(start);

  const end = text.toLowerCase().lastIndexOf("</html>");
  if (end !== -1) text = text.slice(0, end + 7);

  return text.trim();
}

export type GenerateOptions = {
  refinement?: string;
  /** When set, a returned palette too close to this hue is retried once. */
  avoidPrimary?: string;
};

function client() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey.startsWith("sk-your") || apiKey === "REPLACE_ME") {
    throw new Error(
      "OPENAI_API_KEY is not set. Add your key to the .env file in the project root, then restart the dev server.",
    );
  }

  return new OpenAI({ apiKey, timeout: 180_000, maxRetries: 2 });
}

function friendlyError(err: unknown, model: string): Error {
  const e = err as { status?: number; message?: string };
  if (e.status === 401) return new Error("OpenAI rejected the API key. Check OPENAI_API_KEY in .env.");
  if (e.status === 429) return new Error("OpenAI rate limit or quota reached. Check your plan and billing.");
  if (e.status === 404) {
    return new Error(`The model "${model}" isn't available to this key. Set OPENAI_MODEL in .env to one you have access to.`);
  }
  return new Error(e.message || "The OpenAI request failed.");
}

export async function generateHomepage(
  source: BrandSource,
  options: GenerateOptions = {},
): Promise<Recommendation> {
  const { refinement, avoidPrimary } = options;
  const openai = client();
  const model = process.env.OPENAI_MODEL || "gpt-4o";
  const basePrompt = buildUserPrompt(source);

  /* ---------------- Pass 1: identity + outline ---------------- */

  async function identityOnce(extra?: string): Promise<Identity> {
    const userPrompt = [basePrompt, refinement, extra].filter(Boolean).join("\n\n");

    let completion;
    try {
      completion = await openai.chat.completions.create({
        model,
        temperature: refinement ? 0.9 : 0.8,
        messages: [
          { role: "system", content: IDENTITY_SYSTEM },
          { role: "user", content: userPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "brand_identity", strict: true, schema: IDENTITY_SCHEMA },
        },
      });
    } catch (err) {
      throw friendlyError(err, model);
    }

    const choice = completion.choices[0];
    if (choice?.message?.refusal) {
      throw new Error(`OpenAI declined the request: ${choice.message.refusal}`);
    }

    const raw = choice?.message?.content;
    if (!raw) throw new Error("OpenAI returned an empty response. Try again.");

    let parsed: Identity;
    try {
      parsed = JSON.parse(raw) as Identity;
    } catch {
      throw new Error("Couldn't parse the model response. Try again.");
    }

    parsed.palette = sanitizePalette(parsed.palette);
    parsed.nav = {
      items: (parsed.nav?.items ?? []).slice(0, 5),
      ctaLabel: parsed.nav?.ctaLabel || "Get in touch",
    };
    parsed.outline = (parsed.outline ?? []).slice(0, 10);
    parsed.improvements = parsed.improvements ?? [];

    if (parsed.outline.length === 0) {
      throw new Error("The model returned no page outline. Try again.");
    }

    return parsed;
  }

  let identity = await identityOnce();

  if (avoidPrimary && tooSimilar(identity.palette.primary, avoidPrimary)) {
    try {
      const retry = await identityOnce(
        `The palette you would normally choose is too close to ${avoidPrimary.toLowerCase()}. Pick a primary from a clearly DIFFERENT colour family — its hue must be at least 60 degrees away on the colour wheel. Do not simply darken or lighten the previous colour.`,
      );
      if (!tooSimilar(retry.palette.primary, avoidPrimary)) identity = retry;
    } catch {
      // Keep the identity we already have rather than failing the request.
    }
  }

  /* ---------------- Pass 2: the page itself ---------------- */

  let pageCompletion;
  try {
    pageCompletion = await openai.chat.completions.create({
      model,
      temperature: 0.8,
      max_completion_tokens: 12_000,
      messages: [
        { role: "system", content: pageSystemPrompt(identity) },
        {
          role: "user",
          content: [
            `Write the homepage for ${identity.brand.name}.`,
            refinement ? `\n${refinement}` : "",
            "\nSource material for accurate detail:",
            basePrompt.slice(0, 3000),
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ],
    });
  } catch (err) {
    throw friendlyError(err, model);
  }

  const pageChoice = pageCompletion.choices[0];
  if (pageChoice?.message?.refusal) {
    throw new Error(`OpenAI declined to write the page: ${pageChoice.message.refusal}`);
  }

  const html = sanitizeHtml(unfence(pageChoice?.message?.content ?? ""));

  if (!/<\/html>/i.test(html) || html.length < 500) {
    throw new Error(
      "The generated page came back incomplete. Press Try again — it usually works on a second run.",
    );
  }

  return { ...identity, html };
}
