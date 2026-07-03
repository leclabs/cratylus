/**
 * E3.S3 · --merge preserves hand-authored IR.
 * Contract: test/stories/E3-reimport.md.
 */

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect } from 'vitest';

import { runImport } from '../../../src/cli/commands/import.js';
import { type IR, readIR, writeIR } from '../../../src/core/index.js';
import { ALL_ADAPTERS, makeTmpDir, story } from '../helpers.js';
import { captureConsole } from './lib.js';

const HAND_MADE_BODY = '# Hand-made\n\nNever compiled to claude.';

const irWithHandMadeSkill = (): IR => ({
  manifest: { agentForge: 1, scope: 'project', targets: ['claude'] },
  skills: [
    {
      name: 'hand-made',
      description: 'Hand-authored skill',
      body: HAND_MADE_BODY,
    },
  ],
});

/** A .claude/ fixture containing a different skill than the IR knows. */
function buildClaudeFixture(cwd: string): void {
  const dir = join(cwd, '.claude', 'skills', 'claude-skill');
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, 'SKILL.md'),
    '---\nname: claude-skill\ndescription: From the harness\n---\nHarness-side steps.',
    'utf8',
  );
}

describe('E3.S3 · --merge preserves hand-authored IR', () => {
  let cwd: string;

  beforeEach(async () => {
    cwd = makeTmpDir();
    await writeIR(irWithHandMadeSkill(), 'project', cwd);
    buildClaudeFixture(cwd);
  });
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  story(
    'E3.S3',
    'import claude --merge exits 0, hand-made survives byte-identical, the claude skill is added',
    async () => {
      const handMadePath = join(
        cwd,
        '.agent-forge',
        'skills',
        'hand-made',
        'SKILL.md',
      );
      const bytesBefore = readFileSync(handMadePath);

      const { result } = await captureConsole(() =>
        runImport(
          { client: 'claude', scope: 'project', cwd, merge: true },
          ALL_ADAPTERS,
        ),
      );
      expect(result).toBe(0);

      expect(readFileSync(handMadePath).equals(bytesBefore)).toBe(true);

      const ir = await readIR('project', cwd);
      const names = ir.skills?.map((s) => s.name).sort();
      expect(names).toEqual(['claude-skill', 'hand-made']);
      expect(ir.skills?.find((s) => s.name === 'hand-made')?.body).toBe(
        HAND_MADE_BODY,
      );
    },
  );

  story(
    'E3.S3',
    'the report says which mode ran: merge vs replace',
    async () => {
      const merged = await captureConsole(() =>
        runImport(
          { client: 'claude', scope: 'project', cwd, merge: true },
          ALL_ADAPTERS,
        ),
      );
      expect(merged.result).toBe(0);
      expect(merged.output).toContain('merged');
      expect(merged.output).not.toContain('imported');

      // Sibling assertion: without --merge the replace path runs (and says so).
      const replaced = await captureConsole(() =>
        runImport({ client: 'claude', scope: 'project', cwd }, ALL_ADAPTERS),
      );
      expect(replaced.result).toBe(0);
      expect(replaced.output).toContain('imported');
      expect(replaced.output).not.toContain('merged');
      const ir = await readIR('project', cwd);
      // Replace mode: the imported IR no longer CARRIES hand-made (the collection
      // is claude's view; leftover files on disk are a separate concern).
      expect(ir.skills?.some((s) => s.name === 'claude-skill')).toBe(true);
    },
  );
});
