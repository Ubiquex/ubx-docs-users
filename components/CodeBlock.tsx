// CodeBlock is a real, hand-rolled tokenizer, not a placeholder --
// scoped honestly to the three languages this site actually renders
// (Go/TypeScript/Python starter examples), not a general-purpose
// highlighter. UBI-240's own recorded palette: green for keywords and
// type names, red for string literals, yellow for property names. Red
// also carries the required badge elsewhere on this site, which the
// design pass flagged as worth watching since strings and that badge
// then share a color -- true here too, a deliberate, recorded choice,
// not an oversight.
//
// A real syntax-highlighting library (Shiki, tied to a real Persian
// green/red/yellow theme) is the honest long-term answer once this
// goes wide across seven providers and far more language variety --
// this slice proves the palette and the page shape, not the final
// tokenizer.
//
// UBI-247 extended the language set. The provider site only ever
// rendered Go/TypeScript/Python starter examples, but hand-written user
// docs are dominated by shell: across the 39 Concepts pages moved in
// that slice, 108 of 116 real code fences are bash, json or hcl, none
// of which this handled. Theme A itself is unchanged -- same
// --color-code-* tokens, same green/red/yellow assignment -- these are
// additional keyword sets and comment markers, not a new palette.
// Anything still unrecognised falls through to UNHIGHLIGHTED below,
// which renders in the same code surface with no colour rather than
// throwing or silently mis-colouring.

// Boolean/null literals live in each language's own keyword set rather
// than a separate kind -- theme A colors keywords and booleans
// identically (green), so there's nothing a distinct kind would buy.
const GO_KEYWORDS = new Set([
  "func", "package", "import", "return", "var", "const", "type", "struct",
  "if", "else", "for", "range", "defer", "go", "chan", "select", "case",
  "switch", "default", "interface", "map", "true", "false", "nil",
]);

const TS_KEYWORDS = new Set([
  "import", "from", "const", "let", "function", "return", "new", "as",
  "type", "interface", "export", "default", "true", "false", "null",
  "undefined",
]);

const PY_KEYWORDS = new Set([
  "import", "from", "def", "return", "class", "as", "with", "if", "else",
  "True", "False", "None",
]);

// Shell: ubx's own verbs are highlighted alongside real shell builtins,
// because in these docs the subject of almost every fence is a ubx
// command and the reader is scanning for it.
const BASH_KEYWORDS = new Set([
  "ubx", "cd", "mkdir", "export", "echo", "cat", "if", "then", "else", "fi",
  "for", "in", "do", "done", "while", "case", "esac", "function", "return",
  "source", "set", "sudo", "curl", "git", "true", "false",
]);

// HCL, the .ubx/config.hcl surface these docs describe.
const HCL_KEYWORDS = new Set([
  "resource", "provider", "variable", "output", "module", "data", "locals",
  "terraform", "true", "false", "null",
]);

// JSON has no keywords beyond its three literals.
const JSON_KEYWORDS = new Set(["true", "false", "null"]);

type Lang = "go" | "typescript" | "python" | "bash" | "hcl" | "json";

const KEYWORDS: Record<Lang, Set<string>> = {
  go: GO_KEYWORDS,
  typescript: TS_KEYWORDS,
  python: PY_KEYWORDS,
  bash: BASH_KEYWORDS,
  hcl: HCL_KEYWORDS,
  json: JSON_KEYWORDS,
};

// JSON has no comment syntax at all. Giving it a marker would make a
// "//" inside a real string value outside a already-sealed string token
// read as a comment, so it gets a sentinel that cannot occur.
const COMMENT_MARKER: Record<Lang, string> = {
  go: "//",
  typescript: "//",
  python: "#",
  bash: "#",
  hcl: "#",
  json: "\u0000",
};

type Token = {
  text: string;
  kind: "keyword" | "type" | "number" | "string" | "property" | "comment" | "plain";
};

// Splits off a trailing line comment once the rest of the line is
// already tokenized, rather than detecting it during the main regex
// pass -- reusing the already-correct string/identifier split means a
// comment marker inside a string (`"http://..."`) is never mistaken
// for a real comment, since it's already sealed inside a single
// "string" token by the time this runs and this skips those.
function splitTrailingComment(tokens: Token[], marker: string): Token[] {
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (tok.kind === "string") continue;
    const idx = tok.text.indexOf(marker);
    if (idx === -1) continue;
    const before = tok.text.slice(0, idx);
    const commentText = tok.text.slice(idx) + tokens.slice(i + 1).map((t) => t.text).join("");
    const result = tokens.slice(0, i);
    if (before) result.push({ text: before, kind: tok.kind });
    result.push({ text: commentText, kind: "comment" });
    return result;
  }
  return tokens;
}

function tokenizeLine(line: string, lang: Lang): Token[] {
  const tokens: Token[] = [];
  // Order matters: strings first (so a keyword-looking word inside a
  // string is never re-tokenized), then number literals, then
  // property-name-before-colon (struct literal / object literal
  // fields), then identifiers.
  const pattern =
    /("(?:[^"\\]|\\.)*")|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)(\s*:)|([A-Za-z_][A-Za-z0-9_.]*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(line)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ text: line.slice(lastIndex, match.index), kind: "plain" });
    }
    const [full, stringLit, numberLit, propName, propColon, ident] = match;
    if (stringLit) {
      tokens.push({ text: stringLit, kind: "string" });
    } else if (numberLit) {
      tokens.push({ text: numberLit, kind: "number" });
    } else if (propName && propColon) {
      tokens.push({ text: propName, kind: "property" });
      tokens.push({ text: propColon, kind: "plain" });
    } else if (ident) {
      if (KEYWORDS[lang].has(ident)) {
        tokens.push({ text: ident, kind: "keyword" });
      } else if (/^[A-Z]/.test(ident)) {
        tokens.push({ text: ident, kind: "type" });
      } else {
        tokens.push({ text: ident, kind: "plain" });
      }
    }
    lastIndex = match.index + full.length;
  }
  if (lastIndex < line.length) {
    tokens.push({ text: line.slice(lastIndex), kind: "plain" });
  }
  return splitTrailingComment(tokens, COMMENT_MARKER[lang]);
}

// Theme A: green for keywords/booleans/numbers/type names, red for
// string literals, yellow for property names, neutral for identifiers
// and punctuation (the unclassified "plain" text between real tokens),
// muted grey for comments. Colors come from dedicated --color-code-*
// tokens (see globals.css), not the site's own --color-primary/
// --color-accent-* -- those also brand headings and links, and don't
// carry the same contrast requirement as small body-weight code text.
const KIND_CLASS: Record<Token["kind"], string> = {
  keyword: "text-code-green",
  type: "text-code-green",
  number: "text-code-green",
  string: "text-code-red",
  property: "text-code-yellow",
  comment: "text-foreground-muted",
  plain: "text-foreground",
};

// Fences whose language this tokenizer does not know still render in the
// same code surface, uncoloured, rather than being dropped or forced
// through a tokenizer built for a different grammar.
function UnhighlightedBlock({ code }: { code: string }) {
  return (
    <pre className="overflow-x-auto rounded-2xl bg-code p-4 text-sm leading-relaxed">
      <code className="font-mono-tabular text-foreground">{code.replace(/\n$/, "")}</code>
    </pre>
  );
}

const SUPPORTED: readonly string[] = ["go", "typescript", "python", "bash", "hcl", "json"];

export function isSupportedLang(lang: string): lang is Lang {
  return SUPPORTED.includes(lang);
}

export function CodeBlock({ code, lang }: { code: string; lang: string }) {
  if (!isSupportedLang(lang)) {
    return <UnhighlightedBlock code={code} />;
  }
  const lines = code.replace(/\n$/, "").split("\n");
  return (
    <pre className="overflow-x-auto rounded-2xl bg-code p-4 text-sm leading-relaxed">
      <code className="font-mono-tabular">
        {lines.map((line, i) => (
          <div key={i}>
            {tokenizeLine(line, lang).map((tok, j) => (
              <span key={j} className={KIND_CLASS[tok.kind]}>
                {tok.text}
              </span>
            ))}
            {line === "" ? " " : null}
          </div>
        ))}
      </code>
    </pre>
  );
}
