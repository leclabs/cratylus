// Held out: offline controls by default; EXECUTION_LIVE=1 runs five subjects.
import { fileURLToPath } from 'node:url';
import { roleSuite } from '../../../../../packages/cli/test/reconstitution/roles/suite.js';
roleSuite(fileURLToPath(new URL('.', import.meta.url)));
