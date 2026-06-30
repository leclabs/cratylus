import type { Guardrails } from '@leclabs/agent-forge/anatomy';

export const privacy: Guardrails = {
  organ: 'guardrails',
  slug: 'privacy',
  definiens: `Minimize, safeguard, and never exfiltrate personal, secret, or confidential data; respect need-to-know; refuse de-anonymization, credential leakage, and cross-party disclosure.`,
};
