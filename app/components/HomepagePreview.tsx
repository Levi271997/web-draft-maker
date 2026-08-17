import type { Recommendation } from "@/lib/types";
import { BLOCK_LIBRARY } from "@/lib/blocks";
import BlockRenderer from "./blocks/BlockRenderer";

/**
 * Assembles the recommendation into a homepage using the approved Digitalfeet
 * blocks, drawn in the palette and type pairing the model returned.
 */
export default function HomepagePreview({
  recommendation,
}: {
  recommendation: Recommendation;
}) {
  const { palette, typography, nav, blocks, brand } = recommendation;

  const fonts = {
    heading: `"${typography.headingFont}", "Ubuntu", Georgia, serif`,
    body: `"${typography.bodyFont}", "Inter", system-ui, sans-serif`,
  };

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
          Assembled from {blocks.length} approved Digitalfeet blocks, in your
          recommended palette and type pairing. Fonts fall back to system faces
          unless installed locally.
        </p>
      </div>

      <div
        className="overflow-hidden rounded-2xl shadow-sm ring-1 ring-gray-200"
        style={{ backgroundColor: palette.background, fontFamily: fonts.body }}
      >
        {/* Browser chrome */}
        <div className="flex items-center gap-1.5 border-b border-black/5 bg-gray-100 px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-red-400" />
          <span className="size-2.5 rounded-full bg-amber-400" />
          <span className="size-2.5 rounded-full bg-emerald-500" />
        </div>

        {/* Site nav */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4 sm:px-10"
          style={{
            backgroundColor: palette.surface,
            borderColor: `${palette.textMuted}1f`,
          }}
        >
          <span
            className="font-bold"
            style={{ fontFamily: fonts.heading, color: palette.primary }}
          >
            {brand.name}
          </span>
          <nav className="flex flex-wrap items-center gap-5">
            {nav.items.map((item) => (
              <span
                key={item}
                className="text-xs font-medium"
                style={{ color: palette.textMuted }}
              >
                {item}
              </span>
            ))}
            <span
              className="rounded-lg border px-3 py-1.5 text-xs font-semibold"
              style={{ borderColor: palette.primary, color: palette.primary }}
            >
              {nav.ctaLabel}
            </span>
          </nav>
        </div>

        {/* Blocks */}
        {blocks.map((block, index) => (
          <div
            key={`${block.blockType}-${index}`}
            style={
              // Alternate the ground so adjacent light blocks stay separated.
              index % 2 === 1 && block.variant !== "accent"
                ? { backgroundColor: palette.surface }
                : undefined
            }
          >
            <BlockRenderer block={block} palette={palette} fonts={fonts} />
          </div>
        ))}

        {/* Footer */}
        <div
          className="px-6 py-10 sm:px-10"
          style={{ backgroundColor: palette.primaryDark }}
        >
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p
                className="text-lg font-bold"
                style={{ fontFamily: fonts.heading, color: palette.surface }}
              >
                {brand.name}
              </p>
              <p className="mt-1 max-w-xs text-xs" style={{ color: `${palette.surface}b3` }}>
                {brand.summary.split(".")[0]}.
              </p>
            </div>
            <div className="flex flex-wrap gap-6">
              {nav.items.map((item) => (
                <span key={item} className="text-xs" style={{ color: `${palette.surface}cc` }}>
                  {item}
                </span>
              ))}
            </div>
          </div>
          <p
            className="mt-8 border-t pt-4 text-[11px]"
            style={{ borderColor: `${palette.surface}26`, color: `${palette.surface}99` }}
          >
            © {brand.name} · All Rights Reserved
          </p>
        </div>
      </div>

      {/* Block manifest */}
      <ul className="mt-4 flex flex-wrap gap-2">
        {blocks.map((block, index) => (
          <li
            key={`${block.blockType}-tag-${index}`}
            className="rounded-full bg-gray-100 px-3 py-1 text-xs text-ink-soft"
          >
            {index + 1}. {BLOCK_LIBRARY[block.blockType]?.label ?? block.blockType}
            <span className="text-gray-400"> · {block.variant}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
