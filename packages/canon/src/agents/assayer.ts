import type { Agent } from '../manifest.js';
import { assayerRole } from '../roles/assayer.js';
import { holds } from '../roles/hold.js';

// The generic holder of the assayer role, named for it, and it declares nothing: everything
// it is, the role cell states. `holds` refuses an agent named for its role that declares
// anything beyond the role it holds.

export const assayer: Agent = holds(assayerRole);
