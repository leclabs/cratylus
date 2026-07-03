import { existsSync } from 'node:fs';
import type {
  Adapter,
  AdapterCapabilities,
  IR,
  Scope,
  WriteOpts,
  WriteReport,
} from '../../core/index.js';
import { canonicalToCopilot } from './events.js';
import { paths } from './paths.js';
import { readCopilot } from './read.js';
import { writeCopilot } from './write.js';

const capabilities: AdapterCapabilities = {
  resources: {
    rules: 'full',
    skills: 'full',
    commands: 'full', // .github/prompts/*.prompt.md → /name [CP5]
    agents: 'partial', // GA surface [CP1], but several canonical Agent fields
    // (color/permission_mode/max_turns/temperature/mode/memory/effort) have
    // no documented Copilot equivalent
    hooks: 'partial', // 12 of 28 canonical events
    mcp: 'full',
    permissions: 'none', // hook allow/deny decisions only, no permissions config [CP4]
    env: 'partial', // coding-agent copilot-setup-steps.yml only [CP13]
  },
  hooks: {
    supported: [
      'session.start',
      'prompt.submit',
      'tool.use.pre',
      'tool.use.post',
      'tool.use.fail',
      'permission.request',
      'turn.end',
      'turn.fail',
      'subagent.start',
      'subagent.end',
      'notification',
      'context.compact.pre',
    ],
    matchers: 'regex',
    payload: 'native',
  },
  scopes: ['user', 'project'],
};

export const copilotAdapter: Adapter = {
  id: 'copilot',
  status: { kind: 'current' },
  capabilities,
  eventMap: canonicalToCopilot,
  async detect(scope: Scope, cwd: string): Promise<boolean> {
    const p = paths(scope, cwd);
    return (
      existsSync(p.rulesFile) ||
      existsSync(p.instructionsFile) ||
      existsSync(p.skillsDir) ||
      existsSync(p.agentsDir) ||
      existsSync(p.mcpFile) ||
      existsSync(p.hooksDir)
    );
  },
  async read(scope: Scope, cwd: string): Promise<Partial<IR>> {
    return readCopilot(scope, cwd);
  },
  async write(
    ir: IR,
    scope: Scope,
    cwd: string,
    opts: WriteOpts,
  ): Promise<WriteReport> {
    return writeCopilot(ir, scope, cwd, opts);
  },
};

export default copilotAdapter;
export { paths } from './paths.js';
export { canonicalToCopilot, copilotToCanonical } from './events.js';
