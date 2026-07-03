/**
 * E8.S3 · gemini — context filename, commands, MCP transports, config keys.
 * Ground truth: harness-landscape-research.RETURN.md §2/Gemini, §3/gemini d1–d5, d7.
 * Refs [GM1][GM4][GM5].
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import TOML from '@iarna/toml';
import { afterEach, beforeEach, describe, expect } from 'vitest';
import { geminiAdapter } from '../../../src/adapters/gemini/index.js';
import type { IR, Manifest } from '../../../src/core/index.js';
import { makeTmpDir, story } from '../helpers.js';

const manifest = (scope: Manifest['scope'] = 'project'): Manifest => ({
  agentForge: 1,
  scope,
  targets: ['gemini'],
});

const readJson = (path: string): Record<string, unknown> =>
  JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;

describe('E8.S3 · gemini', () => {
  let cwd: string;

  beforeEach(() => {
    cwd = makeTmpDir('af-e8s3-');
  });
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  // --- Context filename [GM1] ---

  story.tracked(
    'E8.S3',
    'project rules emit to GEMINI.md, the stock context filename [GM1]',
    async () => {
      const ir: IR = {
        manifest: manifest(),
        rules: [{ id: 'main', body: 'Be terse.' }],
      };
      await geminiAdapter.write(ir, 'project', cwd, {});
      expect(existsSync(join(cwd, 'GEMINI.md'))).toBe(true);
    },
  );

  story.tracked(
    'E8.S3',
    'a stock install reads the result: bare AGENTS.md requires context.fileName wiring [GM1]',
    async () => {
      const ir: IR = {
        manifest: manifest(),
        rules: [{ id: 'main', body: 'Be terse.' }],
      };
      await geminiAdapter.write(ir, 'project', cwd, {});
      const wroteAgentsMd = existsSync(join(cwd, 'AGENTS.md'));
      const settingsFile = join(cwd, '.gemini', 'settings.json');
      const settings = existsSync(settingsFile) ? readJson(settingsFile) : {};
      const fileNameCfg = JSON.stringify(
        (settings as { context?: { fileName?: unknown } }).context?.fileName ??
          '',
      );
      expect(!wroteAgentsMd || fileNameCfg.includes('AGENTS.md')).toBe(true);
    },
  );

  story.tracked(
    'E8.S3',
    'GEMINI.md fixture lifts as rules on read [GM1]',
    async () => {
      writeFileSync(join(cwd, 'GEMINI.md'), 'Context rules.\n', 'utf8');
      const re = await geminiAdapter.read('project', cwd);
      expect(
        (re.rules ?? []).some((r) => r.body.includes('Context rules')),
      ).toBe(true);
    },
  );

  // --- Commands [GM5] ---

  story.tracked(
    'E8.S3',
    'commands capability on: .gemini/commands/*.toml with required prompt key [GM5]',
    async () => {
      const ir: IR = {
        manifest: manifest(),
        commands: [{ name: 'deploy', body: 'Deploy the app.' }],
      };
      await geminiAdapter.write(ir, 'project', cwd, {});
      const cmdFile = join(cwd, '.gemini', 'commands', 'deploy.toml');
      expect(existsSync(cmdFile)).toBe(true);
      const parsed = TOML.parse(readFileSync(cmdFile, 'utf8')) as {
        prompt?: string;
      };
      expect(typeof parsed.prompt).toBe('string');
    },
  );

  story.tracked(
    'E8.S3',
    'capabilities no longer declare commands: none [GM5]',
    () => {
      expect(geminiAdapter.capabilities.resources.commands).not.toBe('none');
    },
  );

  // --- MCP transports [GM1] ---

  story.tracked(
    'E8.S3',
    'SSE remote MCP emits url without the fabricated type key [GM1]',
    async () => {
      const ir: IR = {
        manifest: manifest(),
        mcp_servers: [
          { name: 'sse-srv', transport: 'sse', url: 'https://sse.example.com' },
        ],
      };
      await geminiAdapter.write(ir, 'project', cwd, {});
      const settings = readJson(join(cwd, '.gemini', 'settings.json')) as {
        mcpServers?: Record<string, Record<string, unknown>>;
      };
      const entry = settings.mcpServers?.['sse-srv'] ?? {};
      expect(entry.url).toBe('https://sse.example.com');
      expect('type' in entry).toBe(false);
    },
  );

  story.tracked(
    'E8.S3',
    'streamable-HTTP remote MCP emits httpUrl, not url [GM1]',
    async () => {
      const ir: IR = {
        manifest: manifest(),
        mcp_servers: [
          {
            name: 'http-srv',
            transport: 'http',
            url: 'https://http.example.com',
          },
        ],
      };
      await geminiAdapter.write(ir, 'project', cwd, {});
      const settings = readJson(join(cwd, '.gemini', 'settings.json')) as {
        mcpServers?: Record<string, Record<string, unknown>>;
      };
      const entry = settings.mcpServers?.['http-srv'] ?? {};
      expect(entry.httpUrl).toBe('https://http.example.com');
    },
  );

  // --- Config keys [GM1] ---

  story.tracked(
    'E8.S3',
    'no fabricated permissions/env settings.json keys are emitted [GM1]',
    async () => {
      const ir: IR = {
        manifest: manifest(),
        permissions: { allow: ['Read(*)'] },
        env: { DEBUG: 'true' },
      };
      await geminiAdapter.write(ir, 'project', cwd, {});
      const settingsFile = join(cwd, '.gemini', 'settings.json');
      const settings = existsSync(settingsFile) ? readJson(settingsFile) : {};
      expect('permissions' in settings).toBe(false);
      expect('env' in settings).toBe(false);
    },
  );

  // --- Hooks [GM4] ---

  story.tracked(
    'E8.S3',
    'event map includes the documented BeforeToolSelection event [GM4]',
    () => {
      expect(Object.values(geminiAdapter.eventMap ?? {})).toContain(
        'BeforeToolSelection',
      );
    },
  );

  story.tracked(
    'E8.S3',
    'hook capability declares regex matchers, not glob [GM4]',
    () => {
      expect(geminiAdapter.capabilities.hooks.matchers).not.toBe('glob');
    },
  );

  story(
    'E8.S3',
    'hook entries land under settings.json hooks with the documented shape [GM4]',
    async () => {
      const ir: IR = {
        manifest: manifest(),
        hooks: [
          {
            id: 'guard',
            events: ['tool.use.pre'],
            matcher: 'Bash',
            command: './check.sh',
            timeout: 60,
          },
        ],
      };
      await geminiAdapter.write(ir, 'project', cwd, {});
      const settings = readJson(join(cwd, '.gemini', 'settings.json')) as {
        hooks?: Record<
          string,
          Array<{
            matcher?: string;
            hooks: Array<{ type: string; command: string; timeout?: number }>;
          }>
        >;
      };
      const entries = settings.hooks?.BeforeTool ?? [];
      expect(entries.length).toBe(1);
      expect(entries[0]?.matcher).toBe('Bash');
      expect(entries[0]?.hooks[0]?.command).toBe('./check.sh');
    },
  );

  // --- Fabricated-shape import (E1.S3) ---

  story.tracked(
    'E8.S3',
    'fabricated-shape import: settings.json permissions/env are not lifted as phantoms (E1.S3) [GM1]',
    async () => {
      mkdirSync(join(cwd, '.gemini'), { recursive: true });
      writeFileSync(
        join(cwd, '.gemini', 'settings.json'),
        JSON.stringify({
          permissions: { allow: ['Read(*)'] },
          env: { DEBUG: '1' },
        }),
        'utf8',
      );
      const re = await geminiAdapter.read('project', cwd);
      expect(re.permissions).toBeUndefined();
      expect(re.env).toBeUndefined();
    },
  );
});
