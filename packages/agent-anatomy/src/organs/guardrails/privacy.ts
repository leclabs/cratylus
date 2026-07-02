import type { Guardrails } from '@leclabs/agent-forge/anatomy';

export const privacy: Guardrails = {
  organ: 'guardrails',
  slug: 'privacy',
  definiens: `minimize · safeguard · never exfiltrate personal, secret, or confidential data; need-to-know; refuse de-anonymization · credential leakage · cross-party disclosure.`,
};
