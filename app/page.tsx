import Link from "next/link";
import { Header } from "@ubx/docs-ui";
import { NAV, TABS, SECTIONS, PROVIDER_SITE } from "@/lib/site";

// The docs home is section cards, per UBI-247, matching the provider
// landing page's own card grid. Sections whose content has not been
// moved yet render dimmed and unlinked rather than being hidden: the
// shape of the finished site is visible from the first slice, and a
// reader is never sent to an empty page.
export default function Home() {
  return (
    <>
      <Header nav={NAV} tabs={TABS} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-12">
        <h1 className="text-2xl font-medium text-primary">ubx documentation</h1>
        <p className="mt-2 max-w-2xl text-foreground-muted">
          Infrastructure change management through a proposal ledger. Start with
          Concepts to understand the model, or jump to the section you need.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((s) =>
            s.ready ? (
              <Link
                key={s.slug}
                href={`/${s.slug}`}
                className="rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-primary"
              >
                <div className="text-lg text-primary">{s.icon}</div>
                <div className="mt-2 font-medium text-foreground">{s.label}</div>
                <div className="mt-1 text-sm text-foreground-muted">{s.description}</div>
              </Link>
            ) : (
              <div
                key={s.slug}
                className="rounded-2xl border border-border bg-surface p-5 opacity-50"
                aria-disabled="true"
              >
                <div className="text-lg text-foreground-muted">{s.icon}</div>
                <div className="mt-2 font-medium text-foreground">{s.label}</div>
                <div className="mt-1 text-sm text-foreground-muted">{s.description}</div>
                <div className="mt-3 text-xs text-foreground-muted">Not yet moved</div>
              </div>
            ),
          )}

          <a
            href={PROVIDER_SITE.href}
            className="rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-primary"
          >
            <div className="text-lg text-primary">{PROVIDER_SITE.icon}</div>
            <div className="mt-2 font-medium text-foreground">{PROVIDER_SITE.label}</div>
            <div className="mt-1 text-sm text-foreground-muted">{PROVIDER_SITE.description}</div>
          </a>
        </div>
      </main>
    </>
  );
}
