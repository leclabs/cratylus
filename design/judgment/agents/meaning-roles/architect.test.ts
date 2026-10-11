import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { architectSuite } from './suite.js';

// Opt-in live execution is for judgment only; default execution proves controls.
architectSuite(dirname(fileURLToPath(import.meta.url)));
