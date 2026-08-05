// The ZERO-CONFIG corpus catalog path — `cratylus catalog --corpus <dir>` with no
// `agents.config.ts` anywhere. This is what a NEW consumer hits first, and it became
// load-bearing at fb944d2: a missing catalog used to fall back to a resident default,
// and now REFUSES, so both of these branches went from unreachable to first-contact.
//
// `corpusManifest` has three branches; `cli/explain.test.ts` covers only the first
// (config present → `mergeManifest(config.extends)`). These are the other two:
//
//  · BRANCH 2 — no config ⇒ read the catalog off the corpus package's own entry
//    module (`<corpus>/../index.ts`, the sibling of its `dimensions/` dir).
//  · BRANCH 3 — no config AND no entry-module catalog ⇒ REFUSE, naming the corpus
//    and BOTH remedies.
//
// Both drive the real CLI entry `runCatalog`, not `corpusManifest`: the defect is that
// a USER-REACHABLE path has no test, and a unit test of its helper does not discharge
// that. The ABSENT config is the load-bearing half of the fixture — with one present,
// branch 1 answers and neither of these ever runs — so each test asserts the absence
// at the exact path the CLI probes (`<cwd>/agents.config.ts`) rather than assuming it.

import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runCatalog } from '../../src/cli/commands/catalog.js';
import { CONFIG_FILE } from '../../src/config/scaffold.js';

/**
 * A catalog NO other corpus in this repo declares — `veridicality`/`plumbline` appear
 * nowhere else in the tree. So a dimension name in the rendered output can only have
 * come from THIS fixture's entry module, never from a config the CLI found elsewhere.
 */
const ZEROCONF_ANATOMY = {
  veridicality: {
    axis: 'Constitution',
    repertoire: 'latent',
    arity: 'scalar',
  },
  plumbline: { axis: 'Persona', repertoire: 'curated', arity: 'set' },
};

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

/** Capture console.log + stdout + console.error while running `fn`. */
async function capture(fn: () => Promise<number>): Promise<{
  rc: number;
  out: string;
  err: string;
}> {
  const logs: string[] = [];
  const errs: string[] = [];
  const stdout: string[] = [];
  const lspy = vi
    .spyOn(console, 'log')
    .mockImplementation((...a) => void logs.push(a.join(' ')));
  const espy = vi
    .spyOn(console, 'error')
    .mockImplementation((...a) => void errs.push(a.join(' ')));
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
    lspy.mockRestore();
    espy.mockRestore();
    wspy.mockRestore();
  }
  return { rc, out: [...logs, ...stdout].join('\n'), err: errs.join('\n') };
}

describe('catalog — the ZERO-CONFIG corpus path (no agents.config.ts)', () => {
  let cwd: string;
  let dimensions: string;

  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), 'forge-zeroconf-'));
    // The fixture corpus PACKAGE: `<cwd>/corpus/{index.ts,dimensions/}`. The entry
    // module is the sibling of the dimensions dir — the self-location `corpusManifest`
    // assumes when no config names the plugins.
    dimensions = join(cwd, 'corpus', 'dimensions');
    writeModule(
      dimensions,
      'veridicality',
      'ground-truth',
      "export const groundTruth = 'ground-truth';\n",
    );
    writeModule(
      dimensions,
      'plumbline',
      'true-vertical',
      "export const trueVertical = 'true-vertical';\n",
    );
  });
  afterEach(() => rmSync(cwd, { recursive: true, force: true }));

  /** The branch-1 predicate, negated: the exact path `runCatalog` probes is absent. */
  const assertNoDiscoverableConfig = (): void => {
    expect(
      existsSync(join(cwd, CONFIG_FILE)),
      'a discoverable config would send this down branch 1 and cover nothing',
    ).toBe(false);
  };

  it('resolves the catalog from the corpus entry module when there is no config', async () => {
    writeFileSync(
      join(cwd, 'corpus', 'index.ts'),
      [
        `export default { name: 'zeroconf', manifest: ${JSON.stringify(ZEROCONF_ANATOMY)} };`,
        '',
      ].join('\n'),
    );
    assertNoDiscoverableConfig();

    const { rc, out, err } = await capture(() =>
      runCatalog({ corpus: dimensions, cwd }),
    );
    expect(err).toBe('');
    expect(rc).toBe(0);

    // The catalog came from the ENTRY MODULE: these dimension names exist in no
    // other corpus in this repo, so no config could have supplied them.
    expect(out).toContain('veridicality');
    expect(out).toContain('plumbline');
    // …joined with the discovered value bodies, and with the metadata the entry
    // module declared (axis · repertoire · arity), which is the half only it can supply.
    expect(out).toContain('ground-truth');
    expect(out).toContain('true-vertical');
    expect(out).toContain('Constitution · latent · scalar');
    expect(out).toContain('Persona · curated · set');
    expect(out).toContain('2 dimensions, 2 values');
  });

  it('--json emits the entry-module catalog as the machine contract', async () => {
    writeFileSync(
      join(cwd, 'corpus', 'index.ts'),
      [
        `export default { name: 'zeroconf', manifest: ${JSON.stringify(ZEROCONF_ANATOMY)} };`,
        '',
      ].join('\n'),
    );
    assertNoDiscoverableConfig();

    const { rc, out } = await capture(() =>
      runCatalog({ corpus: dimensions, cwd, json: true }),
    );
    expect(rc).toBe(0);
    expect(JSON.parse(out)).toEqual([
      {
        dimension: 'veridicality',
        axis: 'Constitution',
        repertoire: 'latent',
        arity: 'scalar',
        values: ['ground-truth'],
      },
      {
        dimension: 'plumbline',
        axis: 'Persona',
        repertoire: 'curated',
        arity: 'set',
        values: ['true-vertical'],
      },
    ]);
  });

  it('REFUSES when neither a config nor the entry module declares a catalog, and says how to fix it', async () => {
    // No entry module beside the dimensions dir at all: the corpus declares no
    // catalog anywhere the CLI can reach.
    assertNoDiscoverableConfig();
    expect(existsSync(join(cwd, 'corpus', 'index.ts'))).toBe(false);

    const { rc, out, err } = await capture(() =>
      runCatalog({ corpus: dimensions, cwd }),
    );
    expect(rc).toBe(1);
    // It REFUSED — nothing was rendered in place of the census.
    expect(out).not.toContain('veridicality');

    // The CONTENT is the whole value of the refusal: a message that rots into
    // uselessness still throws. It must name the CORPUS…
    expect(err).toContain(dimensions);
    // …and BOTH remedies: declare the catalog on the corpus plugin, or pass --config.
    expect(err).toContain('declare');
    expect(err).toContain('manifest');
    expect(err).toContain('--config');
  });

  it('REFUSES the same way when the entry module exists but exports no plugin', async () => {
    // The other shape of "no catalog on the entry module": the module is there and
    // resolvable, but carries no default export to read a `manifest` off.
    writeFileSync(
      join(cwd, 'corpus', 'index.ts'),
      "export const notAPlugin = 'nothing to read a catalog from';\n",
    );
    assertNoDiscoverableConfig();

    const { rc, err } = await capture(() =>
      runCatalog({ corpus: dimensions, cwd }),
    );
    expect(rc).toBe(1);
    expect(err).toContain(dimensions);
    expect(err).toContain('manifest');
    expect(err).toContain('--config');
  });

  it('REFUSES with the CLI remedy when the plugin is there but the catalog is not', async () => {
    // THE LIKELIEST ZERO-CONFIG MISTAKE, and it used to draw the LEAST useful
    // refusal. A corpus package that exports a plugin and forgot `manifest` once
    // satisfied the `loaded.default` guard, so `mergeManifest` refused first — a
    // correct message for core, naming the plugins and the `manifest` remedy, but
    // structurally unable to mention `--config`, since a CLI flag has no business
    // in a function four call sites share.
    writeFileSync(
      join(cwd, 'corpus', 'index.ts'),
      "export default { name: 'corpus' };\n",
    );
    assertNoDiscoverableConfig();

    const { rc, err } = await capture(() =>
      runCatalog({ corpus: dimensions, cwd }),
    );
    expect(rc).toBe(1);
    expect(err).toContain(dimensions);
    // BOTH remedies. Asserting `--config` is the whole point: without it this
    // passes against the core refusal, which is the state being fixed.
    expect(err).toContain('manifest');
    expect(err).toContain('--config');
  });
});
