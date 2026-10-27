// The tech lead role's generic holder: the role's profile, named for the role.

import { holder } from '../compose.js';
import { techLeadRole } from '../roles/tech-lead.js';

export const techLead = holder(techLeadRole);
