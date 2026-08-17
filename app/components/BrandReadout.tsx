import type { BrandSummary, GenerateMode, Recommendation } from "@/lib/types";

type Props = {
  mode: GenerateMode;
  brand: BrandSummary;
  recommendation: Recommendation;
};

const PALETTE_ROLES = [
  { key: "primary", label: "Primary" },
  { key: "primaryDark", label: "Primary dark" },
  { key: "accent", label: "Accent" },
  { key: "background", label: "Background" },
  { key: "surface", label: "Surface" },
  { key: "text", label: "Text" },
  { key: "textMuted", label: "Muted text" },
] as const;

export default function BrandReadout({ mode, brand, recommendation }: Props) {
  const { palette, typography } = recommendation;
  const fromUrl = mode === "url";

  let host = brand.finalUrl;
  try {
    host = new URL(brand.finalUrl).hostname.replace(/^www\./, "");
  } catch {
    /* keep the raw string if it won't parse */
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 sm:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1 font-heading text-xs font-medium tracking-wide text-brand uppercase">
            Step 1 · {fromUrl ? "What we detected" : "The identity we designed"}
          </p>
          <h2 className="font-heading text-h3-m font-bold text-ink sm:text-h4">
            {recommendation.brand.name}
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            {fromUrl && host ? `${host} · ` : ""}
            {recommendation.brand.industry}
          </p>
        </div>
        {brand.logo && (
          // Remote host is arbitrary and unknown at build time, so a plain
          // <img> is correct here rather than next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={brand.logo}
            alt=""
            className="h-12 max-w-[140px] shrink-0 object-contain"
          />
        )}
      </div>

      <p className="max-w-prose text-base text-ink-soft">
        {recommendation.brand.summary}
      </p>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-cream p-4">
          <dt className="text-xs font-semibold tracking-wide text-ink-soft uppercase">
            Brand voice
          </dt>
          <dd className="mt-1 font-heading text-base font-medium text-ink">
            {recommendation.brand.voice}
          </dd>
        </div>
        <div className="rounded-xl bg-cream p-4">
          <dt className="text-xs font-semibold tracking-wide text-ink-soft uppercase">
            Type pairing
          </dt>
          <dd className="mt-1 font-heading text-base font-medium text-ink">
            {typography.headingFont} + {typography.bodyFont}
          </dd>
          <dd className="mt-1 text-xs text-ink-soft">{typography.rationale}</dd>
        </div>
      </dl>

      {fromUrl && brand.colors.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-2 text-xs font-semibold tracking-wide text-ink-soft uppercase">
            Colors found on your site
          </h3>
          <ul className="flex flex-wrap gap-2">
            {brand.colors.slice(0, 10).map((color) => (
              <li
                key={color}
                className="flex items-center gap-2 rounded-full bg-gray-100 py-1 pr-3 pl-1"
              >
                <span
                  className="size-5 rounded-full ring-1 ring-black/10"
                  style={{ backgroundColor: color }}
                />
                <code className="font-mono text-xs text-ink-soft">{color}</code>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6">
        <h3 className="mb-2 text-xs font-semibold tracking-wide text-ink-soft uppercase">
          {fromUrl ? "Recommended palette" : "Your new palette"}
        </h3>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PALETTE_ROLES.map(({ key, label }) => (
            <li
              key={key}
              className="overflow-hidden rounded-xl ring-1 ring-gray-200"
            >
              <span
                className="block h-14 w-full"
                style={{ backgroundColor: palette[key] }}
              />
              <span className="block bg-white px-2 py-2">
                <span className="block text-xs font-semibold text-ink">
                  {label}
                </span>
                <code className="block font-mono text-xs text-ink-soft">
                  {palette[key]}
                </code>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 max-w-prose text-sm text-ink-soft">
          {palette.rationale}
        </p>
      </div>

      {fromUrl && brand.fonts.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-2 text-xs font-semibold tracking-wide text-ink-soft uppercase">
            Typefaces found on your site
          </h3>
          <p className="text-sm text-ink-soft">{brand.fonts.join(" · ")}</p>
        </div>
      )}
    </section>
  );
}
