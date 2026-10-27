// The omp adapter's gates.
//
// Each leg pins a fact that was MEASURED — against `@oh-my-pi/pi-coding-agent`'s
// own source, or empirically against an installed `omp` binary — and would
// otherwise be held by prose alone. Where a leg exists because something went
// wrong, the wrong thing is named — a fixture pinned to a law outlives the
// incident that produced it, and one pinned to the incident is a museum piece.

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
import { ORIENTATION } from '@cratylus/runtime';
import { kebabToCamel } from '@cratylus/schema';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  OMP_CRATYLUS_MODULE,
  OMP_ISOLATION_MODULE,
  OMP_SESSION_MODULE,
  agentToOmpMd,
  ompCapabilityExtensions,
  ompHarnessAdapter,
  ompRoleRouting,
} from '../../src/adapters/omp/index.js';
import { OMP_CAPABILITY_TOOLS } from '../../src/adapters/omp/render.js';
import { SESSION_SCOPE } from '../../src/core/harness-adapter.js';
import { FIXTURE_MANIFEST } from '../fixture-manifest.js';

/** What the emitted CRATYLUS module reaches of omp itself, which only an omp
 *  process resolves: its agent discovery, front-matter parser, command-line parser,
 *  model, advisor and prewalk resolvers, skills and settings. Each stand-in answers
 *  from `omp` below and records what it was asked. */
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
  // may not carry and a real canon description does ("…and canon: factor
  // catalogs"). Unquoted, the emitted document is a scanner error and omp falls
  // back to a naive line parser, warning once per discovery pass.
  description: 'the software engineer: ships things',
  mark: null,
  key: null,
  ...Object.fromEntries(
    Object.keys(FIXTURE_MANIFEST).map((k) => [kebabToCamel(k), []]),
  ),
  objective: [
    { value: 'delivery ≜ end-to-end integrated green', level: 'fixed' },
  ],
} as never;

/** {@link AGENT} with identity facts of its own. */
const agent = (over: Record<string, unknown>) =>
  ({ ...(AGENT as object), ...over }) as never;

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
  it('carries name, description, the empty key, the model role named for the agent and open dispatch', () => {
    const front = frontMatter(agentToOmpMd(AGENT, CTX));
    expect(front).toEqual({
      name: 'mav',
      description: 'the software engineer: ships things',
      key: 'null',
      model: '["@mav"]',
      spawns: '*',
    });
    expect(Object.keys(front)).toEqual([
      'name',
      'description',
      'key',
      'model',
      'spawns',
    ]);
  });

  it('names its own model role first, then its tier and effort, never a model', () => {
    const routed = agent({ routing: { tier: 'frontier', effort: 'high' } });
    expect(frontMatter(agentToOmpMd(routed, CTX)).model).toBe(
      '["@mav", "@frontier:high"]',
    );
  });

  it('writes every setting in the order omp reads them, each only where it applies', () => {
    const front = frontMatter(
      agentToOmpMd(
        agent({
          mark: { emoji: '✈️', hue: 'green' },
          contract: {
            assignment: { type: 'object', required: ['cut'] },
            deliverable: { type: 'object', required: ['done'] },
          },
          skills: ['design'],
        }),
        CTX,
      ),
    );
    expect(Object.keys(front)).toEqual([
      'name',
      'description',
      'mark',
      'key',
      'model',
      'spawns',
      'output',
      'assignment',
      'autoloadSkills',
    ]);
    expect(front.mark).toBe('✈️');
  });

  it('lets every agent dispatch any agent: `spawns` is `*`, never a list', () => {
    expect(frontMatter(agentToOmpMd(AGENT, CTX)).spawns).toBe('*');
  });

  it('carries the typed handoff as omp’s output and the assignment the extension reads, and never a tools list', () => {
    const contract = {
      assignment: {
        type: 'object',
        properties: { cut: { type: 'string' } },
        required: ['cut'],
      },
      deliverable: {
        type: 'object',
        properties: { done: { type: 'boolean' } },
        required: ['done'],
      },
    } as const;
    const front = frontMatter(agentToOmpMd(agent({ contract }), CTX));
    expect(JSON.parse(front.output as string)).toEqual(contract.deliverable);
    expect(JSON.parse(front.assignment as string)).toEqual(contract.assignment);
    expect(front).not.toHaveProperty('tools');
    expect(frontMatter(agentToOmpMd(AGENT, CTX))).not.toHaveProperty('output');
    expect(frontMatter(agentToOmpMd(AGENT, CTX))).not.toHaveProperty(
      'assignment',
    );
  });

  it('emits `autoloadSkills` for an agent given skills, and only then', () => {
    // The list is the closure projection hands the adapter, rendered in the order it
    // arrives. omp honours it for a DISPATCHED subagent, so the list reaching these
    // bytes is what a dispatch of this one definition preloads.
    //
    // Read off the RENDERED STRING rather than through `frontMatter`: the claim
    // is about the bytes omp's own YAML reader will see, including the quoting
    // and the position of the key inside the fence.
    const declared = agentToOmpMd(
      agent({ skills: ['design', 'deliver'] }),
      CTX,
    );
    expect(declared).toContain(
      '\nautoloadSkills: ["design", "deliver"]\n---\n',
    );

    // An EMPTY list is treated as absent: `autoloadSkills: []` is noise that reads
    // like a declaration.
    for (const bare of [AGENT, agent({ skills: [] })]) {
      const fence = /^---\n([\s\S]*?)\n---\n/.exec(
        agentToOmpMd(bare, CTX),
      )?.[1] as string;
      expect(fence.split('\n')).toHaveLength(5);
      expect(fence).not.toContain('autoloadSkills');
    }
  });

  it('survives a description carrying the characters YAML reserves', () => {
    // A plain scalar may not contain `: `, and a real canon description does
    // ("…and canon: factor catalogs") — unquoted, the document is a scanner
    // error that omp survives only by falling back to a naive `key: value` line
    // parser, invisible until a description grows something the fallback loses
    // too. The round trip is the claim: whatever goes in comes back out.
    const gnarly = 'a "quote", a \\ and a colon: here';
    const out = agentToOmpMd(agent({ description: gnarly }), CTX);
    expect(frontMatter(out).description).toBe(gnarly);
  });

  it('carries the composed body, opening with the name and description', () => {
    // The legs above pass trivially if the body were dropped: a file of front-matter
    // fields and nothing else would satisfy every one of them.
    const body = agentToOmpMd(AGENT, CTX).split('\n---\n')[1] ?? '';
    expect(body).toMatch(/^\n# mav\n\nthe software engineer: ships things\n/);
    expect(body).toContain(
      '- **delivery** — end-to-end integrated green (fixed)',
    );
    expect(body).not.toContain('You are `mav`');
  });
});

describe('omp skill definition', () => {
  it('survives a description carrying the characters YAML reserves', () => {
    // A skill's description holds `: ` as an agent's description does, and its
    // front matter is read by the same YAML parser.
    const gnarly = 'a "quote", a \\ and a colon: here';
    const { content } = ompHarnessAdapter.skillDef({
      name: 'tides',
      trigger: '/tides',
      description: gnarly,
      formalBlock: 'tide ≜ ⟨fixture⟩',
      composedFrom: [],
    });
    expect(frontMatter(content)).toEqual({
      name: 'tides',
      description: gnarly,
    });
  });
});

describe('omp model roles', () => {
  it("binds an agent's own role to its tier and effort", () => {
    expect(ompRoleRouting.agentRole({ tier: 'frontier', effort: 'high' })).toBe(
      '@frontier:high',
    );
  });
});

describe('omp scopes nothing per agent', () => {
  it('narrows no event to one agent, so a hook an agent composes is reported', () => {
    for (const event of Object.keys(ompHarnessAdapter.nativeEvents)) {
      expect(ompHarnessAdapter.scopes(event as never), event).toBe(false);
    }
    expect(ompHarnessAdapter.enforcingSurface).toBeUndefined();
  });

  it('places every scoped module in the session root and refuses an agent scope', () => {
    expect(ompHarnessAdapter.scopedRel?.('m.ts')).toBe('extensions/m.ts');
    expect(ompHarnessAdapter.scopedRel?.('m.ts', SESSION_SCOPE)).toBe(
      'extensions/m.ts',
    );
    expect(() => ompHarnessAdapter.scopedRel?.('m.ts', 'mav')).toThrow(
      /nothing for one agent/,
    );
  });

  it('emits the session hooks once, at the session scope', () => {
    const hooks = [
      { id: 'nudge', events: ['session.start'], command: 'sh nudge.sh' },
    ] as never;
    const out = ompHarnessAdapter.scopeActivatedSurface?.(hooks, [
      'mav',
      'nico',
    ]);
    expect(out?.map((p) => [p.filename, p.scope])).toEqual([
      [OMP_SESSION_MODULE, SESSION_SCOPE],
    ]);
    expect(out?.[0]?.content).not.toContain('personas');
  });
});

describe('omp launch', () => {
  it('composes no launcher, persona overlay or badge from the agents', () => {
    // Starting a session as an agent goes only through `omp --agent`, which the
    // capability module registers: what the adapter composes from the agents is
    // the dispatch isolation module, once at the session scope, and only for an
    // agent declaring a worktree.
    expect(ompHarnessAdapter.launchSurface?.([AGENT])).toEqual([]);
    expect(
      ompHarnessAdapter
        .launchSurface?.([AGENT, agent({ name: 'iso', isolation: 'worktree' })])
        .map((f) => [f.filename, f.scope]),
    ).toEqual([[OMP_ISOLATION_MODULE, SESSION_SCOPE]]);
  });
});

/** The capabilities the stand-in module offers: `standIn`, which the version skew
 *  does not stand for, then those the adapter offers. */
const OFFERED: readonly string[] = ['standIn', ...OMP_CAPABILITY_TOOLS];

/** The emitted CRATYLUS module's bytes, offering {@link OFFERED}: every capability
 *  but the version skew is composed from the command's explanation alone, so a
 *  stand-in capability exercises that composition whichever the adapter offers. */
function withStandIn(): string {
  const content = ompCapabilityExtensions()[0]?.content ?? '';
  const declared = `const CAPABILITIES: readonly string[] = ${JSON.stringify(OMP_CAPABILITY_TOOLS)};`;
  expect(content).toContain(declared);
  return content.replace(
    declared,
    `const CAPABILITIES: readonly string[] = ${JSON.stringify(OFFERED)};`,
  );
}

describe('omp tool definitions', () => {
  const PATH = process.env.PATH;
  afterEach(() => {
    process.env.PATH = PATH;
  });

  /** The emitted module's factory, offering the stand-in capability `standIn` first
   *  (see {@link withStandIn}), written into an installation projected by
   *  `1.0.0`, beside a `cratylus` 1.0.0 on PATH that answers `<capability> --explain`
   *  with `explanation` under that capability's own name (`<name> <capability>`),
   *  each `<capability> <verb>` the JSON file `STAND_IN_ANSWERS` names, when it names
   *  one, with its answer there, and any other call with its argv and directory as
   *  JSON (or, for a verb named `refuse`, a refusal on stderr). */
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
        "const answers = process.env.STAND_IN_ANSWERS ? JSON.parse(require('node:fs').readFileSync(process.env.STAND_IN_ANSWERS, 'utf8')) : {};",
        "if (args[0] === '--version') process.stdout.write('1.0.0\\n');",
        `else if (args.includes('--explain')) { const said = JSON.parse(require('node:fs').readFileSync(${JSON.stringify(said)}, 'utf8')); process.stdout.write(JSON.stringify({ ...said, name: \`\${said.name} \${args[0]}\` })); }`,
        "else if (args[1] === 'refuse') { process.stderr.write('cratylus standIn refuse: its own words\\n'); process.exit(1); }",
        "else if (Object.hasOwn(answers, args.slice(0, 2).join(' '))) process.stdout.write(JSON.stringify(answers[args.slice(0, 2).join(' ')]));",
        'else process.stdout.write(JSON.stringify({ args, cwd: process.cwd() }));',
        '',
      ].join('\n'),
      { mode: 0o755 },
    );
    process.env.PATH = `${bin}:${PATH}`;
    const root = join(dir, 'root');
    mkdirSync(join(root, 'extensions'), { recursive: true });
    writeFileSync(
      join(root, 'package.json'),
      JSON.stringify({ name: 'cratylus-omp', version: '1.0.0' }),
    );
    const file = join(root, 'extensions', OMP_CRATYLUS_MODULE);
    writeFileSync(file, withStandIn());
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
    ).toBe('extensions/cratylus.ts');
  });

  it('asks the installed command for each interface and carries none of its own', () => {
    const [module] = ompCapabilityExtensions();
    const content = module?.content ?? '';
    expect(content).toContain('const COMMAND = "cratylus";');
    expect(content).toContain(
      `const CAPABILITIES: readonly string[] = ${JSON.stringify(OMP_CAPABILITY_TOOLS)};`,
    );
    expect(content).toContain('[capability, "--explain"]');
  });

  describe('composed from a stand-in installed command', () => {
    interface Registered {
      name: string;
      parameters: {
        properties: Record<string, Record<string, unknown>>;
        required: string[];
      };
      loadMode: string;
      approval: string;
      execute(
        id: string,
        args: Record<string, unknown>,
        signal: undefined,
        update: undefined,
        ctx: { cwd: string },
      ): Promise<{ content: { text: string }[] }>;
    }
    /** The tools the emitted module registers against the stand-in command, at
     *  load, once a session has started: a main one (with `--agent <flag>`, if
     *  given) or one omp dispatched and names `sub`. */
    async function load(
      explanation: unknown,
      session: { flag?: string; sub?: string } = {},
    ): Promise<Registered[]> {
      const factory = await emitted(explanation);
      const registered: Registered[] = [];
      const handlers = new Map<
        string,
        (event: unknown, ctx: unknown) => unknown
      >();
      await factory({
        typebox: { Type: { Unsafe: (schema: unknown) => schema } },
        registerTool: (tool: Registered) => registered.push(tool),
        registerFlag: () => {},
        getFlag: (name: string) =>
          name === 'agent' ? session.flag : undefined,
        on: (
          event: string,
          handler: (event: unknown, ctx: unknown) => unknown,
        ) => handlers.set(event, handler),
        setModel: async () => {},
        setThinkingLevel: () => {},
      });
      await handlers.get('session_start')?.(
        {},
        {
          cwd: '/the/session/cwd',
          agent:
            session.sub === undefined
              ? { kind: 'main', name: 'main' }
              : { kind: 'sub', name: session.sub },
          model: { provider: 'fixture', id: 'base' },
          modelRegistry: {},
          ui: { setStatus: () => {}, notify: () => {} },
        },
      );
      return registered;
    }

    const verb = (name: string) => ({
      name,
      concept: 'c',
      purpose: 'p',
      when: 'w',
      effect: 'reads',
    });
    /** The tool the stand-in's explanation of each capability registers, in the
     *  order the adapter offers its capabilities; the version tool is the one the
     *  artifacts carry, whatever the command explains. */
    const TOOLS = OFFERED.map((capability) =>
      capability === 'versionSkew'
        ? 'version_skew'
        : `stand_in_${capability.toLowerCase()}`,
    );
    const EXPLANATION = {
      name: 'stand in',
      purpose: 'p',
      when: 'w',
      verbs: [verb('look'), verb('find'), verb('refuse')],
    };

    it('registers one tool per capability, its verb required, every one read-only', async () => {
      const tools = await load(EXPLANATION);
      expect(tools.map((t) => t.name)).toEqual(TOOLS);
      const [tool] = tools;
      expect(tool?.parameters.required).toEqual(['verb']);
      expect(Object.keys(tool?.parameters.properties ?? {})).toEqual(['verb']);
      expect(tool?.parameters.properties.verb?.enum).toEqual([
        'look',
        'find',
        'refuse',
      ]);
      expect(tools.map((t) => t.approval)).toEqual(TOOLS.map(() => 'read'));
    });

    it('offers every capability as a device', async () => {
      const tools = await load(EXPLANATION);
      expect(
        Object.fromEntries(
          OFFERED.map((capability, i) => [capability, tools[i]?.loadMode]),
        ),
      ).toEqual(Object.fromEntries(OFFERED.map((c) => [c, 'discoverable'])));
    });

    it('runs the capability and the verb alone, whatever else the call carries', async () => {
      const [tool] = await load(EXPLANATION);
      const cwd = mkdtempSync(join(tmpdir(), 'omp-capability-cwd-'));
      tmp.push(cwd);
      const result = await tool?.execute(
        'id',
        { verb: 'find', context: '--explain' },
        undefined,
        undefined,
        { cwd },
      );
      expect(JSON.parse(result?.content[0]?.text ?? '')).toEqual({
        args: ['standIn', 'find'],
        cwd: realpathSync(cwd),
      });
    });

    it('runs the one verb of a capability that explains one alone, taking no `verb`', async () => {
      const [tool] = await load({ ...EXPLANATION, verbs: [verb('look')] });
      expect(tool?.parameters).toEqual({
        type: 'object',
        properties: {},
        required: [],
      });
      const result = await tool?.execute('id', {}, undefined, undefined, {
        cwd: tmpdir(),
      });
      expect(JSON.parse(result?.content[0]?.text ?? '').args).toEqual([
        'standIn',
        'look',
      ]);
    });

    it("fails a refused call as a tool error with the command's own message", async () => {
      const [tool] = await load(EXPLANATION);
      expect(
        await tool?.execute('id', { verb: 'refuse' }, undefined, undefined, {
          cwd: tmpdir(),
        }),
      ).toEqual({
        content: [
          { type: 'text', text: 'cratylus standIn refuse: its own words' },
        ],
        isError: true,
      });
    });

    describe('refuses no call for what it would change', () => {
      afterEach(() => {
        omp.agents = [];
      });
      /** A session as `agent` (dispatched, or main launched with `--agent <flag>`): each
       *  tool call fired through every handler in turn until one refuses, with the input
       *  the handlers leave. */
      async function session(agent: { sub?: string; flag?: string }) {
        const factory = await emitted(EXPLANATION);
        const handlers = new Map<
          string,
          ((event: unknown, ctx: unknown) => unknown)[]
        >();
        await factory({
          typebox: { Type: { Unsafe: (schema: unknown) => schema } },
          registerTool: () => {},
          registerFlag: () => {},
          getFlag: (name: string) =>
            name === 'agent' ? agent.flag : undefined,
          on: (event: string, fn: (event: unknown, ctx: unknown) => unknown) =>
            handlers.set(event, [...(handlers.get(event) ?? []), fn]),
          setModel: async () => {},
          setThinkingLevel: () => {},
        });
        const ctx = {
          cwd: tmpdir(),
          agent:
            agent.sub === undefined
              ? { kind: 'main', name: 'main' }
              : { kind: 'sub', name: agent.sub },
          model: { provider: 'fixture', id: 'base' },
          modelRegistry: {},
          ui: { setStatus: () => {}, notify: () => {} },
        };
        for (const fn of handlers.get('session_start') ?? []) await fn({}, ctx);
        return async (toolName: string, input: Record<string, unknown>) => {
          const event = { type: 'tool_call', toolName, toolCallId: 'c', input };
          for (const fn of handlers.get('tool_call') ?? []) {
            const answer = (await fn(event, ctx)) as
              | { block?: boolean; reason?: string }
              | undefined;
            if (answer?.block) return { answer, input: event.input };
          }
          return { answer: undefined, input: event.input };
        };
      }

      it('refuses no call for the files it would change, by any route', async () => {
        const call = await session({ sub: 'tech-lead' });
        for (const [tool, input] of [
          [
            'write',
            { path: 'design/examples/library/renewal.md', content: 'x' },
          ],
          ['edit', { input: '[checks/renewal.test.ts#1A2B]\nPUT 1.=1:\n+x' }],
          ['ast_edit', { paths: ['design/'] }],
          ['bash', { command: 'rm -r checks/renewal' }],
          ['bash', { command: 'git commit -am renewal' }],
          ['eval', { code: 'open("checks/renewal.test.ts", "w")' }],
        ] as const) {
          const { answer, input: left } = await call(tool, { ...input });
          expect(answer, `${tool} ${JSON.stringify(input)}`).toBeUndefined();
          expect(left).toEqual(input);
        }
      });
    });

    describe('offers every verb of every capability to every agent (open reach)', () => {
      afterEach(() => {
        omp.agents = [];
        omp.discovered.length = 0;
      });
      /** A declaration as omp's discovery parses it; omp adds `yield` to a list. */
      const discovered = (name: string, tools?: string[]) => ({
        name,
        description: 'd',
        systemPrompt: `The ${name} body.`,
        ...(tools === undefined ? {} : { tools: [...tools, 'yield'] }),
        source: 'user',
      });
      const verbsOf = (tools: Registered[]) =>
        tools.map((t) => [t.name, t.parameters.properties.verb?.enum]);

      it('whatever tools a declaration lists, in a dispatched or a launched session', async () => {
        const all = TOOLS.map((n) => [
          n,
          // The version tool explains one verb alone, so it takes no `verb`.
          n === 'version_skew' ? undefined : ['look', 'find', 'refuse'],
        ]);
        omp.agents = [
          discovered('assayer', ['read', 'grep']),
          discovered('software-engineer'),
          discovered('scout', ['read', 'bash']),
        ];
        for (const sub of [
          'assayer',
          'software-engineer',
          'scout',
          'sub',
          'absent',
        ])
          expect(verbsOf(await load(EXPLANATION, { sub })), sub).toEqual(all);
        expect(verbsOf(await load(EXPLANATION, { flag: 'assayer' }))).toEqual(
          all,
        );
        expect(verbsOf(await load(EXPLANATION))).toEqual(all);
      });

      it('runs a verb for an agent whose declaration lists other tools alone', async () => {
        omp.agents = [discovered('assayer', ['grep'])];
        const [tool] = await load(EXPLANATION, { sub: 'assayer' });
        const result = await tool?.execute(
          'id',
          { verb: 'find' },
          undefined,
          undefined,
          { cwd: tmpdir() },
        );
        expect(JSON.parse(result?.content[0]?.text ?? '').args).toEqual([
          'standIn',
          'find',
        ]);
      });
    });
  });

  describe('says version skew at every start, from the versions each side holds of itself', () => {
    /** The emitted module placed in an installation projected by `projected`, whose
     *  record says `scope` (no record where it is absent), beside a `cratylus` on PATH
     *  that answers `--version` with `command` and explains only the capabilities in
     *  `explains`. Each start's warnings, in order. */
    async function started(opts: {
      projected: string;
      command: string;
      explains: readonly string[];
      starts?: number;
      scope?: 'user' | 'project' | null;
    }): Promise<{
      warnings: string[][];
      tools: string[];
      report: () => Promise<unknown>;
      root: string;
      project: string;
    }> {
      const dir = mkdtempSync(join(tmpdir(), 'omp-skew-'));
      tmp.push(dir);
      const project = join(dir, 'project');
      const root = join(project, '.cratylus', 'omp');
      mkdirSync(join(root, 'extensions'), { recursive: true });
      writeFileSync(
        join(root, 'package.json'),
        JSON.stringify({ name: 'cratylus-omp', version: opts.projected }),
      );
      if (opts.scope !== undefined)
        writeFileSync(
          join(root, 'installation.json'),
          JSON.stringify(opts.scope === null ? {} : { scope: opts.scope }),
        );
      const bin = join(dir, 'bin');
      mkdirSync(bin);
      const explanation = {
        name: 'stand in',
        purpose: 'p',
        when: 'w',
        verbs: [
          {
            name: 'report',
            concept: 'c',
            purpose: 'p',
            when: 'w',
            effect: 'reads',
          },
        ],
      };
      writeFileSync(
        join(bin, 'cratylus'),
        [
          `#!${process.execPath}`,
          'const args = process.argv.slice(2);',
          `if (args[0] === '--version') { process.stdout.write(${JSON.stringify(`${opts.command}\n`)}); process.exit(0); }`,
          `const explains = ${JSON.stringify(opts.explains)};`,
          "if (args.includes('--explain') && !explains.includes(args[0])) { process.stderr.write(`error: unknown command '${args[0]}'\\n`); process.exit(1); }",
          `if (args.includes('--explain')) process.stdout.write(JSON.stringify({ ...${JSON.stringify(explanation)}, name: \`stand in \${args[0]}\` }));`,
          '',
        ].join('\n'),
        { mode: 0o755 },
      );
      process.env.PATH = `${bin}:${PATH}`;
      const file = join(root, 'extensions', OMP_CRATYLUS_MODULE);
      writeFileSync(file, withStandIn());
      const tools: string[] = [];
      let version:
        | ((...args: unknown[]) => Promise<{ content: { text: string }[] }>)
        | undefined;
      const handlers = new Map<
        string,
        (event: unknown, ctx: unknown) => unknown
      >();
      // Dynamic: the module under test is the emitted bytes, written to disk here.
      await (await import(file)).default({
        typebox: { Type: { Unsafe: (schema: unknown) => schema } },
        registerTool: (tool: {
          name: string;
          execute: (
            ...args: unknown[]
          ) => Promise<{ content: { text: string }[] }>;
        }) => {
          tools.push(tool.name);
          if (tool.name === 'version_skew') version = tool.execute;
        },
        registerFlag: () => {},
        getFlag: () => undefined,
        on: (
          event: string,
          handler: (event: unknown, ctx: unknown) => unknown,
        ) => handlers.set(event, handler),
        setModel: async () => {},
        setThinkingLevel: () => {},
      });
      const warnings: string[][] = [];
      for (let i = 0; i < (opts.starts ?? 1); i++) {
        const said: string[] = [];
        await handlers.get('session_start')?.(
          {},
          {
            cwd: dir,
            agent: { kind: 'main', name: 'main' },
            model: { provider: 'fixture', id: 'base' },
            modelRegistry: {},
            ui: {
              setStatus: () => {},
              notify: (text: string, level: string) => {
                if (level === 'warning') said.push(text);
              },
            },
          },
        );
        warnings.push(said);
      }
      const report = async () =>
        JSON.parse(
          (await version?.('id', {}, undefined, undefined, { cwd: dir }))
            ?.content[0]?.text ?? 'null',
        );
      return { warnings, tools, report, root, project };
    }
    const ALL = OFFERED;
    const remedy =
      /Install again with the cratylus in use: cratylus install --harness omp --scope user$/;
    const projectRemedy = (project: string) =>
      `Install again with the cratylus in use: cratylus install --harness omp --scope project, run in ${project}`;

    it('is silent where both are the same version, and offers every capability', async () => {
      const { warnings, tools } = await started({
        projected: '2.4.0',
        command: '2.4.0',
        explains: ALL,
      });
      expect(warnings).toEqual([[]]);
      expect(tools).toHaveLength(ALL.length);
    });

    it('warns at each of two starts where the command is newer, naming both, the user scope and root, and the remedy', async () => {
      const { warnings, root } = await started({
        projected: '2.4.0',
        command: '2.5.0',
        explains: ALL,
        starts: 2,
        scope: 'user',
      });
      for (const said of warnings) {
        expect(said).toHaveLength(1);
        expect(said[0]).toContain(`this user installation (${root})`);
        expect(said[0]).toContain('projected by cratylus 2.4.0');
        expect(said[0]).toContain('run is 2.5.0');
        expect(said[0]).toMatch(remedy);
      }
    });

    it('warns of a skewed project installation naming the project scope, its root and the project remedy', async () => {
      const { warnings, root, project, report } = await started({
        projected: '2.4.0',
        command: '2.5.0',
        explains: ALL,
        scope: 'project',
      });
      expect(warnings[0]).toHaveLength(1);
      expect(warnings[0]?.[0]).toContain(`this project installation (${root})`);
      expect(warnings[0]?.[0]).toContain('projected by cratylus 2.4.0');
      expect(warnings[0]?.[0]?.endsWith(projectRemedy(project))).toBe(true);
      expect(await report()).toEqual({
        artifacts: '2.4.0',
        command: '2.5.0',
        scope: 'project',
        installation: root,
      });
    });

    it('reads an installation whose record says no scope, or which has no record, as the user installation', async () => {
      for (const scope of [null, undefined]) {
        const { warnings, report, root } = await started({
          projected: '2.4.0',
          command: '2.5.0',
          explains: ALL,
          scope,
        });
        expect(warnings[0]?.[0]).toContain(`this user installation (${root})`);
        expect(warnings[0]?.[0]).toMatch(remedy);
        expect(await report()).toMatchObject({ scope: 'user' });
      }
    });

    it('is silent for a project installation where both are the same version', async () => {
      const { warnings } = await started({
        projected: '2.4.0',
        command: '2.4.0',
        explains: ALL,
        scope: 'project',
      });
      expect(warnings).toEqual([[]]);
    });

    it('warns where the command is older, as where it is newer', async () => {
      const { warnings } = await started({
        projected: '3.1.0',
        command: '3.0.0',
        explains: ALL,
      });
      expect(warnings[0]).toHaveLength(1);
      expect(warnings[0]?.[0]).toContain('projected by cratylus 3.1.0');
      expect(warnings[0]?.[0]).toContain('run is 3.0.0');
      expect(warnings[0]?.[0]).toMatch(remedy);
    });

    it('warns against a command that predates the version tool, still loading, offering the version tool the artifacts carry, which reports both', async () => {
      const older = ALL.filter((c) => c !== 'versionSkew');
      const { warnings, tools, report, root } = await started({
        projected: '3.1.0',
        command: '3.0.0',
        explains: older,
      });
      expect(tools).toEqual([
        ...older.map((c) => `stand_in_${c.toLowerCase()}`),
        'version_skew',
      ]);
      expect(warnings[0]).toHaveLength(1);
      expect(warnings[0]?.[0]).toContain('projected by cratylus 3.1.0');
      expect(warnings[0]?.[0]).toContain('run is 3.0.0');
      expect(warnings[0]?.[0]).not.toContain('does not provide');
      expect(warnings[0]?.[0]).toMatch(remedy);
      expect(await report()).toEqual({
        artifacts: '3.1.0',
        command: '3.0.0',
        scope: 'user',
        installation: root,
      });
    });

    it('warns where the command lacks a capability the installation expects, though it answers the same version', async () => {
      const { warnings, tools } = await started({
        projected: '2.4.0',
        command: '2.4.0',
        explains: [],
      });
      expect(tools).toEqual(['version_skew']);
      expect(warnings[0]).toHaveLength(1);
      expect(warnings[0]?.[0]).toMatch(/does not provide standIn /);
    });
  });

  describe('launches a main session as an agent definition omp discovers', () => {
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
     *  <flag>` (or without it), recording every session action it takes; the
     *  stand-in command explains itself with `orientation`, where one is given. */
    async function started(
      flag?: string,
      cwd = '/the/session/cwd',
      orientation?: string,
    ) {
      const factory = await emitted({
        name: 'stand in',
        purpose: 'p',
        when: 'w',
        verbs: [],
        ...(orientation === undefined ? {} : { orientation }),
      });
      const handlers = new Map<string, Handler>();
      const did = {
        flags: [] as [string, unknown][],
        models: [] as unknown[],
        efforts: [] as unknown[],
        tools: [] as unknown[],
        status: [] as [string, unknown][],
        notices: [] as unknown[],
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
        cwd,
        agent: { kind },
        model: { provider: 'fixture', id: 'base' },
        modelRegistry: { standIn: 'registry' },
        ui: {
          setStatus: (key: string, text: unknown) =>
            did.status.push([key, text]),
          notify: (message: unknown) => did.notices.push(message),
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

    it("lets the product owner's own --model and --thinking win, the body still carried", async () => {
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
      // Each flag wins its own setting only.
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

    /** omp's own system prompt, in its shape: `§` sections, `#` sub-sections, and
     *  the `<critical>` and project-context blocks. */
    const OMP_PROMPT = [
      '§ Role',
      "You are omp's trusted coding assistant.",
      '',
      '# Engineering',
      '- Correctness, then maintainability.',
      '§ Runtime',
      '# Skills & Rules',
      'Matching skill → read it first.',
      '# Tool Inventory',
      '- Read: `read`',
      '§ Tool Policy',
      '# General',
      'SHOULD resolve prerequisites, parallelize independent calls.',
      'Retry differently; NEVER settle for plausibility when another call reduces uncertainty.',
      '# Tool I/O',
      '- Prefer relative paths.',
      '§ Workflow',
      '# 1. Scope',
      '- Plan before opening files.',
      '# 5. Hand-off',
      '- Verify with smoke runs.',
      '§ Delivery',
      '<contract>',
      'NEVER fabricate output; ground code/tool/test/doc/source claims.',
      '</contract>',
      '§ Critical',
      '<critical>',
      '- NEVER yield while actionable work remains.',
      '</critical><project-context>',
      '<workstation>',
      '- OS: linux',
      '</workstation>',
      '</project-context>',
      '',
      '<critical>',
      '- MUST default to informed action; do not ask for confirmation.',
      '</critical>',
      '',
      '# Memory',
      'Recalled memories are background knowledge.',
      '§ Something omp adds later',
      'A new harness section.',
    ].join('\n');

    it('leaves omp’s prompt of a plain session untouched', async () => {
      const plain = await started();
      await plain.fire('session_start');
      expect(
        await plain.fire('before_agent_start', 'main', {
          systemPrompt: [OMP_PROMPT],
        }),
      ).toBeUndefined();
    });

    /** A tech lead declaring a typed assignment, as projection writes one. */
    const TECH_LEAD = () =>
      declare(
        {
          name: 'tech-lead',
          description: 'Realizes a story.',
          assignment: {
            type: 'object',
            properties: {
              story: { type: 'string', description: 'The story, by its name.' },
              examples: {
                type: 'array',
                items: { type: 'string' },
                minItems: 1,
                description: 'The visible examples, as <context>/<number>.',
              },
              decisions: {
                type: 'array',
                items: { type: 'string' },
                description: 'The decisions in force.',
              },
            },
            required: ['story', 'examples', 'decisions'],
          },
        },
        'Realize the story.',
      );
    const TECH_LEAD_FORM = [
      '- tech-lead: give its assignment in the task text as one fenced code block with info string `assignment` holding one JSON object:',
      '  ```assignment',
      '  {"story": …, "examples": …, "decisions": …}',
      '  ```',
      '  - `story` (string, required): The story, by its name.',
      '  - `examples` (list of strings, at least 1, required): The visible examples, as <context>/<number>.',
      '  - `decisions` (list of strings, may be empty, required): The decisions in force.',
    ].join('\n');

    it('lists the assignment form of each contracted agent in every session, launched or not, main or dispatched', async () => {
      omp.agents = [
        TECH_LEAD(),
        declare({ name: 'pilot', description: 'd' }, 'Fly.'),
      ];
      const forms = `# Assignment forms\n\nGive a dispatch of these agents its assignment in its task text so:\n\n${TECH_LEAD_FORM}`;
      for (const [flag, kind] of [
        [undefined, 'main'],
        ['pilot', 'main'],
        [undefined, 'sub'],
      ] as const) {
        const session = await started(flag);
        await session.fire('session_start', kind);
        const { systemPrompt } = (await session.fire(
          'before_agent_start',
          kind,
        )) as { systemPrompt: string[] };
        expect(systemPrompt, `${flag ?? 'plain'} ${kind}`).toContain(forms);
      }
    });

    it("carries the reached command's orientation right after omp's prompt in every session, launched or not, main or dispatched", async () => {
      omp.agents = [declare({ name: 'pilot', description: 'd' }, 'Fly.')];
      const orientation = 'What it is for.\nHow it starts.\nWhy it works.';
      for (const [flag, kind] of [
        [undefined, 'main'],
        ['pilot', 'main'],
        [undefined, 'sub'],
      ] as const) {
        const session = await started(flag, undefined, orientation);
        await session.fire('session_start', kind);
        const { systemPrompt } = (await session.fire(
          'before_agent_start',
          kind,
        )) as { systemPrompt: string[] };
        expect(
          systemPrompt.slice(0, BASE.length + 1),
          `${flag ?? 'plain'} ${kind}`,
        ).toEqual([...BASE, orientation]);
      }
    });

    it('carries the orientation without restating a word of it', () => {
      const content = ompCapabilityExtensions()[0]?.content ?? '';
      expect(content).toContain('run(["--explain"])');
      for (const line of ORIENTATION.split('\n'))
        expect(content).not.toContain(line);
    });

    it('gives a launch no note beyond its declaration, its skills and the assignment forms, on any turn', async () => {
      omp.agents = [
        declare(
          { name: 'business-analyst', description: 'Holds the design.' },
          '# business-analyst\n\n### procedure\n\n- **reconstitution** — at every start, read back before acting\n\n### decision-rights\n\n- meaning (concepts and examples): **D** — decides\n\n### memory\n\n- **source-of-truth** — the domain model is the one record\n\n### guardrails\n\n- **honesty** — reports what it observed',
        ),
      ];
      const { fire } = await started('business-analyst');
      await fire('session_start');
      for (const turn of [1, 2]) {
        const { systemPrompt } = (await fire('before_agent_start')) as {
          systemPrompt: string[];
        };
        expect(systemPrompt, `turn ${turn}`).toHaveLength(2);
        for (const heading of [
          '# Session start',
          '# Meaning: yours',
          '# The records',
        ])
          expect(systemPrompt.join('\n'), `turn ${turn}`).not.toContain(
            heading,
          );
      }
    });

    const BUSINESS_ANALYST = () =>
      declare(
        { name: 'business-analyst', description: 'Holds the design.' },
        '# business-analyst\n\n### procedure\n\n- **reconstitution** — at every start, read back before acting\n\n### stance\n\n- **decisive** — decides',
      );

    /** The CRATYLUS module loaded into a stand-in omp started with `--agent <agent>`, every
     *  handler of an event fired in order, as omp's runner does; what each returned, and
     *  what the session was told. */
    async function loadedAs(agent: string) {
      const factory = await emitted({
        name: 'stand in',
        purpose: 'p',
        when: 'w',
        verbs: [
          {
            name: 'define',
            concept: 'c',
            purpose: 'p',
            when: 'w',
            effect: 'reads',
          },
        ],
      });
      const handlers = new Map<string, Handler[]>();
      const told: unknown[] = [];
      await factory({
        typebox: { Type: { Unsafe: (schema: unknown) => schema } },
        registerTool: () => {},
        registerFlag: () => {},
        getFlag: (name: string) => (name === 'agent' ? agent : undefined),
        on: (event: string, handler: Handler) =>
          handlers.set(event, [...(handlers.get(event) ?? []), handler]),
        setModel: async () => {},
        setThinkingLevel: () => {},
        setActiveTools: async () => {},
        sendUserMessage: (message: unknown) => told.push(message),
      });
      const ctx = {
        cwd: '/the/session/cwd',
        agent: { kind: 'main' },
        model: { provider: 'fixture', id: 'base' },
        modelRegistry: { standIn: 'registry' },
        ui: { setStatus: () => {}, notify: (m: unknown) => told.push(m) },
      };
      const fire = async (event: string, payload: unknown) => {
        const answers: unknown[] = [];
        for (const handler of handlers.get(event) ?? [])
          answers.push(await handler(payload, ctx));
        return answers.find((a) => a !== undefined);
      };
      await fire('session_start', {});
      return { fire, told };
    }

    const reply = (text: string) => ({
      message: { role: 'assistant', content: [{ type: 'text', text }] },
    });
    const acts = [
      { toolName: 'task', input: { tasks: [{ agent: 'scout', task: 't' }] } },
      { toolName: 'write', input: { path: 'notes.md', content: 'x' } },
      { toolName: 'edit', input: { path: 'design/a.md' } },
      { toolName: 'stand_in_standin', input: { verb: 'define' } },
      { toolName: 'read', input: { path: 'design/model' } },
    ];

    it('holds no act of a reconstituting launch, before or after it speaks, and answers no reply', async () => {
      omp.agents = [BUSINESS_ANALYST()];
      const { fire, told } = await loadedAs('business-analyst');
      for (const call of acts)
        expect(await fire('tool_call', call), call.toolName).toBeUndefined();
      await fire('message_end', reply('Which option would you prefer?'));
      for (const call of acts)
        expect(await fire('tool_call', call), call.toolName).toBeUndefined();
      expect(told).toEqual([]);
    });

    it('never touches the active tools, whatever --tools the product owner gave', async () => {
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
      // Once per launch, and once for the turn's dispatch forms.
      expect(omp.discovered).toHaveLength(3);
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
          notices: [],
        });
      // Only the turn's dispatch forms are looked up; nothing is launched.
      expect(omp.discovered).toEqual(['/the/session/cwd', '/the/session/cwd']);
      expect(omp.runtime).toEqual({});
      expect(omp.writes).toEqual([]);
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

    it("leaves advisor and pre-planning to the product owner's --advisor and --prewalk family", async () => {
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

    it('refuses no dispatch of a launched session, whatever whom its declaration names', async () => {
      omp.agents = [
        {
          ...declare(
            {
              name: 'cartographer',
              description: 'Charts the estuary.',
              spawns: 'surveyor',
            },
            'Map the estuary.',
          ),
          spawns: 'surveyor',
        },
      ];
      const { fire } = await started('cartographer');
      await fire('session_start');
      for (const agent of ['surveyor', 'pilot'])
        expect(
          await fire('before_subagent_spawn', undefined, { agent }),
          agent,
        ).toBeUndefined();
    });

    it('puts back every setting it held when the launch ends', async () => {
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
      expect(await fire('before_agent_start')).toBeUndefined();
    });
  });
});
