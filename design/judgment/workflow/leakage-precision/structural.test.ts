// Judgment-only cases. Never imported or named by a package check.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  type TemporaryRepository,
  append,
  query,
  temporaryRepository,
} from '../../../../packages/cli/test/concept-journal/fixture.js';

type Kind = 'meaning' | 'realization';
interface Warning {
  passage: { kind: string; context: string; id?: string };
  words: string;
  rule: string;
}
interface Decision {
  id: string;
  kind: Kind | null;
  kinds: { entry: string; kind: Kind }[];
}

const tool = 'vitest';
const decisionArgs = [
  'decide',
  'checking',
  '--context',
  'workflow',
  '--title',
  'Checking',
  '--situation',
  'The work needs checking.',
  '--decision',
  `The work is checked with ${tool}.`,
  '--consequences',
  'The work is ready.',
  '--status',
  'open',
];
let fixture: TemporaryRepository;
beforeEach(() => {
  fixture = temporaryRepository();
});
afterEach(() => {
  fixture.dispose();
});

describe('leakage precision judgment', () => {
  it('Held-out 1 — a meaning decision may name a tool its context subject owns', () => {
    append(
      fixture.root,
      'context',
      'workflow',
      '--subject',
      `The practice of checking work with ${tool}.`,
    );
    const recorded = append(
      fixture.root,
      ...decisionArgs,
      '--kind',
      'meaning',
    ) as { warnings?: Warning[] };
    // Binds “a decision in it recorded as stating meaning”.
    expect(
      query<{ decisions: Decision[] }>(fixture.root, 'decisions').decisions,
    ).toEqual([expect.objectContaining({ id: 'checking', kind: 'meaning' })]);
    // Binds “no warning, because the word is the context's own” on recording.
    expect(recorded.warnings ?? []).toEqual([]);
    // Binds “no warning, because the word is the context's own” on inspection.
    expect(
      query<{ warnings: Warning[] }>(fixture.root, 'leakage').warnings,
    ).toEqual([]);
  });

  it('Held-out 2 — the later kind governs leakage and both kind entries stay in order', () => {
    append(
      fixture.root,
      'context',
      'workflow',
      '--subject',
      'The practice of checking work.',
    );
    append(fixture.root, ...decisionArgs);
    const first = append(
      fixture.root,
      'classify',
      'checking',
      '--kind',
      'realization',
    ) as { id: string };
    const second = append(
      fixture.root,
      'classify',
      'checking',
      '--kind',
      'meaning',
      '--reason',
      'This choice states what checking means.',
    ) as { id: string };
    const decisions = query<{ decisions: Decision[] }>(
      fixture.root,
      'decisions',
      '--context',
      'workflow',
    ).decisions;
    const state = query<{
      contexts: { decisions: { open: Decision[] } }[];
    }>(fixture.root, 'state', '--context', 'workflow');
    for (const views of [
      decisions,
      state.contexts.flatMap(({ decisions }) => decisions.open),
    ]) {
      // Binds “the later kind governs and both entries stay in its history”.
      expect(views).toEqual([
        expect.objectContaining({
          id: 'checking',
          kind: 'meaning',
          kinds: [
            expect.objectContaining({ entry: first.id, kind: 'realization' }),
            expect.objectContaining({ entry: second.id, kind: 'meaning' }),
          ],
        }),
      ]);
    }
    // Binds “when it is inspected ... the later kind governs”: meaning warns despite the earlier realization kind.
    expect(
      query<{ warnings: Warning[] }>(fixture.root, 'leakage').warnings,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          passage: expect.objectContaining({
            kind: 'decision',
            context: 'workflow',
            id: 'checking',
          }),
          words: tool,
          rule: expect.any(String),
        }),
      ]),
    );
  });
});
