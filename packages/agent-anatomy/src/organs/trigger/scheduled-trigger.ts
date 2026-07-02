import type { Trigger } from '@leclabs/agent-forge/anatomy';

export const scheduledTrigger: Trigger = {
  organ: 'trigger',
  slug: 'scheduled-trigger',
  definiens: `a time-based fire — cron · timer · interval · deadline — opens the turn with no content payload; the clock is the percept.`,
};
