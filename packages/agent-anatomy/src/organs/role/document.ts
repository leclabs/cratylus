import type { Role } from '@leclabs/agent-forge/anatomy';

export const document: Role = {
  organ: 'role',
  slug: 'document',
  definiens: `Owns producing reader-facing explanatory text (guides, references, ADRs, comments) that describes a system or decision; does not alter the system it describes.`,
};
