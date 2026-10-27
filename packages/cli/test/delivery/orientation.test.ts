// The bare command's orientation, from the built command.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

const bin = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../dist/cratylus.js',
);

it('delivery/orientation: starts with the business analyst', () => {
  expect(existsSync(bin), `${bin} is built`).toBe(true);
  const scratch = mkdtempSync(join(tmpdir(), 'orientation-'));
  try {
    const r = spawnSync(process.execPath, [bin], {
      cwd: scratch,
      encoding: 'utf8',
      timeout: 30_000,
    });
    if (r.error) throw r.error;
    expect(r.status, r.stderr).toBe(0);
    expect(r.stdout).toMatch(
      /\bstart\b[^\n]*`?omp --agent business-analyst`?/i,
    );
    expect(
      [...r.stdout.matchAll(/omp --agent ([\w-]+)/g)].map((m) => m[1]),
      'no other agent is named to start with',
    ).toEqual(['business-analyst']);
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
});
