// The by-name HarnessAdapter registry: the ONE selection point a projection
// consumer uses to obtain a harness adapter WITHOUT importing a concrete
// `adapters/<harness>` module. `adapterByName('claude' | 'codex')` returns the
// wired `HarnessAdapter`; an unknown name throws.
//
// This is the only module that names the concrete harness adapters; a consumer
// (agent-canon's project CLIs) depends solely on the `HarnessAdapter` port and
// this selector, so adding a harness never edits the consumer.

// Every import below is PROJECTION-SIDE by construction (S4). Each harness's
// `<harness>/index.ts` is a DUAL barrel — it exports both the IR `Adapter`
// (`detect`/`read`/`write`) and the projection `HarnessAdapter`
// (`agentDef`/`skillDef`/`hooks`) — so resolving the registry through it dragged
// the entire IR lineage (26 modules under `core/{ir,engine,serialize,adapter}/`)
// into every projection consumer. The two kinds are unrelated; this registry
// names only the anatomy module that defines the projection kind, and only the
// `core/harness-adapter.js` module that defines its port. Neither `core/index.js`
// nor `<harness>/index.js` may be reintroduced here: both are barrels over the
// IR lineage, and the reach is transitive — invisible to a substring grep.
import type { HarnessAdapter } from '../../core/harness-adapter.js';
import { claudeHarnessAdapter } from '../claude/anatomy.js';
import { codexHarnessAdapter } from '../codex/anatomy.js';

export type {
  HarnessAdapter,
  HarnessProjection,
  HarnessHooksProjection,
} from '../../core/harness-adapter.js';
// The harness-neutral resolved-skill shape a consumer builds to feed `skillDef`.
export type { ResolvedSkill } from '../../core/anatomy-body.js';

/** The canonical harness names with a registered `HarnessAdapter`. */
export type HarnessName = 'claude' | 'codex';

const REGISTRY: Record<HarnessName, HarnessAdapter> = {
  claude: claudeHarnessAdapter,
  codex: codexHarnessAdapter,
};

/** Select a `HarnessAdapter` strictly by name; throws on an unknown harness. */
export function adapterByName(name: string): HarnessAdapter {
  const adapter = REGISTRY[name as HarnessName];
  if (!adapter) {
    throw new Error(
      `unknown harness adapter '${name}' (known: ${Object.keys(REGISTRY).join(', ')})`,
    );
  }
  return adapter;
}
