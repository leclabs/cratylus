// The software engineer role's generic holder: the role's profile, named for the role.

import { holder } from '../compose.js';
import { softwareEngineerRole } from '../roles/software-engineer.js';

export const softwareEngineer = holder(softwareEngineerRole);
