import type { Metadata } from "next";
import { Poppins, JetBrains_Mono } from "next/font/google";
import { THEME_INIT_SCRIPT } from "@ubx/docs-ui";
import "./globals.css";

// Poppins for text, JetBrains Mono for code, self-hosted by next/font
// rather than linked from fonts.googleapis.com: identical rendering, no
// third-party request on every page load.
//
// This site used to fall back to the OS UI font (-apple-system,
// BlinkMacSystemFont, Segoe UI), so the same product rendered in a
// different typeface on every platform, and in a different one again
// from the marketing site. The weights are only those actually used;
// requesting more would ship bytes nothing reads.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-poppins",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

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
    <html
      lang="en"
      className={`h-full antialiased ${poppins.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
