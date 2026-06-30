import type { Trigger } from '@leclabs/agent-forge/anatomy';

export const environmentEvent: Trigger = {
  organ: 'trigger',
  slug: 'environment-event',
  definiens: `An unsolicited external occurrence the agent subscribed to — sensor reading, webhook, file/state change, message-queue delivery — opens the turn; pushed, not requested.`,
};
