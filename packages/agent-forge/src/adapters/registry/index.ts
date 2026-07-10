// The by-name HarnessAdapter registry: the ONE selection point a projection
// consumer uses to obtain a harness adapter WITHOUT importing a concrete
// `adapters/<harness>` module. `adapterByName('claude' | 'codex')` returns the
// wired `HarnessAdapter`; an unknown name throws.
//
// This is the only module that names the concrete harness adapters; a consumer
// (agent-anatomy's project CLIs) depends solely on the `HarnessAdapter` port and
// this selector, so adding a harness never edits the consumer.

import type { HarnessAdapter } from '../../core/index.js';
import { claudeHarnessAdapter } from '../claude/index.js';
import { codexHarnessAdapter } from '../codex/index.js';

export type { HarnessAdapter } from '../../core/index.js';
export type {
  HarnessProjection,
  HarnessHooksProjection,
} from '../../core/index.js';
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
