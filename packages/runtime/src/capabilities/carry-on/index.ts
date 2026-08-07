// ─────────────────────────────────────────────────────────────────────────────
// The carry-on runtime CAPABILITY — the turn-end GATE that makes an elevation to
// out-of-the-loop a mechanism rather than an assertion, reached via
// `cratylus carryOn <verb>`.
//
// Packaged as a capability MODULE of `@cratylus/runtime` (a subpath module, not a
// standalone `@cratylus/*` package), exactly as the event-tap capability is. It
// depends on NOTHING from `@cratylus/forge` or `@cratylus/canon`: the plan
// vocabulary it needs arrives as configuration on its own command line.
//
// ONE SIGN, TWO REGISTERS: `carry-on` (the dir basename, the port module, the skill
// cell) and `carryOn` (the keyspace member, the dispatch word) are the kebab/camel
// faces of a single anchor.
//
// NO `runtimePlugin` INSTANCE, AND THE ABSENCE IS DELIBERATE. `event-tap` can build
// one at module scope because its host takes a whole event map and an empty map is
// a sound floor. This host needs ONE resolved native name — the harness's word for
// turn end — and the canonical event it is resolved FROM is a corpus name. A
// module-scope instance would have to spell that name in runtime source, which is
// the one thing ARCHITECTURE property 4 forbids; so the verb surface resolves it
// per invocation, from the `--event` the cell supplies and the host config the
// projection emitted.
// ─────────────────────────────────────────────────────────────────────────────

export { CARRY_ON_ID, CarryOnHostClaude } from './claude.js';
export {
  type CarryOnDispatchOpts,
  type CarryOnResult,
  type CarryOnVerb,
  dispatchCarryOn,
  gateCommand,
  layoutFromCommand,
} from './dispatch.js';
export {
  type Ground,
  type PlanLayout,
  type TerminusReadout,
  boundPlan,
  terminusOf,
} from './terminus.js';
