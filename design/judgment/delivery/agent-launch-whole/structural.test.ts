import { describe, expect, it } from 'vitest';
import {
  wholeDeclaration as d,
  dispatchTargets,
  skillInstructions,
  wholeFixture,
} from '../../../../packages/cli/test/agent-launch/fixture.js';
import { exercise } from '../../../../packages/cli/test/agent-launch/provider.js';

describe('agent launch — whole declaration held-out cases', () => {
  it('1: omitted targets with task match the same declaration when natively dispatched', async () => {
    const f = wholeFixture();
    try {
      f.declaration({
        ...d,
        spawns: undefined,
        advisor: false,
        prewalk: false,
      });
      const launched = [];
      const dispatched = [];
      for (const target of dispatchTargets) {
        const attempt = {
          tools: d.tools,
          target,
          targetBody: `Only ${target} records the copper tide gauge.`,
        };
        launched.push(
          (
            await exercise(f, {
              ...attempt,
              agent: d.name,
              skills: true,
              modelFlags: false,
            })
          ).reached,
        );
        dispatched.push(
          (
            await exercise(f, {
              ...attempt,
              dispatched: d.name,
              subjectBody: d.body,
              skills: true,
            })
          ).reached,
        );
      }
      expect(
        launched,
        'native dispatch is the permission oracle, not a hard-coded target default',
      ).toEqual(dispatched);
    } finally {
      f.dispose();
    }
  });

  it('2: loaded skill instructions still reach the provider after real compaction', async () => {
    const f = wholeFixture();
    try {
      f.configure({
        ...f.configuration(),
        compaction: { keepRecentTokens: 0 },
      });
      const result = await exercise(f, {
        agent: d.name,
        skills: true,
        modelFlags: false,
        compact: true,
      });
      for (const instructions of skillInstructions)
        expect
          .soft(
            JSON.stringify(result.requests[0]?.messages),
            'skills loaded before compaction',
          )
          .toContain(instructions);
      expect(
        result.afterCompaction.length,
        'provider received a post-compaction turn',
      ).toBeGreaterThan(0);
      const context = JSON.stringify(result.afterCompaction[0]?.messages);
      for (const instructions of skillInstructions)
        expect
          .soft(context, 'loaded skills survive compaction')
          .toContain(instructions);
    } finally {
      f.dispose();
    }
  });

  it('3: an explicitly empty dispatch list refuses every attempted target despite task grant', async () => {
    const f = wholeFixture();
    try {
      f.declaration({ ...d, spawns: [] });
      for (const target of dispatchTargets) {
        const result = await exercise(f, {
          agent: d.name,
          modelFlags: false,
          skills: true,
          tools: d.tools,
          target,
          targetBody: `Only ${target} records the copper tide gauge.`,
        });
        expect.soft(result.observation.tools).toContain('task');
        expect
          .soft(result.reached, `${target}: ${JSON.stringify(result.results)}`)
          .toBe(false);
        expect
          .soft(result.results.length, 'omp handled the attempted dispatch')
          .toBeGreaterThan(0);
        expect
          .soft(
            result.results.some((result) => result.isError === true),
            'omp refused the task',
          )
          .toBe(true);
      }
    } finally {
      f.dispose();
    }
  });
});
