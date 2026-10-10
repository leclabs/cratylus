import type { ProofFinding } from '@cratylus/runtime';

// Only the lead records findings after reporting them for an architect ruling.
export const reported: Record<string, ProofFinding[]> = {};
