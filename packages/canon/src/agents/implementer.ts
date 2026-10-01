import type { Agent } from '../manifest.js';
import { holds } from '../roles/hold.js';
import { implementerRole } from '../roles/implementer.js';

// The generic holder of the implementer role, named for it, and it declares nothing: everything
// it is, the role cell states. `holds` refuses an agent named for its role that declares
// anything beyond the role it holds.

export const implementer: Agent = holds(implementerRole);
