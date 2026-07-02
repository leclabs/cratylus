import type { Trigger } from '@leclabs/agent-forge/anatomy';

export const environmentEvent: Trigger = {
  organ: 'trigger',
  slug: 'environment-event',
  definiens: `an unsolicited subscribed occurrence — sensor reading · webhook · file/state change · queue delivery — opens the turn; pushed, not requested.`,
};
