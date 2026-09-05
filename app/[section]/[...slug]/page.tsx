import { notFound } from "next/navigation";
import { Header, MobileSidebarToggle } from "@ubx/docs-ui";
import { DocSidebar } from "@/components/DocSidebar";
import { Mdx } from "@/components/Mdx";
import { NAV, TABS, SECTIONS } from "@/lib/site";
import { getDoc, listDocs, listSectionSlugs } from "@/lib/content";

// Catch-all rather than a single [slug] segment. The migrated sections
// are nested (tutorial has 12 subdirectories) and all 313 internal links
// in the corpus are multi-segment, so the original URL shape is
// preserved exactly and none of those links needed rewriting.
export function generateStaticParams() {
  return SECTIONS.filter((s) => s.ready).flatMap((s) =>
    listSectionSlugs(s.slug).map((slug) => ({ section: s.slug, slug })),
  );
}

export async function generateMetadata({ params }: PageProps<"/[section]/[...slug]">) {
  const { section, slug } = await params;
  const doc = getDoc(section, slug);
  if (!doc) return {};
  return { title: `${doc.title} | ubx docs`, description: doc.description };
}

export default async function DocPage({ params }: PageProps<"/[section]/[...slug]">) {
  const { section, slug } = await params;
  if (!SECTIONS.some((s) => s.slug === section && s.ready)) notFound();
  const doc = getDoc(section, slug);
  if (!doc) notFound();
  const docs = listDocs(section);
  const sidebar = <DocSidebar docs={docs} section={section} />;

  return (
    <>
      <Header
        nav={NAV}
        tabs={TABS}
        activeTab={`/${section}`}
        mobileMenu={<MobileSidebarToggle>{sidebar}</MobileSidebarToggle>}
      />
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-10 px-6 py-10">
        <aside className="hidden w-64 shrink-0 lg:block">{sidebar}</aside>
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
