"use client";

import { Children, isValidElement, useState } from "react";
import type { ReactElement, ReactNode } from "react";

// Tabs / Tab. The one shim that genuinely needs client state: 20 uses,
// all in tutorial pages showing the same step in Go, TypeScript and
// Python.
//
// Titles are read off the children rather than passed to Tabs, matching
// Mintlify's own shape so the migrated MDX needs no edits.
type TabProps = { title: string; children: ReactNode };

export function Tab({ children }: TabProps) {
  return <>{children}</>;
}

export function Tabs({ children }: { children: ReactNode }) {
  const tabs = Children.toArray(children).filter(
    (c): c is ReactElement<TabProps> => isValidElement(c),
  );
  const [active, setActive] = useState(0);
  if (tabs.length === 0) return null;

  return (
    <div className="my-5">
      <div role="tablist" className="flex gap-4 border-b border-border">
        {tabs.map((t, i) => (
          <button
            key={i}
            role="tab"
            type="button"
            aria-selected={i === active}
            onClick={() => setActive(i)}
            className={
              i === active
                ? "-mb-px border-b-2 border-primary py-2 text-sm text-primary"
                : "-mb-px border-b-2 border-transparent py-2 text-sm text-foreground-muted hover:text-primary"
            }
          >
            {t.props.title}
          </button>
        ))}
      </div>
      {/* Every panel stays mounted and inactive ones are hidden rather
          than unmounted, so in-page browser search still finds text in a
          tab the reader has not opened. */}
      {tabs.map((t, i) => (
        <div
          key={i}
          role="tabpanel"
          hidden={i !== active}
          className="pt-3 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0"
        >
          {t}
        </div>
      ))}
    </div>
  );
}
