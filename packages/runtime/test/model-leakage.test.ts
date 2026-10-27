// The model check's lexical rules: each leakage rule finds the narrowest span
// that leaks and nothing in plain meaning, a context's own words raise nothing,
// and a correction citing a decision or recounting its history is found.

import { describe, expect, it } from 'vitest';
import {
  leaks,
  recounts,
  vocabulary,
} from '../src/capabilities/model/leakage.js';

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
      'It is served by WorkPackageLedger.',
      'WorkPackageLedger',
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

describe('recounts', () => {
  it.each([
    ['A slot is held for ten minutes (decision 0042).', 'decision 0042'],
    ['Per decisions 12 and 14, a slot is held.', 'decisions 12 and 14'],
  ])('%s cites %s', (text, words) => {
    expect(recounts(text)).toEqual([{ words, rule: 'cites a decision' }]);
  });

  it.each([
    ['A slot is no longer held overnight.', 'no longer'],
    ['A slot used to be a whole hour.', 'used to be'],
    ['A slot, formerly a booking, is held.', 'formerly'],
    ['A slot was renamed from booking.', 'was renamed'],
    ['A slot is now held for ten minutes.', 'is now'],
    ['A slot now also covers walk-ins.', 'now also'],
  ])('%s recounts %s', (text, words) => {
    expect(recounts(text)).toEqual([{ words, rule: 'recounts history' }]);
  });

  it.each([
    'a concept changes only by a new version that restates it whole as it now means, never by extending the old wording.',
    'its subject changes only by a new description carrying its reason, the earlier kept in its history.',
    'a decision stands until a later decision supersedes it or a later entry deprecates it.',
    'who an agent is, never how it was started.',
    'judged against examples fixed before any build.',
  ])('raises nothing in current meaning: %s', (text) => {
    expect(recounts(text)).toEqual([]);
  });
});
