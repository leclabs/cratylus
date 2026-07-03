/**
 * E2.S5 · local-scope compile uses each harness's local tier or refuses loudly.
 * Contract: test/stories/E2-ir-emission.md.
 * Claude's documented local tier: CLAUDE.local.md (rules) + .claude/settings.local.json
 * (settings) [CC1][CC8]. No other shipped target documents a local tier.
 */

import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect } from 'vitest';

import type { CompileReport, IR } from '../../../src/core/index.js';
import { compile, writeIR } from '../../../src/core/index.js';
import { ALL_ADAPTERS, makeTmpDir, story } from '../helpers.js';

const ALL_IDS = ALL_ADAPTERS.map((a) => a.id);
const RULE_BODY = 'Local-only rule body.';

const localIR = (): IR => ({
  manifest: { agentForge: 1, scope: 'local', targets: ALL_IDS },
  rules: [{ id: 'local-rule', body: RULE_BODY }],
  env: { LOCAL_FLAG: 'on' },
});

describe('E2.S5 · local-scope compile uses the local tier or refuses loudly', () => {
  let cwd: string;
  let report: CompileReport;

  beforeEach(async () => {
    const ir = localIR();
    cwd = makeTmpDir();
    await writeIR(ir, 'local', cwd);
    report = await compile(ir, [...ALL_ADAPTERS], 'local', cwd, {});
  });
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  story(
    'E2.S5',
    'claude local settings land in .claude/settings.local.json [CC8]',
    () => {
      const path = join(cwd, '.claude', 'settings.local.json');
      expect(existsSync(path)).toBe(true);
      const settings = JSON.parse(readFileSync(path, 'utf8'));
      expect(settings.env).toEqual({ LOCAL_FLAG: 'on' });
    },
  );

  story(
    'E2.S5',
    'claude local rules land in CLAUDE.local.md; the "local has no rules" warning is gone [CC1]',
    () => {
      // §3 claude #5: CLAUDE.local.md (the actual local rules surface) is
      // unmodeled — the adapter warns "scope 'local' does not support rules".
      const path = join(cwd, 'CLAUDE.local.md');
      expect(existsSync(path)).toBe(true);
      expect(readFileSync(path, 'utf8')).toContain(RULE_BODY);
      const claude = report.results.find((r) => r.adapter === 'claude');
      expect(
        claude?.report?.warnings.filter((w) => /local.*rules/i.test(w)),
      ).toEqual([]);
    },
  );

  story(
    'E2.S5',
    'targets without a documented local tier emit per-resource skipped entries with reason no-local-tier',
    () => {
      for (const r of report.results) {
        if (r.adapter === 'claude') continue; // claude HAS a local tier [CC1][CC8]
        const reasons = r.report?.skipped.map((s) => s.reason) ?? [];
        expect(
          reasons.some((reason) => reason === 'no-local-tier'),
          `${r.adapter}: expected a no-local-tier skip, got ${JSON.stringify(reasons)}`,
        ).toBe(true);
      }
    },
  );

  story(
    'E2.S5',
    'a target lacking a local tier never gets a fabricated file (emulation is not invented)',
    () => {
      // Today most adapters write a committed project AGENTS.md for local scope —
      // a fabricated local surface (there is no documented local tier for them).
      for (const r of report.results) {
        if (r.adapter === 'claude') continue;
        expect(
          r.report?.written ?? [],
          `${r.adapter} wrote files despite having no documented local tier`,
        ).toEqual([]);
      }
    },
  );

  story(
    'E2.S5',
    'the report carries an elicit entry (target · resource · resolution question) per no-local-tier skip',
    () => {
      const withElicit = report as CompileReport & {
        elicit?: { target: string; resource: string; question: string }[];
      };
      expect(Array.isArray(withElicit.elicit)).toBe(true);
      const targets = new Set((withElicit.elicit ?? []).map((e) => e.target));
      for (const r of report.results) {
        if (r.adapter === 'claude') continue;
        expect(targets.has(r.adapter), `no elicit entry for ${r.adapter}`).toBe(
          true,
        );
      }
    },
  );
});
