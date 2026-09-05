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
  { label: "Install", href: "/guides/install" },
  { label: "Docs", href: "/", current: true },
  { label: "Providers", href: "https://providers.ubiquex.io" },
  { label: "Blog", href: "https://ubiquex.github.io/ubiquex-web/blog" },
];

// The five sections the ticket names. Only Concepts is built in this
// slice; the rest are declared here so the shell is proven against the
// real tab count rather than against one tab, but they are NOT linked
// from the home page until their content exists (see SECTIONS below).
export const TABS: SectionTab[] = [
  { label: "Concepts", href: "/concepts" },
  { label: "Guides", href: "/guides" },
  { label: "CLI reference", href: "/cli-reference" },
  { label: "Tutorials", href: "/tutorials" },
  { label: "Blueprints", href: "/blueprints" },
];

export type Section = {
  slug: string;
  label: string;
  description: string;
  /** Simple inline glyph, matching the provider site's icon-free-ish restraint. */
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
    slug: "concepts",
    label: "Concepts",
    description:
      "How ubx models infrastructure: the proposal ledger, resolution, drift, and what each record actually guarantees.",
    icon: "◈",
    ready: true,
  },
  {
    slug: "guides",
    label: "Guides",
    description:
      "Installing ubx, wiring it into CI, and the integration paths for GitHub, GitLab, Azure DevOps and the rest.",
    icon: "▤",
    ready: false,
  },
  {
    slug: "cli-reference",
    label: "CLI reference",
    description:
      "Every ubx command, flag and exit condition. Always describes the latest release rather than being versioned.",
    icon: "▸",
    ready: false,
  },
  {
    slug: "tutorials",
    label: "Tutorials",
    description:
      "End-to-end walkthroughs against real providers, from a first resource to promotion across environments.",
    icon: "◎",
    ready: false,
  },
  {
    slug: "blueprints",
    label: "Blueprints",
    description:
      "Composing and distributing reusable infrastructure, and calling blueprints from your own stacks.",
    icon: "◫",
    ready: false,
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
