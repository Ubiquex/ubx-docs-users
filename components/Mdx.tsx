import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";
import { CodeBlock } from "@ubx/docs-ui";
import * as mintlify from "./mintlify";

// Maps markdown onto this site's own theme tokens, and supplies the
// Mintlify component shims the migrated pages call.
//
// Concepts needed no shims at all: zero MDX components across its 39
// pages, confirmed before building anything. The other five sections are
// the opposite, 396 component uses across nine distinct components, so
// the shim layer is the bulk of slice 3 rather than an afterthought.
// Measured distribution: ResponseField 189, Card 85, Step 38, Note 36,
// Tab 20, Warning 14, Steps 9, CardGroup 4, Expandable 1.

function extractText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (node && typeof node === "object" && "props" in node) {
    return extractText((node as { props: { children?: React.ReactNode } }).props.children);
  }
  return "";
}

const components = {
  // Mintlify shims, spread first so the element mappings below still win
  // for anything that collides with a plain HTML tag name.
  ...mintlify,
  h1: (p: React.ComponentProps<"h1">) => (
    <h1 className="mt-10 mb-4 text-2xl font-medium text-primary" {...p} />
  ),
  h2: (p: React.ComponentProps<"h2">) => (
    <h2 className="mt-10 mb-3 border-b border-border pb-2 text-xl font-medium text-foreground" {...p} />
  ),
  h3: (p: React.ComponentProps<"h3">) => (
    <h3 className="mt-8 mb-2 text-base font-medium text-foreground" {...p} />
  ),
  p: (p: React.ComponentProps<"p">) => (
    <p className="my-4 leading-relaxed text-foreground" {...p} />
  ),
  ul: (p: React.ComponentProps<"ul">) => (
    <ul className="my-4 list-disc space-y-1 pl-6 text-foreground" {...p} />
  ),
  ol: (p: React.ComponentProps<"ol">) => (
    <ol className="my-4 list-decimal space-y-1 pl-6 text-foreground" {...p} />
  ),
  a: ({ href, ...rest }: React.ComponentProps<"a">) => {
    const target = href ?? "#";
    // Mintlify wrote absolute in-site paths like /concepts/ledger, which
    // remain correct here because the section keeps its own URL segment.
    return target.startsWith("/") ? (
      <Link href={target} className="text-primary hover:underline" {...rest} />
    ) : (
      <a href={target} className="text-primary hover:underline" {...rest} />
    );
  },
  blockquote: (p: React.ComponentProps<"blockquote">) => (
    <blockquote className="my-4 border-l-2 border-primary pl-4 text-foreground-muted" {...p} />
  ),
  table: (p: React.ComponentProps<"table">) => (
    <div className="my-6 overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...p} />
    </div>
  ),
  th: (p: React.ComponentProps<"th">) => (
    <th className="border-b border-border px-3 py-2 text-left font-medium text-foreground" {...p} />
  ),
  td: (p: React.ComponentProps<"td">) => (
    <td className="border-b border-border px-3 py-2 align-top text-foreground" {...p} />
  ),
  hr: (p: React.ComponentProps<"hr">) => <hr className="my-8 border-border" {...p} />,

  // Inline code only. Fenced blocks arrive as <pre><code
  // className="language-x">, which `pre` below intercepts first.
  code: (p: React.ComponentProps<"code">) => (
    <code className="rounded bg-field px-1.5 py-0.5 text-[0.9em] text-foreground" {...p} />
  ),

  pre: (props: React.ComponentProps<"pre">) => {
    const child = props.children as React.ReactElement<{
      className?: string;
      children?: React.ReactNode;
    }> | undefined;
    const className = child?.props?.className ?? "";
    const lang = className.replace(/^language-/, "") || "text";
    // The wrapping div carries the vertical rhythm. CodeBlock sets no
    // margin of its own, deliberately, because the marketing site places
    // it inside a grid where a margin would be wrong. Without this, two
    // fences in a row sat flush against each other with no gap, which
    // read as one block with a seam rather than two blocks.
    return (
      <div className="my-4">
        <CodeBlock code={extractText(child?.props?.children)} lang={lang} />
      </div>
    );
  },
};

export function Mdx({ source }: { source: string }) {
  return <MDXRemote source={source} components={components} />;
}
