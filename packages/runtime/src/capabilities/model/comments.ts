// The comments of a source file, blanked, so a test title only in a comment — a
// test that cannot run — binds nothing. A small scanner, not a parser: it knows
// the comment syntax of a language by the extension of its files, and the
// string, template and regular-expression literals a comment marker may sit in
// (`'http://x'`, `/\/\//`), and nothing else of the language.

/** Words after which a `/` begins a regular expression, not a division. */
const BEFORE_EXPRESSION = new Set([
  'return',
  'typeof',
  'instanceof',
  'in',
  'of',
  'new',
  'delete',
  'void',
  'throw',
  'case',
  'do',
  'else',
  'yield',
  'await',
]);

/** The extensions of the languages whose strings, templates and regular
 *  expressions are scanned whole. */
const SCRIPTS = new Set(['js', 'jsx', 'mjs', 'cjs', 'ts', 'tsx', 'mts', 'cts']);

/** How a language writes its comments, and the literals a marker may sit in. */
interface Syntax {
  /** Each way a line comment opens, tried at a position by a sticky match. */
  readonly line: readonly RegExp[];
  /** Each block comment, by its opening and closing marker. */
  readonly block: readonly (readonly [open: string, close: string])[];
  /** Whether a block comment opened in a block comment is closed on its own. */
  readonly nested: boolean;
  /** Each block comment whose markers each begin a line (Ruby's `=begin`). */
  readonly lineBlock: readonly (readonly [open: string, close: string])[];
  /** Whether `--[`, any number of `=`, `[` opens a block comment closed by `]`,
   *  as many `=`, `]` (Lua's long comments). */
  readonly longBrackets: boolean;
  /** The characters a string literal is quoted by, ended by an unescaped one on
   *  its own line. */
  readonly quotes: string;
  /** The characters a literal is quoted by with no escape, across lines. */
  readonly raw: string;
  /** Whether `'x'` is a character literal, so a lone `'` (a lifetime, a prime)
   *  begins nothing. */
  readonly character: boolean;
}

/** The sticky expression matching `marker` at a position. */
const literally = (marker: string): RegExp =>
  new RegExp(marker.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&'), 'y');

const syntax = (
  s: {
    line?: readonly (string | RegExp)[];
    block?: readonly (readonly [string, string])[];
    nested?: boolean;
    lineBlock?: readonly (readonly [string, string])[];
    longBrackets?: boolean;
    quotes?: string;
    raw?: string;
    character?: boolean;
  } = {},
): Syntax => ({
  line: (s.line ?? []).map((m) =>
    typeof m === 'string' ? literally(m) : new RegExp(m.source, 'y'),
  ),
  block: s.block ?? [],
  lineBlock: s.lineBlock ?? [],
  longBrackets: s.longBrackets ?? false,
  nested: s.nested ?? false,
  quotes: s.quotes ?? `'"`,
  raw: s.raw ?? '',
  character: s.character ?? false,
});

const C_BLOCK = [['/*', '*/']] as const;

/** `//`, `/* *\/`, `#`: what a file of an extension the check does not know is
 *  read with. */
const FALLBACK = syntax({ line: ['//', '#'], block: C_BLOCK });

/** The syntax of each extension, lowercase and without its dot. */
const SYNTAXES = new Map<string, Syntax>();

const define = (extensions: string, s: Syntax): void => {
  for (const extension of extensions.split(' ')) SYNTAXES.set(extension, s);
};

// C family
define(
  'c h cc cpp cxx hh hpp hxx java groovy cs dart',
  syntax({ line: ['//'], block: C_BLOCK }),
);
define('go', syntax({ line: ['//'], block: C_BLOCK, raw: '`' }));
define('zig', syntax({ line: ['//'] }));
define('kt kts', syntax({ line: ['//'], block: C_BLOCK, nested: true }));
define(
  'scala rs',
  syntax({
    line: ['//'],
    block: C_BLOCK,
    nested: true,
    quotes: '"',
    character: true,
  }),
);
define(
  'swift',
  syntax({ line: ['//'], block: C_BLOCK, nested: true, quotes: '"' }),
);
define('php', syntax({ line: ['//', /#(?!\[)/], block: C_BLOCK }));

// `'`
define('vb', syntax({ line: ["'", /(?<!\w)[Rr][Ee][Mm](?!\w)/], quotes: '"' }));

// `#`
define('py ex exs pl pm t r cr yaml yml toml', syntax({ line: ['#'] }));
define('rb', syntax({ line: ['#'], lineBlock: [['=begin', '=end']] }));
define('sh bash zsh ksh', syntax({ line: [/(?<![$\w{])#/] }));
define('coffee', syntax({ line: ['#'], block: [['###', '###']] }));
define('ps1', syntax({ line: ['#'], block: [['<#', '#>']] }));
define('nim', syntax({ line: ['#'], block: [['#[', ']#']], nested: true }));
define(
  'jl',
  syntax({
    line: ['#'],
    block: [['#=', '=#']],
    nested: true,
    quotes: '"',
    character: true,
  }),
);

// `--`
define('lua', syntax({ line: ['--'], longBrackets: true }));
define('sql', syntax({ line: ['--'], block: C_BLOCK }));
/** `--` opens a comment unless it is part of an operator (`-->`, `|--`). */
const DASHES = /--+(?![!#$%&*+./<=>?@\\^|~:])/;
define(
  'hs elm',
  syntax({
    line: [DASHES],
    block: [['{-', '-}']],
    nested: true,
    quotes: '"',
    character: true,
  }),
);

// `;`
define('clj cljs cljc edn el', syntax({ line: [';'], quotes: '"' }));
define(
  'lisp cl lsp scm ss rkt',
  syntax({ line: [';'], block: [['#|', '|#']], nested: true, quotes: '"' }),
);

// `%`
define('erl hrl', syntax({ line: ['%'] }));

// `(* *)`
define(
  'ml mli',
  syntax({ block: [['(*', '*)']], nested: true, quotes: '"', character: true }),
);
define(
  'fs fsi fsx',
  syntax({
    line: ['//'],
    block: [['(*', '*)']],
    nested: true,
    quotes: '"',
    character: true,
  }),
);

/** From inside a string quoted by `q` at `from` in `s`: the index after its
 *  end, or at the line break an unclosed one stops at. */
function stringEnd(s: string, from: number, q: string): number {
  const n = s.length;
  let k = from;
  while (k < n) {
    const c = s[k];
    if (c === '\\') k += 2;
    else if (c === q) return k + 1;
    else if (c === '\n') return k;
    else k++;
  }
  return n;
}

/** Each character of `out` from `from` up to `to` made a space, but a line break. */
function blanked(out: string[], from: number, to: number): void {
  for (let k = from; k < to; k++) if (out[k] !== '\n') out[k] = ' ';
}

/** `source` with each comment blanked, every character of it but a line break
 *  made a space, so what is left keeps its lines and columns. The comments are
 *  those of the language the file `extension` (lowercase, without its dot)
 *  names; an extension the check does not know reads `//`, `/* *\/` and `#`
 *  comments. String literals are kept whole, and in a script (`js`, `ts` and
 *  their kin) template and regular-expression literals too. */
export function uncommented(source: string, extension: string): string {
  return SCRIPTS.has(extension)
    ? uncommentedScript(source)
    : uncommentedBy(source, SYNTAXES.get(extension) ?? FALLBACK);
}

/** A character literal: one character or one escape between `'`s. */
const CHARACTER =
  /'(?:[^'\\\n]|\\(?:u\{[0-9a-fA-F]+\}|x[0-9a-fA-F]{2}|\d+|[^\n]))'/y;

function uncommentedBy(s: string, language: Syntax): string {
  const n = s.length;
  const out = s.split('');
  /** The index after the block comment `[open, close]` begun at `from`. */
  const blockEnd = (from: number, [open, close]: readonly [string, string]) => {
    let k = from + open.length;
    let level = 1;
    while (k < n) {
      if (language.nested && s.startsWith(open, k)) {
        level++;
        k += open.length;
      } else if (s.startsWith(close, k)) {
        level--;
        k += close.length;
        if (level === 0) return k;
      } else k++;
    }
    return n;
  };
  /** The index after the line-start block comment closed by `close`, begun on
   *  the line at `from`: the end of the line a `close` ending its word begins. */
  const lineBlockEnd = (from: number, close: string) => {
    let k = s.indexOf('\n', from);
    while (k >= 0) {
      if (
        s.startsWith(close, k + 1) &&
        /\s|^$/.test(s[k + 1 + close.length] ?? '')
      ) {
        const end = s.indexOf('\n', k + 1);
        return end < 0 ? n : end;
      }
      k = s.indexOf('\n', k + 1);
    }
    return n;
  };
  /** The index after the long comment begun at `from`, if one is. */
  const longBracketEnd = (from: number): number | undefined => {
    if (!language.longBrackets || !s.startsWith('--[', from)) return undefined;
    let k = from + 3;
    while (s[k] === '=') k++;
    if (s[k] !== '[') return undefined;
    const close = `]${'='.repeat(k - from - 3)}]`;
    const end = s.indexOf(close, k + 1);
    return end < 0 ? n : end + close.length;
  };
  const lineStartsAt = (i: number) =>
    language.line.some((marker) => {
      marker.lastIndex = i;
      return marker.test(s);
    });

  let i = 0;
  while (i < n) {
    const c = s[i] as string;
    const block = language.block.find(([open]) => s.startsWith(open, i));
    const lineBlock =
      i === 0 || s[i - 1] === '\n'
        ? language.lineBlock.find(
            ([open]) =>
              s.startsWith(open, i) && /\s|^$/.test(s[i + open.length] ?? ''),
          )
        : undefined;
    const longEnd = longBracketEnd(i);
    if (block !== undefined) {
      const to = blockEnd(i, block);
      blanked(out, i, to);
      i = to;
    } else if (lineBlock !== undefined) {
      const to = lineBlockEnd(i, lineBlock[1]);
      blanked(out, i, to);
      i = to;
    } else if (longEnd !== undefined) {
      blanked(out, i, longEnd);
      i = longEnd;
    } else if (lineStartsAt(i)) {
      const end = s.indexOf('\n', i);
      const to = end < 0 ? n : end;
      blanked(out, i, to);
      i = to;
    } else if (language.raw.includes(c)) {
      const end = s.indexOf(c, i + 1);
      i = end < 0 ? n : end + 1;
    } else if (c === "'" && language.character) {
      CHARACTER.lastIndex = i;
      const literal = CHARACTER.exec(s);
      i += literal === null ? 1 : literal[0].length;
    } else if (language.quotes.includes(c)) {
      i = stringEnd(s, i + 1, c);
    } else i++;
  }
  return out.join('');
}

function uncommentedScript(s: string): string {
  const n = s.length;
  const out = s.split('');
  const blank = (from: number, to: number) => blanked(out, from, to);
  /** The brace depth outside each open `${` of a template. */
  const substitutions: number[] = [];
  let depth = 0;
  /** Whether what comes next is an operand, where `/` begins a regular expression. */
  let operand = true;

  /** From inside a template at `from`: the index after its closing backtick, or
   *  after the `${` it opens. */
  const template = (from: number): number => {
    let k = from;
    while (k < n) {
      const c = s[k];
      if (c === '\\') k += 2;
      else if (c === '`') return k + 1;
      else if (c === '$' && s[k + 1] === '{') {
        substitutions.push(depth);
        depth = 0;
        return k + 2;
      } else k++;
    }
    return n;
  };

  /** From inside a regular expression at `from`: the index after its closing `/`. */
  const regex = (from: number): number => {
    let k = from;
    let inClass = false;
    while (k < n) {
      const c = s[k];
      if (c === '\\') k += 2;
      else if (c === '\n') return k;
      else if (inClass) {
        if (c === ']') inClass = false;
        k++;
      } else if (c === '[') {
        inClass = true;
        k++;
      } else if (c === '/') return k + 1;
      else k++;
    }
    return n;
  };

  let i = 0;
  while (i < n) {
    const c = s[i] as string;
    if (c === '/' && s[i + 1] === '/') {
      const end = s.indexOf('\n', i);
      const to = end < 0 ? n : end;
      blank(i, to);
      i = to;
    } else if (c === '/' && s[i + 1] === '*') {
      const end = s.indexOf('*/', i + 2);
      const to = end < 0 ? n : end + 2;
      blank(i, to);
      i = to;
    } else if (c === '/' && operand) {
      i = regex(i + 1);
      operand = false;
    } else if (c === "'" || c === '"') {
      i = stringEnd(s, i + 1, c);
      operand = false;
    } else if (c === '`') {
      i = template(i + 1);
      operand = substitutions.length > 0 && s[i - 1] === '{';
    } else if (c === '}' && depth === 0 && substitutions.length > 0) {
      depth = substitutions.pop() as number;
      i = template(i + 1);
      operand = s[i - 1] === '{';
    } else if (/[\w$]/.test(c)) {
      let k = i + 1;
      while (k < n && /[\w$]/.test(s[k] as string)) k++;
      operand = BEFORE_EXPRESSION.has(s.slice(i, k));
      i = k;
    } else {
      if (c === '{') depth++;
      else if (c === '}') depth--;
      if (!/\s/.test(c)) operand = !(c === ')' || c === ']');
      i++;
    }
  }
  return out.join('');
}
