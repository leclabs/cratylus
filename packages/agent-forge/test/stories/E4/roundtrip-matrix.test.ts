/**
 * E4.S1 — per-resource semantic round-trip on declared-full support.
 *
 * The matrix is generated from the adapters' OWN capability declarations:
 * every (adapter, resourceType) pair declared 'full' must round-trip a fixture
 * exercising every schema field of the type. The pair lists below are the
 * classification of one real run; the completeness story asserts they cover
 * the declaration set exactly, so a new 'full' declaration without a
 * classified fixture fails CI (the declaration is the test oracle).
 */

import { rmSync } from 'node:fs';
import { afterEach, describe, expect } from 'vitest';

import type { IR, ResourceType } from '../../../src/core/index.js';
import { ALL_ADAPTERS, adapterById, makeTmpDir, story } from '../helpers.js';
import {
  EXCLUDED_FIELDS,
  FIXTURES,
  IR_KEY,
  SCHEMA_NAME,
  comparable,
  manifest,
  readSchema,
} from './support.js';

type Pair = readonly [adapterId: string, type: ResourceType];

/** Pairs whose declared-full round-trip holds today. */
const PASSING_PAIRS: readonly Pair[] = [
  ['aider', 'rules'],
  ['claude', 'rules'],
  ['claude', 'skills'],
  ['claude', 'commands'],
  ['claude', 'agents'],
  ['claude', 'hooks'],
  ['claude', 'mcp'],
  ['claude', 'permissions'],
  ['claude', 'env'],
  ['cline', 'rules'],
  ['codex', 'rules'],
  ['codex', 'skills'],
  ['codex', 'commands'],
  ['continue', 'rules'],
  ['copilot', 'rules'],
  ['copilot', 'skills'],
  ['crush', 'rules'],
  ['cursor', 'rules'],
  ['cursor', 'hooks'],
  ['gemini', 'rules'],
  ['gemini', 'hooks'],
  ['opencode', 'rules'],
  ['opencode', 'mcp'],
  ['opencode', 'env'],
] as const;

/**
 * Pairs declared 'full' that do NOT round-trip today, each classified with
 * its own reason:
 * - mcp: each of these adapters silently drops remote-server `headers` on
 *   read, so a RemoteMcpServer loses a schema field with no warning (mcp
 *   declared full is dishonest for these — consistent with the §3
 *   remote-MCP-shape divergences [CX7][GM1][CL6][CU5]).
 * - codex/agents: `tools`/`color` have no documented Codex agent-TOML field
 *   [CX1] — the shared agents fixture exercises both, so they are warned and
 *   dropped on write rather than fabricated, and do not survive reimport.
 */
const TRACKED_PAIRS: readonly (readonly [...Pair, reason: string])[] = [
  ['cline', 'mcp', 'remote-mcp headers dropped on read'],
  ['codex', 'mcp', 'remote-mcp headers dropped on read'],
  ['copilot', 'mcp', 'remote-mcp headers dropped on read'],
  ['cursor', 'mcp', 'remote-mcp headers dropped on read'],
  ['gemini', 'mcp', 'remote-mcp headers dropped on read'],
  [
    'codex',
    'agents',
    'tools/color have no documented Codex agent-TOML field [CX1]',
  ],
] as const;

const cleanups: string[] = [];
afterEach(() => {
  for (const dir of cleanups.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

async function roundTrip(adapterId: string, type: ResourceType): Promise<void> {
  const adapter = adapterById.get(adapterId);
  if (!adapter) throw new Error(`unknown adapter '${adapterId}'`);
  const cwd = makeTmpDir(`af-e4s1-${adapterId}-${type}-`);
  cleanups.push(cwd);

  const ir: IR = { manifest: manifest(adapterId), ...FIXTURES[type] };
  await adapter.write(ir, 'project', cwd, {});
  const back = await adapter.read('project', cwd);

  const key = IR_KEY[type];
  expect(comparable(back[key], type)).toEqual(
    comparable((FIXTURES[type] as Record<string, unknown>)[key], type),
  );
}

describe('E4.S1 · declared-full round-trip matrix', () => {
  for (const [adapterId, type] of PASSING_PAIRS) {
    story('E4.S1', `${adapterId}/${type}: import(compile(r)) ≡ r`, async () => {
      await roundTrip(adapterId, type);
    });
  }

  for (const [adapterId, type, reason] of TRACKED_PAIRS) {
    story.tracked(
      'E4.S1',
      `${adapterId}/${type}: import(compile(r)) ≡ r (${reason})`,
      async () => {
        await roundTrip(adapterId, type);
      },
    );
  }

  story(
    'E4.S1',
    'matrix completeness: every declared-full pair is classified (declaration is the oracle)',
    () => {
      const declared: string[] = [];
      for (const adapter of ALL_ADAPTERS) {
        for (const [type, support] of Object.entries(
          adapter.capabilities.resources,
        )) {
          if (support === 'full') declared.push(`${adapter.id}/${type}`);
        }
      }
      const classified = [...PASSING_PAIRS, ...TRACKED_PAIRS].map(
        ([a, t]) => `${a}/${t}`,
      );
      expect(new Set(classified).size).toBe(classified.length);
      expect(classified.sort()).toEqual(declared.sort());
    },
  );

  story(
    'E4.S1',
    'fixtures exercise every schema field of each resource type (modulo documented exclusions)',
    () => {
      const types = Object.keys(IR_KEY) as ResourceType[];
      for (const type of types) {
        const excluded = [
          ...EXCLUDED_FIELDS.common,
          ...(EXCLUDED_FIELDS[type] ?? []),
        ];
        const schema = readSchema(SCHEMA_NAME[type]) as {
          properties?: Record<string, unknown>;
          $defs?: Record<string, { properties?: Record<string, unknown> }>;
          oneOf?: unknown[];
        };
        const schemaFields = new Set<string>();
        if (schema.properties) {
          for (const f of Object.keys(schema.properties)) schemaFields.add(f);
        }
        if (schema.oneOf && schema.$defs) {
          for (const def of Object.values(schema.$defs)) {
            for (const f of Object.keys(def.properties ?? {}))
              schemaFields.add(f);
          }
        }
        const fixture = (FIXTURES[type] as Record<string, unknown>)[
          IR_KEY[type]
        ];
        const items: Record<string, unknown>[] = Array.isArray(fixture)
          ? (fixture as Record<string, unknown>[])
          : [fixture as Record<string, unknown>];
        const exercised = new Set(items.flatMap((i) => Object.keys(i)));

        if (type === 'env') {
          // env is a free-form string map (no fixed properties): non-empty is
          // the strongest schema-derived requirement.
          expect(exercised.size).toBeGreaterThan(0);
          continue;
        }
        const missing = [...schemaFields].filter(
          (f) => !excluded.includes(f) && !exercised.has(f),
        );
        expect(missing, `${type} fixture misses schema fields`).toEqual([]);
      }
    },
  );

  story(
    'E4.S1',
    'fixture law (amended 2026-07): the shared mcp fixture exercises remote `headers` — read-side drops count as failures on every remote-capable adapter',
    () => {
      // The matrix runs ONE fixture set against every declared-full mcp pair
      // (completeness asserted above), so this single guard makes `headers` a
      // mandatory exercised field for all remote-MCP-capable adapters; the
      // empirically-surfaced class is the silent read-side drop
      // [CX7][GM1][CL6][CU5].
      const servers = (
        FIXTURES.mcp as { mcp_servers: Record<string, unknown>[] }
      ).mcp_servers;
      const remote = servers.filter((s) => s.transport !== 'stdio');
      expect(remote.length).toBeGreaterThan(0);
      for (const s of remote) {
        const headers = s.headers as Record<string, unknown> | undefined;
        expect(
          headers && Object.keys(headers).length > 0,
          `remote fixture '${String(s.name)}' must carry headers`,
        ).toBeTruthy();
      }
    },
  );
});
