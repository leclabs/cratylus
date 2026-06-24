import type { Appraisal } from '@leclabs/koine/anatomy';

export const verifierModel: Appraisal = {
  organ: 'appraisal',
  slug: 'verifier-model',
  definiens: `a dedicated checker model trained/specialized to detect a specific failure class (hallucination, unsafety, factuality, policy) emits a calibrated accept/reject signal.`,
};
