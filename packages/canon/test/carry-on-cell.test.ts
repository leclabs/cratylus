// CARRY-ON CELL gate — the elevation has a MECHANISM, and the cell installs it.
//
// WHY THIS FILE EXISTS. `carry-on` asserted `loop-position := out-of-the-loop` and
// installed nothing. A skill is text in context and text is advisory, so the
// assertion held exactly as far as a model's compliance with prose — the property
// the elevation exists to stop depending on. The repair is a runtime capability, and
// a repair of that shape can silently half-land in three ways this gate closes:
//
//   1. THE CELL STOPS DECLARING THE CAPABILITY — the SKILL.md still says "elevate"
//      and no shim is projected, which is the original defect with extra steps. So
//      the shim is asserted on the PROJECTED ARTIFACT, not on the source's intent.
//   2. THE CELL AND THE RUNTIME DRIFT — a verb renamed on one side leaves an
//      invocation line that dies `unknown verb`. So the cell's verb set is crossed
//      against the runtime's `CarryOnVerb` union, read from source as TEXT (canon
//      does not import runtime's implementation; `event-tap-cell.test.ts` set this
//      precedent).
//   3. THE PLAN VOCABULARY FORKS — the runtime is forbidden to know the plan
//      layout, so the names travel on the projected command line. That makes the
//      cell's `layout` line a COPY unless it is generated from canon's one home,
//      and a copy is how `PLAN_STATES` acquires a second, drifting owner.
//
// It also pins the fourth disjunct into the cell: a terminus predicate missing
// `sharded ∧ ¬done ∧ frontier = ∅` wedges a session on a mis-cut plan forever, and
// that is a fact about the CELL's law, not only about the runtime's code.

import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { adapterByName } from '@cratylus/forge/adapters/registry';
import { projectPluginSet, writeRenderTree } from '@cratylus/forge/project';
import { CLI_BIN } from '@cratylus/runtime/bin-name';
import { beforeAll, describe, expect, it } from 'vitest';
import canonPlugin from '../src/index.js';
import {
  PLAN_FRONTIER,
  PLAN_MARKERS,
  PLAN_STATES,
} from '../src/plan-states.js';
import { carryOn } from '../src/skills/carry-on/skill.js';

const canonRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

/** The runtime module that OWNS the verb union — the drift counterpart. */
const DISPATCH_SRC = join(
  canonRoot,
  '..',
  'runtime',
  'src',
  'capabilities',
  'carry-on',
  'dispatch.ts',
);

/** The `CarryOnVerb` union's members, parsed from the runtime source text. */
function unionVerbs(src: string): string[] {
  const m = src.match(/export type CarryOnVerb =([^;]+);/);
  if (m?.[1] === undefined) {
    throw new Error(
      'carry-on: no `CarryOnVerb` union found in the runtime source',
    );
  }
  return [...m[1].matchAll(/'([a-z]+)'/g)].map((g) => g[1] as string).sort();
}

const runtimeVerbs = (): string[] =>
  unionVerbs(readFileSync(DISPATCH_SRC, 'utf-8'));

/** The verb set a cell's formal block enumerates (`verb ∈ { a · b · … }`). */
function cellVerbs(formalBlock: string): string[] {
  const m = formalBlock.match(/^verb\s+∈ \{([^}]+)\}/m);
  if (m?.[1] === undefined) {
    throw new Error('carry-on: the cell declares no verb set');
  }
  return m[1]
    .split('·')
    .map((s) => s.trim())
    .sort();
}

/** The `--flag value` pairs of the cell's projected `layout` line. */
function layoutFlags(formalBlock: string): Record<string, string> {
  const line = formalBlock
    .split('\n')
    .find((l) => l.startsWith('layout') && l.includes('--plan-root'));
  if (line === undefined) {
    throw new Error('carry-on: the cell projects no plan layout');
  }
  const flags: Record<string, string> = {};
  for (const m of line.matchAll(/--([a-z-]+) (\S+)/g)) {
    flags[m[1] as string] = m[2] as string;
  }
  return flags;
}

let out = '';

beforeAll(async () => {
  out = mkdtempSync(join(tmpdir(), 'carry-on-cell-'));
  const report = await projectPluginSet({
    plugins: [canonPlugin],
    adapter: adapterByName('claude'),
  });
  writeRenderTree(out, report.files);
}, 120_000);

describe('carry-on cell — the elevation installs the mechanism that holds it', () => {
  it('the cell declares the carryOn runtime capability', () => {
    expect(carryOn.name).toBe('carry-on');
    expect(carryOn.runtime?.capability).toBe('carryOn');
  });

  it('projection emits the thin shim at skills/carry-on/scripts/carryOn.mjs', () => {
    const shim = join(out, 'skills', 'carry-on', 'scripts', 'carryOn.mjs');
    expect(existsSync(shim)).toBe(true);
    const src = readFileSync(shim, 'utf-8');
    expect(src).toMatch(new RegExp(`spawnSync\\('${CLI_BIN}', \\['carryOn',`));
    expect(src).toContain('...process.argv.slice(2)');
    expect(src).not.toContain('@cratylus/');
  });

  it('the projected SKILL.md names every verb and its invocation', () => {
    const md = readFileSync(
      join(out, 'skills', 'carry-on', 'SKILL.md'),
      'utf-8',
    );
    for (const verb of runtimeVerbs()) {
      expect(md, `SKILL.md must name the '${verb}' verb`).toContain(verb);
    }
    expect(md).toContain('scripts/carryOn.mjs elevate');
    expect(md).toContain('scripts/carryOn.mjs revert');
  });

  // ── VERB PARITY — the cell and the runtime cannot drift ────────────────────────
  it('the verbs the cell names EQUAL the runtime CarryOnVerb union', () => {
    const verbs = runtimeVerbs();
    expect(verbs).toEqual(['elevate', 'revert', 'status', 'terminus']);
    expect(cellVerbs(carryOn.formalBlock)).toEqual(verbs);
    for (const verb of ['elevate', 'revert', 'status', 'terminus']) {
      expect(
        carryOn.formalBlock,
        `verb '${verb}' needs an invocation line`,
      ).toContain(`scripts/carryOn.mjs ${verb}`);
    }
  });

  // ── THE PROJECTED CONFIGURATION — canon's names, not a second copy ─────────────
  it('the cell projects the plan vocabulary verbatim from canon’s one home', () => {
    const flags = layoutFlags(carryOn.formalBlock);
    expect(flags.states).toBe(PLAN_STATES.join(','));
    expect(flags.completed).toBe(PLAN_STATES[PLAN_STATES.length - 1]);
    expect(flags.frontier).toBe(PLAN_FRONTIER.join(','));
    expect(flags['bound-marker']).toBe(PLAN_MARKERS.bound);
    expect(flags['ruling-owed-marker']).toBe(PLAN_MARKERS.rulingOwed);
  });

  // ── THE LAWS THE MECHANISM RESTS ON ───────────────────────────────────────────
  it('the cell states all four terminus disjuncts, including the anti-wedge one', () => {
    const block = carryOn.formalBlock;
    expect(block).toContain('terminus  ⇔ ¬∃P: bound(P)');
    expect(block).toContain('ruling-owed(P)');
    expect(block).toContain('done(P)');
    // The fourth disjunct — without it a mis-cut plan blocks every turn forever.
    expect(block).toMatch(/sharded\(P\) ∧ ¬ done\(P\) ∧ frontier\(P\) = ∅/);
    // …and the elevation refuses when the gate is not attached.
    expect(block).toMatch(/¬ attached ⇒ ⊥/);
    // …and revert owes zero residue.
    expect(block).toContain('zero residue');
  });

  it('the bound condition is plan state — the cell claims no transcript read', () => {
    expect(carryOn.formalBlock).toContain('∄ read(transcript ∨ message)');
  });

  // ── The parity checks BITE ─────────────────────────────────────────────────────
  it('is non-vacuous — a drifted verb set or a forked layout is CONVICTED', () => {
    const verbs = runtimeVerbs();
    // Drift on the CELL side: `revert` renamed back to `release`.
    expect(
      cellVerbs('verb      ∈ { elevate · release · terminus · status }'),
    ).not.toEqual(verbs);
    // Drift on the RUNTIME side: the union grows a verb the cell never names.
    expect(
      unionVerbs(
        "export type CarryOnVerb = 'elevate' | 'revert' | 'terminus' | 'status' | 'renew';",
      ),
    ).not.toEqual(cellVerbs(carryOn.formalBlock));
    // A source carrying NO union FAILS loudly rather than passing empty.
    expect(() => unionVerbs('export type Something = never;')).toThrow(
      /no `CarryOnVerb` union/,
    );
    // A FORKED layout — the state names hand-copied and since drifted — is caught by
    // the same reader the live leg uses.
    const forked =
      'layout    ≜ --plan-root <plans/> --states pending,ready,done --completed done ' +
      '--frontier ready --bound-marker .bound --ruling-owed-marker .ruling-owed';
    expect(layoutFlags(forked).states).not.toBe(PLAN_STATES.join(','));
    // A cell with no layout line at all FAILS rather than reading `{}`.
    expect(() => layoutFlags('carry-on ≜ nothing')).toThrow(
      /projects no plan layout/,
    );
  });
});
