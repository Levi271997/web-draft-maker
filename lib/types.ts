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

/**
 * One block of the page. The client picks which blocks exist (`section`, an id
 * from lib/sections); the model decides what each is called, the job it does and
 * how it's laid out. `treatment` is settled up front so layout variety is
 * designed rather than hoped for while the page is being written.
 */
export type OutlineEntry = {
  section: string;
  title: string;
  intent: string;
  treatment: string;
};

export type Identity = {
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
  outline: OutlineEntry[];
  seo: {
    title: string;
    metaDescription: string;
  };
  improvements: string[];
};

/** The identity plus the page the model wrote from it. */
export type Recommendation = Identity & {
  /** A complete, self-contained HTML document. Rendered sandboxed. */
  html: string;
};

/** What the scrape found before generation started. */
export type BrandSummary = {
  finalUrl: string;
  siteName: string | null;
  title: string | null;
  logo: string | null;
  colors: string[];
  fonts: string[];
};

export type GenerateResponse = {
  brand: BrandSummary;
  recommendation: Recommendation;
};
