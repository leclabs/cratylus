// A test-local adapter with three capabilities withdrawn from omp: it cannot scope
// events, preload skills natively, or start an agent in a worktree. The adapter seam
// must preserve those distinctions even though the shipped implementation has them.

import { ompHarnessAdapter } from '../../src/adapters/omp/render.js';
import type { HarnessAdapter } from '../../src/core/harness-adapter.js';

export const SHORTFALL = 'shortfall';

export const shortfallAdapter: HarnessAdapter = {
  ...ompHarnessAdapter,
  name: SHORTFALL,
  preloadsSkills: false,
  startsInWorktree: false,
  scopes: () => false,
  agentDef: (agent, ctx) => {
    const { skills, isolation: _isolation, ...withoutSkills } = agent;
    const { filename, content } = ompHarnessAdapter.agentDef(
      withoutSkills,
      ctx,
    );
    if (!skills?.length) return { filename, content };
    const reading = skills.map((s) => `- \`${s}\``).join('\n');
    return {
      filename,
      content: `${content.replace(/\n+$/, '')}\n\n## Required reading\n\n${reading}\n`,
    };
  },
};
