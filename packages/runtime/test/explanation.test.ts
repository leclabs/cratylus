// The concept journal explains itself: `concepts --explain` gives the whole
// capability and `concepts <verb> --explain` one verb, as JSON, read out of the
// same declarations its help prints and its calls are read against. These hold
// the explanation's shape, that the help says what it says, that each verb's
// concept is a live concept of cratylus's own design, and that every parameter
// the explanation calls required is one the verb refuses a call without, and
// every one it calls optional is one the verb does without.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CLI_BIN } from '../src/bin-name.js';
import { JOURNAL } from '../src/capabilities/concepts/dispatch.js';
import { dispatchConcepts } from '../src/capabilities/concepts/index.js';
import { CAPABILITY_SUMMARIES } from '../src/capability.js';
import {
  type Explanation,
  type VerbExplanation,
  explain,
} from '../src/explanation.js';
import { capabilityCommands } from '../src/main.js';

const repositoryRoot = fileURLToPath(new URL('../../..', import.meta.url));

/** Run `argv` through the capability commands as the bin's program holds them. */
async function run(
  argv: readonly string[],
): Promise<{ code: number | undefined; out: string; err: string }> {
  const out: string[] = [];
  const err: string[] = [];
  const capture = (into: string[]) => (s: string | Uint8Array) => {
    into.push(String(s));
    return true;
  };
  vi.spyOn(process.stdout, 'write').mockImplementation(capture(out));
  vi.spyOn(process.stderr, 'write').mockImplementation(capture(err));
  const exitCode = process.exitCode;
  let code: number | undefined;
  try {
    const host = new Command(CLI_BIN).enablePositionalOptions();
    for (const command of capabilityCommands()) host.addCommand(command);
    await host.parseAsync(argv, { from: 'user' });
    code = process.exitCode as number | undefined;
  } finally {
    process.exitCode = exitCode;
    vi.restoreAllMocks();
  }
  return { code, out: out.join(''), err: err.join('') };
}

const VERBS = [
  'overview',
  'state',
  'design',
  'history',
  'decisions',
  'leakage',
  'purpose',
  'context',
  'define',
  'supersede',
  'retire',
  'decide',
  'accept',
  'classify',
  'deprecate',
];

/** Each verb's parameters, as the realization contract names them. */
const PARAMETERS: Record<string, string[]> = {
  overview: ['context'],
  state: ['context', 'history'],
  design: ['context'],
  history: ['concept', 'context'],
  decisions: ['context', 'open', 'history'],
  leakage: ['context', 'history'],
  purpose: ['statement', 'reason'],
  context: ['context', 'subject', 'relation', 'reason'],
  define: ['concept', 'context', 'wording', 'reason', 'built-from'],
  supersede: ['concept', 'context', 'wording', 'reason', 'built-from'],
  retire: ['concept', 'context', 'reason'],
  decide: [
    'id',
    'context',
    'title',
    'situation',
    'decision',
    'consequences',
    'status',
    'supersedes',
    'kind',
    'cut',
    'keeps',
  ],
  accept: ['id', 'reason'],
  classify: ['id', 'kind', 'reason'],
  deprecate: ['id', 'reason'],
};

describe('concepts --explain', () => {
  it('prints the whole capability as one JSON object, its verbs in order', async () => {
    const { code, out, err } = await run(['concepts', '--explain']);
    expect(err).toBe('');
    expect(code).toBe(0);
    const explanation = JSON.parse(out) as Explanation;
    expect(explanation).toEqual(explain(JOURNAL));
    expect(Object.keys(explanation)).toEqual([
      'name',
      'purpose',
      'when',
      'verbs',
    ]);
    expect(explanation.name).toBe('concept journal');
    expect(explanation.purpose).toBe(CAPABILITY_SUMMARIES.concepts);
    expect(explanation.when.trim()).not.toBe('');
    expect(explanation.verbs.map((v) => v.name)).toEqual(VERBS);
  });

  it.each(VERBS)(
    'concepts %s --explain prints that verb as the whole explanation holds it',
    async (verb) => {
      const whole = explain(JOURNAL);
      const { code, out, err } = await run(['concepts', verb, '--explain']);
      expect(err).toBe('');
      expect(code).toBe(0);
      const explained = JSON.parse(out) as VerbExplanation;
      expect(explained).toEqual(whole.verbs.find((v) => v.name === verb));
      expect(Object.keys(explained)).toEqual([
        'name',
        'concept',
        'purpose',
        'when',
        'effect',
        'parameters',
      ]);
      expect(explained.effect).toBe(
        [
          'overview',
          'state',
          'design',
          'history',
          'decisions',
          'leakage',
        ].includes(verb)
          ? 'reads'
          : 'appends',
      );
      expect(explained.parameters.map((p) => p.name)).toEqual(PARAMETERS[verb]);
      for (const text of [explained.purpose, explained.when])
        expect(text.toLowerCase().replace(/[^a-z]/g, '')).not.toBe(verb);
    },
  );

  it('gives each parameter its schema, and the positional as positional', () => {
    const byVerb = Object.fromEntries(
      explain(JOURNAL).verbs.map((v) => [
        v.name,
        Object.fromEntries(v.parameters.map((p) => [p.name, p])),
      ]),
    );
    expect(byVerb.decide?.status?.schema).toEqual({
      type: 'string',
      enum: ['open', 'accepted'],
    });
    for (const verb of ['decide', 'classify'])
      expect(byVerb[verb]?.kind?.schema, verb).toEqual({
        type: 'string',
        enum: ['meaning', 'realization'],
      });
    expect(byVerb.decisions?.open?.schema).toEqual({ type: 'boolean' });
    for (const verb of ['define', 'supersede'])
      expect(byVerb[verb]?.['built-from']?.schema).toEqual({
        type: 'array',
        items: { type: 'string' },
      });
    expect(byVerb.define?.wording?.schema).toEqual({ type: 'string' });
    const positional = (verb: string) =>
      Object.values(byVerb[verb] ?? {})
        .filter((p) => p.positional === true)
        .map((p) => p.name);
    for (const verb of ['history', 'define', 'supersede', 'retire'])
      expect(positional(verb), verb).toEqual(['concept']);
    expect(positional('context')).toEqual(['context']);
    expect(positional('decide')).toEqual(['id']);
    expect(positional('accept')).toEqual(['id']);
    expect(positional('classify')).toEqual(['id']);
    for (const verb of ['overview', 'state', 'design', 'decisions', 'leakage'])
      expect(positional(verb), verb).toEqual([]);
  });

  /** The live concepts of the journal of the repository at `from`, and the
   *  concepts it has retired. */
  function designAt(from: string) {
    const design = dispatchConcepts(['design'], { from }) as {
      contexts: {
        concepts: { name: string }[];
        retired: { name: string }[];
      }[];
    };
    return {
      live: design.contexts.flatMap((c) => c.concepts.map((v) => v.name)),
      retired: design.contexts.flatMap((c) => c.retired.map((v) => v.name)),
    };
  }

  /** The verbs of `explanation` whose concept is no live concept of `live`. */
  const unanchored = (explanation: Explanation, live: readonly string[]) =>
    explanation.verbs
      .filter((v) => !live.includes(v.concept))
      .map((v) => v.name);

  it('acts on live concepts of cratylus’s own conceptual design', () => {
    const concepts = Object.fromEntries(
      explain(JOURNAL).verbs.map((v) => [v.name, v.concept]),
    );
    expect(concepts).toEqual({
      overview: 'context overview',
      state: 'conceptual design',
      design: 'conceptual design',
      history: 'concept',
      decisions: 'decision',
      leakage: 'concept journal',
      purpose: 'concept journal',
      context: 'bounded context',
      define: 'concept',
      supersede: 'supersession',
      retire: 'retirement',
      decide: 'decision',
      accept: 'decision',
      classify: 'decision',
      deprecate: 'decision',
    });
    expect(unanchored(explain(JOURNAL), designAt(repositoryRoot).live)).toEqual(
      [],
    );
  });

  it('convicts a verb whose concept the design has retired', () => {
    const repo = mkdtempSync(join(tmpdir(), 'explain-anchor-'));
    try {
      execFileSync('git', ['init', '-q'], { cwd: repo });
      const concepts = (...argv: string[]) =>
        dispatchConcepts(argv, { from: repo });
      concepts('context', 'workflow', '--subject', 'The practice.');
      for (const verb of explain(JOURNAL).verbs)
        if (designAt(repo).live.every((name) => name !== verb.concept))
          concepts(
            'define',
            verb.concept,
            '--context',
            'workflow',
            '--wording',
            `What ${verb.concept} means.`,
            '--reason',
            'Fixture.',
          );
      expect(unanchored(explain(JOURNAL), designAt(repo).live)).toEqual([]);
      concepts(
        'retire',
        'supersession',
        '--context',
        'workflow',
        '--reason',
        'Fixture.',
      );
      // The defect landed: supersession is retired, no longer live.
      const after = designAt(repo);
      expect(after.retired).toContain('supersession');
      expect(after.live).not.toContain('supersession');
      expect(unanchored(explain(JOURNAL), after.live)).toEqual(['supersede']);
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  });

  it('refuses a verb the capability does not declare, as without --explain', async () => {
    const { code, out, err } = await run(['concepts', 'frob', '--explain']);
    expect(code).toBe(1);
    expect(out).toBe('');
    expect(err.trimEnd().split('\n')).toEqual([
      `${CLI_BIN} concepts: unknown verb 'frob'; the verbs are ${VERBS.join(', ')}; run ${CLI_BIN} concepts --help`,
    ]);
  });

  it('reads --explain given as a flag’s value as that value, never as the request', async () => {
    const repo = mkdtempSync(join(tmpdir(), 'explain-'));
    const cwd = process.cwd();
    try {
      execFileSync('git', ['init', '-q'], { cwd: repo });
      process.chdir(repo);
      const { code, out } = await run([
        'concepts',
        'context',
        'booking',
        '--subject=--explain',
      ]);
      expect(code).toBe(0);
      expect(JSON.parse(out)).toMatchObject({
        kind: 'context',
        subject: '--explain',
      });
    } finally {
      process.chdir(cwd);
      rmSync(repo, { recursive: true, force: true });
    }
  });
});

describe('the help says what the explanation says', () => {
  it('concepts --help holds the capability’s purpose and when, and every verb’s purpose', async () => {
    const explanation = explain(JOURNAL);
    const { out } = await run(['concepts', '--help']);
    for (const text of [
      explanation.purpose,
      explanation.when,
      ...explanation.verbs.map((v) => v.purpose),
    ])
      expect(out).toContain(text);
  });

  it.each(VERBS)(
    'concepts %s --help holds its purpose, when, concept, effect and every parameter',
    async (verb) => {
      const explained = explain(JOURNAL).verbs.find(
        (v) => v.name === verb,
      ) as VerbExplanation;
      const { code, out } = await run(['concepts', verb, '--help']);
      expect(code).toBe(0);
      for (const text of [
        explained.purpose,
        explained.when,
        explained.concept,
        explained.effect,
        ...explained.parameters.map((p) => p.description),
      ])
        expect(out).toContain(text);
    },
  );
});

describe('what the explanation calls required is what the verb refuses without', () => {
  let repo: string | undefined;
  afterEach(() => {
    if (repo !== undefined) rmSync(repo, { recursive: true, force: true });
    repo = undefined;
  });

  /** A journal holding the context `booking`, its concept `slot` and its open
   *  decision `d1`. */
  function journal(): (...argv: string[]) => unknown {
    repo = mkdtempSync(join(tmpdir(), 'explain-required-'));
    execFileSync('git', ['init', '-q'], { cwd: repo });
    const from = repo;
    const concepts = (...argv: string[]) => dispatchConcepts(argv, { from });
    concepts('context', 'booking', '--subject', 'Booking.');
    concepts(
      'define',
      'slot',
      '--context',
      'booking',
      '--wording',
      'A slot.',
      '--reason',
      'First.',
    );
    concepts(
      'decide',
      'd1',
      '--context',
      'booking',
      '--title',
      'T',
      '--situation',
      'S',
      '--decision',
      'D',
      '--consequences',
      'C',
      '--status',
      'open',
    );
    return concepts;
  }

  /** A full call of each single-use verb, by parameter. */
  const FULL: Record<string, Record<string, string>> = {
    state: { context: 'booking', history: '' },
    design: { context: 'booking' },
    history: { concept: 'slot', context: 'booking' },
    decisions: { context: 'booking', open: '', history: '' },
    leakage: { context: 'booking', history: '' },
    define: {
      concept: 'window',
      context: 'booking',
      wording: 'A window.',
      reason: 'New.',
      'built-from': 'slot',
    },
    supersede: {
      concept: 'slot',
      context: 'booking',
      wording: 'A shorter slot.',
      reason: 'Changed.',
      'built-from': 'window',
    },
    retire: { concept: 'slot', context: 'booking', reason: 'Gone.' },
    decide: {
      id: 'd2',
      context: 'booking',
      title: 'T',
      situation: 'S',
      decision: 'D',
      consequences: 'C',
      status: 'open',
      supersedes: 'd1',
      kind: 'meaning',
      cut: 'slots',
      keeps: 'booking/slots',
    },
    accept: { id: 'd1', reason: 'Agreed.' },
    classify: { id: 'd1', kind: 'realization', reason: 'It constrains.' },
    deprecate: { id: 'd1', reason: 'Finished.' },
  };

  /** The argv of `verb` giving `given`. */
  function argv(verb: VerbExplanation, given: Record<string, string>) {
    const words = [verb.name];
    for (const parameter of verb.parameters) {
      const value = given[parameter.name];
      if (value === undefined) continue;
      if (parameter.positional === true) words.push(value);
      else if (parameter.schema.type === 'boolean')
        words.push(`--${parameter.name}`);
      else words.push(`--${parameter.name}`, value);
    }
    return words;
  }

  const cases = explain(JOURNAL)
    .verbs.filter((verb) => !['context', 'purpose'].includes(verb.name))
    .flatMap((verb) => [
      [verb.name, undefined] as const,
      ...verb.parameters.map((p) => [verb.name, p.name] as const),
    ]);

  it.each(cases)('%s without %s', (name, left) => {
    const verb = explain(JOURNAL).verbs.find(
      (v) => v.name === name,
    ) as VerbExplanation;
    const given = { ...FULL[name] };
    if (left !== undefined) delete given[left];
    const concepts = journal();
    const entries = () => readdirSync(join(repo as string, 'design/journal'));
    const before = entries();
    const required = verb.parameters.find((p) => p.name === left)?.required;
    if (required === true) {
      expect(() => concepts(...argv(verb, given))).toThrow(
        new RegExp(`^concepts ${name}: `),
      );
      expect(entries()).toEqual(before);
    } else {
      concepts(...argv(verb, given));
      expect(entries().length).toBe(
        before.length + (verb.effect === 'appends' ? 1 : 0),
      );
    }
  });

  /** The full calls of each verb that records or, given a reason, changes:
   *  a recording, and a change after what `before` records. */
  const RECORD_OR_CHANGE: Record<
    string,
    { given: Record<string, string>; before?: string[] }[]
  > = {
    context: [
      { given: { context: 'fleet', subject: 'Fleet.', relation: 'Beside.' } },
      {
        given: {
          context: 'booking',
          subject: 'Expanded booking.',
          relation: 'Alongside fleet.',
          reason: 'Include the expanded subject.',
        },
      },
    ],
    purpose: [
      { given: { statement: 'Book seats.' } },
      {
        given: { statement: 'Book and pay.', reason: 'Payment too.' },
        before: ['purpose', '--statement', 'Book seats.'],
      },
    ],
  };

  it.each(Object.keys(RECORD_OR_CHANGE))(
    '%s declares a parameter required only when both recording and changing refuse its omission',
    (name) => {
      const verb = explain(JOURNAL).verbs.find(
        (v) => v.name === name,
      ) as VerbExplanation;
      for (const left of [undefined, ...PARAMETERS[name]!]) {
        const refused = RECORD_OR_CHANGE[name]!.map((full) => {
          const given = { ...full.given };
          if (left !== undefined) delete given[left];
          const concepts = journal();
          if (full.before !== undefined) concepts(...full.before);
          const directory = join(repo as string, 'design/journal');
          const before = readdirSync(directory);
          try {
            let error: unknown;
            try {
              concepts(...argv(verb, given));
            } catch (caught) {
              error = caught;
            }
            if (error !== undefined) {
              expect(error).toBeInstanceOf(Error);
              expect((error as Error).message).toMatch(
                new RegExp(`^concepts ${name}: `),
              );
              expect(readdirSync(directory)).toEqual(before);
              return true;
            }
            expect(readdirSync(directory)).toHaveLength(before.length + 1);
            return false;
          } finally {
            rmSync(repo as string, { recursive: true, force: true });
            repo = undefined;
          }
        });
        if (left === undefined)
          expect(refused, 'both full calls').toEqual([false, false]);
        else
          expect(
            verb.parameters.find((parameter) => parameter.name === left)
              ?.required,
            `${name} without ${left}`,
          ).toBe(refused.every(Boolean));
      }
    },
  );
});
