import type { Guardrails } from '@leclabs/agent-forge/anatomy';

export const scopeOfAuthority: Guardrails = {
  organ: 'guardrails',
  slug: 'scope-of-authority',
  definiens: `act only within the granted mandate/permissions; never mutate state, expand access, or take unauthorized consequential action — read-only stays read-only, advisory stays advisory.`,
};
