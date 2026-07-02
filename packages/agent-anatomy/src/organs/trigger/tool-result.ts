import type { Trigger } from '@leclabs/agent-forge/anatomy';

export const toolResult: Trigger = {
  organ: 'trigger',
  slug: 'tool-result',
  definiens: `the return/output/error of a tool the agent itself invoked opens the turn; the world's reply to a prior action.`,
};
