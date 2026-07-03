/**
 * E6.S8 — rules through exemplify: first-class, to every rule-bearing target
 * (Operator ruling: rules are a first-class resource through the pipeline).
 *
 * Documented truth: raw rule prose → exemplify → R=LLM rule bodies pass the
 * accept gate (conform: register = ρ = LLM) and compile into each dialect's
 * rules surface (AGENTS.md, CLAUDE.md-projection, GEMINI.md, aider
 * conventions + `read:` wiring, `.continue/rules/`); emitted bodies are the
 * optimized text VERBATIM (byte-check — no adapter re-humanizes); the set
 * {targets receiving optimized rules} = {targets with rules ≥ partial}
 * exactly; activation/placement metadata (E9.S2) survives optimization
 * untouched.
 *
 * Fate split:
 * - the byte-verbatim non-humanization law on today's rules path: GREEN —
 *   every adapter must carry an R=LLM-register body through unmodified;
 * - the rule-bearing target-set equation on today's compile: GREEN;
 * - the exemplify leg itself (accept gate, optimized bodies, scoping
 *   untouched): TRACKED via the pipeline entrypoint probe.
 */

import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, expect } from 'vitest';
import type { IR } from '../../../src/core/index.js';
import { ALL_ADAPTERS, makeTmpDir, story } from '../helpers.js';
import { probeMessage, probePipeline } from './pipeline-probe.js';

/** An R=LLM-register rule body (dense, symbol-carrying) — the register the
 * exemplify gate emits; any humanization/rewrite breaks byte-identity. */
const LLM_RULE_BODY = [
  'commit ≜ cc(type, scope, subject≤100) — gate: build ∧ lint ∧ green',
  'push-gate ≜ typecheck(tsc --noEmit) · main-bound boundary',
  'context-depth ≜ repo-invariants→root · package-load-bearing→package',
].join('\n');

const rulesIR = (target: string): IR => ({
  manifest: { agentForge: 1, scope: 'project', targets: [target] },
  rules: [{ id: 'conventions', body: LLM_RULE_BODY }],
});

let cwd: string;
beforeEach(() => {
  cwd = makeTmpDir();
});
afterEach(() => {
  rmSync(cwd, { recursive: true, force: true });
});

story(
  'E6.S8',
  'no adapter re-humanizes: an R=LLM-register rule body survives every rules surface byte-verbatim',
  async () => {
    for (const adapter of ALL_ADAPTERS) {
      const dir = join(cwd, adapter.id);
      const report = await adapter.write(
        rulesIR(adapter.id),
        'project',
        dir,
        {},
      );
      // At least one emitted artifact holds the body byte-for-byte —
      // symbols (≜ · ∧ · →) and density intact, nothing paraphrased.
      const carrier = report.written.find((p) => {
        try {
          return readFileSync(p, 'utf8').includes(LLM_RULE_BODY);
        } catch {
          return false;
        }
      });
      expect(
        carrier,
        `${adapter.id}: no written artifact carries the rule body byte-verbatim; written: ${report.written.join(', ')}`,
      ).toBeDefined();
    }
  },
);

story(
  'E6.S8',
  'the rule-bearing target set equation: adapters emitting a rules artifact = adapters declaring rules ≥ partial, exactly',
  async () => {
    const declared = ALL_ADAPTERS.filter(
      (a) => a.capabilities.resources.rules !== 'none',
    ).map((a) => a.id);
    const emitted: string[] = [];
    for (const adapter of ALL_ADAPTERS) {
      const dir = join(cwd, adapter.id);
      const report = await adapter.write(
        rulesIR(adapter.id),
        'project',
        dir,
        {},
      );
      if (report.written.length > 0) emitted.push(adapter.id);
    }
    // Exactly equal — a target declaring rules support but not emitting (or
    // vice versa) breaks the equation; rule-only harnesses (aider, continue)
    // are in BOTH sets, never excluded for lacking skills/agents.
    expect(emitted.sort()).toEqual(declared.sort());
    expect(emitted).toContain('aider');
    expect(emitted).toContain('continue');
  },
);

story.tracked(
  'E6.S8',
  'rules ride the exemplify pipeline: accept-gated (conform: register = LLM) optimized bodies reach every rule-bearing dialect with scoping metadata untouched',
  async () => {
    const probe = await probePipeline();
    expect(probe.found, probeMessage(probe)).not.toEqual([]);
    // Documented, once the pipeline lands: raw human rule prose (the E6.S1
    // fixture routed to Rule resources) is optimized, passes accept
    // (register = ρ = LLM), and the OPTIMIZED text compiles byte-verbatim
    // into each dialect surface (AGENTS.md, CLAUDE.md-projection, GEMINI.md,
    // aider conventions + read: wiring, .continue/rules/); activation/
    // placement metadata (E9.S2) is untouched — optimization rewrites
    // bodies, never scoping.
  },
);
