import { rmSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  type Fixture,
  wholeDeclaration as d,
  dispatchTargets,
  inspect,
  skillInstructions,
  status,
  wholeFixture,
} from './fixture.js';
import { type ExerciseResult, exercise } from './provider.js';

const launch = { agent: d.name, modelFlags: false, skills: true };

// Learn the personality block from omp, rather than freezing its preset wording.
async function defaultPersonality(f: Fixture) {
  const config = f.configuration();
  const plain = await inspect(f);
  f.configure({ ...config, personality: 'none' });
  const none = await inspect(f);
  f.configure(config);
  const withDefault = plain.observation.prompt.join('\n');
  const without = none.observation.prompt.join('\n');
  let start = 0;
  while (start < withDefault.length && withDefault[start] === without[start])
    start++;
  let end = 0;
  while (
    end < withDefault.length - start &&
    withDefault[withDefault.length - 1 - end] ===
      without[without.length - 1 - end]
  )
    end++;
  const personality = withDefault.slice(start, withDefault.length - end).trim();
  expect(
    personality.length,
    'empirically identified default personality',
  ).toBeGreaterThan(0);
  expect(without).not.toContain(personality);
  return [personality];
}

function assertOtherSettings(result: ExerciseResult, personality: string[]) {
  const context = JSON.stringify(
    result.requests.map((request) => request.messages),
  );
  for (const instructions of skillInstructions)
    expect
      .soft(context, 'skill instructions reach the provider')
      .toContain(instructions);
  expect
    .soft(
      result.observation.settings.readSummarize,
      'declared read summarisation',
    )
    .toBe(false);
  expect
    .soft(result.observation.settings.advisor, 'declared advisor enabled')
    .toBe(true);
  expect
    .soft(result.observation.settings.advisorModel, 'declared advisor model')
    .toBe('fixture/adviser');
  expect
    .soft(
      result.observation.prewalkArmed || result.observation.settings.prewalk,
      'pre-planning held by omp',
    )
    .toBe(true);
  for (const block of personality)
    expect
      .soft(context, 'default personality absent')
      .not.toContain(JSON.stringify(block).slice(1, -1));
}

describe('agent launch — whole declaration visible examples', () => {
  it('1: loads both declared skills into the first provider context', async () => {
    const f = wholeFixture();
    try {
      const result = await exercise(f, launch);
      const context = JSON.stringify(result.requests[0]?.messages);
      for (const instructions of skillInstructions)
        expect
          .soft(
            context,
            'loaded instructions, not available-skill descriptions',
          )
          .toContain(instructions);
    } finally {
      f.dispose();
    }
  });

  it('2: dispatches each named target and refuses the third through omp task', async () => {
    const f = wholeFixture();
    try {
      for (const [index, target] of dispatchTargets.entries()) {
        const result = await exercise(f, {
          ...launch,
          tools: ['read', 'task'],
          target,
          targetBody: `Only ${target} records the copper tide gauge.`,
        });
        expect
          .soft(result.reached, `${target}: ${JSON.stringify(result.results)}`)
          .toBe(index < 2);
        expect
          .soft(result.results.length, 'omp handled the attempted task')
          .toBeGreaterThan(0);
        if (index === 2)
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

  it('3: enables then disables summarised reads against opposite operator defaults', async () => {
    const f = wholeFixture();
    try {
      for (const enabled of [true, false]) {
        f.configure({
          ...f.configuration(),
          read: { summarize: { enabled: !enabled } },
        });
        f.declaration({ ...d, readSummarize: enabled });
        const result = await exercise(f, launch);
        expect
          .soft(
            result.observation.settings.readSummarize,
            `read-summary ${enabled}`,
          )
          .toBe(enabled);
      }
    } finally {
      f.dispose();
    }
  });

  it('4: enables then disables advisor and pre-planning against opposite defaults', async () => {
    const f = wholeFixture();
    try {
      for (const enabled of [true, false]) {
        f.configure({
          ...f.configuration(),
          advisor: { enabled: !enabled },
          prewalk: { enabled: !enabled },
        });
        f.declaration({
          ...d,
          advisor: enabled ? 'fixture/adviser' : false,
          prewalk: enabled ? 'fixture/fast' : false,
        });
        const result = await exercise(f, launch);
        expect
          .soft(result.observation.settings.advisor, `advisor ${enabled}`)
          .toBe(enabled);
        if (enabled)
          expect
            .soft(result.observation.settings.advisorModel)
            .toBe('fixture/adviser');
        expect
          .soft(
            result.observation.prewalkArmed ||
              result.observation.settings.prewalk,
            `prewalk ${enabled}`,
          )
          .toBe(enabled);
      }
    } finally {
      f.dispose();
    }
  });

  it('5: carries its own text without the empirically identified default personality', async () => {
    const f = wholeFixture();
    try {
      const personality = await defaultPersonality(f);
      const result = await exercise(f, launch);
      const context = JSON.stringify(result.requests[0]?.messages);
      expect(context).toContain(d.body);
      for (const block of personality)
        expect
          .soft(context, 'default personality absent')
          .not.toContain(JSON.stringify(block).slice(1, -1));
    } finally {
      f.dispose();
    }
  });

  it('6: operator model effort and non-dispatch tools win without losing declaration settings', async () => {
    const f = wholeFixture();
    try {
      const personality = await defaultPersonality(f);
      const plain = await inspect(f, { tools: ['read', 'grep'] });
      const result = await exercise(f, {
        ...launch,
        tools: ['read', 'grep'],
        extra: ['--model', 'fixture/base', '--thinking', 'low'],
        target: dispatchTargets[0],
        targetBody: `Only ${dispatchTargets[0]} records the copper tide gauge.`,
      });
      expect
        .soft(result.observation.model)
        .toMatchObject({ provider: 'fixture', id: 'base' });
      expect.soft(result.observation.effort).toBe('low');
      expect
        .soft(result.observation.tools.slice().sort())
        .toEqual(plain.observation.tools.slice().sort());
      expect.soft(result.observation.tools).not.toContain('task');
      expect
        .soft(result.reached, 'cannot dispatch without the granted tool')
        .toBe(false);
      expect.soft(status(result.frames)).toContain(d.name);
      expect.soft(status(result.frames)).toContain(d.mark);
      expect
        .soft(JSON.stringify(result.requests[0]?.messages))
        .toContain(d.body);
      assertOtherSettings(result, personality);
    } finally {
      f.dispose();
    }
  });

  it('7: a discoverable whole declaration changes no dimension of a plain session', async () => {
    const f = wholeFixture();
    try {
      rmSync(f.declaration(d));
      // Warm omp's asynchronous skill-description cache before comparing prompts.
      await exercise(f, { skills: true });
      const plain = await exercise(f, { skills: true });
      const before = [];
      for (const target of dispatchTargets)
        before.push(
          (
            await exercise(f, {
              tools: ['task'],
              target,
              targetBody: `Only ${target} records the copper tide gauge.`,
            })
          ).reached,
        );
      f.declaration(d);
      const unselected = await exercise(f, { skills: true });
      expect
        .soft(unselected.observation.prompt)
        .toEqual(plain.observation.prompt);
      expect.soft(unselected.observation.model).toMatchObject({
        provider: plain.observation.model.provider,
        id: plain.observation.model.id,
      });
      expect
        .soft(unselected.observation.effort)
        .toEqual(plain.observation.effort);
      expect
        .soft(unselected.observation.tools)
        .toEqual(plain.observation.tools);
      expect
        .soft(unselected.observation.settings)
        .toEqual(plain.observation.settings);
      expect
        .soft(unselected.observation.prewalkArmed)
        .toBe(plain.observation.prewalkArmed);
      expect.soft(status(unselected.frames)).toBe(status(plain.frames));
      for (const instructions of skillInstructions)
        expect
          .soft(JSON.stringify(unselected.requests[0]?.messages))
          .not.toContain(instructions);
      const after = [];
      for (const target of dispatchTargets)
        after.push(
          (
            await exercise(f, {
              tools: ['task'],
              target,
              targetBody: `Only ${target} records the copper tide gauge.`,
            })
          ).reached,
        );
      expect.soft(after).toEqual(before);
    } finally {
      f.dispose();
    }
  });

  it('8: launch and native dispatch carry the same whole declaration under the same grant', async () => {
    const f = wholeFixture();
    try {
      const personality = await defaultPersonality(f);
      const main = await exercise(f, { ...launch, tools: d.tools });
      const child = await exercise(f, {
        skills: true,
        tools: d.tools,
        dispatched: d.name,
        subjectBody: d.body,
      });
      for (const result of [main, child]) {
        expect
          .soft(JSON.stringify(result.requests[0]?.messages))
          .toContain(d.body);
        assertOtherSettings(result, personality);
      }
      expect.soft(main.observation.model).toMatchObject({
        provider: child.observation.model.provider,
        id: child.observation.model.id,
      });
      expect.soft(main.observation.effort).toBe(child.observation.effort);
      expect
        .soft(main.observation.settings.readSummarize)
        .toBe(child.observation.settings.readSummarize);
      expect
        .soft(main.observation.settings.advisor)
        .toBe(child.observation.settings.advisor);
      expect
        .soft(main.observation.settings.advisorModel)
        .toEqual(child.observation.settings.advisorModel);
      expect
        .soft(
          main.observation.prewalkArmed || main.observation.settings.prewalk,
        )
        .toBe(
          child.observation.prewalkArmed || child.observation.settings.prewalk,
        );
      for (const target of dispatchTargets) {
        const attempt = {
          tools: d.tools,
          target,
          targetBody: `Only ${target} records the copper tide gauge.`,
        };
        const launched = await exercise(f, { ...launch, ...attempt });
        const dispatched = await exercise(f, {
          ...attempt,
          skills: true,
          dispatched: d.name,
          subjectBody: d.body,
        });
        expect.soft(launched.reached, target).toBe(dispatched.reached);
      }
    } finally {
      f.dispose();
    }
  });
});
