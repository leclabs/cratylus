// `.polis.config` loader / precedence / validation — the topology resolution
// contract (docs/polis-config-schema.md), transcribed from config.py's tests.

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  CONFIG_ENV,
  ConfigError,
  fleetTargets,
  loadConfig,
  resolveHost,
} from '../../src/deploy/index.js';
import { tmp, writeConfig } from './helpers.js';

function withConfig(root: string): void {
  process.env[CONFIG_ENV] = join(root, '.polis.config');
}

describe('loadConfig', () => {
  afterEach(() => {
    delete process.env[CONFIG_ENV];
  });

  it('returns null when the file is absent (legacy flag-only mode)', () => {
    const root = tmp('polis-cfg-');
    expect(loadConfig(root)).toBeNull();
  });

  it('parses a valid config', () => {
    const root = writeConfig(tmp('polis-cfg-'));
    const cfg = loadConfig(root);
    expect(cfg?.schema).toBe(1);
    expect(Object.keys(cfg?.host ?? {})).toEqual(['fire', 'upmav', 'upgoose']);
  });

  it('hard-errors on malformed JSON', () => {
    const root = tmp('polis-cfg-');
    writeFileSync(join(root, '.polis.config'), '{ not json', 'utf-8');
    expect(() => loadConfig(root)).toThrow(ConfigError);
  });

  it('hard-errors on a missing schema', () => {
    const root = tmp('polis-cfg-');
    writeFileSync(
      join(root, '.polis.config'),
      JSON.stringify({ host: {} }),
      'utf-8',
    );
    expect(() => loadConfig(root)).toThrow(/missing required `schema`/);
  });

  it('hard-errors on an unrecognized schema version', () => {
    const root = tmp('polis-cfg-');
    writeFileSync(
      join(root, '.polis.config'),
      JSON.stringify({ schema: 99, host: {} }),
      'utf-8',
    );
    expect(() => loadConfig(root)).toThrow(/unrecognized schema/);
  });

  it('hard-errors on fleet<->host drift (fleet entry with no host object)', () => {
    const root = tmp('polis-cfg-');
    writeFileSync(
      join(root, '.polis.config'),
      JSON.stringify({ schema: 1, fleet: { hosts: ['ghost'] }, host: {} }),
      'utf-8',
    );
    expect(() => loadConfig(root)).toThrow(/no host\.<name> object/);
  });

  it('hard-errors on an orphan host (host object absent from fleet.hosts)', () => {
    const root = tmp('polis-cfg-');
    writeFileSync(
      join(root, '.polis.config'),
      JSON.stringify({
        schema: 1,
        fleet: { hosts: [] },
        host: { orphan: { local: true } },
      }),
      'utf-8',
    );
    expect(() => loadConfig(root)).toThrow(/absent from fleet\.hosts/);
  });

  it('honors the POLIS_CONFIG env override', () => {
    const root = writeConfig(tmp('polis-cfg-'));
    withConfig(root);
    const cfg = loadConfig();
    expect(cfg?.schema).toBe(1);
  });
});

describe('resolveHost — precedence (CLI › config › default)', () => {
  it('resolves upmav from config (user=lcaraccioli, hostname, home)', () => {
    const root = writeConfig(tmp('polis-cfg-'));
    const cfg = loadConfig(root);
    const hp = resolveHost('upmav', { cfg });
    expect(hp).toMatchObject({
      name: 'upmav',
      local: false,
      user: 'lcaraccioli',
      hostname: 'upmav.lan',
      home: '~/.claude',
    });
  });

  it('CLI flag trumps config (--user overrides host.upmav.user)', () => {
    const root = writeConfig(tmp('polis-cfg-'));
    const cfg = loadConfig(root);
    const hp = resolveHost('upmav', { cfg, cliUser: 'override' });
    expect(hp.user).toBe('override');
  });

  it('hostname defaults to the host key when unset', () => {
    const root = writeConfig(tmp('polis-cfg-'));
    const cfg = loadConfig(root);
    const hp = resolveHost('upgoose', { cfg });
    expect(hp.hostname).toBe('upgoose.lan');
  });

  it('a local host resolves local=true with no user requirement', () => {
    const root = writeConfig(tmp('polis-cfg-'));
    const cfg = loadConfig(root);
    const hp = resolveHost('fire', { cfg });
    expect(hp.local).toBe(true);
    expect(hp.user).toBeNull();
  });

  it('hard-errors on an unknown --host (the upmav-class failure)', () => {
    const root = writeConfig(tmp('polis-cfg-'));
    const cfg = loadConfig(root);
    expect(() => resolveHost('nope', { cfg })).toThrow(
      /refusing a current-user fallback/,
    );
  });

  it('hard-errors when a non-local host resolves no user (no default-to-current-user)', () => {
    const root = tmp('polis-cfg-');
    writeFileSync(
      join(root, '.polis.config'),
      JSON.stringify({
        schema: 1,
        fleet: { hosts: ['nouser'] },
        host: { nouser: { hostname: 'nouser.lan' } },
      }),
      'utf-8',
    );
    const cfg = loadConfig(root);
    expect(() => resolveHost('nouser', { cfg })).toThrow(
      /no default-to-current-user/,
    );
  });

  it('legacy flag-only mode (no config): resolves purely from flags', () => {
    const hp = resolveHost('somehost', {
      cfg: null,
      cliUser: 'u',
      cliHome: '/h',
    });
    expect(hp).toMatchObject({
      name: 'somehost',
      local: false,
      user: 'u',
      hostname: 'somehost',
      home: '/h',
    });
  });
});

describe('fleetTargets — hosts minus exclude', () => {
  it('drops fleet.exclude (upgoose excluded-from-fleet)', () => {
    const root = writeConfig(tmp('polis-cfg-'));
    const cfg = loadConfig(root);
    expect(fleetTargets(cfg!)).toEqual(['fire', 'upmav']);
  });

  it('extra exclude adds for a single run', () => {
    const root = writeConfig(tmp('polis-cfg-'));
    const cfg = loadConfig(root);
    expect(fleetTargets(cfg!, { extraExclude: ['upmav'] })).toEqual(['fire']);
  });

  it('an excluded host can never be re-included via --only', () => {
    const root = writeConfig(tmp('polis-cfg-'));
    const cfg = loadConfig(root);
    // upgoose is excluded; --only upgoose yields nothing (exclude honored first).
    expect(fleetTargets(cfg!, { only: ['upgoose'] })).toEqual([]);
  });

  it('--only restricts to a subset of the non-excluded hosts', () => {
    const root = writeConfig(tmp('polis-cfg-'));
    const cfg = loadConfig(root);
    expect(fleetTargets(cfg!, { only: ['upmav'] })).toEqual(['upmav']);
  });

  it('hard-errors when --only names a host not in fleet.hosts', () => {
    const root = writeConfig(tmp('polis-cfg-'));
    const cfg = loadConfig(root);
    expect(() => fleetTargets(cfg!, { only: ['ghost'] })).toThrow(
      /not in fleet\.hosts/,
    );
  });
});
