// Tests for infra/cloudfront/rewrite.js, the CloudFront viewer-request
// function that maps clean URLs onto the files Next's static export
// actually writes.
//
// These run in plain node with no AWS call and no credentials, so they
// gate every PR rather than only whoever remembers to run
// `aws cloudfront test-function` by hand. The deployed function is a
// CloudFront Function (cloudfront-js-2.0), which is ES5-shaped and
// declares a bare `handler` with no export, so it is loaded by reading
// the real source file and evaluating it. What is tested is the exact
// byte content that gets uploaded, not a re-typed copy that could drift.
//
// The cases are this site's own real routes, taken from its actual
// export, not adapted from the provider site's list. Both sites share
// the function's logic, and sharing the logic while assuming the routes
// are also the same is how a passing suite stops meaning anything.
//
// The one case that is here despite not existing on this site is the
// dotted route segment. The provider site shipped a version of this
// function that decided "is this a file" by asking whether the last path
// segment contained a dot, which 404'd every one of its version landing
// pages in production. This site has no dotted routes today, so that bug
// would lie dormant here rather than being caught. One page slug with a
// version or a decimal in it would wake it up.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, "rewrite.js"), "utf8");
const handler = new Function(`${source}; return handler;`)();

function rewrite(uri) {
  const event = {
    version: "1.0",
    context: { eventType: "viewer-request" },
    viewer: { ip: "1.2.3.4" },
    request: { method: "GET", uri, headers: {}, cookies: {}, querystring: {} },
  };
  return handler(event).uri;
}

// [input, expected, why it is here]
const CASES = [
  // Roots and section landing pages.
  ["/", "/index.html", "site root is the one real index.html"],
  ["/concepts", "/concepts.html", "section landing page"],
  ["/install", "/install.html", "the header's Install destination"],
  ["/404", "/404.html", "error page is reachable as a normal route"],

  // Real content pages at each depth this site actually produces.
  ["/concepts/apply-records", "/concepts/apply-records.html", "depth 2 content page"],
  [
    "/tutorial/sdk/first-program",
    "/tutorial/sdk/first-program.html",
    "depth 3, the deepest shape this export emits",
  ],
  ["/tutorial/sdk/install", "/tutorial/sdk/install.html", "the recovered SDK install page"],

  // Trailing slash takes its own branch and must land on the same file.
  ["/concepts/", "/concepts.html", "trailing slash, same target as bare"],
  [
    "/tutorial/sdk/first-program/",
    "/tutorial/sdk/first-program.html",
    "trailing slash at full depth",
  ],

  // Dormant here, live on the provider site. See the header comment.
  ["/concepts/v1.2.3", "/concepts/v1.2.3.html", "dotted segment is a route, not a file"],

  // Real files already in the bucket. Rewriting any of these breaks the site.
  [
    "/concepts/apply-records.txt",
    "/concepts/apply-records.txt",
    "RSC navigation payload, fetched during soft navigation",
  ],
  ["/_next/static/chunks/abc.js", "/_next/static/chunks/abc.js", "content-hashed asset"],
  ["/search-index.json", "/search-index.json", "prebuilt search index"],
  ["/icon.svg", "/icon.svg", "static image"],
];

for (const [uri, expected, why] of CASES) {
  test(`${uri} -> ${expected}  (${why})`, () => {
    assert.equal(rewrite(uri), expected);
  });
}

// Guards on the shape of the rule itself, rather than on one more path.
test("no path is ever rewritten twice into .html.html", () => {
  for (const [, expected] of CASES) {
    assert.equal(rewrite(expected), expected, `${expected} must be stable`);
  }
});

test("every extension this site's export really contains passes through", () => {
  // Derived by listing the real out/ directory, not guessed:
  // 584 .txt, 147 .html, 11 .js, 2 .svg, 2 .png, 1 .json, 1 .css
  for (const ext of ["txt", "html", "json", "js", "css", "svg", "png"]) {
    const uri = `/some/path/file.${ext}`;
    assert.equal(rewrite(uri), uri, `.${ext} must pass through untouched`);
  }
});
