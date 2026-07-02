import type { Trigger } from '@leclabs/agent-forge/anatomy';

export const introspectionRequest: Trigger = {
  organ: 'trigger',
  slug: 'introspection-request',
  definiens: `a request to examine own state · config · capabilities · reasoning (self-report/self-audit) opens the turn; the subject sensed is the agent itself.`,
};
