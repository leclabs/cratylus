import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// No command in this suite may discover the operator's installation.
const home = mkdtempSync(join(tmpdir(), 'cratylus-cli-suite-'));
delete process.env.CRATYLUS_INSTALLATION;
process.env.HOME = home;
process.once('exit', () => rmSync(home, { recursive: true, force: true }));

export default {
  root: fileURLToPath(new URL('.', import.meta.url)),
  test: {
    env: { HOME: home },
    include: ['test/**/*.test.ts'],
    globalSetup: ['test/capability-port/setup.ts'],
    testTimeout: 120_000,
    hookTimeout: 240_000,
  },
};
