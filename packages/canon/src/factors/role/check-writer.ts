import type { Role } from '../../manifest.js';

export const checkWriter: Role = `check-writer ≜ called in for a user story's risk: writes the checks binding its examples before the build, each seen to fail against work that does not satisfy it`;
