import type { Capabilities } from '@leclabs/agent-forge/anatomy';

export const reviewCritique: Capabilities = {
  organ: 'capabilities',
  slug: 'review-critique',
  definiens: `Adversarially evaluating an artifact (code, design, plan, or security posture): threat modeling, severity triage against standard frames, and authoring coordinate-cited findings in a structured template.`,
};
