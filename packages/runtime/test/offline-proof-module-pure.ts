import type { BehavioralCheck } from '../src/index.js';

// Reads nothing from the host, at module scope or while judging.
export const check: BehavioralCheck<{ text: string }> = {
  example: 'say hello to the customer',
  assertions: [{ id: 'greets', binds: ['say hello'] }],
  judge: ({ text }) => ({ greets: /^hello$/i.test(text) }),
};
