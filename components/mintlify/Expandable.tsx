import type { ReactNode } from "react";

// Native <details>, deliberately. Mintlify's own Expandable is a client
// component with its own state; a disclosure widget is exactly what the
// platform already provides, and using it keeps this a server component,
// keeps it keyboard accessible and findable by in-page search for free,
// and keeps it working with JS disabled.
export function Expandable({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="my-4 rounded-2xl border border-border bg-surface px-4 py-3">
      <summary className="cursor-pointer text-sm text-foreground marker:text-foreground-muted">
        {title}
      </summary>
      <div className="mt-3 text-foreground [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
        {children}
      </div>
    </details>
  );
}
