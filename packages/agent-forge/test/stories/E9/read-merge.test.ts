/**
 * E9.S4 — writes are read-merge, never whole-file clobber.
 *
 * §3 cross-cutting: "Write is destructive: every adapter overwrites the
 * target rules/settings file wholesale". Each shared-file surface gets a
 * fixture pre-populated with foreign content; documented truth is that the
 * foreign content survives byte-identical and forge content sits in its
 * documented home (JSON keys / marker-delimited markdown region).
 */

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect } from 'vitest';

import { compile, detectDrift } from '../../../src/core/index.js';
import type { IR } from '../../../src/core/index.js';
import { FIXTURES, manifest, snapshotTree } from '../E4/support.js';
import { adapterById, makeTmpDir, story } from '../helpers.js';

const cleanups: string[] = [];
afterEach(() => {
  for (const dir of cleanups.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function tmp(prefix: string): string {
  const dir = makeTmpDir(prefix);
  cleanups.push(dir);
  return dir;
}

function requireAdapter(id: string) {
  const adapter = adapterById.get(id);
  if (!adapter) throw new Error(`unknown adapter '${id}'`);
  return adapter;
}

describe('E9.S4 · read-merge on shared files', () => {
  story.tracked(
    'E9.S4',
    'claude settings.json: foreign keys survive a compile byte-for-byte [CC8]',
    async () => {
      const cwd = tmp('af-e9s4-claude-');
      mkdirSync(join(cwd, '.claude'), { recursive: true });
      writeFileSync(
        join(cwd, '.claude', 'settings.json'),
        JSON.stringify(
          { model: 'opus', statusLine: { type: 'command', command: 'x' } },
          null,
          2,
        ),
      );
      await requireAdapter('claude').write(
        {
          manifest: manifest('claude'),
          ...FIXTURES.permissions,
          ...FIXTURES.env,
        },
        'project',
        cwd,
        {},
      );
      const settings = JSON.parse(
        readFileSync(join(cwd, '.claude', 'settings.json'), 'utf8'),
      ) as Record<string, unknown>;
      // Forge-owned keys landed…
      expect(settings.permissions).toBeDefined();
      expect(settings.env).toBeDefined();
      // …and foreign keys are untouched.
      expect(settings.model).toBe('opus');
      expect(settings.statusLine).toEqual({ type: 'command', command: 'x' });
    },
  );

  story.tracked(
    'E9.S4',
    'CLAUDE.md: hand-written content survives; forge rules sit in a marker-delimited managed region [CC1]',
    async () => {
      const cwd = tmp('af-e9s4-claudemd-');
      writeFileSync(
        join(cwd, 'CLAUDE.md'),
        '# Hand-written\n\nkeep me — not forge-managed\n',
      );
      await requireAdapter('claude').write(
        { manifest: manifest('claude'), ...FIXTURES.rules },
        'project',
        cwd,
        {},
      );
      const md = readFileSync(join(cwd, 'CLAUDE.md'), 'utf8');
      expect(md).toContain('keep me — not forge-managed');
      // Managed region is delimited so the next compile can find its own text.
      expect(md).toMatch(/agent-forge/i);
      expect(md).toContain('Be terse');
    },
  );

  story.tracked(
    'E9.S4',
    'opencode.json: mcp lands under the documented "mcp" key with foreign keys preserved [OC7]',
    async () => {
      const cwd = tmp('af-e9s4-opencode-');
      writeFileSync(
        join(cwd, 'opencode.json'),
        JSON.stringify({ theme: 'dark' }, null, 2),
      );
      await requireAdapter('opencode').write(
        { manifest: manifest('opencode'), ...FIXTURES.mcp },
        'project',
        cwd,
        {},
      );
      const config = JSON.parse(
        readFileSync(join(cwd, 'opencode.json'), 'utf8'),
      ) as Record<string, unknown>;
      expect(config.theme).toBe('dark');
      expect(config.mcp).toBeDefined();
    },
  );

  story.tracked(
    'E9.S4',
    'crush.json: mcp lands under the documented "mcp" key with foreign keys preserved [CR1]',
    async () => {
      const cwd = tmp('af-e9s4-crush-');
      writeFileSync(
        join(cwd, 'crush.json'),
        JSON.stringify({ options: { tui: true } }, null, 2),
      );
      await requireAdapter('crush').write(
        { manifest: manifest('crush'), ...FIXTURES.mcp },
        'project',
        cwd,
        {},
      );
      const config = JSON.parse(
        readFileSync(join(cwd, 'crush.json'), 'utf8'),
      ) as Record<string, unknown>;
      expect(config.options).toEqual({ tui: true });
      expect(config.mcp).toBeDefined();
    },
  );

  story(
    'E9.S4',
    'continue config.yaml: required top-level keys and foreign blocks survive; mcpServers is the documented LIST [CT1][CT4]',
    async () => {
      const cwd = tmp('af-e9s4-continue-');
      mkdirSync(join(cwd, '.continue'), { recursive: true });
      writeFileSync(
        join(cwd, '.continue', 'config.yaml'),
        'name: my-assistant\nversion: 1.0.0\nschema: v1\nmodels:\n  - name: gpt\n',
      );
      await requireAdapter('continue').write(
        { manifest: manifest('continue'), ...FIXTURES.mcp },
        'project',
        cwd,
        {},
      );
      const text = readFileSync(join(cwd, '.continue', 'config.yaml'), 'utf8');
      expect(text).toContain('my-assistant');
      expect(text).toContain('models');
      // Documented schema: mcpServers is a LIST of blocks, not a map.
      expect(text).toMatch(/mcpServers:\s*\n\s*-/);
    },
  );

  story.tracked(
    'E9.S4',
    '.aider.conf.yml: conventions wired via a merged read: entry, foreign keys preserved [AI1][AI2]',
    async () => {
      const cwd = tmp('af-e9s4-aider-');
      writeFileSync(join(cwd, '.aider.conf.yml'), 'model: gpt-5\n');
      await requireAdapter('aider').write(
        { manifest: manifest('aider'), ...FIXTURES.rules },
        'project',
        cwd,
        {},
      );
      const conf = readFileSync(join(cwd, '.aider.conf.yml'), 'utf8');
      // aider auto-discovers nothing [AI2]: a functional emission must merge a
      // read: entry pointing at the conventions file…
      expect(conf).toMatch(/read:/);
      // …without clobbering the foreign key.
      expect(conf).toContain('model: gpt-5');
    },
  );

  story(
    'E9.S4',
    'repeat compile is idempotent: second run leaves every emitted byte unchanged',
    async () => {
      const cwd = tmp('af-e9s4-idem-');
      const ir: IR = {
        manifest: manifest('claude'),
        ...FIXTURES.rules,
        ...FIXTURES.skills,
        ...FIXTURES.hooks,
        ...FIXTURES.mcp,
        ...FIXTURES.permissions,
        ...FIXTURES.env,
      };
      const claude = requireAdapter('claude');
      await claude.write(ir, 'project', cwd, {});
      const first = snapshotTree(cwd);
      await claude.write(ir, 'project', cwd, {});
      expect(snapshotTree(cwd)).toEqual(first);
    },
  );

  story(
    'E9.S4',
    'a foreign edit to an emitted file is reported as drift (detectDrift)',
    async () => {
      const cwd = tmp('af-e9s4-drift-');
      const stateDir = join(cwd, '.agent-forge');
      mkdirSync(stateDir, { recursive: true });
      const claude = requireAdapter('claude');
      const ir: IR = { manifest: manifest('claude'), ...FIXTURES.rules };
      await compile(ir, [claude], 'project', cwd, { stateDir });
      writeFileSync(join(cwd, 'CLAUDE.md'), '# tampered by hand\n');
      const drift = await detectDrift(stateDir, 'claude', cwd);
      expect(drift.drifted.map((d) => d.path)).toContain('CLAUDE.md');
      expect(drift.drifted[0]?.status).toBe('modified');
    },
  );

  story(
    'E9.S4',
    'recompile over drifted managed content reports the conflict instead of silently reclaiming (E3.S4 discipline)',
    async () => {
      const cwd = tmp('af-e9s4-reclaim-');
      const stateDir = join(cwd, '.agent-forge');
      mkdirSync(stateDir, { recursive: true });
      const claude = requireAdapter('claude');
      const ir: IR = { manifest: manifest('claude'), ...FIXTURES.rules };
      await compile(ir, [claude], 'project', cwd, { stateDir });
      writeFileSync(
        join(cwd, 'CLAUDE.md'),
        '# foreign edit in managed region\n',
      );
      const report = await compile(ir, [claude], 'project', cwd, { stateDir });
      // Documented truth: the conflict surfaces in the compile report; today
      // the edit is silently reclaimed with zero warnings.
      expect(report.totalWarnings).toBeGreaterThan(0);
    },
  );
});
