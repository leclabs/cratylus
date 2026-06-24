import type { Percept } from '@leclabs/koine/anatomy';

export const scheduledTrigger: Percept = {
  organ: 'percept',
  slug: 'scheduled-trigger',
  definiens: `A time-based fire — cron, timer, interval, or deadline — opens the turn with no external content payload; the clock is the percept.`,
};
