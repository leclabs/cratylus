import { existsSync } from 'node:fs';
import type {
  Adapter,
  AdapterCapabilities,
  IR,
  Scope,
  WriteOpts,
  WriteReport,
} from '../../core/index.js';
import { canonicalToClaude } from './events.js';
import { paths } from './paths.js';
import { readClaude } from './read.js';
import { writeClaude } from './write.js';

const capabilities: AdapterCapabilities = {
  resources: {
    rules: 'full',
    skills: 'full',
    commands: 'full',
    agents: 'full',
    hooks: 'full',
    mcp: 'full',
    permissions: 'full',
    env: 'full',
  },
  hooks: {
    supported: [
      'session.start',
      'session.end',
      'prompt.submit',
      'turn.end',
      'turn.fail',
      'agent.idle',
      'tool.use.pre',
      'tool.use.post',
      'tool.use.fail',
      'subagent.start',
      'subagent.end',
      'notification',
      'context.compact.pre',
      'context.compact.post',
      'file.change.external',
      'config.changed',
      'instructions.loaded',
      'permission.request',
      'permission.deny',
    ],
    matchers: 'regex',
    payload: 'claude-json',
  },
  scopes: ['user', 'project', 'local'],
};

export const claudeAdapter: Adapter = {
  id: 'claude',
  status: { kind: 'current' },
  capabilities,
  eventMap: canonicalToClaude,
  async detect(scope: Scope, cwd: string): Promise<boolean> {
    const p = paths(scope, cwd);
    return (
      existsSync(p.claudeDir) ||
      (p.rulesFile !== null && existsSync(p.rulesFile))
    );
  },
  async read(scope: Scope, cwd: string): Promise<Partial<IR>> {
    return readClaude(scope, cwd);
  },
  async write(
    ir: IR,
    scope: Scope,
    cwd: string,
    opts: WriteOpts,
  ): Promise<WriteReport> {
    return writeClaude(ir, scope, cwd, opts);
  },
};

export default claudeAdapter;
export { paths } from './paths.js';
export { canonicalToClaude, claudeToCanonical } from './events.js';
// The anatomy→claude-code SOUL/SKILL projection (the inversion's projection path,
// distinct from the IR serialize path above).
export {
  type ResolvedSkill,
  agentToClaudeMd,
  skillToClaudeMd,
  agentBody,
  skillBody,
  organTitle,
  claudeHarnessAdapter,
} from './anatomy.js';
// The hook → settings.json `hooks` block serializer (the IR-resource projection
// path), exposed standalone so a plugin (agent-anatomy) can project a hooks-only
// settings fragment without driving the whole `writeClaude` tree.
export {
  type ClaudeHooksBlock,
  serializeClaudeHooksReport,
  serializeClaudeMcp,
} from './write.js';
// The Claude plugin-bundle compile mode (E5.S5) — a full IR → distributable
// `.claude-plugin/` tree, distinct from writeClaude's per-scope `.claude/`
// tree. Reachable via `agent-forge compile --as-plugin <name>`.
export { writeClaudePlugin } from './bundle.js';
// The claude realization of the five activation modes — the adapter's
// `HarnessMechanismMap` for the engine's `realize(mode, mechanisms)`.
export { claudeMechanisms } from './mechanisms.js';
