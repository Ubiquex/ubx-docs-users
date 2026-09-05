import Link from "next/link";
import { Header } from "@/components/Header";
import { NAV, TABS } from "@/lib/site";
import { listDocs } from "@/lib/content";
import { GlobalSearch } from "@/components/GlobalSearch";

export const metadata = { title: "Concepts | ubx docs" };

export default function ConceptsIndex() {
  const docs = listDocs("concepts");
  return (
    <>
      <Header nav={NAV} tabs={TABS} activeTab="/concepts" />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10">
        <h1 className="text-2xl font-medium text-primary">Concepts</h1>
        <p className="mt-2 max-w-2xl text-foreground-muted">
          How ubx models infrastructure, and what each record actually
          guarantees.
        </p>
        <div className="mt-6 max-w-md">
          <GlobalSearch placeholder="Search the docs" />
        </div>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {docs.map((d) => (
            <li key={d.slug}>
              <Link
                href={`/concepts/${d.slug}`}
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
