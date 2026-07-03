/**
 * E6.S7 — optimization is opt-in and lossless-by-the-ledger.
 *
 * Documented truth: a documented `import` → optimize → `compile` flow exists
 * end-to-end in one session, with the R3 manifest's `routes ∪ delta`
 * covering every concept conceptualize extracted (coverage equation checked
 * mechanically); AND the raw, un-optimized compile remains available
 * unchanged — optimization never becomes a forced pass.
 *
 * Fate split:
 * - raw-compile-unchanged: GREEN today — compile works with no optimization
 *   stage and preserves bodies byte-for-byte;
 * - the optimize flow + mechanical coverage equation: TRACKED via the
 *   pipeline entrypoint probe.
 */

import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, expect } from 'vitest';
import { claudeAdapter } from '../../../src/adapters/claude/index.js';
import { type IR, compile } from '../../../src/core/index.js';
import { makeTmpDir, story } from '../helpers.js';
import { probeMessage, probePipeline } from './pipeline-probe.js';

const RAW_RULE_BODY = `# Raw imported conventions

Please always run the formatter before committing, and keep commit subjects
short. We prefer small pull requests.`;

const RAW_SKILL_BODY = '# deploy\n\nHow we deploy, verbatim raw prose.\n';

const rawIR: IR = {
  manifest: { agentForge: 1, scope: 'project', targets: ['claude'] },
  rules: [{ id: 'main', body: RAW_RULE_BODY }],
  skills: [
    {
      name: 'deploy',
      description: 'raw imported deploy how-to',
      body: RAW_SKILL_BODY,
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
  'E6.S7',
  'raw, un-optimized compile remains available unchanged: bodies land byte-verbatim with no forced optimization pass',
  async () => {
    const report = await compile(rawIR, [claudeAdapter], 'project', cwd);
    expect(report.totalWritten).toBeGreaterThan(0);
    // The rule body: byte-verbatim (plus the adapter's trailing newline).
    expect(readFileSync(join(cwd, 'CLAUDE.md'), 'utf8')).toBe(
      `${RAW_RULE_BODY}\n`,
    );
    // The skill body: verbatim inside the emitted SKILL.md.
    const skillMd = readFileSync(
      join(cwd, '.claude', 'skills', 'deploy', 'SKILL.md'),
      'utf8',
    );
    expect(skillMd).toContain(RAW_SKILL_BODY);
    // No optimization pass intervened: the human-register phrasing survives
    // untouched (nothing rewrote 'Please always run the formatter').
    expect(readFileSync(join(cwd, 'CLAUDE.md'), 'utf8')).toContain(
      'Please always run the formatter',
    );
  },
);

story.tracked(
  'E6.S7',
  'the documented import → optimize → compile flow exists end-to-end with the routes ∪ delta coverage equation checked mechanically',
  async () => {
    const probe = await probePipeline();
    expect(probe.found, probeMessage(probe)).not.toEqual([]);
    // Documented, once the pipeline lands: one session runs E1.S1 import →
    // E6.S1 optimize → compile; the R3 manifest satisfies
    // routes ∪ delta = C_R (every concept conceptualize extracted from the
    // raw import appears exactly once — the mechanical coverage equation).
  },
);
