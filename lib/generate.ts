import OpenAI from "openai";
import type { ScrapedBrand } from "./scrape";
import type { Palette, Recommendation } from "./types";

/** Strict JSON schema — every property is required, per structured-output rules. */
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["brand", "palette", "typography", "hero", "nav", "sections", "seo", "improvements"],
  properties: {
    brand: {
      type: "object",
      additionalProperties: false,
      required: ["name", "industry", "voice", "summary"],
      properties: {
        name: { type: "string", description: "The brand or company name." },
        industry: { type: "string", description: "Short industry/category label." },
        voice: { type: "string", description: "3-6 word description of the brand tone of voice." },
        summary: {
          type: "string",
          description: "Two sentences on what this brand does and who it serves.",
        },
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
        accent: { type: "string", description: "Accent/highlight color, 6-digit hex." },
        background: { type: "string", description: "Page background, 6-digit hex. Usually very light." },
        surface: { type: "string", description: "Card surface color, 6-digit hex." },
        text: { type: "string", description: "Body text color, 6-digit hex. Must be dark enough to read on background." },
        textMuted: { type: "string", description: "Secondary text color, 6-digit hex." },
        rationale: { type: "string", description: "One or two sentences on why this palette fits the brand." },
      },
    },
    typography: {
      type: "object",
      additionalProperties: false,
      required: ["headingFont", "bodyFont", "rationale"],
      properties: {
        headingFont: { type: "string", description: "Heading typeface name. Prefer one the site already uses; otherwise a Google Font." },
        bodyFont: { type: "string", description: "Body typeface name, available on Google Fonts." },
        rationale: { type: "string", description: "One sentence on why this pairing suits the brand." },
      },
    },
    hero: {
      type: "object",
      additionalProperties: false,
      required: ["eyebrow", "headline", "subheadline", "primaryCta", "secondaryCta"],
      properties: {
        eyebrow: { type: "string", description: "Short kicker above the headline, 2-5 words." },
        headline: { type: "string", description: "Benefit-led H1, under 12 words." },
        subheadline: { type: "string", description: "One or two sentences supporting the headline." },
        primaryCta: { type: "string", description: "Primary button label, 2-4 words." },
        secondaryCta: { type: "string", description: "Secondary button label, 2-4 words." },
      },
    },
    nav: {
      type: "array",
      description: "4-6 top-level navigation labels.",
      items: { type: "string" },
    },
    sections: {
      type: "array",
      description: "5-7 homepage sections in the order they should appear, after the hero.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "purpose", "headline", "body", "bullets"],
        properties: {
          title: { type: "string", description: "Section name, e.g. 'Social proof'." },
          purpose: { type: "string", description: "One sentence on the job this section does." },
          headline: { type: "string", description: "Ready-to-use section heading." },
          body: { type: "string", description: "1-2 sentences of ready-to-use body copy." },
          bullets: {
            type: "array",
            description: "2-4 short supporting points.",
            items: { type: "string" },
          },
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
      description: "4-6 specific, actionable recommendations for their current homepage.",
      items: { type: "string" },
    },
  },
} as const;

const SYSTEM_PROMPT = `You are a senior brand and conversion designer at Digitalfeet.

You receive branding signals scraped from a real website: its palette, type stacks, headings, nav, and body copy. Your job is to propose a homepage that feels unmistakably like THAT brand — not a generic template.

Rules:
- Ground every choice in the evidence provided. Reuse the site's own colors and typefaces where they work.
- The scraped color list is ranked by prominence but is noisy: it includes framework defaults and greys. Pick the hexes that read as genuine brand colors, and only invent a hex when the evidence gives you nothing usable.
- Ensure the text color has strong contrast against the background color. Never return a light-on-light or dark-on-dark pair.
- All colors must be 6-digit hex, lowercase, with a leading #.
- Write copy in the brand's own voice and language. If the site is not in English, write the copy in the site's language.
- Be concrete. No filler like "Lorem ipsum", "Your Company", or "Welcome to our website".`;

function buildUserPrompt(b: ScrapedBrand): string {
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
  ];

  return lines.filter(Boolean).join("\n");
}

const HEX_RE = /^#[0-9a-f]{6}$/;

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

export async function generateHomepage(brand: ScrapedBrand): Promise<Recommendation> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey.startsWith("sk-your") || apiKey === "REPLACE_ME") {
    throw new Error(
      "OPENAI_API_KEY is not set. Add your key to the .env file in the project root, then restart the dev server.",
    );
  }

  const client = new OpenAI({ apiKey, timeout: 90_000, maxRetries: 2 });
  const model = process.env.OPENAI_MODEL || "gpt-4o";

  let completion;
  try {
    completion = await client.chat.completions.create({
      model,
      temperature: 0.7,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(brand) },
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
  parsed.nav = (parsed.nav ?? []).slice(0, 6);
  parsed.sections = (parsed.sections ?? []).slice(0, 7);
  parsed.improvements = parsed.improvements ?? [];

  return parsed;
}
