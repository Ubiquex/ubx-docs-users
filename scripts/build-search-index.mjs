#!/usr/bin/env node
// Builds public/search-index.json in the GENERIC SearchEntry shape that
// GlobalSearch now takes (UBI-247): { title, subtitle?, group?, path }.
//
// The provider site's own index maps onto the same shape without loss
// (title = dottedName, subtitle = wireType, group = category), which is
// the evidence that the shape is genuinely shared rather than merely
// plausible. That mapping is what the extraction slice will encode.
//
// No fetching and no versioning here, unlike the provider site: the
// content is hand-written MDX already in this repo.

import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SECTIONS = [
  { dir: "install", label: "Install" },
  { dir: "concepts", label: "Concepts" },
  { dir: "tutorial", label: "Tutorial" },
  { dir: "cli-reference", label: "CLI reference" },
  { dir: "integrations", label: "Integrations" },
  { dir: "server", label: "Server" },
];

function frontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const out = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) out[kv[1]] = kv[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

const entries = [];
for (const { dir, label } of SECTIONS) {
  const abs = join(root, "content", dir);
  if (!existsSync(abs)) continue;
  // Recursive: the migrated sections are nested (tutorial has 12
  // subdirectories) and the slug is the path, matching the URL shape.
  const files = [];
  const walk = (d, prefix) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) walk(join(d, e.name), prefix ? `${prefix}/${e.name}` : e.name);
      else if (e.name.endsWith(".mdx")) files.push([prefix, e.name]);
    }
  };
  walk(abs, "");
  for (const [prefix, file] of files) {
    const slug = prefix ? `${prefix}/${file.slice(0, -4)}` : file.slice(0, -4);
    const fm = frontmatter(readFileSync(join(abs, prefix, file), "utf8"));
    entries.push({
      title: fm.title || slug,
      subtitle: fm.description || undefined,
      group: label,
      path: `/${dir}/${slug}`,
    });
  }
}

entries.sort((a, b) => a.title.localeCompare(b.title));
mkdirSync(join(root, "public"), { recursive: true });
writeFileSync(join(root, "public", "search-index.json"), JSON.stringify(entries));
console.log(`[build-search-index] ${entries.length} entries -> public/search-index.json`);
