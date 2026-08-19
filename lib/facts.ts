/**
 * The things a homepage states as fact.
 *
 * The page pass is told to be concrete, so when it isn't given a phone number
 * it writes one anyway — along with staff names, star ratings and, in one test
 * run, a "no win, no fee" guarantee nobody had offered. A generated page is
 * only as honest as the facts it was handed.
 *
 * Every field is optional. Blank does not mean "invent something": see the
 * factual-discipline block in lib/generate, which turns an empty field into an
 * instruction to omit rather than to guess.
 */

export type Facts = {
  phone: string;
  email: string;
  /** Town, city or the area they cover. Also the local-SEO signal. */
  area: string;
  hours: string;
  /** Certifications, years trading, ratings — whatever is genuinely true. */
  proof: string;
  language: string;
};

export const EMPTY_FACTS: Facts = {
  phone: "",
  email: "",
  area: "",
  hours: "",
  proof: "",
  language: "auto",
};

export const LANGUAGES = [
  { id: "auto", label: "Match my business", name: "" },
  { id: "en", label: "English", name: "English" },
  { id: "nb", label: "Norwegian", name: "Norwegian (Bokmål)" },
  { id: "sv", label: "Swedish", name: "Swedish" },
  { id: "da", label: "Danish", name: "Danish" },
  { id: "de", label: "German", name: "German" },
  { id: "nl", label: "Dutch", name: "Dutch" },
  { id: "fr", label: "French", name: "French" },
  { id: "es", label: "Spanish", name: "Spanish" },
];

const LIMITS: Record<keyof Omit<Facts, "language">, number> = {
  phone: 40,
  email: 120,
  area: 120,
  hours: 240,
  proof: 600,
};

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/**
 * Anything the browser sends lands here first. These strings are interpolated
 * into a prompt, so they are length-capped and stripped of the backtick and
 * brace runs that would let a value read as instruction rather than as data.
 */
export function parseFacts(input: unknown): Facts {
  const raw = (input ?? {}) as Record<string, unknown>;

  const scrub = (value: string) => value.replace(/[`{}]/g, "").replace(/\s+/g, " ").trim();

  const language = clean(raw.language, 10);

  return {
    phone: scrub(clean(raw.phone, LIMITS.phone)),
    email: scrub(clean(raw.email, LIMITS.email)),
    area: scrub(clean(raw.area, LIMITS.area)),
    // Hours and proof are the two where line breaks carry meaning.
    hours: clean(raw.hours, LIMITS.hours).replace(/[`{}]/g, ""),
    proof: clean(raw.proof, LIMITS.proof).replace(/[`{}]/g, ""),
    language: LANGUAGES.some((l) => l.id === language) ? language : "auto",
  };
}

export function hasAnyFact(facts: Facts): boolean {
  return Boolean(facts.phone || facts.email || facts.area || facts.hours || facts.proof);
}

export function factsToPrompt(facts: Facts): string {
  const supplied: string[] = [];

  if (facts.phone) supplied.push(`- Phone number: ${facts.phone}`);
  if (facts.email) supplied.push(`- Email address: ${facts.email}`);
  if (facts.area) supplied.push(`- Location / area served: ${facts.area}`);
  if (facts.hours) supplied.push(`- Opening hours: ${facts.hours}`);
  if (facts.proof) supplied.push(`- Credentials and proof they have confirmed: ${facts.proof}`);

  const language = LANGUAGES.find((l) => l.id === facts.language);
  const languageLine =
    language && language.name
      ? `Write the entire page in ${language.name}. Every heading, paragraph, button, form label and the meta tags.`
      : "";

  if (supplied.length === 0 && !languageLine) return "";

  return [
    supplied.length
      ? [
          "VERIFIED FACTS — given by the client, or read from their current website. The only facts of this kind you have.",
          "Use them verbatim. Never reformat a phone number, never adjust an address, never round a figure.",
          "",
          ...supplied,
        ].join("\n")
      : "",
    languageLine,
  ]
    .filter(Boolean)
    .join("\n\n");
}
