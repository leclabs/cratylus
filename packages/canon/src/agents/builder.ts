// The builder role's generic holder: the role's profile, named for the role.

import { holder } from '../compose.js';
import { builderRole } from '../roles/builder.js';

export const builder = holder(builderRole);
