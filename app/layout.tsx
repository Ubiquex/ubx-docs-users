import type { Metadata } from "next";
import { THEME_INIT_SCRIPT } from "@ubx/docs-ui";
import "./globals.css";

export const metadata: Metadata = {
  title: "ubx docs",
  description: "User documentation for ubx: concepts, guides, CLI reference, tutorials and blueprints.",
};

// The theme script and the Footer both used to live here, copied
// verbatim from ubx-docs-providers. The script now comes from the
// package, since a verbatim copy in two repos is duplication nothing
// could see. The Footer moved into PageShell, which is what makes the
// header, rail and footer one arrangement rather than three each site
// assembled for itself.
//
// The script stays an inline <script> in <head> rather than a component:
// it has to run before paint and ahead of hydration, otherwise a reader
// who already chose light or dark sees a flash of the OS default first.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
