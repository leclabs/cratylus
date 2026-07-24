// `core/hook` — the CANONICAL, HARNESS-AGNOSTIC lifecycle-event vocabulary and
// the hook record it types. This is canon, not a Claude detail: `CanonicalEvent`
// is the vendor-neutral PIVOT every harness adapter maps to and from
// (`adapters/<harness>/events.ts`), and `Hook` is the wire shape the anatomy
// `HookCell` lifts into (`hookIrOf`) before a `HarnessAdapter.hooks()` projects
// it onto a harness's native settings surface.
//
// A LEAF module by construction: it imports nothing. Everything here is derived
// from the sibling `hook.schema.json` by the sibling `generate.ts`; schema,
// generator, and emitted types move as one unit.

export type { CanonicalEvent, Hook } from './generated.js';
