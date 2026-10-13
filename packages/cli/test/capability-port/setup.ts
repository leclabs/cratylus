// Pack once per Vitest invocation, without lifecycle scripts or writes to dist.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('../../../..', import.meta.url));

export default function setup(project: {
  provide(key: string, value: string): void;
}) {
  const root = mkdtempSync(join(tmpdir(), 'capability-pack-'));
  try {
    for (const directory of ['schema', 'runtime', 'forge', 'canon', 'cli']) {
      execFileSync(
        'pnpm',
        ['--ignore-scripts', 'pack', '--pack-destination', root],
        {
          cwd: join(repositoryRoot, 'packages', directory),
          encoding: 'utf8',
          env: { ...process.env, npm_config_ignore_scripts: 'true' },
        },
      );
    }
    const prefix = join(root, 'installed');
    const install = (preference: string) =>
      execFileSync(
        'npm',
        [
          'install',
          '--prefix',
          prefix,
          preference,
          '--ignore-scripts',
          '--no-audit',
          '--no-fund',
          ...readdirSync(root)
            .filter((f) => f.endsWith('.tgz'))
            .map((f) => join(root, f)),
        ],
        { cwd: root, encoding: 'utf8', timeout: 180_000, stdio: 'pipe' },
      );
    try {
      install('--prefer-offline');
    } catch (error) {
      // Cached registry metadata may predate a locked version. Refresh metadata,
      // not package code; npm still installs the exact same publishable tarballs.
      if (!(error instanceof Error) || !String(error).includes('ETARGET'))
        throw error;
      install('--prefer-online');
    }
    project.provide('capabilityPrefix', prefix);
    return () => rmSync(root, { recursive: true, force: true });
  } catch (error) {
    rmSync(root, { recursive: true, force: true });
    throw error;
  }
}
