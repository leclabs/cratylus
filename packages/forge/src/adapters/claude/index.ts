// The claude harness surface. Since depalimpsest-ir-intake S6 this barrel is
// PROJECTION-ONLY: the IR `Adapter` (detect/read/write) it used to also export
// went with the excised IR-intake lineage, so there is one adapter kind here,
// not two, and importing this barrel no longer drags a second pipeline in.

export { canonicalToClaude, claudeToCanonical } from './events.js';
// The anatomy→claude-code Target/SKILL projection.
export {
  type ResolvedSkill,
  agentToClaudeMd,
  skillToClaudeMd,
  agentBody,
  skillBody,
  dimensionTitle,
  claudeHarnessAdapter,
} from './render.js';
// The hook → settings.json `hooks` block serializer, standalone by construction
// (S3): it lives in `hooks.ts` beside the render projection and imports only
// `core/hook` + the event map.
export {
  type ClaudeHooksBlock,
  type ClaudeHook,
  serializeClaudeHooksReport,
} from './hooks.js';
