// ─────────────────────────────────────────────────────────────────────────────
// LEAKAGE, a reading of the concept journal: realization showing through text
// that should state meaning. A concept's wording, a decision or a visible
// example that names code, files, commands, flags, identifiers, tools or
// libraries instead of what must hold.
//
// Detection is lexical, in the manner of requirements smells: each rule below
// finds the narrowest span that leaks (a tool's name, a command and its
// subcommand, a path), never a whole sentence. A span lying inside another
// span is the same leak and is reported once, as the wider; a quotation in
// code type that is plain prose is no leak itself, so only the leaks inside it
// are reported. A context's own words are never leakage: a span made only of
// the words of its concepts' names raises nothing, nor a command one of them
// names. A word its current subject names is its own only as that plain word:
// a command, a quotation in code type or a flag that holds it still leaks.
// An ordinary English word is a leak only used as a command.
//
// Leakage warns only where realization replaces meaning: a decision recorded
// as constraining realization names what it constrains on purpose, and is
// never inspected; one stating meaning, or of no recorded kind, is.
//
// A wording, a concept's or a context's description, states only what holds
// now: it is also warned where it cites a decision by its number, recounts its
// history (what changed, or what something used to be or no longer is), or
// only extends the version it replaces, keeping the old wording whole and
// adding to it. Its reason and its version chain carry why and what it was.
//
// A leak is a WARNING, never a refusal: a word list cannot tell every
// legitimate use from a leak, so the architect reads the warnings and judges.
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/** Where the visible examples are, relative to the top of the repository. */
export const EXAMPLES_DIR = 'design/examples';

/** The passage a warning names: a live concept, a decision by its title with
 *  its id as a reference, a visible example by its file (relative to the
 *  repository) and number, or one field of a context's current description. */
export type Passage =
  | {
      readonly kind: 'concept';
      readonly context: string;
      readonly name: string;
    }
  | {
      readonly kind: 'decision';
      readonly title: string;
      readonly context: string;
      readonly id: string;
    }
  | {
      readonly kind: 'example';
      readonly file: string;
      readonly number: number;
    }
  | {
      readonly kind: 'context';
      readonly context: string;
      readonly field: 'subject' | 'relation';
    };

/** One leak: the words that leak, as they appear, and the rule they break. */
export interface Leak {
  readonly words: string;
  readonly rule: string;
}

/** One leak in one passage. */
export interface Warning extends Leak {
  readonly passage: Passage;
}

/** Commands whose subcommand belongs to the command it names. */
const COMMANDS = [
  'pnpm',
  'npm',
  'npx',
  'yarn',
  'bun',
  'deno',
  'git',
  'gh',
  'omp',
  'cratylus',
  'docker',
  'vitest',
  'biome',
  'tsc',
  'cargo',
  'pip',
  'brew',
];

/** Tools whose name is also an ordinary English word: a leak only where it is
 *  used as a command, given a subcommand or a flag. */
const ORDINARY = [
  'babel',
  'biome',
  'brew',
  'curl',
  'docker',
  'jest',
  'mocha',
  'prettier',
  'python',
  'rollup',
  'yarn',
];

/** Subcommands that make the word before them a command. */
const SUBCOMMANDS = [
  'add',
  'branch',
  'build',
  'changeset',
  'checkout',
  'cherry-pick',
  'ci',
  'clone',
  'commit',
  'concepts',
  'diff',
  'dlx',
  'exec',
  'fetch',
  'init',
  'install',
  'link',
  'lint',
  'log',
  'merge',
  'pull',
  'push',
  'rebase',
  'remove',
  'reset',
  'rev-parse',
  'run',
  'show',
  'stash',
  'status',
  'tag',
  'test',
  'typecheck',
  'update',
  'upgrade',
  'worktree',
];

/** Well-known tools, libraries and formats, by name alone; an ordinary English
 *  word is named only as a command (`ORDINARY`), and so are `cratylus` (the
 *  project) and `node`. */
const TOOLS = [
  'awk',
  'changesets',
  'commander.js',
  'deno',
  'esbuild',
  'eslint',
  'git',
  'github',
  'gitlab',
  'graphql',
  'grep',
  'javascript',
  'jq',
  'json',
  'jsonl',
  'kubernetes',
  'lodash',
  'mongodb',
  'mysql',
  'node.js',
  'nodejs',
  'npm',
  'npx',
  'omp',
  'pnpm',
  'postgres',
  'postgresql',
  'redis',
  'ripgrep',
  'sed',
  'sqlite',
  'toml',
  'tsc',
  'tsup',
  'typescript',
  'ulid',
  'uuid',
  'vite',
  'vitest',
  'webpack',
  'yaml',
  'zod',
  'zsh',
];

/** File extensions that make a word a file's name. */
const EXTENSIONS =
  'ts|tsx|js|jsx|mjs|cjs|json|jsonl|md|yaml|yml|toml|sh|py|rs|go|lock|txt|html|css|sql|env';

/** Directories a repository conventionally has: a slash-joined word naming
 *  one is a file location even without a leading `./` or a trailing `/`. */
const DIRECTORIES =
  /^(?:packages|src|dist|lib|bin|test|tests|docs|scripts|node_modules|design|apps|fixtures)$/;

/** A quotation in code type that is plain prose: words with spaces between
 *  and ordinary sentence punctuation, nothing only code has. */
const PROSE =
  /^`(?=[^`]* )(?:[\p{L}\p{N}’' ,;:!?()“”"—–]|-(?!-)|\.(?![\p{L}\p{N}]))+`$/u;

/** Each rule: what it is called, the spans it finds, and which of them leak
 *  when not all do. Where two rules find the same span, the earlier names it. */
const RULES: readonly {
  rule: string;
  pattern: RegExp;
  keep?: (span: string) => boolean;
}[] = [
  {
    rule: 'quotes code',
    pattern: /`[^`\n]+`/g,
    keep: (span) => !PROSE.test(span),
  },
  {
    // Located from the root, home or here, ending in a directory or a file's
    // extension, through a hidden, private or scoped part, through three or
    // more parts, or through a directory a repository conventionally has;
    // two plain words joined by a slash, such as and/or, are prose.
    rule: 'names a file location',
    pattern: /(?<![\w./~@-])(?:~|\.{1,2})?\/?(?:[\w.@-]+\/)+[\w.@-]*/g,
    keep: (span) =>
      /^(?:\/|~\/|\.{1,2}\/)|\/$|(?:^|\/)[._@]|\.[a-z]{1,5}$|\/.*\//i.test(
        span,
      ) || span.split('/').some((part) => DIRECTORIES.test(part)),
  },
  {
    rule: 'names a file',
    pattern: new RegExp(
      `(?<![\\w/.-])[\\w-]+\\.(?:${EXTENSIONS})(?![\\w-])`,
      'gi',
    ),
  },
  {
    rule: 'names a command',
    pattern: new RegExp(
      `(?<![\\w./-])(?:${[...COMMANDS, ...ORDINARY].join('|')})[ \\t]+(?:(?:${SUBCOMMANDS.join('|')})(?![\\w/-]|\\.\\w)|--[a-z][\\w-]*)`,
      'gi',
    ),
  },
  {
    rule: 'names a command-line flag',
    // A flag stands as a word of its own; a dash between words is no flag.
    pattern: /(?<=^|[\s`(["'=])--[a-z][a-z0-9-]*/g,
  },
  {
    rule: 'names a tool or library',
    pattern: new RegExp(
      `(?<![\\w./-])(?:${TOOLS.join('|').replace(/\./g, '\\.')})(?![\\w-]|\\.\\w)`,
      'gi',
    ),
  },
  {
    // camelCase from a word of two letters or more, PascalCase of three or
    // more words, snake_case, or a call; a brand of two capitals (DevOps,
    // OpenAI, PhD, LaTeX) is a name, and a tool that is one stays on the list.
    rule: 'names a code identifier',
    pattern:
      /\b(?:[a-z]{2,}[a-z0-9]*[A-Z][A-Za-z0-9]*|[A-Z][a-z0-9]+(?:[A-Z][a-z0-9]+){2,}|[A-Za-z][A-Za-z0-9]*_[A-Za-z0-9_]*[A-Za-z0-9])\b|\b[A-Za-z_][\w.]*\(\)/g,
  },
];

/** The words a context owns: `names`, its concepts' names and each word in
 *  them, which own any span they make up and any command one of them names;
 *  and `plain`, each bare word its subject names, owned only on its own. */
export interface Vocabulary {
  readonly names: ReadonlySet<string>;
  readonly plain: ReadonlySet<string>;
}

/** The words of a context: the names of its concepts, and each word in them,
 *  and each bare word its `subjects` name: a word joined to others by a
 *  possessive, leading dashes or a hyphen still names its bare word. */
export function vocabulary(
  names: readonly string[],
  subjects: readonly string[] = [],
): Vocabulary {
  const named = new Set<string>();
  for (const name of names) {
    const lower = name.toLowerCase();
    named.add(lower);
    for (const word of lower.split(/\s+/)) named.add(word);
  }
  const plain = new Set<string>();
  for (const subject of subjects)
    for (const word of subject
      .toLowerCase()
      .replace(/['’]s(?![\p{L}\p{N}])/gu, '')
      .split(/[^\p{L}\p{N}.]+/u)) {
      const bare = word.replace(/^\.+|\.+$/g, '');
      if (bare !== '') plain.add(bare);
    }
  return { names: named, plain };
}

/** The leaks in `text`, in the order they appear; spans made only of the
 *  context's concept-name words raise none, nor a command one of them names,
 *  nor a span that is just a plain word its subject names. */
export function leaks(
  text: string,
  own: Vocabulary = { names: new Set(), plain: new Set() },
): Leak[] {
  const { names, plain } = own;
  const found: { start: number; end: number; rule: string }[] = [];
  for (const { rule, pattern, keep } of RULES)
    for (const match of text.matchAll(pattern)) {
      const span = match[0].replace(/[.,;:!?]+$/, '');
      if (keep !== undefined && !keep(span)) continue;
      const words = span.toLowerCase().replace(/`/g, '').trim().split(/\s+/);
      if (
        plain.has(span.toLowerCase()) ||
        names.has(words.join(' ')) ||
        words.every((w) => names.has(w)) ||
        (rule === 'names a command' && names.has(words[0] as string))
      )
        continue;
      found.push({ start: match.index, end: match.index + span.length, rule });
    }
  return found
    .filter(
      (leak, i) =>
        !found.some(
          (other, j) =>
            j !== i &&
            other.start <= leak.start &&
            other.end >= leak.end &&
            (other.end - other.start > leak.end - leak.start || j < i),
        ),
    )
    .sort((a, b) => a.start - b.start)
    .map(({ start, end, rule }) => ({ words: text.slice(start, end), rule }));
}

/** What a wording must not tell besides realization: the decision it rests on,
 *  by number, and its own history. Each phrase of history says that something
 *  changed or what it was before; a word such as “now” or “earlier” alone is
 *  current meaning (“as it now means”, “the earlier kept in its history”). */
const RECOUNTING: readonly { rule: string; pattern: RegExp }[] = [
  {
    rule: 'cites a decision',
    pattern:
      /\b(?:decisions?|ADRs?)[ \t]+(?:no\.[ \t]*|#[ \t]*)?\d+(?:(?:[ \t]*,[ \t]*|[ \t]+(?:and|or)[ \t]+)#?\d+)*/gi,
  },
  {
    rule: 'recounts history',
    pattern: new RegExp(
      [
        String.raw`\bno longer\b`,
        String.raw`\bnot any(?:more| longer)\b`,
        String.raw`\banymore\b`,
        String.raw`\bused to (?:be|mean|name|say|hold|have|do|carry|cover|include)\b`,
        String.raw`\b(?:formerly|previously|originally|hitherto|henceforth)\b`,
        String.raw`\b(?:until|up to|from) now\b`,
        String.raw`\b(?:as|than) before\b`,
        String.raw`\b(?:is|are) now\b`,
        String.raw`\bnow (?:also|instead)\b`,
        String.raw`\b(?:was|were|has been|have been|had been|got) (?:renamed|replaced|removed|dropped|changed|reworded|moved|split|merged|introduced|added|extended|narrowed|widened)\b`,
        String.raw`\b(?:renamed|reworded) (?:from|to)\b`,
      ].join('|'),
      'gi',
    ),
  },
];

/** The places in a wording, a concept's or a context's description, where it
 *  cites a decision by its number or recounts its history, in order. */
export function recounts(text: string): Leak[] {
  return RECOUNTING.flatMap(({ rule, pattern }) =>
    [...text.matchAll(pattern)].map((match) => ({
      at: match.index,
      leak: { words: match[0], rule },
    })),
  )
    .sort((a, b) => a.at - b.at)
    .map(({ leak }) => leak);
}

/** Text as it is said: spacing collapsed and the closing punctuation dropped. */
const said = (text: string): string =>
  text
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.;:,!?]+$/, '');

/** Where `wording` only extends one of `replaced`, the wordings of the versions
 *  it supersedes: it keeps one of them whole, case aside, and adds to it. The
 *  words that leak are what it adds, as it says them. */
export function extending(
  wording: string,
  replaced: readonly string[],
): Leak[] {
  const now = said(wording);
  for (const before of replaced.map(said)) {
    if (before === '' || before.length >= now.length) continue;
    const at = now.toLowerCase().indexOf(before.toLowerCase());
    if (at === -1) continue;
    const words = [now.slice(0, at), now.slice(at + before.length)]
      .map((part) => part.replace(/^[\s.;:,]+|\s+$/g, ''))
      .filter((part) => part !== '')
      .join(' … ');
    return [{ words, rule: 'only extends the version it replaces' }];
  }
  return [];
}

/** A visible example: its file relative to the repository, its number, the
 *  context it belongs to, and its text. */
export interface VisibleExample {
  readonly file: string;
  readonly number: number;
  readonly context: string;
  readonly text: string;
}

/** The numbered examples of an examples file's `text`, in order: a line
 *  `N. ...` opens example N, a heading closes it. */
export function examplesIn(
  text: string,
): { readonly number: number; readonly text: string }[] {
  const examples: { number: number; text: string }[] = [];
  let current: { number: number; lines: string[] } | undefined;
  const close = () => {
    if (current !== undefined)
      examples.push({
        number: current.number,
        text: current.lines.join('\n').trim(),
      });
    current = undefined;
  };
  for (const line of text.split('\n')) {
    const numbered = /^(\d+)\.\s(.*)$/.exec(line);
    if (numbered !== null) {
      close();
      current = {
        number: Number(numbered[1]),
        lines: [numbered[2] as string],
      };
    } else if (line.startsWith('#')) close();
    else current?.lines.push(line);
  }
  close();
  return examples;
}

/** The numbered examples in `design/examples` of the repository at `top`, by
 *  file, then number. An example belongs to the context its file's
 *  `Context:` line names, else to the directory its file is in. */
export function visibleExamples(top: string): VisibleExample[] {
  const dir = join(top, EXAMPLES_DIR);
  let files: string[];
  try {
    files = readdirSync(dir, { recursive: true, encoding: 'utf8' })
      .filter((file) => file.endsWith('.md'))
      .sort();
  } catch {
    return [];
  }
  return files.flatMap((file) => {
    const text = readFileSync(join(dir, file), 'utf8');
    const named = text
      .split('\n')
      .map((line) => /^Context:\s*([^.,;\n]+)/.exec(line)?.[1]?.trim())
      .find((name) => name !== undefined);
    const context = named ?? file.split(sep)[0] ?? '';
    const path = relative(top, join(dir, file)).split(sep).join('/');
    return examplesIn(text).map((e) => ({ file: path, context, ...e }));
  });
}
