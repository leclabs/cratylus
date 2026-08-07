// EVENT-TAP CELL gate — the agent-facing surface of the `eventTap` runtime capability.
//
// WHY THIS FILE EXISTS. The capability was built and tested end-to-end
// (`runtime/src/capabilities/event-tap/`) but had NO skill cell, so it was
// reachable ONLY by an operator typing `cratylus tap …` at a shell — inverting the
// point of the effort chain (a passive tap an AGENT can turn on to observe itself). The
// shard that would have added the cell was recorded ABSORBED into a memory-only shard
// that never touched event-tap, so the work vanished silently and no gate noticed: every
// skill gate quantifies over the cells that EXIST, so a missing cell is invisible to all
// of them. This file is the gate that would have caught it.
//
// TWO LEGS:
//   • PROJECTION — projecting the canon emits the cell's SKILL.md AND its thin shim at
//     `skills/event-tap/scripts/eventTap.mjs`. Asserted on the PROJECTED ARTIFACT, not
//     the source: the source declaring `runtime:` is not evidence the shim landed.
//   • VERB PARITY — the verbs the cell names EQUAL the `EventTapVerb` union the runtime
//     exports. Read from the runtime SOURCE as text: canon does not depend on
//     runtime (the DAG is canon → forge), so a textual read is what keeps the two
//     from drifting without inventing a package edge to carry a test.

import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { adapterByName } from '@cratylus/forge/adapters/registry';
import { projectPluginSet, writeRenderTree } from '@cratylus/forge/project';
import { CLI_BIN } from '@cratylus/runtime/bin-name';
import { beforeAll, describe, expect, it } from 'vitest';
import canonPlugin from '../src/index.js';
import { eventTap } from '../src/skills/event-tap/skill.js';

const canonRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

/** The runtime module that OWNS the verb union — the drift counterpart. */
const DISPATCH_SRC = join(
  canonRoot,
  '..',
  'runtime',
  'src',
  'capabilities',
  'event-tap',
  'dispatch.ts',
);

/** The `EventTapVerb` union's members, parsed from the runtime source text. */
function unionVerbs(src: string): string[] {
  const m = src.match(/export type EventTapVerb =([^;]+);/);
  if (m?.[1] === undefined) {
    throw new Error(
      'event-tap: no `EventTapVerb` union found in the runtime source',
    );
  }
  return [...m[1].matchAll(/'([a-z]+)'/g)].map((g) => g[1] as string).sort();
}

/** The verbs the runtime owns, read from its live source. */
const runtimeVerbs = (): string[] =>
  unionVerbs(readFileSync(DISPATCH_SRC, 'utf-8'));

/** The verb set a cell's formal block enumerates (`verb ∈ { a · b · … }`). */
function cellVerbs(formalBlock: string): string[] {
  const m = formalBlock.match(/^verb\s+∈ \{([^}]+)\}/m);
  if (m?.[1] === undefined) {
    throw new Error('event-tap: the cell declares no verb set');
  }
  return m[1]
    .split('·')
    .map((s) => s.trim())
    .sort();
}

let out = '';

beforeAll(async () => {
  out = mkdtempSync(join(tmpdir(), 'event-tap-cell-'));
  // V7: the projector RETURNS the tree; the caller is the one writer.
  const report = await projectPluginSet({
    plugins: [canonPlugin],
    adapter: adapterByName('claude'),
  });
  writeRenderTree(out, report.files);
}, 120_000);

describe('event-tap cell — the capability has an agent-facing surface', () => {
  it('the cell exists, is named for its directory, and declares the eventTap capability', () => {
    expect(eventTap.name).toBe('event-tap');
    expect(eventTap.runtime?.capability).toBe('eventTap');
  });

  it('projection emits the thin shim at skills/event-tap/scripts/eventTap.mjs', () => {
    const shim = join(out, 'skills', 'event-tap', 'scripts', 'eventTap.mjs');
    expect(existsSync(shim)).toBe(true);
    const src = readFileSync(shim, 'utf-8');
    // The shim spawns the CAPABILITY word — the word the runtime bin must route.
    expect(src).toMatch(new RegExp(`spawnSync\\('${CLI_BIN}', \\['eventTap',`));
    expect(src).toContain('...process.argv.slice(2)');
    // THIN — no bundled impl, no cross-package import.
    expect(src).not.toContain('@cratylus/');
  });

  it('the projected SKILL.md body names all four verbs', () => {
    const md = readFileSync(
      join(out, 'skills', 'event-tap', 'SKILL.md'),
      'utf-8',
    );
    for (const verb of runtimeVerbs()) {
      expect(md, `SKILL.md must name the '${verb}' verb`).toContain(verb);
    }
  });

  // ── VERB PARITY — the cell and the runtime cannot drift ──────────────────────────
  it('the verbs the cell names EQUAL the runtime EventTapVerb union', () => {
    const verbs = runtimeVerbs();
    // Non-vacuous: the union really was parsed, and it is the known four.
    expect(verbs).toEqual(['install', 'read', 'status', 'uninstall']);
    expect(cellVerbs(eventTap.formalBlock)).toEqual(verbs);
    // …and every verb carries an invocation line naming the shim.
    for (const verb of verbs) {
      expect(
        eventTap.formalBlock,
        `verb '${verb}' needs an invocation line`,
      ).toContain(`scripts/eventTap.mjs ${verb}`);
    }
  });

  // ── The parity check BITES — otherwise it is green whether or not they agree ─────
  it('is non-vacuous — a drifted verb set is CONVICTED on either side', () => {
    const verbs = runtimeVerbs();
    // Drift on the CELL side: a cell that renamed `uninstall` to `detach`.
    const driftedCell = 'verb         ∈ { install · detach · read · status }';
    expect(cellVerbs(driftedCell)).not.toEqual(verbs);
    // Drift on the RUNTIME side: the union grows a verb the cell never names.
    const driftedUnion =
      "export type EventTapVerb = 'install' | 'uninstall' | 'read' | 'status' | 'flush';";
    expect(unionVerbs(driftedUnion)).not.toEqual(
      cellVerbs(eventTap.formalBlock),
    );
    // And a source that carries NO union FAILS loudly rather than passing empty.
    expect(() => unionVerbs('export type Something = never;')).toThrow(
      /no `EventTapVerb` union/,
    );
  });
});
