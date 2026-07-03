/**
 * E3.S6 · corrupt or version-skewed own-format refuses loudly.
 * Contract: test/stories/E3-reimport.md.
 */

import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect } from 'vitest';

import { runLint } from '../../../src/cli/commands/lint.js';
import { readIR, writeIR } from '../../../src/core/index.js';
import { ALL_ADAPTERS, makeTmpDir, story } from '../helpers.js';
import { captureConsole } from './lib.js';

describe('E3.S6 · corrupt or version-skewed own-format refuses loudly', () => {
  let cwd: string;

  beforeEach(async () => {
    cwd = makeTmpDir();
    await writeIR(
      {
        manifest: { agentForge: 1, scope: 'project', targets: ['claude'] },
        rules: [{ id: 'main', body: 'Valid rule.' }],
      },
      'project',
      cwd,
    );
  });
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  function corruptSkill(): void {
    // A SKILL.md whose frontmatter violates the skill schema (no description).
    const dir = join(cwd, '.agent-forge', 'skills', 'bad');
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, 'SKILL.md'),
      '---\nname: bad\n---\nNo description.',
      'utf8',
    );
  }

  function skewVersion(): void {
    writeFileSync(
      join(cwd, '.agent-forge', 'manifest.yaml'),
      'agentForge: 2\nscope: project\ntargets: []\n',
      'utf8',
    );
  }

  story(
    'E3.S6',
    'corrupt resource file: lint exits non-zero naming the violation; readIR refuses',
    async () => {
      corruptSkill();
      const lint = await captureConsole(() =>
        runLint({ scope: 'project', cwd }, ALL_ADAPTERS),
      );
      expect(lint.result).not.toBe(0);
      expect(lint.output).toContain('bad');
      expect(lint.output).toContain('description');

      await expect(readIR('project', cwd)).rejects.toThrow(/description/);
    },
  );

  story(
    'E3.S6',
    'corrupt resource file: the refusal names the offending file path',
    async () => {
      corruptSkill();
      const lint = await captureConsole(() =>
        runLint({ scope: 'project', cwd }, ALL_ADAPTERS),
      );
      expect(lint.result).not.toBe(0);
      expect(lint.output).toContain(join('skills', 'bad', 'SKILL.md'));
    },
  );

  story(
    'E3.S6',
    'unknown agentForge version: read refuses — no partial IR is returned',
    async () => {
      skewVersion();
      await expect(readIR('project', cwd)).rejects.toThrow(/agentForge/);
      const lint = await captureConsole(() =>
        runLint({ scope: 'project', cwd }, ALL_ADAPTERS),
      );
      expect(lint.result).not.toBe(0);
    },
  );

  story(
    'E3.S6',
    'version-skew refusal names found vs supported version and points at agent-forge migrate',
    async () => {
      skewVersion();
      let message = '';
      try {
        await readIR('project', cwd);
      } catch (e) {
        message = (e as Error).message;
      }
      expect(message).not.toBe('');
      expect(message).toMatch(/\b2\b/); // found version
      expect(message).toMatch(/\b1\b/); // supported version
      expect(message).toContain('migrate');
    },
  );
});
