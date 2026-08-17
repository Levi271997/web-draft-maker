/**
 * Fetches a URL and pulls out the raw branding signals we can read without a
 * browser: palette, type stacks, logo, and the copy that carries the voice.
 * Everything here is best-effort — a missing signal is normal, not an error.
 */

export type ScrapedBrand = {
  url: string;
  finalUrl: string;
  siteName: string | null;
  title: string | null;
  description: string | null;
  logo: string | null;
  colors: string[];
  fonts: string[];
  headings: string[];
  buttonLabels: string[];
  navLabels: string[];
  bodyText: string;
};

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const FETCH_TIMEOUT_MS = 15_000;
const MAX_HTML_BYTES = 1_500_000;
const MAX_STYLESHEETS = 4;

export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Please enter a website URL.");

  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    throw new Error("That doesn't look like a valid URL.");
  }

  if (!/^https?:$/.test(parsed.protocol)) {
    throw new Error("Only http and https URLs are supported.");
  }
  if (!parsed.hostname.includes(".")) {
    throw new Error("That doesn't look like a valid domain.");
  }

  // Block obvious internal targets so this endpoint can't be used to probe a
  // private network from the server.
  const host = parsed.hostname.toLowerCase();
  const blocked =
    host === "localhost" ||
    host === "0.0.0.0" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    host === "[::1]";

  if (blocked) throw new Error("That host isn't reachable from the server.");

  return parsed.toString();
}

async function fetchText(url: string, limit = MAX_HTML_BYTES): Promise<{ body: string; finalUrl: string }> {
  const res = await fetch(url, {
    headers: { "user-agent": UA, accept: "text/html,text/css,*/*" },
    redirect: "follow",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error(`The site responded with ${res.status} ${res.statusText || ""}`.trim());
  }

  const raw = await res.text();
  return { body: raw.slice(0, limit), finalUrl: res.url || url };
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

function attr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, "i"));
  return m ? decodeEntities(m[1]).trim() : null;
}

function meta(html: string, key: string): string | null {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const name = (attr(tag, "property") ?? attr(tag, "name") ?? "").toLowerCase();
    if (name === key.toLowerCase()) {
      const content = attr(tag, "content");
      if (content) return content;
    }
  }
  return null;
}

/** Expand #abc -> #aabbcc and lowercase, so duplicates collapse. */
function normalizeHex(hex: string): string | null {
  let h = hex.replace("#", "").toLowerCase();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length === 8) h = h.slice(0, 6); // drop alpha
  if (h.length !== 6 || /[^0-9a-f]/.test(h)) return null;
  return `#${h}`;
}

function rgbToHex(r: number, g: number, b: number): string | null {
  if ([r, g, b].some((v) => Number.isNaN(v) || v < 0 || v > 255)) return null;
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}

/** Perceived brightness (0-255) — used to drop near-white/near-black noise. */
function luminance(hex: string): number {
  const h = hex.slice(1);
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function saturation(hex: string): number {
  const h = hex.slice(1);
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === 0) return 0;
  return (max - min) / max;
}

/**
 * Rank colors by how often they appear, but promote saturated mid-tones —
 * a brand color is usually vivid, while greys dominate by raw count.
 */
function extractColors(css: string): string[] {
  const counts = new Map<string, number>();

  const bump = (hex: string | null) => {
    if (!hex) return;
    counts.set(hex, (counts.get(hex) ?? 0) + 1);
  };

  for (const m of css.matchAll(/#([0-9a-fA-F]{3,8})\b/g)) {
    bump(normalizeHex(m[1]));
  }
  for (const m of css.matchAll(/rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/gi)) {
    bump(rgbToHex(+m[1], +m[2], +m[3]));
  }

  const scored = [...counts.entries()]
    .filter(([hex]) => {
      const lum = luminance(hex);
      const sat = saturation(hex);
      // Keep vivid colors at any brightness; keep neutrals only if mid-tone.
      if (sat > 0.25) return true;
      return lum > 24 && lum < 240;
    })
    .map(([hex, count]) => {
      const sat = saturation(hex);
      const weight = count * (1 + sat * 2.5);
      return { hex, weight };
    })
    .sort((a, b) => b.weight - a.weight);

  return scored.slice(0, 14).map((c) => c.hex);
}

function extractFonts(css: string): string[] {
  const found = new Set<string>();

  const generic = new Set([
    "sans-serif", "serif", "monospace", "cursive", "fantasy", "system-ui",
    "ui-sans-serif", "ui-serif", "ui-monospace", "ui-rounded", "inherit",
    "initial", "unset", "revert", "none", "-apple-system", "blinkmacsystemfont",
    "segoe ui", "roboto", "helvetica neue", "helvetica", "arial", "emoji",
    "apple color emoji", "segoe ui emoji", "segoe ui symbol", "noto color emoji",
  ]);

  const push = (name: string) => {
    const clean = name.replace(/["']/g, "").trim();
    if (!clean || clean.startsWith("var(") || clean.length > 40) return;
    if (generic.has(clean.toLowerCase())) return;
    if (/^[\d\s]+$/.test(clean)) return;
    found.add(clean);
  };

  // @font-face is the strongest signal: the site actually ships this face.
  for (const m of css.matchAll(/@font-face\s*\{[^}]*font-family\s*:\s*([^;}]+)/gi)) {
    push(m[1]);
  }
  // Then declared stacks — take the first (preferred) family in each.
  for (const m of css.matchAll(/font-family\s*:\s*([^;}]+)/gi)) {
    push(m[1].split(",")[0]);
  }

  return [...found].slice(0, 8);
}

function extractGoogleFonts(html: string): string[] {
  const out = new Set<string>();
  for (const m of html.matchAll(/fonts\.googleapis\.com\/css2?\?([^"'>]+)/gi)) {
    const query = decodeEntities(m[1]);
    for (const f of query.matchAll(/family=([^&:]+)/gi)) {
      out.add(f[1].replace(/\+/g, " ").trim());
    }
  }
  return [...out];
}

function resolve(href: string, base: string): string | null {
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

function collectTagText(html: string, tag: string, limit: number): string[] {
  const out: string[] = [];
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, "gi");
  for (const m of html.matchAll(re)) {
    const text = stripTags(m[1]);
    if (text && text.length < 200 && !out.includes(text)) out.push(text);
    if (out.length >= limit) break;
  }
  return out;
}

function extractLogo(html: string, base: string): string | null {
  // An <img> whose class/alt/src mentions "logo" is the usual case.
  for (const tag of html.match(/<img\b[^>]*>/gi) ?? []) {
    const hay = tag.toLowerCase();
    if (!hay.includes("logo")) continue;
    const src = attr(tag, "src") ?? attr(tag, "data-src");
    if (src && !src.startsWith("data:")) return resolve(src, base);
  }
  const og = meta(html, "og:image");
  if (og) return resolve(og, base);

  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const rel = (attr(tag, "rel") ?? "").toLowerCase();
    if (rel.includes("apple-touch-icon") || rel.includes("icon")) {
      const href = attr(tag, "href");
      if (href) return resolve(href, base);
    }
  }
  return null;
}

export async function scrapeBrand(inputUrl: string): Promise<ScrapedBrand> {
  const url = normalizeUrl(inputUrl);

  let page: { body: string; finalUrl: string };
  try {
    page = await fetchText(url);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/timeout|aborted|timed out/i.test(msg)) {
      throw new Error("The site took too long to respond. Try again or check the URL.");
    }
    if (/fetch failed|ENOTFOUND|EAI_AGAIN|getaddrinfo/i.test(msg)) {
      throw new Error("Couldn't reach that site. Check the URL and try again.");
    }
    throw new Error(msg);
  }

  const html = page.body;
  const base = page.finalUrl;

  // Inline <style> blocks plus a handful of linked stylesheets.
  let css = (html.match(/<style\b[^>]*>([\s\S]*?)<\/style>/gi) ?? [])
    .map((block) => block.replace(/<\/?style[^>]*>/gi, ""))
    .join("\n");

  // Inline style="" attributes carry real brand colors on many builders.
  css += "\n" + (html.match(/style\s*=\s*["'][^"']*["']/gi) ?? []).join("\n");

  const sheetUrls: string[] = [];
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const rel = (attr(tag, "rel") ?? "").toLowerCase();
    if (!rel.includes("stylesheet")) continue;
    const href = attr(tag, "href");
    if (!href) continue;
    const abs = resolve(href, base);
    if (abs && !abs.includes("fonts.googleapis.com")) sheetUrls.push(abs);
    if (sheetUrls.length >= MAX_STYLESHEETS) break;
  }

  const sheets = await Promise.allSettled(
    sheetUrls.map((u) => fetchText(u, 600_000)),
  );
  for (const s of sheets) {
    if (s.status === "fulfilled") css += "\n" + s.value.body;
  }

  const fonts = [...new Set([...extractGoogleFonts(html), ...extractFonts(css)])].slice(0, 8);

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? stripTags(titleMatch[1]) : null;

  const headings = [
    ...collectTagText(html, "h1", 4),
    ...collectTagText(html, "h2", 8),
  ];

  const buttonLabels = [
    ...collectTagText(html, "button", 8),
    ...(html.match(/<a\b[^>]*class\s*=\s*["'][^"']*(?:btn|button|cta)[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi) ?? [])
      .map((m) => stripTags(m))
      .filter((t) => t && t.length < 60),
  ];

  const navLabels: string[] = [];
  const navBlock = html.match(/<nav\b[^>]*>([\s\S]*?)<\/nav>/i);
  if (navBlock) {
    for (const m of navBlock[1].matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)) {
      const text = stripTags(m[1]);
      if (text && text.length < 40 && !navLabels.includes(text)) navLabels.push(text);
      if (navLabels.length >= 10) break;
    }
  }

  // Visible prose, with script/style/noscript removed first.
  const bodyOnly = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ");

  return {
    url,
    finalUrl: base,
    siteName: meta(html, "og:site_name") ?? meta(html, "application-name"),
    title,
    description:
      meta(html, "description") ??
      meta(html, "og:description") ??
      meta(html, "twitter:description"),
    logo: extractLogo(html, base),
    colors: extractColors(css),
    fonts,
    headings: [...new Set(headings)].slice(0, 10),
    buttonLabels: [...new Set(buttonLabels)].slice(0, 8),
    navLabels,
    bodyText: stripTags(bodyOnly).slice(0, 4000),
  };
}
