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
export function listSectionSlugs(section: string): string[][] {
  const root = sectionDir(section);
  if (!existsSync(root)) return [];
  const out: string[][] = [];
  const walk = (dir: string, prefix: string[]) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        walk(join(dir, entry.name), [...prefix, entry.name]);
      } else if (entry.name.endsWith(".mdx")) {
        out.push([...prefix, entry.name.slice(0, -".mdx".length)]);
      }
    }
  };
  walk(root, []);
  return out;
}

export function getDoc(section: string, slug: string | string[]): Doc | null {
  const parts = Array.isArray(slug) ? slug : [slug];
  const path = join(sectionDir(section), ...parts.slice(0, -1), `${parts[parts.length - 1]}.mdx`);
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
