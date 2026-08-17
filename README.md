# AI Homepage Generator — Digitalfeet

Enter a website URL, press **Create Homepage**, and the app reads that site's
real branding (palette, typefaces, voice, copy) and uses OpenAI to generate a
homepage recommendation built around it.

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

1. **Scrape** — [lib/scrape.ts](lib/scrape.ts) fetches the URL plus up to four
   linked stylesheets, then extracts:
   - **Colors** ranked by frequency, weighted toward saturated mid-tones so real
     brand colors outrank framework greys.
   - **Typefaces** from `@font-face`, `font-family` stacks, and Google Fonts
     links, with generic/system stacks filtered out.
   - Logo, `<title>`, meta description, nav labels, headings, CTA labels, and
     visible prose.
2. **Generate** — [lib/generate.ts](lib/generate.ts) sends those signals to
   OpenAI with a **strict JSON schema**, so the response is always well-formed:
   palette with named roles, type pairing, hero copy, nav, 5–7 sections, meta
   tags, and fixes for the current homepage. Hex values are validated
   server-side and fall back to brand defaults if malformed.
3. **Render** — the result is shown in three parts: what was detected, a live
   homepage preview drawn in the *recommended* palette, and the reasoning behind
   the structure.

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
