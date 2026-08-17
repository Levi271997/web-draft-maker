import { NextResponse } from "next/server";
import { scrapeBrand } from "@/lib/scrape";
import { parseBrief } from "@/lib/brief";
import { generateHomepage, type BrandSource } from "@/lib/generate";
import type { BrandSummary } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const mode = body?.mode === "brief" ? "brief" : "url";

  let source: BrandSource;
  let summary: BrandSummary;

  // Both branches produce a 422 for bad input, so the client can show the
  // message inline rather than treating it as a server failure.
  if (mode === "brief") {
    try {
      const brief = parseBrief(body?.brief);
      source = { kind: "brief", brief };
      summary = {
        finalUrl: "",
        siteName: brief.name,
        title: null,
        logo: null,
        colors: [],
        fonts: [],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Please check the form.";
      return NextResponse.json({ error: message }, { status: 422 });
    }
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
    const recommendation = await generateHomepage(source);
    return NextResponse.json({ mode, brand: summary, recommendation });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed.";
    const status = /OPENAI_API_KEY|api key/i.test(message) ? 500 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
