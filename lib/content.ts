import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";

// Content is hand-written MDX living in this repo, per UBI-247. There is
// deliberately no fetching and no versioning here, unlike the provider
// site, whose whole content layer exists to pull and pin published
// artifacts. That difference is why these two sites share components but
// not a content pipeline.

const CONTENT_ROOT = join(process.cwd(), "content");

export type Doc = {
  section: string;
  slug: string;
  title: string;
  description?: string;
  /** Order within its section. Unset sorts last, then alphabetically. */
  order?: number;
  /**
   * Sidebar group heading.
   *
   * Explicit frontmatter first, then the first path segment for a nested
   * page. That default is not a guess: the tutorial index's own cards
   * link to /tutorial/<dir>, so the directory IS the category a reader
   * has already been shown. Sections whose pages are flat, integrations
   * being the one, have no directory to fall back on and set it in
   * frontmatter instead.
   */
  group?: string;
  body: string;
};

export type DocMeta = Omit<Doc, "body">;

function sectionDir(section: string) {
  return join(CONTENT_ROOT, section);
}

// Slugs are path segments, not a flat name. The migrated sections are
// nested (tutorial alone has 12 subdirectories), and all 313 internal
// links in the corpus are multi-segment paths like
// /tutorial/aws/first-resource. Flattening the tree would have broken
// every one of them, so the URL shape is preserved exactly and the route
// is a catch-all.
// A NESTED index.mdx is the slug of its own directory, not a segment
// below it. content/tutorial/azure/index.mdx is /tutorial/azure.
//
// It used to be /tutorial/azure/index, and that is why every card on the
// tutorial index 404'd in production. The cards link to /tutorial/azure,
// which was never generated at all. It looked fine locally because
// `next start` and any static file server resolve a directory to its
// index.html; production does not. The export is trailingSlash: false,
// so a real route becomes <route>.html and the CloudFront function
// rewrites /tutorial/azure to /tutorial/azure.html. What the build had
// actually written was /tutorial/azure/index.html, so the rewrite
// pointed at a key that does not exist, and a private bucket behind OAC
// answers that with 403, which the distribution maps to the 404 page.
//
// Verified against the live site before changing anything:
// /tutorial/setup, /tutorial/azure and /tutorial/blueprints all
// returned 404 while /tutorial/azure/audit, a leaf, returned 200.
//
// The top-level index.mdx is deliberately left alone. Collapsing it
// would produce the empty slug, which is the /[section] route's own
// path, and that route is a redirect rather than a page.
export function listSectionSlugs(section: string): string[][] {
  const root = sectionDir(section);
  if (!existsSync(root)) return [];
  const out: string[][] = [];
  const walk = (dir: string, prefix: string[]) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        walk(join(dir, entry.name), [...prefix, entry.name]);
      } else if (entry.name.endsWith(".mdx")) {
        const name = entry.name.slice(0, -".mdx".length);
        if (name === "index" && prefix.length > 0) out.push([...prefix]);
        else out.push([...prefix, name]);
      }
    }
  };
  walk(root, []);
  return out;
}

export function getDoc(section: string, slug: string | string[]): Doc | null {
  const parts = Array.isArray(slug) ? slug : [slug];
  // Two shapes resolve here, matching listSectionSlugs above: a leaf
  // file, and a directory whose index.mdx now answers to the directory's
  // own slug. Tried in that order, so a real azure.mdx would still win
  // over azure/index.mdx rather than being shadowed by it.
  const leaf = join(sectionDir(section), ...parts.slice(0, -1), `${parts[parts.length - 1]}.mdx`);
  const dirIndex = join(sectionDir(section), ...parts, "index.mdx");
  const path = existsSync(leaf) ? leaf : dirIndex;
  if (!existsSync(path)) return null;
  const parsed = matter(readFileSync(path, "utf8"));
  const data = parsed.data as Record<string, unknown>;
  return {
    section,
    slug: parts.join("/"),
    // Fall back to the slug rather than throwing: a page with no
    // frontmatter title is a content bug worth seeing rendered, not a
    // build failure that hides which file is at fault.
    title: typeof data.title === "string" ? data.title : parts.join("/"),
    description:
      typeof data.description === "string" ? data.description : undefined,
    order: typeof data.order === "number" ? data.order : undefined,
    group:
      typeof data.group === "string"
        ? data.group
        : parts.length > 1
          ? parts[0]
          : undefined,
    body: parsed.content,
  };
}

export function listDocs(section: string): DocMeta[] {
  return listSectionSlugs(section)
    .map((slug) => getDoc(section, slug))
    .filter((d): d is Doc => d !== null)
    .map((d) => {
      const { body, ...meta } = d;
      void body;
      return meta;
    })
    .sort((a, b) => {
      const ao = a.order ?? Number.MAX_SAFE_INTEGER;
      const bo = b.order ?? Number.MAX_SAFE_INTEGER;
      if (ao !== bo) return ao - bo;
      return a.title.localeCompare(b.title);
    });
}

/**
 * Ordered group labels for a section, taken from its own index page's cards.
 *
 * The brief was that the sidebar should follow the same categories the
 * tutorial index shows on its cards, so this reads those cards rather
 * than inventing a parallel list that could disagree with them. It
 * yields both the label and the order, which matters: deriving labels
 * from directory names alone produced "Gcp" and "Remote Stores" against
 * the cards' own "GCP" and "Remote Ledger Stores", and put them in
 * filesystem order rather than the deliberate order the index presents.
 *
 * Any section whose index page uses the same Card shape gets the same
 * behaviour for free. A section without one falls back to the directory
 * name, and a flat section to its frontmatter `group`.
 */
export function sectionGroupLabels(section: string): Map<string, string> {
  const index = join(sectionDir(section), "index.mdx");
  const out = new Map<string, string>();
  if (!existsSync(index)) return out;
  const src = readFileSync(index, "utf8");
  const card = new RegExp(
    `<Card\\s[^>]*title="([^"]+)"[^>]*href="/${section}/([a-z0-9-]+)"`,
    "g",
  );
  for (const m of src.matchAll(card)) {
    if (!out.has(m[2])) out.set(m[2], m[1]);
  }
  return out;
}
