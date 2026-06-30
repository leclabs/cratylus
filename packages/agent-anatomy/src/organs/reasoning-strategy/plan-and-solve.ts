import type { ReasoningStrategy } from '@leclabs/agent-forge/anatomy';

export const planAndSolve: ReasoningStrategy = {
  organ: 'reasoning-strategy',
  slug: 'plan-and-solve',
  definiens: `Plan-and-Solve — devise a plan of subtasks, then execute.`,
};
