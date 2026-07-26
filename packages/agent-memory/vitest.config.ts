import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Clears the harness session env the parent process exports; see setup.ts.
    setupFiles: ['./test/setup.ts'],
  },
});
