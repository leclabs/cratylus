// pnpm --filter cratylus exec vitest run --config ../../design/judgment/workflow/check-quality/vitest.sweep.config.ts
import { fileURLToPath } from 'node:url';
export default {
  root: fileURLToPath(new URL('.', import.meta.url)),
  resolve: {
    alias: {
      '@cratylus/runtime': fileURLToPath(
        new URL('../../../../packages/runtime/dist/index.js', import.meta.url),
      ),
    },
  },
  test: { include: ['sweep.test.ts'], fileParallelism: false },
};
