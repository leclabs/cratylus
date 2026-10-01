import type { Agent } from '../manifest.js';
import { holds } from '../roles/hold.js';
import { integratorRole } from '../roles/integrator.js';

// The generic holder of the integrator role, named for it, and it declares nothing: everything
// it is, the role cell states. `holds` refuses an agent named for its role that declares
// anything beyond the role it holds.

export const integrator: Agent = holds(integratorRole);
