import type { Recommendation } from "@/lib/types";

/**
 * Renders the recommendation as an actual homepage mock, using the palette and
 * type pairing the model returned rather than the Digitalfeet brand.
 */
export default function HomepagePreview({
  recommendation,
}: {
  recommendation: Recommendation;
}) {
  const { palette, typography, hero, nav, sections, brand } = recommendation;

  const headingFamily = `"${typography.headingFont}", "Ubuntu", system-ui, sans-serif`;
  const bodyFamily = `"${typography.bodyFont}", "Inter", system-ui, sans-serif`;

  return (
    <section>
      <div className="mb-4">
        <p className="mb-1 font-heading text-xs font-medium tracking-wide text-brand uppercase">
          Step 2 · Your generated homepage
        </p>
        <h2 className="font-heading text-h3-m font-bold text-ink sm:text-h4">
          Live preview
        </h2>
        <p className="mt-1 max-w-prose text-sm text-ink-soft">
          Rendered in your recommended palette and type pairing. Fonts fall back
          to system faces unless they&apos;re installed locally.
        </p>
      </div>

      <div
        className="overflow-hidden rounded-2xl shadow-sm ring-1 ring-gray-200"
        style={{ backgroundColor: palette.background, fontFamily: bodyFamily }}
      >
        {/* Browser chrome */}
        <div className="flex items-center gap-1.5 border-b border-black/5 bg-gray-100 px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-red-400" />
          <span className="size-2.5 rounded-full bg-amber-400" />
          <span className="size-2.5 rounded-full bg-emerald-500" />
        </div>

        {/* Site nav */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
          style={{ backgroundColor: palette.surface }}
        >
          <span
            className="font-bold"
            style={{ fontFamily: headingFamily, color: palette.primary }}
          >
            {brand.name}
          </span>
          <nav className="flex flex-wrap items-center gap-4">
            {nav.map((item) => (
              <span
                key={item}
                className="text-xs font-medium"
                style={{ color: palette.textMuted }}
              >
                {item}
              </span>
            ))}
            <span
              className="rounded-lg px-3 py-1.5 text-xs font-semibold"
              style={{ backgroundColor: palette.primary, color: palette.surface }}
            >
              {hero.primaryCta}
            </span>
          </nav>
        </div>

        {/* Hero */}
        <div className="px-6 py-10 text-center sm:px-10 sm:py-14">
          <p
            className="mb-3 text-xs font-semibold tracking-widest uppercase"
            style={{ color: palette.accent }}
          >
            {hero.eyebrow}
          </p>
          <h3
            className="mx-auto max-w-2xl text-3xl leading-tight font-bold sm:text-4xl"
            style={{ fontFamily: headingFamily, color: palette.text }}
          >
            {hero.headline}
          </h3>
          <p
            className="mx-auto mt-4 max-w-xl text-base"
            style={{ color: palette.textMuted }}
          >
            {hero.subheadline}
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <span
              className="rounded-xl px-6 py-3 text-sm font-bold shadow-sm"
              style={{ backgroundColor: palette.primary, color: palette.surface }}
            >
              {hero.primaryCta}
            </span>
            <span
              className="rounded-xl border-2 px-6 py-3 text-sm font-bold"
              style={{ borderColor: palette.primary, color: palette.primary }}
            >
              {hero.secondaryCta}
            </span>
          </div>
        </div>

        {/* Accent rule */}
        <div className="h-1 w-full" style={{ backgroundColor: palette.accent }} />

        {/* Sections */}
        <div className="flex flex-col gap-5 px-6 py-10 sm:px-10">
          {sections.map((section, index) => (
            <article
              key={`${section.title}-${index}`}
              className="rounded-2xl p-6 shadow-sm"
              style={{ backgroundColor: palette.surface }}
            >
              <p
                className="mb-2 text-xs font-semibold tracking-widest uppercase"
                style={{ color: palette.accent }}
              >
                {section.title}
              </p>
              <h4
                className="text-xl font-bold"
                style={{ fontFamily: headingFamily, color: palette.text }}
              >
                {section.headline}
              </h4>
              <p className="mt-2 text-sm" style={{ color: palette.textMuted }}>
                {section.body}
              </p>
              {section.bullets.length > 0 && (
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {section.bullets.map((bullet, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm"
                      style={{ color: palette.text }}
                    >
                      <span
                        aria-hidden="true"
                        className="mt-1.5 size-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: palette.primary }}
                      />
                      {bullet}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>

        {/* Footer band */}
        <div
          className="px-6 py-8 text-center sm:px-10"
          style={{ backgroundColor: palette.primaryDark }}
        >
          <p
            className="text-lg font-bold"
            style={{ fontFamily: headingFamily, color: palette.surface }}
          >
            {hero.primaryCta}
          </p>
          <p className="mt-1 text-xs" style={{ color: `${palette.surface}b3` }}>
            © {brand.name}
          </p>
        </div>
      </div>
    </section>
  );
}
