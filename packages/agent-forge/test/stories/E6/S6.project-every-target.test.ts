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
 * - the optimized-artifact projection: GRADUATED — the pipeline ships in
 *   `src/core/exemplify/` (cell renderer + `projectVector`), and the
 *   optimized set rides the normal per-adapter write below.
 */

import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, expect } from 'vitest';
import { aiderAdapter } from '../../../src/adapters/aider/index.js';
import type { Agent as OrganVector } from '../../../src/anatomy/index.js';
import {
  type IR,
  projectVector,
  renderSkillCellBody,
} from '../../../src/core/index.js';
import { ALL_ADAPTERS, makeTmpDir, story } from '../helpers.js';
import { probeMessage, probePipeline } from './pipeline-probe.js';

/** All 24 organ fields explicitly harness-inherited (`null`). */
const NULL_ORGANS: Omit<OrganVector, 'name'> = {
  autonomy: null,
  persona: null,
  role: null,
  formality: null,
  audienceAdaptation: null,
  transparency: null,
  provenance: null,
  objective: null,
  guardrails: null,
  engineeringPrinciples: null,
  heuristics: null,
  capabilities: null,
  learning: null,
  situationAwareness: null,
  actions: null,
  modalities: null,
  model: null,
  memory: null,
  trigger: null,
  framing: null,
  reasoningStrategy: null,
  satisficing: null,
  outputFormat: null,
  selfEvaluation: null,
};

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
    // standards joins the roster as a genuine rules-writing compile target
    // (root+nested AGENTS.md), not merely an importer — it belongs in this
    // count (E7.S9/standards-surfaces: the same array backs the E7.S9 roster
    // probe, so it cannot be excluded from this generic loop either).
    expect(ALL_ADAPTERS).toHaveLength(16);
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

story(
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

story(
  'E6.S6',
  'the optimized cell, vector, and rule-set ride the normal compile to all targets; SKILL.md spec-valid at each destination, agent bodies per-target projections',
  async () => {
    const probe = await probePipeline();
    expect(probe.found, probeMessage(probe)).not.toEqual([]);
    // The optimized artifact set: the E6.S2 cell body, the E6.S3 vector
    // PROJECTED (the vector is the source — projectVector, never a parallel
    // config-IR copy), and an E6.S8-style optimized rule body.
    const cellBody = renderSkillCellBody({
      name: 'release',
      description: 'release the package — ordered gate to published tag',
      verb: 'release',
      declarations: [
        { symbol: 'green', definiens: 'the whole test suite passes' },
        { symbol: 'tag', definiens: 'git tag at the release commit' },
      ],
      laws: ['¬green ⇒ ¬tag'],
    });
    const vector: OrganVector = {
      ...NULL_ORGANS,
      name: 'reviewer',
      persona: {
        organ: 'persona',
        slug: 'migration-reviewer',
        definiens: 'a meticulous migration reviewer',
      },
    };
    const projected = projectVector(vector);
    expect(projected.body).toContain('persona ≜ migration-reviewer');
    const carriersOfAgentBody: string[] = [];
    for (const adapter of ALL_ADAPTERS) {
      const dir = join(cwd, `opt-${adapter.id}`);
      const ir: IR = {
        manifest: {
          agentForge: 1,
          scope: 'project',
          targets: [adapter.id],
        },
        rules: [{ id: 'conventions', body: RULE_BODY }],
        skills: [
          {
            name: 'release',
            description: 'release the package — ordered gate to published tag',
            body: cellBody,
          },
        ],
        agents: [projected],
      };
      const report = await adapter.write(ir, 'project', dir, {});
      // Zero targets excluded from optimization — every adapter still emits
      // (rule-only harnesses through their rules surface).
      expect(
        report.written.length,
        `${adapter.id} excluded from the optimized compile`,
      ).toBeGreaterThan(0);
      // Every emitted SKILL.md stays spec-valid at destination.
      for (const p of report.written.filter((w) => w.endsWith('SKILL.md'))) {
        const md = readFileSync(p, 'utf8');
        expect(md).toMatch(/^---\n(?:.*\n)*?name: [a-z0-9-]+\n/);
        expect(md).toMatch(/\ndescription: .+\n/);
        // The R=LLM register survives — no adapter humanizes the cell.
        expect(md).toContain('¬green ⇒ ¬tag');
      }
      // The optimized rule body survives byte-verbatim on some surface.
      const ruleCarrier = report.written.find((p) => {
        try {
          return readFileSync(p, 'utf8').includes(RULE_BODY);
        } catch {
          return false;
        }
      });
      expect(
        ruleCarrier,
        `${adapter.id}: optimized rule body not carried byte-verbatim`,
      ).toBeDefined();
      // Agent bodies at destination are per-target projections of the vector.
      const agentCarrier = report.written.find((p) => {
        try {
          return readFileSync(p, 'utf8').includes(
            'persona ≜ migration-reviewer',
          );
        } catch {
          return false;
        }
      });
      if (agentCarrier) carriersOfAgentBody.push(adapter.id);
    }
    // The projection reaches the agent-bearing targets (claude pinned).
    expect(carriersOfAgentBody).toContain('claude');
  },
);
