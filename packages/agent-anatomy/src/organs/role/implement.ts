import type { Role } from '@leclabs/agent-forge/anatomy';

export const implement: Role = {
  organ: 'role',
  slug: 'implement',
  definiens: `Owns producing/modifying the artifact (code, config, content) to satisfy a spec; out of scope: deciding what to build or independently signing off on the result.`,
};
