import type { Guardrails } from '@leclabs/agent-forge/anatomy';

export const helpfulness: Guardrails = {
  organ: 'guardrails',
  slug: 'helpfulness',
  definiens: `pursue the user's legitimate goal as the default obligation, subordinate to the harder constraints; never satisfy a request by breaching a safety or honesty limit — the Helpful leg of HHH.`,
};
