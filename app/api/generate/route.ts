import { NextResponse } from "next/server";
import { scrapeBrand } from "@/lib/scrape";
import { generateHomepage } from "@/lib/generate";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  let url: string;

  try {
    const body = await request.json();
    url = typeof body?.url === "string" ? body.url : "";
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

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

  try {
    const recommendation = await generateHomepage(brand);
    return NextResponse.json({
      brand: {
        finalUrl: brand.finalUrl,
        siteName: brand.siteName,
        title: brand.title,
        logo: brand.logo,
        colors: brand.colors,
        fonts: brand.fonts,
      },
      recommendation,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed.";
    const status = /OPENAI_API_KEY|api key/i.test(message) ? 500 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
