import { fileURLToPath } from 'node:url';
import { rubricSuite } from '../overview/suite.js';
rubricSuite(fileURLToPath(new URL('.', import.meta.url)));
