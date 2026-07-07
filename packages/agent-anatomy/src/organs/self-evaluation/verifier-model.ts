import type { SelfEvaluation } from '@leclabs/agent-forge/anatomy';

export const verifierModel: SelfEvaluation = `verifier-model ≜ a dedicated checker model specialized to one failure class (hallucination · unsafety · factuality · policy) emits a calibrated accept/reject signal.`;
