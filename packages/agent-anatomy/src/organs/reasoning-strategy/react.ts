import type { ReasoningStrategy } from '@leclabs/agent-forge/anatomy';

export const react: ReasoningStrategy = {
  organ: 'reasoning-strategy',
  slug: 'react',
  definiens: `ReAct — interleave reasoning with tool/subagent actions and observations.`,
};
