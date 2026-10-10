// pnpm --filter cratylus exec vitest run --config test/check-quality/vitest.config.ts
// The sweep reads frozen recordings, not the installed-host global preflight.
import { fileURLToPath } from 'node:url';
export default {
  root: fileURLToPath(new URL('.', import.meta.url)),
  test: { include: ['sweep.test.ts'], fileParallelism: false },
};
