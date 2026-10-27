// The test engineer role's generic holder: the role's profile, named for the role.

import { holder } from '../compose.js';
import { testEngineerRole } from '../roles/test-engineer.js';

export const testEngineer = holder(testEngineerRole);
