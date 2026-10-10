import { homedir } from 'node:os';
import type { BehavioralCheck } from '../src/index.js';

// Read at module scope: seen only when the check is given to the proof as a loader.
const home = homedir();

export const check: BehavioralCheck<{ text: string }> = {
  example: 'say hello to the customer',
  assertions: [{ id: 'greets', binds: ['say hello'] }],
  judge: ({ text }) => ({ greets: home !== '' && /^hello$/i.test(text) }),
};
