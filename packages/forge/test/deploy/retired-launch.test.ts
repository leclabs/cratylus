// What an earlier install placed for launching personas — the `omp-agent` launcher,
// the per-persona `omp.yml` overlays, the badge modules and the persona commands
// linked to the launcher — is placed no more: a session is started as an agent by
// `omp --agent`. Nor is any module placed for one agent under `agent/personas/`: the
// guardrail, session and isolation copies an earlier install put there were loaded
// by no session. An operator who installed them is rid of them by the next install,
// which prunes what its record lists and it no longer writes, or by uninstall.

import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runInstall } from '../../src/cli/commands/install.js';
import { runUninstall } from '../../src/cli/commands/uninstall.js';
import {
  digestFile,
  readManifest,
  writeManifest,
} from '../../src/deploy/manifest.js';
import type { ProjectablePlugin } from '../../src/project/index.js';
import { FIXTURE_MANIFEST } from '../fixture-manifest.js';
import {
  FIXTURE_PRACTICE,
  fixtureAgentSource,
  fixturePractices,
} from './helpers.js';

const roots: string[] = [];
afterEach(() => {
  vi.restoreAllMocks();
  for (const r of roots) rmSync(r, { recursive: true, force: true });
  roots.length = 0;
});

/** The files an earlier install placed to launch `alpha` by name, or to scope its
 *  modules to it, harness-relative, each with the manifest group that recorded it. */
const RETIRED = [
  ['enforcing:_session', 'agent/omp-agent'],
  ['enforcing:alpha', 'agent/personas/alpha/omp.yml'],
  [
    'enforcing:alpha',
    'agent/personas/alpha/extensions/cratylus-persona-badge.ts',
  ],
  ['enforcing:alpha', 'agent/personas/alpha/extensions/cratylus-guardrails.ts'],
  ['enforcing:alpha', 'agent/personas/alpha/extensions/cratylus-session.ts'],
  ['enforcing:alpha', 'agent/personas/alpha/extensions/cratylus-isolation.ts'],
] as const;

/** The per-agent root nothing is placed under now. */
const PERSONAS = 'agent/personas';

describe('the retired persona launch surface', () => {
  let home: string;
  let cwd: string;
  let plugin: ProjectablePlugin;
  const harness = () => join(home, '.omp');
  const link = () => join(home, '.local/bin/alpha');
  const install = () =>
    runInstall({
      harness: 'omp',
      home,
      cwd,
      canon: plugin as never,
      practices: FIXTURE_PRACTICE,
    });

  beforeEach(() => {
    const root = mkdtempSync(join(tmpdir(), 'retired-launch-'));
    roots.push(root);
    home = join(root, 'home');
    cwd = join(root, 'cwd');
    mkdirSync(cwd, { recursive: true });
    const agents = join(root, 'agents');
    mkdirSync(agents, { recursive: true });
    writeFileSync(join(agents, 'alpha.ts'), fixtureAgentSource('alpha'));
    plugin = {
      name: 'retired-launch-fixture',
      manifest: FIXTURE_MANIFEST,
      agents,
      practices: fixturePractices(['alpha']),
    };
    for (const stream of [process.stdout, process.stderr])
      vi.spyOn(stream, 'write').mockImplementation(() => true);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  /** An install, then what an earlier install's record would also hold: the retired
   *  files with their digests, and the persona command linked to the launcher. */
  async function installedEarlier(): Promise<void> {
    expect(await install()).toBe(0);
    const manifest = readManifest(harness());
    const hooks = { ...manifest.kinds.hooks };
    const digests = { ...manifest.digests };
    for (const [group, rel] of RETIRED) {
      const at = join(harness(), rel);
      mkdirSync(dirname(at), { recursive: true });
      writeFileSync(at, `retired ${rel}\n`);
      hooks[group] = [...(hooks[group] ?? []), rel];
      digests[rel] = digestFile(at) as string;
    }
    mkdirSync(dirname(link()), { recursive: true });
    symlinkSync(join(harness(), 'agent/omp-agent'), link());
    writeManifest(harness(), {
      ...manifest,
      kinds: { ...manifest.kinds, hooks },
      digests,
      personaLinks: ['.local/bin/alpha'],
    });
  }

  const gone = (at: string): boolean => {
    try {
      lstatSync(at);
      return false;
    } catch {
      return true;
    }
  };

  it('places none of it', async () => {
    expect(await install()).toBe(0);
    for (const [, rel] of RETIRED)
      expect(existsSync(join(harness(), rel))).toBe(false);
    expect(existsSync(join(harness(), PERSONAS))).toBe(false);
    expect(gone(link())).toBe(true);
    expect(readManifest(harness()).personaLinks).toEqual([]);
  });

  it('is pruned by the next install, persona command included', async () => {
    await installedEarlier();
    expect(await install()).toBe(0);
    for (const [, rel] of RETIRED)
      expect(existsSync(join(harness(), rel)), rel).toBe(false);
    expect(existsSync(join(harness(), PERSONAS))).toBe(false);
    expect(
      Object.keys(readManifest(harness()).kinds.hooks ?? {}),
    ).not.toContain('enforcing:alpha');
    expect(gone(link())).toBe(true);
    expect(readManifest(harness()).personaLinks).toEqual([]);
  });

  it('is removed by uninstall, persona command included', async () => {
    await installedEarlier();
    expect(runUninstall({ harness: 'omp', home })).toBe(0);
    for (const [, rel] of RETIRED)
      expect(existsSync(join(harness(), rel)), rel).toBe(false);
    expect(existsSync(join(harness(), PERSONAS))).toBe(false);
    expect(gone(link())).toBe(true);
  });

  it('leaves a recorded command the operator has since pointed elsewhere', async () => {
    await installedEarlier();
    rmSync(link());
    symlinkSync('/usr/bin/true', link());
    expect(await install()).toBe(0);
    expect(lstatSync(link()).isSymbolicLink()).toBe(true);
    expect(readManifest(harness()).personaLinks).toEqual([]);
  });
});
