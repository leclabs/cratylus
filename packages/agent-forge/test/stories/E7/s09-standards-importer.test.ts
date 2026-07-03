/**
 * E7.S9 — standards-native import source.
 * Ground truth: a repo carrying only the neutral standards (root+nested
 * AGENTS.md [S1], .agents/skills/x [S3][S60]) lifts into IR via a DEDICATED
 * standards importer in the adapter roster — `src/adapters/standards/`,
 * canonical id `standards`.
 */

import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect } from 'vitest';
import { ALL_ADAPTERS, makeTmpDir, story } from '../helpers.js';

/** Candidate ids the standards importer could plausibly ship under. */
const CANDIDATE_IDS = [
  'agnostic',
  'standards',
  'agentsmd',
  'agents-md',
  'neutral',
];

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

/** Fixture: neutral-standards-only repo — no vendor dirs at all. */
function standardsFixture(): string {
  const dir = makeTmpDir();
  dirs.push(dir);
  writeFileSync(join(dir, 'AGENTS.md'), 'ROOT guidance.\n');
  mkdirSync(join(dir, 'packages', 'a'), { recursive: true });
  writeFileSync(
    join(dir, 'packages', 'a', 'AGENTS.md'),
    'SUBTREE guidance for packages/a.\n',
  );
  mkdirSync(join(dir, '.agents', 'skills', 'x'), { recursive: true });
  writeFileSync(
    join(dir, '.agents', 'skills', 'x', 'SKILL.md'),
    '---\nname: x\ndescription: does x\n---\n# x\n',
  );
  return dir;
}

describe('E7.S9 · standards-native importer', () => {
  story(
    'E7.S9',
    'a dedicated standards importer is in the adapter roster and lifts root+nested AGENTS.md + .agents/skills into IR [S1][S3][S60]',
    async () => {
      const fixture = standardsFixture();

      // Roster probe: the importer must be listed by `agent-forge adapters`
      // (the CLI lists exactly this roster).
      const importer = ALL_ADAPTERS.find((a) => CANDIDATE_IDS.includes(a.id));
      expect(
        importer,
        `no standards importer among [${ALL_ADAPTERS.map((a) => a.id).join(', ')}]`,
      ).toBeDefined();
      if (!importer) throw new Error('unreachable');

      // Compile-free read: the fixture lifts to rule resources (root +
      // nested, scoping recorded) and the skill.
      const ir = await importer.read('project', fixture);
      expect(ir.rules?.length).toBe(2);
      expect(ir.rules?.some((r) => r.body.includes('SUBTREE guidance'))).toBe(
        true,
      );
      expect(ir.skills?.map((s) => s.name)).toEqual(['x']);
    },
  );
});
