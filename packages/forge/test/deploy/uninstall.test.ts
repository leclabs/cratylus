// `cratylus uninstall` — take away what install placed, and only that.
//
// Every case is a claim about what the host keeps. The round trips run `runInstall` and
// then `runUninstall` over a tmp HOME the host has already written to, and compare the
// whole tree, byte for byte, with what it was before install: what the host placed, and
// what it changed since, is exactly what is still there. The module cases seed a record
// by hand to reach the refusals an install cannot be made to produce — a registration
// the host has since added a command to, a config line the host rewrote, a record from
// before digests were kept, a path another harness's install still needs.

import {
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { kebabToCamel } from '@cratylus/schema';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runInstall } from '../../src/cli/commands/install.js';
import { runUninstall } from '../../src/cli/commands/uninstall.js';
import {
  type DeployManifest,
  MANIFEST_REL,
  digestFile,
  emptyManifest,
  lineHunks,
  readManifest,
  undoHunks,
  writeManifest,
} from '../../src/deploy/manifest.js';
import { PERSONA_BIN_REL } from '../../src/deploy/persona-commands.js';
import {
  digestOf,
  emitRuntimeConfig,
} from '../../src/deploy/runtime-config.js';
import type { ProjectablePlugin } from '../../src/project/index.js';
import { FIXTURE_MANIFEST } from '../fixture-manifest.js';
import { FIXTURE_PRACTICE, fixturePractices } from './helpers.js';

const roots: string[] = [];
function tmpRoot(): string {
  const r = mkdtempSync(join(tmpdir(), 'uninstall-'));
  roots.push(r);
  return r;
}

/** Every file and link under `dir`, keyed by its path from there: a file by its bytes,
 *  a link by its target. Directories are not part of a tree's identity here. */
function snapshot(dir: string, at = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const entry of readdirSync(join(dir, at)).sort()) {
    const rel = at === '' ? entry : `${at}/${entry}`;
    const stat = lstatSync(join(dir, rel));
    if (stat.isSymbolicLink()) out[rel] = `-> ${readlinkSync(join(dir, rel))}`;
    else if (stat.isDirectory()) Object.assign(out, snapshot(dir, rel));
    else out[rel] = readFileSync(join(dir, rel), 'utf8');
  }
  return out;
}

/** Agents that hold each role omp maps, one that holds none — written at run time. */
function corpus(): ProjectablePlugin {
  const agents = join(tmpRoot(), 'agents');
  mkdirSync(agents, { recursive: true });
  const nulls = Object.keys(FIXTURE_MANIFEST)
    .map((k) => `  ${kebabToCamel(k)}: null,`)
    .join('\n');
  const held: Record<string, string | null> = {
    alpha: 'implementer',
    beta: 'planner',
    gamma: null,
  };
  for (const [name, holds] of Object.entries(held)) {
    writeFileSync(
      join(agents, `${name}.ts`),
      [
        `export const ${name} = {`,
        `  name: '${name}',`,
        `  description: 'fixture agent ${name}',`,
        `  archetype: '${name} probe',`,
        ...(holds === null ? [] : [`  holds: '${holds}',`]),
        nulls,
        '};',
        '',
      ].join('\n'),
      'utf8',
    );
  }
  return {
    name: 'uninstall-fixture',
    manifest: FIXTURE_MANIFEST,
    agents,
    practices: fixturePractices(Object.keys(held)),
  };
}

describe('uninstall', () => {
  let home: string;
  let cwd: string;
  let bin: string;
  let plugin: ProjectablePlugin;
  let out: string;
  let err: string;
  const harnessDir = (harness: string) =>
    join(home, harness === 'claude' ? '.claude' : '.omp');

  const install = (harness: 'claude' | 'omp') =>
    runInstall({
      harness,
      home,
      cwd,
      corpus: plugin as never,
      practices: FIXTURE_PRACTICE,
      linkPersonaCommands: true,
      pathEnv: '/usr/bin',
    });
  // Verbose by default: most of these assert on WHAT was removed, which the quiet
  // report counts and does not list.
  const uninstall = (harness: string, dryRun = false, verbose = true) =>
    runUninstall({ harness, home, dryRun, verbose });
  /** The report split at the line that opens what was left. */
  const splitLeft = (text: string): [string, string] => {
    const at = text.search(/^left \d+ items?/m);
    return at < 0 ? [text, ''] : [text.slice(0, at), text.slice(at)];
  };

  beforeEach(() => {
    const root = tmpRoot();
    home = join(root, 'home');
    cwd = join(root, 'cwd');
    bin = join(home, PERSONA_BIN_REL);
    mkdirSync(home, { recursive: true });
    mkdirSync(cwd, { recursive: true });
    plugin = corpus();
    out = '';
    err = '';
    // The runtime config is a file outside the harness home; keep it inside this HOME.
    vi.stubEnv('AGENT_RUNTIME_CONFIG', join(home, '.cratylus.json'));
    vi.spyOn(process.stdout, 'write').mockImplementation((s) => {
      out += String(s);
      return true;
    });
    vi.spyOn(process.stderr, 'write').mockImplementation((s) => {
      err += String(s);
      return true;
    });
    vi.spyOn(console, 'log').mockImplementation((...a) => {
      out += `${a.join(' ')}\n`;
    });
    vi.spyOn(console, 'error').mockImplementation((...a) => {
      err += `${a.join(' ')}\n`;
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    for (const r of roots) rmSync(r, { recursive: true, force: true });
    roots.length = 0;
  });

  describe('round trip', () => {
    it('claude: the tree is what the host had, save the one placed file the host edited, which is left and named', async () => {
      const claude = harnessDir('claude');
      mkdirSync(join(claude, 'agents'), { recursive: true });
      writeFileSync(join(claude, 'agents', 'hostowned.md'), 'host agent\n');
      const hostSettings = `${JSON.stringify(
        {
          theme: 'dark',
          statusLine: { type: 'command', command: 'echo hostline', padding: 2 },
        },
        null,
        2,
      )}\n`;
      writeFileSync(join(claude, 'settings.json'), hostSettings);
      const before = snapshot(home);

      expect(await install('claude')).toBe(0);
      // Guard the guard: install really changed the tree, or the round trip proves nothing.
      expect(snapshot(home)).not.toEqual(before);
      expect(readFileSync(join(claude, 'settings.json'), 'utf8')).not.toBe(
        hostSettings,
      );
      expect(Object.keys(snapshot(bin))).not.toEqual([]);
      const placed = readManifest(claude).kinds.agent?.alpha?.[0] as string;
      expect(placed).toBeDefined();
      writeFileSync(join(claude, placed), 'host rewrote this agent\n');
      out = '';

      expect(uninstall('claude')).toBe(0);

      expect(snapshot(home)).toEqual({
        ...before,
        [`.claude/${placed}`]: 'host rewrote this agent\n',
      });
      expect(readFileSync(join(claude, 'settings.json'), 'utf8')).toBe(
        hostSettings,
      );
      const [removed, left] = splitLeft(out);
      expect(left).toContain(join(claude, placed));
      expect(left).toContain('the host changed it since install');
      expect(removed).not.toContain(join(claude, placed));
      expect(removed).toContain(join(claude, 'agents', 'beta.md'));
    });

    it('omp: config.yml is what the host wrote, byte for byte, host modelRoles entry included', async () => {
      const omp = harnessDir('omp');
      mkdirSync(join(omp, 'agent'), { recursive: true });
      // No final newline, on purpose: install has to add one to append after it.
      const hostConfig =
        '# host config\nmodelRoles:\n  default: "anthropic/claude-x" # main\ntheme: dark\nnote: last line';
      writeFileSync(join(omp, 'agent', 'config.yml'), hostConfig);
      writeFileSync(join(home, 'host-file.txt'), 'host\n');
      const before = snapshot(home);

      expect(await install('omp')).toBe(0);
      const after = readFileSync(join(omp, 'agent', 'config.yml'), 'utf8');
      expect(after).toContain('implementer: "@task"');
      expect(after).toContain('statusLine:');
      const placed = Object.values(readManifest(omp).kinds.agent ?? {})[0]?.[0];
      expect(placed).toBeDefined();
      writeFileSync(join(omp, placed as string), 'host rewrote this agent\n');

      expect(uninstall('omp')).toBe(0);

      expect(readFileSync(join(omp, 'agent', 'config.yml'), 'utf8')).toBe(
        hostConfig,
      );
      expect(snapshot(home)).toEqual({
        ...before,
        [`.omp/${placed}`]: 'host rewrote this agent\n',
      });
    });

    it('omp: a config.yml install created is removed with what it put in', async () => {
      expect(await install('omp')).toBe(0);
      expect(Object.keys(snapshot(home))).toContain('.omp/agent/config.yml');
      expect(uninstall('omp')).toBe(0);
      expect(snapshot(home)).toEqual({});
    });

    it('--dry-run writes nothing and says what it would remove', async () => {
      const claude = harnessDir('claude');
      mkdirSync(claude, { recursive: true });
      writeFileSync(
        join(claude, 'settings.json'),
        `${JSON.stringify({ theme: 'dark', statusLine: { type: 'command', command: 'echo host' } }, null, 2)}\n`,
      );
      expect(await install('claude')).toBe(0);
      const installed = snapshot(home);
      out = '';

      expect(uninstall('claude', true)).toBe(0);

      expect(snapshot(home)).toEqual(installed);
      expect(out).toMatch(/would remove \d+ items/);
      expect(out).toContain(join(claude, 'agents', 'alpha.md'));
      expect(out).toContain(join(bin, 'alpha'));
      expect(out).toContain("unwrapped to the host's own command (echo host)");
      // A real run after the dry one still finds its record, and removes it.
      expect(uninstall('claude')).toBe(0);
      expect(snapshot(home)).toEqual({
        '.claude/settings.json': `${JSON.stringify({ theme: 'dark', statusLine: { type: 'command', command: 'echo host' } }, null, 2)}\n`,
      });
    });

    it('is quiet by default: it counts what it removed, lists it only under --verbose, and still names what it left', async () => {
      const claude = harnessDir('claude');
      expect(await install('claude')).toBe(0);
      const placed = readManifest(claude).kinds.agent?.alpha?.[0] as string;
      writeFileSync(join(claude, placed), 'host rewrote this agent\n');
      out = '';

      expect(uninstall('claude', true, false)).toBe(0);

      expect(out).toMatch(/^would remove \d+ items from claude/m);
      expect(out).not.toContain(join(claude, 'agents', 'beta.md'));
      // What install placed outside the harness directory is named by default, as
      // install names what it wrote there.
      expect(out).toMatch(/would remove \d+ persona commands? from /);
      expect(out).toContain(bin);
      // What the host changed is named whatever the verbosity: the operator must see
      // what remains and why.
      expect(out).toContain(join(claude, placed));
      expect(out).toContain('the host changed it since install');

      out = '';
      expect(uninstall('claude', true, true)).toBe(0);
      expect(out).toContain(join(claude, 'agents', 'beta.md'));
    });

    it('leaves a persona command the host replaced, and says so', async () => {
      expect(await install('claude')).toBe(0);
      rmSync(join(bin, 'alpha'));
      writeFileSync(join(bin, 'alpha'), 'my own program\n');

      expect(uninstall('claude')).toBe(0);

      expect(readFileSync(join(bin, 'alpha'), 'utf8')).toBe('my own program\n');
      expect(out).toContain('placed by this install, since replaced');
      expect(Object.keys(snapshot(bin))).toEqual(['alpha']);
    });

    it('leaves a status line the host has since pointed at another command', async () => {
      const claude = harnessDir('claude');
      mkdirSync(claude, { recursive: true });
      expect(await install('claude')).toBe(0);
      const settings = JSON.parse(
        readFileSync(join(claude, 'settings.json'), 'utf8'),
      );
      expect(settings.statusLine.command).not.toBe('echo mine');
      settings.statusLine = { type: 'command', command: 'echo mine' };
      writeFileSync(
        join(claude, 'settings.json'),
        `${JSON.stringify(settings, null, 2)}\n`,
      );

      expect(uninstall('claude')).toBe(0);

      const after = JSON.parse(
        readFileSync(join(claude, 'settings.json'), 'utf8'),
      );
      expect(after.statusLine).toEqual({
        type: 'command',
        command: 'echo mine',
      });
      expect(out).toContain(
        'the host runs a different command than the one install placed',
      );
    });
  });

  describe('the runtime config is the home it is given', () => {
    const stanza = { native: { 'tool.use.pre': 'PreToolUse' } };
    /** A host runtime config holding a stanza for each of claude and omp. */
    const config = `${JSON.stringify(
      {
        events: { vocabulary: ['tool.use.pre'] },
        harnesses: { claude: stanza, omp: stanza },
      },
      null,
      2,
    )}\n`;
    const withoutClaude = `${JSON.stringify(
      {
        events: { vocabulary: ['tool.use.pre'] },
        harnesses: { omp: stanza },
      },
      null,
      2,
    )}\n`;
    /** The record claude's deploy keeps of that config, with omp installed beside it, so
     *  that claude's stanza is the one to go and the corpus's parts stay for omp. */
    function recordConfig(): void {
      writeManifest(harnessDir('claude'), {
        ...readManifest(harnessDir('claude')),
        runtimeConfig: {
          vocabulary: digestOf(['tool.use.pre']),
          stanza: digestOf(stanza),
          capabilities: {},
        },
      });
      writeManifest(harnessDir('omp'), emptyManifest());
    }

    it('takes the stanza from the home it is given and leaves the process home’s file byte-identical', async () => {
      const processHome = join(tmpRoot(), 'process-home');
      mkdirSync(processHome, { recursive: true });
      vi.stubEnv('HOME', processHome);
      vi.stubEnv('AGENT_RUNTIME_CONFIG', undefined);
      writeFileSync(join(processHome, '.cratylus.json'), config);
      expect(await install('claude')).toBe(0);
      writeFileSync(join(home, '.cratylus.json'), config);
      recordConfig();

      expect(uninstall('claude')).toBe(0);

      expect(readFileSync(join(processHome, '.cratylus.json'), 'utf8')).toBe(
        config,
      );
      expect(readFileSync(join(home, '.cratylus.json'), 'utf8')).toBe(
        withoutClaude,
      );
    });

    it('takes it from $AGENT_RUNTIME_CONFIG wherever that is set, whatever the home', async () => {
      const set = join(tmpRoot(), 'elsewhere.json');
      vi.stubEnv('AGENT_RUNTIME_CONFIG', set);
      expect(await install('claude')).toBe(0);
      writeFileSync(set, config);
      writeFileSync(join(home, '.cratylus.json'), config);
      recordConfig();

      expect(uninstall('claude')).toBe(0);

      expect(readFileSync(set, 'utf8')).toBe(withoutClaude);
      expect(readFileSync(join(home, '.cratylus.json'), 'utf8')).toBe(config);
    });
  });

  describe('the runtime config keeps what the host placed in it', () => {
    const configFile = () => join(home, '.cratylus.json');

    // A corpus that declares events is one install emits a runtime config for.
    beforeEach(() => {
      plugin = {
        ...plugin,
        events: ['tool.use.pre', 'session.start'],
      } as never;
    });
    interface ConfigFile {
      x?: number;
      events: { vocabulary: string[]; note?: string };
      harnesses: Record<string, { native: Record<string, string> }> & {
        claude: { native: Record<string, string> };
      };
      configuration: Record<string, unknown>;
    }
    const readConfig = () =>
      JSON.parse(readFileSync(configFile(), 'utf8')) as ConfigFile;

    it('a config the host wrote before install still holds its keys after install, and is what the host wrote after uninstall', async () => {
      writeFileSync(configFile(), '{"x":1}\n');

      expect(await install('claude')).toBe(0);
      expect(readConfig().x).toBe(1);
      // Guard the guard: install did write its own parts into the host's file.
      expect(readConfig().harnesses.claude).toBeDefined();
      expect(readConfig().events.vocabulary.length).toBeGreaterThan(0);
      out = '';

      expect(uninstall('claude', true)).toBe(0);
      expect(readConfig().harnesses.claude).toBeDefined();

      expect(uninstall('claude')).toBe(0);
      expect(readConfig()).toEqual({ x: 1 });
      const [, left] = splitLeft(out);
      expect(left).toContain(configFile());
      expect(left).toContain('x');
      expect(left).toContain('the host placed them');
    });

    it('a capability’s configuration the host wrote survives install and uninstall', async () => {
      const mine = { configuration: { mine: { a: 1 } } };
      writeFileSync(configFile(), JSON.stringify(mine));

      expect(await install('claude')).toBe(0);
      expect(readConfig().configuration.mine).toEqual({ a: 1 });
      expect(readConfig().harnesses.claude).toBeDefined();

      expect(uninstall('claude')).toBe(0);
      expect(readConfig()).toEqual(mine);
      expect(splitLeft(out)[1]).toContain('configuration.mine');
    });

    it('a config install created is removed whole by the uninstall of its last harness, and two harnesses each take out only their own stanza', async () => {
      expect(await install('claude')).toBe(0);
      expect(await install('omp')).toBe(0);
      expect(Object.keys(readConfig().harnesses).sort()).toEqual([
        'claude',
        'omp',
      ]);
      const vocabulary = readConfig().events.vocabulary;

      expect(uninstall('claude')).toBe(0);
      expect(Object.keys(readConfig().harnesses)).toEqual(['omp']);
      expect(readConfig().events.vocabulary).toEqual(vocabulary);

      expect(uninstall('omp')).toBe(0);
      expect(snapshot(home)).toEqual({});
    });

    it.each([
      ['not valid JSON', 'not json'],
      ['a JSON array', '[1]'],
    ])(
      'a config holding %s is left byte for byte, and the report names it as left',
      async (_case, held) => {
        expect(await install('claude')).toBe(0);
        // Guard the guard: install wrote the file the host then spoiled.
        expect(readConfig().harnesses.claude).toBeDefined();
        writeFileSync(configFile(), held);
        out = '';

        expect(uninstall('claude')).toBe(0);

        expect(readFileSync(configFile(), 'utf8')).toBe(held);
        const [removed, left] = splitLeft(out);
        expect(removed).not.toContain(configFile());
        expect(left).toContain(configFile());
        expect(left).toContain('the runtime config is not');
        expect(left).toContain('install --harness claude');

        // The remedy the report gives: the first uninstall took the record away, so a
        // second one alone finds nothing; repaired, install records it again, and the
        // uninstall after that takes the harness's stanza out.
        expect(uninstall('claude')).toBe(0);
        expect(readFileSync(configFile(), 'utf8')).toBe(held);
        writeFileSync(configFile(), '{}\n');
        expect(await install('claude')).toBe(0);
        expect(readConfig().harnesses.claude).toBeDefined();
        expect(uninstall('claude')).toBe(0);
        expect(snapshot(home)).toEqual({});
      },
    );

    describe('the parts cratylus placed, taken out only while they are what was placed', () => {
      /** The config deploy emits over a host's own, for a corpus that configures `plan`,
       *  and — when `recorded` — the record deploy keeps of what it wrote. */
      function emitted(recorded = true): void {
        writeFileSync(
          configFile(),
          JSON.stringify({
            configuration: { mine: { a: 1 } },
            events: { note: 'the host’s' },
          }),
        );
        const { record } = emitRuntimeConfig({
          path: configFile(),
          events: ['tool.use.pre'],
          harness: 'claude',
          nativeEvents: { 'tool.use.pre': 'PreToolUse' },
          skills: [
            {
              name: 's',
              runtime: { capability: 'plan', configuration: { b: 2 } },
            },
          ] as never,
        });
        expect(Object.keys(record.capabilities)).toEqual(['plan']);
        expect(readConfig().configuration).toEqual({
          mine: { a: 1 },
          plan: { b: 2 },
        });
        expect(readConfig().events.note).toBe('the host’s');
        writeManifest(harnessDir('claude'), {
          ...emptyManifest(),
          runtimeConfig: recorded ? record : null,
        });
      }
      /** The host edits the file after deploy. */
      function hostEdits(change: (doc: ConfigFile) => void): void {
        const doc = JSON.parse(readFileSync(configFile(), 'utf8'));
        change(doc);
        writeFileSync(configFile(), JSON.stringify(doc));
      }

      it('are all taken out with the last stanza, and what the host placed beside them stays', () => {
        emitted();

        expect(uninstall('claude')).toBe(0);

        expect(readConfig()).toEqual({
          configuration: { mine: { a: 1 } },
          events: { note: 'the host’s' },
        });
        const [, left] = splitLeft(out);
        expect(left).toContain('configuration.mine');
        expect(left).toContain('events.note');
        expect(left).not.toContain('configuration.plan');
      });

      it('leave a capability’s configuration the host has edited since, and name it', () => {
        emitted();
        hostEdits((doc) => {
          doc.configuration.plan = { b: 3 };
        });

        expect(uninstall('claude')).toBe(0);

        expect(readConfig()).toEqual({
          configuration: { mine: { a: 1 }, plan: { b: 3 } },
          events: { note: 'the host’s' },
        });
        const [removed, left] = splitLeft(out);
        expect(removed).toContain('harnesses.claude, events.vocabulary');
        expect(left).toContain('configuration.plan');
        expect(left).toContain('the host changed what install wrote there');
      });

      it('leave a vocabulary the host has extended, and a stanza the host has changed, and name them', () => {
        emitted();
        hostEdits((doc) => {
          doc.events.vocabulary.push('host.event');
          doc.harnesses.claude.native['host.event'] = 'HostEvent';
        });

        expect(uninstall('claude')).toBe(0);

        const after = readConfig();
        expect(after.events.vocabulary).toEqual(['tool.use.pre', 'host.event']);
        expect(after.harnesses.claude).toBeDefined();
        expect(after.configuration).toEqual({ mine: { a: 1 } });
        const [, left] = splitLeft(out);
        expect(left).toContain('harnesses.claude, events.vocabulary');
        expect(left).toContain('the host changed what install wrote there');
      });

      it('are not taken out where the deploy recorded none: a change by the host cannot be ruled out', () => {
        emitted(false);

        expect(uninstall('claude')).toBe(0);

        expect(readConfig().configuration).toEqual({
          mine: { a: 1 },
          plan: { b: 2 },
        });
        expect(readConfig().harnesses.claude).toBeDefined();
        expect(readConfig().events.vocabulary).toEqual(['tool.use.pre']);
        const [removed, left] = splitLeft(out);
        expect(removed).not.toContain(configFile());
        expect(left).toContain(
          'harnesses.claude, events.vocabulary, configuration.mine, configuration.plan',
        );
        expect(left).toContain('no record was kept');
      });
    });
  });

  describe('what a record cannot vouch for is left', () => {
    /** A claude root with one placed file, recorded by hand. */
    function seed(
      overrides: Partial<DeployManifest> = {},
      digest = true,
    ): { dir: string; file: string } {
      const dir = harnessDir('claude');
      const file = join(dir, 'skills', 'wake', 'SKILL.md');
      mkdirSync(join(dir, 'skills', 'wake'), { recursive: true });
      writeFileSync(file, '# wake\n');
      writeManifest(dir, {
        ...emptyManifest(),
        kinds: { skill: { wake: ['skills/wake/SKILL.md'] } },
        digests: digest
          ? { 'skills/wake/SKILL.md': digestFile(file) as string }
          : {},
        ...overrides,
      });
      return { dir, file };
    }

    it('removes an unchanged recorded file and the record, and leaves a host neighbour', () => {
      const { dir, file } = seed();
      writeFileSync(join(dir, 'skills', 'wake', 'notes.md'), 'host notes\n');
      expect(uninstall('claude')).toBe(0);
      expect(snapshot(home)).toEqual({
        '.claude/skills/wake/notes.md': 'host notes\n',
      });
      expect(out).toContain(file);
    });

    it('leaves a recorded file whose bytes are not the ones written', () => {
      const { dir, file } = seed();
      writeFileSync(file, '# wake\nhost added a line\n');
      expect(uninstall('claude')).toBe(0);
      expect(readFileSync(file, 'utf8')).toBe('# wake\nhost added a line\n');
      expect(out).toContain('the host changed it since install');
      expect(snapshot(dir)).not.toHaveProperty(MANIFEST_REL);
    });

    it('leaves a file recorded before digests were kept — an edit cannot be ruled out', () => {
      const { file } = seed({}, false);
      expect(uninstall('claude')).toBe(0);
      expect(readFileSync(file, 'utf8')).toBe('# wake\n');
      expect(out).toContain('no digest was recorded');
    });

    it('leaves a path another harness still records', () => {
      const shared = join(home, '.agents', 'shared', 'asset.md');
      mkdirSync(join(home, '.agents', 'shared'), { recursive: true });
      writeFileSync(shared, 'shared\n');
      const digest = digestFile(shared) as string;
      const rel = '../.agents/shared/asset.md';
      writeManifest(harnessDir('claude'), {
        ...emptyManifest(),
        kinds: { hooks: { 'shared:shared': [rel] } },
        digests: { [rel]: digest },
      });
      writeManifest(harnessDir('omp'), {
        ...emptyManifest(),
        kinds: { hooks: { 'shared:shared': [rel] } },
        digests: { [rel]: digest },
      });
      expect(uninstall('claude')).toBe(0);
      expect(readFileSync(shared, 'utf8')).toBe('shared\n');
      expect(out).toContain('the omp install records it too');
      // The last harness to leave takes it.
      expect(uninstall('omp')).toBe(0);
      expect(snapshot(home)).toEqual({});
    });

    it('never removes a path a record names outside the roots it may remove from', () => {
      const outside = join(home, 'precious.txt');
      writeFileSync(outside, 'mine\n');
      writeManifest(harnessDir('claude'), {
        ...emptyManifest(),
        kinds: { skill: { evil: ['../precious.txt'] } },
        digests: { '../precious.txt': digestFile(outside) as string },
      });
      expect(uninstall('claude')).toBe(0);
      expect(readFileSync(outside, 'utf8')).toBe('mine\n');
      expect(out).toContain(
        'outside the directories an uninstall removes from',
      );
    });

    it('leaves a hook registration whose entry the host added a command to, and takes the rest', () => {
      const dir = harnessDir('claude');
      mkdirSync(dir, { recursive: true });
      const ours = 'sh "$HOME/.claude/hooks/x/x.sh"';
      const mixed = 'sh "$HOME/.claude/hooks/y/y.sh"';
      const settings = {
        theme: 'dark',
        hooks: {
          Stop: [{ hooks: [{ type: 'command', command: ours }] }],
          PreToolUse: [
            {
              matcher: 'Bash',
              hooks: [
                { type: 'command', command: mixed },
                { type: 'command', command: 'host-guard' },
              ],
            },
          ],
        },
      };
      writeFileSync(
        join(dir, 'settings.json'),
        `${JSON.stringify(settings, null, 2)}\n`,
      );
      writeManifest(dir, { ...emptyManifest(), hookCommands: [ours, mixed] });

      expect(uninstall('claude')).toBe(0);

      expect(
        JSON.parse(readFileSync(join(dir, 'settings.json'), 'utf8')),
      ).toEqual({
        theme: 'dark',
        hooks: {
          PreToolUse: settings.hooks.PreToolUse,
        },
      });
      expect(out).toContain(`hook registration ${ours}`);
      const [, left] = splitLeft(out);
      expect(left).toContain(`hook registration ${mixed}`);
      expect(left).not.toContain(ours);
    });

    it('leaves a config line the host rewrote, and takes the lines the host did not', () => {
      const dir = harnessDir('omp');
      mkdirSync(join(dir, 'agent'), { recursive: true });
      const original = 'theme: dark\nmodelRoles:\n  default: "@x"\n';
      const installed = `${original}  planner: "@plan"\n  architect: "@default"\n`;
      const rewritten = installed.replace('"@plan"', '"anthropic/mine"');
      const file = join(dir, 'agent', 'config.yml');
      writeFileSync(file, rewritten);
      writeManifest(dir, {
        ...emptyManifest(),
        hostEdits: {
          'agent/config.yml': {
            created: false,
            hunks: lineHunks(original, installed),
          },
        },
      });

      expect(uninstall('omp')).toBe(0);

      // The host rewrote one line of the run: that line is the host's, and every other
      // line install wrote comes out, each on its own.
      expect(readFileSync(file, 'utf8')).toBe(
        `${original}  planner: "anthropic/mine"\n`,
      );
      expect(out).toContain('planner: "@plan"');
      expect(out).toContain(
        'the host has changed or removed what install wrote',
      );
    });

    it('takes every other line of an inserted run when the host changed one, and keeps the host’s block around it', () => {
      const dir = harnessDir('omp');
      mkdirSync(join(dir, 'agent'), { recursive: true });
      const original = 'theme: dark\nmodelRoles:\n  default: "@x"\n';
      const installed = `${original}  planner: "@plan"\n  architect: "@default"\n  implementer: "@task"\n`;
      const file = join(dir, 'agent', 'config.yml');
      writeFileSync(file, installed.replace('"@plan"', '"anthropic/mine"'));
      writeManifest(dir, {
        ...emptyManifest(),
        hostEdits: {
          'agent/config.yml': {
            created: false,
            hunks: lineHunks(original, installed),
          },
        },
      });

      expect(uninstall('omp')).toBe(0);

      expect(readFileSync(file, 'utf8')).toBe(
        `${original}  planner: "anthropic/mine"\n`,
      );
      const [removed, left] = splitLeft(out);
      expect(removed).toContain('architect: "@default"');
      expect(removed).toContain('implementer: "@task"');
      expect(left).toContain('planner: "@plan"');
      expect(left).not.toContain('architect');
    });

    it('keeps the headers a changed nested line sits under, and takes the rest of the block', async () => {
      const omp = harnessDir('omp');
      mkdirSync(join(omp, 'agent'), { recursive: true });
      const hostConfig = '# host\ntheme: dark\n';
      writeFileSync(join(omp, 'agent', 'config.yml'), hostConfig);
      expect(await install('omp')).toBe(0);
      const file = join(omp, 'agent', 'config.yml');
      const installed = readFileSync(file, 'utf8');
      expect(installed).toContain('      abbreviate: true\n');
      writeFileSync(
        file,
        installed.replace(
          '      abbreviate: true\n',
          '      abbreviate: false\n',
        ),
      );

      expect(uninstall('omp')).toBe(0);

      expect(readFileSync(file, 'utf8')).toBe(
        `${hostConfig}statusLine:\n  segmentOptions:\n    path:\n      abbreviate: false\n`,
      );
    });

    it('refuses an unreadable record and removes nothing', () => {
      const { dir, file } = seed();
      writeFileSync(join(dir, MANIFEST_REL), '{ not json');
      expect(uninstall('claude')).toBe(1);
      expect(readFileSync(file, 'utf8')).toBe('# wake\n');
      expect(readFileSync(join(dir, MANIFEST_REL), 'utf8')).toBe('{ not json');
      expect(err).toContain('not usable');
    });

    it('a host with no record has nothing removed', () => {
      mkdirSync(join(harnessDir('claude'), 'skills', 'wake'), {
        recursive: true,
      });
      writeFileSync(
        join(harnessDir('claude'), 'skills', 'wake', 'SKILL.md'),
        'x',
      );
      const before = snapshot(home);
      expect(uninstall('claude')).toBe(0);
      expect(snapshot(home)).toEqual(before);
      expect(out).toContain('nothing is removed');
    });

    it('needs a harness, and a known one', () => {
      expect(runUninstall({ home })).toBe(1);
      expect(uninstall('nonesuch')).toBe(1);
    });

    it('leaves a dangling persona link the host made itself, unrecorded', () => {
      mkdirSync(bin, { recursive: true });
      symlinkSync('/nowhere', join(bin, 'alpha'));
      seed();
      expect(uninstall('claude')).toBe(0);
      expect(readlinkSync(join(bin, 'alpha'))).toBe('/nowhere');
    });
  });

  describe('a host installed before install recorded its config edits', () => {
    // Ends with a newline: what an install from before edits were recorded did to the
    // last line's terminator is not something its record can be adopted back to.
    const HOST =
      '# host config\nmodelRoles:\n  default: "anthropic/claude-x"\ntheme: dark\nnote: last line\n';

    /** An omp install, then the record as an older version left it: no digests, no
     *  edits — and the config lines it put in are all still in the file. */
    async function installedByOlderVersion(): Promise<string> {
      const omp = harnessDir('omp');
      mkdirSync(join(omp, 'agent'), { recursive: true });
      writeFileSync(join(omp, 'agent', 'config.yml'), HOST);
      expect(await install('omp')).toBe(0);
      const record = join(omp, MANIFEST_REL);
      const {
        hostEdits: _e,
        digests: _d,
        ...older
      } = JSON.parse(readFileSync(record, 'utf8'));
      writeFileSync(record, `${JSON.stringify(older, null, 2)}\n`);
      return join(omp, 'agent', 'config.yml');
    }

    it('an uninstall names the config file it cannot vouch for, and leaves it as it is', async () => {
      const config = await installedByOlderVersion();
      const installed = readFileSync(config, 'utf8');
      out = '';
      expect(uninstall('omp')).toBe(0);
      expect(readFileSync(config, 'utf8')).toBe(installed);
      const [, left] = splitLeft(out);
      expect(left).toContain(config);
      expect(left).toContain(
        'installed before install recorded its edits to this file',
      );
    });

    it('a re-install records the lines it finds byte for byte as it would write them, and the next uninstall takes them', async () => {
      const config = await installedByOlderVersion();
      expect(await install('omp')).toBe(0);
      expect(readManifest(harnessDir('omp')).hostEdits).not.toEqual({});
      out = '';
      expect(uninstall('omp')).toBe(0);
      expect(readFileSync(config, 'utf8')).toBe(HOST);
      expect(out).not.toContain('installed before install recorded');
      expect(snapshot(home)).toEqual({ '.omp/agent/config.yml': HOST });
    });

    it('a host with no modelRoles key gets the key the old install created taken with its entries, and is told of the value that install turned', async () => {
      const omp = harnessDir('omp');
      mkdirSync(join(omp, 'agent'), { recursive: true });
      const config = join(omp, 'agent', 'config.yml');
      const host =
        '# host\ntheme: dark\nstatusLine:\n  preset: default\n  showHookStatus: false\n';
      writeFileSync(config, host);
      expect(await install('omp')).toBe(0);
      // The old install turned the hidden row on and created `modelRoles:`.
      expect(readFileSync(config, 'utf8')).toContain('\nmodelRoles:\n');
      expect(readFileSync(config, 'utf8')).toContain('showHookStatus: true');
      const record = join(omp, MANIFEST_REL);
      const {
        hostEdits: _e,
        digests: _d,
        ...older
      } = JSON.parse(readFileSync(record, 'utf8'));
      writeFileSync(record, `${JSON.stringify(older, null, 2)}\n`);

      expect(await install('omp')).toBe(0);
      out = '';
      expect(uninstall('omp')).toBe(0);

      // The key and its entries are gone; the value the old install turned stays as it
      // stands, and the file is named for it.
      expect(readFileSync(config, 'utf8')).toBe(
        host.replace('showHookStatus: false', 'showHookStatus: true'),
      );
      const [, left] = splitLeft(out);
      expect(left).toContain(config);
      expect(left).toContain('showHookStatus');
    });

    it('a second install after the record exists adds nothing to it, and its lines still come out', async () => {
      const omp = harnessDir('omp');
      mkdirSync(join(omp, 'agent'), { recursive: true });
      writeFileSync(join(omp, 'agent', 'config.yml'), HOST);
      expect(await install('omp')).toBe(0);
      const once = readManifest(omp).hostEdits;
      expect(await install('omp')).toBe(0);
      expect(readManifest(omp).hostEdits).toEqual(once);
      expect(uninstall('omp')).toBe(0);
      expect(readFileSync(join(omp, 'agent', 'config.yml'), 'utf8')).toBe(HOST);
    });
  });

  describe('the line diff an uninstall takes edits out by', () => {
    const doc = 'a: 1\nb: 2\nc: 3\n';

    it('takes two separate insertions out and leaves the lines between them', () => {
      const after = 'a: 1\nx: 9\nb: 2\nc: 3\ny: 8\n';
      const hunks = lineHunks(doc, after);
      expect(hunks).toHaveLength(2);
      const host = after.replace('b: 2', 'b: host');
      const { text, results } = undoHunks(host, hunks);
      expect(text).toBe('a: 1\nb: host\nc: 3\n');
      expect(results.map((r) => r.state)).toEqual(['undone', 'undone']);
    });

    it('records a last line install had to end apart from the lines appended beneath it', () => {
      const hunks = lineHunks('a: 1\nb: 2', 'a: 1\nb: 2\nnew: 1\n');
      expect(hunks.map((h) => [h.before, h.after])).toEqual([
        [['b: 2'], ['b: 2\n']],
        [[], ['new: 1\n']],
      ]);
    });

    it('takes a block out line by line: the host’s changed line stays under the headers it was written beneath', () => {
      const before = 'top: 1\n';
      const after = `${before}block:\n  keep: 1\n  drop: 2\n  other:\n    deep: 3\n`;
      const hunks = lineHunks(before, after);
      expect(hunks).toHaveLength(1);
      const host = after.replace('deep: 3', 'deep: host');
      const { text, results } = undoHunks(host, hunks);
      expect(text).toBe('top: 1\nblock:\n  other:\n    deep: host\n');
      expect(results[0]?.state).toBe('partial');
      expect(results[0]?.changed).toEqual(['    deep: 3\n']);
      expect(results[0]?.holding).toEqual(['block:\n', '  other:\n']);
    });

    it('restores a replaced line, and an unterminated last line, exactly', () => {
      const before = 'a: 1\nb: [x]';
      const after = 'a: 1\nb: [x, y]';
      expect(undoHunks(after, lineHunks(before, after)).text).toBe(before);
      const grown = 'a: 1\nb: [x]\nnew: 1';
      expect(undoHunks(grown, lineHunks(before, grown)).text).toBe(before);
    });

    it('touches nothing when the host changed what was written', () => {
      const after = 'a: 1\nx: 9\nb: 2\nc: 3\n';
      const hunks = lineHunks(doc, after);
      const host = after.replace('x: 9', 'x: host');
      const undone = undoHunks(host, hunks);
      expect(undone.text).toBe(host);
      expect(undone.results.map((r) => r.state)).toEqual(['changed']);
    });

    it('reads a line the host put back itself as restored', () => {
      const before = 'a: [x]\nb: 2\n';
      const after = 'a: [x, y]\nb: 2\n';
      const undone = undoHunks(before, lineHunks(before, after));
      expect(undone.text).toBe(before);
      expect(undone.results.map((r) => r.state)).toEqual(['restored']);
    });
  });
});
