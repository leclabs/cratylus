/**
 * E3.S4 · drift detection on emitted files.
 * Contract: plans/interop-hardening/stories/E3-reimport.md.
 */

import { appendFileSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect } from 'vitest';

import { runCompile } from '../../../src/cli/commands/compile.js';
import { runDiff } from '../../../src/cli/commands/diff.js';
import { type IR, writeIR } from '../../../src/core/index.js';
import { ALL_ADAPTERS, makeTmpDir, story } from '../helpers.js';
import { captureConsole } from './lib.js';

const AGENT_FILE = join('.claude', 'agents', 'one.md');

const driftIR = (driftCheck?: 'warn' | 'error'): IR => ({
  manifest: {
    agentForge: 1,
    scope: 'project',
    targets: ['claude'],
    ...(driftCheck && { options: { drift_check: driftCheck } }),
  },
  rules: [{ id: 'main', body: 'Drift fixture rule.' }],
  agents: [{ name: 'one', body: 'You are one.', description: 'Agent one' }],
});

describe('E3.S4 · drift detection on emitted files', () => {
  let cwd: string;

  beforeEach(() => {
    cwd = makeTmpDir();
  });
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  async function compileClaude(driftCheck?: 'warn' | 'error'): Promise<void> {
    await writeIR(driftIR(driftCheck), 'project', cwd);
    const { result } = await captureConsole(() =>
      runCompile({ scope: 'project', cwd }, ALL_ADAPTERS),
    );
    expect(result).toBe(0);
  }

  story(
    'E3.S4',
    'diff claude names the drifted file path; exit code distinguishes drift (3) from clean (0)',
    async () => {
      await compileClaude();

      const clean = await captureConsole(() =>
        runDiff({ clients: ['claude'], scope: 'project', cwd }, ALL_ADAPTERS),
      );
      expect(clean.result).toBe(0);

      const pristine = readFileSync(join(cwd, AGENT_FILE), 'utf8');
      appendFileSync(join(cwd, AGENT_FILE), '\nHAND EDIT\n');
      const drifted = await captureConsole(() =>
        runDiff({ clients: ['claude'], scope: 'project', cwd }, ALL_ADAPTERS),
      );
      expect(drifted.result).toBe(3);
      expect(drifted.output).toContain(AGENT_FILE);
      expect(drifted.output).toContain('modified');

      // Restoring the emitted bytes returns the clean exit code.
      writeFileSync(join(cwd, AGENT_FILE), pristine, 'utf8');
      const restored = await captureConsole(() =>
        runDiff({ clients: ['claude'], scope: 'project', cwd }, ALL_ADAPTERS),
      );
      expect(restored.result).toBe(0);
    },
  );

  story.tracked(
    'E3.S4',
    'the drift report names the resource id, not just the file path',
    async () => {
      await compileClaude();
      appendFileSync(join(cwd, AGENT_FILE), '\nHAND EDIT\n');
      const drifted = await captureConsole(() =>
        runDiff({ clients: ['claude'], scope: 'project', cwd }, ALL_ADAPTERS),
      );
      // Strip path mentions; the resource id must be named independently.
      const withoutPaths = drifted.output.split(AGENT_FILE).join('');
      expect(withoutPaths).toMatch(/\bone\b/);
    },
  );

  story.tracked(
    'E3.S4',
    "manifest options.drift_check: 'error' makes compile refuse, naming the drifted file",
    async () => {
      await compileClaude('error');
      appendFileSync(join(cwd, AGENT_FILE), '\nHAND EDIT\n');
      const second = await captureConsole(() =>
        runCompile({ scope: 'project', cwd }, ALL_ADAPTERS),
      );
      expect(second.result).not.toBe(0);
      expect(second.output).toContain(AGENT_FILE);
    },
  );

  story.tracked(
    'E3.S4',
    "manifest options.drift_check: 'warn' proceeds but emits a drift warning",
    async () => {
      await compileClaude('warn');
      appendFileSync(join(cwd, AGENT_FILE), '\nHAND EDIT\n');
      const second = await captureConsole(() =>
        runCompile({ scope: 'project', cwd }, ALL_ADAPTERS),
      );
      expect(second.result).toBe(0);
      expect(second.output).toMatch(/drift/i);
    },
  );
});
