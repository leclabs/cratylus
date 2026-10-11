import { afterEach, expect, it } from 'vitest';
import type { Fixture } from '../../agent-launch/fixture.js';
import {
  type LoadedExtension,
  bindingFixture,
  ledger,
  load,
  open,
  succeeds,
  task,
} from './fixture.js';

let f: Fixture | undefined;
let extension: LoadedExtension | undefined;
afterEach(() => {
  extension?.restore();
  extension = undefined;
  f?.dispose();
  f = undefined;
});

for (const toolName of ['task', 'dispatch_agents']) {
  it(`workflow/4, workflow/5 — ${toolName} captures harness dispatch, return and verdict without agent recording calls`, async () => {
    f = bindingFixture();
    open(f);
    succeeds(
      f,
      'workPackage',
      'submit',
      'approval',
      '--cut',
      'film',
      '--output',
      'film.txt',
      '--concept',
      'approval',
    );
    extension = await load(f, { dispatchTool: toolName });
    const state = () => succeeds(f!, 'workPackage', 'state', '--cut', 'film');
    const dispatch = async (agent: string, input: unknown, id: string) => {
      const event = { ...task(agent, input, id), toolName };
      const answer = await extension!.fire('tool_call', event);
      expect(
        answer?.block,
        `a fitting dispatch is allowed: ${answer?.reason}`,
      ).not.toBe(true);
      return event;
    };
    const returned = async (id: string, data: unknown) =>
      extension!.fire('tool_result', {
        toolName,
        toolCallId: id,
        details: {
          results: [
            {
              index: 0,
              id: `${id}/one`,
              structuredOutput: { data },
              tokens: { input: 12, output: 7 },
            },
          ],
        },
      });
    await dispatch(
      'builder',
      {
        cut: 'film',
        workPackage: 'approval',
        outputs: ['film.txt'],
        concepts: ['approval'],
        examples: ['film-production/1'],
      },
      'build',
    );
    expect(
      state().workPackages[0].status,
      'harness dispatch recorded before return',
    ).toBe('dispatched');
    await returned('build', {
      cut: 'film',
      workPackage: 'approval',
      done: true,
    });
    expect(
      state().workPackages[0].status,
      'return is recorded, not mistaken for approval',
    ).toBe('returned');
    const verdicts = [
      {
        workPackage: 'approval',
        concept: 'approval',
        passes: true,
        evidence: 'film-production/1: approval passed',
      },
    ];
    for (const id of ['assayer-a', 'assayer-b']) {
      await dispatch(
        'assayer',
        {
          cut: 'film',
          workPackages: ['approval'],
          examples: ['film-production/1'],
          decisions: [],
        },
        id,
      );
      await returned(id, { cut: 'film', verdicts, hardeningNotes: [] });
    }
    expect(
      state().workPackages[0].status,
      'both harness verdicts approve the package',
    ).toBe('approved');
    expect(ledger(f).filter((e) => e.kind === 'verdict')).toEqual([
      expect.objectContaining({ verdicts }),
      expect.objectContaining({ verdicts }),
    ]);
    expect(ledger(f).filter((e) => e.kind === 'dispatched')).toHaveLength(3);
    expect(ledger(f).filter((e) => e.kind === 'returned')).toHaveLength(3);
  });
}
