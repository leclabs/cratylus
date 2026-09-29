// The host runtime config — what the projection told this host: the corpus's
// lifecycle vocabulary, each harness's native names under its own stanza, and each
// capability's configuration. Each part alone is a live config; none says nothing.

import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadRuntimeConfig, nativeEventsOf } from '../src/runtime-config.js';

const ENV = 'AGENT_RUNTIME_CONFIG';
afterEach(() => {
  delete process.env[ENV];
});

describe('the host runtime config', () => {
  it('an absent config reads as null', () => {
    process.env[ENV] = join(tmpdir(), 'definitely-absent-runtime.json');
    expect(loadRuntimeConfig()).toBeNull();
  });

  it('a VOCABULARY-ONLY config is a real config', () => {
    // The deploy-emitted shape: the corpus's event names and nothing else.
    const root = mkdtempSync(join(tmpdir(), 'rt-cfg-'));
    const cfg = join(root, 'runtime.json');
    writeFileSync(
      cfg,
      JSON.stringify({ events: { vocabulary: ['session.start', 'turn.end'] } }),
    );
    process.env[ENV] = cfg;

    const loaded = loadRuntimeConfig();
    expect(loaded).not.toBeNull();
    expect(loaded?.events?.vocabulary).toContain('turn.end');
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
    for (const none of ['unconfigured', 'empty', 'stripped'])
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

  it('a malformed config reads as null rather than wedging', () => {
    const root = mkdtempSync(join(tmpdir(), 'rt-cfg-'));
    const cfg = join(root, 'runtime.json');
    writeFileSync(cfg, '{ not json');
    process.env[ENV] = cfg;
    expect(loadRuntimeConfig()).toBeNull();
  });
});
