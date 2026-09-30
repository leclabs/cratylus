// A TEST-LOCAL ADAPTER for the two degradation paths no supported harness
// exhibits. claude and omp both scope every event they realize, and both preload
// skills natively, so the `unscopable` loss and the declaration-only skill
// closure have no witness among the harnesses that ship. The seam still owns
// those laws, and a law with no witness is a law nobody would notice breaking.
//
// It is claude's adapter with exactly two capabilities withdrawn:
//
//   scopes          — nothing. It fires every event claude fires and can narrow
//                     none of them to an agent: `realizes ∧ ¬scopes`.
//   preloadsSkills  — false. The closure is rendered as a `## Required reading`
//                     section closing the definition instead of a `skills` field.
//
// Nothing else differs, so a divergence from claude in a test is caused by one of
// those two withdrawals and by nothing else.

import { claudeHarnessAdapter } from '../../src/adapters/claude/render.js';
import type { HarnessAdapter } from '../../src/core/harness-adapter.js';

export const SHORTFALL = 'shortfall';

export const shortfallAdapter: HarnessAdapter = {
  ...claudeHarnessAdapter,
  name: SHORTFALL,
  preloadsSkills: false,
  scopes: () => false,
  agentDef: (agent, ctx) => {
    const { skills, ...withoutSkills } = agent;
    const { filename, content } = claudeHarnessAdapter.agentDef(
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
