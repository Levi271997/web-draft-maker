import type { BlockType, Variant } from "./blocks";

export type Palette = {
  primary: string;
  primaryDark: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  rationale: string;
};

/** One element inside a block. Which fields matter depends on the block type. */
export type BlockItem = {
  title: string;
  description: string;
  meta: string;
  value: string;
  bullets: string[];
};

export type Block = {
  blockType: BlockType;
  variant: Variant;
  purpose: string;
  eyebrow: string;
  headline: string;
  body: string;
  primaryCta: string;
  secondaryCta: string;
  items: BlockItem[];
};

export type Recommendation = {
  brand: {
    name: string;
    industry: string;
    voice: string;
    summary: string;
  };
  palette: Palette;
  typography: {
    headingFont: string;
    bodyFont: string;
    rationale: string;
  };
  nav: {
    items: string[];
    ctaLabel: string;
  };
  blocks: Block[];
  seo: {
    title: string;
    metaDescription: string;
  };
  improvements: string[];
};

/** Which path the user took. */
export type GenerateMode = "url" | "brief";

/**
 * What we knew going in. For the brief path there is nothing to detect, so
 * `finalUrl` is empty and the colour/font arrays are empty.
 */
export type BrandSummary = {
  finalUrl: string;
  siteName: string | null;
  title: string | null;
  logo: string | null;
  colors: string[];
  fonts: string[];
};

export type GenerateResponse = {
  mode: GenerateMode;
  brand: BrandSummary;
  recommendation: Recommendation;
};
