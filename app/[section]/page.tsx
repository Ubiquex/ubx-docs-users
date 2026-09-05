import Link from "next/link";
import { notFound } from "next/navigation";
import { Header, GlobalSearch } from "@ubx/docs-ui";
import { NAV, TABS, SECTIONS } from "@/lib/site";
import { listDocs } from "@/lib/content";

// One route for every section. Replaces the per-section routes the first
// slice had: six sections with hand-written pages each would be six
// copies of the same list.
export function generateStaticParams() {
  return SECTIONS.filter((s) => s.ready).map((s) => ({ section: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[section]">) {
  const { section } = await params;
  const s = SECTIONS.find((x) => x.slug === section);
  return s ? { title: `${s.label} | ubx docs`, description: s.description } : {};
}

export default async function SectionIndex({ params }: PageProps<"/[section]">) {
  const { section } = await params;
  const meta = SECTIONS.find((s) => s.slug === section && s.ready);
  if (!meta) notFound();
  const docs = listDocs(section);

  return (
    <>
      <Header nav={NAV} tabs={TABS} activeTab={`/${section}`} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10">
        <h1 className="text-2xl font-medium text-primary">{meta.label}</h1>
        <p className="mt-2 max-w-2xl text-foreground-muted">{meta.description}</p>
        <div className="mt-6 max-w-md">
          <GlobalSearch
            placeholder="Search the docs"
            inputClassName="w-full rounded border border-border bg-field px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none"
          />
        </div>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {docs.map((d) => (
            <li key={d.slug}>
              <Link
                href={`/${section}/${d.slug}`}
                className="block rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-primary"
              >
                <div className="font-medium text-foreground">{d.title}</div>
                {d.description ? (
                  <div className="mt-1 text-sm text-foreground-muted">{d.description}</div>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
