# CLAUDE.md -- ubx-docs-users

## What this is

The user-facing documentation for `ubx` (UBI-247), a Next.js static
export at [docs.ubiquex.io](https://docs.ubiquex.io). Six sections,
147 pages, all hand-written MDX living in this repo. That is the
difference from
[`ubx-docs-providers`](https://github.com/Ubiquex/ubx-docs-providers),
whose content is fetched artifacts generated from real provider
schemas: this site has no fetch step, no versioning mechanism and no
publish step, and a typo fix is a normal PR.

Moved off Mintlify. `ubiquex-docs` holds the old Mintlify content and
is superseded as the user-facing site, but is not dead: its
`resource-reference/` tree is still the input the provider corpus is
generated from.

## Content

`content/<section>/**.mdx`, frontmatter `title`, `description`, and an
optional numeric `order`. `order` decides both the sidebar position and
where `/<section>` redirects to, so those two can never disagree.

`/<section>` is a redirect, not a page. The section landing pages used
to render a card grid, which duplicated navigation that already existed:
the tab strip lists every section and the sidebar lists every page in
one. Same shape as the provider site's own `/[provider]` redirect. The
redirect prefers a section's `index` page and otherwise takes whatever
sorts first, so a section without an `index` needs `order: 1` on
whichever page should be its entry point. Without that it lands
alphabetically, which is how Concepts once opened on "Addressing,
Environments & Promotion".

The home page keeps its cards. It is the entry point, where no
navigation is on screen yet, and it is the one page with no tab strip
for exactly that reason.

Mintlify components are shimmed locally in `components/mintlify/`, kept
here rather than in `@ubx/docs-ui` because the provider site has no use
for them.

## The shared UI

`@ubx/docs-ui` provides the shell, theme and components. Two things
about it matter here:

`app/globals.css` carries `@source "../node_modules/@ubx/docs-ui/dist";`
and it is load-bearing. Tailwind v4 skips `node_modules`, so without it
every utility class used only inside the package is silently never
generated, and the shared header and footer render partly unstyled.

The dependency pins with a caret on a `0.x` version, which npm does not
let cross the minor. A new minor needs an explicit bump here, and the
lockfile must be regenerated with it: `npm ci` fails on a mismatch.

## Deployment

`deploy.yml` on push to `main`: S3 `ubx-docs-users-site` behind
CloudFront `EJSUGHAX0MZCR`, private bucket, Origin Access Control only.
`infra/` holds the CloudFront function, its tests, the IAM policies and
`create.sh`. Everything that shapes production is committed before it is
applied.

Two things `infra/` records that are easy to get wrong: the export is
`trailingSlash: false`, so routes are `<route>.html` and never
`<route>/index.html`; and a private bucket behind OAC answers a missing
key with **403**, never 404, so the distribution maps both to the 404
page.

## Git rules

PR-only, never self-merge, matching every repo in this org except
`ubiquex` itself and `ubiquex-docs`. Before pushing more commits to a
branch with an open PR, confirm it is STILL open (`gh pr view <n> --json
state`) -- a merged PR reports `mergeable=UNKNOWN mergeStateStatus=UNKNOWN`,
identical to "not yet computed", and `state` is the only field that
separates them. NO AI attribution anywhere in commits or PR bodies.

## Real, working commands

```bash
npm run dev
npm run build          # static export into out/
npm run lint
npm run check:links    # every internal href against the files the export produced
node --test infra/cloudfront/rewrite.test.mjs
node infra/check-distribution-config.mjs
```
