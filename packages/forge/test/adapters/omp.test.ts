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
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  OMP_CRATYLUS_MODULE,
  OMP_ISOLATION_MODULE,
  agentToOmpMd,
  ompCapabilityExtensions,
  ompHarnessAdapter,
} from '../../src/adapters/omp/index.js';
import { SESSION_SCOPE } from '../../src/core/harness-adapter.js';
import { FIXTURE_MANIFEST } from '../fixture-manifest.js';

/** What the emitted CRATYLUS module reaches of omp itself, which only an omp
 *  process resolves: its agent discovery, front-matter parser, command-line parser,
 *  model, advisor, prewalk and spawn resolvers, skills and settings. Each stand-in
 *  answers from `omp` below and records what it was asked. */
const omp = vi.hoisted(() => {
  /** The session's runtime settings layer, as `overlayLayers().overrides` reads it. */
  const runtime: Record<string, unknown> = {};
  /** Every runtime override written or cleared, in order: `[id, value]`. */
  const writes: [string, unknown][] = [];
  /** The object holding `path`'s last key, its parents made as needed. */
  const at = (path: string[]) => {
    let node = runtime;
    for (const key of path.slice(0, -1)) {
      node[key] ??= {};
      node = node[key] as Record<string, unknown>;
    }
    return node;
  };
  /** A setting handle whose override lands in `runtime`, as omp's does. */
  const handle = (id: string) => {
    const segments = id.split('.');
    const last = segments.at(-1) ?? id;
    return {
      segments,
      override: (_scope: unknown, value: unknown) => {
        at(segments)[last] = structuredClone(value);
        writes.push([id, value]);
      },
      clearOverride: () => {
        delete at(segments)[last];
        // An emptied parent goes too, so a cleared layer reads as one never written.
        for (let depth = segments.length - 1; depth > 0; depth--) {
          const path = segments.slice(0, depth);
          const parent = at(path);
          const key = path.at(-1) ?? '';
          if (Object.keys(parent[key] as object).length === 0)
            delete parent[key];
        }
        writes.push([id, undefined]);
      },
    };
  };
  return {
    agents: [] as Record<string, unknown>[],
    discovered: [] as string[],
    /** What omp's `parseArgs` read off the command line. */
    args: {} as {
      model?: string;
      thinking?: string;
      tools?: string[];
      advisor?: boolean;
      prewalk?: boolean;
      noPrewalk?: boolean;
      prewalkInto?: string;
    },
    parsed: [] as { argv: string[]; flags: Map<string, { type: string }> }[],
    /** The host's `modelRoles`, as the stand-in resolvers expand `@role`. */
    roles: {} as Record<string, string>,
    /** The host's `task.agentModelOverrides`. */
    overrides: {} as Record<string, string>,
    /** The host's `task.agentAdvisor` and `task.agentPrewalk`. */
    agentAdvisor: {} as Record<string, string>,
    agentPrewalk: {} as Record<string, string>,
    selections: [] as Record<string, unknown>[],
    /** The skills omp discovered for the session. */
    skills: [] as { name: string; filePath: string }[],
    runtime,
    writes,
    handle,
    /** The session's own settings, which the module must read and write. */
    scope: {
      standIn: 'session settings',
      overlayLayers: () => ({ overrides: structuredClone(runtime) }),
    },
  };
});
vi.mock('@oh-my-pi/pi-coding-agent/task/discovery', () => ({
  discoverAgents: async (cwd: string) => {
    omp.discovered.push(cwd);
    return { agents: omp.agents };
  },
}));
vi.mock('@oh-my-pi/pi-coding-agent/cli/args', () => ({
  parseArgs: (argv: string[], flags: Map<string, { type: string }>) => {
    omp.parsed.push({ argv, flags });
    return omp.args;
  },
}));
// omp's dispatch precedence, as far as these legs need it: the settings override,
// else the declaration's selectors, else the session's model, `@role` expanded; and
// a `fixture/<id>[:level]` selector resolving with its level explicit.
vi.mock('@oh-my-pi/pi-coding-agent/config/model-resolver', () => ({
  resolveAgentModelSelection: (options: Record<string, unknown>) => {
    omp.selections.push(options);
    const source =
      options.settingsOverride ??
      options.agentModel ??
      options.activeModelPattern;
    const patterns = source === undefined ? [] : [source as string].flat();
    return {
      patterns: patterns.map((p) =>
        p.startsWith('@') ? (omp.roles[p.slice(1)] ?? p) : p,
      ),
      role: undefined,
    };
  },
  resolveModelOverrideWithAuthFallback: async (patterns: string[]) => {
    for (const pattern of patterns) {
      const [selector = '', level] = pattern.split(':');
      const [provider, id] = selector.split('/');
      if (provider === 'fixture' && id)
        return {
          model: { provider, id },
          thinkingLevel: level,
          explicitThinkingLevel: level !== undefined,
          authFallbackUsed: false,
        };
    }
    return { explicitThinkingLevel: false, authFallbackUsed: false };
  },
  DEFAULT_PREWALK_TARGET: '@smol',
  // `task.agentAdvisor` / `task.agentPrewalk` first ("off" wins, a pattern is that
  // pattern), then the declaration's `advisor` / `prewalk`.
  resolveAgentAdvisorSelection: (options: {
    settingsOverride?: string;
    agentAdvisor?: boolean | string;
  }) => {
    if (options.settingsOverride === 'off') return undefined;
    if (options.settingsOverride !== undefined)
      return { model: options.settingsOverride };
    if (options.agentAdvisor === true) return {};
    return typeof options.agentAdvisor === 'string'
      ? { model: options.agentAdvisor }
      : undefined;
  },
  resolveAgentAdvisorRolePattern: (pattern: string) =>
    pattern.startsWith('@')
      ? (omp.roles[pattern.slice(1)] ?? pattern)
      : pattern,
  resolveAgentPrewalkPattern: (options: {
    settingsOverride?: string;
    agentPrewalk?: boolean | string;
  }) => {
    if (options.settingsOverride === 'off') return undefined;
    if (options.settingsOverride !== undefined) return options.settingsOverride;
    if (options.agentPrewalk === true) return '@smol';
    return typeof options.agentPrewalk === 'string'
      ? options.agentPrewalk
      : undefined;
  },
  resolveConfiguredModelPatterns: (pattern: string) => {
    if (!pattern.startsWith('@')) return [pattern];
    const role = omp.roles[pattern.slice(1)];
    return role === undefined ? [] : [role];
  },
}));
vi.mock('@oh-my-pi/pi-coding-agent/config/settings', () => ({
  findScopedSettings: () => omp.scope,
  settings: { standIn: 'global settings' },
}));
vi.mock('@oh-my-pi/pi-coding-agent/config/registry', () => ({
  lookup: (id: string) => omp.handle(id),
}));
vi.mock('@oh-my-pi/pi-coding-agent/config/model-settings', () => ({
  cfgModelRoles: omp.handle('modelRoles'),
}));
vi.mock('@oh-my-pi/pi-coding-agent/session/settings', () => ({
  cfgPersonality: omp.handle('personality'),
  cfgPrewalkEnabled: omp.handle('prewalk.enabled'),
}));
vi.mock('@oh-my-pi/pi-coding-agent/tools/settings', () => ({
  cfgReadSummarizeEnabled: omp.handle('read.summarize.enabled'),
}));
vi.mock('@oh-my-pi/pi-coding-agent/task/settings', () => ({
  cfgTaskAgentModelOverrides: { get: () => omp.overrides },
  cfgTaskAgentAdvisor: { get: () => omp.agentAdvisor },
  cfgTaskAgentPrewalk: { get: () => omp.agentPrewalk },
  cfgTaskPrewalk: { get: () => false },
}));
vi.mock('@oh-my-pi/pi-coding-agent/task/prewalk', () => ({
  resolveAgentPrewalkDefault: (agent: { prewalk?: boolean | string }) =>
    agent.prewalk,
}));
// omp's spawn-policy meanings: `*` or absent anyone, empty no one, a list exactly those.
vi.mock('@oh-my-pi/pi-coding-agent/task/spawn-policy', () => ({
  resolveSpawnPolicy: (spawns?: string) => {
    const said = (spawns ?? '*').trim();
    if (said === '*')
      return { enabled: true, allowedAgents: null, allowedErrorText: '*' };
    const allowed = said.split(',').filter(Boolean);
    return allowed.length === 0
      ? {
          enabled: false,
          allowedAgents: allowed,
          allowedErrorText: 'none (spawns disabled for this agent)',
        }
      : {
          enabled: true,
          allowedAgents: allowed,
          allowedErrorText: allowed.join(','),
        };
  },
}));
vi.mock('@oh-my-pi/pi-coding-agent/extensibility/skills', () => ({
  getActiveSkills: () => omp.skills,
  buildSkillPromptMessage: async (
    skill: { name: string },
    _input: unknown,
    kind: string,
  ) => ({ message: `<${kind} skill ${skill.name}: its instructions>` }),
}));
// Top-level `key: "json"` lines between the fences: all a fixture here writes.
vi.mock('@oh-my-pi/pi-utils', () => ({
  parseFrontmatter: (text: string) => {
    const [, block = '', body = ''] =
      /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(text) ?? [];
    return {
      frontmatter: Object.fromEntries(
        block.split('\n').map((line) => {
          const at = line.indexOf(':');
          return [line.slice(0, at), JSON.parse(line.slice(at + 1))];
        }),
      ),
      body,
    };
  },
}));
/** Temp dirs the legs below that touch disk create. */
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
    // honours it for a DISPATCHED subagent, so the list reaching these bytes is
    // what a dispatch of this one definition preloads.
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

  it('asserts NO identity line — a dispatched body needs none', () => {
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

describe('omp launch', () => {
  it('composes no launcher, persona overlay or badge from the agents', () => {
    // Starting a session as an agent goes only through `omp --agent`, which the
    // capability module registers: what the adapter composes from the agents is
    // the dispatch isolation module, and only for an agent declaring a worktree.
    expect(ompHarnessAdapter.launchSurface?.([AGENT])).toEqual([]);
    expect(
      ompHarnessAdapter
        .launchSurface?.([
          AGENT,
          { ...(AGENT as object), name: 'iso', isolation: {} } as never,
        ])
        .map((f) => f.filename),
    ).toEqual([
      OMP_ISOLATION_MODULE,
      OMP_ISOLATION_MODULE,
      OMP_ISOLATION_MODULE,
    ]);
  });
});

describe('omp capability interface', () => {
  const PATH = process.env.PATH;
  afterEach(() => {
    process.env.PATH = PATH;
  });

  /** The emitted module's factory, written to disk beside a `cratylus` on PATH
   *  that answers `--explain` with `explanation` and any other call with its argv
   *  as JSON (or, for a verb named `refuse`, a refusal on stderr). */
  async function emitted(
    explanation: unknown,
  ): Promise<(pi: unknown) => Promise<void>> {
    const dir = mkdtempSync(join(tmpdir(), 'omp-capability-'));
    tmp.push(dir);
    const bin = join(dir, 'bin');
    mkdirSync(bin);
    const said = join(dir, 'explanation.json');
    writeFileSync(said, JSON.stringify(explanation));
    writeFileSync(
      join(bin, 'cratylus'),
      [
        `#!${process.execPath}`,
        'const args = process.argv.slice(2);',
        `if (args.includes('--explain')) process.stdout.write(require('node:fs').readFileSync(${JSON.stringify(said)}, 'utf8'));`,
        "else if (args[1] === 'refuse') { process.stderr.write('cratylus concepts refuse: its own words\\n'); process.exit(1); }",
        'else process.stdout.write(JSON.stringify({ args, cwd: process.cwd() }));',
        '',
      ].join('\n'),
      { mode: 0o755 },
    );
    process.env.PATH = `${bin}:${PATH}`;
    const [module] = ompCapabilityExtensions();
    const file = join(dir, OMP_CRATYLUS_MODULE);
    writeFileSync(file, module?.content ?? '');
    // Dynamic: the module under test is the emitted bytes, written to disk here.
    return (await import(file)).default;
  }

  it('emits ONE module, named for cratylus, placed where a plain omp loads it', () => {
    const surface = ompHarnessAdapter.capabilitySurface?.() ?? [];
    expect(surface.map((s) => [s.scope, s.filename])).toEqual([
      [SESSION_SCOPE, OMP_CRATYLUS_MODULE],
    ]);
    expect(OMP_CRATYLUS_MODULE).toBe('cratylus.ts');
    expect(
      ompHarnessAdapter.scopedRel?.(OMP_CRATYLUS_MODULE, SESSION_SCOPE),
    ).toBe('agent/extensions/cratylus.ts');
  });

  it('asks the installed command for each interface and carries none of its own', () => {
    const [module] = ompCapabilityExtensions();
    const content = module?.content ?? '';
    expect(content).toContain('const COMMAND = "cratylus";');
    expect(content).toContain(
      'const CAPABILITIES: readonly string[] = ["concepts"];',
    );
    expect(content).toContain('[capability, "--explain"]');
    // No verb, journal location or entry field of a capability is spelled here.
    for (const word of [
      'supersede',
      'retire',
      'decide',
      'design/journal',
      'concept journal',
    ])
      expect(content).not.toContain(word);
  });

  describe('composed from a stand-in installed command', () => {
    interface Registered {
      name: string;
      parameters: {
        properties: Record<string, Record<string, unknown>>;
        required: string[];
      };
      approval(args: Record<string, unknown>): string;
      execute(
        id: string,
        args: Record<string, unknown>,
        signal: undefined,
        update: undefined,
        ctx: { cwd: string },
      ): Promise<{ content: { text: string }[] }>;
    }
    /** The tools the emitted module registers against the stand-in command. */
    async function load(explanation: unknown): Promise<Registered[]> {
      const factory = await emitted(explanation);
      const registered: Registered[] = [];
      await factory({
        typebox: { Type: { Unsafe: (schema: unknown) => schema } },
        registerTool: (tool: Registered) => registered.push(tool),
        registerFlag: () => {},
        on: () => {},
      });
      return registered;
    }

    const parameter = (
      name: string,
      schema: Record<string, unknown>,
      positional = false,
    ) => ({
      name,
      description: `the ${name}`,
      required: positional,
      schema,
      ...(positional ? { positional: true } : {}),
    });
    const verb = (
      name: string,
      effect: 'reads' | 'appends',
      parameters: unknown[],
    ) => ({ name, concept: 'c', purpose: 'p', when: 'w', effect, parameters });
    const EXPLANATION = {
      name: 'stand in',
      purpose: 'p',
      when: 'w',
      verbs: [
        verb('look', 'reads', [
          parameter('context', { type: 'string' }),
          parameter('mode', { type: 'string' }),
        ]),
        verb('put', 'appends', [
          parameter('word', { type: 'string' }, true),
          parameter('context', { type: 'string' }),
          parameter('mode', { type: 'string', enum: ['a', 'b'] }),
          parameter('from', { type: 'array', items: { type: 'string' } }),
          parameter('open', { type: 'boolean' }),
        ]),
        verb('refuse', 'appends', []),
      ],
    };

    it('registers one tool per capability, its verb required, approval by effect', async () => {
      const [tool, ...rest] = await load(EXPLANATION);
      expect(rest).toEqual([]);
      expect(tool?.name).toBe('stand_in');
      expect(tool?.parameters.required).toEqual(['verb']);
      expect(tool?.parameters.properties.verb?.enum).toEqual([
        'look',
        'put',
        'refuse',
      ]);
      expect(tool?.approval({ verb: 'look' })).toBe('read');
      expect(tool?.approval({ verb: 'put' })).toBe('write');
    });

    it('keeps one schema where every verb declares it alike, and every distinct one under anyOf', async () => {
      const [tool] = await load(EXPLANATION);
      const { context, mode, from } = tool?.parameters.properties ?? {};
      expect(context).toEqual({
        type: 'string',
        description:
          'look (optional): the context\nput (optional): the context',
      });
      expect(from).toEqual({
        type: 'array',
        items: { type: 'string' },
        description: 'put (optional): the from',
      });
      expect(mode).toEqual({
        anyOf: [{ type: 'string' }, { type: 'string', enum: ['a', 'b'] }],
        description: 'look (optional): the mode\nput (optional): the mode',
      });
    });

    it('gives every value as one --flag=value token, so a dash-led value is never a flag', async () => {
      const [tool] = await load(EXPLANATION);
      const cwd = mkdtempSync(join(tmpdir(), 'omp-capability-cwd-'));
      tmp.push(cwd);
      const result = await tool?.execute(
        'id',
        {
          verb: 'put',
          word: 'w4',
          context: '--explain',
          mode: '-- a dash-led value',
          from: ['--a', 'b'],
          open: true,
        },
        undefined,
        undefined,
        { cwd },
      );
      expect(JSON.parse(result?.content[0]?.text ?? '')).toEqual({
        args: [
          'concepts',
          'put',
          'w4',
          '--context=--explain',
          '--mode=-- a dash-led value',
          '--from=--a',
          '--from=b',
          '--open',
        ],
        cwd: realpathSync(cwd),
      });
    });

    it('gives a dash-led positional as a flag-shaped token the command refuses, never as a request for help', async () => {
      const [tool] = await load(EXPLANATION);
      const args = async (word: string) =>
        JSON.parse(
          (
            await tool?.execute(
              'id',
              { verb: 'put', word },
              undefined,
              undefined,
              { cwd: tmpdir() },
            )
          )?.content[0]?.text ?? '',
        ).args;
      expect(await args('--help')).toEqual(['concepts', 'put', '--help=']);
      expect(await args('--explain')).toEqual([
        'concepts',
        'put',
        '--explain=',
      ]);
      expect(await args('-h')).toEqual(['concepts', 'put', '-h=']);
      expect(await args('--x=y')).toEqual(['concepts', 'put', '--x=y']);
      expect(await args('-')).toEqual(['concepts', 'put', '-']);
    });

    it("fails a refused call with the command's own message", async () => {
      const [tool] = await load(EXPLANATION);
      await expect(
        tool?.execute('id', { verb: 'refuse' }, undefined, undefined, {
          cwd: tmpdir(),
        }),
      ).rejects.toThrow('cratylus concepts refuse: its own words');
    });
  });

  describe('launches a main session as an agent declaration omp discovers', () => {
    type Handler = (event: unknown, ctx: unknown) => unknown;
    const BASE = ['the base prompt'];

    /** A declaration file as omp would discover it, and omp's parse of it. */
    function declare(fields: Record<string, unknown>, body: string) {
      const dir = mkdtempSync(join(tmpdir(), 'omp-agent-'));
      tmp.push(dir);
      const filePath = join(dir, `${String(fields.name)}.md`);
      writeFileSync(
        filePath,
        `---\n${Object.entries(fields)
          .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
          .join('\n')}\n---\n${body}\n`,
      );
      return {
        name: fields.name,
        description: fields.description,
        systemPrompt: body,
        ...(fields.model === undefined ? {} : { model: [fields.model] }),
        thinkingLevel: fields['thinking-level'],
        source: 'user',
        filePath,
      };
    }
    const CARTOGRAPHER = () =>
      declare(
        {
          name: 'cartographer',
          description: 'Charts the estuary.',
          model: 'fixture/declared',
          'thinking-level': 'high',
          tools: ['read', 'write'],
          mark: '⚓',
        },
        'Map the estuary before drawing its shipping routes.',
      );

    afterEach(() => {
      omp.agents = [];
      omp.discovered.length = 0;
      omp.parsed.length = 0;
      omp.args = {};
      omp.roles = {};
      omp.overrides = {};
      omp.agentAdvisor = {};
      omp.agentPrewalk = {};
      omp.selections.length = 0;
      omp.skills = [];
      for (const key of Object.keys(omp.runtime)) delete omp.runtime[key];
      omp.writes.length = 0;
      vi.restoreAllMocks();
    });

    /** The emitted module loaded into a stand-in omp started with `--agent
     *  <flag>` (or without it), recording every session action it takes. */
    async function started(flag?: string) {
      const factory = await emitted({
        name: 'stand in',
        purpose: 'p',
        when: 'w',
        verbs: [],
      });
      const handlers = new Map<string, Handler>();
      const did = {
        flags: [] as [string, unknown][],
        models: [] as unknown[],
        efforts: [] as unknown[],
        tools: [] as unknown[],
        status: [] as [string, unknown][],
      };
      await factory({
        typebox: { Type: { Unsafe: (schema: unknown) => schema } },
        registerTool: () => {},
        registerFlag: (name: string, options: unknown) =>
          did.flags.push([name, options]),
        getFlag: (name: string) => (name === 'agent' ? flag : undefined),
        on: (event: string, handler: Handler) => handlers.set(event, handler),
        setModel: async (model: unknown) => did.models.push(model),
        setThinkingLevel: (level: unknown) => did.efforts.push(level),
        setActiveTools: async (tools: unknown) => did.tools.push(tools),
      });
      const ctx = (kind = 'main') => ({
        cwd: '/the/session/cwd',
        agent: { kind },
        model: { provider: 'fixture', id: 'base' },
        modelRegistry: { standIn: 'registry' },
        ui: {
          setStatus: (key: string, text: unknown) =>
            did.status.push([key, text]),
          notify: () => {},
        },
      });
      const fire = async (
        event: string,
        kind?: string,
        payload: unknown = { systemPrompt: BASE },
      ) => handlers.get(event)?.(payload, ctx(kind));
      return { did, fire };
    }

    it('registers the string flag `agent`', async () => {
      const { did } = await started();
      expect(did.flags).toEqual([
        ['agent', expect.objectContaining({ type: 'string' })],
      ]);
    });

    it("runs on the declaration's model and effort, its mark and name on the status line", async () => {
      omp.agents = [CARTOGRAPHER()];
      const { did, fire } = await started('cartographer');
      await fire('session_start');
      expect(omp.discovered).toEqual(['/the/session/cwd']);
      // omp's own dispatch resolution, asked of the declaration's selectors with the
      // session's own settings.
      expect(omp.selections).toEqual([
        {
          settingsOverride: undefined,
          agentModel: ['fixture/declared'],
          settings: omp.scope,
          activeModelPattern: 'fixture/base',
        },
      ]);
      expect(did.models).toEqual([{ provider: 'fixture', id: 'declared' }]);
      expect(did.efforts).toEqual(['high']);
      expect(did.status).toEqual([['cratylus-agent', '⚓ cartographer']]);
    });

    it('takes the effort a selector carries, directly or through a role alias, as dispatch does', async () => {
      omp.roles = { survey: 'fixture/declared:low' };
      for (const [model, level, effort] of [
        ['fixture/declared:high', undefined, 'high'],
        ['@survey', 'high', 'low'],
      ] as const) {
        omp.agents = [
          declare(
            {
              name: 'surveyor',
              description: 'd',
              model,
              ...(level ? { 'thinking-level': level } : {}),
            },
            'Survey the inlet.',
          ),
        ];
        const { did, fire } = await started('surveyor');
        await fire('session_start');
        expect(did.models).toEqual([{ provider: 'fixture', id: 'declared' }]);
        expect(did.efforts, model).toEqual([effort]);
      }
    });

    it("lets the operator's own --model and --thinking win, the body still carried", async () => {
      omp.agents = [CARTOGRAPHER()];
      omp.args = { model: 'fixture/base', thinking: 'low' };
      const both = await started('cartographer');
      await both.fire('session_start');
      expect(both.did.models).toEqual([]);
      expect(both.did.efforts).toEqual([]);
      const { systemPrompt } = (await both.fire('before_agent_start')) as {
        systemPrompt: string[];
      };
      expect(systemPrompt.join('\n')).toContain(
        'Map the estuary before drawing its shipping routes.',
      );
      expect(omp.parsed.at(-1)?.argv).toEqual(process.argv.slice(2));
      expect([...(omp.parsed.at(-1)?.flags.keys() ?? [])]).toEqual(['agent']);
      // Each flag wins its own dimension only.
      omp.args = { thinking: 'low' };
      const effort = await started('cartographer');
      await effort.fire('session_start');
      expect(effort.did.models).toEqual([
        { provider: 'fixture', id: 'declared' },
      ]);
      expect(effort.did.efforts).toEqual([]);
    });

    it('launches a bundled declaration, which has no file and no mark', async () => {
      omp.agents = [
        {
          name: 'scout',
          description: 'Explores.',
          systemPrompt: 'The bundled scout body.',
          source: 'bundled',
          filePath: 'embedded:scout.md',
        },
      ];
      const { did, fire } = await started('scout');
      await fire('session_start');
      expect(did.status).toEqual([['cratylus-agent', 'scout']]);
      const { systemPrompt } = (await fire('before_agent_start')) as {
        systemPrompt: string[];
      };
      expect(systemPrompt.join('\n')).toContain('The bundled scout body.');
    });

    it('shows the name alone for a declaration without a mark', async () => {
      omp.agents = [
        declare(
          { name: 'surveyor', description: 'd', model: 'fixture/declared' },
          'Measure the inlet.',
        ),
      ];
      const { did, fire } = await started('surveyor');
      await fire('session_start');
      expect(did.status).toEqual([['cratylus-agent', 'surveyor']]);
    });

    it('appends the body, front matter as prose, to every turn of the main session', async () => {
      omp.agents = [CARTOGRAPHER()];
      const { fire } = await started('cartographer');
      await fire('session_start');
      for (const _turn of [1, 2]) {
        const { systemPrompt } = (await fire('before_agent_start')) as {
          systemPrompt: string[];
        };
        expect(systemPrompt.slice(0, 1)).toEqual(BASE);
        const added = systemPrompt.slice(1).join('\n');
        expect(added).toContain(
          'Map the estuary before drawing its shipping routes.',
        );
        expect(added).toContain('cartographer');
        expect(added).toContain('Charts the estuary.');
        expect(added).not.toContain('---');
        expect(added).not.toMatch(/^(?:name|model|thinking-level|mark):/m);
      }
    });

    it('never touches the active tools, whatever --tools the operator gave', async () => {
      omp.agents = [CARTOGRAPHER()];
      omp.args = { tools: ['read', 'grep'] };
      const { did, fire } = await started('cartographer');
      await fire('session_start');
      expect(did.tools).toEqual([]);
    });

    it('reads the declaration afresh for each new session', async () => {
      omp.agents = [CARTOGRAPHER()];
      const { fire } = await started('cartographer');
      await fire('session_start');
      omp.agents = [
        declare(
          { name: 'cartographer', description: 'd', model: 'fixture/declared' },
          'The revised charting brief.',
        ),
      ];
      await fire('session_switch');
      const { systemPrompt } = (await fire('before_agent_start')) as {
        systemPrompt: string[];
      };
      expect(omp.discovered).toHaveLength(2);
      expect(systemPrompt.join('\n')).toContain('The revised charting brief.');
      expect(systemPrompt.join('\n')).not.toContain('Map the estuary');
    });

    it('does nothing in a subagent session, or without the flag', async () => {
      omp.agents = [CARTOGRAPHER()];
      const sub = await started('cartographer');
      await sub.fire('session_start', 'sub');
      expect(await sub.fire('before_agent_start', 'sub')).toBeUndefined();
      const plain = await started();
      await plain.fire('session_start');
      expect(await plain.fire('before_agent_start')).toBeUndefined();
      for (const { did } of [sub, plain])
        expect(did).toEqual({
          flags: [['agent', expect.anything()]],
          models: [],
          efforts: [],
          tools: [],
          status: [],
        });
      expect(omp.discovered).toEqual([]);
      expect(omp.runtime).toEqual({});
      expect(omp.writes).toEqual([]);
      for (const { fire } of [sub, plain])
        expect(
          await fire('before_subagent_spawn', undefined, { agent: 'pilot' }),
        ).toBeUndefined();
    });

    it('ends startup, naming the unknown agent, before any turn', async () => {
      omp.agents = [CARTOGRAPHER()];
      const exit = vi.spyOn(process, 'exit').mockImplementation((code) => {
        throw new Error(`exit ${code}`);
      });
      const stderr = vi
        .spyOn(process.stderr, 'write')
        .mockImplementation(() => true);
      const { did, fire } = await started('absent');
      await expect(fire('session_start')).rejects.toThrow('exit 1');
      expect(exit).toHaveBeenCalledWith(1);
      expect(String(stderr.mock.calls[0]?.[0])).toMatch(
        /Unknown agent "absent"/,
      );
      expect(did.status).toEqual([]);
      expect(await fire('before_agent_start')).toBeUndefined();
    });

    /** The cartographer, declaring the rest of what a dispatched child holds. */
    const WHOLE = () => ({
      ...CARTOGRAPHER(),
      spawns: ['surveyor', 'sounder'],
      autoloadSkills: ['tides', 'absent-skill', 'buoys'],
      readSummarize: false,
      advisor: 'fixture/adviser',
      prewalk: 'fixture/fast',
    });
    const clearRuntime = () => {
      for (const key of Object.keys(omp.runtime)) delete omp.runtime[key];
      omp.writes.length = 0;
    };

    it('holds the rest of the declaration as session-scoped overrides, as dispatch resolves it', async () => {
      omp.agents = [WHOLE()];
      omp.runtime.modelRoles = { default: 'fixture/base' };
      const { fire } = await started('cartographer');
      await fire('session_start');
      expect(omp.runtime).toEqual({
        modelRoles: { default: 'fixture/base', advisor: 'fixture/adviser' },
        personality: 'none',
        read: { summarize: { enabled: false } },
        advisor: { enabled: true },
        prewalk: { enabled: true },
      });
      // The declared pre-planning target stands in omp's default target (`@smol`)
      // only while the live session arms it.
      expect(
        omp.writes.filter(
          ([id]) => id === 'modelRoles' || id === 'prewalk.enabled',
        ),
      ).toEqual([
        ['modelRoles', { default: 'fixture/base', advisor: 'fixture/adviser' }],
        ['prewalk.enabled', false],
        [
          'modelRoles',
          {
            default: 'fixture/base',
            advisor: 'fixture/adviser',
            smol: 'fixture/fast',
          },
        ],
        ['prewalk.enabled', true],
        ['modelRoles', { default: 'fixture/base', advisor: 'fixture/adviser' }],
      ]);
    });

    it('runs advisor and pre-planning as a child would: per-agent settings first, undeclared off', async () => {
      omp.agents = [WHOLE()];
      omp.agentAdvisor = { cartographer: 'off' };
      omp.agentPrewalk = { cartographer: 'off' };
      await (await started('cartographer')).fire('session_start');
      expect(omp.runtime).toEqual({
        personality: 'none',
        read: { summarize: { enabled: false } },
        advisor: { enabled: false },
        prewalk: { enabled: false },
      });
      clearRuntime();
      // Undeclared: no advisor and no pre-planning; read summarisation the session's own.
      omp.agentAdvisor = {};
      omp.agentPrewalk = {};
      omp.agents = [CARTOGRAPHER()];
      await (await started('cartographer')).fire('session_start');
      expect(omp.runtime).toEqual({
        personality: 'none',
        advisor: { enabled: false },
        prewalk: { enabled: false },
      });
    });

    it("leaves advisor and pre-planning to the operator's --advisor and --prewalk family", async () => {
      for (const args of [
        { advisor: true, prewalk: true },
        { advisor: true, noPrewalk: true },
        { advisor: true, prewalkInto: '@slow' },
      ]) {
        clearRuntime();
        omp.agents = [WHOLE()];
        omp.args = args;
        await (await started('cartographer')).fire('session_start');
        expect(omp.runtime, JSON.stringify(args)).toEqual({
          personality: 'none',
          read: { summarize: { enabled: false } },
        });
      }
    });

    it("carries the declared skills omp knows into every turn, in omp's autoload form", async () => {
      omp.agents = [WHOLE()];
      omp.skills = [
        { name: 'buoys', filePath: '/skills/buoys/SKILL.md' },
        { name: 'tides', filePath: '/skills/tides/SKILL.md' },
      ];
      const { fire } = await started('cartographer');
      await fire('session_start');
      for (const _turn of [1, 2]) {
        const { systemPrompt } = (await fire('before_agent_start')) as {
          systemPrompt: string[];
        };
        expect(systemPrompt.slice(2)).toEqual([
          '<autoload skill tides: its instructions>',
          '<autoload skill buoys: its instructions>',
        ]);
      }
    });

    it("refuses a dispatch the declaration's spawns do not name, in omp's words", async () => {
      const spawning = (agent: string) => ({
        type: 'before_subagent_spawn',
        agent,
        invocationKind: 'task',
        patterns: [],
      });
      omp.agents = [WHOLE()];
      const { fire } = await started('cartographer');
      await fire('session_start');
      for (const agent of ['surveyor', 'sounder'])
        expect(
          await fire('before_subagent_spawn', undefined, spawning(agent)),
        ).toBeUndefined();
      expect(
        await fire('before_subagent_spawn', undefined, spawning('pilot')),
      ).toEqual({
        block: true,
        reason: "Cannot spawn 'pilot'. Allowed: surveyor,sounder",
      });
      // A child's own dispatch is its own declaration's affair.
      expect(
        await fire('before_subagent_spawn', 'sub', spawning('pilot')),
      ).toBeUndefined();
      // As dispatch passes `spawns` to a child: empty or absent is no one, `*` anyone.
      const none =
        "Cannot spawn 'pilot'. Allowed: none (spawns disabled for this agent)";
      for (const [spawns, refusal] of [
        [[], none],
        [undefined, none],
        ['*', undefined],
      ] as const) {
        omp.agents = [{ ...WHOLE(), spawns }];
        const launched = await started('cartographer');
        await launched.fire('session_start');
        expect(
          await launched.fire(
            'before_subagent_spawn',
            undefined,
            spawning('pilot'),
          ),
          String(spawns),
        ).toEqual(
          refusal === undefined ? undefined : { block: true, reason: refusal },
        );
      }
    });

    it('puts back every setting it held and lifts its dispatch policy when the launch ends', async () => {
      omp.agents = [WHOLE()];
      omp.runtime.personality = 'default';
      omp.runtime.modelRoles = { default: 'fixture/base' };
      const before = structuredClone(omp.runtime);
      const { fire } = await started('cartographer');
      await fire('session_start');
      expect(omp.runtime).not.toEqual(before);
      // A switch to a session the name no longer resolves for ends the launch.
      omp.agents = [];
      await fire('session_switch');
      expect(omp.runtime).toEqual(before);
      expect(
        await fire('before_subagent_spawn', undefined, { agent: 'pilot' }),
      ).toBeUndefined();
      expect(await fire('before_agent_start')).toBeUndefined();
    });
  });
});
