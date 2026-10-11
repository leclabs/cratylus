// The implementation-leakage detector: each rule finds the narrowest span that
// leaks and nothing in plain meaning, a context's own words raise nothing, and
// visible examples are read by file, number and context. The command-line
// examples (cli `test/check-quality/leakage.test.ts`) bind the verb end to end.

import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { dispatchConcepts } from '../src/capabilities/concepts/index.js';
import {
  leaks,
  visibleExamples,
  vocabulary,
} from '../src/capabilities/concepts/leakage.js';

describe('leaks', () => {
  it.each([
    [
      'The plan is kept in design/journal/.',
      'design/journal/',
      'names a file location',
    ],
    [
      'It reads ~/.omp/agent at start.',
      '~/.omp/agent',
      'names a file location',
    ],
    [
      'Each verb is declared in dispatch.ts here.',
      'dispatch.ts',
      'names a file',
    ],
    ['run pnpm test before pushing', 'pnpm test', 'names a command'],
    ['It is merged with git merge.', 'git merge', 'names a command'],
    [
      'Give it --context to narrow it.',
      '--context',
      'names a command-line flag',
    ],
    [
      'The answer is parsed by readArgv.',
      'readArgv',
      'names a code identifier',
    ],
    [
      'It is offered as concept_journal.',
      'concept_journal',
      'names a code identifier',
    ],
    ['It calls dispatch() once.', 'dispatch()', 'names a code identifier'],
    ['It is validated with zod.', 'zod', 'names a tool or library'],
    ['It is hosted on GitHub.', 'GitHub', 'names a tool or library'],
    ['It merges into `main` first.', '`main`', 'quotes code'],
    [
      'The journal is design/journal in the repository.',
      'design/journal',
      'names a file location',
    ],
    [
      'It ships from packages/runtime/src unchanged.',
      'packages/runtime/src',
      'names a file location',
    ],
    [
      'It is drawn with @dagrejs/graphlib.',
      '@dagrejs/graphlib',
      'names a file location',
    ],
    [
      'Its parts are kept in archive/old/notes for now.',
      'archive/old/notes',
      'names a file location',
    ],
    ['Format it with prettier --write.', 'prettier --write', 'names a command'],
    ['Packages are added with yarn add.', 'yarn add', 'names a command'],
    [
      'It is served by EventTapHostClaude.',
      'EventTapHostClaude',
      'names a code identifier',
    ],
  ])('%s → %s', (text, words, rule) => {
    expect(leaks(text)).toEqual([{ words, rule }]);
  });

  it('reports the narrowest span, never the sentence, and each span once', () => {
    expect(
      leaks(
        'The situation: tests ran with vitest, then `pnpm test` ran once more.',
      ),
    ).toEqual([
      { words: 'vitest', rule: 'names a tool or library' },
      { words: 'pnpm test', rule: 'names a command' },
    ]);
  });

  it('reports only the leaks inside a quotation that is plain prose', () => {
    expect(leaks('The rule says `keep the plan in git.` plainly.')).toEqual([
      { words: 'git', rule: 'names a tool or library' },
    ]);
    expect(leaks('It says `run it, then pnpm install; done!` once.')).toEqual([
      { words: 'pnpm install', rule: 'names a command' },
    ]);
  });

  it.each([
    'a check accepts a recording that satisfies its example',
    'The node in the dependency graph waits for its inputs, and/or its peers.',
    'An example is read/written by whoever holds the meaning.',
    'Cratylus keeps its design in one journal, e.g. for every context.',
    'It names a `green-field realization` in plain words.',
    'Version 0.10.0 holds: — the words stay plain.',
    'The tests are kept prettier, and a jest is no tool.',
    'A curl of smoke, a yarn spun, a brew of tea, a babel of voices.',
    'Python, the snake, and Docker, the dock worker, rollup the mocha.',
    'The work -- once read -- stays read; no word--joined pair is a flag.',
    'A PhD in LaTeX at McDonald from DevOps and OpenAI.',
    'Each verb reads/appends, or read/write, and/or neither.',
  ])('raises nothing on plain meaning: %s', (text) => {
    expect(leaks(text)).toEqual([]);
  });

  it('raises nothing on the context’s own words', () => {
    const own = vocabulary(['git', 'merge request']);
    expect(leaks('A git merge request is reviewed.', own)).toEqual([]);
    expect(leaks('A git merge request is reviewed.')).toEqual([
      { words: 'git merge', rule: 'names a command' },
    ]);
  });

  it('holds the exemption to the context whose concept names the words', () => {
    const delivery = vocabulary(['cratylus command', 'omp']);
    const text = 'Run cratylus install, then start omp.';
    expect(leaks(text, delivery)).toEqual([]);
    expect(leaks(text, vocabulary(['plan']))).toEqual([
      { words: 'cratylus install', rule: 'names a command' },
      { words: 'omp', rule: 'names a tool or library' },
    ]);
  });

  it('counts the words a subject names as the context’s own, punctuation dropped', () => {
    const own = vocabulary(
      ['plan'],
      ['Work kept in git, checked with vitest.'],
    );
    expect(leaks('Checked with vitest; kept with git.', own)).toEqual([]);
    expect(leaks('Checked with zod.', own)).toEqual([
      { words: 'zod', rule: 'names a tool or library' },
    ]);
  });

  it('owns a subject’s word only as the plain word, never a command, code span or flag', () => {
    const own = vocabulary(['plan'], ['Work checked with vitest.']);
    expect(leaks('The work is checked with vitest.', own)).toEqual([]);
    expect(leaks('The work is checked with vitest run.', own)).toEqual([
      { words: 'vitest run', rule: 'names a command' },
    ]);
    expect(leaks('The work is checked with `vitest`.', own)).toEqual([
      { words: '`vitest`', rule: 'quotes code' },
    ]);
    expect(leaks('The work is checked with --vitest.', own)).toEqual([
      { words: '--vitest', rule: 'names a command-line flag' },
    ]);
  });

  it('keeps every exemption a concept name gives, inside a code span too', () => {
    const own = vocabulary(['vitest'], ['Work checked with vitest.']);
    expect(
      leaks('Checked with vitest, vitest run and `vitest run`.', own),
    ).toEqual([]);
  });

  it.each([
    ["The practice of omp's sessions.", 'omp'],
    ['The practice of omp’s sessions.', 'omp'],
    ['The practice of each --agent.', 'agent'],
    ['The practice of vitest-based checking.', 'vitest'],
  ])('gives the bare word a subject joins to others: %s', (subject, word) => {
    const own = vocabulary(['plan'], [subject]);
    expect(own.plain.has(word)).toBe(true);
    expect(leaks(`Sessions run in ${word}.`, own)).toEqual([]);
    expect(leaks(`Sessions run in \`${word}\`.`, own)).toEqual([
      { words: `\`${word}\``, rule: 'quotes code' },
    ]);
  });
});

describe('visibleExamples', () => {
  let top: string | undefined;
  afterEach(() => {
    if (top !== undefined) rmSync(top, { recursive: true, force: true });
    top = undefined;
  });

  it('reads each numbered example by file, number and context', () => {
    top = mkdtempSync(join(tmpdir(), 'examples-'));
    mkdirSync(join(top, 'design/examples/workflow'), { recursive: true });
    mkdirSync(join(top, 'design/examples/booking'), { recursive: true });
    writeFileSync(
      join(top, 'design/examples/workflow/a.md'),
      '# Examples\n\nContext: delivery. Concepts: window.\n\n1. **Given** one,\n   continued.\n2. Two.\n\n## Notes\n\n3 lines.\n',
    );
    writeFileSync(join(top, 'design/examples/booking/b.md'), '1. Booked.\n');
    writeFileSync(join(top, 'design/examples/booking/c.txt'), '1. Not read.\n');
    expect(visibleExamples(top)).toEqual([
      {
        file: 'design/examples/booking/b.md',
        number: 1,
        context: 'booking',
        text: 'Booked.',
      },
      {
        file: 'design/examples/workflow/a.md',
        number: 1,
        context: 'delivery',
        text: '**Given** one,\n   continued.',
      },
      {
        file: 'design/examples/workflow/a.md',
        number: 2,
        context: 'delivery',
        text: 'Two.',
      },
    ]);
  });

  it('reads none where the repository has no examples', () => {
    top = mkdtempSync(join(tmpdir(), 'examples-'));
    expect(visibleExamples(top)).toEqual([]);
  });
});

describe('concepts leakage, and the warnings of an append', () => {
  let top: string | undefined;
  afterEach(() => {
    if (top !== undefined) rmSync(top, { recursive: true, force: true });
    top = undefined;
  });

  it('carries warnings on a supersession, stores none, and narrows examples to the context', () => {
    top = mkdtempSync(join(tmpdir(), 'leakage-'));
    execFileSync('git', ['init', '-q'], { cwd: top });
    const from = top;
    const concepts = (...argv: string[]) => dispatchConcepts(argv, { from });
    for (const name of ['booking', 'fleet'])
      concepts('context', name, '--subject', 'A subject.');
    const plain = concepts(
      'define',
      'slot',
      '--context',
      'booking',
      '--wording',
      'A slot.',
      '--reason',
      'First.',
    );
    expect(plain).not.toHaveProperty('warnings');
    const leaked = concepts(
      'supersede',
      'slot',
      '--context',
      'booking',
      '--wording',
      'A row in the slots.json file.',
      '--reason',
      'Stored.',
    ) as { id: string; warnings: unknown };
    expect(leaked.warnings).toEqual([
      {
        passage: { kind: 'concept', context: 'booking', name: 'slot' },
        words: 'slots.json',
        rule: 'names a file',
      },
    ]);
    const stored = readFileSync(
      join(top, 'design/journal', `${leaked.id}.json`),
      'utf8',
    );
    expect(stored).not.toContain('warnings');
    expect(readdirSync(join(top, 'design/journal'))).toHaveLength(4);
    for (const name of ['booking', 'fleet']) {
      mkdirSync(join(top, 'design/examples', name), { recursive: true });
      writeFileSync(
        join(top, 'design/examples', name, 'cases.md'),
        '1. It is validated with zod.\n',
      );
    }
    expect(concepts('leakage', '--context', 'booking')).toEqual({
      warnings: [
        leaked.warnings,
        {
          passage: {
            kind: 'example',
            file: 'design/examples/booking/cases.md',
            number: 1,
          },
          words: 'zod',
          rule: 'names a tool or library',
        },
      ].flat(),
    });
    expect(concepts('leakage')).toHaveProperty('warnings.length', 3);
  });

  it('inspects a decision unless its governing kind is realization', () => {
    top = mkdtempSync(join(tmpdir(), 'leakage-'));
    execFileSync('git', ['init', '-q'], { cwd: top });
    const from = top;
    const concepts = (...argv: string[]) => dispatchConcepts(argv, { from });
    concepts('context', 'booking', '--subject', 'A subject.');
    const decide = (id: string, ...kind: string[]) =>
      concepts(
        'decide',
        id,
        '--context',
        'booking',
        '--title',
        'T',
        '--situation',
        'S',
        '--decision',
        'Validated with zod.',
        '--consequences',
        'C',
        '--status',
        'open',
        ...kind,
      );
    expect(decide('built', '--kind', 'realization')).not.toHaveProperty(
      'warnings',
    );
    expect(decide('meant', '--kind', 'meaning')).toHaveProperty(
      'warnings.length',
      1,
    );
    expect(decide('unsaid')).toHaveProperty('warnings.length', 1);
    const warned = () => {
      // The leakage query's answer, as the verb prints it.
      const answer = concepts('leakage') as {
        warnings: { passage: { id: string } }[];
      };
      return answer.warnings.map((w) => w.passage.id);
    };
    expect(warned()).toEqual(['meant', 'unsaid']);
    concepts('classify', 'unsaid', '--kind', 'realization');
    concepts('classify', 'built', '--kind', 'meaning', '--reason', 'It means.');
    expect(warned()).toEqual(['built', 'meant']);
  });
});
