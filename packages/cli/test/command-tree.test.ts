// THE COMMAND TREE — one program whose help lists everything it has, whose README
// reference is that help once, and which refuses a word it does not know in one line.
//
// The program is built in-process and driven the way the bin is: words in, stdout,
// stderr and the exit code out. What the help lists is the one source the README is
// held to, so a command or verb added without its README entry, documented twice, or
// documented after it was removed is red here.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEPLOY_CHECK_EXIT } from '@cratylus/forge/deploy';
import { CAPABILITIES } from '@cratylus/runtime/capability';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { commandLine, main } from '../src/cratylus.js';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(
  readFileSync(join(packageRoot, 'package.json'), 'utf8'),
) as { version: string };
const readme = readFileSync(join(packageRoot, 'README.md'), 'utf8');

/** The consumer's commands, which the help lists first. */
const CONSUMER_COMMANDS = ['install', 'uninstall'] as const;

/** The corpus author's commands, which the help lists last, apart. */
const AUTHOR_COMMANDS = [
  'init',
  'add',
  'compose',
  'project',
  'optimize',
  'deploy',
  'explain',
  'catalog',
] as const;

interface Ran {
  readonly code: number;
  readonly out: string;
  readonly err: string;
}

/** Run the command line on `words`: what it printed to each stream, and its exit code. */
async function run(...words: string[]): Promise<Ran> {
  const out: string[] = [];
  const err: string[] = [];
  const write = (into: string[]) => (chunk: string | Uint8Array) => {
    into.push(String(chunk));
    return true;
  };
  vi.spyOn(process.stdout, 'write').mockImplementation(write(out));
  vi.spyOn(process.stderr, 'write').mockImplementation(write(err));
  const prior = process.exitCode;
  process.exitCode = undefined;
  try {
    await main(words);
    return {
      code: Number(process.exitCode ?? 0),
      out: out.join(''),
      err: err.join(''),
    };
  } finally {
    process.exitCode = prior;
    vi.restoreAllMocks();
  }
}

afterEach(() => vi.restoreAllMocks());

/** The names a help lists under `heading`: the first word of each line beneath it. */
function listed(help: string, heading: string): string[] {
  const lines = help.split('\n');
  const start = lines.indexOf(`${heading}:`);
  if (start === -1) return [];
  const names: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (!line.startsWith(' ')) {
      if (line.trim() === '') continue;
      break;
    }
    const name = /^ {2}(\S+)/.exec(line)?.[1];
    if (name !== undefined) names.push(name);
  }
  return names;
}

/** The verbs a capability declares, as its own refusal of a verb it lacks names them. */
async function declaredVerbs(capability: string): Promise<string[]> {
  const { err } = await run(capability, 'frob');
  const named = /the verbs are (.+?); run /.exec(err)?.[1];
  expect(named, `${capability} refusal names its verbs: ${err}`).toBeDefined();
  return (named as string).split(', ');
}

describe('the top-level help lists every command and capability', () => {
  it('names each command and each capability with its summary', async () => {
    const { code, out, err } = await run('--help');
    expect(code).toBe(0);
    expect(err).toBe('');
    const program = commandLine();
    expect(listed(out, 'Commands')).toEqual([...CONSUMER_COMMANDS]);
    expect(listed(out, 'Capabilities')).toEqual([...CAPABILITIES]);
    expect(listed(out, 'Corpus authoring')).toEqual([...AUTHOR_COMMANDS]);
    for (const command of program.commands)
      expect(out, command.name()).toContain(command.description());
  });

  it('lists the consumer’s commands, then the capabilities, then the corpus author’s', async () => {
    const { out } = await run('--help');
    const at = (heading: string) => out.indexOf(`\n${heading}:\n`);
    expect(at('Commands')).toBeGreaterThan(-1);
    expect(at('Commands')).toBeLessThan(at('Capabilities'));
    expect(at('Capabilities')).toBeLessThan(at('Corpus authoring'));
    expect(listed(out, 'Commands').slice(0, 2)).toEqual([
      'install',
      'uninstall',
    ]);
  });

  it('holds no blank spacer line and wraps no line', async () => {
    const { out } = await run('--help');
    expect(out.split('\n').slice(0, -1)).not.toContain('');
  });

  it('is what a call naming no command prints, on stderr, as a failure', async () => {
    const asked = await run('--help');
    const bare = await run();
    expect(bare.code).toBe(1);
    expect(bare.out).toBe('');
    expect(bare.err).toBe(asked.out);
  });

  it('answers --version and -v with the manifest version', async () => {
    for (const flag of ['--version', '-v']) {
      const { code, out, err } = await run(flag);
      expect(code).toBe(0);
      expect(err).toBe('');
      expect(out).toBe(`${manifest.version}\n`);
    }
  });
});

describe('each capability’s help names every verb it declares', () => {
  it.each(CAPABILITIES)('%s', async (capability) => {
    const verbs = await declaredVerbs(capability);
    const { code, out } = await run(capability, '--help');
    expect(code).toBe(0);
    expect(listed(out, 'Commands')).toEqual(verbs);
  });
});

describe('a usage error is one stderr line, exit 1, and nothing on stdout', () => {
  it.each([
    [['frobnicate'], ['frobnicate']],
    [
      ['install', '--harnes', 'claude'],
      ['--harnes', '--harness'],
    ],
    [['install', '--plugin', 'x'], ['--plugin']],
    [['compose', '--bogus'], ['--bogus']],
    [['--versoin'], ['--versoin', '--version']],
    [
      ['deploy', '--scope', 'porject'],
      ['porject', 'user', 'project'],
    ],
    [
      ['deploy', '--kind', 'bogus'],
      ['bogus', 'agent', 'skill', 'hooks', 'all'],
    ],
    [
      ['deploy', '--harness', 'nope'],
      ['nope', 'claude', 'omp'],
    ],
    [['optimize', 'x'], ['--plan']],
    [['optimize', '--plan', 'p'], ['source']],
    [['uninstall'], ['--harness']],
    [['compose', 'extra'], ['extra']],
  ] as const)('%j', async (words, names) => {
    const { code, out, err } = await run(...words);
    expect(code).toBe(1);
    expect(out).toBe('');
    const lines = err.trimEnd().split('\n');
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/^cratylus/);
    expect(lines[0]).toContain('--help');
    for (const name of names) expect(lines[0], name).toContain(name);
    expect(err).not.toMatch(/^\s+at /m);
    expect(err).not.toContain('CACError');
  });

  it('names the command whose help to read', async () => {
    const { err } = await run('install', '--harnes', 'claude');
    expect(err).toContain('cratylus install --help');
  });

  it('under deploy --check ends with no verdict, never with drift', async () => {
    const { code, out, err } = await run(
      'deploy',
      '--check',
      '--kind',
      'bogus',
    );
    expect(code).toBe(DEPLOY_CHECK_EXIT.noVerdict);
    expect(out).toBe('');
    expect(err).toContain('bogus');
  });
});

describe('a deploy flag that would take no effect is refused, never accepted and dropped', () => {
  it.each([
    [
      ['--scope', 'project', '--home', '/h'],
      ['--home', '--scope user'],
    ],
    [
      [
        '--from',
        '/missing',
        '--agents-dir',
        '/a',
        '--skills-dir',
        '/s',
        '--hooks-dir',
        '/k',
      ],
      ['--from', '--agents-dir', '--skills-dir', '--hooks-dir'],
    ],
    [
      ['--check', '--dry-run'],
      ['--check', '--dry-run'],
    ],
    [
      ['--check', '--verbose'],
      ['--check', '--verbose'],
    ],
    [
      ['--check', '--config', '/c.ts'],
      ['--check', '--config'],
    ],
    [
      ['--check', '--project', '/p'],
      ['--project', '--check'],
    ],
    [
      ['--config', '/c.ts', '--project', '/p'],
      ['--project', '--config'],
    ],
    [
      ['--kind', 'agent', '--skills-dir', '/s'],
      ['--kind agent', '--skills-dir'],
    ],
    [
      ['--kind', 'agent', '--assets', 's=x'],
      ['--kind agent', '--assets'],
    ],
    [
      ['--kind', 'hooks', '--agents-dir', '/a'],
      ['--kind hooks', '--agents-dir'],
    ],
    [
      ['--kind', 'skill', '--hooks-dir', '/k'],
      ['--kind skill', '--hooks-dir'],
    ],
  ] as const)('deploy %j', async (flags, names) => {
    const { code, out, err } = await run('deploy', ...flags);
    expect(code).toBe(
      flags.includes('--check' as never) ? DEPLOY_CHECK_EXIT.noVerdict : 1,
    );
    expect(out).toBe('');
    const lines = err.trimEnd().split('\n');
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/^cratylus deploy: /);
    for (const name of names) expect(lines[0], name).toContain(name);
  });
});

describe('the README reference names exactly what the help lists, each once', () => {
  /** Every page the program's help has, in the order it lists them: each command and
   *  capability, each capability followed by its verbs as `<capability> <verb>`, and
   *  for each the help it answers. */
  async function helpPages(): Promise<{ name: string; help: string }[]> {
    const pages: { name: string; help: string }[] = [];
    const top = (await run('--help')).out;
    const capabilities = listed(top, 'Capabilities');
    for (const heading of ['Commands', 'Capabilities', 'Corpus authoring'])
      for (const name of listed(top, heading)) {
        const help = (await run(name, '--help')).out;
        pages.push({ name, help });
        if (!capabilities.includes(name)) continue;
        for (const verb of listed(help, 'Commands'))
          pages.push({
            name: `${name} ${verb}`,
            help: (await run(name, verb, '--help')).out,
          });
      }
    return pages;
  }

  /** Every name the README's reference gives a heading: `### \`cratylus <name>\``. */
  const inReadme = [...readme.matchAll(/^#{2,4} `cratylus ([^`]+)`$/gm)].map(
    (match) => match[1] as string,
  );

  /** The flags a help lists under `Options:`, each as the help spells it (`-y`,
   *  `--yes`); `--help`, which every help lists and no entry repeats, is left out. */
  function flagsInHelp(help: string): string[] {
    const lines = help.split('\n');
    const flags: string[] = [];
    for (const line of lines.slice(lines.indexOf('Options:') + 1)) {
      if (!line.startsWith(' ')) break;
      const spec = /^ {2}(-.*?)(?: {2,}|$)/.exec(line)?.[1];
      if (spec !== undefined)
        flags.push(
          ...spec.split(', ').map((part) => part.split(' ')[0] as string),
        );
    }
    return flags.filter((flag) => flag !== '-h' && flag !== '--help');
  }

  /** The README's entries by name: the text under each `### \`cratylus <name>\``
   *  heading, up to the next heading. */
  function entries(markdown: string): Map<string, string> {
    const byName = new Map<string, string>();
    let name: string | undefined;
    for (const line of markdown.split('\n')) {
      const heading = /^#{1,6} (.*)$/.exec(line);
      if (heading !== null) {
        name = /^`cratylus ([^`]+)`$/.exec(heading[1] as string)?.[1];
        continue;
      }
      if (name !== undefined)
        byName.set(name, `${byName.get(name) ?? ''}${line}\n`);
    }
    return byName;
  }

  /** The flags an entry's `Flag` table names, each as the table spells it. */
  function flagsInEntry(entry: string): string[] {
    const flags: string[] = [];
    let inFlagTable = false;
    for (const line of entry.split('\n')) {
      if (line.startsWith('| Flag ')) inFlagTable = true;
      else if (!line.startsWith('|')) inFlagTable = false;
      const spec = inFlagTable ? /^\| `([^`]+)` /.exec(line)?.[1] : undefined;
      if (spec !== undefined)
        flags.push(
          ...spec.split(', ').map((part) => part.split(' ')[0] as string),
        );
    }
    return flags;
  }

  /** What an entry gets wrong of its help's flags: those the help lists and the entry
   *  does not name, and those the entry names and the help does not list. */
  interface FlagDiscrepancies {
    missing: string[];
    unlisted: string[];
  }

  function flagDiscrepancies(
    inHelp: string[],
    inEntry: string[],
  ): FlagDiscrepancies {
    return {
      missing: inHelp.filter((flag) => !inEntry.includes(flag)),
      unlisted: inEntry.filter((flag) => !inHelp.includes(flag)),
    };
  }

  /** What `documented` gets wrong of `listing`: the entries it lacks, names it holds
   *  twice, names the listing does not have, and, of the names both hold, those that
   *  stand in another place than the listing puts them. */
  function discrepancies(listing: readonly string[], documented: string[]) {
    const shared = [...new Set(documented)].filter((n) => listing.includes(n));
    const expected = listing.filter((n) => shared.includes(n));
    return {
      missing: listing.filter((name) => !documented.includes(name)),
      twice: [
        ...new Set(documented.filter((n, i) => documented.indexOf(n) !== i)),
      ],
      unlisted: documented.filter((name) => !listing.includes(name)),
      misplaced: shared.filter((name, i) => name !== expected[i]),
    };
  }

  it('lacks nothing the help lists, names nothing twice, and names nothing it does not', async () => {
    expect(
      discrepancies(
        (await helpPages()).map((page) => page.name),
        inReadme,
      ),
    ).toEqual({
      missing: [],
      twice: [],
      unlisted: [],
      misplaced: [],
    });
  });

  it('convicts a reference with an entry missing, one twice, and one it should not have', () => {
    expect(
      discrepancies(
        ['init', 'plan show', 'note'],
        ['plan show', 'plan show', 'frob', 'note'],
      ),
    ).toEqual({
      missing: ['init'],
      twice: ['plan show'],
      unlisted: ['frob'],
      misplaced: [],
    });
  });

  it('convicts a reference with init moved ahead of install', () => {
    const listing = ['install', 'uninstall', 'plan', 'plan show', 'init'];
    expect(
      discrepancies(listing, [
        'init',
        'install',
        'uninstall',
        'plan',
        'plan show',
      ]),
    ).toEqual({
      missing: [],
      twice: [],
      unlisted: [],
      misplaced: ['init', 'install', 'uninstall', 'plan', 'plan show'],
    });
  });

  it('names in each entry the flags its help lists, and no others', async () => {
    const documented = entries(readme);
    const wrong: Record<string, FlagDiscrepancies> = {};
    for (const { name, help } of await helpPages()) {
      const found = flagDiscrepancies(
        flagsInHelp(help),
        flagsInEntry(documented.get(name) ?? ''),
      );
      if (found.missing.length > 0 || found.unlisted.length > 0)
        wrong[name] = found;
    }
    expect(wrong).toEqual({});
  });

  it('convicts an entry lacking a flag its help lists, and one naming a flag its help does not', () => {
    const help = [
      'Usage: cratylus install [options]',
      'Install the bundled corpus',
      'Options:',
      '  --harness <name>            The harness to install into',
      '  --no-link-persona-commands  Link no persona commands',
      '  -y, --yes                   Take the default of every decision',
      '  -h, --help                  display help for command',
      '',
    ].join('\n');
    const reference = [
      '### `cratylus install`',
      '',
      '| Flag               | What it does                   |',
      '| ------------------ | ------------------------------ |',
      '| `--harness <name>` | The harness to install into    |',
      '| `--frob`           | A flag the help does not list  |',
      '',
      '### `cratylus uninstall`',
      '',
      '| Flag      | What it does |',
      '| --------- | ------------ |',
      '| `--other` | Not this one |',
      '',
    ].join('\n');
    expect(
      flagDiscrepancies(
        flagsInHelp(help),
        flagsInEntry(entries(reference).get('install') ?? ''),
      ),
    ).toEqual({
      missing: ['--no-link-persona-commands', '-y', '--yes'],
      unlisted: ['--frob'],
    });
  });
});
