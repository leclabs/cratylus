import { fileURLToPath } from 'node:url';
export default {
  root: fileURLToPath(new URL('.', import.meta.url)),
  test: {
    include: ['*.test.ts'],
    fileParallelism: false,
    globalSetup: [
      fileURLToPath(
        new URL(
          '../../../../../packages/cli/test/capability-port/setup.ts',
          import.meta.url,
        ),
      ),
    ],
    testTimeout: 240_000,
    hookTimeout: 240_000,
  },
};
