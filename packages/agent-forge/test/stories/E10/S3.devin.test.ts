/**
 * E10.S3 · Windsurf/Devin adapter — new-adapter contract probes.
 * Ground truth: harness-landscape-research.RETURN.md §2/Windsurf-Devin sheet.
 * Refs [WS1][WS2][WS4][WS5][WS7]. Canonical id `devin` (E10.S5); probes use it.
 */

import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect } from 'vitest';
import type { IR, Manifest } from '../../../src/core/index.js';
import { adapterById, fakeHome, makeTmpDir, story } from '../helpers.js';
import { importAdapter } from './probe.js';

const manifest = (scope: Manifest['scope'] = 'project'): Manifest => ({
  agentForge: 1,
  scope,
  targets: ['devin'],
});

describe('E10.S3 · devin', () => {
  let cwd: string;
  let home: { home: string; restore: () => void } | null = null;

  beforeEach(() => {
    cwd = makeTmpDir('af-e10s3-');
  });
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
    home?.restore();
    home = null;
  });
  const useHome = (): string => {
    home = fakeHome();
    return home.home;
  };

  story(
    'E10.S3',
    'devin (or its windsurf alias) is on the adapter roster (new-adapter contract) [WS7]',
    () => {
      expect(adapterById.has('devin') || adapterById.has('windsurf')).toBe(
        true,
      );
    },
  );

  story(
    'E10.S3',
    'rules emit to the preferred .devin/rules/*.md with trigger: 4-mode frontmatter [WS7][WS1]',
    async () => {
      const devin = await importAdapter('devin');
      const ir: IR = {
        manifest: manifest(),
        rules: [{ id: 'style', body: 'Use tabs.' }],
      };
      await devin.write(ir, 'project', cwd, {});
      const rulesDir = join(cwd, '.devin', 'rules');
      expect(existsSync(rulesDir)).toBe(true);
      const files = readdirSync(rulesDir).filter((f) => f.endsWith('.md'));
      expect(files.length).toBeGreaterThan(0);
      const first = files[0] as string;
      const text = readFileSync(join(rulesDir, first), 'utf8');
      expect(text).toMatch(/trigger:\s*(always_on|model_decision|glob|manual)/);
    },
  );

  story(
    'E10.S3',
    'the 12k char/file rule cap is enforced — over-cap splits or warns [WS1]',
    async () => {
      const devin = await importAdapter('devin');
      const ir: IR = {
        manifest: manifest(),
        rules: [{ id: 'huge', body: 'x'.repeat(13_000) }],
      };
      const report = await devin.write(ir, 'project', cwd, {});
      const rulesDir = join(cwd, '.devin', 'rules');
      const files = existsSync(rulesDir)
        ? readdirSync(rulesDir).filter((f) => f.endsWith('.md'))
        : [];
      const overCap = files.some(
        (f) => readFileSync(join(rulesDir, f), 'utf8').length > 12_000,
      );
      expect(!overCap || report.warnings.length > 0).toBe(true);
      expect(files.length > 1 || report.warnings.length > 0).toBe(true);
    },
  );

  story(
    'E10.S3',
    'hooks emit to hooks.json in the snake_case 12-event dialect [WS2]',
    async () => {
      const devin = await importAdapter('devin');
      const ir: IR = {
        manifest: manifest(),
        hooks: [
          { id: 'post', events: ['file.edit.post'], command: './fmt.sh' },
        ],
      };
      await devin.write(ir, 'project', cwd, {});
      const candidates = [
        join(cwd, '.windsurf', 'hooks.json'),
        join(cwd, '.devin', 'hooks.json'),
        join(cwd, 'hooks.json'),
      ].filter((p) => existsSync(p));
      expect(candidates.length).toBeGreaterThan(0);
      const first = candidates[0] as string;
      const parsed = JSON.parse(readFileSync(first, 'utf8')) as {
        hooks?: Record<string, unknown>;
      };
      const events = Object.keys(parsed.hooks ?? {});
      expect(events.length).toBeGreaterThan(0);
      for (const e of events) expect(e).toMatch(/^[a-z0-9_]+$/);
    },
  );

  story(
    'E10.S3',
    'workflows: commands emit to .windsurf/workflows/*.md [WS4]',
    async () => {
      const devin = await importAdapter('devin');
      const ir: IR = {
        manifest: manifest(),
        commands: [{ name: 'deploy', body: 'Deploy the app.' }],
      };
      await devin.write(ir, 'project', cwd, {});
      expect(existsSync(join(cwd, '.windsurf', 'workflows', 'deploy.md'))).toBe(
        true,
      );
    },
  );

  story(
    'E10.S3',
    'MCP emits to ~/.codeium/windsurf/mcp_config.json [WS5]',
    async () => {
      const h = useHome();
      const devin = await importAdapter('devin');
      const ir: IR = {
        manifest: manifest('user'),
        mcp_servers: [
          { name: 'github', transport: 'stdio', command: 'npx', args: ['-y'] },
        ],
      };
      await devin.write(ir, 'user', cwd, {});
      expect(
        existsSync(join(h, '.codeium', 'windsurf', 'mcp_config.json')),
      ).toBe(true);
    },
  );
});
