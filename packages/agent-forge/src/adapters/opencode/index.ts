import { existsSync } from 'node:fs';
import type {
  Adapter,
  AdapterCapabilities,
  IR,
  Scope,
  WriteOpts,
  WriteReport,
} from '../../core/index.js';
import { canonicalToOpencode } from './events.js';
import { paths } from './paths.js';
import { readOpencode } from './read.js';
import { writeOpencode, writeOpencodeHooks } from './write.js';

const capabilities: AdapterCapabilities = {
  resources: {
    rules: 'full',
    skills: 'partial', // SKILL.md round-trips, but allowed_tools is dropped
    // .opencode/agents/*.md [OC2] / .opencode/commands/*.md [OC4] — real
    // surfaces, but several IR fields (color/permission_mode/max_turns/
    // memory/effort; argument_hint/allowed_tools) have no opencode
    // frontmatter equivalent, so 'partial' not 'full'.
    commands: 'partial',
    agents: 'partial',
    // Hooks have no native opencode config surface: delivery is a generated
    // plugin shim in .opencode/plugins/ [OC5] — the plugin support mode
    // (only the [OC5]-verified event names are mapped by the shim).
    hooks: 'plugin',
    mcp: 'full',
    // IR permissions map to opencode's own "permission" DSL — real surface,
    // lossy translation (structured glob nesting vs IR's flat lists) [OC8].
    permissions: 'partial',
    // No documented env surface — {env:VAR} substitution inside other keys
    // only, never a standalone env config [OC1].
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

export const opencodeAdapter: Adapter = {
  id: 'opencode',
  capabilities,
  eventMap: canonicalToOpencode,
  pluginEmitters: {
    hooks: writeOpencodeHooks,
  },
  async detect(scope: Scope, cwd: string): Promise<boolean> {
    const p = paths(scope, cwd);
    return existsSync(p.opencodeDir) || existsSync(p.rulesFile);
  },
  async read(scope: Scope, cwd: string): Promise<Partial<IR>> {
    return readOpencode(scope, cwd);
  },
  async write(
    ir: IR,
    scope: Scope,
    cwd: string,
    opts: WriteOpts,
  ): Promise<WriteReport> {
    return writeOpencode(ir, scope, cwd, opts);
  },
};

export default opencodeAdapter;
export { paths } from './paths.js';
export { canonicalToOpencode, opencodeToCanonical } from './events.js';
