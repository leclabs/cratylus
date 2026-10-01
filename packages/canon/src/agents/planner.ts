import type { Agent } from '../manifest.js';
import { holds } from '../roles/hold.js';
import { plannerRole } from '../roles/planner.js';

// The generic holder of the planner role, named for it, and it declares nothing: everything
// it is, the role cell states. `holds` refuses an agent named for its role that declares
// anything beyond the role it holds.

export const planner: Agent = holds(plannerRole);
