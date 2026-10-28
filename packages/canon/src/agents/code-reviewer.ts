// The code reviewer role's generic holder: the role's profile, named for the role.

import { holder } from '../compose.js';
import { codeReviewerRole } from '../roles/code-reviewer.js';

export const codeReviewer = holder(codeReviewerRole);
