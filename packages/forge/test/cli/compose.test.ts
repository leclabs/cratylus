// `cratylus compose` prints the resolved set — one fragment to a line, nothing else
// on stdout — and WRITES NOTHING; a failure is one stderr line that says what to do.

import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runCompose } from '../../src/cli/commands/compose.js';
import { FIXTURE_MANIFEST } from '../fixture-manifest.js';
import { capture } from './streams.js';

/** Recursive listing of a dir (relative paths), to assert nothing was written. */
function listing(dir: string): string[] {
  const out: string[] = [];
  const walk = (d: string, prefix: string): void => {
    for (const e of readdirSync(d, { withFileTypes: true }).sort((a, b) =>
      a.name < b.name ? -1 : 1,
    )) {
      const rel = prefix ? `${prefix}/${e.name}` : e.name;
      out.push(rel);
      if (e.isDirectory()) walk(join(d, e.name), rel);
    }
  };
  walk(dir, '');
  return out;
}

describe('compose', () => {
  let cwd: string;
  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), 'forge-compose-'));
    // A self-contained config: a self-located synthetic plugin, empty patches.
    // frags/objective/insight.ts holds the fragment; the config's plugin points at it.
    const objDir = join(cwd, 'frags', 'objective');
    mkdirSync(objDir, { recursive: true });
    writeFileSync(
      join(objDir, 'insight.ts'),
      "export const insight = 'insight';\n",
    );
    writeFileSync(
      join(cwd, 'cratylus.config.ts'),
      [
        "import { fileURLToPath } from 'node:url';",
        `const plugin = { name: 'syn', manifest: ${JSON.stringify(FIXTURE_MANIFEST)}, fragments: fileURLToPath(new URL('./frags', import.meta.url)) };`,
        'export default { extends: [plugin], patches: [] };',
        '',
      ].join('\n'),
    );
  });
  afterEach(() => rmSync(cwd, { recursive: true, force: true }));

  it('prints only the resolved fragments, one per line, and writes nothing', async () => {
    const before = listing(cwd);
    const { rc, out, err } = await capture(() =>
      runCompose({ config: join(cwd, 'cratylus.config.ts') }),
    );
    expect(rc).toBe(0);
    // No header, no spacer, no note: every stdout line is a fragment.
    expect(out).toEqual(['syn:objective/insight  insight']);
    expect(err).toEqual([]);
    expect(listing(cwd)).toEqual(before);
  });

  it('fails with one stderr line when no config is present', async () => {
    const empty = mkdtempSync(join(tmpdir(), 'forge-compose-empty-'));
    try {
      const { rc, out, err } = await capture(() => runCompose({ cwd: empty }));
      expect(rc).toBe(1);
      expect(out).toEqual([]);
      expect(err).toHaveLength(1);
      expect(err[0]).toMatch(/^cratylus compose: no cratylus\.config\.ts at /);
      expect(err[0]).toContain('cratylus init');
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
  });
});
