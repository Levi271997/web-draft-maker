import { NextResponse } from "next/server";
import { scrapeBrand } from "@/lib/scrape";
import { parseBrief } from "@/lib/brief";
import { isRefineKey, refineInstruction } from "@/lib/refine";
import { generateHomepage, type BrandSource } from "@/lib/generate";
import type { BrandSummary } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * The brief can carry a Facebook page or listing URL. Many of these sit behind
 * a login wall, so this is strictly best-effort: anything we get is a bonus and
 * a failure must never fail the request.
 */
async function tryExtraCopy(url: string): Promise<string | undefined> {
  if (!url.trim()) return undefined;
  try {
    const scraped = await scrapeBrand(url);
    const text = scraped.bodyText.trim();
    return text.length > 120 ? text.slice(0, 2000) : undefined;
  } catch {
    return undefined;
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const mode = body?.mode === "brief" ? "brief" : "url";

  const refineKey = isRefineKey(body?.refine) ? body.refine : undefined;
  const refinement = refineKey
    ? refineInstruction(refineKey, body?.avoidPrimary)
    : undefined;

  // Only enforce a hue change when they actually asked for one.
  const avoidPrimary =
    refineKey === "colours" && typeof body?.avoidPrimary === "string"
      ? body.avoidPrimary
      : undefined;

  let source: BrandSource;
  let summary: BrandSummary;

  if (mode === "brief") {
    let brief;
    try {
      brief = parseBrief(body?.brief);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Please check your answers.";
      return NextResponse.json({ error: message }, { status: 422 });
    }

    const extraCopy = await tryExtraCopy(brief.sourceUrl);
    source = { kind: "brief", brief, extraCopy };
    summary = {
      finalUrl: "",
      siteName: brief.name,
      title: null,
      logo: null,
      colors: [],
      fonts: [],
    };
  } else {
    const url = typeof body?.url === "string" ? body.url : "";
    if (!url.trim()) {
      return NextResponse.json({ error: "Please enter a website URL." }, { status: 400 });
    }

    try {
      const brand = await scrapeBrand(url);
      source = { kind: "url", brand };
      summary = {
        finalUrl: brand.finalUrl,
        siteName: brand.siteName,
        title: brand.title,
        logo: brand.logo,
        colors: brand.colors,
        fonts: brand.fonts,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Couldn't read that site.";
      return NextResponse.json({ error: message }, { status: 422 });
    }
  }

  try {
    const recommendation = await generateHomepage(source, { refinement, avoidPrimary });
    return NextResponse.json({ mode, brand: summary, recommendation });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed.";
    const status = /OPENAI_API_KEY|api key/i.test(message) ? 500 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
