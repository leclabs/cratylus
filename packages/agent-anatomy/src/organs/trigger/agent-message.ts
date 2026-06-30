import type { Trigger } from '@leclabs/agent-forge/anatomy';

export const agentMessage: Trigger = {
  organ: 'trigger',
  slug: 'agent-message',
  definiens: `A message from another agent (request, delegation, response, or broadcast) over an inter-agent channel opens the turn; peer/orchestrator input distinct from a human's.`,
};
