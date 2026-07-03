/**
 * E4.S2 — lossy field drops are named, per loss.
 *
 * Target: opencode, which declares `skills: 'partial'` and does not honor
 * `allowed_tools` [OC6] — the write must warn naming {resource, field, target};
 * `strict` must promote the warning to a compile abort; and a compile with no
 * losses must report nothing loss-related.
 */

import { rmSync } from 'node:fs';
import { afterEach, describe, expect } from 'vitest';

import { compile } from '../../../src/core/index.js';
import type { IR } from '../../../src/core/index.js';
import { ALL_ADAPTERS, adapterById, makeTmpDir, story } from '../helpers.js';
import { FIXTURES, manifest } from './support.js';

const cleanups: string[] = [];
afterEach(() => {
  for (const dir of cleanups.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function tmp(): string {
  const dir = makeTmpDir('af-e4s2-');
  cleanups.push(dir);
  return dir;
}

const opencode = adapterById.get('opencode');
if (!opencode) throw new Error('opencode adapter missing');

const skillIR = (): IR => ({
  manifest: manifest('opencode'),
  ...FIXTURES.skills,
});

describe('E4.S2 · lossy drops named per loss', () => {
  story(
    'E4.S2',
    'WriteReport.warnings entry names resource id, field, and target',
    async () => {
      const report = await opencode.write(skillIR(), 'project', tmp(), {});
      const entry = report.warnings.find((w) => w.includes('allowed_tools'));
      expect(entry).toBeDefined();
      // Names the resource id…
      expect(entry).toContain('review');
      // …the dropped field…
      expect(entry).toContain('allowed_tools');
      // …and the target.
      expect(entry).toContain('opencode');
    },
  );

  story(
    'E4.S2',
    'dry-run --explain surfaces the same entry without writing',
    async () => {
      const cwd = tmp();
      const report = await opencode.write(skillIR(), 'project', cwd, {
        dryRun: true,
        explain: true,
      });
      expect(
        report.warnings.some(
          (w) => w.includes('allowed_tools') && w.includes('review'),
        ),
      ).toBe(true);
    },
  );

  story(
    'E4.S2',
    'strict compile aborts non-zero on the lossy warning',
    async () => {
      const report = await compile(skillIR(), [opencode], 'project', tmp(), {
        strict: true,
      });
      const result = report.results.find((r) => r.adapter === 'opencode');
      expect(result?.error).toBeDefined();
      expect(result?.error?.message).toContain('strict');
      // The abort is traceable to the same loss entry.
      expect(
        result?.report?.warnings.some((w) => w.includes('allowed_tools')),
      ).toBe(true);
    },
  );

  story(
    'E4.S2',
    'zero-loss compile reports nothing loss-related on any target (no noise floor)',
    async () => {
      const ir: IR = {
        manifest: {
          agentForge: 1,
          scope: 'project',
          targets: ALL_ADAPTERS.map((a) => a.id),
        },
        ...FIXTURES.rules,
      };
      const report = await compile(ir, ALL_ADAPTERS, 'project', tmp(), {});
      expect(report.totalWarnings).toBe(0);
      expect(report.totalSkipped).toBe(0);
    },
  );
});
