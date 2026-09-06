"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { DocMeta } from "@/lib/content";

// One tree per section, not one enormous sidebar holding everything.
// That is the whole reason the ticket asks for a tab strip: the tabs
// swap which tree is shown, so each stays short and scannable.
export function DocSidebar({
  docs,
  section,
  groupLabels = [],
}: {
  docs: DocMeta[];
  section: string;
  /**
   * Ordered [directory, label] pairs from the section index's own cards.
   * Entries, not a Map, because this crosses the server/client boundary
   * and a Map does not survive serialisation.
   */
  groupLabels?: [string, string][];
}) {
  const labels = new Map(groupLabels);
  const pathname = usePathname();

  // Grouped, preserving the order listDocs already sorted them into: a
  // Map keeps insertion order, so the first page of each group decides
  // where that group sits and no second sort is needed.
  //
  // The tutorial section is why this exists. It has 50 pages across 12
  // subdirectories and rendered as one flat list of 50 links, while its
  // own index page presents those same 12 as titled card groups. The
  // reader was shown categories, then handed a list with none.
  const groups = new Map<string, DocMeta[]>();
  // Seed in the index page's own order first, so the sidebar presents the
  // categories in the order the reader was shown them rather than in
  // whatever order the filesystem walk happened to produce.
  for (const [dir] of groupLabels) groups.set(dir, []);
  for (const d of docs) {
    const key = d.group ?? "";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(d);
  }
  for (const [k, v] of [...groups]) if (v.length === 0) groups.delete(k);

  // A single unnamed group means the section is flat and every page sits
  // at the top level. Rendering one blank heading above the whole list
  // would be worse than not grouping at all.
  const flat = groups.size === 1 && groups.has("");

  const link = (d: DocMeta) => {
    const href = `/${section}/${d.slug}`;
    const active = pathname === href;
    return (
      <li key={d.slug}>
        <Link
          href={href}
          className={
            active
              ? "block rounded px-2 py-1 bg-field text-primary"
              : "block rounded px-2 py-1 text-foreground-muted hover:bg-surface hover:text-primary"
          }
        >
          {d.title}
        </Link>
      </li>
    );
  };

  return (
    <nav aria-label={`${section} pages`} className="text-sm">
      {flat ? (
        <ul className="space-y-1">{docs.map(link)}</ul>
      ) : (
        <div className="space-y-5">
          {[...groups.entries()].map(([name, items]) => (
            <div key={name || "_"}>
              {name ? (
                <div className="mb-1 px-2 text-xs font-medium tracking-wide text-foreground-muted uppercase">
                  {labels.get(name) ?? titleCase(name)}
                </div>
              ) : null}
              <ul className="space-y-1">{items.map(link)}</ul>
            </div>
          ))}
        </div>
      )}
    </nav>
  );
}

// Directory names arrive as slugs (team-review, remote-stores), so they
// need presenting. An explicit frontmatter group is already written the
// way it should read, "CI/CD" among them, and passes through untouched.
function titleCase(s: string): string {
  if (s !== s.toLowerCase()) return s;
  return s
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
