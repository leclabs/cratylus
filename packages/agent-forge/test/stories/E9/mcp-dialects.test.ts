/**
 * E9.S1 — the McpServer model covers the field's dialects.
 *
 * Fixtures per documented dialect shape (RETURN §2); representability is
 * validateMcpServer acceptance. The schema carries additionalProperties:false,
 * so an unmodeled field is a genuine validation failure, not a silent pass.
 */

import { describe, expect } from 'vitest';

import { validateMcpServer } from '../../../src/core/index.js';
import { story } from '../helpers.js';

type Fixture = { name: string; ref: string; server: Record<string, unknown> };

/** Dialect shapes the IR cannot express today (§3 cross-cutting). */
const UNREPRESENTABLE: readonly Fixture[] = [
  {
    name: 'command-as-array (opencode/Kilo typed local)',
    ref: '[OC7][KL5]',
    server: {
      name: 'srv',
      transport: 'stdio',
      command: ['npx', '-y', '@scope/server'],
    },
  },
  {
    name: 'bearer_token_env_var + http_headers (Codex remote)',
    ref: '[CX7]',
    server: {
      name: 'srv',
      transport: 'http',
      url: 'https://example.com/mcp',
      bearer_token_env_var: 'API_TOKEN',
      http_headers: { 'X-Org': 'acme' },
    },
  },
  {
    name: 'disabled + autoApprove (Cline)',
    ref: '[CL6]',
    server: {
      name: 'srv',
      transport: 'stdio',
      command: 'npx',
      disabled: true,
      autoApprove: ['toolA'],
    },
  },
  {
    name: 'includeTools/excludeTools/trust/timeout (Gemini/Codex)',
    ref: '[GM1][CX7]',
    server: {
      name: 'srv',
      transport: 'http',
      url: 'https://example.com/mcp',
      includeTools: ['a'],
      excludeTools: ['b'],
      trust: true,
      timeout: 30,
    },
  },
  {
    name: 'auth object (Cursor remote)',
    ref: '[CU5]',
    server: {
      name: 'srv',
      transport: 'http',
      url: 'https://example.com/mcp',
      auth: { type: 'oauth' },
    },
  },
] as const;

describe('E9.S1 · McpServer dialect coverage', () => {
  story(
    'E9.S1',
    'core shapes validate today: stdio {command,args,env}, remote {url,headers}, SSE-vs-HTTP transport distinction [GM1]',
    () => {
      expect(
        validateMcpServer({
          name: 'github',
          transport: 'stdio',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-github'],
          env: { GITHUB_TOKEN: 'xxx' },
        }),
      ).toBe(true);
      expect(
        validateMcpServer({
          name: 'remote',
          transport: 'http',
          url: 'https://example.com/mcp',
          headers: { Authorization: 'Bearer x' },
        }),
      ).toBe(true);
      // Gemini's url (SSE) vs httpUrl (streamable HTTP) is expressible via the
      // transport discriminator.
      expect(
        validateMcpServer({
          name: 'events',
          transport: 'sse',
          url: 'https://example.com/sse',
        }),
      ).toBe(true);
    },
  );

  for (const { name, ref, server } of UNREPRESENTABLE) {
    story.tracked('E9.S1', `schema represents ${name} ${ref}`, () => {
      expect(
        validateMcpServer(server),
        `expected representable: ${JSON.stringify(server)}`,
      ).toBe(true);
    });
  }
});
