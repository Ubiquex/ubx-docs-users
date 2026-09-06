import { notFound } from "next/navigation";
import { PageShell } from "@ubx/docs-ui";
import { DocSidebar } from "@/components/DocSidebar";
import { Mdx } from "@/components/Mdx";
import { NAV, SECTIONS, FOOTER } from "@/lib/site";
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

export async function generateMetadata({
  params,
}: PageProps<"/[section]/[...slug]">) {
  const { section, slug } = await params;
  const doc = getDoc(section, slug);
  if (!doc) return {};
  return { title: `${doc.title} | ubx docs`, description: doc.description };
}

export default async function DocPage({
  params,
}: PageProps<"/[section]/[...slug]">) {
  const { section, slug } = await params;
  if (!SECTIONS.some((s) => s.slug === section && s.ready)) notFound();
  const doc = getDoc(section, slug);
  if (!doc) notFound();
  const docs = listDocs(section);

  // The header, the sidebar rail and the footer are PageShell's, not
  // this page's. This file used to write out the rail itself, in markup
  // near-identical to the provider site's own copy of the same thing,
  // which is how the two drifted apart while nominally sharing a UI.
  return (
    <PageShell
      nav={NAV}
      sidebar={<DocSidebar docs={docs} section={section} />}
      sidebarLabel="Documentation"
      searchPlaceholder="Search the docs"
      footer={FOOTER}
    >
      <h1 className="text-2xl font-medium text-primary">{doc.title}</h1>
      {doc.description ? (
        <p className="mt-2 text-foreground-muted">{doc.description}</p>
      ) : null}
      <article className="mt-6 max-w-3xl">
        <Mdx source={doc.body} />
      </article>
    </PageShell>
  );
}
