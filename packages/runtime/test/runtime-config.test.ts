// Configured capability providers — the mechanism that makes a strategy SWAPPABLE.
//
// Before this, a provider was hardcoded in three places (a static import in the
// CLI, a KNOWN_CAPABILITY_PACKAGES literal, a direct constructor). The port's
// reason for existing — a second MemoryStrategy implementation — was unreachable,
// so "plugin" described a shape rather than a mechanism. These pin the mechanism.

import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { discoverConfigured } from '../src/loader.js';
import { loadRuntimeConfig } from '../src/runtime-config.js';

const ENV = 'AGENT_RUNTIME_CONFIG';
afterEach(() => {
  delete process.env[ENV];
});

/** A throwaway third-party provider: no @cratylus code, just the plugin shape. */
function stageProvider(root: string, name: string): void {
  const dir = join(root, 'node_modules', name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify({
      name,
      version: '1.0.0',
      type: 'module',
      main: 'index.js',
    }),
  );
  writeFileSync(
    join(dir, 'index.js'),
    `export const runtimePlugin = { name: '${name}', memory: { home: () => '/${name}/store' } };\n`,
  );
}

describe('configured capability providers', () => {
  it('absent config returns null so the bundled default still serves', async () => {
    process.env[ENV] = join(tmpdir(), 'definitely-absent-runtime.json');
    expect(loadRuntimeConfig()).toBeNull();
    expect(await discoverConfigured()).toBeNull();
  });

  it('resolves a THIRD-PARTY provider from the configured root', async () => {
    const root = mkdtempSync(join(tmpdir(), 'rt-cfg-'));
    stageProvider(root, 'alt-memory');
    const cfg = join(root, 'runtime.json');
    writeFileSync(
      cfg,
      JSON.stringify({ resolveFrom: root, capabilities: ['alt-memory'] }),
    );
    process.env[ENV] = cfg;

    const plugins = await discoverConfigured();
    expect(plugins).not.toBeNull();
    expect(plugins?.map((p) => p.name)).toEqual(['alt-memory']);
    // The swapped strategy actually serves the capability.
    expect(
      (plugins?.[0] as { memory: { home: () => string } }).memory.home(),
    ).toBe('/alt-memory/store');
  });

  it('a declared provider that is not installed fails LOUDLY', async () => {
    const root = mkdtempSync(join(tmpdir(), 'rt-cfg-'));
    const cfg = join(root, 'runtime.json');
    writeFileSync(
      cfg,
      JSON.stringify({ resolveFrom: root, capabilities: ['no-such-strategy'] }),
    );
    process.env[ENV] = cfg;
    // Silence here would strand a host on the default while its config says
    // otherwise — the failure mode a config surface exists to prevent.
    await expect(discoverConfigured()).rejects.toThrow(/not resolvable/);
  });

  it('a malformed config degrades to the default rather than wedging', async () => {
    const root = mkdtempSync(join(tmpdir(), 'rt-cfg-'));
    const cfg = join(root, 'runtime.json');
    writeFileSync(cfg, '{ not json');
    process.env[ENV] = cfg;
    expect(loadRuntimeConfig()).toBeNull();
  });
});
