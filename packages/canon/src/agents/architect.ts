import type { Agent } from '../manifest.js';
import { architectRole } from '../roles/architect.js';
import { holds } from '../roles/hold.js';

// The generic holder of the architect role, named for it, and it declares nothing: everything
// it is, the role cell states. `holds` refuses an agent named for its role that declares
// anything beyond the role it holds.

export const architect: Agent = holds(architectRole);
