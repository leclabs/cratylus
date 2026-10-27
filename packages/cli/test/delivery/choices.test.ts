import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import type { Host } from '../capability-port/fixture.js';
import {
  choices,
  chosen,
  configure,
  guided,
  hiddenStatus,
  hostOwned,
} from './choices-fixture.js';
import {
  assertRemoved,
  earlierCommand,
  fresh,
  install,
  owned,
  put,
  settings,
  success,
  tree,
  uninstall,
  version,
} from './fixture.js';

let h: Host | undefined;
afterEach(() => {
  h?.dispose();
  h = undefined;
});

it('supplied models and display answer are placed for omp, not owned or asked again', async () => {
  h = fresh();
  configure(h);
  const result = await guided(h, { modelRoles: choices, agentStatus: 'show' });
  expect(result.asked).toEqual([]);
  expect(settings(h).modelRoles).toMatchObject(chosen);
  hostOwned(h);
});

it('interactive install asks only the unbound tier, never a settled model or visible display', async () => {
  h = fresh();
  const visible = { ...hiddenStatus, showHookStatus: true };
  configure(
    h,
    {
      frontier: chosen.frontier,
      'delivery-persona': chosen['delivery-persona'],
    },
    visible,
  );
  const result = await guided(h, {}, { models: { fast: chosen.fast } });
  if (process.env.DELIVERY_CHOICE_NEGATIVE === '22')
    result.asked.push('model:frontier');
  expect(result.asked.filter((q) => q !== 'confirm')).toEqual(['model:fast']);
  expect(
    result.asked.filter((q) => q === 'confirm').length,
  ).toBeLessThanOrEqual(1);
  expect(settings(h).modelRoles).toMatchObject(chosen);
  expect(settings(h).statusLine).toEqual(visible);
  hostOwned(h);
});

it('interactive consent precedes enabling the display', async () => {
  h = fresh();
  configure(h, chosen);
  const result = await guided(h, {}, { show: true });
  expect(result.asked.filter((q) => q !== 'confirm')).toEqual(['agent-status']);
  const status = settings(h).statusLine as typeof hiddenStatus;
  expect(status.rightSegments).toEqual(hiddenStatus.rightSegments);
  expect(status.leftSegments).toContain('model');
  hostOwned(h);
});

it.each(['interactive', 'supplied'] as const)(
  '%s refusal stays hidden and is not treated as an unanswered choice',
  async (mode) => {
    h = fresh();
    configure(h, chosen);
    const result = await guided(
      h,
      mode === 'supplied' ? { agentStatus: 'hide' } : {},
      { show: false },
    );
    expect(result.asked.filter((q) => q !== 'confirm')).toEqual(
      mode === 'supplied' ? [] : ['agent-status'],
    );
    expect(settings(h).statusLine).toEqual(hiddenStatus);
    expect(result.output.split('next:')[1] ?? '').not.toMatch(
      /agent.status|show the session.s agent/i,
    );
    hostOwned(h);
  },
);

it('noninteractive install names precisely the missing tiers and display, and places the rest', async () => {
  h = fresh();
  configure(h, { frontier: chosen.frontier });
  const result = await guided(
    h,
    { interactive: false, modelRoles: `fast=${chosen.fast}` },
    { four: true },
  );
  expect(result.asked).toEqual([]);
  expect(settings(h).modelRoles).toEqual({
    default: 'fixture/base',
    frontier: chosen.frontier,
    fast: chosen.fast,
  });
  expect(settings(h).statusLine).toEqual(hiddenStatus);
  const next = result.output.split('next:')[1] ?? '';
  expect(next).toContain('frontier-other-family');
  expect(next).toContain('smol');
  expect(next).toMatch(/show the session.s agent/i);
  expect(next).toContain('--agent-status');
  expect(next).not.toMatch(/\bfast\b|\bfrontier\b(?!-other-family)/);
  expect(Object.keys(tree(join(owned(h), 'agents')))).toHaveLength(5);
  expect(existsSync(join(owned(h), 'skills/choice/SKILL.md'))).toBe(true);
  expect(existsSync(join(owned(h), 'extensions/cratylus.ts'))).toBe(true);
  hostOwned(h);
});

it('same-version reinstall never reapplies original model or display answers', async () => {
  h = fresh();
  configure(h);
  await guided(h, { modelRoles: choices, agentStatus: 'show' });
  configure(h, { ...chosen, frontier: 'fixture/changed' });
  const before = tree(h.home);
  const result = await guided(h, { modelRoles: choices, agentStatus: 'show' });
  expect(result.asked).toEqual([]);
  expect(tree(h.home)).toEqual(before);
  hostOwned(h);
});

it('upgrade replaces projection while keeping edited and unedited host answers', async () => {
  h = fresh();
  configure(h);
  await guided(h, { modelRoles: choices, agentStatus: 'show' });
  configure(h, { ...chosen, frontier: 'fixture/changed' });
  const before = settings(h);
  put(join(owned(h), 'local-old.txt'), 'old projection');
  await guided(h, {
    version: '2.5.0',
    modelRoles: choices,
    agentStatus: 'show',
  });
  expect(settings(h)).toEqual(before);
  expect(existsSync(join(owned(h), 'local-old.txt'))).toBe(false);
  expect(readFileSync(join(owned(h), 'installation.json'), 'utf8')).toContain(
    '2.5.0',
  );
  hostOwned(h);
});

it('uninstall keeps every model and display answer, including unedited ones', async () => {
  h = fresh();
  configure(h);
  await guided(h, { modelRoles: choices, agentStatus: 'show' });
  const current = settings(h);
  (current.modelRoles as Record<string, string>).frontier = 'fixture/changed';
  put(
    join(h.home, '.omp/agent/config.yml'),
    `${JSON.stringify(current, null, 2)}\n`,
  );
  const before = settings(h);
  success(uninstall(h));
  assertRemoved(h);
  expect(settings(h)).toEqual(before);
});

it('upgrading a real earlier installation keeps all seeded models and the edited binding but removes old projection', () => {
  h = fresh();
  configure(h, { smol: 'fixture/fast', alternate: 'other/model' });
  const old = earlierCommand(h);
  success(install(h));
  const legacy = readFileSync(
    join(h.home, '.omp/.forge/deploy-manifest.json'),
    'utf8',
  );
  expect(
    JSON.parse(legacy).modelRoleSeeds,
    'earlier build owned the tier and persona seeds',
  ).toMatchObject({
    frontier: 'fixture/base',
    'frontier-other-family': 'other/model',
    nico: '@frontier:high',
  });
  old.restore();
  const prior = settings(h);
  const roles = prior.modelRoles as Record<string, string>;
  expect(Object.keys(roles).length).toBeGreaterThan(2);
  expect(roles).toHaveProperty('nico');
  expect(roles).toHaveProperty('frontier', 'fixture/base');
  expect(roles).toHaveProperty('frontier-other-family', 'other/model');
  roles.nico = 'fixture/changed';
  const config = join(h.home, '.omp/agent/config.yml');
  put(
    config,
    readFileSync(config, 'utf8').replace(
      /("nico"\s*:\s*")[^"]+(")/,
      '$1fixture/changed$2',
    ),
  );
  expect(settings(h).modelRoles).toEqual(roles);
  version(h, '2.5.0');
  success(install(h));
  expect(settings(h).modelRoles).toEqual(roles);
  expect(existsSync(join(h.home, '.agents/skills/event-tap'))).toBe(false);
  expect(existsSync(join(h.home, '.omp/.forge/deploy-manifest.json'))).toBe(
    false,
  );
  expect(existsSync(join(owned(h), 'extensions/cratylus.ts'))).toBe(true);
  expect(
    readFileSync(join(owned(h), 'installation.json'), 'utf8'),
    'seeded bindings are now host-owned',
  ).not.toContain('fixture/changed');
});
