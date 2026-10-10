// ─────────────────────────────────────────────────────────────────────────────
// IMPLEMENTATION LEAKAGE: realization showing through text that should state
// meaning. A concept's wording, a decision or a visible example that names
// code, files, commands, flags, identifiers, tools or libraries instead of what
// must hold.
//
// Detection is lexical, in the manner of requirements smells: each rule below
// finds the narrowest span that leaks (a tool's name, a command and its
// subcommand, a path), never a whole sentence. A span lying inside another
// span is the same leak and is reported once, as the wider. A context's own
// words are never leakage: a span made only of the words of its concepts'
// names raises nothing, and ordinary English words are on no list.
//
// A leak is a WARNING, never a refusal: a word list cannot tell every
// legitimate use from a leak, so the architect reads the warnings and judges.
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/** Where the visible examples are, relative to the top of the repository. */
export const EXAMPLES_DIR = 'design/examples';

/** The passage a warning names: a live concept, a decision, or a visible
 *  example by its file (relative to the repository) and number. */
export type Passage =
  | {
      readonly kind: 'concept';
      readonly context: string;
      readonly name: string;
    }
  | { readonly kind: 'decision'; readonly context: string; readonly id: string }
  | {
      readonly kind: 'example';
      readonly file: string;
      readonly number: number;
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
  'eventtap',
  'exec',
  'fetch',
  'init',
  'install',
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

/** Well-known tools, libraries and formats, by name alone; none is an ordinary
 *  English word, so `cratylus` (the project) and `node` are named only as a
 *  command. */
const TOOLS = [
  'awk',
  'babel',
  'biome',
  'brew',
  'changesets',
  'commander.js',
  'curl',
  'deno',
  'docker',
  'esbuild',
  'eslint',
  'git',
  'github',
  'gitlab',
  'graphql',
  'grep',
  'javascript',
  'jest',
  'jq',
  'json',
  'jsonl',
  'kubernetes',
  'lodash',
  'mocha',
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
  'prettier',
  'python',
  'redis',
  'ripgrep',
  'rollup',
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
  'yarn',
  'zod',
  'zsh',
];

/** File extensions that make a word a file's name. */
const EXTENSIONS =
  'ts|tsx|js|jsx|mjs|cjs|json|jsonl|md|yaml|yml|toml|sh|py|rs|go|lock|txt|html|css|sql|env';

/** Each rule: what it is called, the spans it finds, and which of them leak
 *  when not all do. Where two rules find the same span, the earlier names it. */
const RULES: readonly {
  rule: string;
  pattern: RegExp;
  keep?: (span: string) => boolean;
}[] = [
  {
    // Plain words set in code type, such as a quoted phrase, state meaning;
    // anything else in it is code.
    rule: 'quotes code',
    pattern: /`[^`\n]+`/g,
    keep: (span) => !/^`[A-Za-z’'-]+(?: [A-Za-z’'-]+)+`$/.test(span),
  },
  {
    rule: 'names a file location',
    pattern: /(?<![\w./~@-])(?:~|\.{1,2})?\/?(?:[\w.@-]+\/)+[\w.@-]*/g,
    keep: (span) =>
      /^(?:\/|~\/|\.{1,2}\/)|\/$|(?:^|\/)[._]|\.[a-z]{1,5}$/i.test(span),
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
      `(?<![\\w./-])(?:${COMMANDS.join('|')})[ \\t]+(?:${SUBCOMMANDS.join('|')})(?![\\w/-]|\\.\\w)`,
      'gi',
    ),
  },
  {
    rule: 'names a command-line flag',
    pattern: /(?<![\w-])--[a-z][a-z0-9-]*/g,
  },
  {
    rule: 'names a tool or library',
    pattern: new RegExp(
      `(?<![\\w./-])(?:${TOOLS.join('|').replace(/\./g, '\\.')})(?![\\w-]|\\.\\w)`,
      'gi',
    ),
  },
  {
    rule: 'names a code identifier',
    pattern:
      /\b(?:[a-z][a-z0-9]*[A-Z][A-Za-z0-9]*|[A-Z][a-z0-9]+[A-Z][A-Za-z0-9]*|[A-Za-z][A-Za-z0-9]*_[A-Za-z0-9_]*[A-Za-z0-9])\b|\b[A-Za-z_][\w.]*\(\)/g,
  },
];

/** The words of a context: the names of its concepts, and each word in them. */
export function vocabulary(names: readonly string[]): ReadonlySet<string> {
  const words = new Set<string>();
  for (const name of names) {
    const lower = name.toLowerCase();
    words.add(lower);
    for (const word of lower.split(/\s+/)) words.add(word);
  }
  return words;
}

/** The leaks in `text`, in the order they appear; spans made only of `own`
 *  words, the context's own, raise none. */
export function leaks(
  text: string,
  own: ReadonlySet<string> = new Set(),
): Leak[] {
  const found: { start: number; end: number; rule: string }[] = [];
  for (const { rule, pattern, keep } of RULES)
    for (const match of text.matchAll(pattern)) {
      const span = match[0].replace(/[.,;:!?]+$/, '');
      if (keep !== undefined && !keep(span)) continue;
      const words = span.toLowerCase().replace(/`/g, '').trim();
      if (own.has(words) || words.split(/\s+/).every((w) => own.has(w)))
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

/** A visible example: its file relative to the repository, its number, the
 *  context it belongs to, and its text. */
export interface VisibleExample {
  readonly file: string;
  readonly number: number;
  readonly context: string;
  readonly text: string;
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
    const lines = readFileSync(join(dir, file), 'utf8').split('\n');
    const named = lines
      .map((line) => /^Context:\s*([^.,;\n]+)/.exec(line)?.[1]?.trim())
      .find((name) => name !== undefined);
    const context = named ?? file.split(sep)[0] ?? '';
    const path = relative(top, join(dir, file)).split(sep).join('/');
    const examples: VisibleExample[] = [];
    let current: { number: number; lines: string[] } | undefined;
    const close = () => {
      if (current !== undefined)
        examples.push({
          file: path,
          number: current.number,
          context,
          text: current.lines.join('\n').trim(),
        });
      current = undefined;
    };
    for (const line of lines) {
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
  });
}
