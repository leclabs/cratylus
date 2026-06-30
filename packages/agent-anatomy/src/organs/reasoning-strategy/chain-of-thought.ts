import type { ReasoningStrategy } from '@leclabs/agent-forge/anatomy';

export const chainOfThought: ReasoningStrategy = {
  organ: 'reasoning-strategy',
  slug: 'chain-of-thought',
  definiens: `CoT — reason in explicit intermediate steps.`,
};
