// Binds design/examples/workflow/leakage-precision.md through the CLI only.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  type TemporaryRepository,
  append,
  query,
  snapshot,
  temporaryRepository,
} from '../concept-journal/fixture.js';

type Kind = 'meaning' | 'realization';
interface Warning {
  passage: { kind: string; context: string; id?: string; name?: string };
  words: string;
  rule: string;
}
interface Answer {
  id: string;
  warnings?: Warning[];
}
interface Decision {
  entry: string;
  id: string;
  decision: string;
  kind: Kind | null;
  kinds: { entry: string; kind: Kind }[];
}

const tool = 'vitest'; // Listed as a tool, not an ordinary English word.
const wording = `The work is checked with ${tool}.`;
let fixture: TemporaryRepository;
beforeEach(() => {
  fixture = temporaryRepository();
});
afterEach(() => {
  fixture.dispose();
});

function context(
  name = 'workflow',
  subject = 'The practice of checking work.',
) {
  return append(fixture.root, 'context', name, '--subject', subject);
}
function decide(kind?: Kind): Answer {
  return append(
    fixture.root,
    'decide',
    'checking',
    '--context',
    'workflow',
    '--title',
    'Checking',
    '--situation',
    'The work needs checking.',
    '--decision',
    wording,
    '--consequences',
    'The work is ready.',
    '--status',
    'open',
    ...(kind ? ['--kind', kind] : []),
  ) as Answer;
}
function inspect(scope = 'workflow'): Warning[] {
  return query<{ warnings: Warning[] }>(
    fixture.root,
    'leakage',
    '--context',
    scope,
  ).warnings;
}
function decisionViews(): Decision[] {
  const decisions = query<{ decisions: Decision[] }>(
    fixture.root,
    'decisions',
    '--context',
    'workflow',
  );
  const state = query<{
    contexts: { decisions: { open: Decision[] } }[];
  }>(fixture.root, 'state', '--context', 'workflow');
  return [
    ...decisions.decisions.filter(({ id }) => id === 'checking'),
    ...state.contexts.flatMap(({ decisions }) =>
      decisions.open.filter(({ id }) => id === 'checking'),
    ),
  ];
}
function decisionWarning() {
  return expect.objectContaining({
    passage: expect.objectContaining({
      kind: 'decision',
      context: 'workflow',
      id: 'checking',
    }),
    words: tool,
    rule: expect.any(String),
  });
}

describe('leakage precision', () => {
  it('Example 1 — a realization decision names a tool without warning', () => {
    context();
    const recorded = decide('realization');
    // Binds “a decision recorded as constraining realization”.
    expect(decisionViews()).toEqual([
      expect.objectContaining({
        kind: 'realization',
        kinds: [
          expect.objectContaining({ entry: recorded.id, kind: 'realization' }),
        ],
      }),
      expect.objectContaining({ kind: 'realization' }),
    ]);
    // Binds “it raises no leakage warning” on recording and inspection.
    expect(recorded.warnings ?? []).toEqual([]);
    // Binds “it raises no leakage warning”.
    expect(inspect()).toEqual([]);
  });

  it('Example 2 — a meaning decision naming the tool is warned and stays recorded', () => {
    context();
    const recorded = decide('meaning');
    // Binds “recorded as stating meaning” and “stays recorded”.
    expect(decisionViews()).toEqual([
      expect.objectContaining({
        id: 'checking',
        decision: wording,
        kind: 'meaning',
      }),
      expect.objectContaining({
        id: 'checking',
        decision: wording,
        kind: 'meaning',
      }),
    ]);
    // Binds “it is warned” when recorded.
    expect(recorded.warnings).toEqual(
      expect.arrayContaining([decisionWarning()]),
    );
    // Binds “it is warned” when inspected.
    expect(inspect()).toEqual(expect.arrayContaining([decisionWarning()]));
  });

  it('Example 3 — a subject owns the tool word only within its context', () => {
    context('delivery', `The practice of checking work with ${tool}.`);
    context();
    for (const scope of ['delivery', 'workflow']) {
      const recorded = append(
        fixture.root,
        'define',
        'readiness',
        '--context',
        scope,
        '--wording',
        wording,
        '--reason',
        'State readiness.',
      ) as Answer;
      const inspected = inspect(scope);
      if (scope === 'delivery') {
        // Binds “a context whose subject names a tool ... a concept in it names that tool ... no warning”.
        expect.soft(recorded.warnings ?? []).toEqual([]);
        // Binds “a context whose subject names a tool ... no warning” on inspection.
        expect.soft(inspected).toEqual([]);
      } else {
        const warning = expect.objectContaining({
          passage: expect.objectContaining({
            kind: 'concept',
            context: scope,
            name: 'readiness',
          }),
          words: tool,
          rule: expect.any(String),
        });
        // Binds “the same concept ... in a context whose subject does not name it ... is warned”.
        expect
          .soft(recorded.warnings)
          .toEqual(expect.arrayContaining([warning]));
        // Binds “the same concept ... in a context whose subject does not name it ... is warned” on inspection.
        expect.soft(inspected).toEqual(expect.arrayContaining([warning]));
      }
    }
  });

  it('Example 4 — a decision without a kind is inspected as meaning and warned', () => {
    context();
    decide();
    // Binds “treated as stating meaning and warned for naming a tool”.
    expect(inspect()).toEqual(expect.arrayContaining([decisionWarning()]));
    // Binds “recorded without saying which kind it is”: the contract represents unsaid kind as null.
    expect(decisionViews()).toEqual([
      expect.objectContaining({ id: 'checking', kind: null, kinds: [] }),
      expect.objectContaining({ id: 'checking', kind: null, kinds: [] }),
    ]);
  });

  it('Example 5 — classifying an old decision appends its kind without changing the decision', () => {
    context();
    const beforeDecision = snapshot(fixture.root);
    decide();
    const before = snapshot(fixture.root);
    const decisionFiles = Object.keys(before).filter(
      (path) => !(path in beforeDecision),
    );
    // Binds “a decision recorded before kinds existed”: identify its entry without fixing a filename.
    expect(decisionFiles).toHaveLength(1);
    const classified = append(
      fixture.root,
      'classify',
      'checking',
      '--kind',
      'realization',
    ) as Answer;
    const after = snapshot(fixture.root);
    const added = Object.keys(after).filter((path) => !(path in before));
    // Binds “as an entry of its own”.
    expect(added).toHaveLength(1);
    // Binds “leaves the decision's record unchanged”: compare the original journal bytes, not its view.
    expect(after[decisionFiles[0]]).toBe(before[decisionFiles[0]]);
    // Binds “its kind is recorded afterwards, as an entry of its own”.
    expect(decisionViews()).toEqual([
      expect.objectContaining({
        kind: 'realization',
        kinds: [
          expect.objectContaining({
            entry: classified.id,
            kind: 'realization',
          }),
        ],
      }),
      expect.objectContaining({ kind: 'realization' }),
    ]);
    // Binds “it is inspected as that kind from then on”: realization raises no warning.
    expect(inspect()).toEqual([]);
  });
});
