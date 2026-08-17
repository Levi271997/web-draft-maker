import type { GenerateMode, Recommendation } from "@/lib/types";

export default function SectionPlan({
  mode,
  recommendation,
}: {
  mode: GenerateMode;
  recommendation: Recommendation;
}) {
  const { outline, seo, improvements } = recommendation;

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 sm:p-8">
      <p className="mb-1 font-heading text-xs font-medium tracking-wide text-brand uppercase">
        Step 3 · The reasoning
      </p>
      <h2 className="font-heading text-h3-m font-bold text-ink sm:text-h4">
        Why this page is built this way
      </h2>
      <p className="mt-1 max-w-prose text-sm text-ink-soft">
        The sections were chosen for this business specifically — not picked
        from a fixed template.
      </p>

      <ol className="mt-5 flex flex-col gap-4">
        {outline.map((section, index) => (
          <li
            key={`${section.title}-${index}`}
            className="flex gap-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand/10 font-heading text-xs font-bold text-brand">
              {index + 1}
            </span>
            <div className="min-w-0">
              <h3 className="flex flex-wrap items-center gap-2 font-heading text-base font-bold text-ink">
                {section.title}
                {section.treatment && (
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] font-normal text-ink-soft">
                    {section.treatment}
                  </span>
                )}
              </h3>
              <p className="mt-0.5 text-sm text-ink-soft">{section.intent}</p>
            </div>
          </li>
        ))}
      </ol>

      {improvements.length > 0 && (
        <div className="mt-8">
          <h3 className="font-heading text-base font-bold text-ink">
            {mode === "url"
              ? "Fix these on your current homepage"
              : "Prepare these before launch"}
          </h3>
          <ul className="mt-3 flex flex-col gap-2">
            {improvements.map((item, index) => (
              <li
                key={index}
                className="flex items-start gap-2.5 text-sm text-ink-soft"
              >
                <span
                  aria-hidden="true"
                  className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent-dark"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 rounded-xl bg-cream p-5">
        <h3 className="font-heading text-base font-bold text-ink">
          Suggested meta tags
        </h3>
        <dl className="mt-3 flex flex-col gap-3 text-sm">
          <div>
            <dt className="text-xs font-semibold tracking-wide text-ink-soft uppercase">
              Title ({seo.title.length} chars)
            </dt>
            <dd className="mt-1 text-ink">{seo.title}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold tracking-wide text-ink-soft uppercase">
              Description ({seo.metaDescription.length} chars)
            </dt>
            <dd className="mt-1 text-ink">{seo.metaDescription}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
