# AI Homepage Generator — Digitalfeet

Two ways in, one output:

- **I have a website** (the default, and most Digitalfeet clients) — enter the
  URL and the app reads that site's real branding (palette, typefaces, voice,
  copy) and rebuilds the homepage around it.
- **Starting from scratch** — no site yet, so a short brief (business name and
  what you do are required; industry, audience, style and a preferred colour
  sharpen it) stands in for the scrape, and the identity is designed from
  nothing.

Either way, OpenAI composes the page from the approved block library and the
result renders the same.

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
