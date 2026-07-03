/**
 * E6.S6 — optimized artifacts project to EVERY target, rule-only harnesses
 * included (Operator ruling: optimization reaches ALL targets).
 *
 * Documented truth: the optimized cell/vector/rule-set rides the normal
 * compile path to all manifest targets; emitted SKILL.md stays spec-valid at
 * destination; agent bodies are per-target PROJECTIONS of the vector; rule-
 * only targets receive the optimized R=LLM rule bodies through their rules
 * surface; ZERO targets are excluded from optimization on the ground of
 * lacking skill/agent support; per-resource unsupport stays loud (E4.S2 /
 * E5.S7) but never excludes the target from the resources they do read.
 *
 * Fate split:
 * - zero-targets-excluded rides the CURRENT compile: every shipped adapter
 *   declares rules support and emits a rules artifact — GREEN;
 * - aider actually READING the emitted rules needs `read:` wiring, which the
 *   adapter does not emit (§3/aider [AI2] — no auto-discovery): TRACKED;
 * - the optimized-artifact projection itself needs the pipeline: TRACKED.
 */

import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, expect } from 'vitest';
import { aiderAdapter } from '../../../src/adapters/aider/index.js';
import type { IR } from '../../../src/core/index.js';
import { ALL_ADAPTERS, makeTmpDir, story } from '../helpers.js';
import { probeMessage, probePipeline } from './pipeline-probe.js';

const RULE_BODY =
  'commit ≜ conventional-commit(type, scope, subject≤100) · gate: build ∧ lint ∧ suite-green';

const rulesIR = (target: string): IR => ({
  manifest: { agentForge: 1, scope: 'project', targets: [target] },
  rules: [{ id: 'conventions', body: RULE_BODY }],
});

let cwd: string;
beforeEach(() => {
  cwd = makeTmpDir();
});
afterEach(() => {
  rmSync(cwd, { recursive: true, force: true });
});

story(
  'E6.S6',
  'zero targets excluded: every shipped adapter declares rules support and emits a rules artifact through its rules surface',
  async () => {
    expect(ALL_ADAPTERS).toHaveLength(10);
    for (const adapter of ALL_ADAPTERS) {
      // The coverage equation: no adapter is a rules-'none' island — even
      // skill-less / agent-less harnesses (aider, continue) read rules.
      expect(
        adapter.capabilities.resources.rules,
        `${adapter.id} must carry rules ≥ partial`,
      ).not.toBe('none');
      const dir = join(cwd, adapter.id);
      const report = await adapter.write(
        rulesIR(adapter.id),
        'project',
        dir,
        {},
      );
      expect(
        report.written.length,
        `${adapter.id} emitted no rules artifact for a rules-only IR`,
      ).toBeGreaterThan(0);
      expect(report.skipped).toEqual([]);
    }
  },
);

story.tracked(
  'E6.S6',
  'aider: emitted rules are wired for reading via .aider.conf.yml read: — aider has no auto-discovery [AI2]',
  async () => {
    const report = await aiderAdapter.write(
      rulesIR('aider'),
      'project',
      cwd,
      {},
    );
    // Documented: without `read:` wiring the emitted conventions file is
    // INERT for aider — the adapter must also write/update .aider.conf.yml.
    const conf = report.written.find((p) => /\.aider\.conf\.ya?ml$/.test(p));
    expect(
      conf,
      `no .aider.conf.yml among written (the rules file is unreachable for aider without read: wiring); written: ${report.written.join(', ')}`,
    ).toBeDefined();
    const text = readFileSync(conf as string, 'utf8');
    expect(text).toMatch(/read:/);
  },
);

story.tracked(
  'E6.S6',
  'the optimized cell, vector, and rule-set ride the normal compile to all targets; SKILL.md spec-valid at each destination, agent bodies per-target projections',
  async () => {
    const probe = await probePipeline();
    expect(probe.found, probeMessage(probe)).not.toEqual([]);
    // Documented, once the pipeline lands: compile the E6.S2 cell + E6.S3
    // vector + E6.S8 rules to every manifest target; each emitted SKILL.md
    // carries spec-valid frontmatter at destination; agent bodies derive
    // from the vector (never a parallel config-IR copy); the R=LLM register
    // survives — no adapter humanizes content.
  },
);
