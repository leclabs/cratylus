/**
 * E7.S6 — one MCP model, per-dialect serializers (R5).
 * One stdio + one streamable-HTTP server compiled per target; exact file,
 * root key, and entry shape per dialect. Ground truth: `.mcp.json`
 * `mcpServers` [S44]/[CC7]; `.cursor/mcp.json` [S45]/[CU5]; `.vscode/mcp.json`
 * root `servers` [S46]/[CP6]; `.gemini/settings.json` httpUrl-vs-url
 * [S11]/[GM1]; `~/.codex/config.toml` `[mcp_servers.<n>]` TOML, no `type`,
 * no SSE [S47]/[CX7]. §3: claude d1, cursor d6, gemini d5, codex d6.
 */

import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import TOML from '@iarna/toml';
import { afterEach, describe, expect } from 'vitest';
import { type IR, type McpServer, compile } from '../../../src/core/index.js';
import { adapterById, fakeHome, makeTmpDir, story } from '../helpers.js';
import { manifest, mcpPair } from './fixtures.js';

const dirs: string[] = [];
function tmp(): string {
  const d = makeTmpDir();
  dirs.push(d);
  return d;
}
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

function ir(target: string, servers: McpServer[] = mcpPair()): IR {
  return { manifest: manifest([target]), mcp_servers: servers };
}

function adapter(id: string) {
  const a = adapterById.get(id);
  if (!a) throw new Error(`no adapter '${id}'`);
  return a;
}

describe('E7.S6 · MCP dialect exactness per target', () => {
  story.tracked(
    'E7.S6',
    'claude project scope: servers land in repo-root .mcp.json under mcpServers [S44] (adapter writes settings.json instead, §3 claude d1)',
    async () => {
      const cwd = tmp();
      await compile(ir('claude'), [adapter('claude')], 'project', cwd);

      const file = join(cwd, '.mcp.json');
      expect(existsSync(file)).toBe(true);
      const parsed = JSON.parse(readFileSync(file, 'utf8')) as {
        mcpServers: Record<string, Record<string, unknown>>;
      };
      expect(parsed.mcpServers.gh?.command).toBe('npx');
      expect(parsed.mcpServers.api?.url).toBe('https://api.example.com/mcp');
    },
  );

  story(
    'E7.S6',
    'cursor: .cursor/mcp.json root key mcpServers, stdio entry command/args exactly [S45]',
    async () => {
      const cwd = tmp();
      const report = await compile(
        ir('cursor'),
        [adapter('cursor')],
        'project',
        cwd,
      );
      expect(report.results.filter((r) => r.error)).toEqual([]);

      const parsed = JSON.parse(
        readFileSync(join(cwd, '.cursor', 'mcp.json'), 'utf8'),
      ) as { mcpServers: Record<string, Record<string, unknown>> };
      expect(Object.keys(parsed)).toEqual(['mcpServers']);
      const gh = parsed.mcpServers.gh;
      expect(gh).toBeDefined();
      expect(gh?.command).toBe('npx');
      expect(gh?.args).toEqual(['-y', 'mcp-github']);
      // stdio entry carries only documented keys [S45].
      for (const key of Object.keys(gh ?? {})) {
        expect(['command', 'args', 'env', 'type']).toContain(key);
      }
    },
  );

  story.tracked(
    'E7.S6',
    'cursor: remote entry shape is exactly {url, headers?, auth?} — no undocumented type key [S45] (§3 cursor d6)',
    async () => {
      const cwd = tmp();
      await compile(ir('cursor'), [adapter('cursor')], 'project', cwd);
      const parsed = JSON.parse(
        readFileSync(join(cwd, '.cursor', 'mcp.json'), 'utf8'),
      ) as { mcpServers: Record<string, Record<string, unknown>> };
      const api = parsed.mcpServers.api ?? {};
      expect(api.url).toBe('https://api.example.com/mcp');
      for (const key of Object.keys(api)) {
        expect(['url', 'headers', 'auth']).toContain(key);
      }
    },
  );

  story(
    'E7.S6',
    'copilot(vscode): .vscode/mcp.json with root key servers — not mcpServers [S46]',
    async () => {
      const cwd = tmp();
      const report = await compile(
        ir('copilot'),
        [adapter('copilot')],
        'project',
        cwd,
      );
      expect(report.results.filter((r) => r.error)).toEqual([]);

      const parsed = JSON.parse(
        readFileSync(join(cwd, '.vscode', 'mcp.json'), 'utf8'),
      ) as { servers?: Record<string, Record<string, unknown>> } & Record<
        string,
        unknown
      >;
      expect(Object.keys(parsed)).toEqual(['servers']);
      expect(parsed.servers?.gh?.command).toBe('npx');
      expect(parsed.servers?.api?.url).toBe('https://api.example.com/mcp');
    },
  );

  story(
    'E7.S6',
    'gemini: .gemini/settings.json mcpServers, stdio entry command/args [S11]',
    async () => {
      const cwd = tmp();
      const report = await compile(
        ir('gemini'),
        [adapter('gemini')],
        'project',
        cwd,
      );
      expect(report.results.filter((r) => r.error)).toEqual([]);

      const parsed = JSON.parse(
        readFileSync(join(cwd, '.gemini', 'settings.json'), 'utf8'),
      ) as { mcpServers: Record<string, Record<string, unknown>> };
      expect(parsed.mcpServers.gh?.command).toBe('npx');
      expect(parsed.mcpServers.gh?.args).toEqual(['-y', 'mcp-github']);
    },
  );

  story.tracked(
    'E7.S6',
    'gemini: streamable-HTTP server uses httpUrl, url is SSE-only [S11] (§3 gemini d5)',
    async () => {
      const cwd = tmp();
      await compile(ir('gemini'), [adapter('gemini')], 'project', cwd);
      const parsed = JSON.parse(
        readFileSync(join(cwd, '.gemini', 'settings.json'), 'utf8'),
      ) as { mcpServers: Record<string, Record<string, unknown>> };
      const api = parsed.mcpServers.api ?? {};
      // Documented dialect: HTTP transport ⇒ httpUrl key; adapter emits
      // {url, type} which a stock Gemini reads as mis-encoded.
      expect(api.httpUrl).toBe('https://api.example.com/mcp');
      expect('url' in api).toBe(false);
    },
  );

  story(
    'E7.S6',
    'codex user scope: ~/.codex/config.toml [mcp_servers.<n>] TOML table for stdio [S47]',
    async () => {
      const { home, restore } = fakeHome();
      try {
        const cwd = tmp();
        const report = await compile(
          ir('codex'),
          [adapter('codex')],
          'user',
          cwd,
        );
        expect(report.results.filter((r) => r.error)).toEqual([]);

        const file = join(home, '.codex', 'config.toml');
        expect(existsSync(file)).toBe(true);
        const parsed = TOML.parse(readFileSync(file, 'utf8')) as {
          mcp_servers?: Record<string, Record<string, unknown>>;
        };
        expect(parsed.mcp_servers?.gh?.command).toBe('npx');
        expect(parsed.mcp_servers?.gh?.args).toEqual(['-y', 'mcp-github']);
      } finally {
        restore();
      }
    },
  );

  story.tracked(
    'E7.S6',
    'codex: remote entry carries no type key — url + bearer_token_env_var/http_headers only [S47] (§3 codex d6)',
    async () => {
      const { home, restore } = fakeHome();
      try {
        const cwd = tmp();
        await compile(ir('codex'), [adapter('codex')], 'user', cwd);
        const parsed = TOML.parse(
          readFileSync(join(home, '.codex', 'config.toml'), 'utf8'),
        ) as { mcp_servers?: Record<string, Record<string, unknown>> };
        const api = parsed.mcp_servers?.api ?? {};
        expect(api.url).toBe('https://api.example.com/mcp');
        expect('type' in api).toBe(false);
      } finally {
        restore();
      }
    },
  );

  story.tracked(
    'E7.S6',
    'codex: SSE transport is inexpressible in the dialect and must warn per E4.S2 [S47]',
    async () => {
      const { restore } = fakeHome();
      try {
        const cwd = tmp();
        const sse: McpServer = {
          name: 'events',
          transport: 'sse',
          url: 'https://sse.example.com/mcp',
        };
        const report = await compile(
          ir('codex', [sse]),
          [adapter('codex')],
          'user',
          cwd,
        );
        const warnings = report.results[0]?.report?.warnings ?? [];
        // Documented truth: Codex has no SSE [S47] — the adapter must warn,
        // not silently emit a fabricated shape.
        expect(
          warnings.some((w) => /sse|transport/i.test(w)),
          `warnings: ${JSON.stringify(warnings)}`,
        ).toBe(true);
      } finally {
        restore();
      }
    },
  );
});
