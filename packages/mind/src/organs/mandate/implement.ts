import type { Mandate } from '@leclabs/koine/anatomy';

export const implement: Mandate = {
  organ: 'mandate',
  slug: 'implement',
  definiens: `Owns producing/modifying the artifact (code, config, content) to satisfy a spec; out of scope: deciding what to build or independently signing off on the result.`,
};
