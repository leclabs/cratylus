/**
 * E3.S5 · foreign content in shared files survives reimport + recompile.
 * Contract: plans/interop-hardening/stories/E3-reimport.md.
 * Fixes RETURN §3 cross-cutting "Write is destructive": every adapter
 * overwrites the target rules/settings file wholesale.
 */

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect } from 'vitest';

import { runCompile } from '../../../src/cli/commands/compile.js';
import { runImport } from '../../../src/cli/commands/import.js';
import { ALL_ADAPTERS, makeTmpDir, story } from '../helpers.js';
import { captureConsole } from './lib.js';

const HAND_SECTION = '# Hand section H\n\nHand-maintained; not forge-managed.';
const STATUS_LINE = { type: 'command', command: 'my-statusline.sh' };

describe('E3.S5 · foreign content survives reimport + recompile', () => {
  let cwd: string;

  beforeEach(async () => {
    cwd = makeTmpDir();
    writeFileSync(
      join(cwd, 'CLAUDE.md'),
      `${HAND_SECTION}\n\n# Forge section\n\nManaged body.\n`,
      'utf8',
    );
    mkdirSync(join(cwd, '.claude'), { recursive: true });
    writeFileSync(
      join(cwd, '.claude', 'settings.json'),
      JSON.stringify(
        { statusLine: STATUS_LINE, permissions: { allow: ['Read(*)'] } },
        null,
        2,
      ),
      'utf8',
    );

    const imported = await captureConsole(() =>
      runImport({ client: 'claude', scope: 'project', cwd }, ALL_ADAPTERS),
    );
    expect(imported.result).toBe(0);
    const compiled = await captureConsole(() =>
      runCompile({ scope: 'project', cwd }, ALL_ADAPTERS),
    );
    expect(compiled.result).toBe(0);
  });
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  story(
    'E3.S5',
    'hand section H is present byte-identical in CLAUDE.md after import + compile',
    () => {
      const content = readFileSync(join(cwd, 'CLAUDE.md'), 'utf8');
      expect(content).toContain(HAND_SECTION);
    },
  );

  story(
    'E3.S5',
    'forge-managed permissions survive the cycle in settings.json',
    () => {
      const settings = JSON.parse(
        readFileSync(join(cwd, '.claude', 'settings.json'), 'utf8'),
      );
      expect(settings.permissions).toEqual({ allow: ['Read(*)'] });
    },
  );

  story(
    'E3.S5',
    'foreign settings key statusLine is present byte-identical after import + compile',
    () => {
      // §3 cross-cutting "Write is destructive": the claude adapter rewrites
      // settings.json wholesale from the IR; foreign keys are dropped.
      const settings = JSON.parse(
        readFileSync(join(cwd, '.claude', 'settings.json'), 'utf8'),
      );
      expect(settings.statusLine).toEqual(STATUS_LINE);
    },
  );

  story.tracked(
    'E3.S5',
    'forge-managed regions in CLAUDE.md are delimited by documented markers',
    () => {
      // Tracked reason: markers undocumented/unimplemented — no managed-region
      // marker convention is documented anywhere, and none is emitted. This
      // placeholder falsifier asserts marker-shaped delimitation exists at all;
      // when a marker convention is documented, pin its exact strings here.
      const content = readFileSync(join(cwd, 'CLAUDE.md'), 'utf8');
      const markerLines = content
        .split('\n')
        .filter((line) => /<!--.*agent-forge.*-->/i.test(line));
      expect(markerLines.length).toBeGreaterThanOrEqual(2);
    },
  );
});
