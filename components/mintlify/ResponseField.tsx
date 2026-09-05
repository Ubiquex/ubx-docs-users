import type { ReactNode } from "react";

// The load-bearing shim. 189 of the 396 Mintlify component uses in the
// migrated corpus are ResponseField, and every one of them is in
// cli-reference documenting a real flag, so the fields it carries ARE
// the content rather than decoration around it.
//
// Attributes measured across the real corpus before building this, not
// guessed from Mintlify's docs: name (189), type (150), default (58).
// `required` is part of Mintlify's own API and is supported here, but is
// used ZERO times as an attribute in this corpus. The 11 apparent hits
// are the word "Required." written in prose inside the body. Supported
// anyway so a future page can use it without needing this file changed.
export function ResponseField({
  name,
  type,
  required,
  default: defaultValue,
  children,
}: {
  name: string;
  type?: string;
  required?: boolean;
  default?: string;
  children?: ReactNode;
}) {
  return (
    <div className="my-4 border-b border-border pb-4 last:border-b-0">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <code className="font-mono-tabular text-sm text-primary">{name}</code>
        {type ? <span className="text-xs text-foreground-muted">{type}</span> : null}
        {required ? (
          <span className="rounded-full bg-accent-red/10 px-2 py-0.5 text-xs text-accent-red">
            required
          </span>
        ) : null}
        {defaultValue !== undefined ? (
          <span className="text-xs text-foreground-muted">
            default: <code className="font-mono-tabular">{defaultValue}</code>
          </span>
        ) : null}
      </div>
      {children ? (
        <div className="mt-1 text-sm text-foreground [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
          {children}
        </div>
      ) : null}
    </div>
  );
}
