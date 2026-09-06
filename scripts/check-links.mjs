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
// becomes "<route>.html", not "<route>/index.html".
//
// This used to accept ALL THREE shapes, on the reasoning that the check
// would keep working if that config ever changed. That leniency is
// precisely what let twelve dead links ship. Every card on the tutorial
// index pointed at /tutorial/<name>, the build wrote
// /tutorial/<name>/index.html, and the directory-index branch below
// answered "exists". In production the CloudFront function rewrites
// /tutorial/<name> to /tutorial/<name>.html, which was never written, so
// all twelve 404'd while this check stayed green.
//
// So it now models production rather than tolerating it. The required
// shape is read from next.config, and only that shape counts. A checker
// that accepts more shapes than the server serves is not a lenient
// checker, it is a broken one.
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
// Read, not assumed. If someone flips this in next.config, the checker
// follows rather than silently checking the wrong shape.
const CONFIG = readFileSync(
  ["next.config.ts", "next.config.mjs", "next.config.js"].find((f) => existsSync(f)),
  "utf8",
);
const TRAILING_SLASH = /trailingSlash\s*:\s*true/.test(CONFIG);
console.log(`checking against trailingSlash: ${TRAILING_SLASH}`);

const dead = new Map();

for (const file of pages) {
  const html = readFileSync(file, "utf8");
  for (const m of html.matchAll(/href="(\/[^"#?]*)"/g)) {
    const href = m[1].replace(/\/$/, "") || "/";
    if (href === "/") continue;
    const bare = href.replace(/^\//, "");
    // A path whose last segment has an extension is a static asset, not
    // a route: /logo/ubiquex.png is served as itself and never gets the
    // .html treatment. Checked as a plain file. Splitting these out is
    // what lets the route branch be strict without failing on assets.
    const isAsset = /\.[a-z0-9]+$/i.test(bare.split("/").pop() ?? "");
    const exists = isAsset
      ? existsSync(join(OUT, bare))
      : TRAILING_SLASH
        ? existsSync(join(OUT, bare, "index.html"))
        : existsSync(join(OUT, `${bare}.html`));
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
