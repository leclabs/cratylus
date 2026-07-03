import type {
  Adapter,
  AdapterCapabilities,
  WriteReport,
} from '../../core/index.js';

/**
 * Roo Code — sunset 2026-05-15 (docs archived; successor Cline) [RO5].
 *
 * Status-only stub, deliberately NOT part of the shipped roster (never
 * added to `cli/index.ts`'s `adapters[]` or the story suite's
 * `ALL_ADAPTERS` — E10.S5 is roster metadata, not a new dialect; building a
 * real Roo dialect would be out-of-territory implementation work). Reachable
 * by direct/dynamic import so a caller can read its sunset status before
 * deciding to compile to `cline` instead; `write` refuses rather than
 * emitting a stale dialect silently.
 */
const capabilities: AdapterCapabilities = {
  resources: {
    rules: 'none',
    skills: 'none',
    commands: 'none',
    agents: 'none',
    hooks: 'none',
    mcp: 'none',
    permissions: 'none',
    env: 'none',
  },
  hooks: { supported: [], matchers: 'none', payload: 'native' },
  scopes: [],
};

export const rooAdapter: Adapter = {
  id: 'roo',
  status: { kind: 'sunset', successor: 'cline' },
  capabilities,
  async detect(): Promise<boolean> {
    return false;
  },
  async read() {
    return {};
  },
  async write(): Promise<WriteReport> {
    return {
      written: [],
      skipped: [],
      warnings: [
        'roo: sunset 2026-05-15, docs archived — compile to cline instead [RO5]',
      ],
    };
  },
};

export default rooAdapter;
