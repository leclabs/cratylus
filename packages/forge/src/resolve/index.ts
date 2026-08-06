// The `resolve/` public surface. `plugin.ts` mints the plugin CONTRACT; the
// ordered-fold resolver (extends / patches / replace·append·merge·force) joins it
// here.
export { type AgentPlugin, defineAgentPlugin } from './plugin.js';
export {
  type ContributionSource,
  DanglingReferenceError,
  type Fragment,
  type FragmentContribution,
  ForcePriorityTieError,
  IllegalOpForValueShapeError,
  type LoadedPlugin,
  MissingExtendsTargetError,
  type PatchEntry,
  type PatchOp,
  ReferenceCycleError,
  resolve,
  type ResolveConfig,
  type ResolvedAgentSet,
  type ResolvedFragment,
  type ValueShape,
} from './resolve.js';
