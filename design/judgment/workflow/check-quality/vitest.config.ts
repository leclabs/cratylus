// pnpm --filter @cratylus/runtime exec vitest run --config ../../design/judgment/workflow/check-quality/vitest.config.ts
import { fileURLToPath } from 'node:url';
export default {
  root: fileURLToPath(new URL('.', import.meta.url)),
  test: { include: ['proof.test.ts'], fileParallelism: false },
};
