// P5 — the inspection CLI surface: `explain` (per-fragment provenance) + first-class
// `catalog` (cross-plugin fragment-id discovery), against a 2-plugin fixture where a
// consumer patch is VISIBLY attributed. Falsifiers:
//  · explain reports, per fragment, its source plugin + any applied patch + resolved value;
//  · catalog lists fragment ids across BOTH extended plugins.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runCatalog } from '../../src/cli/commands/catalog.js';
import { runExplain } from '../../src/cli/commands/explain.js';
import { FIXTURE_MANIFEST } from '../fixture-manifest.js';
import { capture } from './streams.js';

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
    // patch targets the IMPORTED node binding — addressing is the object identity
    // of the imported fragment, never a string id.
    configPath = join(cwd, 'cratylus.config.ts');
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
    const { rc, out: lines } = await capture(() =>
      runExplain({ config: configPath }),
    );
    const out = lines.join('\n');
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
    const parsed = JSON.parse(out.join('\n')) as Array<{
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
    const { rc, out, err } = await capture(() =>
      runExplain({ agent: 'guardrails', config: configPath }),
    );
    expect(rc).toBe(0);
    expect(out.join('\n')).toContain('alpha:guardrails/harm');
    expect(out.join('\n')).not.toContain('beta:role/builder');
    // The filter is explained by its result: no forward-seam note, on either stream.
    expect([...out, ...err].filter((l) => l.startsWith('note:'))).toEqual([]);
  });

  it('explain prints the report with no header and no spacer line', async () => {
    const { out, err } = await capture(() =>
      runExplain({ config: configPath }),
    );
    expect(err).toEqual([]);
    expect(out.every((l) => l.trim() !== '')).toBe(true);
    // The first line is a fragment, not a banner naming the command.
    expect(out[0]).toMatch(/^\S+:\S+ \[\w+\]$/);
  });

  it('explain [agent] that matches nothing says so on stderr, not in the result', async () => {
    const { rc, out, err } = await capture(() =>
      runExplain({ agent: 'no-such-fragment', config: configPath }),
    );
    expect(rc).toBe(0);
    expect(out).toEqual([]);
    expect(err).toEqual([
      "cratylus explain: warning: no resolved fragment id contains 'no-such-fragment'",
    ]);
  });

  it('catalog lists extendable fragment ids across BOTH extended plugins', async () => {
    const {
      rc,
      out: lines,
      err,
    } = await capture(() => runCatalog({ config: configPath, cwd }));
    const out = lines.join('\n');
    expect(rc).toBe(0);
    expect(err).toEqual([]);
    // Cross-plugin: ids from alpha AND beta, grouped by plugin.
    expect(out).toContain('alpha:guardrails/harm');
    expect(out).toContain('alpha:objective/insight');
    expect(out).toContain('beta:role/builder');
    // Grouped under a plugin line each, with no header and no spacer line.
    expect(lines.filter((l) => !l.startsWith('  '))).toEqual([
      'alpha (2)',
      'beta (1)',
    ]);
  });

  it('explain fails with one stderr line when no config is present', async () => {
    const empty = mkdtempSync(join(tmpdir(), 'forge-inspect-empty-'));
    try {
      const { rc, out, err } = await capture(() => runExplain({ cwd: empty }));
      expect(rc).toBe(1);
      expect(out).toEqual([]);
      expect(err).toHaveLength(1);
      expect(err[0]).toMatch(/^cratylus explain: no cratylus\.config\.ts at /);
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
  });
});
