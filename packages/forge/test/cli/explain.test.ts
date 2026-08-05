// P5 — the inspection CLI surface: `explain` (per-fragment provenance) + first-class
// `catalog` (cross-plugin fragment-id discovery), against a 2-plugin fixture where a
// consumer patch is VISIBLY attributed. Falsifiers:
//  · explain reports, per fragment, its source plugin + any applied patch + resolved value;
//  · catalog lists fragment ids across BOTH extended plugins.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runCatalog } from '../../src/cli/commands/catalog.js';
import { runExplain } from '../../src/cli/commands/explain.js';
import { FIXTURE_MANIFEST } from '../fixture-manifest.js';

/** Write `export const <name> = <literal>;` under `<root>/<dimension>/<file>.ts`. */
function writeModule(
  root: string,
  dimension: string,
  file: string,
  source: string,
): void {
  const d = join(root, dimension);
  mkdirSync(d, { recursive: true });
  writeFileSync(join(d, `${file}.ts`), source);
}

/** Capture console.log output while running `fn`. */
async function capture(fn: () => Promise<number>): Promise<{
  rc: number;
  out: string;
}> {
  const logs: string[] = [];
  const spy = vi
    .spyOn(console, 'log')
    .mockImplementation((...a) => void logs.push(a.join(' ')));
  const stdout: string[] = [];
  const wspy = vi
    .spyOn(process.stdout, 'write')
    .mockImplementation((s: string | Uint8Array) => {
      stdout.push(String(s));
      return true;
    });
  let rc: number;
  try {
    rc = await fn();
  } finally {
    spy.mockRestore();
    wspy.mockRestore();
  }
  return { rc, out: [...logs, ...stdout].join('\n') };
}

describe('P5 inspection — explain + first-class catalog', () => {
  let cwd: string;
  let configPath: string;

  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), 'forge-inspect-'));
    // Plugin ALPHA: a node-form SET fragment `harm` (the config imports its binding
    // so a patch can target it) + a string fragment `insight`.
    writeModule(
      join(cwd, 'pluginA'),
      'guardrails',
      'harm',
      "export const harm = { id: 'alpha:guardrails/harm', valueShape: 'set' };\n",
    );
    writeModule(
      join(cwd, 'pluginA'),
      'objective',
      'insight',
      "export const insight = 'insight';\n",
    );
    // Plugin BETA: a distinct string fragment under a different dimension.
    writeModule(
      join(cwd, 'pluginB'),
      'role',
      'builder',
      "export const builder = 'the builder';\n",
    );
    // The config extends BOTH plugins and patches alpha's `harm` (append) — the
    // patch targets the IMPORTED node binding (object-import addressing, §3).
    configPath = join(cwd, 'agents.config.ts');
    writeFileSync(
      configPath,
      [
        "import { fileURLToPath } from 'node:url';",
        "import { harm } from './pluginA/guardrails/harm.ts';",
        `const alpha = { name: 'alpha', manifest: ${JSON.stringify(FIXTURE_MANIFEST)}, fragments: fileURLToPath(new URL('./pluginA', import.meta.url)) };`,
        "const beta = { name: 'beta', fragments: fileURLToPath(new URL('./pluginB', import.meta.url)) };",
        'export default {',
        '  extends: [alpha, beta],',
        "  patches: [{ target: harm, op: 'append', value: ['no-dual-use'] }],",
        '};',
        '',
      ].join('\n'),
    );
  });
  afterEach(() => rmSync(cwd, { recursive: true, force: true }));

  it('explain reports per-fragment provenance: source plugin + applied patch + value', async () => {
    const { rc, out } = await capture(() => runExplain({ config: configPath }));
    expect(rc).toBe(0);

    // Every extended fragment appears, attributed to its source plugin.
    expect(out).toContain('alpha:guardrails/harm');
    expect(out).toContain('alpha:objective/insight');
    expect(out).toContain('beta:role/builder');
    expect(out).toContain('plugin alpha');
    expect(out).toContain('plugin beta');

    // The consumer PATCH on `harm` is VISIBLY attributed, and the fold roles decode
    // "base then accumulate": the plugin `replace` is the base, the patch appends.
    expect(out).toContain('patch #0');
    expect(out).toContain('[base]');
    expect(out).toContain('[+append]');
  });

  it('explain --json emits the provenance contract with attributed patch', async () => {
    const { rc, out } = await capture(() =>
      runExplain({ config: configPath, json: true }),
    );
    expect(rc).toBe(0);
    const parsed = JSON.parse(out) as Array<{
      id: string;
      value: unknown;
      provenance: Array<{ source: { kind: string }; op: string }>;
    }>;
    const harm = parsed.find((f) => f.id === 'alpha:guardrails/harm');
    expect(harm?.value).toEqual(['no-dual-use']);
    // Fold = [plugin replace (base), patch append (accumulate)].
    expect(harm?.provenance.map((c) => c.source.kind)).toEqual([
      'plugin',
      'patch',
    ]);
    expect(harm?.provenance.at(-1)?.op).toBe('append');
  });

  it('explain [agent] filters the resolved fragments by id token', async () => {
    const { rc, out } = await capture(() =>
      runExplain({ agent: 'guardrails', config: configPath }),
    );
    expect(rc).toBe(0);
    expect(out).toContain('alpha:guardrails/harm');
    expect(out).not.toContain('beta:role/builder');
  });

  it('catalog lists extendable fragment ids across BOTH extended plugins', async () => {
    const { rc, out } = await capture(() =>
      runCatalog({ config: configPath, cwd }),
    );
    expect(rc).toBe(0);
    // Cross-plugin: ids from alpha AND beta, grouped by plugin.
    expect(out).toContain('alpha:guardrails/harm');
    expect(out).toContain('alpha:objective/insight');
    expect(out).toContain('beta:role/builder');
  });

  it('explain errors (rc 1) when no config is present', async () => {
    const empty = mkdtempSync(join(tmpdir(), 'forge-inspect-empty-'));
    try {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const rc = await runExplain({ cwd: empty });
      spy.mockRestore();
      expect(rc).toBe(1);
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
  });
});
