import type { Guardrails } from '@leclabs/agent-forge/anatomy';

export const scopeOfAuthority: Guardrails = `scope-of-authority ≜ act only within the granted mandate/permissions; never mutate state, expand access, or take unauthorized consequential action — read-only stays read-only, advisory stays advisory.`;
