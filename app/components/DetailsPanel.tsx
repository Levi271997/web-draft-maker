"use client";

import { LANGUAGES, type Facts } from "@/lib/facts";

/**
 * The facts the page is allowed to state.
 *
 * Everything is optional, and the copy says so — but the note about what a
 * blank field means is the important part. Left empty, the page omits the
 * detail rather than inventing one, which is the opposite of what it used to do.
 */

const FIELD =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/25 disabled:bg-gray-50 disabled:text-gray-400";

export default function DetailsPanel({
  value,
  onChange,
  disabled,
}: {
  value: Facts;
  onChange: (next: Facts) => void;
  disabled?: boolean;
}) {
  function set<K extends keyof Facts>(key: K, next: Facts[K]) {
    onChange({ ...value, [key]: next });
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="rounded-xl bg-cream px-4 py-3 text-xs text-ink-soft">
        <span className="font-semibold text-ink">All optional — but read this.</span>{" "}
        Whatever you leave blank, we leave off the page. We won&apos;t invent a
        phone number, a rating or a certification to fill the gap, so anything
        you give us here is the difference between a real page and a
        good-looking mock-up.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="f-phone" className="mb-1.5 block text-sm font-semibold text-ink">
            Phone number
          </label>
          <input
            id="f-phone"
            type="text"
            inputMode="tel"
            autoComplete="tel"
            value={value.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="e.g. 55 12 34 56"
            disabled={disabled}
            className={FIELD}
          />
        </div>

        <div>
          <label htmlFor="f-email" className="mb-1.5 block text-sm font-semibold text-ink">
            Email address
          </label>
          <input
            id="f-email"
            type="text"
            inputMode="email"
            autoComplete="email"
            spellCheck={false}
            value={value.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="e.g. post@yourbusiness.no"
            disabled={disabled}
            className={FIELD}
          />
        </div>
      </div>

      <div>
        <label htmlFor="f-area" className="mb-1.5 block text-sm font-semibold text-ink">
          Where are you, or where do you cover?
        </label>
        <input
          id="f-area"
          type="text"
          value={value.area}
          onChange={(e) => set("area", e.target.value)}
          placeholder="e.g. Bergen and the surrounding area"
          disabled={disabled}
          className={FIELD}
        />
        <p className="mt-1.5 text-xs text-ink-soft">
          This is also what gets you found by people searching locally.
        </p>
      </div>

      <div>
        <label htmlFor="f-hours" className="mb-1.5 block text-sm font-semibold text-ink">
          Opening hours
        </label>
        <textarea
          id="f-hours"
          rows={2}
          value={value.hours}
          onChange={(e) => set("hours", e.target.value)}
          placeholder="e.g. Mon–Fri 8–16, Sat 10–14, closed Sunday"
          disabled={disabled}
          className={`${FIELD} resize-y`}
        />
      </div>

      <div>
        <label htmlFor="f-proof" className="mb-1.5 block text-sm font-semibold text-ink">
          What makes people trust you?
        </label>
        <textarea
          id="f-proof"
          rows={3}
          value={value.proof}
          onChange={(e) => set("proof", e.target.value)}
          placeholder="e.g. 20 years in business, certified installer, 4.8 from 160 Google reviews, 12 staff"
          disabled={disabled}
          className={`${FIELD} resize-y`}
        />
        <p className="mt-1.5 text-xs text-ink-soft">
          Years trading, certifications, ratings, awards, how many customers.
          Only things that are actually true — these go on the page as stated
          fact.
        </p>
      </div>

      <div>
        <label htmlFor="f-language" className="mb-1.5 block text-sm font-semibold text-ink">
          What language should the page be in?
        </label>
        <select
          id="f-language"
          value={value.language}
          onChange={(e) => set("language", e.target.value)}
          disabled={disabled}
          className={FIELD}
        >
          {LANGUAGES.map((language) => (
            <option key={language.id} value={language.id}>
              {language.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
