// The omp adapter's gates.
//
// Each leg pins a fact that was MEASURED — against `@oh-my-pi/pi-coding-agent`'s
// own source, or empirically against an installed `omp` binary — and would
// otherwise be held by prose alone. Where a leg exists because something went
// wrong, the wrong thing is named — a fixture pinned to a law outlives the
// incident that produced it, and one pinned to the incident is a museum piece.

import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  OMP_LAUNCHER_FILE,
  OMP_OVERLAY_FILE,
  agentToOmpMd,
  ompAgentRel,
  ompCapabilityExtensions,
  ompHarnessAdapter,
  ompLaunchSurface,
} from '../../src/adapters/omp/index.js';
import { SESSION_SCOPE } from '../../src/core/harness-adapter.js';
import { FIXTURE_MANIFEST } from '../fixture-manifest.js';

/** Temp dirs the legs below that touch disk create — they RUN the launcher,
 *  which is the only way its resolution is observable. */
const tmp: string[] = [];
afterEach(() => {
  for (const d of tmp) rmSync(d, { recursive: true, force: true });
  tmp.length = 0;
});

const AGENT = {
  name: 'mav',
  // A colon-space, because that is the character sequence a plain YAML scalar
  // may not carry and a real corpus description does ("…and canon: dimension
  // catalogs"). Unquoted, the emitted document is a scanner error and omp falls
  // back to a naive line parser, warning once per discovery pass.
  description: 'the builder: ships things',
  archetype: 'Hero archetype of end-to-end delivery',
  objective: 'delivery ⟨end-to-end integrated green⟩',
} as never;

const CTX = { manifest: FIXTURE_MANIFEST } as never;

/**
 * The emitted front-matter, read back as `key → value` — and REFUSING what
 * YAML refuses, which is the whole reason it is not a three-line split.
 *
 * NO YAML LIBRARY, and none is wanted: forge depends on no parser, and the
 * escaping this projection uses — YAML's DOUBLE-QUOTED style — is the JSON
 * string family for the two characters it escapes (`\` and `"`), so
 * `JSON.parse` on a delimited value is a real round trip through a reader this
 * repo already has. A reader that merely split on the first `: ` would accept
 * the exact document YAML rejects, which is to say it would BE the lenient
 * fallback this projection exists to stay out of.
 */
function frontMatter(md: string): Record<string, string> {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(md);
  if (!m) throw new Error('no front-matter fence');
  const out: Record<string, string> = {};
  for (const line of (m[1] as string).split('\n')) {
    const at = line.indexOf(': ');
    const key = line.slice(0, at);
    const raw = line.slice(at + 2);
    if (raw.startsWith('"')) {
      out[key] = JSON.parse(raw) as string;
      continue;
    }
    // A PLAIN scalar, held to YAML's own two rules for one: it may carry
    // neither `: ` (that opens a mapping) nor ` #` (that opens a comment).
    // Either makes the document a scanner error omp survives only by falling
    // back to a line parser, warning once per discovery pass.
    if (raw.includes(': ') || raw.includes(' #')) {
      throw new Error(`plain scalar is not legal YAML: ${key}`);
    }
    out[key] = raw;
  }
  return out;
}

describe('omp agent definition', () => {
  it('carries the two fields omp requires when skills are absent', () => {
    expect(frontMatter(agentToOmpMd(AGENT, CTX))).toEqual({
      name: 'mav',
      description: 'the builder: ships things',
    });
  });

  it('emits `autoloadSkills` for an agent given skills, and only then', () => {
    // The front-matter key that describes the COMPOSED AGENT rather than the
    // host's dispatch policy — with `model`, which names its role. The list is the closure
    // projection hands the adapter, rendered in the order it arrives. omp
    // honours it for a DISPATCHED subagent; `OMP_LAUNCHER_SCRIPT` reads the same
    // key back out for a MAIN session, which has no native path for it — so the
    // list reaching these bytes is what makes one definition mean one thing.
    //
    // Read off the RENDERED STRING rather than through `frontMatter`: the claim
    // is about the bytes omp's own YAML reader will see, including the quoting
    // and the position of the key inside the fence.
    const declared = agentToOmpMd(
      { ...(AGENT as object), skills: ['design', 'deliver'] } as never,
      CTX,
    );
    expect(declared).toContain(
      '\nautoloadSkills: ["design", "deliver"]\n---\n',
    );

    // The negative half, and it has teeth: a third key emitted unconditionally
    // would put `autoloadSkills: []` into every definition that declares none —
    // a list omp parses to empty and a launcher renders as nothing, which is
    // noise that reads like a declaration. An EMPTY list is treated as absent
    // for the same reason.
    for (const bare of [AGENT, { ...(AGENT as object), skills: [] } as never]) {
      const fence = /^---\n([\s\S]*?)\n---\n/.exec(
        agentToOmpMd(bare, CTX),
      )?.[1] as string;
      expect(fence.split('\n')).toHaveLength(2);
      expect(fence).not.toContain('autoloadSkills');
    }
  });

  it('survives a description carrying the characters YAML reserves', () => {
    // A plain scalar may not contain `: `, and a real corpus description does
    // ("…and canon: dimension catalogs") — unquoted, the document is a scanner
    // error that omp survives only by falling back to a naive `key: value` line
    // parser, invisible until a description grows something the fallback loses
    // too. The round trip is the claim: whatever goes in comes back out.
    const gnarly = 'a "quote", a \\ and a colon: here';
    const out = agentToOmpMd(
      { ...(AGENT as object), description: gnarly } as never,
      CTX,
    );
    expect(frontMatter(out).description).toBe(gnarly);
  });

  it('asserts NO identity line — the launcher owns that sentence now', () => {
    // It used to open the body, because this file WAS the appended prompt and
    // omp's base prompt asserts its own identity underneath. A DISPATCHED
    // subagent reads this body as its ENTIRE system prompt, with no rival
    // identity under it, so the sentence would be redundant there.
    const body = agentToOmpMd(AGENT, CTX).split('\n---\n')[1] ?? '';
    expect(body).not.toContain('You are `mav`');
  });

  it('still carries the composed body, not merely the front-matter', () => {
    // The legs above pass trivially if the body were dropped: a file of two
    // front-matter fields and nothing else would satisfy every one of them and
    // carry no dimensions at all.
    const out = agentToOmpMd(AGENT, CTX);
    expect(out).toContain('## Archetype');
    expect(out).toContain('Hero archetype of end-to-end delivery');
    expect(out).toContain('delivery ⟨end-to-end integrated green⟩');
  });
});

/**
 * A DEPLOYED omp home, laid out by the adapter's OWN destination map: the
 * generic launcher in the session root, the definition omp discovers beside it,
 * and one persona scope carrying its overlay. Plus a fake `omp` on `PATH` that
 * records the argv it was exec'd with, because what the launcher composes is
 * observable nowhere else.
 *
 * Built from `scopedRel`/`agentRel` rather than from written-out paths: a
 * layout change moves this fixture with it instead of leaving it pinned to a
 * directory nobody writes any more.
 *
 * THE FAKE `omp` IS ALSO THE SKILL RESOLVER, as the real one is for the
 * launcher: `omp read skill://<name>` answers with `skills[name].md`,
 * `skill://<name>/scripts` lists its `scripts`, `skill://<name>/scripts/<f>`
 * prints one, and an unknown name exits 1 as omp does. Every `read` appends the directory it ran in to
 * `reads`, so a test can see WHERE the launcher asked from.
 */
interface DeployedHome {
  sandbox: string;
  harness: string;
  bin: string;
  argv: string;
  reads: string;
  launcher: string;
}

/** A skill as the fake `omp` resolves it: its SKILL.md, and its `scripts/`
 *  files by name. */
interface ResolvedFixture {
  md: string;
  scripts?: Readonly<Record<string, string>>;
}

function deployedHome(
  defs: Record<string, string>,
  skills: Record<string, ResolvedFixture> = {},
): DeployedHome {
  const sandbox = mkdtempSync(join(tmpdir(), 'omp-home-'));
  tmp.push(sandbox);
  const harness = join(sandbox, '.omp');
  const place = (at: string, content: string, mode?: number): void => {
    mkdirSync(dirname(at), { recursive: true });
    writeFileSync(at, content, mode === undefined ? undefined : { mode });
  };
  for (const [name, def] of Object.entries(defs)) {
    place(join(harness, ompAgentRel(name)), def);
  }
  const resolved = join(sandbox, 'resolved');
  for (const [name, { md, scripts }] of Object.entries(skills)) {
    place(join(resolved, name, 'SKILL.md'), md);
    for (const [file, content] of Object.entries(scripts ?? {})) {
      place(join(resolved, name, 'scripts', file), content);
    }
  }
  for (const f of ompLaunchSurface(Object.keys(defs))) {
    place(
      join(
        harness,
        ompHarnessAdapter.scopedRel?.(f.filename, f.scope) as string,
      ),
      f.content,
      f.executable ? 0o755 : undefined,
    );
  }
  const bin = join(sandbox, 'bin');
  mkdirSync(bin, { recursive: true });
  const argv = join(sandbox, 'argv');
  const reads = join(sandbox, 'reads');
  // NUL-DELIMITED, because one of these arguments is the composed system
  // prompt and it is MULTI-LINE. A newline-separated sink read the prompt back
  // as a dozen unrelated arguments, which is the shape that would let a
  // truncated prompt pass every assertion here.
  writeFileSync(
    join(bin, 'omp'),
    [
      '#!/bin/sh',
      'if [ "$1" = read ]; then',
      `  printf '%s\\n' "$PWD" >> ${reads}`,
      '  case $2 in',
      `    skill://*/scripts) d=${resolved}/\${2#skill://}; [ -d "$d" ] || exit 1; ls "$d"; exit 0 ;;`,
      `    skill://*/*) f=${resolved}/\${2#skill://} ;;`,
      `    skill://*) f=${resolved}/\${2#skill://}/SKILL.md ;;`,
      '  esac',
      '  [ -f "$f" ] || { echo "Unknown skill" >&2; exit 1; }',
      '  cat "$f"; exit 0',
      'fi',
      `printf '%s\\0' "$@" > ${argv}`,
      '',
    ].join('\n'),
    { mode: 0o755 },
  );
  return {
    sandbox,
    harness,
    bin,
    argv,
    reads,
    launcher: join(
      harness,
      ompHarnessAdapter.scopedRel?.(OMP_LAUNCHER_FILE, SESSION_SCOPE) as string,
    ),
  };
}

/** The arguments the fake `omp` was exec'd with, whole. */
function recordedArgv(at: string): string[] {
  return readFileSync(at, 'utf-8').split('\0').slice(0, -1);
}

/** Run the deployed launcher through `entry` and report what a shell saw —
 *  stderr included on success, where a degraded skill is reported. */
function launch(
  bin: string,
  entry: string,
  args: readonly string[] = [],
  cwd?: string,
): { status: number; stderr: string } {
  const r = spawnSync(entry, [...args], {
    env: { ...process.env, PATH: `${bin}:${process.env.PATH ?? ''}` },
    stdio: ['ignore', 'ignore', 'pipe'],
    encoding: 'utf-8',
    ...(cwd ? { cwd } : {}),
  });
  return { status: r.status ?? -1, stderr: r.stderr };
}

describe('omp launch spec', () => {
  it('emits ONE launcher for the session and ONE overlay per agent, sorted', () => {
    // The shape change, in one assertion. Ten agents used to mean ten
    // byte-identical launchers differing only in where they sat.
    expect(
      ompLaunchSurface(['nico', 'mav']).map((f) => [f.scope, f.filename]),
    ).toEqual([
      [SESSION_SCOPE, OMP_LAUNCHER_FILE],
      ['mav', OMP_OVERLAY_FILE],
      ['nico', OMP_OVERLAY_FILE],
    ]);
  });

  it('lands the launcher executable — an unexecutable one is dead on the host', () => {
    const [launcher] = ompLaunchSurface(['mav']);
    expect(launcher?.executable).toBe(true);
    expect(launcher?.content).toContain('#!/bin/sh');
    // And no absolute path was baked in at projection: the script is identical
    // for every persona and every `--home`.
    expect(launcher?.content).not.toMatch(/\/home\/|\/Users\//);
  });

  it('emits NOTHING for an empty agent set, launcher included', () => {
    // A launcher with no definition it could ever resolve reads as an
    // affordance and delivers a usage error.
    expect(ompLaunchSurface([])).toEqual([]);
  });

  it('composes identity + body + that persona’s OWN overlay, through a symlink', () => {
    // HOW A LAUNCHER IS ACTUALLY RUN: linked into a `PATH` dir under the
    // persona's name. That directory holds none of the files the launcher
    // reads, and a script that trusted `dirname "$0"` handed omp the LINK's
    // directory — measured on an operator's host as `Config overlay not found:
    // ~/.local/bin/omp.yml`, a persona unlaunchable by its own name.
    //
    // Asserted by RUNNING it against an `omp` that records its argv, because
    // every claim here is only observable in what gets exec'd. A
    // `toContain('dirname')` assertion passed throughout that defect.
    //
    // FED THE PROJECTOR'S OWN BYTES, so the split the launcher performs is
    // pinned against the front-matter this adapter actually emits rather than
    // against a convenient hand-written sample.
    const { harness, bin, argv, launcher } = deployedHome({
      mav: agentToOmpMd(AGENT, CTX),
    });
    symlinkSync(launcher, join(bin, 'mav'));

    expect(launch(bin, join(bin, 'mav'))).toEqual({ status: 0, stderr: '' });

    const args = recordedArgv(argv);
    const prompt = args[args.indexOf('--append-system-prompt') + 1] as string;
    // The identity omp's own base prompt would otherwise win…
    expect(prompt.split('\n')[0]).toContain('You are `mav`');
    // …the composed body under it…
    expect(prompt).toContain('Hero archetype of end-to-end delivery');
    // …and NOT the front-matter, which would arrive as literal text.
    expect(prompt).not.toContain('description:');
    // …and this persona's own overlay, which is the whole of its governance.
    expect(args).toContain(
      join(
        harness,
        ompHarnessAdapter.scopedRel?.(OMP_OVERLAY_FILE, 'mav') as string,
      ),
    );
  });

  it('argv[0] dispatch does not eat the operator’s own first flag', () => {
    // The busybox contract: invoked under its OWN name the agent is `$1`;
    // invoked as `mav` the agent is argv[0] and every remaining word is omp's.
    // Get this backwards and `mav --model x` silently launches an agent named
    // `--model`, or drops the flag.
    const { bin, argv, launcher } = deployedHome({
      mav: agentToOmpMd(AGENT, CTX),
    });
    symlinkSync(launcher, join(bin, 'mav'));

    launch(bin, join(bin, 'mav'), ['--model', 'x']);
    expect(recordedArgv(argv)).toContain('--model');

    launch(bin, launcher, ['mav', '--model', 'x']);
    const explicit = recordedArgv(argv);
    expect(explicit).toContain('--model');
    expect(explicit).not.toContain('mav');
  });

  it('REFUSES, naming the path, when the definition is not there', () => {
    // A launcher that fell through to a bare `omp` would start an UNGOVERNED
    // session wearing the persona's name — the failure this whole shape exists
    // to make impossible, and one an operator would not notice for a whole
    // session.
    const { harness, bin, launcher } = deployedHome({
      mav: agentToOmpMd(AGENT, CTX),
    });
    const { status, stderr } = launch(bin, launcher, ['ghost']);
    expect(status).toBeGreaterThan(0);
    expect(stderr).toContain('ghost');
    expect(stderr).toContain(join(harness, ompAgentRel('ghost')));
  });

  describe('a MAIN session starts with the skills omp resolves, as a spawn does', () => {
    // omp honours `autoloadSkills` ONLY for a spawned subagent, which starts
    // with each skill's body injected. The launcher gives a main session the
    // same start, asking omp itself which body each name resolves to.

    /** A SKILL.md as projection writes one: front matter, then the body. */
    const skillMd = (name: string, body: string) =>
      `---\nname: ${name}\ndescription: the ${name} skill\n---\n\n${body}\n`;
    const SKILLS: Record<string, ResolvedFixture> = {
      design: { md: skillMd('design', '# Design\n\nDESIGN_BODY') },
      deliver: { md: skillMd('deliver', '# Deliver\n\nDELIVER_BODY') },
      probe: { md: skillMd('probe', '# Probe\n\nPROBE_BODY') },
      signify: { md: skillMd('signify', '# Signify\n\nSIGNIFY_BODY') },
    };
    const SCRIBE = [
      '---',
      'name: scribe',
      'description: "writes"',
      'autoloadSkills:',
      '  - signify',
      '  - probe',
      '---',
      '',
      'BODY',
      '',
    ].join('\n');
    const MAV = agentToOmpMd(
      { ...(AGENT as object), skills: ['deliver', 'design'] } as never,
      CTX,
    );

    /** Launch `agent` in `home`; its exit, stderr and appended prompt. */
    const run = (home: DeployedHome, agent: string, cwd?: string) => {
      const { status, stderr } = launch(home.bin, home.launcher, [agent], cwd);
      const args = recordedArgv(home.argv);
      const prompt = args[args.indexOf('--append-system-prompt') + 1] as string;
      return { status, stderr, prompt };
    };

    it('inlines what omp resolves, in listed order, for BOTH spellings', () => {
      // BOTH SPELLINGS, because both arrive here. An operator hand-editing a
      // definition writes YAML's BLOCK sequence; `agentToOmpMd` emits the FLOW
      // sequence from the `skills` projection hands it.
      const home = deployedHome({ scribe: SCRIBE, mav: MAV }, SKILLS);

      const block = run(home, 'scribe');
      expect(block).toMatchObject({ status: 0, stderr: '' });
      expect(
        block.prompt.endsWith(
          'BODY\n\n# Skill: signify\n\n# Signify\n\nSIGNIFY_BODY\n\n# Skill: probe\n\n# Probe\n\nPROBE_BODY',
        ),
      ).toBe(true);

      // THE PROJECTOR'S OWN BYTES: what forge wrote out of an agent's `skills`
      // is what the launcher must read back in.
      const flow = run(home, 'mav');
      expect(flow).toMatchObject({ status: 0, stderr: '' });
      expect(
        flow.prompt.endsWith(
          '# Skill: deliver\n\n# Deliver\n\nDELIVER_BODY\n\n# Skill: design\n\n# Design\n\nDESIGN_BODY',
        ),
      ).toBe(true);
      expect(flow.prompt).toContain('Hero archetype of end-to-end delivery');
      // Neither the definition's front matter nor any skill's reaches the model.
      for (const { prompt } of [block, flow]) {
        expect(prompt).not.toContain('autoloadSkills');
        expect(prompt).not.toMatch(/^(name|description):/m);
        expect(prompt).not.toContain('skill://');
        expect(prompt).not.toContain('Base directory');
      }
    });

    it('inlines none under `--no-skills`, and warns once under `--skills`', () => {
      // `--no-skills` is omp's own "load none", so the session starts with none
      // — not with bodies it would never have loaded, nor with references to them.
      const none = deployedHome({ scribe: SCRIBE }, SKILLS);
      const off = launch(none.bin, none.launcher, ['scribe', '--no-skills']);
      expect(off).toEqual({ status: 0, stderr: '' });
      const offArgs = recordedArgv(none.argv);
      const offPrompt = offArgs[offArgs.indexOf('--append-system-prompt') + 1];
      expect(offPrompt).not.toContain('# Skill:');
      expect(offPrompt).not.toContain('## Required reading');
      expect(offArgs).toContain('--no-skills');
      expect(() => readFileSync(none.reads)).toThrow();

      // A `--skills` filter is not mirrored; the launcher says so once, and the
      // flag still reaches omp.
      const filtered = deployedHome({ scribe: SCRIBE }, SKILLS);
      const { status, stderr } = launch(filtered.bin, filtered.launcher, [
        'scribe',
        '--skills=sig*',
      ]);
      expect(status).toBe(0);
      const lines = stderr.split('\n').filter(Boolean);
      expect(lines).toHaveLength(1);
      expect(lines[0]).toMatch(/^omp-agent: agent scribe: --skills/);
      expect(recordedArgv(filtered.argv)).toContain('--skills=sig*');
    });

    it('asks omp from the launch directory, where project skills resolve', () => {
      const home = deployedHome({ scribe: SCRIBE }, SKILLS);
      const project = join(home.sandbox, 'project');
      mkdirSync(project);
      run(home, 'scribe', project);
      const reads = readFileSync(home.reads, 'utf-8')
        .split('\n')
        .filter(Boolean);
      expect(reads.length).toBeGreaterThan(0);
      expect(new Set(reads)).toEqual(new Set([project]));
    });

    it('degrades a skill omp cannot resolve to its reference, and says so', () => {
      // Never dropped in silence: the name still reaches the model, and the
      // operator is told which skill, for which agent, before omp starts.
      const { probe: _, ...withoutProbe } = SKILLS;
      const home = deployedHome({ scribe: SCRIBE }, withoutProbe);
      const { status, stderr, prompt } = run(home, 'scribe');
      expect(status).toBe(0);
      const lines = stderr.split('\n').filter(Boolean);
      expect(lines).toHaveLength(1);
      expect(lines[0]).toMatch(/^omp-agent:/);
      expect(lines[0]).toContain('scribe');
      expect(lines[0]).toContain('probe');
      expect(prompt).toContain('# Skill: signify');
      expect(prompt).not.toContain('# Skill: probe');
      expect(prompt).toMatch(
        /\n## Required reading\n[\s\S]*\n- `skill:\/\/probe`$/,
      );
    });

    it('adds nothing, and asks omp nothing, for a definition without `autoloadSkills`', () => {
      const home = deployedHome({ mav: agentToOmpMd(AGENT, CTX) }, SKILLS);
      const { status, stderr, prompt } = run(home, 'mav');
      expect({ status, stderr }).toEqual({ status: 0, stderr: '' });
      expect(prompt).not.toContain('# Skill:');
      expect(prompt).not.toContain('## Required reading');
      expect(() => readFileSync(home.reads)).toThrow();
    });
  });
});

describe('omp capability interface', () => {
  it('emits one session module for the concept journal, placed where a plain omp loads it', () => {
    const surface = ompHarnessAdapter.capabilitySurface?.() ?? [];
    expect(surface.map((s) => [s.scope, s.filename])).toEqual([
      [SESSION_SCOPE, 'cratylus-concepts.ts'],
    ]);
    expect(
      ompHarnessAdapter.scopedRel?.('cratylus-concepts.ts', SESSION_SCOPE),
    ).toBe('agent/extensions/cratylus-concepts.ts');
  });

  it('asks the installed command for the interface and carries none of its own', () => {
    const [module] = ompCapabilityExtensions();
    const content = module?.content ?? '';
    expect(content).toContain('const COMMAND = "cratylus";');
    expect(content).toContain('const CAPABILITY = "concepts";');
    expect(content).toContain('[CAPABILITY, "--explain"]');
    // No verb, journal location or entry field of the capability is spelled here.
    for (const word of [
      'supersede',
      'retire',
      'decide',
      'design/journal',
      'concept journal',
    ])
      expect(content).not.toContain(word);
  });
});
