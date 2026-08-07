// The by-name HarnessAdapter registry: the ONE selection point a projection
// consumer uses to obtain a harness adapter WITHOUT importing a concrete
// `adapters/<harness>` module. `adapterByName('claude' | 'codex')` returns the
// wired `HarnessAdapter`; an unknown name throws.
//
// This is the only module that names the concrete harness adapters; a consumer
// (canon's project CLIs) depends solely on the `HarnessAdapter` port and
// this selector, so adding a harness never edits the consumer.

// Every import below names a DEFINING module, never a barrel. Historically this
// mattered acutely: each `<harness>/index.ts` was a DUAL barrel exporting both an
// IR `Adapter` (`detect`/`read`/`write`) and the projection `HarnessAdapter`
// (`agentDef`/`skillDef`/`hooks`), so resolving the registry through it dragged
// the entire IR lineage (26 modules under `core/{ir,engine,serialize,adapter}/`)
// into every projection consumer — a transitive reach invisible to a substring
// grep. That whole lineage — its core, its CLI verbs, and fifteen unused harness
// adapters — has since been deleted, and the harness barrels are projection-only
// now, but the rule stands on its own: import the module that DEFINES the symbol,
// so no future barrel can silently re-create the edge.
import type { HarnessAdapter } from '../../core/harness-adapter.js';
import { claudeHarnessAdapter } from '../claude/render.js';
import { codexHarnessAdapter } from '../codex/render.js';
import { ompHarnessAdapter } from '../omp/render.js';

export type {
  HarnessAdapter,
  HarnessProjection,
  HarnessHooksProjection,
} from '../../core/harness-adapter.js';
// The harness-neutral resolved-skill shape a consumer builds to feed `skillDef`.
export type { ResolvedSkill } from '../../core/body.js';

/** The canonical harness names with a registered `HarnessAdapter`. */
export type HarnessName = 'claude' | 'codex' | 'omp';

const REGISTRY: Record<HarnessName, HarnessAdapter> = {
  claude: claudeHarnessAdapter,
  codex: codexHarnessAdapter,
  omp: ompHarnessAdapter,
};

/** Every registered harness name — the registry's OWN key set, so a command that
 *  enumerates harnesses cannot fall behind the registry that defines them. */
export const HARNESS_NAMES = Object.keys(REGISTRY) as readonly HarnessName[];

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
