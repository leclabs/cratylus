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
    hooks: 'partial', // 6 events, Bash-only matchers in practice
    mcp: 'full',
    permissions: 'partial',
    env: 'full',
  },
  hooks: {
    supported: [
      'session.start',
      'prompt.submit',
      'tool.use.pre',
      'tool.use.post',
      'permission.request',
      'turn.end',
    ],
    matchers: 'literal', // Codex hooks effectively only respond to Bash matcher
    payload: 'claude-json',
  },
  scopes: ['user', 'project'],
};

export const codexAdapter: Adapter = {
  id: 'codex',
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
// `ResolvedAgent`/`ResolvedSkill` shapes are shared with the claude adapter.
export {
  type ResolvedAgent,
  type ResolvedSkill,
  agentToCodexToml,
  agentToCodexTomlObject,
  projectCodexAgentDelta,
  skillToCodexMd,
  agentsMdSurface,
} from './anatomy.js';
// The codex HARNESS RESET (omit-to-inherit basis, a T2.4 first pass). `codex` is a
// harness, never a agent-anatomy agent — so the reset lives in the adapter, not agent-anatomy.
export { codexHarnessReset } from './harness-reset.js';
