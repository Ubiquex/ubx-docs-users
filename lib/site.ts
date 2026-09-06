import type { NavLink, SectionTab } from "@ubx/docs-ui";

// Two-tier navigation, per UBI-247. The header carries DESTINATIONS
// (other sites in this project), the tab strip carries SECTIONS within
// this one. Keeping them apart is what stops a reader confusing "leave
// this site" with "move within it".
//
// Destinations mirror the provider site's own header so the two feel
// like one product, with "Docs" marked current here where "Providers"
// is current there.
export const NAV: NavLink[] = [
  { label: "Home", href: "https://ubiquex.github.io/ubiquex-web/" },
  // "/install", not "/guides/install". There is no Guides section on
  // this site, and never was: the ticket's original section list named
  // one, that list was corrected against Mintlify's real docs.json, and
  // this href was left pointing at the fiction. It sits in the header,
  // so it was dead on 144 of 147 pages.
  { label: "Install", href: "/install" },
  { label: "Docs", href: "/", current: true },
  { label: "Providers", href: "https://providers.ubiquex.io" },
  { label: "Blog", href: "https://ubiquex.github.io/ubiquex-web/blog" },
];

// The five sections the ticket names. Only Concepts is built in this
// slice; the rest are declared here so the shell is proven against the
// real tab count rather than against one tab, but they are NOT linked
// from the home page until their content exists (see SECTIONS below).
// The real sections, corrected against Mintlify's own docs.json rather
// than the ticket's original list (UBI-247). That list named a
// Blueprints section which does not exist (it is a group inside
// Tutorial, and the blueprint concept pages moved with Concepts) and a
// Guides section which does not either, while omitting ubx server and
// Install.
export const TABS: SectionTab[] = [
  { label: "Install", href: "/install" },
  { label: "Concepts", href: "/concepts" },
  { label: "Tutorial", href: "/tutorial" },
  { label: "CLI reference", href: "/cli-reference" },
  { label: "Integrations", href: "/integrations" },
  { label: "Server", href: "/server" },
];

export type Section = {
  slug: string;
  label: string;
  description: string;
  /**
   * Simple inline glyph, matching the provider site's icon-free-ish
   * restraint. Each one is tied to what its section is about rather than
   * being decorative: ⤓ download, ◎ the core model, ▶ start and walk
   * through, ❯ a shell prompt, ⇄ two systems exchanging, ▤ a rack. The
   * first set was arbitrary geometry (▼ ◈ ◎ ▸ ▤ ▣) with no relation to
   * the sections it labelled.
   */
  icon: string;
  /** False until the section's own content has actually been moved. */
  ready: boolean;
};

// The docs home renders these as cards. `ready: false` sections render
// dimmed and unlinked rather than being hidden, so the shape of the
// finished site is visible from the first slice and a reader is never
// sent to an empty page. Flip to true as each section lands.
export const SECTIONS: Section[] = [
  {
    slug: "install",
    label: "Install",
    description: "Getting ubx onto your machine and into your first stack.",
    icon: "⤓",
    ready: true,
  },
  {
    slug: "concepts",
    label: "Concepts",
    description:
      "How ubx models infrastructure: the proposal ledger, resolution, drift, and what each record actually guarantees.",
    icon: "◎",
    ready: true,
  },
  {
    slug: "tutorial",
    label: "Tutorial",
    description:
      "End-to-end walkthroughs against real providers, from a first resource to promotion across environments and blueprints.",
    icon: "▶",
    ready: true,
  },
  {
    slug: "cli-reference",
    label: "CLI reference",
    description:
      "Every ubx command, flag and exit condition. Always describes the latest release rather than being versioned.",
    icon: "❯",
    ready: true,
  },
  {
    slug: "integrations",
    label: "Integrations",
    description:
      "Wiring ubx into GitHub Actions, GitLab CI, Azure DevOps, CircleCI, Bamboo, and AI assistants.",
    icon: "⇄",
    ready: true,
  },
  {
    slug: "server",
    label: "Server",
    description:
      "Running ubx server: configuration, deployment, and the API it exposes.",
    icon: "▤",
    ready: true,
  },
];

// The cross-link to the provider site, rendered alongside the section
// cards as the ticket calls for. Kept separate from SECTIONS because it
// leaves this site entirely.
export const PROVIDER_SITE = {
  label: "Provider reference",
  description:
    "Every resource and data source across eight providers, versioned per SDK release. A separate site with its own search.",
  icon: "▦",
  href: "https://providers.ubiquex.io",
};

// Footer identity. Required props since @ubx/docs-ui 0.3.0, because the
// shared Footer used to hardcode the provider site's tagline and this
// site rendered "Reference content is generated from each provider's own
// real schema, not hand-written" on all 137 of its hand-written pages.
export const FOOTER = {
  tagline: "Hand-written documentation for ubx, kept in step with the released binary.",
  links: [
    { label: "Provider reference", href: "https://providers.ubiquex.io" },
    { label: "GitHub", href: "https://github.com/Ubiquex" },
    // No License link. ubx-docs-providers has a LICENSE file and this
    // repo does not, so the link the shared Footer used to hardcode
    // pointed at the wrong repo, and pointing it at this one would 404.
    // Omitted until the repo actually has a licence to link to.
  ],
};
