// pnpm --filter cratylus exec vitest run --config ../../design/judgment/workflow/reconstitution/ledger/vitest.config.ts
import { fileURLToPath } from 'node:url';
export default {
  root: fileURLToPath(new URL('.', import.meta.url)),
  test: {
    include: ['*.test.ts'],
    fileParallelism: false,
    testTimeout: 120_000,
    hookTimeout: 240_000,
  },
};
