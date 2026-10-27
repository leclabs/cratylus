// The business analyst role's generic holder: the role's profile, named for the role.

import { holder } from '../compose.js';
import { businessAnalystRole } from '../roles/business-analyst.js';

export const businessAnalyst = holder(businessAnalystRole);
