"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Copied from ubx-docs-providers with ONE deliberate change, the other
// half of this slice's point (UBI-247): the index entry is a generic
// shape rather than the provider site's own wire-type record.
//
// The provider site's copy types entries as
// { provider, providerName, wireType, dottedName, category, isDataSource, path }
// and filters on dottedName/wireType. None of that exists here: this
// site indexes pages, sections and headings. Extracting that version
// into @ubx/docs-ui would have forced a generic shape to be invented
// before either consumer's real needs were known, which is how you get
// an abstraction that fits neither.
//
// The shape below is the smallest thing both sites can actually
// produce, arrived at from two real call sites rather than one:
//
//   title     what the reader is looking for and what is emphasised
//   subtitle  the disambiguator, optional, second line
//   group     the bucket shown as a dim tag, and a secondary match key
//   path      where to go
//
// The provider site maps onto it without loss: title = dottedName,
// subtitle = wireType, group = category. That mapping is the evidence
// this shape is genuinely shared rather than merely plausible, and it
// is what the extraction slice will encode.

export type SearchEntry = {
  title: string;
  subtitle?: string;
  group?: string;
  path: string;
};

export function GlobalSearch({
  /** Where the prebuilt index lives. Each site builds its own. */
  indexUrl = "/search-index.json",
  placeholder = "Search",
}: {
  indexUrl?: string;
  placeholder?: string;
}) {
  const [index, setIndex] = useState<SearchEntry[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch(indexUrl)
      .then((r) => r.json())
      .then(setIndex)
      .catch(() => setIndex([]));
  }, [indexUrl]);

  const q = query.trim().toLowerCase();
  const results = q
    ? index
        .filter(
          (e) =>
            e.title.toLowerCase().includes(q) ||
            e.subtitle?.toLowerCase().includes(q) ||
            e.group?.toLowerCase().includes(q),
        )
        .slice(0, 20)
    : [];

  return (
    <div className="relative">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded border border-border bg-field px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none"
      />

      {results.length > 0 ? (
        <ul className="absolute z-20 mt-1 max-h-96 w-full overflow-y-auto rounded border border-border bg-background shadow-lg">
          {results.map((r) => (
            <li key={r.path}>
              <Link
                href={r.path}
                onClick={() => setQuery("")}
                className="block px-3 py-2 hover:bg-surface"
              >
                <div className="text-sm text-foreground">{r.title}</div>
                {r.subtitle ? (
                  <div className="text-xs text-foreground-muted">{r.subtitle}</div>
                ) : null}
                {r.group ? (
                  <div className="text-xs text-foreground-muted">{r.group}</div>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {q && results.length === 0 ? (
        <div className="absolute z-20 mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground-muted shadow-lg">
          No matches
        </div>
      ) : null}
    </div>
  );
}
