import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { architectSuite } from '../../../../../packages/cli/test/reconstitution/architect/suite.js';
architectSuite(dirname(fileURLToPath(import.meta.url)));
