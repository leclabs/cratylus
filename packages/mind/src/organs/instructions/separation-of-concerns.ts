import type { Instructions } from '@leclabs/koine/anatomy';

export const separationOfConcerns: Instructions = {
  organ: 'instructions',
  slug: 'separation-of-concerns',
  definiens: `Keep each module responsible for one concern; isolate orthogonal concerns behind clean interfaces so a change to one does not ripple into others.`,
};
