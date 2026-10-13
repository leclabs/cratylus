// The assayer role's generic holder: the role's vector, named for the role.

import { holder } from '../compose.js';
import { assayerRole } from '../roles/assayer.js';

export const assayer = holder(assayerRole);
