// Fails if any internal link in the static export points at a file the
// export did not produce.
//
// WHY. Two dead links shipped to main and were found only by someone
// sweeping the built output by hand. One of them, "/guides/install", sat
// in the header, so it was dead on 144 of the 147 pages. It survived
// review because a wrong href is invisible: it renders as a perfectly
// ordinary link and only fails when a reader clicks it. Nothing in CI
// looked, and "someone will notice" had already failed for a link on
// every page of the site.
//
// It also encodes a decision the site has already made once. Next's
// static export is configured with trailingSlash: false, so a route
// becomes "<route>.html", not "<route>/index.html". Any checker that
// assumes the directory-index form silently passes everything. All three
// shapes are accepted below so the check keeps working if that config
// ever changes.
//
// Deliberately internal links only. External URLs would make this a
// network-dependent, flaky check that fails when somebody else's site is
// down, which is a different job from "this repo is self-consistent".

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const OUT = "out";

function walk(dir) {
  const found = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) found.push(...walk(p));
    else if (entry.endsWith(".html")) found.push(p);
  }
  return found;
}

if (!existsSync(OUT)) {
  console.error(`${OUT}/ does not exist. Run the build first.`);
  process.exit(1);
}

const pages = walk(OUT);
const dead = new Map();

for (const file of pages) {
  const html = readFileSync(file, "utf8");
  for (const m of html.matchAll(/href="(\/[^"#?]*)"/g)) {
    const href = m[1].replace(/\/$/, "") || "/";
    if (href === "/") continue;
    const bare = href.replace(/^\//, "");
    const exists =
      existsSync(join(OUT, `${bare}.html`)) ||
      existsSync(join(OUT, bare, "index.html")) ||
      existsSync(join(OUT, bare));
    if (!exists) {
      if (!dead.has(href)) dead.set(href, new Set());
      dead.get(href).add(relative(OUT, file));
    }
  }
}

if (dead.size === 0) {
  console.log(`ok: every internal link across ${pages.length} pages resolves`);
  process.exit(0);
}

console.error(`${dead.size} dead internal link(s):\n`);
for (const [href, sources] of [...dead].sort()) {
  const list = [...sources].sort();
  const shown = list.slice(0, 3).join(", ");
  const more = list.length > 3 ? `, and ${list.length - 3} more` : "";
  console.error(`  ${href}`);
  console.error(`    on ${list.length} page(s): ${shown}${more}`);
}
process.exit(1);
