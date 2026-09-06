import { notFound, redirect } from "next/navigation";
import { SECTIONS } from "@/lib/site";
import { listDocs } from "@/lib/content";

export function generateStaticParams() {
  return SECTIONS.filter((s) => s.ready).map((s) => ({ section: s.slug }));
}

// A bare /concepts redirects to that section's first page rather than
// rendering a grid of cards.
//
// The cards were a second navigation surface duplicating one that
// already existed: the tab strip in the header lists every section, and
// the sidebar lists every page within one. Landing on a card grid meant
// a reader chose a section and was then asked to choose again, from
// links the sidebar was about to show anyway.
//
// This is the same shape as the provider site's own /[provider] route,
// which redirects to the latest version instead of listing versions. The
// home page cards are a different case and stay: they are the entry
// point to the site, where no navigation is on screen yet.
export default async function SectionRedirectPage({
  params,
}: PageProps<"/[section]">) {
  const { section } = await params;
  if (!SECTIONS.some((s) => s.slug === section && s.ready)) notFound();

  const docs = listDocs(section);

  // Prefer the section's own overview page when it has one, and fall
  // back to whatever sorts first otherwise.
  //
  // The fallback alone is not good enough, and it is worth saying why.
  // Almost no page in this corpus sets an `order`, so listDocs sorts by
  // title, which makes "the first page" alphabetical rather than
  // meaningful. Concepts would open on "Addressing, Environments &
  // Promotion" purely because A sorts early. Install and Tutorial do
  // have real overview pages, so those two land somewhere deliberate.
  // The remaining four still land alphabetically, which is a content
  // gap: they need either an overview page or an explicit order on
  // whichever page should be first.
  const landing = docs.find((d) => d.slug === "index") ?? docs[0];
  if (!landing) notFound();

  redirect(`/${section}/${landing.slug}`);
}
