// pnpm --filter cratylus exec vitest run --config ../../design/judgment/workflow/check-quality/vitest.leakage.config.ts
// Only this judgment case; never included by a package suite.
import { fileURLToPath } from 'node:url';
export default {
  root: fileURLToPath(new URL('.', import.meta.url)),
  test: {
    include: ['leakage.test.ts'],
    fileParallelism: false,
    testTimeout: 30_000,
  },
};
