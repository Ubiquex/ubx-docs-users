import Link from "next/link";
import type { ReactNode } from "react";

// Card / CardGroup. 85 uses, almost all in tutorial index pages linking
// to sub-tutorials. Mintlify's `icon` is a Font Awesome name; there is no
// Font Awesome here and adding an icon dependency for decoration on one
// section would be a poor trade, so the attribute is accepted and
// deliberately ignored rather than rendered as a broken glyph or as
// literal text.
export function Card({
  title,
  href,
  children,
}: {
  title: string;
  icon?: string;
  href?: string;
  children?: ReactNode;
}) {
  const body = (
    <>
      <div className="font-medium text-foreground">{title}</div>
      {children ? (
        <div className="mt-1 text-sm text-foreground-muted [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
          {children}
        </div>
      ) : null}
    </>
  );
  const className =
    "block rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-primary";
  if (!href) return <div className={className}>{body}</div>;
  return href.startsWith("/") ? (
    <Link href={href} className={className}>{body}</Link>
  ) : (
    <a href={href} className={className}>{body}</a>
  );
}

export function CardGroup({ cols, children }: { cols?: number; children: ReactNode }) {
  const n = cols === 3 ? "sm:grid-cols-3" : cols === 1 ? "" : "sm:grid-cols-2";
  return <div className={`my-6 grid gap-4 ${n}`}>{children}</div>;
}
