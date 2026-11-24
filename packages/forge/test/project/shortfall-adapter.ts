// A test-local adapter built over omp's capabilities with two withdrawn or pinned:
// it cannot scope events (omp itself scopes none to an agent; pinned here so the suite
// does not depend on that), or start an agent in a worktree.
// The adapter seam must preserve those distinctions.

import { ompHarnessAdapter } from '../../src/adapters/omp/render.js';
import type { HarnessAdapter } from '../../src/core/harness-adapter.js';

export const SHORTFALL = 'shortfall';

export const shortfallAdapter: HarnessAdapter = {
  ...ompHarnessAdapter,
  name: SHORTFALL,
  startsInWorktree: false,
  scopes: () => false,
  agentDef: (agent, ctx) => {
    const { isolation: _isolation, ...rest } = agent;
    return ompHarnessAdapter.agentDef(rest, ctx);
  },
};
