# Known issues in generated pages

What can go wrong with a page this tool produces, what it looks like to a client, and why it happens.

**Produced 19 August 2026** by auditing two freshly generated pages — one from `digitalfeet.com` (a WordPress marketing site) and one from `linear.app` (a JavaScript-rendered product site) — against the code as it stands on `feat/generator-inputs-and-handover`. Everything under "Confirmed defects" was observed in those two pages, not predicted.

Model in use at time of audit: **DeepSeek `deepseek-chat`**. Some of these are model-dependent and may behave differently on OpenAI.

> **Update, same day.** Everything in §1 has since been fixed and re-verified by regenerating both pages and re-running the identical audit. Each entry now carries its own before/after. §2 and §3 are unchanged — they are architectural or deliberate, and need decisions rather than code.

## How to read this

| | |
|---|---|
| **Blocker** | A client will see it immediately and it undermines trust in the draft |
| **Visible** | Noticeable on inspection, makes the page look unfinished |
| **Subtle** | Costs quality or accessibility but most people won't name it |
| **By design** | Working as intended, but looks like a bug if you don't know |

---

## 1. Confirmed defects

### 1.1 A social share image gets used as the logo — **Blocker**

**What you see:** a wide 1200×630 marketing banner squeezed into the header where the logo should be. On the Linear test this was `linear.app/static/og/homepage.jpg` rendered as the site logo.

**Why:** `extractLogo` in `lib/scrape.ts` tries an `<img>` whose class, alt or src mentions "logo", and when it finds none it falls back to the page's `og:image`. A social card is not a logo. Sites that render their logo as inline SVG, as a CSS background, or via JavaScript hit this fallback every time.

**Status: FIXED.** The `og:image` fallback is gone. `extractLogo` now takes an `<img>` naming itself logo/wordmark/brandmark, then the first small image inside a masthead, then returns `null` — and the prompt draws an SVG wordmark from the brand name when it gets nothing. Favicons are excluded too: a 32px icon stretched into a header reads as broken. Re-verified: Digitalfeet found its real logo, Linear correctly took the wordmark path.

---

### 1.2 Unreadable text on brand-coloured buttons — **Blocker**

**What you see:** white text on a mid-orange or yellow button that you can't quite read, especially outdoors or on a dim screen.

**Measured on both test pages:**

| Pair | Ratio | WCAG AA needs |
|---|---|---|
| White on `#f8a02d` (Digitalfeet primary) | **2.09** | 4.5 |
| White on `#e4f222` (Linear accent) | **1.23** | 4.5 |
| Body text on `#e4f222` | **1.14** | 4.5 |
| Muted text on white | 3.85 | 4.5 |

**Why:** the identity prompt requires strong contrast between `text` and `background`, and nothing checks the pairs that actually carry buttons and badges — white-on-primary, white-on-accent, text-on-accent. When a brand's real colour is a light orange or a vivid yellow, reusing it faithfully produces an unreadable button.

**Status: FIXED.** `ensureContrast` in `lib/generate.ts` now computes this rather than asking for it. The palette gains `onPrimary` and `onAccent` — whichever of black or white measures better — and they are handed to the page prompt as `--on-primary` and `--on-accent`. A primary that fails against *both* black and white is darkened until it passes, keeping its hue. `textMuted` gets the same treatment against the background.

Re-verified on the same colours:

| Pair | Before | After |
|---|---|---|
| On Digitalfeet orange `#f8a02d` | 2.09 (white) | **9.04** (black) |
| On Linear yellow `#e4f222` | 1.14 (body text) | **15.31** (black) |
| Muted text on white | 3.85 | **7.06** |

---

### 1.3 Real names used in the wrong role — **Blocker**

**What you see:** a "Meet the team" section on the Digitalfeet page listing:

- **Einar** — Lead strategist
- **AI-nar** — Digital copilot
- **CloudWay** — Brand partner

Einar and AI-nar are **cartoon characters from a seasonal Easter puzzle campaign** on their site. CloudWay is a **client**. None of them are staff.

**Why:** this is subtler than fabrication and more dangerous. The factual-discipline rules stopped the model inventing names from nothing, so instead it took real strings from the page and put them in a role they don't belong to. The output is credible precisely because the words are genuine.

**Status: FIXED.** `evidenceWarnings` checks the scraped copy for what a section actually needs — staff language for Team, quotation markers for Testimonials, digits for Stats, currency for Pricing — and when it finds none, instructs that section to be built without the missing evidence: no personal names, no quotation marks around words nobody said, no numerals. Re-verified: the team section now reads "The Team Behind Digitalfeet — Strategic / Operative / Creative" with roles and no personal names at all. The mascots are gone.

---

### 1.4 The client's own photographs are barely used — **Visible**

**What you see:** a page that's mostly stock photography even though their site has plenty of real images.

**Measured:** the prompt requires at least 4 client images when available. Actual: **2 of 7** available (Digitalfeet), **1 of 1** (Linear).

**Why:** partly self-inflicted. Fixing the text-over-image bug (§1.6) added a strong rule that client images may only go where nothing is written over them — and the model over-applied it, retreating to stock. Earlier runs, before that rule, reached 6.

**Status: FIXED**, by dropping the quota approach entirely. Stating a minimum and leaving placement to the model gave 2-of-7 twice on two different sites. `assignImages` now walks the outline server-side and hands each photo-bearing section a specific URL, printed into that section's instructions — so the model follows an assignment rather than exercising judgement it kept declining to exercise. `full-bleed-image` is skipped deliberately, since text sits on that treatment. Re-verified: 4 client images, up from 2.

---

### 1.5 Buttons and links that go nowhere — **Visible**

**What you see:** clicking "Start free trial", "Log in" or "Open app" does nothing.

**Measured:** 2 dead `href="#"` links on the Digitalfeet page, **19** on the Linear page — including every primary call to action in the header.

**Why:** nothing tells the model what a button that isn't an in-page anchor should point at. In-page navigation is fine (nav anchors resolved correctly on both pages, no broken `#section` targets), but any CTA implying an external destination has nowhere to go.

**Status: FIXED**, twice over. The prompt now forbids `href="#"` and says where each kind of CTA should point. On top of that, `repairHtml` rewrites any surviving `href="#"` to `#contact`, or the real phone as `tel:`, or the real email as `mailto:` — a pure string transform with a known-correct answer, so it cannot be talked out of it. Re-verified: **0** dead links on both pages, down from 2 and 19.

---

### 1.6 Text stacked on top of text in the hero — **Visible** *(fixed, monitor)*

**What you see:** two headlines overlapping in the hero, one sharp and one part of the background image.

**Why:** `og:image` and hero banners from marketing sites usually have the headline, tagline and buttons rendered into the pixels. The prompt used to aim the first image at the hero, so the new headline landed on the old one.

**Status:** **fixed** and verified — 0 sections with text over a client image on both audited pages. But the detection is a heuristic over filename and source (`og|share|social|banner|hero|cover|featured|slide`). A composed banner named `team-photo-3.jpg` will still slip through. The real protection is the placement rule keeping text off *all* client images, not the detection.

---

### 1.7 Images shift the layout as they load — **Subtle**

**Measured:** 1 image (Digitalfeet), 3 images (Linear) without `width`/`height` attributes.

**Why:** the prompt asks for dimensions on every image but doesn't always get them. Without them the browser can't reserve space, so content jumps as photographs arrive.

**Status: FIXED.** `repairHtml` reads the dimensions out of the picsum URL — they are literally in the path — and writes the missing attributes. Re-verified: 0 of 14 images missing dimensions, down from 1 of 8.

---

### 1.8 Meta description outside the target length — **Subtle**

**Measured:** 114 characters on the Linear page against a 140–158 target. Cosmetic for SEO, easy to miss.

**Status: not fixed.** The only honest fixes are to re-run the identity call or to truncate, and neither is worth the cost for a draft. Left as a known cosmetic gap.

---

## 2. Architectural limits

These are not bugs. They're consequences of how the tool works, and a client will still notice them.

### 2.1 Only the homepage is read

One fetch of the URL entered, plus up to four stylesheets. No links are followed. `/about`, `/services`, `/portfolio` — where most photographs and nearly all detailed copy live — are invisible.

**Effect:** thin drafts for businesses whose homepage is a splash page.

### 2.2 JavaScript is never executed

The tool reads the HTML the server sends. Sites built on React, Vue or a client-rendered page builder deliver most of their content after load, and none of it is visible to the scrape. Lazy-loading is partly handled via `data-src`, `data-lazy-src` and `srcset`.

**Effect:** measured directly — Linear, a JS-heavy site, yielded **1 usable image**. Digitalfeet, a WordPress site, yielded **7**. Expect wide variance by platform.

### 2.3 Images are hotlinked to the client's server

The generated page references image URLs on their domain rather than copying the files. Correct for a draft, but the preview depends on their site staying up, and some hosts block cross-origin image requests. Every remote image carries an `onerror` fallback to stock, so a blocked image degrades to a photograph rather than a hole.

### 2.4 Copy is consolidated, not reproduced

The model rewrites and compresses. On the Digitalfeet run it used **5 of 9** service names, folding a 14-item list into a homepage-appropriate set. Defensible editorially — but it is the model choosing what to cut.

### 2.5 Every generation is different

Temperature is 0.8–0.85. The same URL and the same settings produce a different page each time. Two people demoing the same client will not see the same draft.

### 2.6 Long pages can still truncate

The page pass writes a whole document in one call. If it exceeds the output ceiling it's cut off mid-tag, and the `</html>` check turns that into *"The generated page came back incomplete. Press Try again."* Raising `LLM_MAX_OUTPUT_TOKENS` (now 16,000) is the lever. Selecting many sections makes this more likely.

### 2.7 The page is never executed or rendered before you see it

No JavaScript error checking, no screenshot, no responsive test. A script error in the generated page — a broken accordion, a menu that won't open — reaches the client unflagged.

---

## 3. Deliberate, but looks like a bug

### 3.1 The company-register check is simulated

The loading screen shows "Connecting to the company register", a match, an org number, a registration year and an employee band. **None of it is real** — no network request is made. `lib/proff.ts` generates it deterministically from the business name.

The match card carries a "Simulated — no register was contacted" notice, and the data is display-only: it never reaches the model, the page or any stored record. But if that notice is ever removed while the mock is still in place, the tool is showing a client a fabricated registration for their own company.

### 3.2 The contact form doesn't send anything

Forms on the generated page call `preventDefault()` and show an inline success message. Correct for a draft — but a client who tests it will believe a message was sent.

### 3.3 "Book a call" doesn't create a lead anywhere

The modal validates and posts to `/api/lead`, which **logs and returns**. Nothing is stored. Until the Supabase-vs-ClickUp decision is made, every lead captured this way is lost.

### 3.4 Stock photography is openly placeholder

Photos not sourced from the client come from `picsum.photos` and are random. The preview says so beneath the frame. Expect 5–8 per page at current section counts.

---

## 4. What is already guarded

Worth knowing so you don't re-test it:

- **No invented contact details.** Verified across runs: the only phone number and email on the page are the client's real ones, pulled from `tel:`/`mailto:` links. With the details form left empty, both still reached the page.
- **No invented statistics or credentials.** Testimonials on the Digitalfeet page used real case figures — "3,200 leads in 6 months", Point Taken, Infosoft — not fabricated quotes from fictional people.
- **No placeholder text.** No "Lorem ipsum", "Your Company", "Feature One", or `info@example.com` in any audited page.
- **The section contract holds.** Every section ticked appears, in order; none are invented or dropped. Enforced by a per-request schema enum plus `alignOutline`.
- **In-page navigation resolves.** No broken `#anchor` targets on either page.
- **No duplicated copy.** No sentence repeated across sections.
- **Language is respected.** `<html lang>` set correctly on both.

---

## 5. Suggested order of work

§1.1 through §1.7 are **done and verified**. What remains, in order of value:

1. **§2.1 multi-page crawl** — the biggest quality win available, and it reuses every extractor already written. Would also raise the image count well past the four §1.4 now guarantees.
2. **§3.3 lead persistence** — every captured lead is currently discarded. Blocked on the Supabase-vs-ClickUp decision.
3. **§2.7 render before delivery** — nothing ever executes the generated page, so a broken accordion reaches the client unflagged. Playwright is already on the board for Phase 4.
4. **§2.2 JavaScript execution** — the same Playwright work would fix scraping of client-rendered sites, currently the widest source of variance.
5. **§1.8 meta description length** — cosmetic, lowest value.

---

## Caveats on this document

Two pages, one model, one day. The defects were real because they were observed, and the fixes are verified the same way — by regenerating and re-running the identical checks. But **frequency was never established**: §1.2 hit both pages, while §1.1 only appeared on the site lacking a conventional logo `<img>`.

The fixes divide into two kinds, and they are not equally trustworthy. The deterministic ones — contrast maths, link rewriting, image dimensions, image assignment — run in code and cannot be talked out of it. The prompt-based ones, chiefly §1.3, moved the odds on the cases tested and could still fail on a site whose copy is shaped differently. Treat the first kind as fixed and the second as much improved.

Everything here is a structural check. **None of it judges whether the design is any good** — whether the typography is well set, the spacing has rhythm, or the page is one you'd be proud to put in front of a client. That assessment still needs a person looking at it.
