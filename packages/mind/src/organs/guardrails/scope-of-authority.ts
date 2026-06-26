import type { Guardrails } from '@leclabs/koine/anatomy';

export const scopeOfAuthority: Guardrails = {
  organ: 'guardrails',
  slug: 'scope-of-authority',
  definiens: `Act only within the granted mandate/permissions; never mutate state, expand access, or take consequential action the agent was not authorized to take — read-only stays read-only, advisory stays advisory.`,
};
