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
import { loadRuntimeConfig, nativeEventsOf } from '../src/runtime-config.js';

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

  it('a VOCABULARY-ONLY config declares no override, so the bundled default still serves', async () => {
    // The deploy-emitted shape: the operator declared event names and NO provider.
    // `loadRuntimeConfig` keeps this document alive on purpose (a vocabulary-only
    // config is real). The regression: `discoverConfigured` then returned `[]`, and
    // the caller's `?? BUNDLED` fires on nullish and NOT on empty — so a host whose
    // config was exactly right bound ZERO capabilities and every verb died with
    // "unknown capability 'memory'; bound on this host: (none)".
    const root = mkdtempSync(join(tmpdir(), 'rt-cfg-'));
    const cfg = join(root, 'runtime.json');
    writeFileSync(
      cfg,
      JSON.stringify({ events: { vocabulary: ['session.start', 'turn.end'] } }),
    );
    process.env[ENV] = cfg;

    // The document is live — the vocabulary half must survive.
    const loaded = loadRuntimeConfig();
    expect(loaded).not.toBeNull();
    expect(loaded?.events?.vocabulary).toContain('turn.end');
    expect(loaded?.capabilities).toEqual([]);

    // …and the provider half falls back rather than binding nothing.
    expect(await discoverConfigured()).toBeNull();
  });

  it("each harness's native names arrive under its own stanza, asked for by name", () => {
    // Two harnesses' stanzas in one host file, the shape deploy now writes: each is
    // read back as its own. A harness that HAS NONE — no stanza, a stanza whose map
    // is empty, or one whose every name is stripped as non-string — is refused
    // alike, naming the commands that write one: never handed an empty map, and
    // never another's.
    const root = mkdtempSync(join(tmpdir(), 'rt-cfg-'));
    const cfg = join(root, 'runtime.json');
    writeFileSync(
      cfg,
      JSON.stringify({
        events: { vocabulary: ['turn.end'] },
        harnesses: {
          claude: { native: { 'turn.end': 'Stop' } },
          omp: { native: { 'turn.end': 'agent_end' } },
          empty: { native: {} },
          stripped: { native: { 'turn.end': 7 } },
        },
      }),
    );
    process.env[ENV] = cfg;

    const loaded = loadRuntimeConfig();
    expect(nativeEventsOf(loaded, 'claude')).toEqual({ 'turn.end': 'Stop' });
    expect(nativeEventsOf(loaded, 'omp')).toEqual({ 'turn.end': 'agent_end' });
    for (const none of ['codex', 'empty', 'stripped'])
      expect(() => nativeEventsOf(loaded, none)).toThrow(
        new RegExp(
          `install --harness ${none}[\\s\\S]*deploy --harness ${none}`,
        ),
      );
  });

  it('a CONFIGURATION-ONLY config is a real config, each capability’s entry intact', () => {
    // Corpus meaning a capability acts on arrives as its configuration entry; a
    // document carrying only that is exactly as live as a vocabulary-only one.
    const root = mkdtempSync(join(tmpdir(), 'rt-cfg-'));
    const cfg = join(root, 'runtime.json');
    const entry = { lifecycle: { states: ['a', 'b'], final: 'b' } };
    writeFileSync(cfg, JSON.stringify({ configuration: { someCap: entry } }));
    process.env[ENV] = cfg;

    const loaded = loadRuntimeConfig();
    expect(loaded).not.toBeNull();
    expect(loaded?.configuration?.someCap).toEqual(entry);
    expect(loaded?.events).toBeUndefined();
    expect(loaded?.capabilities).toEqual([]);
  });

  it('a malformed configuration block is ignored without wedging the load', () => {
    const root = mkdtempSync(join(tmpdir(), 'rt-cfg-'));
    const cfg = join(root, 'runtime.json');
    process.env[ENV] = cfg;
    for (const malformed of [['someCap'], 'someCap', 7, null, {}]) {
      // Beside a live events block: the rest of the document still loads.
      writeFileSync(
        cfg,
        JSON.stringify({
          events: { vocabulary: ['turn.end'] },
          configuration: malformed,
        }),
      );
      const loaded = loadRuntimeConfig();
      expect(loaded?.events?.vocabulary).toEqual(['turn.end']);
      expect(loaded?.configuration).toBeUndefined();

      // Alone: it says nothing, so the document is absent — not a throw.
      writeFileSync(cfg, JSON.stringify({ configuration: malformed }));
      expect(loadRuntimeConfig()).toBeNull();
    }
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
