// pnpm --filter cratylus exec vitest run --config ../../design/judgment/agents/catalog-recut/vitest.config.ts
// Outside package discovery; only generic consumer machinery and the master oracle are shared.
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
