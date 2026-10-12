import { fileURLToPath } from 'node:url';
export default {
  root: fileURLToPath(new URL('.', import.meta.url)),
  test: {
    include: ['freeze.test.ts', 'proof.test.ts'],
    fileParallelism: false,
    testTimeout: 120_000,
  },
};
