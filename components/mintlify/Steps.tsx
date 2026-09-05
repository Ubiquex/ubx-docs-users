import { Children, isValidElement } from "react";
import type { ReactNode } from "react";

// Steps / Step. Numbering is derived from position rather than taken as
// a prop, matching Mintlify, so inserting a step in the middle of a page
// does not require renumbering the ones after it. Server component: the
// numbering is static, so there is nothing to hydrate.
export function Steps({ children }: { children: ReactNode }) {
  const steps = Children.toArray(children).filter(isValidElement);
  return (
    <ol className="my-6 space-y-6">
      {steps.map((child, i) => (
        <li key={i} className="flex gap-4">
          <span
            aria-hidden="true"
            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-xs text-foreground-muted"
          >
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">{child}</div>
        </li>
      ))}
    </ol>
  );
}

export function Step({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div>
      {title ? <div className="font-medium text-foreground">{title}</div> : null}
      <div className="[&>p:first-child]:mt-0 [&>p:last-child]:mb-0">{children}</div>
    </div>
  );
}
