/**
 * E3.S2 · harness reimport after compile is a fixpoint.
 * Contract: plans/interop-hardening/stories/E3-reimport.md.
 *
 * Per adapter: an IR restricted to the resource types the adapter declares
 * `full` → adapter.write → `import <adapter>` into a fresh IR home → the second
 * IR must equal the first on those fields; iterating the cycle converges.
 */

import { rmSync } from 'node:fs';
import { describe, expect } from 'vitest';

import { runImport } from '../../../src/cli/commands/import.js';
import type {
  Adapter,
  Hook,
  IR,
  ResourceType,
} from '../../../src/core/index.js';
import { readIR } from '../../../src/core/index.js';
import { ALL_ADAPTERS, makeTmpDir, story } from '../helpers.js';
import { captureConsole } from './lib.js';

type IRResourceKey = Exclude<keyof IR, 'manifest'>;

const KEY_OF: Record<ResourceType, IRResourceKey> = {
  rules: 'rules',
  skills: 'skills',
  commands: 'commands',
  agents: 'agents',
  hooks: 'hooks',
  mcp: 'mcp_servers',
  permissions: 'permissions',
  env: 'env',
};

/** Resource keys the adapter declares `full` support for. */
function fullKeys(adapter: Adapter): IRResourceKey[] {
  return (
    Object.entries(adapter.capabilities.resources) as [ResourceType, string][]
  )
    .filter(([, support]) => support === 'full')
    .map(([type]) => KEY_OF[type]);
}

/** Master fixture restricted to the adapter's full-supported resource types. */
function fixtureFor(adapter: Adapter): IR {
  const keys = new Set(fullKeys(adapter));
  const ir: IR = {
    manifest: { agentForge: 1, scope: 'project', targets: [adapter.id] },
  };
  if (keys.has('rules'))
    ir.rules = [{ id: 'main', body: '# Rules\n\nBe terse.' }];
  if (keys.has('skills'))
    ir.skills = [
      {
        name: 'review',
        description: 'Review code',
        body: '# Review\n\n1. read',
      },
    ];
  if (keys.has('commands'))
    ir.commands = [
      { name: 'plan', body: 'Make a plan.', description: 'Planning' },
    ];
  if (keys.has('agents'))
    ir.agents = [
      { name: 'one', body: 'You are one.', description: 'Agent one' },
    ];
  if (keys.has('hooks'))
    ir.hooks = [
      {
        id: 'fmt',
        events: ['tool.use.post'],
        matcher: 'Edit',
        command: './fmt.sh',
        timeout: 15,
      },
    ];
  if (keys.has('mcp_servers'))
    ir.mcp_servers = [
      {
        name: 'github',
        transport: 'stdio',
        command: 'npx',
        args: ['-y', 'srv'],
      },
    ];
  if (keys.has('permissions')) ir.permissions = { allow: ['Read(*)'] };
  if (keys.has('env')) ir.env = { DEBUG: 'true' };
  return ir;
}

/** compile (adapter.write) → import into a fresh IR home → readIR. */
async function cycleOnce(
  adapter: Adapter,
  ir: IR,
  cleanup: string[],
): Promise<IR> {
  const harnessDir = makeTmpDir(`af-fx-${adapter.id}-`);
  const irHome = makeTmpDir(`af-fxir-${adapter.id}-`);
  cleanup.push(harnessDir, irHome);
  await adapter.write(ir, 'project', harnessDir, {});
  const { result } = await captureConsole(() =>
    runImport(
      { client: adapter.id, scope: 'project', cwd: irHome, from: harnessDir },
      ALL_ADAPTERS,
    ),
  );
  expect(result).toBe(0);
  const next = await readIR('project', irHome);
  return {
    ...next,
    manifest: { agentForge: 1, scope: 'project', targets: [adapter.id] },
  };
}

const stripHookIds = (hooks: Hook[] | undefined) =>
  hooks?.map(({ id: _id, ...rest }) => rest);

/** Adapters whose reimport regenerates hook ids (fmt → posttooluse-0 etc.). */
const HOOK_ID_REGENERATORS = new Set(['claude', 'cursor', 'gemini']);

describe('E3.S2 · harness reimport after compile is a fixpoint', () => {
  for (const adapter of ALL_ADAPTERS) {
    const keys = fullKeys(adapter);
    const label = keys.join(',');

    if (HOOK_ID_REGENERATORS.has(adapter.id)) {
      story(
        'E3.S2',
        `${adapter.id}: reimport reproduces full-supported fields (${label}) modulo hook ids`,
        async () => {
          const cleanup: string[] = [];
          try {
            const first = fixtureFor(adapter);
            const second = await cycleOnce(adapter, first, cleanup);
            for (const key of keys) {
              if (key === 'hooks') {
                expect(stripHookIds(second.hooks)).toEqual(
                  stripHookIds(first.hooks),
                );
              } else {
                expect(second[key], key).toEqual(first[key]);
              }
            }
          } finally {
            for (const d of cleanup)
              rmSync(d, { recursive: true, force: true });
          }
        },
      );

      story(
        'E3.S2',
        `${adapter.id}: hook ids survive the compile→import cycle (no undeclared loss)`,
        async () => {
          // The IR Hook.id ('fmt') is not persisted in the native hook dialect,
          // so reimport regenerates it (e.g. 'posttooluse-0'). Hook id is not a
          // declared-lossy field — the second IR must equal the first on it.
          const cleanup: string[] = [];
          try {
            const first = fixtureFor(adapter);
            const second = await cycleOnce(adapter, first, cleanup);
            expect(second.hooks).toEqual(first.hooks);
          } finally {
            for (const d of cleanup)
              rmSync(d, { recursive: true, force: true });
          }
        },
      );
    } else {
      story(
        'E3.S2',
        `${adapter.id}: reimport reproduces all full-supported fields (${label})`,
        async () => {
          const cleanup: string[] = [];
          try {
            const first = fixtureFor(adapter);
            const second = await cycleOnce(adapter, first, cleanup);
            for (const key of keys) {
              expect(second[key], key).toEqual(first[key]);
            }
          } finally {
            for (const d of cleanup)
              rmSync(d, { recursive: true, force: true });
          }
        },
      );
    }

    story(
      'E3.S2',
      `${adapter.id}: iterating the cycle 3× produces zero new diffs (fixpoint by iteration)`,
      async () => {
        const cleanup: string[] = [];
        try {
          const ir1 = await cycleOnce(adapter, fixtureFor(adapter), cleanup);
          const ir2 = await cycleOnce(adapter, ir1, cleanup);
          const ir3 = await cycleOnce(adapter, ir2, cleanup);
          expect(ir2).toEqual(ir1);
          expect(ir3).toEqual(ir2);
        } finally {
          for (const d of cleanup) rmSync(d, { recursive: true, force: true });
        }
      },
    );
  }
});
