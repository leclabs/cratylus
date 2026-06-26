import type { Learning } from '@leclabs/koine/anatomy';

export const staticFrozen: Learning = {
  organ: 'learning',
  slug: 'static-frozen',
  definiens: `No persistence across runs; behavior fixed by prompt/weights at deploy time, identical every session, lessons never retained.`,
};
