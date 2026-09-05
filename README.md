# ubx-docs-users

User-facing documentation for ubx: concepts, guides, CLI reference,
tutorials and blueprints. Deployed to docs.ubiquex.io.

Next.js, static export, matching `ubx-docs-providers`' theme exactly
(same Material conventions, same Persian green, same grey scale in both
themes, same syntax highlighting theme A).

## How this differs from ubx-docs-providers

Content here is **hand-written MDX living in this repo** (`content/`).
There is no fetching, no versioning and no publish step. The provider
site's whole content layer exists to pull and pin published artifacts;
that is the one thing these two sites deliberately do not share.

## Navigation

Two tiers. The header carries destinations (other sites), the tab strip
carries sections within this one. The sidebar swaps per section, which
keeps each tree short rather than one enormous sidebar holding
everything.

## Shared components

`Header`, `Footer`, `ThemeToggle`, `CodeBlock`, `GlobalSearch` and
`MobileSidebarToggle` are duplicated from `ubx-docs-providers` for now,
deliberately and briefly. They are extracted to `@ubx/docs-ui` in the
next slice (UBI-247), once the interfaces below are proven against two
real call sites rather than predicted from one.

Three interfaces were corrected here specifically so the extraction is
evidence-based:

- `Header` takes `nav` and `tabs` as props rather than a hardcoded
  module-level array, and gained the second tier.
- `GlobalSearch` takes a generic `SearchEntry`
  (`title`/`subtitle`/`group`/`path`) rather than the provider site's
  own wire-type record. The provider index maps onto it without loss.
- `MobileSidebarToggle` takes the drawer contents as `children` rather
  than constructing a `ProviderSidebar` itself.

## Commands

```bash
npm install
npm run dev     # builds the search index, then next dev
npm run build   # static export to out/
npm run lint
```
