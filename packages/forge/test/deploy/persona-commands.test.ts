// The persona commands — a command named after each installed persona, in the user's bin
// dir, linked to the harness's launcher.
//
// The bin dir is SHARED with everything the operator ever put there, so every case is a
// claim about what is left alone: a regular file, another program's link, a link that
// already leads to our launcher but that nothing recorded, and the other harness's
// launcher all stay exactly as they were, and are reported with what is there. The
// module cases drive the placement API over a tmp HOME; the install cases run
// `runInstall` on both harnesses against a corpus written at run time.

import {
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { kebabToCamel } from '@cratylus/schema';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { adapterByName } from '../../src/adapters/registry/index.js';
import { runInstall } from '../../src/cli/commands/install.js';
import { readManifest, writeManifest } from '../../src/deploy/manifest.js';
import {
  PERSONA_BIN_REL,
  type PersonaCommandsOpts,
  describePersonaCommands,
  personaLauncherOf,
  placePersonaCommands,
  planPersonaCommands,
  removePersonaCommands,
} from '../../src/deploy/persona-commands.js';
import type { ProjectablePlugin } from '../../src/project/index.js';
import { FIXTURE_MANIFEST } from '../fixture-manifest.js';

const roots: string[] = [];
function tmpRoot(): string {
  const r = mkdtempSync(join(tmpdir(), 'persona-commands-'));
  roots.push(r);
  return r;
}
afterEach(() => {
  vi.restoreAllMocks();
  for (const r of roots) rmSync(r, { recursive: true, force: true });
  roots.length = 0;
});

/** Entry names in a dir, sorted; empty for a dir that does not exist. */
function names(dir: string): string[] {
  try {
    return readdirSync(dir).sort();
  } catch {
    return [];
  }
}

// ── the placement API ────────────────────────────────────────────────────────

describe('persona commands — the placement API', () => {
  let home: string;
  let bin: string;
  let opts: PersonaCommandsOpts;
  const ompLauncher = () => join(home, '.omp', 'agent', 'omp-agent');

  beforeEach(() => {
    home = tmpRoot();
    bin = join(home, PERSONA_BIN_REL);
    const claude = personaLauncherOf(home, adapterByName('claude'));
    const omp = personaLauncherOf(home, adapterByName('omp'));
    if (!claude || !omp) throw new Error('both harnesses declare a launcher');
    for (const l of [claude.launcher, omp.launcher]) {
      mkdirSync(join(l, '..'), { recursive: true });
      writeFileSync(l, '#!/bin/sh\n', { mode: 0o755 });
    }
    opts = {
      home,
      harnessDir: join(home, '.claude'),
      self: claude,
      personas: ['kino', 'mav', 'nico', 'planner'],
      peers: [omp],
      pathEnv: '',
    };
  });

  it('asks each adapter where its launcher landed, and none that has no launcher', () => {
    expect(personaLauncherOf(home, adapterByName('omp'))?.launcher).toBe(
      ompLauncher(),
    );
    expect(
      personaLauncherOf(home, {
        name: 'bare',
        home: '.bare',
      }),
    ).toBeUndefined();
  });

  it('plans a regular file and a foreign link as blocked and a hand-made link to the launcher as adopt, and changes nothing', () => {
    mkdirSync(bin, { recursive: true });
    writeFileSync(join(bin, 'mav'), 'host');
    symlinkSync('/bin/true', join(bin, 'nico'));
    symlinkSync(opts.self.launcher, join(bin, 'kino'));

    const plan = planPersonaCommands(opts);
    const by = Object.fromEntries(plan.links.map((l) => [l.persona, l]));
    expect(by.mav).toMatchObject({
      state: 'blocked',
      current: 'a regular file',
    });
    expect(by.nico).toMatchObject({ state: 'blocked', current: '/bin/true' });
    expect(by.kino).toMatchObject({ state: 'adopt' });
    expect(by.planner).toMatchObject({ state: 'place' });
    // A plan is a question: nothing was created, nothing was recorded.
    expect(names(bin)).toEqual(['kino', 'mav', 'nico']);
    expect(readManifest(opts.harnessDir).personaLinks).toEqual([]);
  });

  it('places the free names, adopts the hand-made link, and never touches an occupied one', () => {
    mkdirSync(bin, { recursive: true });
    writeFileSync(join(bin, 'mav'), 'host');
    symlinkSync('/bin/true', join(bin, 'nico'));
    symlinkSync(opts.self.launcher, join(bin, 'kino'));
    const kinoInode = lstatSync(join(bin, 'kino')).ino;

    const report = placePersonaCommands(opts);

    expect(readFileSync(join(bin, 'mav'), 'utf8')).toBe('host');
    expect(lstatSync(join(bin, 'mav')).isSymbolicLink()).toBe(false);
    expect(readlinkSync(join(bin, 'nico'))).toBe('/bin/true');
    expect(readlinkSync(join(bin, 'planner'))).toBe(opts.self.launcher);
    // Adopted, not re-created: the very same link, now recorded.
    expect(readlinkSync(join(bin, 'kino'))).toBe(opts.self.launcher);
    expect(lstatSync(join(bin, 'kino')).ino).toBe(kinoInode);
    expect(report.links.map((l) => [l.persona, l.state])).toEqual([
      ['kino', 'adopted'],
      ['mav', 'blocked'],
      ['nico', 'blocked'],
      ['planner', 'placed'],
    ]);
    // Only what was placed or adopted is recorded — a blocked name is never claimed.
    expect(readManifest(opts.harnessDir).personaLinks).toEqual([
      `${PERSONA_BIN_REL}/kino`,
      `${PERSONA_BIN_REL}/planner`,
    ]);
    // An adopted link is one this install placed, as far as removal is concerned.
    expect(
      removePersonaCommands(opts).links.map((l) => [
        l.link.split('/').pop(),
        l.state,
      ]),
    ).toEqual([
      ['kino', 'removed'],
      ['mav', 'kept'],
      ['nico', 'kept'],
      ['planner', 'removed'],
    ]);
    expect(names(bin)).toEqual(['mav', 'nico']);
  });

  it('leaves a hand-made link to the other harness’s launcher blocked, never adopted', () => {
    mkdirSync(bin, { recursive: true });
    symlinkSync(ompLauncher(), join(bin, 'kino'));
    const report = placePersonaCommands(opts);
    expect(report.links.find((l) => l.persona === 'kino')).toMatchObject({
      state: 'blocked',
      heldBy: 'omp',
    });
    expect(readlinkSync(join(bin, 'kino'))).toBe(ompLauncher());
    expect(readManifest(opts.harnessDir).personaLinks).not.toContain(
      `${PERSONA_BIN_REL}/kino`,
    );
  });

  it('is idempotent: a second placement creates nothing and reports each link present', () => {
    placePersonaCommands(opts);
    const before = names(bin).map((n) => [n, readlinkSync(join(bin, n))]);
    const again = placePersonaCommands(opts);
    expect(again.links.map((l) => l.state)).toEqual([
      'present',
      'present',
      'present',
      'present',
    ]);
    expect(names(bin).map((n) => [n, readlinkSync(join(bin, n))])).toEqual(
      before,
    );
  });

  it('places nothing under a dry run, and writes no record', () => {
    const report = placePersonaCommands({ ...opts, dry: true });
    expect(report.links.every((l) => l.state === 'place')).toBe(true);
    expect(names(bin)).toEqual([]);
    expect(readManifest(opts.harnessDir).personaLinks).toEqual([]);
  });

  it('keeps the rest of the deploy record when it adds the links', () => {
    writeManifest(opts.harnessDir, {
      ...readManifest(opts.harnessDir),
      kinds: { agent: { mav: ['agents/mav.md'] } },
      hookCommands: ['sh x'],
    });
    placePersonaCommands(opts);
    const after = readManifest(opts.harnessDir);
    expect(after.kinds).toEqual({ agent: { mav: ['agents/mav.md'] } });
    expect(after.hookCommands).toEqual(['sh x']);
    expect(after.personaLinks).toHaveLength(4);
  });

  it('leaves the other harness’s link in place and names both launchers when blocked by it', () => {
    mkdirSync(bin, { recursive: true });
    for (const p of opts.personas) symlinkSync(ompLauncher(), join(bin, p));

    const report = placePersonaCommands(opts);

    expect(report.links.every((l) => l.state === 'blocked')).toBe(true);
    for (const p of opts.personas) {
      expect(realpathSync(join(bin, p))).toBe(realpathSync(ompLauncher()));
    }
    const said = describePersonaCommands(report, false).join('\n');
    expect(said).toContain('omp launcher');
    expect(said).toContain(ompLauncher());
    expect(said).toContain(opts.self.launcher);
    expect(readManifest(opts.harnessDir).personaLinks).toEqual([]);
    // No suffixed second name was made to fit.
    expect(names(bin)).toEqual([...opts.personas].sort());
  });

  it('reports whether the bin dir is on PATH', () => {
    expect(planPersonaCommands(opts).onPath).toBe(false);
    expect(
      describePersonaCommands(planPersonaCommands(opts), true).join('\n'),
    ).toContain(`${bin} is not on PATH`);
    const on = planPersonaCommands({
      ...opts,
      pathEnv: ['/usr/bin', bin].join(delimiter),
    });
    expect(on.onPath).toBe(true);
    expect(describePersonaCommands(on, true).join('\n')).not.toContain(
      'not on PATH',
    );
  });

  describe('remove', () => {
    it('removes exactly the recorded links that still lead to the launcher, and reports the rest', () => {
      mkdirSync(bin, { recursive: true });
      writeFileSync(join(bin, 'mav'), 'host');
      symlinkSync('/bin/true', join(bin, 'nico'));
      placePersonaCommands(opts);
      // planner was placed, then replaced by someone else.
      rmSync(join(bin, 'planner'));
      symlinkSync('/bin/true', join(bin, 'planner'));

      const report = removePersonaCommands(opts);

      expect(
        report.links.map((l) => [l.link.split('/').pop(), l.state]),
      ).toEqual([
        ['kino', 'removed'],
        ['mav', 'kept'],
        ['nico', 'kept'],
        ['planner', 'kept'],
      ]);
      expect(names(bin)).toEqual(['mav', 'nico', 'planner']);
      expect(readFileSync(join(bin, 'mav'), 'utf8')).toBe('host');
      expect(readlinkSync(join(bin, 'nico'))).toBe('/bin/true');
      expect(readlinkSync(join(bin, 'planner'))).toBe('/bin/true');
      expect(readManifest(opts.harnessDir).personaLinks).toEqual([]);
    });

    it('removes nothing the second time', () => {
      placePersonaCommands(opts);
      expect(
        removePersonaCommands(opts).links.every((l) => l.state === 'removed'),
      ).toBe(true);
      expect(removePersonaCommands(opts).links).toEqual([]);
    });

    it('lists what it would remove under a dry run and removes nothing', () => {
      placePersonaCommands(opts);
      const report = removePersonaCommands({ ...opts, dry: true });
      expect(report.links.map((l) => l.state)).toEqual([
        'remove',
        'remove',
        'remove',
        'remove',
      ]);
      expect(names(bin)).toEqual([...opts.personas].sort());
      expect(readManifest(opts.harnessDir).personaLinks).toHaveLength(4);
    });

    it('never unlinks a regular file, even one its record names', () => {
      placePersonaCommands(opts);
      rmSync(join(bin, 'mav'));
      writeFileSync(join(bin, 'mav'), 'host');
      removePersonaCommands(opts);
      expect(readFileSync(join(bin, 'mav'), 'utf8')).toBe('host');
    });

    it('forgets a recorded link that is already gone', () => {
      placePersonaCommands(opts);
      rmSync(join(bin, 'nico'));
      const report = removePersonaCommands(opts);
      expect(report.links.find((l) => l.link.endsWith('/nico'))?.state).toBe(
        'gone',
      );
      expect(readManifest(opts.harnessDir).personaLinks).toEqual([]);
    });
  });
});

// ── install ──────────────────────────────────────────────────────────────────

/** Two agents, written at run time. */
function corpus(): ProjectablePlugin {
  const agents = join(tmpRoot(), 'agents');
  mkdirSync(agents, { recursive: true });
  const nulls = Object.keys(FIXTURE_MANIFEST)
    .map((k) => `  ${kebabToCamel(k)}: null,`)
    .join('\n');
  for (const name of ['alpha', 'beta']) {
    writeFileSync(
      join(agents, `${name}.ts`),
      [
        `export const ${name} = {`,
        `  name: '${name}',`,
        `  description: 'fixture agent ${name}',`,
        `  archetype: '${name} probe',`,
        nulls,
        '};',
        '',
      ].join('\n'),
      'utf8',
    );
  }
  return { name: 'persona-fixture', manifest: FIXTURE_MANIFEST, agents };
}

describe('install — persona commands', () => {
  let home: string;
  let bin: string;
  let cwd: string;
  let plugin: ProjectablePlugin;
  let out: string;
  const install = (
    harness: 'claude' | 'omp',
    extra: Partial<Parameters<typeof runInstall>[0]> = {},
  ) =>
    runInstall({
      harness,
      home,
      cwd,
      corpus: plugin as never,
      pathEnv: '/usr/bin',
      ...extra,
    });
  const launcher = (harness: string) =>
    personaLauncherOf(home, adapterByName(harness))?.launcher as string;

  beforeEach(() => {
    const root = tmpRoot();
    home = join(root, 'home');
    bin = join(home, PERSONA_BIN_REL);
    cwd = join(root, 'cwd');
    mkdirSync(cwd, { recursive: true });
    plugin = corpus();
    out = '';
    vi.spyOn(process.stdout, 'write').mockImplementation((s) => {
      out += String(s);
      return true;
    });
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    vi.spyOn(console, 'log').mockImplementation((...a) => {
      out += `${a.join(' ')}\n`;
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it.each(['claude', 'omp'] as const)(
    '%s: a non-interactive install places none, names each persona as would-place, and says how to add them',
    async (harness) => {
      expect(await install(harness)).toBe(0);
      expect(names(bin)).toEqual([]);
      expect(out).toContain('would place alpha');
      expect(out).toContain('would place beta');
      expect(out).toContain('--link-persona-commands');
      expect(out).toContain(`${bin} is not on PATH`);
    },
  );

  it.each(['claude', 'omp'] as const)(
    '%s: --link-persona-commands links every persona to the launcher, and says nothing of PATH when the bin dir is on it',
    async (harness) => {
      expect(
        await install(harness, {
          linkPersonaCommands: true,
          pathEnv: `/usr/bin${delimiter}${bin}`,
        }),
      ).toBe(0);
      expect(names(bin)).toEqual(['alpha', 'beta']);
      for (const n of names(bin)) {
        expect(realpathSync(join(bin, n))).toBe(
          realpathSync(launcher(harness)),
        );
      }
      expect(out).toContain('placed alpha');
      expect(out).not.toContain('not on PATH');
    },
  );

  it.each(['claude', 'omp'] as const)(
    '%s: adopts links made by hand to its launcher — not re-created, and recorded',
    async (harness) => {
      // What an operator has after following the interim recipe by hand: the launcher
      // does not exist yet, and `alpha` already leads to where it will land.
      mkdirSync(bin, { recursive: true });
      symlinkSync(launcher(harness), join(bin, 'alpha'));
      const inode = lstatSync(join(bin, 'alpha')).ino;

      expect(await install(harness, { linkPersonaCommands: true })).toBe(0);

      expect(lstatSync(join(bin, 'alpha')).ino).toBe(inode);
      expect(out).toContain('adopted alpha');
      expect(out).toContain('placed beta');
      const home_ = join(home, adapterByName(harness).home);
      expect(readManifest(home_).personaLinks).toEqual([
        `${PERSONA_BIN_REL}/alpha`,
        `${PERSONA_BIN_REL}/beta`,
      ]);
      // A second install finds both recorded.
      out = '';
      await install(harness, { linkPersonaCommands: true });
      expect(out).toContain('present alpha');
      expect(out).not.toContain('adopted');
    },
  );

  it('places nothing under --dry-run even when asked to link', async () => {
    expect(
      await install('claude', { linkPersonaCommands: true, dryRun: true }),
    ).toBe(0);
    expect(names(bin)).toEqual([]);
    expect(out).toContain('would place alpha');
  });

  it('asks before linking, and links only on a yes', async () => {
    const asked: string[] = [];
    await install('omp', {
      confirm: async (q) => {
        asked.push(q);
        return false;
      },
    });
    expect(asked).toHaveLength(1);
    expect(asked[0]).toContain('2 persona command');
    expect(names(bin)).toEqual([]);
    expect(out).toContain('none placed');

    await install('omp', { confirm: async () => true });
    expect(names(bin)).toEqual(['alpha', 'beta']);
  });

  it('does not ask when there is nothing free to link', async () => {
    await install('omp', { linkPersonaCommands: true });
    const confirm = vi.fn(async () => true);
    await install('omp', { confirm });
    expect(confirm).not.toHaveBeenCalled();
  });

  it('a second harness never replaces the first one’s links, and reports each as blocked by it', async () => {
    await install('omp', { linkPersonaCommands: true });
    const before = names(bin).map((n) => [n, readlinkSync(join(bin, n))]);
    out = '';

    expect(await install('claude', { linkPersonaCommands: true })).toBe(0);

    expect(names(bin).map((n) => [n, readlinkSync(join(bin, n))])).toEqual(
      before,
    );
    for (const n of names(bin)) {
      expect(realpathSync(join(bin, n))).toBe(realpathSync(launcher('omp')));
    }
    expect(out).toContain('blocked alpha');
    expect(out).toContain('blocked beta');
    expect(out).toContain('omp launcher');
    expect(readManifest(join(home, '.claude')).personaLinks).toEqual([]);
  });
});
