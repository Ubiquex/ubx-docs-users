// Note / Warning / Info / Tip: the same shape with a different accent.
// Mintlify renders these as coloured callouts; theme A has exactly one
// accent per role already defined, so these reuse the site's own tokens
// rather than introducing new colour.
import type { ReactNode } from "react";

function Callout({
  children,
  accent,
  label,
}: {
  children: ReactNode;
  accent: string;
  label: string;
}) {
  return (
    <div className={`my-5 rounded-2xl border-l-2 ${accent} bg-surface px-4 py-3`} role="note">
      <div className="mb-1 text-xs uppercase tracking-wide text-foreground-muted">{label}</div>
      <div className="[&>p:first-child]:mt-0 [&>p:last-child]:mb-0 text-foreground">{children}</div>
    </div>
  );
}

export const Note = ({ children }: { children: ReactNode }) => (
  <Callout accent="border-primary" label="Note">{children}</Callout>
);

// Warning uses theme A's own accent-red, the same token the required
// badge uses on the provider site.
export const Warning = ({ children }: { children: ReactNode }) => (
  <Callout accent="border-accent-red" label="Warning">{children}</Callout>
);

export const Info = ({ children }: { children: ReactNode }) => (
  <Callout accent="border-primary" label="Info">{children}</Callout>
);

export const Tip = ({ children }: { children: ReactNode }) => (
  <Callout accent="border-primary" label="Tip">{children}</Callout>
);
