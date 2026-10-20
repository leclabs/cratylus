// The lead role's generic holder: the role's profile, named for the role.

import { holder } from '../compose.js';
import { leadRole } from '../roles/lead.js';

export const lead = holder(leadRole);
