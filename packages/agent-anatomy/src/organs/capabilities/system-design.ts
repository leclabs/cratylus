import type { Capabilities } from '@leclabs/agent-forge/anatomy';

export const systemDesign: Capabilities = {
  organ: 'capabilities',
  slug: 'system-design',
  definiens: `decide structure ahead of code: components + contracts · patterns + boundaries · architecture documented (C4/ADR) for others to build against.`,
};
