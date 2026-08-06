// The claude harness surface. This barrel is PROJECTION-ONLY: the IR `Adapter`
// (detect/read/write) it used to also export was deleted along with the rest of
// the IR-intake lineage, so there is one adapter kind here, not two, and
// importing this barrel no longer drags a second pipeline in.

export {
  canonicalToClaude,
  claudeToCanonical,
  canonicalActToClaude,
  claudeBindingOf,
} from './events.js';
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
// The hook → settings.json `hooks` block serializer, standalone by construction:
// it lives in `hooks.ts` beside the render projection and imports only
// `core/hook` + the event map. It was extracted out of the deleted IR write path,
// which the live projection used to reach into for exactly this one function.
export {
  type ClaudeHooksBlock,
  type ClaudeHook,
  serializeClaudeHooksReport,
} from './hooks.js';
