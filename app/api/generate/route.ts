import { NextResponse } from "next/server";
import { scrapeBrand } from "@/lib/scrape";
import { parseFacts } from "@/lib/facts";
import { parseGoals } from "@/lib/goals";
import { parseSections } from "@/lib/sections";
import { isRefineKey, refineInstruction } from "@/lib/refine";
import { generateHomepage } from "@/lib/generate";
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

  // Ids only, checked against their catalogues — nothing here reaches the
  // prompt as free text. Facts are the exception and are scrubbed in parseFacts.
  const sections = parseSections(body?.sections);
  const goals = parseGoals(body?.goals);
  const facts = parseFacts(body?.facts);

  const refineKey = isRefineKey(body?.refine) ? body.refine : undefined;
  const refinement = refineKey
    ? refineInstruction(refineKey, body?.avoidPrimary)
    : undefined;

  // Only enforce a hue change when they actually asked for one.
  const avoidPrimary =
    refineKey === "colours" && typeof body?.avoidPrimary === "string"
      ? body.avoidPrimary
      : undefined;

  const url = typeof body?.url === "string" ? body.url : "";
  if (!url.trim()) {
    return NextResponse.json({ error: "Please enter a website URL." }, { status: 400 });
  }

  let brand;
  try {
    brand = await scrapeBrand(url);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Couldn't read that site.";
    return NextResponse.json({ error: message }, { status: 422 });
  }

  const summary: BrandSummary = {
    finalUrl: brand.finalUrl,
    siteName: brand.siteName,
    title: brand.title,
    logo: brand.logo,
    colors: brand.colors,
    fonts: brand.fonts,
  };

  try {
    const recommendation = await generateHomepage(brand, {
      refinement,
      avoidPrimary,
      sections,
      goals,
      facts,
    });
    return NextResponse.json({ brand: summary, recommendation });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed.";
    const status = /API_KEY|api key/i.test(message) ? 500 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
