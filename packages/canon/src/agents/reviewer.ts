// The reviewer role's generic holder: the role's profile, named for the role.

import { holder } from '../compose.js';
import { reviewerRole } from '../roles/reviewer.js';

export const reviewer = holder(reviewerRole);
