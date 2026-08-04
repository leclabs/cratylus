// P4 — `agent-forge compose --dry-run` prints the resolved set and WRITES NOTHING.

import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runCompose } from '../../src/cli/commands/compose.js';
import { FIXTURE_ANATOMY } from '../fixture-anatomy.js';

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

describe('compose --dry-run', () => {
  let cwd: string;
  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), 'agent-forge-compose-'));
    // A self-contained config: a self-located synthetic plugin, empty patches.
    // frags/objective/insight.ts holds the fragment; the config's plugin points at it.
    const objDir = join(cwd, 'frags', 'objective');
    mkdirSync(objDir, { recursive: true });
    writeFileSync(
      join(objDir, 'insight.ts'),
      "export const insight = 'insight';\n",
    );
    writeFileSync(
      join(cwd, 'agents.config.ts'),
      [
        "import { fileURLToPath } from 'node:url';",
        `const plugin = { name: 'syn', manifest: ${JSON.stringify(FIXTURE_ANATOMY)}, fragments: fileURLToPath(new URL('./frags', import.meta.url)) };`,
        'export default { extends: [plugin], patches: [] };',
        '',
      ].join('\n'),
    );
  });
  afterEach(() => rmSync(cwd, { recursive: true, force: true }));

  it('prints the resolved set and writes nothing', async () => {
    const before = listing(cwd);
    const logs: string[] = [];
    const spy = vi.spyOn(console, 'log').mockImplementation((...a) => {
      logs.push(a.join(' '));
    });
    let rc: number;
    try {
      rc = await runCompose({
        config: join(cwd, 'agents.config.ts'),
        dryRun: true,
      });
    } finally {
      spy.mockRestore();
    }
    expect(rc).toBe(0);
    const out = logs.join('\n');
    expect(out).toContain('agent-forge compose');
    expect(out).toContain('syn:objective/insight');
    // Dry-run: the tree is byte-identical — nothing written.
    expect(listing(cwd)).toEqual(before);
  });

  it('errors (rc 1) when no config is present', async () => {
    const empty = mkdtempSync(join(tmpdir(), 'agent-forge-compose-empty-'));
    try {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const rc = await runCompose({ cwd: empty, dryRun: true });
      spy.mockRestore();
      expect(rc).toBe(1);
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
  });
});
