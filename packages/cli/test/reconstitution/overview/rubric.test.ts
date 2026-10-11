import { fileURLToPath } from 'node:url';
import { rubricSuite } from './suite.js';
rubricSuite(fileURLToPath(new URL('.', import.meta.url)));
