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
 * - the optimize flow + mechanical coverage equation: GRADUATED — the
 *   pipeline ships in `src/core/exemplify/`; the flow below runs
 *   import (adapter read) → optimize (accept gate + R3 manifest) → compile
 *   in one session, with `checkCoverage` proving routes ∪ delta = C_R.
 */

import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, expect } from 'vitest';
import { claudeAdapter } from '../../../src/adapters/claude/index.js';
import {
  type ConceptRecord,
  type IR,
  checkCoverage,
  compile,
  optimize,
  optimizeRules,
} from '../../../src/core/index.js';
import { makeTmpDir, story } from '../helpers.js';
import { probeMessage, probePipeline } from './pipeline-probe.js';

const RAW_RULE_BODY = `# Raw imported conventions

Please always run the formatter before committing, and keep commit subjects
short. We prefer small pull requests.`;

const RAW_SKILL_BODY = '# deploy\n\nHow we deploy, verbatim raw prose.\n';

const rawIR: IR = {
  manifest: { agentForge: 1, scope: 'project', targets: ['claude'] },
  // claude-surfaces (2026-07), disclosed: `concat: false` — a concat rule's
  // CLAUDE.md now imports @AGENTS.md uniformly [S7], so it no longer carries
  // a literal, verbatim-comparable body. This story's thesis (no forced
  // optimization; raw content survives byte-for-byte) is demonstrated
  // through the non-concat `.claude/rules/<id>.md` surface instead, which
  // still carries the body literally.
  rules: [{ id: 'main', body: RAW_RULE_BODY, concat: false }],
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
    // The rule body: byte-verbatim, no adapter-added newline (the non-concat
    // `.claude/rules/main.md` dialect — plain body, no forced frontmatter or
    // trailing newline; mirrors cline's identical convention).
    const ruleMd = join(cwd, '.claude', 'rules', 'main.md');
    expect(readFileSync(ruleMd, 'utf8')).toBe(RAW_RULE_BODY);
    // The skill body: verbatim inside the emitted SKILL.md.
    const skillMd = readFileSync(
      join(cwd, '.claude', 'skills', 'deploy', 'SKILL.md'),
      'utf8',
    );
    expect(skillMd).toContain(RAW_SKILL_BODY);
    // No optimization pass intervened: the human-register phrasing survives
    // untouched (nothing rewrote 'Please always run the formatter').
    expect(readFileSync(ruleMd, 'utf8')).toContain(
      'Please always run the formatter',
    );
  },
);

story(
  'E6.S7',
  'the documented import → optimize → compile flow exists end-to-end with the routes ∪ delta coverage equation checked mechanically',
  async () => {
    const probe = await probePipeline();
    expect(probe.found, probeMessage(probe)).not.toEqual([]);
    // IMPORT (E1.S1): lift the raw client config into the IR.
    writeFileSync(join(cwd, 'CLAUDE.md'), RAW_RULE_BODY, 'utf8');
    const imported = await claudeAdapter.read('project', cwd);
    const rawRule = (imported.rules ?? [])[0];
    expect(rawRule).toBeDefined();
    const rule = rawRule as NonNullable<typeof rawRule>;
    expect(rule.body).toContain('Please always run the formatter');
    // OPTIMIZE (E6.S1): gate the LLM-authored plan over the imported source.
    // The concepts are conceptualize's extraction from the raw import; one
    // is consciously delta'd — the equation must still cover it.
    const concepts: ConceptRecord[] = [
      {
        gloss: 'the formatter runs before every commit',
        anchor: 'format-pre-commit',
        home: 'CLAUDE.md',
        rank: 0,
      },
      {
        gloss: 'commit subjects stay short',
        anchor: 'short-subjects',
        home: 'CLAUDE.md',
        rank: 1,
      },
      {
        gloss: 'pull requests are kept small',
        delta: true,
      },
    ];
    const optimizedBody = [
      'format-pre-commit ≜ formatter gates every commit',
      'short-subjects ≜ commit subject minimal',
      '',
    ].join('\n');
    const { manifest } = optimize({
      source: join(cwd, 'CLAUDE.md'),
      concepts,
      artifacts: [{ path: 'CLAUDE.md', body: optimizedBody }],
      outDir: join(cwd, 'optimized'),
    });
    // The mechanical coverage equation: routes ∪ delta = C_R, digest-exact.
    const cov = checkCoverage(manifest, concepts);
    expect(cov.missing).toEqual([]);
    expect(cov.extra).toEqual([]);
    expect(manifest.routes.length + manifest.delta.length).toBe(
      concepts.length,
    );
    // COMPILE: the optimized body rides the normal path — same session.
    // claude-surfaces (2026-07), disclosed: `concat: false` override — a
    // concat rule's CLAUDE.md now imports @AGENTS.md uniformly [S7], so the
    // optimized body is asserted via the non-concat `.claude/rules/<id>.md`
    // surface instead (still literal, still same-session).
    const optimizedIR: IR = {
      manifest: { agentForge: 1, scope: 'project', targets: ['claude'] },
      rules: optimizeRules(imported.rules ?? [], {
        [rule.id]: readFileSync(join(cwd, 'optimized', 'CLAUDE.md'), 'utf8'),
      }).map((r) => ({ ...r, concat: false })),
    };
    const outDir = join(cwd, 'compiled');
    const report = await compile(
      optimizedIR,
      [claudeAdapter],
      'project',
      outDir,
    );
    expect(report.totalWritten).toBeGreaterThan(0);
    expect(
      readFileSync(join(outDir, '.claude', 'rules', `${rule.id}.md`), 'utf8'),
    ).toContain('format-pre-commit ≜ formatter gates every commit');
  },
);
