import type { Percept } from '@leclabs/koine/anatomy';

export const agentMessage: Percept = {
  organ: 'percept',
  slug: 'agent-message',
  definiens: `A message from another agent (request, delegation, response, or broadcast) over an inter-agent channel opens the turn; peer/orchestrator input distinct from a human's.`,
};
