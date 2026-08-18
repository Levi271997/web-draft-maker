import OpenAI from "openai";
import type { ScrapedBrand } from "./scrape";
import { briefToPrompt, type Brief } from "./brief";
import { factsToPrompt, parseFacts, type Facts } from "./facts";
import { goalsToPrompt, parseGoals } from "./goals";
import {
  getSection,
  outlineSections,
  parseSections,
  sectionsToPrompt,
} from "./sections";
import type { Identity, OutlineEntry, Palette, Recommendation } from "./types";

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

/**
 * Layout treatments the page pass must implement literally. Asking a model to
 * "vary the rhythm" produced six stacked centred sections; naming the treatment
 * per section up front is what actually makes the page look designed.
 */
const TREATMENTS = [
  "full-bleed-image",
  "dark-band",
  "split-image-left",
  "split-image-right",
  "card-grid",
  "centered-statement",
  "overlap-feature",
  "gallery-mosaic",
  "stat-strip",
  "quote-feature",
  "logo-row",
  "form-panel",
] as const;

/** Treatments that put a photograph on the page. */
const IMAGE_TREATMENTS = [
  "full-bleed-image",
  "split-image-left",
  "split-image-right",
  "gallery-mosaic",
];

const TREATMENT_NOTES: Record<string, string> = {
  "full-bleed-image": "edge-to-edge photograph with a brand-gradient overlay and text sitting on top",
  "dark-band": "full-width band in --primary-dark or --primary, light text, breaking the page rhythm",
  "split-image-left": "asymmetric two-column, photo on the left at roughly 7/5 — not a plain 50/50",
  "split-image-right": "asymmetric two-column, photo on the right at roughly 5/7",
  "card-grid": "3-column card grid (2 on tablet, 1 on mobile) with lift-on-hover",
  "centered-statement": "narrow centred column, large display type, plenty of air",
  "overlap-feature": "a panel or image pulled up over the previous section with negative margin",
  "gallery-mosaic": "an uneven photo grid where one tile spans two columns or rows",
  "stat-strip": "a row of oversized figures with small labels beneath",
  "quote-feature": "one large pull-quote at display size, attributed, with generous padding",
  "logo-row": "a single quiet horizontal row of marks on a plain band, evenly spaced, wrapping on mobile",
  "form-panel": "a two-column panel with the form on one side and contact details or reassurance on the other",
};

/**
 * Built per request rather than as a constant: pinning `section` to an enum of
 * exactly what the client ticked is what stops the model quietly inventing a
 * pricing block nobody asked for.
 */
const identitySchema = (sectionIds: string[]) => ({
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
      description: `Exactly ${sectionIds.length} entries — one per section the client chose, in the order they were given. Do not add, drop or reorder.`,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["section", "title", "intent", "treatment"],
        properties: {
          section: {
            type: "string",
            enum: sectionIds,
            description: "Which chosen section this entry is. Use each value exactly once.",
          },
          title: {
            type: "string",
            description:
              "Short name for this section as it reads on the page, written for this brand — not the generic block name.",
          },
          intent: { type: "string", description: "One sentence: the job it does." },
          treatment: {
            type: "string",
            enum: [...TREATMENTS],
            description:
              "How this section is laid out. Vary these across the page — never the same treatment twice in a row, and no treatment more than twice overall.",
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
      description: "4-6 specific, actionable recommendations. See the user message for what to aim them at.",
      items: { type: "string" },
    },
  },
});

const IDENTITY_SYSTEM = `You are a senior brand and conversion designer.

You are given either (a) branding signals scraped from a client's existing website, or (b) a short brief from a client who has no website yet. Decide the brand identity and fill out the homepage they asked for.

The client has already chosen which sections the page contains, and that choice is fixed. What is still yours: what each section is called, the job it does on this particular page, and how it is laid out. A restaurant, a law firm and a SaaS product picking the same blocks must still produce visibly different pages — the difference lives in the titles, the intent and the treatments, not in the block list.

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

function pageSystemPrompt(
  id: Identity,
  sectionIds: string[],
  logo?: string | null,
  context?: string,
): string {
  const { palette, typography, brand, nav } = id;

  const chrome = sectionIds
    .map(getSection)
    .filter((s) => s?.chrome)
    .map((s) => `- ${s!.label}: ${s!.build}`)
    .join("\n");

  return `You are an award-winning web designer. Write the complete homepage for "${brand.name}" as a single self-contained HTML document.

Aim for work that would be featured on Awwwards — confident, art-directed, memorable. A competent but generic corporate template is a failure.

BRAND
- Name: ${brand.name}
- Industry: ${brand.industry}
- Voice: ${brand.voice}
- About: ${brand.summary}

PALETTE (define as CSS custom properties on :root and use throughout)
--primary: ${palette.primary}
--primary-dark: ${palette.primaryDark}
--accent: ${palette.accent}
--bg: ${palette.background}
--surface: ${palette.surface}
--text: ${palette.text}
--text-muted: ${palette.textMuted}

TYPE
- Headings: "${typography.headingFont}"  |  Body: "${typography.bodyFont}"
- Load both from Google Fonts with a <link> in the head, with weights 400;500;600;700;800.

NAVIGATION: ${nav.items.join(", ")} — with a "${nav.ctaLabel}" button.

=== LOGO ===
${
  logo
    ? `Their existing logo is at ${logo} — use it as an <img> in the header and again, larger, in the hero. Give it an explicit height, width:auto and alt="${brand.name}". If it would sit on a dark band, put it on a light chip rather than letting it disappear.`
    : `There is no logo file. Draw a wordmark for "${brand.name}" as inline SVG — the name set in the heading typeface with one small geometric mark beside it, built from --primary and --accent. Use the same wordmark in the header, the hero and the footer; never a placeholder box.`
}

=== PHOTOGRAPHY (important — the page must not be image-free) ===
Use real photographs from picsum.photos. The exact format:
  https://picsum.photos/seed/WORD/WIDTH/HEIGHT
Rules:
- Use a DIFFERENT seed word per image (e.g. /seed/harbour/, /seed/atelier/) so no two repeat.
- Sizes: hero/full-bleed 1600/900, cards 800/600, tall portraits 600/800, avatars 200/200.
- Always set width/height attributes and style with object-fit: cover, plus a border-radius that matches the page.
- Art-direct them so they don't read as stock: overlay a brand-colour gradient
  (e.g. linear-gradient(180deg, transparent, var(--primary-dark)) at 50-80% opacity),
  or apply filter: saturate(0.8) contrast(1.05), or a duotone-ish blend mode.
- Use 4-8 photographs across the page: a hero image, a gallery or case-study grid, portraits for any people, and at least one full-bleed band.
- Every <img> needs meaningful alt text.
Inline SVG (that you write) is still the right choice for icons, logos and decorative shapes.

=== INTERACTIVITY (JavaScript DOES run — the page must feel alive) ===
Put all script in ONE <script> tag just before </body>. Vanilla JavaScript only — no React, no jQuery, no CDN imports; external scripts will not load.

Build in genuine interaction, choosing what suits this brand:
- A working mobile menu: a hamburger button under 900px that toggles the nav, with aria-expanded kept in sync and Escape to close.
- An accordion for any FAQ or long content — one panel open at a time, animated height or max-height, aria-expanded on the buttons.
- Smooth scrolling for in-page nav links, with scroll-margin-top so headings clear the header.
- A sticky header that gains a background and shadow once the page scrolls past ~60px.
- Scroll-reveal using IntersectionObserver: sections fade and rise once as they enter view. Never leave content permanently hidden if the observer fails — start visible and enhance.
- If there are testimonials or a gallery, a slider with working previous/next buttons and dots.
- Any form must call preventDefault() and show an inline success message. It must never actually submit anywhere.

Accessibility: every control is a real <button>, reachable by keyboard, with aria-expanded / aria-controls / aria-current where relevant and a visible :focus-visible ring.

=== MOTION ===
- Transitions on every interactive element: 200-300ms, cubic-bezier(.2,.7,.3,1).
- Cards and buttons lift on hover: translateY(-4px) plus a deepened shadow.
- Images scale gently inside a fixed overflow:hidden frame on hover (transform: scale(1.04)).
- A staggered entrance on hero elements using @keyframes with animation-delay (0.05s increments) — animate opacity and translateY only.
- Wrap all of it in @media (prefers-reduced-motion: reduce) { animation: none; transition: none; }

=== TYPOGRAPHY DISCIPLINE ===
- Display headings: clamp(2.5rem, 6vw, 4.5rem), line-height 1.05-1.15, letter-spacing -0.02em, weight 700-800.
- Section headings: clamp(1.75rem, 3.5vw, 2.75rem).
- Body: 1rem-1.125rem, line-height 1.65, max-width 65ch.
- Small eyebrow labels: 0.75rem, uppercase, letter-spacing 0.12em, in --accent.
- Establish a clear size jump between levels. Timid type is the single most common way a page looks amateur.

=== LAYOUT AMBITION ===
- Generous vertical rhythm: 5rem-8rem section padding. Cramped spacing reads as cheap.
- VARY the sections. Across the page use several of: a full-bleed dark or primary-coloured band; an asymmetric split (7/5 or 8/4, never a plain 50/50 every time); an overlapping element using negative margin; an offset or masonry-ish grid; a wide image that breaks out of the container.
- At least ONE section must be visually surprising — a big number, a full-bleed quote, a diagonal or curved divider, a sticky-feeling side label.
- Never stack six identically centred sections in a row.

=== DEPTH AND FINISH ===
- Layered shadows, not one flat blur: e.g. 0 1px 2px rgba(0,0,0,.04), 0 12px 32px rgba(0,0,0,.08).
- A consistent radius scale (e.g. 8px small, 16px cards, 28px feature panels).
- Consider a subtle grain or mesh-gradient backdrop on one dark section.
- Buttons: real presence — solid fill, adequate padding (0.9rem 1.6rem), clear hover and visible :focus-visible ring.

=== COPY ===
Real, specific, concrete. Actual names, numbers, places and detail drawn from the source material. Never "Lorem ipsum", never "Feature One", never "Your Company".

=== FACTUAL DISCIPLINE — the one rule that overrides "be concrete" ===
Facts supplied by the client, and facts visible in the source material you were given, are real. Use them verbatim: never reformat a phone number, never adjust an address, never round a figure, never upgrade a claim.

Everything else is unknown, and unknown is not an invitation to invent. You must NEVER write:
- a phone number, email address or postal address that was not given to you
- a named person, job title or team member that was not given to you
- a certification, accreditation, licence, registration, membership or award that was not given to you
- a star rating, review count, customer count, year founded, response time or any other statistic that was not given to you
- a guarantee, warranty or legal claim of any kind — "no win no fee", "fully insured", "money-back", "free quote" — unless it was given to you

Where a section needs a fact you don't have, write the qualitative version instead of a fabricated figure: "trusted by families across the area", not "4.9 stars from 212 reviews". A stats section with no supplied numbers becomes a strengths section. A team section with no supplied names becomes a section about how the work gets done. Build the block the client asked for; just build it out of what is true.

Invented contact details are the worst case, because they look correct and are not: if no phone number was supplied, show no phone number anywhere on the page, and point every call to action at the enquiry form instead. Same for an email address. Placeholder text like "01234 567890" or "info@example.com" is equally unacceptable.

=== TECHNICAL ===
- Output ONE complete document: <!doctype html> through </html>. Nothing before or after it. No markdown fences.
- All CSS in a single <style> block in the head. No external stylesheets besides Google Fonts.
- All JavaScript inline in one <script> before </body>. No external script sources — they are stripped and will not run.
- Fully responsive: CSS grid and flexbox, clamp(), and real media queries. Check the mobile layout of every section.
- Semantic HTML: header, nav, main, section, footer, correct heading hierarchy.
- Accessible: strong contrast, alt text on photographs, aria-hidden on decorative SVG, visible focus styles.

${context ? `${context}\n\n` : ""}=== PAGE CHROME (always present, outside the numbered sections) ===
${chrome}

=== SECTIONS TO BUILD (in order) ===
The client chose these blocks and this order. Build every one, build nothing else, and do not reorder them.

BUILD says what the block must contain. TREATMENT says how it is laid out — implement it literally, because it is what stops the page becoming a stack of identical centred blocks.

${id.outline
  .map((s, i) => {
    const note = TREATMENT_NOTES[s.treatment] ?? "";
    const build = getSection(s.section)?.build;
    return [
      `${i + 1}. ${s.title} — ${s.intent}`,
      `   TREATMENT: ${s.treatment}${note ? ` (${note})` : ""}`,
      build ? `   BUILD: ${build}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  })
  .join("\n\n")}

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

/**
 * The client's section list is a contract, so a dropped, duplicated or invented
 * entry can't be shrugged off — it would silently give them a page they didn't
 * ask for. Rebuild the outline from what they picked, keeping whatever the model
 * wrote for each and filling the gaps from the catalogue.
 */
function alignOutline(outline: OutlineEntry[], sectionIds: string[]): OutlineEntry[] {
  const written = new Map<string, OutlineEntry>();
  for (const entry of outline ?? []) {
    if (entry?.section && !written.has(entry.section)) written.set(entry.section, entry);
  }

  return outlineSections(sectionIds).map((def) => {
    const match = written.get(def.id);
    return {
      section: def.id,
      title: match?.title?.trim() || def.fallback.title,
      intent: match?.intent?.trim() || def.fallback.intent,
      treatment: match?.treatment ?? "",
    };
  });
}

/**
 * Enforce the variety the prompt asks for. Models drift toward repeating a
 * comfortable treatment, and back-to-back repeats are exactly what makes a page
 * look like a template.
 *
 * Every substitution is drawn from the section's own shortlist first, because
 * the generic list is what once put a stat-strip on an FAQ.
 */
function spreadTreatments(outline: OutlineEntry[]): OutlineEntry[] {
  const used = new Map<string, number>();
  const result: OutlineEntry[] = [];

  // Last resort, for a section with no shortlist. Splits suit almost any
  // content, so try those first. Deliberately excludes the two section-specific
  // treatments — a logo row on an FAQ is worse than a repeat.
  const SUBSTITUTES = [
    "split-image-right",
    "split-image-left",
    "card-grid",
    "gallery-mosaic",
    "dark-band",
    "centered-statement",
    "full-bleed-image",
    "overlap-feature",
    "quote-feature",
    "stat-strip",
  ];

  const shortlist = (entry: OutlineEntry): string[] => {
    const def = getSection(entry.section);
    return def && !def.chrome && def.treatments.length ? def.treatments : [...TREATMENTS];
  };

  for (const section of outline) {
    const allowed = shortlist(section);
    let treatment = allowed.includes(section.treatment) ? section.treatment : allowed[0];

    const previous = result.at(-1)?.treatment ?? null;

    if (treatment === previous || (used.get(treatment) ?? 0) >= 2) {
      const alternative =
        allowed.find((t) => t !== previous && (used.get(t) ?? 0) === 0) ??
        allowed.find((t) => t !== previous && (used.get(t) ?? 0) < 2) ??
        SUBSTITUTES.find((t) => t !== previous && (used.get(t) ?? 0) === 0);
      if (alternative) treatment = alternative;
    }

    used.set(treatment, (used.get(treatment) ?? 0) + 1);
    result.push({ ...section, treatment });
  }

  // A page that ends up with one photograph looks unfinished, and how many
  // photos appear is decided entirely by which treatments carry imagery. Only
  // sections that can legitimately hold a photo are eligible — a stats strip or
  // an FAQ has no shortlisted image treatment, so it is passed over.
  const imageCount = () =>
    result.filter((s) => IMAGE_TREATMENTS.includes(s.treatment)).length;

  for (let i = 1; i < result.length && imageCount() < 2; i++) {
    if (IMAGE_TREATMENTS.includes(result[i].treatment)) continue;

    const previous = result[i - 1].treatment;
    const next = result[i + 1]?.treatment;
    const swap = shortlist(result[i]).find(
      (t) => IMAGE_TREATMENTS.includes(t) && t !== previous && t !== next,
    );
    if (swap) result[i] = { ...result[i], treatment: swap };
  }

  return result;
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
 * Inline script is now wanted — the page is interactive, and it runs inside a
 * sandbox with an opaque origin where it can only affect itself.
 *
 * Remote script is a different matter: it would pull unreviewed third-party
 * code into the preview and fail unpredictably offline, so any <script> with a
 * src is dropped. Same for stylesheets other than Google Fonts.
 */
function sanitizeHtml(html: string): string {
  return html
    // <script src="..."> — with or without a closing tag.
    .replace(/<script\b[^>]*\bsrc\s*=[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<script\b[^>]*\bsrc\s*=[^>]*\/?>/gi, "")
    // Remote stylesheets that aren't Google Fonts.
    .replace(/<link\b[^>]*rel\s*=\s*["']?stylesheet["']?[^>]*>/gi, (tag) =>
      /fonts\.(googleapis|gstatic)\.com/i.test(tag) ? tag : "",
    );
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
  /** Section ids the client ticked. Anything invalid falls back to the defaults. */
  sections?: string[];
  /** Goal ids. Empty is valid — the URL path doesn't force the question. */
  goals?: string[];
  /** Contact details, credentials and language. All optional. */
  facts?: Facts;
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

  // Re-parsed rather than trusted: this also normalises the order and forces
  // the required sections in, so the schema enum and the outline always agree.
  const sections = parseSections(options.sections);
  const sectionIds = outlineSections(sections).map((s) => s.id);
  const logo = source.kind === "url" ? source.brand.logo : null;

  // Shared across both routes in: what they want the page to do, and the facts
  // it is allowed to state. Both passes need these — the identity pass to
  // weight the outline, the page pass to write without inventing.
  const context = [goalsToPrompt(parseGoals(options.goals)), factsToPrompt(parseFacts(options.facts))]
    .filter(Boolean)
    .join("\n\n");

  /* ---------------- Pass 1: identity + outline ---------------- */

  async function identityOnce(extra?: string): Promise<Identity> {
    const userPrompt = [basePrompt, context, sectionsToPrompt(sections), refinement, extra]
      .filter(Boolean)
      .join("\n\n");

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
          json_schema: {
            name: "brand_identity",
            strict: true,
            schema: identitySchema(sectionIds),
          },
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
    parsed.outline = spreadTreatments(alignOutline(parsed.outline ?? [], sections));
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
      temperature: 0.85,
      // Polish lives in the details that get cut first when the budget is tight.
      max_completion_tokens: 16_000,
      messages: [
        { role: "system", content: pageSystemPrompt(identity, sections, logo, context) },
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
