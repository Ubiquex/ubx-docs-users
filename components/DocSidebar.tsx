"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { DocMeta } from "@/lib/content";

// One tree per section, not one enormous sidebar holding everything.
// That is the whole reason the ticket asks for a tab strip: the tabs
// swap which tree is shown, so each stays short and scannable.
export function DocSidebar({ docs, section }: { docs: DocMeta[]; section: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label={`${section} pages`} className="text-sm">
      <ul className="space-y-1">
        {docs.map((d) => {
          const href = `/${section}/${d.slug}`;
          const active = pathname === href;
          return (
            <li key={d.slug}>
              <Link
                href={href}
                className={
                  active
                    ? "block rounded px-2 py-1 bg-field text-primary"
                    : "block rounded px-2 py-1 text-foreground-muted hover:bg-surface hover:text-primary"
                }
              >
                {d.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
