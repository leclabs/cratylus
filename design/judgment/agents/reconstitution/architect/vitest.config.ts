import { fileURLToPath } from 'node:url';
export default {
  root: fileURLToPath(new URL('.', import.meta.url)),
  test: {
    include: ['architect.test.ts'],
    globalSetup: [
      fileURLToPath(
        new URL(
          '../../../../../packages/cli/test/capability-port/setup.ts',
          import.meta.url,
        ),
      ),
    ],
    fileParallelism: false,
    testTimeout: 120_000,
    hookTimeout: 240_000,
  },
};
