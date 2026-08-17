import type { Block, BlockItem, Palette } from "@/lib/types";

/**
 * Renders one approved Digitalfeet block in the target brand's palette.
 * Layouts follow the signed-off Elementor template set: eyebrow above a serif
 * heading, supporting line, filled + outline button pair, and the element
 * arrangement each block is known for.
 */

type Fonts = { heading: string; body: string };

type Props = {
  block: Block;
  palette: Palette;
  fonts: Fonts;
};

/* ------------------------------------------------------------------ *
 * Shared primitives
 * ------------------------------------------------------------------ */

/** The checkerboard image placeholder used throughout the template set. */
function Placeholder({
  className = "",
  ratio = "aspect-[4/3]",
}: {
  className?: string;
  ratio?: string;
}) {
  return (
    <div
      className={`${ratio} w-full ${className}`}
      style={{
        backgroundColor: "#fafafa",
        backgroundImage:
          "linear-gradient(45deg,#e8e8e8 25%,transparent 25%),linear-gradient(-45deg,#e8e8e8 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e8e8e8 75%),linear-gradient(-45deg,transparent 75%,#e8e8e8 75%)",
        backgroundSize: "28px 28px",
        backgroundPosition: "0 0,0 14px,14px -14px,-14px 0",
      }}
    />
  );
}

function Eyebrow({ children, palette }: { children: string; palette: Palette }) {
  if (!children) return null;
  return (
    <p
      className="mb-2 text-xs font-semibold tracking-wide"
      style={{ color: palette.accent }}
    >
      {children}
    </p>
  );
}

function Heading({
  children,
  palette,
  fonts,
  size = "lg",
  onDark = false,
}: {
  children: string;
  palette: Palette;
  fonts: Fonts;
  size?: "xl" | "lg" | "md";
  onDark?: boolean;
}) {
  const cls =
    size === "xl"
      ? "text-3xl sm:text-4xl"
      : size === "lg"
        ? "text-2xl sm:text-3xl"
        : "text-xl";
  return (
    <h3
      className={`${cls} leading-tight font-bold`}
      style={{
        fontFamily: fonts.heading,
        color: onDark ? palette.surface : palette.text,
      }}
    >
      {children}
    </h3>
  );
}

function Body({
  children,
  palette,
  onDark = false,
  className = "",
}: {
  children: string;
  palette: Palette;
  onDark?: boolean;
  className?: string;
}) {
  if (!children) return null;
  return (
    <p
      className={`text-sm leading-relaxed ${className}`}
      style={{ color: onDark ? `${palette.surface}cc` : palette.textMuted }}
    >
      {children}
    </p>
  );
}

function Buttons({
  block,
  palette,
  align = "left",
  onDark = false,
}: {
  block: Block;
  palette: Palette;
  align?: "left" | "center";
  onDark?: boolean;
}) {
  if (!block.primaryCta && !block.secondaryCta) return null;
  return (
    <div
      className={`mt-6 flex flex-wrap items-center gap-3 ${
        align === "center" ? "justify-center" : ""
      }`}
    >
      {block.primaryCta && (
        <span
          className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold"
          style={{
            backgroundColor: onDark ? palette.surface : palette.primary,
            color: onDark ? palette.primaryDark : palette.surface,
          }}
        >
          {block.primaryCta}
          <Arrow color={onDark ? palette.primaryDark : palette.surface} />
        </span>
      )}
      {block.secondaryCta && (
        <span
          className="inline-flex items-center rounded-lg border px-5 py-2.5 text-sm font-semibold"
          style={{
            borderColor: onDark ? palette.surface : palette.primary,
            color: onDark ? palette.surface : palette.text,
            backgroundColor: onDark ? "transparent" : palette.surface,
          }}
        >
          {block.secondaryCta}
        </span>
      )}
    </div>
  );
}

function Arrow({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12h14m-6-6 6 6-6 6"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Check({ palette }: { palette: Palette }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      className="mt-0.5 shrink-0"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="11" fill={palette.primary} />
      <path
        d="m7.5 12.5 3 3 6-6.5"
        stroke="#fff"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function Stars({ rating, palette }: { rating: string; palette: Palette }) {
  const n = Math.max(1, Math.min(5, parseInt(rating, 10) || 5));
  return (
    <div className="mb-3 flex gap-0.5" aria-label={`${n} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 2.5l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.6 6.1 20.7l1.2-6.6-4.8-4.6 6.6-.9z"
            fill={i < n ? palette.accent : "#d9d9d9"}
          />
        </svg>
      ))}
    </div>
  );
}

/** Eyebrow + heading + body, centred — the template set's standard section head. */
function SectionHead({
  block,
  palette,
  fonts,
  align = "center",
  onDark = false,
}: Props & { align?: "center" | "left"; onDark?: boolean }) {
  const centered = align === "center";
  return (
    <div className={centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <Eyebrow palette={palette}>{block.eyebrow}</Eyebrow>
      <Heading palette={palette} fonts={fonts} size="lg" onDark={onDark}>
        {block.headline}
      </Heading>
      <Body palette={palette} onDark={onDark} className="mt-3">
        {block.body}
      </Body>
      <div className={centered ? "flex justify-center" : ""}>
        <Buttons block={block} palette={palette} align={align} onDark={onDark} />
      </div>
    </div>
  );
}

function Card({
  children,
  palette,
  className = "",
}: {
  children: React.ReactNode;
  palette: Palette;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border p-5 ${className}`}
      style={{ backgroundColor: palette.surface, borderColor: `${palette.textMuted}26` }}
    >
      {children}
    </div>
  );
}

function gridCols(variant: string, fallback = 3) {
  if (variant === "grid-2") return "sm:grid-cols-2";
  if (variant === "grid-3") return "sm:grid-cols-3";
  return fallback === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3";
}

/* ------------------------------------------------------------------ *
 * Blocks
 * ------------------------------------------------------------------ */

function HeroBlock({ block, palette, fonts }: Props) {
  if (block.variant === "centered") {
    return (
      <div className="px-6 py-14 text-center sm:px-10">
        <Eyebrow palette={palette}>{block.eyebrow}</Eyebrow>
        <h2
          className="mx-auto max-w-3xl text-4xl leading-tight font-bold sm:text-5xl"
          style={{ fontFamily: fonts.heading, color: palette.text }}
        >
          {block.headline}
        </h2>
        <p
          className="mx-auto mt-4 max-w-xl text-base"
          style={{ color: palette.textMuted }}
        >
          {block.body}
        </p>
        <div className="flex justify-center">
          <Buttons block={block} palette={palette} align="center" />
        </div>
        <div className="mt-10">
          <Placeholder ratio="aspect-[16/7]" className="rounded-xl" />
        </div>
      </div>
    );
  }

  const imageFirst = block.variant === "split-left";
  return (
    <div className="grid items-center gap-8 px-6 py-14 sm:px-10 md:grid-cols-2">
      <div className={imageFirst ? "md:order-2" : ""}>
        <Eyebrow palette={palette}>{block.eyebrow}</Eyebrow>
        <h2
          className="text-3xl leading-tight font-bold sm:text-4xl"
          style={{ fontFamily: fonts.heading, color: palette.text }}
        >
          {block.headline}
        </h2>
        <Body palette={palette} className="mt-4">
          {block.body}
        </Body>
        {block.items.length > 0 && (
          <ul className="mt-5 flex flex-col gap-2">
            {block.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: palette.text }}>
                <Check palette={palette} />
                {item.title}
              </li>
            ))}
          </ul>
        )}
        <Buttons block={block} palette={palette} />
      </div>
      <div className={imageFirst ? "md:order-1" : ""}>
        <Placeholder ratio="aspect-[4/3]" className="rounded-xl" />
      </div>
    </div>
  );
}

function LogosBlock({ block, palette, fonts }: Props) {
  return (
    <div className="px-6 py-12 sm:px-10">
      <SectionHead block={block} palette={palette} fonts={fonts} />
      <div className="mt-8 grid grid-cols-3 items-center gap-6 sm:grid-cols-6">
        {block.items.map((item, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <Placeholder ratio="aspect-[3/2]" className="rounded" />
            <span className="text-[11px]" style={{ color: palette.textMuted }}>
              {item.title}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-center gap-1.5">
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className="size-1.5 rounded-full"
            style={{ backgroundColor: i === 0 ? palette.primary : `${palette.primary}59` }}
          />
        ))}
      </div>
    </div>
  );
}

function FeaturesBlock({ block, palette, fonts }: Props) {
  const cards = block.variant === "cards";
  const centered = block.variant === "centered";

  return (
    <div className="px-6 py-14 sm:px-10">
      <SectionHead block={block} palette={palette} fonts={fonts} />
      <div className={`mt-10 grid gap-6 ${gridCols(block.variant)}`}>
        {block.items.map((item, i) => {
          const inner = (
            <>
              <Placeholder ratio="aspect-square" className={`mb-4 !w-12 rounded ${centered ? "mx-auto" : ""}`} />
              <h4
                className="text-lg font-semibold"
                style={{ fontFamily: fonts.heading, color: palette.text }}
              >
                {item.title}
              </h4>
              <Body palette={palette} className="mt-1.5">
                {item.description}
              </Body>
              <span
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium"
                style={{ color: palette.text }}
              >
                Learn More <Arrow color={palette.text} />
              </span>
            </>
          );
          return cards ? (
            <Card key={i} palette={palette}>
              {inner}
            </Card>
          ) : (
            <div key={i} className={centered ? "text-center" : ""}>
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ContentBlock({ block, palette, fonts }: Props) {
  const accent = block.variant === "accent";
  const imageFirst = block.variant === "split-left";

  const copy = (
    <div>
      <Eyebrow palette={palette}>{block.eyebrow}</Eyebrow>
      <Heading palette={palette} fonts={fonts} size="lg" onDark={accent}>
        {block.headline}
      </Heading>
      <Body palette={palette} onDark={accent} className="mt-3">
        {block.body}
      </Body>
      {block.items.length > 0 && (
        <ul className="mt-5 flex flex-col gap-2">
          {block.items.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-2.5 text-sm"
              style={{ color: accent ? palette.surface : palette.text }}
            >
              <Check palette={palette} />
              {item.title}
            </li>
          ))}
        </ul>
      )}
      <Buttons block={block} palette={palette} onDark={accent} />
    </div>
  );

  if (accent) {
    return (
      <div className="px-6 py-14 sm:px-10">
        <div
          className="grid items-center gap-8 rounded-2xl p-8 md:grid-cols-2"
          style={{ backgroundColor: palette.primary }}
        >
          {copy}
          <Placeholder ratio="aspect-[4/3]" className="rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid items-center gap-8 px-6 py-14 sm:px-10 md:grid-cols-2">
      <div className={imageFirst ? "md:order-2" : ""}>{copy}</div>
      <div className={imageFirst ? "md:order-1" : ""}>
        <Placeholder ratio="aspect-[4/3]" className="rounded-xl" />
      </div>
    </div>
  );
}

function StatsBlock({ block, palette, fonts }: Props) {
  const onAccent = block.variant === "accent";
  const split = block.variant === "split-left";

  const figures = (
    <div className={`grid gap-6 ${split ? "sm:grid-cols-2" : "sm:grid-cols-4"}`}>
      {block.items.map((item, i) => (
        <div key={i}>
          <p
            className="text-3xl font-bold"
            style={{ color: onAccent ? palette.surface : palette.primary }}
          >
            {item.value}
          </p>
          <p
            className="mt-1 text-sm font-semibold"
            style={{ color: onAccent ? palette.surface : palette.text }}
          >
            {item.title}
          </p>
          <Body palette={palette} onDark={onAccent} className="mt-1 !text-xs">
            {item.description}
          </Body>
        </div>
      ))}
    </div>
  );

  if (split) {
    return (
      <div className="grid items-center gap-8 px-6 py-14 sm:px-10 md:grid-cols-2">
        <div>
          <SectionHead block={block} palette={palette} fonts={fonts} align="left" />
          <div className="mt-8">{figures}</div>
        </div>
        <Placeholder ratio="aspect-[4/3]" className="rounded-xl" />
      </div>
    );
  }

  return (
    <div
      className="px-6 py-14 sm:px-10"
      style={onAccent ? { backgroundColor: palette.primary } : undefined}
    >
      <SectionHead block={block} palette={palette} fonts={fonts} onDark={onAccent} />
      <div className="mt-10">{figures}</div>
    </div>
  );
}

function StepsBlock({ block, palette, fonts }: Props) {
  const cards = block.variant === "cards";
  const minimal = block.variant === "minimal";

  return (
    <div className="px-6 py-14 sm:px-10">
      <SectionHead block={block} palette={palette} fonts={fonts} />
      <div className={`mt-10 grid gap-6 ${gridCols(block.variant)}`}>
        {block.items.map((item, i) => {
          const number = item.value || String(i + 1).padStart(2, "0");

          // The "minimal" template puts the numeral under the copy, on a rule.
          const inner = minimal ? (
            <>
              {item.title && (
                <h4 className="text-lg font-semibold" style={{ fontFamily: fonts.heading, color: palette.text }}>
                  {item.title}
                </h4>
              )}
              <Body palette={palette} className="mt-1.5">
                {item.description}
              </Body>
              <div
                className="mt-4 flex items-center justify-between border-t pt-3"
                style={{ borderColor: `${palette.textMuted}33` }}
              >
                <span className="text-lg font-bold" style={{ color: palette.primary }}>
                  {number}
                </span>
                <Arrow color={palette.primary} />
              </div>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold" style={{ color: palette.primary }}>
                {number}
              </p>
              {item.title && (
                <h4
                  className="mt-2 text-base font-semibold"
                  style={{ fontFamily: fonts.heading, color: palette.text }}
                >
                  {item.title}
                </h4>
              )}
              <Body palette={palette} className="mt-1.5">
                {item.description}
              </Body>
            </>
          );

          return cards ? (
            <Card key={i} palette={palette}>
              {inner}
            </Card>
          ) : (
            <div key={i}>{inner}</div>
          );
        })}
      </div>
    </div>
  );
}

function TestimonialsBlock({ block, palette, fonts }: Props) {
  const centered = block.variant === "centered";

  if (centered && block.items[0]) {
    const t = block.items[0];
    return (
      <div className="px-6 py-14 sm:px-10">
        <SectionHead block={block} palette={palette} fonts={fonts} />
        <div
          className="mt-10 rounded-2xl px-8 py-10 text-center"
          style={{ backgroundColor: `${palette.primary}14` }}
        >
          <p className="mx-auto max-w-2xl text-lg" style={{ color: palette.text }}>
            &ldquo;{t.description}&rdquo;
          </p>
          <div className="mt-6">
            <div
              className="mx-auto size-10 rounded"
              style={{ backgroundColor: `${palette.primary}33` }}
            />
            <p className="mt-2 text-sm font-semibold" style={{ color: palette.text }}>
              {t.title}
            </p>
            <p className="text-xs" style={{ color: palette.textMuted }}>
              {t.meta}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-14 sm:px-10">
      <SectionHead block={block} palette={palette} fonts={fonts} />
      <div className={`mt-10 grid gap-6 ${gridCols(block.variant)}`}>
        {block.items.map((item, i) => (
          <Card key={i} palette={palette}>
            <Stars rating={item.value} palette={palette} />
            <p className="text-sm leading-relaxed" style={{ color: palette.text }}>
              &ldquo;{item.description}&rdquo;
            </p>
            <div className="mt-5 flex items-center gap-3">
              <div
                className="size-9 shrink-0 rounded"
                style={{ backgroundColor: `${palette.primary}2e` }}
              />
              <div>
                <p className="text-sm font-semibold" style={{ color: palette.text }}>
                  {item.title}
                </p>
                <p className="text-xs" style={{ color: palette.textMuted }}>
                  {item.meta}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PricingBlock({ block, palette, fonts }: Props) {
  return (
    <div className="px-6 py-14 sm:px-10">
      <SectionHead block={block} palette={palette} fonts={fonts} />
      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {block.items.map((item, i) => {
          const featured = block.items.length === 3 && i === 1;
          return (
            <div
              key={i}
              className="rounded-xl border p-6"
              style={{
                backgroundColor: featured ? `${palette.primary}0f` : palette.surface,
                borderColor: featured ? palette.primary : `${palette.textMuted}26`,
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold" style={{ color: palette.accent }}>
                  {item.title}
                </p>
                {featured && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase"
                    style={{ backgroundColor: palette.accent, color: palette.text }}
                  >
                    Best plan
                  </span>
                )}
              </div>
              <p className="mt-2 flex items-baseline gap-1.5">
                <span className="text-3xl font-bold" style={{ color: palette.primary }}>
                  {item.value}
                </span>
                <span className="text-xs" style={{ color: palette.textMuted }}>
                  {item.meta}
                </span>
              </p>
              <Body palette={palette} className="mt-3">
                {item.description}
              </Body>
              {item.bullets.length > 0 && (
                <ul
                  className="mt-4 flex flex-col gap-2 border-t pt-4"
                  style={{ borderColor: `${palette.textMuted}26` }}
                >
                  {item.bullets.map((b, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs" style={{ color: palette.text }}>
                      <Check palette={palette} />
                      {b}
                    </li>
                  ))}
                </ul>
              )}
              <span
                className="mt-5 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold"
                style={{ backgroundColor: palette.primary, color: palette.surface }}
              >
                {block.primaryCta || "Learn More"}
                <Arrow color={palette.surface} />
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FaqBlock({ block, palette, fonts }: Props) {
  const accordions = (
    <div className={`grid gap-3 ${block.variant === "grid-2" ? "sm:grid-cols-2" : ""}`}>
      {block.items.map((item, i) => (
        <div
          key={i}
          className="rounded-lg border px-4 py-3.5"
          style={{ backgroundColor: palette.surface, borderColor: `${palette.textMuted}26` }}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-semibold" style={{ color: palette.text }}>
              {item.title}
            </p>
            <span className="text-lg leading-none" style={{ color: palette.primary }}>
              {i === 0 ? "−" : "+"}
            </span>
          </div>
          {i === 0 && (
            <Body palette={palette} className="mt-2">
              {item.description}
            </Body>
          )}
        </div>
      ))}
    </div>
  );

  if (block.variant === "split-left") {
    return (
      <div className="grid gap-8 px-6 py-14 sm:px-10 md:grid-cols-2">
        <SectionHead block={block} palette={palette} fonts={fonts} align="left" />
        <div>{accordions}</div>
      </div>
    );
  }

  return (
    <div className="px-6 py-14 sm:px-10">
      <SectionHead block={block} palette={palette} fonts={fonts} />
      <div className="mt-10">{accordions}</div>
    </div>
  );
}

function TeamBlock({ block, palette, fonts }: Props) {
  const cards = block.variant === "cards";
  return (
    <div className="px-6 py-14 sm:px-10">
      <SectionHead block={block} palette={palette} fonts={fonts} />
      <div className="mt-10 grid gap-6 sm:grid-cols-4">
        {block.items.map((item, i) => {
          const inner = (
            <>
              <Placeholder ratio="aspect-square" className="rounded" />
              <p
                className="mt-3 text-base font-semibold"
                style={{ fontFamily: fonts.heading, color: palette.text }}
              >
                {item.title}
              </p>
              <p className="text-xs" style={{ color: palette.textMuted }}>
                {item.meta}
              </p>
            </>
          );
          return cards ? (
            <Card key={i} palette={palette} className="text-center">
              {inner}
            </Card>
          ) : (
            <div key={i} className="text-center">
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BlogsBlock({ block, palette, fonts }: Props) {
  const cards = block.variant === "cards";
  return (
    <div className="px-6 py-14 sm:px-10">
      <SectionHead block={block} palette={palette} fonts={fonts} />
      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {block.items.map((item, i) => {
          const inner = (
            <>
              <Placeholder ratio="aspect-[4/3]" className="rounded" />
              <div className="mt-3 flex items-center gap-2">
                <span
                  className="rounded px-2 py-0.5 text-[11px] font-medium"
                  style={{ backgroundColor: `${palette.primary}1f`, color: palette.text }}
                >
                  {item.meta}
                </span>
                <span className="text-[11px]" style={{ color: palette.textMuted }}>
                  {item.value}
                </span>
              </div>
              <h4
                className="mt-2 text-base font-semibold"
                style={{ fontFamily: fonts.heading, color: palette.text }}
              >
                {item.title}
              </h4>
              <Body palette={palette} className="mt-1.5">
                {item.description}
              </Body>
            </>
          );
          return cards ? (
            <Card key={i} palette={palette}>
              {inner}
            </Card>
          ) : (
            <div key={i}>{inner}</div>
          );
        })}
      </div>
    </div>
  );
}

const FORM_FIELDS = [
  { label: "Name", placeholder: "e.g: John Doe" },
  { label: "Email", placeholder: "you@email.com" },
  { label: "Phone", placeholder: "(123) 456 - 7890" },
  { label: "Company", placeholder: "Company name" },
  { label: "Message", placeholder: "Type your message here..." },
];

function ContactForm({ block, palette }: { block: Block; palette: Palette }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ backgroundColor: `${palette.primary}0f` }}
    >
      <div className="flex flex-col gap-2.5">
        {FORM_FIELDS.map((f) => (
          <div
            key={f.label}
            className="rounded-lg px-3 py-2"
            style={{ backgroundColor: palette.surface }}
          >
            <p className="text-[10px]" style={{ color: palette.textMuted }}>
              {f.label}
            </p>
            <p className="text-sm" style={{ color: palette.textMuted }}>
              {f.placeholder}
            </p>
          </div>
        ))}
      </div>
      <span
        className="mt-4 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold"
        style={{ backgroundColor: palette.primary, color: palette.surface }}
      >
        {block.primaryCta || "Get in touch"}
        <Arrow color={palette.surface} />
      </span>
    </div>
  );
}

function ContactBlock({ block, palette, fonts }: Props) {
  const formFirst = block.variant === "split-left";

  const copy = (
    <div>
      <Eyebrow palette={palette}>{block.eyebrow}</Eyebrow>
      <Heading palette={palette} fonts={fonts} size="lg">
        {block.headline}
      </Heading>
      <Body palette={palette} className="mt-3">
        {block.body}
      </Body>
      {block.items.length > 0 && (
        <ul className="mt-5 flex flex-col gap-2">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: palette.text }}>
              <Check palette={palette} />
              {item.title}
            </li>
          ))}
        </ul>
      )}
      {block.secondaryCta && (
        <div className="mt-6">
          <span
            className="inline-flex items-center rounded-lg border px-5 py-2.5 text-sm font-semibold"
            style={{ borderColor: palette.primary, color: palette.text }}
          >
            {block.secondaryCta}
          </span>
        </div>
      )}
    </div>
  );

  if (block.variant === "centered") {
    return (
      <div className="px-6 py-14 sm:px-10">
        <div className="mx-auto max-w-lg">
          {copy}
          <div className="mt-6">
            <ContactForm block={block} palette={palette} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid items-center gap-8 px-6 py-14 sm:px-10 md:grid-cols-2">
      <div className={formFirst ? "md:order-2" : ""}>{copy}</div>
      <div className={formFirst ? "md:order-1" : ""}>
        <ContactForm block={block} palette={palette} />
      </div>
    </div>
  );
}

function CtaBlock({ block, palette, fonts }: Props) {
  const onAccent = block.variant === "accent";

  if (block.variant === "split-right") {
    return (
      <div className="grid items-center gap-8 px-6 py-14 sm:px-10 md:grid-cols-2">
        <div>
          <Eyebrow palette={palette}>{block.eyebrow}</Eyebrow>
          <Heading palette={palette} fonts={fonts} size="lg">
            {block.headline}
          </Heading>
          <Body palette={palette} className="mt-3">
            {block.body}
          </Body>
          <div className="mt-6 flex flex-wrap gap-2">
            <span
              className="rounded-lg px-4 py-2.5 text-sm"
              style={{ backgroundColor: `${palette.primary}14`, color: palette.textMuted }}
            >
              Enter your Email Address
            </span>
            <span
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold"
              style={{ backgroundColor: palette.primary, color: palette.surface }}
            >
              {block.primaryCta || "Get Started"}
              <Arrow color={palette.surface} />
            </span>
          </div>
          {block.items[0]?.title && (
            <p className="mt-3 flex items-center gap-2 text-xs" style={{ color: palette.textMuted }}>
              <Check palette={palette} />
              {block.items[0].title}
            </p>
          )}
        </div>
        <Placeholder ratio="aspect-[4/3]" className="rounded-xl" />
      </div>
    );
  }

  return (
    <div
      className="px-6 py-14 text-center sm:px-10"
      style={onAccent ? { backgroundColor: palette.primary } : undefined}
    >
      <Eyebrow palette={palette}>{block.eyebrow}</Eyebrow>
      <Heading palette={palette} fonts={fonts} size="lg" onDark={onAccent}>
        {block.headline}
      </Heading>
      <div className="mx-auto max-w-xl">
        <Body palette={palette} onDark={onAccent} className="mt-3">
          {block.body}
        </Body>
      </div>
      <div className="flex justify-center">
        <Buttons block={block} palette={palette} align="center" onDark={onAccent} />
      </div>
      {block.items[0]?.title && (
        <p
          className="mt-4 text-xs"
          style={{ color: onAccent ? `${palette.surface}cc` : palette.textMuted }}
        >
          {block.items[0].title}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Dispatcher
 * ------------------------------------------------------------------ */

const RENDERERS: Record<Block["blockType"], (p: Props) => React.ReactElement> = {
  hero: HeroBlock,
  logos: LogosBlock,
  features: FeaturesBlock,
  content: ContentBlock,
  stats: StatsBlock,
  steps: StepsBlock,
  testimonials: TestimonialsBlock,
  pricing: PricingBlock,
  faq: FaqBlock,
  team: TeamBlock,
  blogs: BlogsBlock,
  contact: ContactBlock,
  cta: CtaBlock,
};

export default function BlockRenderer(props: Props) {
  const Renderer = RENDERERS[props.block.blockType];
  if (!Renderer) return null;
  return <Renderer {...props} />;
}

export type { BlockItem };
