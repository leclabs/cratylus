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

import type { CanonicalEvent } from './generated.js';

export type { CanonicalEvent, Hook } from './generated.js';

/**
 * Which SUBSTRATE a constraint's events fire in — the `realize`-target family.
 *
 * Lives HERE, beside the event vocabulary, because the two are one fact: an
 * event is only meaningful relative to the substrate it fires in, and the
 * refusal law is substrate-relative (an event belonging to another substrate is
 * ROUTED, not refused). It is also below `anatomy`, so a `HarnessAdapter` can
 * declare which substrate it realizes on without core reaching upward.
 */
export type Substrate = 'harness' | 'git';

/**
 * A constraint's event in harness-agnostic terms. `harness`-substrate events are
 * `CanonicalEvent`s (the vendor-neutral pivot); a git-substrate event has no
 * canonical peer yet, so the union widens by exactly that descriptor.
 */
export type SubstrateEvent = CanonicalEvent | 'vcs.commit.post';
