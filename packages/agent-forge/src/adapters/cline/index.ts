import { existsSync } from 'node:fs';
import type {
  Adapter,
  AdapterCapabilities,
  IR,
  Scope,
  WriteOpts,
  WriteReport,
} from '../../core/index.js';
import { canonicalToCline } from './events.js';
import { paths } from './paths.js';
import { readCline } from './read.js';
import { writeCline } from './write.js';

/**
 * Cline adapter. Ground truth: harness-landscape-research.RETURN.md §2
 * "Cline" + §3 "cline adapter" ([CL1]-[CL7]).
 *
 * - Rules: AGENTS.md-native reader [S1][S22] — a plain rule lands on the
 *   shared root `AGENTS.md`; a glob-activated rule compiles to
 *   `.clinerules/<id>.md` with `paths:` frontmatter [CL1]. Global (user)
 *   scope has no AGENTS.md-equivalent — every rule lands in the real
 *   `~/Documents/Cline/Rules`, never `~/.cline/rules` [CL1].
 * - Hooks: per-event executable scripts in `.clinerules/hooks/` (project) /
 *   `~/Documents/Cline/Rules/Hooks/` (user), the documented 6-event set only
 *   — no fabricated `.cline/hooks.json`, no matcher concept [CL2][CL3].
 * - Skills: `.cline/skills/` (+ `~/.cline/skills/`, `.claude/skills/`) [CL5].
 * - Commands: workflows `.clinerules/workflows/*.md` [CL4].
 * - MCP: real only for the CLI at user scope (`~/.cline/mcp.json`); the
 *   extension reads VS Code globalStorage instead, so project scope has no
 *   documented file and is never fabricated [CL6].
 * - Agents/permissions/env: no documented file-config surface [CL7][CL2][CL1].
 */
const capabilities: AdapterCapabilities = {
  resources: {
    rules: 'full',
    // Native SKILL.md discovery [CL5]; full spec-frontmatter fidelity beyond
    // name/description/body is undocumented, so 'partial' not 'full'.
    skills: 'partial',
    // Workflows carry no frontmatter (plain body only) [CL4] — a fixture
    // exercising description/argument_hint/model/allowed_tools does not
    // round-trip, mirroring the cursor/opencode commands precedent.
    commands: 'partial',
    agents: 'none', // native subagents are a tool, not file-config [CL7]
    hooks: 'partial', // 6 of 28 canonical events; no matcher/timeout fields
    // Real (full fidelity minus remote headers) at user (CLI) scope only —
    // no documented project-scope surface at all [CL6], so 'partial'.
    mcp: 'partial',
    permissions: 'none', // hook decisions/UI toggles only, no config file [CL2]
    env: 'none', // no documented env surface [CL1]
  },
  hooks: {
    supported: [
      'session.start',
      'session.resume',
      'turn.fail',
      'prompt.submit',
      'tool.use.pre',
      'tool.use.post',
    ],
    matchers: 'none', // no matcher concept in the dialect [CL2]
    payload: 'native', // per-event executable + JSON stdin/stdout contract
  },
  scopes: ['user', 'project'],
};

export const clineAdapter: Adapter = {
  id: 'cline',
  capabilities,
  eventMap: canonicalToCline,
  async detect(scope: Scope, cwd: string): Promise<boolean> {
    const p = paths(scope, cwd);
    return existsSync(p.clineDir) || existsSync(p.rulesDir);
  },
  async read(scope: Scope, cwd: string): Promise<Partial<IR>> {
    return readCline(scope, cwd);
  },
  async write(
    ir: IR,
    scope: Scope,
    cwd: string,
    opts: WriteOpts,
  ): Promise<WriteReport> {
    return writeCline(ir, scope, cwd, opts);
  },
};

export default clineAdapter;
export { paths } from './paths.js';
export { canonicalToCline, clineToCanonical } from './events.js';
