/**
 * Which blocks the homepage is made of.
 *
 * The client picks these; the model still decides what each one says, what it's
 * called and how it's laid out. So the structure is theirs and the design is
 * still designed — a picker that also chose the treatment would just be a
 * template with extra steps.
 *
 * Header and footer are `chrome`: always built, never outline entries, and not
 * unticked. Everything else becomes exactly one entry in the outline.
 */

type SectionBase = {
  id: string;
  label: string;
  /** Client-facing, in their words — never design vocabulary. */
  hint: string;
  /** Locked on in the picker and forced on by the parser. */
  required?: true;
  /** Handed to the page pass as the literal build instruction. */
  build: string;
};

/** A block that becomes one entry in the outline. */
export type OutlineSection = SectionBase & {
  chrome?: false;
  /** Treatments that suit this block, best first. */
  treatments: string[];
  /** Used when the model skips a section the client asked for. */
  fallback: { title: string; intent: string };
};

export type SectionChoice = (SectionBase & { chrome: true }) | OutlineSection;

/** Declared in page order — this is also the order sections are sent in. */
export const SECTION_CHOICES: SectionChoice[] = [
  {
    id: "header",
    label: "Header",
    hint: "Logo and menu across the top",
    required: true,
    chrome: true,
    build:
      "A sticky site header carrying the logo, the navigation and the CTA button, gaining a background and shadow once the page scrolls past ~60px, with a working hamburger menu under 900px.",
  },
  {
    id: "hero",
    label: "Hero with your logo",
    hint: "The big opening statement",
    required: true,
    build:
      "The opening band. The logo appears here at large size as well as in the header, above one headline, one supporting line and the primary action. This is the only place on the page the logo is allowed to dominate.",
    treatments: ["full-bleed-image", "split-image-right", "centered-statement"],
    fallback: {
      title: "Hero",
      intent: "Say who this is for and what they get, and give them one obvious action.",
    },
  },
  {
    id: "content-card",
    label: "Content cards",
    hint: "Your services or offers as a row of cards",
    build:
      "A grid of cards — each an icon or small photograph, a title and two lines. One card per real service, offer or feature. Never 'Feature One'.",
    treatments: ["card-grid", "gallery-mosaic", "overlap-feature"],
    fallback: {
      title: "What we do",
      intent: "Break the offer into scannable cards so a visitor finds their own need fast.",
    },
  },
  {
    id: "content-section",
    label: "Content section",
    hint: "A block of writing with a picture",
    build:
      "A prose block paired with a photograph — a short heading, two or three paragraphs of genuine detail, and one link or button out of it.",
    treatments: ["split-image-left", "split-image-right", "overlap-feature"],
    fallback: {
      title: "About us",
      intent: "Give the visitor the substance behind the offer, in the brand's own words.",
    },
  },
  {
    id: "testimonials",
    label: "Testimonials",
    hint: "What customers say about you",
    build:
      "Customer quotes, each with a name and a role or location, and a portrait or initial avatar. With three or more, build a slider with working previous/next buttons and dots.",
    treatments: ["quote-feature", "card-grid", "dark-band"],
    fallback: {
      title: "What customers say",
      intent: "Prove the promise using the words of people who already bought.",
    },
  },
  {
    id: "logo-strip",
    label: "Logo strip",
    hint: "Brands, clients or accreditations",
    build:
      "One quiet horizontal row of client, partner or accreditation marks, drawn as inline SVG wordmarks — monochrome at reduced opacity, lifting to full strength on hover, wrapping to two rows on mobile.",
    treatments: ["logo-row", "centered-statement"],
    fallback: {
      title: "Trusted by",
      intent: "Borrow credibility from names and accreditations the visitor already recognises.",
    },
  },
  {
    id: "team",
    label: "Team members",
    hint: "The people behind the business",
    build:
      "Portrait cards — photograph, name, role and one line each. Use tall picsum portraits at 600/800 so the faces aren't cropped square.",
    treatments: ["card-grid", "gallery-mosaic", "split-image-left"],
    fallback: {
      title: "Meet the team",
      intent: "Put faces to the business so the visitor knows who they'd actually be dealing with.",
    },
  },
  {
    id: "stats",
    label: "Stats",
    hint: "Numbers that prove you're good",
    build:
      "Three or four oversized figures with a small label beneath each — years trading, jobs completed, response time, rating. Every number must be plausible for a business this size.",
    treatments: ["stat-strip", "dark-band"],
    fallback: {
      title: "By the numbers",
      intent: "Compress the track record into figures that land in a single glance.",
    },
  },
  {
    id: "pricing",
    label: "Pricing",
    hint: "Packages and what they cost",
    build:
      "Two to four clearly-priced packages, each listing what is included, one marked as the popular choice, and every card carrying its own action.",
    treatments: ["card-grid", "centered-statement", "dark-band"],
    fallback: {
      title: "Pricing",
      intent: "Answer the cost question before it turns into a reason to leave.",
    },
  },
  {
    id: "blog",
    label: "Blog posts",
    hint: "Latest articles or news",
    build:
      "Three article cards — image, date, category, headline and a one-line standfirst. The titles must be pieces this business would genuinely publish.",
    treatments: ["card-grid", "gallery-mosaic", "split-image-right"],
    fallback: {
      title: "Latest from the blog",
      intent: "Show the business is active, and give search engines something to index.",
    },
  },
  {
    id: "faq",
    label: "FAQ accordion",
    hint: "Common questions, answered",
    build:
      "Five or six real questions in a working accordion — one panel open at a time, animated height, aria-expanded kept in sync. Answer the awkward questions, not the easy ones.",
    treatments: ["centered-statement", "split-image-left"],
    fallback: {
      title: "Questions people ask",
      intent: "Clear the objections that would otherwise stop someone getting in touch.",
    },
  },
  {
    id: "cta",
    label: "Call to action",
    hint: "A clear nudge to get in touch",
    build:
      "A full-width band with one short headline, one line of copy and a single unmissable action. No competing links anywhere in it.",
    treatments: ["dark-band", "centered-statement", "overlap-feature"],
    fallback: {
      title: "Ready when you are",
      intent: "Give the visitor one last, unambiguous way to act.",
    },
  },
  {
    id: "contact",
    label: "Contact form",
    hint: "So people can message you",
    build:
      "A form panel — name, email, phone and message, each with a real label, required markers and a visible focus ring — set beside the phone number, email and opening hours. It must call preventDefault() and show an inline success message, and must never submit anywhere.",
    treatments: ["form-panel", "split-image-right", "dark-band"],
    fallback: {
      title: "Get in touch",
      intent: "Capture the enquiry on the page instead of sending them off to hunt for an address.",
    },
  },
  {
    id: "footer",
    label: "Site footer",
    hint: "Contact details and small print",
    required: true,
    chrome: true,
    build:
      "A site footer with the logo, contact details, a short link list, social icons and a copyright line.",
  },
];

const BY_ID = new Map(SECTION_CHOICES.map((s) => [s.id, s]));
const ORDER = new Map(SECTION_CHOICES.map((s, i) => [s.id, i]));

export const REQUIRED_SECTIONS = SECTION_CHOICES.filter((s) => s.required).map((s) => s.id);

/**
 * What a client gets if they never open the picker. Deliberately not everything:
 * a page carrying all thirteen blocks reads as a brochure, not a homepage.
 */
export const DEFAULT_SECTIONS = [
  "header",
  "hero",
  "content-section",
  "content-card",
  "testimonials",
  "stats",
  "faq",
  "cta",
  "contact",
  "footer",
];

export function getSection(id: string): SectionChoice | undefined {
  return BY_ID.get(id);
}

/** Page order, deduplicated, required ones forced in. */
export function normalizeSections(ids: string[]): string[] {
  const set = new Set(ids.filter((id) => BY_ID.has(id)));
  for (const id of REQUIRED_SECTIONS) set.add(id);
  return [...set].sort((a, b) => (ORDER.get(a) ?? 0) - (ORDER.get(b) ?? 0));
}

/** The ones that become outline entries — everything except header and footer. */
export function outlineSections(ids: string[]): OutlineSection[] {
  return ids
    .map((id) => BY_ID.get(id))
    .filter((s): s is OutlineSection => Boolean(s) && !s!.chrome);
}

/**
 * Anything the browser sends lands here first. An older client that sends
 * nothing gets the default set rather than an error.
 */
export function parseSections(input: unknown): string[] {
  if (!Array.isArray(input)) return [...DEFAULT_SECTIONS];

  const chosen = normalizeSections(
    input.filter((v): v is string => typeof v === "string"),
  );

  // Required-only means they unticked everything — not a page worth generating.
  return outlineSections(chosen).length === 0 ? [...DEFAULT_SECTIONS] : chosen;
}

/** The section contract handed to the identity pass. */
export function sectionsToPrompt(ids: string[]): string {
  const chrome = ids
    .map((id) => BY_ID.get(id))
    .filter((s): s is SectionChoice & { chrome: true } => Boolean(s?.chrome));

  const lines = outlineSections(ids).map(
    (s, i) => `${i + 1}. section: "${s.id}" — ${s.label}. ${s.build}`,
  );

  return [
    "SECTIONS THE CLIENT CHOSE — this is the page structure, and it is not yours to change.",
    "Return exactly one outline entry per line below, in this order, with the `section` value copied verbatim.",
    "Do not add sections they didn't pick, and do not drop ones they did.",
    "",
    ...lines,
    "",
    chrome.length
      ? `Always built, outside the outline: ${chrome.map((s) => s.label.toLowerCase()).join(" and ")}.`
      : "",
    "The titles, the intent and the layout treatment are still yours to decide, and should differ from what another business in another trade would get.",
  ]
    .filter(Boolean)
    .join("\n");
}
