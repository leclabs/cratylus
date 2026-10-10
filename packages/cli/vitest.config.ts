import { fileURLToPath } from 'node:url';

export default {
  root: fileURLToPath(new URL('.', import.meta.url)),
  test: {
    include: ['test/**/*.test.ts'],
    globalSetup: ['test/capability-port/setup.ts'],
    testTimeout: 120_000,
    hookTimeout: 240_000,
  },
};
