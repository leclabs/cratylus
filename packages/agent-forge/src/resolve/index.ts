// The `resolve/` public surface. P1 mints the plugin CONTRACT; the ordered-fold
// resolver (extends / patches / replace·append·merge·force) joins it here.
export { type AgentPlugin, defineAgentPlugin } from './plugin.js';
export {
  type ContributionSource,
  DanglingReferenceError,
  type Fragment,
  type FragmentContribution,
  type FragmentKind,
  ForcePriorityTieError,
  IllegalOpForKindError,
  type LoadedPlugin,
  MissingExtendsTargetError,
  type PatchEntry,
  type PatchOp,
  ReferenceCycleError,
  resolve,
  type ResolveConfig,
  type ResolvedAgentSet,
  type ResolvedFragment,
} from './resolve.js';
