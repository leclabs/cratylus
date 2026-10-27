// Leakage precision through the CLI only: what a decision names never leaks,
// and a subject owns its plain words alone.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  type TemporaryRepository,
  append,
  query,
  temporaryRepository,
} from '../concept-journal/fixture.js';

interface Warning {
  passage: { kind: string; context: string; id?: string; name?: string };
  words: string;
  rule: string;
}
interface Answer {
  id: string;
  decisionKind?: string;
  warnings?: Warning[];
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
function decide(): Answer {
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
describe('leakage precision', () => {
  it('a decision records realization and names a tool without warning', () => {
    context();
    const recorded = decide();
    expect(recorded.decisionKind).toBe('realization');
    expect(recorded.warnings ?? []).toEqual([]);
    expect(inspect()).toEqual([]);
  });

  it('a subject owns the tool word only within its context', () => {
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

  it('a subject owns the plain word, not a command, code span or flag', () => {
    context('workflow', `The practice of checking work with ${tool}.`);
    const entries = [
      { name: 'plain', form: tool },
      { name: 'command', form: `${tool} run` },
      { name: 'span', form: `\`${tool}\`` },
      { name: 'flag', form: `--${tool}` },
    ].map(({ name, form }) => ({
      name,
      recorded: append(
        fixture.root,
        'define',
        name,
        '--context',
        'workflow',
        '--wording',
        `The work is checked with ${form}.`,
        '--reason',
        'State checking.',
      ) as Answer,
    }));
    const inspected = inspect();
    for (const { name, recorded } of entries) {
      const passage = expect.objectContaining({
        kind: 'concept',
        context: 'workflow',
        name,
      });
      if (name === 'plain') {
        // Binds “the plain word raises no warning” when recorded.
        expect.soft(recorded.warnings ?? []).toEqual([]);
        // Binds “the plain word raises no warning” when inspected alongside the other entries.
        expect
          .soft(inspected)
          .not.toEqual(
            expect.arrayContaining([expect.objectContaining({ passage })]),
          );
      } else {
        const warning = expect.objectContaining({
          passage,
          words: expect.stringContaining(tool),
        });
        // Binds “the command, code span or flag is warned” for each form when recorded.
        expect
          .soft(recorded.warnings, `${name} on recording`)
          .toEqual(expect.arrayContaining([warning]));
        // Binds “the command, code span or flag is warned” for each form when inspected.
        expect
          .soft(inspected, `${name} on inspection`)
          .toEqual(expect.arrayContaining([warning]));
      }
    }
  });
});
