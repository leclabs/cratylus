import { existsSync } from 'node:fs';
import type {
  Adapter,
  AdapterCapabilities,
  IR,
  Scope,
  WriteOpts,
  WriteReport,
} from '../../core/index.js';
import { canonicalToCodex } from './events.js';
import { paths } from './paths.js';
import { readCodex } from './read.js';
import { writeCodex } from './write.js';

const capabilities: AdapterCapabilities = {
  resources: {
    rules: 'full',
    skills: 'full',
    commands: 'full',
    agents: 'full',
    hooks: 'partial', // 7 documented events [CX4], Bash-only matchers in practice
    mcp: 'full',
    permissions: 'partial', // approval_policy/sandbox_mode, not a generic ACL [CX6]
    env: 'partial', // shell_environment_policy, not a flat KEY=value map [CX6]
  },
  hooks: {
    supported: [
      'session.start',
      'prompt.submit',
      'tool.use.pre',
      'tool.use.post',
      'context.compact.pre',
      'context.compact.post',
      'turn.end',
    ],
    matchers: 'literal', // Codex hooks effectively only respond to Bash matcher
    payload: 'claude-json',
  },
  scopes: ['user', 'project'],
};

export const codexAdapter: Adapter = {
  id: 'codex',
  status: { kind: 'current' },
  capabilities,
  eventMap: canonicalToCodex,
  async detect(scope: Scope, cwd: string): Promise<boolean> {
    const p = paths(scope, cwd);
    return existsSync(p.codexDir) || existsSync(p.rulesFile);
  },
  async read(scope: Scope, cwd: string): Promise<Partial<IR>> {
    return readCodex(scope, cwd);
  },
  async write(
    ir: IR,
    scope: Scope,
    cwd: string,
    opts: WriteOpts,
  ): Promise<WriteReport> {
    return writeCodex(ir, scope, cwd, opts);
  },
};

export default codexAdapter;
export { paths } from './paths.js';
export { canonicalToCodex, codexToCanonical } from './events.js';
// The anatomy→codex projection (the inversion's projection path — the second
// harness, proving agent-anatomy reaches every agent-forge adapter for free; distinct from the
// IR serialize path above). The composed SOUL body is harness-neutral, so the
// `ResolvedSkill` shape is shared with the claude adapter.
export {
  type ResolvedSkill,
  agentToCodexToml,
  agentToCodexTomlObject,
  skillToCodexMd,
  agentsMdSurface,
  codexHarnessAdapter,
} from './anatomy.js';
