// The check-writer role's generic holder: the role's profile, named for the role.

import { holder } from '../compose.js';
import { checkWriterRole } from '../roles/check-writer.js';

export const checkWriter = holder(checkWriterRole);
