import GeneratorForm from "./components/GeneratorForm";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8 sm:mb-10">
        <p className="mb-3 font-heading text-sm font-medium tracking-wide text-brand">
          Digitalfeet
        </p>
        <div className="rounded-2xl bg-purple px-6 py-8 text-center shadow-sm sm:py-10">
          <h1 className="font-heading text-h1-m font-bold text-white sm:text-h2">
            AI Homepage Generator
          </h1>
        </div>
        <p className="mt-3 max-w-prose text-base text-ink-soft">
          Already have a site? We&apos;ll read its branding — colors, typefaces,
          and voice — and rebuild the homepage around it. Starting from scratch?
          Tell us about the business and we&apos;ll design one. No call required.
        </p>
      </header>

      <GeneratorForm
        bookingUrl={process.env.NEXT_PUBLIC_BOOKING_URL || "https://digitalfeet.com/contact"}
      />

      <footer className="mt-12 text-center">
        <p className="text-xs text-ink-soft">
          Built by Digitalfeet · Branding is read from your public homepage
        </p>
      </footer>
    </main>
  );
}
