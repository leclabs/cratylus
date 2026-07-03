/**
 * E5.S7 — no-native + no-plugin ⇒ loud skip, never fabrication.
 *
 * Documented truth: an IR agent compiled to crush (no custom agents, no
 * plugin API — open FR [CR4]) yields NO agent artifact; a `.skipped` entry
 * carries {resource, target: crush, reason}; `--strict` promotes the skip
 * from warning-class to an error (the configurability).
 *
 * Fate split:
 * - no artifact + skipped entry + strict promotion: GREEN today;
 * - the reason CITING no-native-no-plugin: TRACKED — the current reason is
 *   the uninformative literal 'unsupported'.
 */

import { existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, expect } from 'vitest';
import { crushAdapter } from '../../../src/adapters/crush/index.js';
import { type IR, compile } from '../../../src/core/index.js';
import { makeTmpDir, story } from '../helpers.js';

const irWithAgent: IR = {
  manifest: { agentForge: 1, scope: 'project', targets: ['crush'] },
  agents: [
    {
      name: 'scout',
      description: 'a subagent crush cannot host',
      body: 'You are scout.',
    },
  ],
};

let cwd: string;
beforeEach(() => {
  cwd = makeTmpDir();
});
afterEach(() => {
  rmSync(cwd, { recursive: true, force: true });
});

story(
  'E5.S7',
  'crush emits no agent artifact; the skip is loud with {resource, target, reason}',
  async () => {
    const report = await compile(irWithAgent, [crushAdapter], 'project', cwd);
    const result = report.results.find((r) => r.adapter === 'crush');
    expect(result).toBeDefined();
    // Target attribution: the CompileReport row names crush.
    expect(result?.adapter).toBe('crush');
    // No agent artifact — neither reported as written…
    expect(result?.report?.written ?? []).toEqual([]);
    // …nor fabricated on disk (nothing at all was written for this IR).
    expect(existsSync(join(cwd, '.crush'))).toBe(false);
    expect(readdirSync(cwd)).toEqual([]);
    // The skipped entry names the resource and carries a reason.
    const entry = result?.report?.skipped.find((s) =>
      s.path.includes('agents/scout'),
    );
    expect(
      entry,
      `no skipped entry for agents/scout; skipped: ${JSON.stringify(result?.report?.skipped)}`,
    ).toBeDefined();
    expect((entry?.reason ?? '').length).toBeGreaterThan(0);
    // And the warning channel is loud about the resource class.
    expect(result?.report?.warnings.some((w) => /agents/i.test(w))).toBe(true);
  },
);

story(
  'E5.S7',
  'the skip is warning-class and configurable: --strict promotes the crush agent skip to an error',
  async () => {
    const lax = await compile(irWithAgent, [crushAdapter], 'project', cwd);
    expect(
      lax.results.find((r) => r.adapter === 'crush')?.error,
    ).toBeUndefined();
    expect(lax.totalSkipped).toBeGreaterThan(0);

    const strict = await compile(irWithAgent, [crushAdapter], 'project', cwd, {
      strict: true,
    });
    const result = strict.results.find((r) => r.adapter === 'crush');
    expect(result?.error).toBeDefined();
    expect(result?.error?.message).toMatch(/skipped/);
  },
);

story(
  'E5.S7',
  'the skipped reason cites no-native-no-plugin, not a bare unsupported',
  async () => {
    const report = await crushAdapter.write(irWithAgent, 'project', cwd, {});
    const entry = report.skipped.find((s) => s.path.includes('agents/scout'));
    expect(entry).toBeDefined();
    // Documented: the reason names BOTH missing surfaces (no native agent
    // dialect AND no plugin API [CR4]) so the refusal is self-explaining.
    expect(
      entry?.reason,
      `reason must cite the no-native-no-plugin ground; got: '${entry?.reason}'`,
    ).toMatch(/native/i);
    expect(entry?.reason).toMatch(/plugin/i);
  },
);
