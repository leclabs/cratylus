// First-class hook cells that forge projects from the canon catalog. Source truth
// lives in `src/hooks/*.ts`; this module is the composition root naming the
// concrete cells. Forge selects the adapter, serializes the hook configuration,
// and stages each cell's VERBATIM worker payload under `hooks/<id>/`.
//
// The cell shapes are the schema's type kernel (`@cratylus/schema`); this
// module is the composition root that NAMES the concrete cells and nothing more.
// It used to also LIFT them to the `Hook` IR here, which forced a command string to
// exist before any adapter was chosen. The lift is the projector's, per adapter,
// from `HarnessAdapter.hookCommand`.

import { deployDriftNotice } from './hooks/deploy-drift-notice.js';
import type { HookCell } from './manifest.js';

/** The harness-substrate hook cells forge projects into the host config + hooks/<id>/. */
export const harnessHookCells: readonly HookCell[] = [
  deployDriftNotice,
];
