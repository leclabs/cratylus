import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { architectSuite } from './suite.js';
architectSuite(dirname(fileURLToPath(import.meta.url)));
