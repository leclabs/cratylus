import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { architectSuite } from '../../reconstitution/architect/suite.js';
import { smokeSuite } from './smoke.js';

// Same installed subject, continuing-session transport, independent rubric judge,
// four-of-five threshold and all-runs never assertions as the shared harness.
if (process.env.EXECUTION_SMOKE !== '1')
  architectSuite(dirname(fileURLToPath(import.meta.url)));
else smokeSuite();
