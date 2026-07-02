import type { Role } from '@leclabs/agent-forge/anatomy';

export const document: Role = {
  organ: 'role',
  slug: 'document',
  definiens: `own reader-facing explanatory text — guides · references · ADRs · comments — describing a system or decision; never alters what it describes.`,
};
