// Run from the repository root with the CLI package's vitest installation:
// pnpm --filter cratylus exec vitest run --config ../../design/judgment/workflow/concept-journal/vitest.config.ts
// An explicit, judgment-only root keeps these cases out of package test discovery.
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
