import type { Trigger } from '@leclabs/agent-forge/anatomy';

export const introspectionRequest: Trigger = {
  organ: 'trigger',
  slug: 'introspection-request',
  definiens: `A request for the agent to examine its own state, config, capabilities, or reasoning — self-report or self-audit — opens the turn; the subject sensed is the agent itself.`,
};
