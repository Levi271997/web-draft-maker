# AI Homepage Generator — Digitalfeet

Two ways in, one output:

- **I have a website** (the default, and most Digitalfeet clients) — enter the
  URL and the app reads that site's real branding (palette, typefaces, voice,
  copy) and rebuilds the homepage around it.
- **I don't have one yet** — a four-step guided flow written for someone who
  has never had a website and doesn't know web vocabulary.

Either way, OpenAI composes the page from the approved block library and the
result renders the same. Under every preview sit plain-language refine buttons
and a booking CTA.

## The guided flow

Designed so nothing asks the client to describe their own brand:

1. **What kind of business is it?** — 12 icon tiles. Recognition beats recall,
   and the pick seeds everything downstream.
2. **Name + one line** — the line arrives **pre-filled** from the business type,
   so nobody meets an empty box. Optionally paste a Facebook page or listing;
   we scrape what we can and silently skip it if it's private.
3. **What should the website do?** — multi-select outcomes (get calls, take
   bookings, sell online, show my work, explain services, be found on Google).
   This is the highest-value question: each goal maps to blocks in
   [lib/brief.ts](lib/brief.ts), so goals *drive page structure* instead of the
   model guessing at it.
4. **Which of these feels like you?** — four small rendered mockups rather than
   adjectives, plus colour swatches rather than a hex field.

## The refine loop

Clients can't say what's wrong with a design, but they can react to one. Under
the preview: *Friendlier · More formal · Different colours · Shorter text · Add
prices · Try again*. Each re-runs generation with a fixed instruction; the keys
are a closed set in [lib/refine.ts](lib/refine.ts), so nothing from the browser
reaches the prompt as free text.

**Different colours** is enforced, not requested. Models tend to nudge the shade
(`#ea580c` → `#d35400`) which reads as a broken button, so the returned primary
is converted to HSL and retried once if its hue is within 40° of the previous
one. Measured over three runs: orange → blue every time, ~176° apart.

Styled with the Digitalfeet brand system extracted from
[webcalculator-v2.vercel.app/en/audit](https://webcalculator-v2.vercel.app/en/audit).

## Setup

```bash
npm install
```

Add your OpenAI key to `.env` in the project root:

```
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
```

`OPENAI_MODEL` is optional and defaults to `gpt-4o`. Any model on your account
that supports structured outputs works (`gpt-4o-mini` is cheaper and faster).

```bash
npm run dev     # http://localhost:3000
npm run build   # production build
```

## How it works

1. **Gather** — on the brief path, [lib/brief.ts](lib/brief.ts) validates the
   form and turns it into prompt input. On the URL path,
   [lib/scrape.ts](lib/scrape.ts) fetches the URL plus up to four linked
   stylesheets, then extracts:
   - **Colors** ranked by frequency, weighted toward saturated mid-tones so real
     brand colors outrank framework greys.
   - **Typefaces** from `@font-face`, `font-family` stacks, and Google Fonts
     links, with generic/system stacks filtered out.
   - Logo, `<title>`, meta description, nav labels, headings, CTA labels, and
     visible prose.
2. **Generate** — [lib/generate.ts](lib/generate.ts) sends those signals to
   OpenAI with a **strict JSON schema**. The model does not invent sections: it
   composes the page from the approved block library in
   [lib/blocks.ts](lib/blocks.ts), choosing which blocks to use, in what order,
   with which variant, and writing the copy that fills them.
3. **Render** — the result is shown in three parts: what was detected, a live
   homepage preview assembled from the real blocks in the *recommended* palette,
   and a build sheet listing each block and variant in page order.

## Block library

Ported from the signed-off Elementor template set, so a generated page is always
something the team already builds. Blocks carry structure only — colour and type
come from the analysed brand.

| Block | Variants |
| --- | --- |
| Hero | centered, split-left, split-right |
| Logo strip | centered, minimal |
| Feature grid | grid-3, grid-2, cards, centered |
| Content split | split-left, split-right, accent |
| Stats band | centered, accent, split-left |
| Numbered steps | grid-3, cards, minimal |
| Testimonials | cards, grid-2, centered |
| Pricing plans | cards, centered |
| FAQ | centered, grid-2, split-left |
| Team | grid-3, cards |
| Insights | cards, grid-3, minimal |
| Contact | split-left, split-right, centered |
| Closing CTA | centered, accent, split-right |

Composition is enforced server-side, not just requested in the prompt: 6–8
blocks, hero first, contact/CTA last, no repeated block type (except a second
`content` split, which is flipped to the opposite side), and variants clamped to
ones the block actually supports. Item shapes are normalised too — a step
numeral that arrives in the wrong field is moved, and testimonial quotes are
unwrapped so the template's own quote marks aren't doubled.

The model is told to write in the site's own language, so non-English sites get
non-English copy.

## Brand tokens

Ported verbatim into [app/globals.css](app/globals.css):

| Token | Value |
| --- | --- |
| `--color-purple` | `#1e1242` |
| `--color-brand` | `#4826ad` |
| `--color-brand-dark` | `#3d2788` |
| `--color-accent` | `#fab84f` |
| `--color-accent-dark` | `#f59e0b` |
| `--color-ink` | `#131028` |
| `--color-ink-soft` | `#4a5568` |
| `--color-cream` / background | `#f7fafc` |
| `--color-blue` | `#009fe3` |
| gradient | `linear-gradient(135deg, #667eea, #764ba2)` |

Type: **Ubuntu** headings, **Inter** body. Scale: `h1-m` 30/36, `h2` 48/57.6,
`h3` 32/40, `h3-m` 20/24, `h4` 24/28.8.

## Notes

- Only static HTML/CSS is read — no headless browser. Sites that paint their
  branding entirely via client-side JS will yield fewer signals, and the model
  falls back to sensible choices.
- The URL is validated server-side and localhost / private-range hosts are
  rejected, so the endpoint can't be used to probe an internal network.
- `.env` is gitignored; `.env.example` is committed.

## Deploy

Works on Vercel or Netlify as a standard Next.js app. Set `OPENAI_API_KEY` (and
optionally `OPENAI_MODEL`) as environment variables in the host dashboard —
`.env` is not deployed.
