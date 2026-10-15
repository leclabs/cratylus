import type { Role } from '../../manifest.js';

export const builder: Role = `builder ≜ receives one task and hands over one pull request that passes every check; of the meaning it sees only its task and its story's visible examples, and it never edits an example`;
