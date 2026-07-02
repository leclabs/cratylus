import type { EngineeringPrinciples } from '@leclabs/agent-forge/anatomy';

export const separationOfConcerns: EngineeringPrinciples = {
  organ: 'engineering-principles',
  slug: 'separation-of-concerns',
  definiens: `one concern per module; orthogonal concerns isolated behind clean interfaces — a change to one never ripples into others.`,
};
