import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runInit } from '../../src/cli/commands/init.js';
import {
  DEFAULT_PLUGIN_PACKAGE,
  resolveAgentsConfig,
} from '../../src/config/index.js';
import type { AgentPlugin } from '../../src/resolve/plugin.js';
import { FIXTURE_MANIFEST } from '../fixture-manifest.js';

/** The real canon corpus dimensions dir — the default plugin's fragment source. */
const CANON_DIMENSIONS = fileURLToPath(
  new URL('../../../canon/src/dimensions', import.meta.url),
);

describe('CLI commands (integration)', () => {
  let cwd: string;

  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), 'forge-cli-'));
  });
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  it('init scaffolds a project from the default plugin, resolvable through resolve()', async () => {
    // (1) init on an empty dir scaffolds the config-is-code home whose zero-config
    // default `extends: [canon]` — the default is A PACKAGE, not a baked template.
    //
    // AMENDED (t-canon-package-default): the literal '@cratylus/canon' used to be
    // asserted here as the corpus `init` could only ever scaffold. It is read off
    // `DEFAULT_PLUGIN_PACKAGE` now, because the scaffold takes an override
    // (`scaffoldAgentsConfig(cwd, { plugin })`); the default value itself stays
    // gated in test/config/scaffold.test.ts, where the override is also proven.
    // What this line pins is unchanged: what `init` with no arguments produces.
    const code = await runInit({ cwd });
    expect(code).toBe(0);
    const configSrc = readFileSync(join(cwd, 'agents.config.ts'), 'utf8');
    expect(configSrc).toContain(
      `import canon from '${DEFAULT_PLUGIN_PACKAGE}'`,
    );
    expect(configSrc).toMatch(/extends:\s*\[canon\]/);
    expect(configSrc).toMatch(/patches:\s*\[\]/);

    // (2) that default plugin resolves through the NORMAL resolve() with empty
    // patches → the canon default fragment set: the defaults ARE a package, reached
    // like any other plugin rather than baked into the CLI. The
    // canon plugin self-locates its dirs at runtime; the test supplies the same
    // dir directly (forge cannot bare-import the peer package).
    const canon: AgentPlugin = {
      name: 'canon',
      manifest: FIXTURE_MANIFEST,
      fragments: CANON_DIMENSIONS,
    };
    const resolved = await resolveAgentsConfig({
      extends: [canon],
      patches: [],
    });
    expect(resolved.fragments.size).toBeGreaterThan(100);
    const byId = new Map(
      [...resolved.fragments.values()].map((r) => [r.fragment.id, r.value]),
    );
    expect(byId.get('canon:objective/parsimony')).toBe('parsimony');
  });

  it('init is idempotent: an existing agents.config.ts is left untouched', async () => {
    // The old `init` refused a second run because `.forge/` already
    // existed. With the IR home gone, `init` is exactly the config scaffold,
    // and the scaffold is idempotent rather than refusing.
    expect(await runInit({ cwd })).toBe(0);
    const first = readFileSync(join(cwd, 'agents.config.ts'), 'utf8');
    expect(await runInit({ cwd })).toBe(0);
    expect(readFileSync(join(cwd, 'agents.config.ts'), 'utf8')).toBe(first);
  });

  it('init writes no .forge/ IR home', async () => {
    expect(await runInit({ cwd })).toBe(0);
    expect(existsSync(join(cwd, '.forge'))).toBe(false);
  });
});
