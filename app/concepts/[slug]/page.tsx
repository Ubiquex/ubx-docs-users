import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { DocSidebar } from "@/components/DocSidebar";
import { Mdx } from "@/components/Mdx";
import { NAV, TABS } from "@/lib/site";
import { getDoc, listDocs, listSectionSlugs } from "@/lib/content";

export function generateStaticParams() {
  return listSectionSlugs("concepts").map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/concepts/[slug]">) {
  const { slug } = await params;
  const doc = getDoc("concepts", slug);
  if (!doc) return {};
  return { title: `${doc.title} | ubx docs`, description: doc.description };
}

export default async function ConceptPage({ params }: PageProps<"/concepts/[slug]">) {
  const { slug } = await params;
  const doc = getDoc("concepts", slug);
  if (!doc) notFound();
  const docs = listDocs("concepts");

  return (
    <>
      <Header nav={NAV} tabs={TABS} activeTab="/concepts" />
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-10 px-6 py-10">
        <aside className="hidden w-64 shrink-0 lg:block">
          <DocSidebar docs={docs} section="concepts" />
        </aside>
        <main className="min-w-0 flex-1">
          <h1 className="text-2xl font-medium text-primary">{doc.title}</h1>
          {doc.description ? (
            <p className="mt-2 text-foreground-muted">{doc.description}</p>
          ) : null}
          <article className="mt-6 max-w-3xl">
            <Mdx source={doc.body} />
          </article>
        </main>
      </div>
    </>
  );
}
