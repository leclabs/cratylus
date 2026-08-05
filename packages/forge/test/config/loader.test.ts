// P4 — the config-is-code loader + THE LOAD STEP (AgentPlugin dirs → LoadedPlugin
// → resolve()). Proves:
//  (1) the load step lifts each discovered fragment → a `replace` contribution and
//      resolve() yields the fragment values (ordered fold, plugin order preserved);
//  (2) an `agents.config.ts` (TS/ESM) loads with NO build step and resolves through
//      the same path — with `extends` as a REAL cross-module import;
//  (3) `extends: [canon]` (the real canon dimensions) resolves to the canon
//      default fragment set.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  type AgentsConfig,
  composeFromFile,
  loadPlugins,
  resolveAgentsConfig,
} from '../../src/config/index.js';
import type { AgentPlugin } from '../../src/resolve/plugin.js';
import { resolve } from '../../src/resolve/resolve.js';
import { FIXTURE_MANIFEST } from '../fixture-manifest.js';

/** The real canon corpus dimensions dir, located relative to this test file. */
const CANON_DIMENSIONS = fileURLToPath(
  new URL('../../../canon/src/dimensions', import.meta.url),
);

/** Write `export const <name> = '<body>'` under `<dir>/<dimension>/<file>.ts`. */
function writeStringFragment(
  dir: string,
  dimension: string,
  file: string,
  name: string,
  body: string,
): void {
  const d = join(dir, dimension);
  mkdirSync(d, { recursive: true });
  writeFileSync(
    join(d, `${file}.ts`),
    `export const ${name} = ${JSON.stringify(body)};\n`,
  );
}

describe('loadPlugins — THE LOAD STEP (AgentPlugin dirs → LoadedPlugin)', () => {
  it('lifts each discovered fragment → a replace contribution; resolve() folds them', async () => {
    const root = mkdtempSync(join(tmpdir(), 'forge-load-'));
    try {
      const aDir = join(root, 'a');
      const bDir = join(root, 'b');
      writeStringFragment(aDir, 'objective', 'insight', 'insight', 'insight');
      writeStringFragment(bDir, 'role', 'builder', 'builder', 'the builder');

      const plugins: AgentPlugin[] = [
        { name: 'a', manifest: FIXTURE_MANIFEST, fragments: aDir },
        { name: 'b', fragments: bDir },
      ];
      const loaded = await loadPlugins(plugins);

      // Order preserved; every contribution is an originating `replace`.
      expect(loaded.map((p) => p.name)).toEqual(['a', 'b']);
      const allOps = loaded.flatMap((p) => p.contributions.map((c) => c.op));
      expect(new Set(allOps)).toEqual(new Set(['replace']));

      // resolve() folds them → the fragment bodies become the resolved values.
      const set = resolve({ extends: loaded });
      const byId = new Map(
        [...set.fragments.values()].map((r) => [r.fragment.id, r.value]),
      );
      expect(byId.get('a:objective/insight')).toBe('insight');
      expect(byId.get('b:role/builder')).toBe('the builder');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('a plugin with no fragments dir keeps its extends position (empty contributions)', async () => {
    const root = mkdtempSync(join(tmpdir(), 'forge-load-empty-'));
    try {
      const aDir = join(root, 'a');
      writeStringFragment(aDir, 'objective', 'insight', 'insight', 'insight');
      const loaded = await loadPlugins([
        { name: 'nofrag' },
        { name: 'a', manifest: FIXTURE_MANIFEST, fragments: aDir },
      ]);
      expect(loaded.map((p) => p.name)).toEqual(['nofrag', 'a']);
      expect(loaded[0]?.contributions).toEqual([]);
      expect(loaded[1]?.contributions.length).toBe(1);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('agents.config.ts — loads with NO build step + resolves', () => {
  it('loads a TS/ESM config (real cross-module import) and resolves it', async () => {
    const root = mkdtempSync(join(tmpdir(), 'forge-config-'));
    try {
      // A synthetic plugin that SELF-LOCATES its fragments dir (absolute).
      writeStringFragment(
        join(root, 'frags'),
        'objective',
        'insight',
        'insight',
        'insight',
      );
      writeFileSync(
        join(root, 'plugin.ts'),
        [
          "import { fileURLToPath } from 'node:url';",
          'export const plugin = {',
          "  name: 'syn',",
          `  manifest: ${JSON.stringify(FIXTURE_MANIFEST)},`,
          "  fragments: fileURLToPath(new URL('./frags', import.meta.url)),",
          '};',
          '',
        ].join('\n'),
      );
      // The config is CODE: `extends` is a REAL import of the plugin object.
      writeFileSync(
        join(root, 'agents.config.ts'),
        [
          "import { plugin } from './plugin.ts';",
          'export default { extends: [plugin], patches: [] };',
          '',
        ].join('\n'),
      );

      const { config, resolved } = await composeFromFile(
        join(root, 'agents.config.ts'),
      );
      expect(config.extends.map((p) => p.name)).toEqual(['syn']);
      const byId = new Map(
        [...resolved.fragments.values()].map((r) => [r.fragment.id, r.value]),
      );
      expect(byId.get('syn:objective/insight')).toBe('insight');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('extends: [canon] — resolves to the canon default set', () => {
  it('resolves the real canon dimensions through the load step + resolve()', async () => {
    // The canon plugin self-locates to this absolute dir at runtime; the test
    // supplies the same dir directly (forge cannot bare-import the peer package).
    const canon: AgentPlugin = {
      name: 'canon',
      manifest: FIXTURE_MANIFEST,
      fragments: CANON_DIMENSIONS,
    };
    const config: AgentsConfig = { extends: [canon], patches: [] };
    const resolved = await resolveAgentsConfig(config);

    // The full canon fragment catalog resolved (141 modules in the corpus).
    expect(resolved.fragments.size).toBeGreaterThan(100);
    const byId = new Map(
      [...resolved.fragments.values()].map((r) => [r.fragment.id, r.value]),
    );
    // A known canon fragment resolved to its branded-string body.
    expect(byId.get('canon:objective/parsimony')).toBe('parsimony');
  });
});
