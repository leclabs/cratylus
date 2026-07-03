/**
 * E10.S9 · Pi code emission — hooks + agents as ONE generated pi package (the
 * F5 demonstration case). Ground truth: pi RETURN §3 capability map ([PI3]
 * [PI6][PI9]); fixtures shared with E5.S8. No pi adapter exists — tracked
 * probes; contract assertions execute post-graduation.
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect } from 'vitest';
import type { IR, Manifest } from '../../../src/core/index.js';
import { makeTmpDir, story } from '../helpers.js';
import { importAdapter } from './probe.js';

const manifest = (): Manifest => ({
  agentForge: 1,
  scope: 'project',
  targets: ['pi'],
});

const CODE_IR = (): IR => ({
  manifest: manifest(),
  agents: [{ name: 'scout', description: 'Explores', body: 'You explore.' }],
  hooks: [
    {
      id: 'guard',
      events: ['tool.use.pre'],
      matcher: 'bash',
      command: './guard.sh',
    },
    { id: 'audit', events: ['tool.use.post'], command: './audit.sh' },
  ],
});

function readExtensions(cwd: string): string {
  const dir = join(cwd, '.pi', 'extensions');
  if (!existsSync(dir)) return '';
  return readdirSync(dir)
    .filter((f) => f.endsWith('.ts'))
    .map((f) => readFileSync(join(dir, f), 'utf8'))
    .join('\n');
}

describe('E10.S9 · pi code-emission demonstration', () => {
  let cwd: string;

  beforeEach(() => {
    cwd = makeTmpDir('af-e10s9-');
  });
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  story.tracked(
    'E10.S9',
    'all code-shaped resources ship as ONE pi package; report carries the pi install line + full-system-access caution [PI6]',
    async () => {
      const pi = await importAdapter('pi');
      const report = await pi.write(CODE_IR(), 'project', cwd, {});
      const pkgFile = join(cwd, '.pi', 'package.json');
      expect(existsSync(pkgFile)).toBe(true);
      const pkg = JSON.parse(readFileSync(pkgFile, 'utf8')) as {
        keywords?: string[];
        pi?: { extensions?: string[] };
      };
      expect(pkg.keywords).toContain('pi-package');
      expect(pkg.pi?.extensions?.length).toBeGreaterThan(0);
      const blob = [...report.warnings].join('\n');
      expect(blob).toContain('pi install');
      expect(blob.toLowerCase()).toContain('full system access');
    },
  );

  story.tracked(
    'E10.S9',
    'hooks map onto pi.on() per the E5.S8 table; blocking = tool_call veto {block: true, reason}; result-mutating = tool_result [PI3]',
    async () => {
      const pi = await importAdapter('pi');
      await pi.write(CODE_IR(), 'project', cwd, {});
      const ext = readExtensions(cwd);
      expect(ext).toContain("'tool_call'");
      expect(ext).toContain('block: true');
      expect(ext).toContain("'tool_result'");
    },
  );

  story.tracked(
    'E10.S9',
    'agents: subagent-pattern emission (md defs + registerTool delegate) — the future Tool-resource serializer seed [PI9]',
    async () => {
      const pi = await importAdapter('pi');
      await pi.write(CODE_IR(), 'project', cwd, {});
      expect(existsSync(join(cwd, '.pi', 'agents', 'scout.md'))).toBe(true);
      expect(readExtensions(cwd)).toContain('registerTool');
    },
  );

  story.tracked(
    'E10.S9',
    'round-trip honesty: code emissions are write-only; reimport lifts config surfaces and reports foreign extension files under unlifted-surfaces — never parses TS as config [PI3]',
    async () => {
      const pi = await importAdapter('pi');
      // A pi fixture with a config surface AND a foreign extension file.
      const src = makeTmpDir('af-e10s9-src-');
      writeFileSync(join(src, 'AGENTS.md'), 'Be terse.', 'utf8');
      mkdirSync(join(src, '.pi', 'extensions'), { recursive: true });
      writeFileSync(
        join(src, '.pi', 'extensions', 'custom.ts'),
        'export default (pi) => {};',
        'utf8',
      );
      const re = await pi.read('project', src);
      // Config lifts (E10.S8 discipline)…
      expect((re.rules ?? []).some((r) => r.body.includes('Be terse.'))).toBe(
        true,
      );
      // …and the TS is never mistaken for config resources.
      expect(re.hooks ?? []).toEqual([]);
      expect(re.agents ?? []).toEqual([]);
    },
  );
});
