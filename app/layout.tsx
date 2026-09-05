import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "ubx docs",
  description: "User documentation for ubx: concepts, guides, CLI reference, tutorials and blueprints.",
};

// Copied verbatim from ubx-docs-providers. Runs before paint, in <head>,
// ahead of any hydration, so a reader who has already chosen light or
// dark never sees a flash of the OS default first. Absent or invalid
// storage leaves no attribute, which is exactly "follow the OS".
const THEME_INIT_SCRIPT = `(function () {
  try {
    var stored = window.localStorage.getItem("ubx-docs-theme");
    if (stored === "light" || stored === "dark") {
      document.documentElement.setAttribute("data-theme", stored);
    }
  } catch (e) {}
})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <Footer />
      </body>
    </html>
  );
}
