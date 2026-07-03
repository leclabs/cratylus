import { existsSync } from 'node:fs';
import type {
  Adapter,
  AdapterCapabilities,
  IR,
  Scope,
  WriteOpts,
  WriteReport,
} from '../../core/index.js';
import { canonicalToGemini } from './events.js';
import { paths } from './paths.js';
import { readGemini } from './read.js';
import { writeGemini } from './write.js';

const capabilities: AdapterCapabilities = {
  resources: {
    rules: 'full',
    skills: 'partial', // SKILL.md works; some metadata may be ignored
    commands: 'partial', // .gemini/commands/*.toml: prompt/description only [GM5]
    agents: 'partial', // .md subagents; conventions evolving
    hooks: 'full', // 10 of 28 canonical events covered cleanly
    mcp: 'full',
    permissions: 'partial',
    env: 'partial', // real surface is .env file loading [GM1]; no IR-modeled
    // mechanism today (settings.json has no env key — fabricated, removed)
  },
  hooks: {
    supported: [
      'session.start',
      'session.end',
      'prompt.submit',
      'turn.end',
      'model.request.pre',
      'model.response.post',
      'tool.use.pre',
      'tool.use.post',
      'context.compact.pre',
      'notification',
      'permission.request',
    ],
    matchers: 'regex',
    // Gemini's own hook envelope, not Claude's JSON shape [GM4] (E9.S3).
    payload: 'native',
  },
  scopes: ['user', 'project'],
};

export const geminiAdapter: Adapter = {
  id: 'gemini',
  /**
   * Gemini CLI → Antigravity CLI (consumer serving ceased 2026-06-18,
   * surfaces carried over) [GM7]. `.id` stays `gemini` for source/test
   * compat; `antigravity` is the field-canonical id (E10.S5).
   */
  status: {
    kind: 'renamed',
    canonicalId: 'antigravity',
    aliases: ['antigravity'],
  },
  capabilities,
  eventMap: canonicalToGemini,
  async detect(scope: Scope, cwd: string): Promise<boolean> {
    const p = paths(scope, cwd);
    return existsSync(p.geminiDir) || existsSync(p.rulesFile);
  },
  async read(scope: Scope, cwd: string): Promise<Partial<IR>> {
    return readGemini(scope, cwd);
  },
  async write(
    ir: IR,
    scope: Scope,
    cwd: string,
    opts: WriteOpts,
  ): Promise<WriteReport> {
    return writeGemini(ir, scope, cwd, opts);
  },
};

export default geminiAdapter;
export { paths } from './paths.js';
export { canonicalToGemini, geminiToCanonical } from './events.js';
