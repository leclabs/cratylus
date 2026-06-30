import type { EngineeringPrinciples } from '@leclabs/agent-forge/anatomy';

export const separationOfConcerns: EngineeringPrinciples = {
  organ: 'engineering-principles',
  slug: 'separation-of-concerns',
  definiens: `Keep each module responsible for one concern; isolate orthogonal concerns behind clean interfaces so a change to one does not ripple into others.`,
};
