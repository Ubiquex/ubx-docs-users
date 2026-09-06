import Link from "next/link";
import { PageShell } from "@ubx/docs-ui";
import { NAV, SECTIONS, PROVIDER_SITE, FOOTER } from "@/lib/site";

// The docs home is section cards, per UBI-247, matching the provider
// landing page's own card grid. Sections whose content has not been
// moved yet render dimmed and unlinked rather than being hidden: the
// shape of the finished site is visible from the first slice, and a
// reader is never sent to an empty page.
//
// NO TAB STRIP HERE, and search sits in the hero rather than the header.
// Both are home-page-only, and both are the shell rendering differently
// rather than a different component.
//
// The tab strip lists the six sections. So do the cards. On every other
// page the strip is the navigation and there are no cards, but on this
// one page it stated the same six destinations twice, once as a thin
// row of links and once as the page's actual content. The cards win:
// they carry a description and an icon, and this is the page whose job
// is to introduce the sections rather than move between them.
//
// Search moves into the hero for the same reason the provider landing
// page puts it there: on a page whose subject is "what is here", search
// is a primary affordance, not a tool tucked beside the theme toggle.
export default function Home() {
  return (
    <PageShell
      nav={NAV}
      searchPlaceholder="Search the docs"
      searchPlacement="hero"
      footer={FOOTER}
      intro={
        <>
          <h1 className="text-center text-4xl font-medium text-foreground">
            ubx <span className="text-primary">documentation</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-center leading-relaxed text-foreground-muted">
            Infrastructure change management through a proposal ledger. Start
            with Concepts to understand the model, or jump to the section you
            need.
          </p>
        </>
      }
    >
      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s) =>
          s.ready ? (
            <Link
              key={s.slug}
              href={`/${s.slug}`}
              className="rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-primary"
            >
              <div className="text-lg text-primary">{s.icon}</div>
              <div className="mt-2 font-medium text-foreground">{s.label}</div>
              <div className="mt-1 text-sm text-foreground-muted">
                {s.description}
              </div>
            </Link>
          ) : (
            <div
              key={s.slug}
              className="rounded-2xl border border-border bg-surface p-5 opacity-50"
              aria-disabled="true"
            >
              <div className="text-lg text-foreground-muted">{s.icon}</div>
              <div className="mt-2 font-medium text-foreground">{s.label}</div>
              <div className="mt-1 text-sm text-foreground-muted">
                {s.description}
              </div>
              <div className="mt-3 text-xs text-foreground-muted">
                Not yet moved
              </div>
            </div>
          ),
        )}

        <a
          href={PROVIDER_SITE.href}
          className="rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-primary"
        >
          <div className="text-lg text-primary">{PROVIDER_SITE.icon}</div>
          <div className="mt-2 font-medium text-foreground">
            {PROVIDER_SITE.label}
          </div>
          <div className="mt-1 text-sm text-foreground-muted">
            {PROVIDER_SITE.description}
          </div>
        </a>
      </div>
    </PageShell>
  );
}
