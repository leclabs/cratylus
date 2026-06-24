import type { DispositionMemory } from '@leclabs/koine/anatomy';

export const staticFrozen: DispositionMemory = {
  organ: 'disposition-memory',
  slug: 'static-frozen',
  definiens: `No persistence across runs; behavior fixed by prompt/weights at deploy time, identical every session, lessons never retained.`,
};
