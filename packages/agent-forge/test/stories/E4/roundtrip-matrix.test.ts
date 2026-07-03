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
  ['codex', 'agents'],
  ['codex', 'mcp'],
  ['continue', 'rules'],
  ['copilot', 'rules'],
  ['copilot', 'skills'],
  ['copilot', 'commands'],
  ['copilot', 'mcp'],
  ['crush', 'rules'],
  ['cursor', 'rules'],
  ['cursor', 'hooks'],
  ['cursor', 'mcp'],
  ['gemini', 'rules'],
  ['gemini', 'hooks'],
  ['gemini', 'mcp'],
  ['kilo', 'mcp'],
  ['opencode', 'rules'],
  ['opencode', 'mcp'],
  ['standards', 'rules'],
] as const;

/**
 * Two pairs need per-adapter handling to round-trip honestly rather than by
 * fabrication (documented-by-design exclusions, retired from tracked-failing
 * 2026-07 — see `stripFor`/`fixtureFor` above):
 * - codex/agents: `tools`/`color` have no documented Codex agent-TOML field
 *   [CX1] — the shared agents fixture exercises both; write warns-and-drops
 *   them rather than fabricating a field, so `stripFor` excludes them from
 *   BOTH sides of the comparison for this one pair only (claude/agents, also
 *   'full', still compares tools/color in full).
 * - claude/rules (claude-surfaces, 2026-07): the shared fixture's rule is a
 *   default CONCAT rule; its CLAUDE.md imports `@AGENTS.md` per Anthropic's
 *   own documented shim [S7] instead of duplicating the body — the body is
 *   deliberately not readable back from CLAUDE.md alone (this adapter never
 *   writes AGENTS.md, E7.S10). That is a cross-adapter concern (E7.S2), not
 *   what an isolated-adapter round-trip tests, so `fixtureFor` gives claude a
 *   `concat: false` rule instead: it compiles to its own `.claude/rules/<id>.md`
 *   [CC1] and round-trips losslessly.
 *
 * mcp: codex/copilot/gemini's remote-header read-side drop (convergence-
 * graduation, 2026-07) — write now carries the generic `headers` field
 * through to each dialect's native remote-header key (codex: `http_headers`,
 * its only header surface [CX7]; copilot/gemini: `headers` verbatim), and
 * read lifts it back — see PASSING_PAIRS. cursor's row graduated earlier with
 * the cursor-adapter-truth fix (read.ts lifts headers/auth alongside url
 * [CU5]). cline's row is GONE (not dropped-then-untracked): the
 * cline-adapter-truth fix flipped its mcp capability 'full' → 'partial' (no
 * documented project-scope surface at all [CL6], full fidelity only at
 * user/CLI scope) — cline/mcp is no longer in the declared-'full' set this
 * matrix classifies, so PASSING_PAIRS doesn't carry it either.
 */

const cleanups: string[] = [];
afterEach(() => {
  for (const dir of cleanups.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

/** Per-adapter fixture override: claude/rules exercises the ISOLATED
 *  (non-concat) round-trip [CC1] rather than the shared concat fixture —
 *  the concat path externalizes to `@AGENTS.md` [S7] (a cross-adapter
 *  concern, E7.S2), not something an isolated-adapter round-trip can
 *  recover. */
function fixtureFor(adapterId: string, type: ResourceType): Partial<IR> {
  if (adapterId === 'claude' && type === 'rules') {
    const rules = (FIXTURES.rules as { rules: IR['rules'] }).rules;
    return { rules: rules?.map((r) => ({ ...r, concat: false })) };
  }
  return FIXTURES[type];
}

/** Per-adapter comparison strip: codex's agent-TOML dialect has no
 *  documented `tools`/`color` field [CX1] — write() warns-and-drops both
 *  rather than fabricating them, so they never survive reimport. Same class
 *  as the aider rules-id strip below, scoped to this one pair. */
function stripFor(
  adapterId: string,
  type: ResourceType,
): (v: unknown) => unknown {
  if (adapterId === 'codex' && type === 'agents') {
    return (v) =>
      Array.isArray(v)
        ? v.map(({ tools: _tools, color: _color, ...rest }) => rest)
        : v;
  }
  // aider concatenates every IR rule into one conventions file with no
  // frontmatter/id slot (aider-adapter-truth); read() derives a synthetic id
  // from the wired filename's stem, so 'id' is not part of the round-trip
  // invariant for this one pair — same class as the documented hooks/id
  // exclusion in EXCLUDED_FIELDS, scoped here to aider since every OTHER
  // rules-'full' adapter does preserve id (via its own filename).
  if (adapterId === 'aider' && type === 'rules') {
    return (v) =>
      Array.isArray(v) ? v.map(({ id: _id, ...rest }) => rest) : v;
  }
  return (v) => v;
}

async function roundTrip(adapterId: string, type: ResourceType): Promise<void> {
  const adapter = adapterById.get(adapterId);
  if (!adapter) throw new Error(`unknown adapter '${adapterId}'`);
  const cwd = makeTmpDir(`af-e4s1-${adapterId}-${type}-`);
  cleanups.push(cwd);

  const fixture = fixtureFor(adapterId, type);
  const ir: IR = { manifest: manifest(adapterId), ...fixture };
  await adapter.write(ir, 'project', cwd, {});
  const back = await adapter.read('project', cwd);

  const key = IR_KEY[type];
  const strip = stripFor(adapterId, type);
  expect(strip(comparable(back[key], type))).toEqual(
    strip(comparable((fixture as Record<string, unknown>)[key], type)),
  );
}

describe('E4.S1 · declared-full round-trip matrix', () => {
  for (const [adapterId, type] of PASSING_PAIRS) {
    story('E4.S1', `${adapterId}/${type}: import(compile(r)) ≡ r`, async () => {
      await roundTrip(adapterId, type);
    });
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
      const classified = PASSING_PAIRS.map(([a, t]) => `${a}/${t}`);
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
