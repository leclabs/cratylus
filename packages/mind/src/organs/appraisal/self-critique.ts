import type { Appraisal } from '@leclabs/koine/anatomy';

export const selfCritique: Appraisal = {
  organ: 'appraisal',
  slug: 'self-critique',
  definiens: `agent re-reads its own output against the held intent/standard, names defects, and revises in-place before declaring done — no external oracle, no second model; reflexive self-refine loop.`,
};
