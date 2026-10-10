// pnpm --filter cratylus exec vitest run --config ../../design/judgment/delivery/capability-port/vitest.config.ts
// Never included by any package suite. The shared setup contains no judgment cases.
import { fileURLToPath } from 'node:url';
export default {
  root: fileURLToPath(new URL('.', import.meta.url)),
  test: {
    include: ['*.test.ts'],
    globalSetup: [
      fileURLToPath(
        new URL(
          '../../../../packages/cli/test/capability-port/setup.ts',
          import.meta.url,
        ),
      ),
    ],
    fileParallelism: false,
    testTimeout: 120_000,
    hookTimeout: 240_000,
  },
};
