import { existsSync } from 'node:fs';
import type {
  Adapter,
  AdapterCapabilities,
  IR,
  Scope,
  WriteOpts,
  WriteReport,
} from '../../core/index.js';
import { canonicalToKilo } from './events.js';
import { paths } from './paths.js';
import { readKilo } from './read.js';
import { writeKilo, writeKiloHooks } from './write.js';

/**
 * Kilo adapter. Ground truth: harness-landscape-research.RETURN.md §2
 * "Roo Code / Kilo" + §1 matrix Kilo row ([KL1]-[KL7]).
 *
 * - Rules: `.kilo/rules/*.md`, plain body per file [KL2][KL4].
 * - Skills: `.kilo/skills/<name>/SKILL.md` [KL3].
 * - Agents: `.kilo/agents/*.md`, `mode: primary|subagent|all` required [KL1].
 * - Commands: `.kilo/commands/*.md`, plain body (the one confirmed dialect
 *   key, `subtask:`, has no IR analog) [KL7].
 * - Hooks: no native surface — delivered via a generated plugin artifact
 *   against `@kilocode/plugin` lifecycle hooks [KL6].
 * - MCP: the ONE config home, `kilo.jsonc` under `.kilo/` (`.kilo/kilo.jsonc`
 *   wins over a project-root `kilo.jsonc`), `mcp` key typed local/remote with
 *   command as an ARRAY [KL5].
 * - Legacy: `.kilocode/*` (the pre-rename product's tree) is recognized on
 *   import (rules only, so far), never written [KL1].
 * - Permissions/env: no documented standalone config surface — Kilo's
 *   `permission` field is per-agent frontmatter (ordered glob rules), not a
 *   project-wide list the IR `Permissions` shape models.
 */
const capabilities: AdapterCapabilities = {
  resources: {
    rules: 'partial',
    skills: 'partial',
    commands: 'partial',
    agents: 'partial',
    hooks: 'plugin',
    mcp: 'full',
    permissions: 'none',
    env: 'none',
  },
  hooks: {
    supported: [
      'session.start',
      'tool.use.pre',
      'tool.use.post',
      'file.edit.post',
    ],
    matchers: 'glob',
    payload: 'shim',
  },
  scopes: ['user', 'project'],
};

export const kiloAdapter: Adapter = {
  id: 'kilo',
  capabilities,
  eventMap: canonicalToKilo,
  pluginEmitters: {
    hooks: writeKiloHooks,
  },
  async detect(scope: Scope, cwd: string): Promise<boolean> {
    const p = paths(scope, cwd);
    return (
      existsSync(p.kiloDir) ||
      existsSync(p.configFile) ||
      (p.rootConfigFile !== undefined && existsSync(p.rootConfigFile))
    );
  },
  async read(scope: Scope, cwd: string): Promise<Partial<IR>> {
    return readKilo(scope, cwd);
  },
  async write(
    ir: IR,
    scope: Scope,
    cwd: string,
    opts: WriteOpts,
  ): Promise<WriteReport> {
    return writeKilo(ir, scope, cwd, opts);
  },
};

export default kiloAdapter;
export { paths } from './paths.js';
export { canonicalToKilo, kiloToCanonical } from './events.js';
