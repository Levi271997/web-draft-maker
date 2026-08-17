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
  hero: {
    eyebrow: string;
    headline: string;
    subheadline: string;
    primaryCta: string;
    secondaryCta: string;
  };
  nav: string[];
  sections: {
    title: string;
    purpose: string;
    headline: string;
    body: string;
    bullets: string[];
  }[];
  seo: {
    title: string;
    metaDescription: string;
  };
  improvements: string[];
};

/** The scraped signals we send back to the browser alongside the result. */
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
