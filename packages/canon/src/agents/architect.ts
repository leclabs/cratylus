// The architect role's generic holder: the role's profile, named for the role.

import { holder } from '../compose.js';
import { architectRole } from '../roles/architect.js';

export const architect = holder(architectRole);
