import type { NavLink } from "@ubx/docs-ui";

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
  { label: "Install", href: "/install" },
  { label: "Documentation", href: "/", current: true },
  { label: "Tutorials", href: "/tutorial" },
  { label: "Providers", href: "https://providers.ubiquex.io" },
  { label: "Blog", href: "https://ubiquex.github.io/ubiquex-web/blog" },
];

// NO TAB STRIP. The section tabs used to sit under the header on every
// page. They are gone from all of them: from the home page, where they
// duplicated the section cards, and now from content pages, where the
// sidebar is the navigation once you are inside a section.
//
// Worth being explicit about what that costs, because it is a real
// trade. From a page inside Concepts there is now no one-click route to
// Tutorial. The header carries Install and Tutorials as destinations
// (matching the provider site's menu), and everything else goes via the
// home page. If cross-section movement from deep inside a section turns
// out to matter, this is the decision to revisit.

export type Section = {
  slug: string;
  label: string;
  description: string;
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
    ready: true,
  },
  {
    slug: "concepts",
    label: "Concepts",
    description:
      "How ubx models infrastructure: the proposal ledger, resolution, drift, and what each record actually guarantees.",
    ready: true,
  },
  {
    slug: "tutorial",
    label: "Tutorial",
    description:
      "End-to-end walkthroughs against real providers, from a first resource to promotion across environments and blueprints.",
    ready: true,
  },
  {
    slug: "cli-reference",
    label: "CLI reference",
    description:
      "Every ubx command, flag and exit condition. Always describes the latest release rather than being versioned.",
    ready: true,
  },
  {
    slug: "integrations",
    label: "Integrations",
    description:
      "Wiring ubx into GitHub Actions, GitLab CI, Azure DevOps, CircleCI, Bamboo, and AI assistants.",
    ready: true,
  },
  {
    slug: "server",
    label: "Server",
    description:
      "Running ubx server: configuration, deployment, and the API it exposes.",
    ready: true,
  },
];

// Footer identity. Required props since @ubx/docs-ui 0.3.0, because the
// shared Footer used to hardcode the provider site's tagline and this
// site rendered "Reference content is generated from each provider's own
// real schema, not hand-written" on all 137 of its hand-written pages.
export const FOOTER = {
  tagline:
    "Hand-written documentation for ubx, kept in step with the released binary.",
  links: [
    { label: "Provider reference", href: "https://providers.ubiquex.io" },
    { label: "GitHub", href: "https://github.com/Ubiquex" },
    // No License link. ubx-docs-providers has a LICENSE file and this
    // repo does not, so the link the shared Footer used to hardcode
    // pointed at the wrong repo, and pointing it at this one would 404.
    // Omitted until the repo actually has a licence to link to.
  ],
};
