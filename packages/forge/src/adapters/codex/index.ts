// The codex harness surface. This barrel is PROJECTION-ONLY: the IR `Adapter`
// (detect/read/write) it used to also export was deleted along with the rest of
// the IR-intake lineage.

// The anatomy→codex projection — the second harness, proving canon reaches
// every forge harness for free. The composed Target body is harness-neutral,
// so the `ResolvedSkill` shape is shared with the claude adapter.
export {
  type ResolvedSkill,
  agentToCodexToml,
  agentToCodexTomlObject,
  skillToCodexMd,
  codexAgentsMd,
  codexHarnessAdapter,
} from './render.js';

// The canonical→native event map, and the ACT bindings beside it (an act's native
// pair, including the loss codex declares where it cannot narrow). Exported so a
// corpus gate can assert every key is a declared member — and that the loss is
// SPOKEN — without reaching past the barrel into the module.
export {
  canonicalToCodex,
  canonicalActToCodex,
  codexBindingOf,
} from './events.js';
