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
import {
  OMP_CAPABILITY_TOOLS,
  OMP_ESSENTIAL_CAPABILITIES,
} from '../../src/adapters/omp/render.js';
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
// omp's own statement of a run that ended without its deliverable, as 18.10.2 words it.
vi.mock('@oh-my-pi/pi-coding-agent/task/executor', () => ({
  SUBAGENT_WARNING_MISSING_YIELD:
    'SYSTEM WARNING: Subagent exited without calling yield tool after 3 reminders.',
}));
// omp's output-contract validator, standing in for its JSON Schema check: an object holding
// every field the contract requires satisfies it.
vi.mock('@oh-my-pi/pi-coding-agent/tools/output-schema-validator', () => ({
  buildOutputValidator: (schema: { required?: string[] }) => ({
    validator: {
      validate: (value: Record<string, unknown>) => ({
        success: (schema.required ?? []).every((field) => field in value),
      }),
    },
  }),
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
      description: 'the builder: ships things',
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

  it('declares a gate holder, one whose decision rights hold sign-off, blocking, and no other agent', () => {
    const holder = agent({
      decisionRights: [
        { value: 'D ≜ decides', level: 'fixed', slot: 'realization' },
        { value: 'R ≜ recommends', level: 'fixed', slot: 'sign-off' },
      ],
    });
    expect(frontMatter(agentToOmpMd(holder, CTX)).blocking).toBe('true');
    const other = agent({
      decisionRights: [
        { value: 'D ≜ decides', level: 'fixed', slot: 'realization' },
      ],
    });
    expect(frontMatter(agentToOmpMd(other, CTX))).not.toHaveProperty(
      'blocking',
    );
  });

  it('names its own model role first, then its tier and effort, never a model (0111, 0112)', () => {
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

  it('lets every agent dispatch any agent: `spawns` is `*`, never a list (0142)', () => {
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
    // A plain scalar may not contain `: `, and a real corpus description does
    // ("…and canon: dimension catalogs") — unquoted, the document is a scanner
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
    expect(body).toMatch(/^\n# mav\n\nthe builder: ships things\n/);
    expect(body).toContain(
      '- **delivery** — end-to-end integrated green (fixed)',
    );
    expect(body).not.toContain('You are `mav`');
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

describe('omp capability interface', () => {
  const PATH = process.env.PATH;
  afterEach(() => {
    process.env.PATH = PATH;
  });

  /** The emitted module's factory, written into an installation projected by
   *  `1.0.0`, beside a `cratylus` 1.0.0 on PATH that answers `<capability> --explain`
   *  with `explanation` under that capability's own name (`<name> <capability>`),
   *  each `<capability> <verb>` the JSON file `STAND_IN_ANSWERS` names, when it names
   *  one, with its answer there, and any other call with its argv, directory and
   *  acting agent as JSON (or, for a verb named `refuse`, a refusal on stderr). */
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
        "if (process.env.STAND_IN_CALLS) require('node:fs').appendFileSync(process.env.STAND_IN_CALLS, `${JSON.stringify(args)}\\n`);",
        "const answers = process.env.STAND_IN_ANSWERS ? JSON.parse(require('node:fs').readFileSync(process.env.STAND_IN_ANSWERS, 'utf8')) : {};",
        "if (args[0] === '--version') process.stdout.write('1.0.0\\n');",
        `else if (args.includes('--explain')) { const said = JSON.parse(require('node:fs').readFileSync(${JSON.stringify(said)}, 'utf8')); process.stdout.write(JSON.stringify({ ...said, name: \`\${said.name} \${args[0]}\` })); }`,
        "else if (args[1] === 'refuse') { process.stderr.write('cratylus concepts refuse: its own words\\n'); process.exit(1); }",
        "else if (Object.hasOwn(answers, args.slice(0, 2).join(' '))) process.stdout.write(JSON.stringify(answers[args.slice(0, 2).join(' ')]));",
        'else process.stdout.write(JSON.stringify({ args, cwd: process.cwd(), agent: process.env.CRATYLUS_AGENT }));',
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
    const [module] = ompCapabilityExtensions();
    const file = join(root, 'extensions', OMP_CRATYLUS_MODULE);
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
    // No verb, journal location or entry field of a capability is spelled here.
    for (const word of [
      'supersede',
      'retire',
      'decide',
      'design/journal',
      'concept journal',
      'work-packages',
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
      loadMode: string;
      approval(args: Record<string, unknown>): string;
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
    /** The tool the stand-in's explanation of each capability registers, in the
     *  order the adapter offers its capabilities; the version tool is the one the
     *  artifacts carry, whatever the command explains. */
    const TOOLS = OMP_CAPABILITY_TOOLS.map((capability) =>
      capability === 'versionSkew'
        ? 'version_skew'
        : `stand_in_${capability.toLowerCase()}`,
    );
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
      const tools = await load(EXPLANATION);
      expect(tools.map((t) => t.name)).toEqual(TOOLS);
      const [tool] = tools;
      expect(tool?.parameters.required).toEqual(['verb']);
      expect(tool?.parameters.properties.verb?.enum).toEqual([
        'look',
        'put',
        'refuse',
      ]);
      expect(tool?.approval({ verb: 'look' })).toBe('read');
      expect(tool?.approval({ verb: 'put' })).toBe('write');
    });

    it('offers the ledger whole every turn, the concept journal as a device', async () => {
      expect(OMP_ESSENTIAL_CAPABILITIES).toEqual(['ledger']);
      const tools = await load(EXPLANATION);
      expect(
        Object.fromEntries(
          OMP_CAPABILITY_TOOLS.map((capability, i) => [
            capability,
            tools[i]?.loadMode,
          ]),
        ),
      ).toEqual({
        concepts: 'discoverable',
        ledger: 'essential',
        versionSkew: 'discoverable',
      });
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

    it("fails a refused call as a tool error with the command's own message", async () => {
      const [tool] = await load(EXPLANATION);
      expect(
        await tool?.execute('id', { verb: 'refuse' }, undefined, undefined, {
          cwd: tmpdir(),
        }),
      ).toEqual({
        content: [
          { type: 'text', text: 'cratylus concepts refuse: its own words' },
        ],
        isError: true,
      });
    });

    describe('names the acting agent on every capability call (F1)', () => {
      afterEach(() => {
        omp.agents = [];
        Reflect.deleteProperty(process.env, 'CRATYLUS_AGENT');
      });
      const agentOf = async (
        session: { flag?: string; sub?: string },
        kind: 'main' | 'sub',
      ) => {
        const [tool] = await load(EXPLANATION, session);
        const result = await tool?.execute(
          'id',
          { verb: 'look' },
          undefined,
          undefined,
          {
            cwd: tmpdir(),
            agent: { kind, name: session.sub ?? 'main' },
          } as { cwd: string },
        );
        return JSON.parse(result?.content[0]?.text ?? '').agent;
      };

      it('as the launched declaration, the dispatched agent, or no one', async () => {
        omp.agents = [
          {
            name: 'lead',
            description: 'd',
            systemPrompt: 'The lead body.',
            source: 'user',
          },
        ];
        expect(await agentOf({ flag: 'lead' }, 'main')).toBe('lead');
        expect(await agentOf({ sub: 'builder' }, 'sub')).toBe('builder');
        expect(await agentOf({}, 'main')).toBeUndefined();
      });

      it('never one the environment carries in', async () => {
        process.env.CRATYLUS_AGENT = 'architect';
        expect(await agentOf({}, 'main')).toBeUndefined();
        expect(process.env.CRATYLUS_AGENT).toBeUndefined();
      });
    });

    describe("names the session's agent on its shell calls, and refuses no call for what it would change (0143)", () => {
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

      /** The command the handlers leave, run by a POSIX shell whose environment names
       *  someone else: what each of its commands sees as the acting agent. */
      const seen = (command: unknown) =>
        spawnSync('/bin/sh', ['-c', String(command)], {
          env: { ...process.env, CRATYLUS_AGENT: 'someone else' },
          encoding: 'utf8',
        }).stdout;
      const PROBE =
        'printf "%s" "${CRATYLUS_AGENT-none}" && printf " %s" "${CRATYLUS_AGENT-none}"';

      it('as the dispatched agent or the launched declaration, in the command itself', async () => {
        omp.agents = [
          {
            name: 'architect',
            description: 'd',
            systemPrompt: 'The architect body.',
            source: 'user',
          },
        ];
        for (const [agent, named] of [
          [{ sub: 'lead' }, 'lead'],
          [{ sub: "o'brien" }, "o'brien"],
          [{ flag: 'architect' }, 'architect'],
        ] as const) {
          const call = await session(agent);
          const { answer, input } = await call('bash', {
            command: PROBE,
            cwd: 'src',
          });
          expect(answer).toBeUndefined();
          expect(input).toEqual({ command: expect.any(String), cwd: 'src' });
          expect(seen(input.command), named).toBe(`${named} ${named}`);
        }
      });

      it('and no one for a session that is no agent', async () => {
        process.env.CRATYLUS_AGENT = 'architect';
        const call = await session({});
        expect(process.env.CRATYLUS_AGENT).toBeUndefined();
        const { answer, input } = await call('bash', { command: PROBE });
        expect(answer).toBeUndefined();
        expect(seen(input.command)).toBe('none none');
      });

      it('refuses no call for the files it would change, by any route', async () => {
        const call = await session({ sub: 'lead' });
        for (const [tool, input] of [
          [
            'write',
            { path: 'design/examples/library/renewal.md', content: 'x' },
          ],
          ['edit', { input: '[checks/renewal.test.ts#1A2B]\nPUT 1.=1:\n+x' }],
          ['ast_edit', { paths: ['design/'] }],
          ['bash', { command: 'rm -r checks/renewal' }],
          [
            'bash',
            { command: 'CRATYLUS_AGENT=architect git commit -am renewal' },
          ],
          ['eval', { code: 'open("checks/renewal.test.ts", "w")' }],
        ] as const) {
          const { answer, input: left } = await call(tool, { ...input });
          expect(answer, `${tool} ${JSON.stringify(input)}`).toBeUndefined();
          if (tool !== 'bash') expect(left).toEqual(input);
        }
      });
    });

    describe('offers every verb of every capability to every agent (open reach, 0081)', () => {
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
          n === 'version_skew' ? undefined : ['look', 'put', 'refuse'],
        ]);
        omp.agents = [
          discovered('assayer', ['read', 'grep']),
          discovered('builder'),
          discovered('scout', ['read', 'bash']),
        ];
        for (const sub of ['assayer', 'builder', 'scout', 'sub', 'absent'])
          expect(verbsOf(await load(EXPLANATION, { sub })), sub).toEqual(all);
        expect(verbsOf(await load(EXPLANATION, { flag: 'assayer' }))).toEqual(
          all,
        );
        expect(verbsOf(await load(EXPLANATION))).toEqual(all);
      });

      it('runs an appending verb for an agent whose declaration lists reading tools alone', async () => {
        omp.agents = [discovered('assayer', ['read'])];
        const [tool] = await load(EXPLANATION, { sub: 'assayer' });
        const result = await tool?.execute(
          'id',
          { verb: 'put', word: 'w' },
          undefined,
          undefined,
          { cwd: tmpdir() },
        );
        expect(JSON.parse(result?.content[0]?.text ?? '').args).toEqual([
          'concepts',
          'put',
          'w',
        ]);
      });
    });
  });

  describe('says version skew at every start, from the versions each side holds of itself', () => {
    /** The emitted module placed in an installation projected by `projected`, beside
     *  a `cratylus` on PATH that answers `--version` with `command` and explains only
     *  the capabilities in `explains`. Each start's warnings, in order. */
    async function started(opts: {
      projected: string;
      command: string;
      explains: readonly string[];
      starts?: number;
      /** The installation's module replaced on disk after it was loaded. */
      replaced?: boolean;
    }): Promise<{
      warnings: string[][];
      tools: string[];
      report: () => Promise<unknown>;
    }> {
      const dir = mkdtempSync(join(tmpdir(), 'omp-skew-'));
      tmp.push(dir);
      const root = join(dir, 'root');
      mkdirSync(join(root, 'extensions'), { recursive: true });
      writeFileSync(
        join(root, 'package.json'),
        JSON.stringify({ name: 'cratylus-omp', version: opts.projected }),
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
            parameters: [],
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
      const [module] = ompCapabilityExtensions();
      const file = join(root, 'extensions', OMP_CRATYLUS_MODULE);
      writeFileSync(file, module?.content ?? '');
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
      if (opts.replaced === true)
        writeFileSync(file, `${module?.content ?? ''}\n// a later install\n`);
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
      return { warnings, tools, report };
    }
    const ALL = OMP_CAPABILITY_TOOLS;
    const remedy =
      /Install again with the cratylus in use: cratylus install --harness omp/;

    it('is silent where both are the same version, and offers every capability', async () => {
      const { warnings, tools } = await started({
        projected: '2.4.0',
        command: '2.4.0',
        explains: ALL,
      });
      expect(warnings).toEqual([[]]);
      expect(tools).toHaveLength(ALL.length);
    });

    it('warns at each of two starts where the command is newer, naming both and the remedy', async () => {
      const { warnings } = await started({
        projected: '2.4.0',
        command: '2.5.0',
        explains: ALL,
        starts: 2,
      });
      for (const said of warnings) {
        expect(said).toHaveLength(1);
        expect(said[0]).toContain('projected by cratylus 2.4.0');
        expect(said[0]).toContain('run is 2.5.0');
        expect(said[0]).toMatch(remedy);
      }
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
      const { warnings, tools, report } = await started({
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
      expect(await report()).toEqual({ artifacts: '3.1.0', command: '3.0.0' });
    });

    it('warns where the command lacks a capability the installation expects, though it answers the same version', async () => {
      const { warnings, tools } = await started({
        projected: '2.4.0',
        command: '2.4.0',
        explains: ['concepts'],
      });
      expect(tools).toEqual(['stand_in_concepts', 'version_skew']);
      expect(warnings[0]).toHaveLength(1);
      expect(warnings[0]?.[0]).toMatch(/does not provide ledger /);
    });

    it('says, at each start, that this process runs the module it loaded where an install has since replaced it', async () => {
      const { warnings } = await started({
        projected: '2.4.0',
        command: '2.4.0',
        explains: ALL,
        replaced: true,
        starts: 2,
      });
      for (const said of warnings) {
        expect(said).toHaveLength(1);
        expect(said[0]).toContain('runs the cratylus extension it loaded');
        expect(said[0]).toContain('ledger capture');
        expect(said[0]).toMatch(/Restart omp/);
      }
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
    async function started(flag?: string, cwd = '/the/session/cwd') {
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

    it('keeps the harness sections of omp’s prompt and drops those prescribing identity, stance or procedure', async () => {
      omp.agents = [CARTOGRAPHER()];
      const { did, fire } = await started('cartographer');
      await fire('session_start');
      const { systemPrompt } = (await fire('before_agent_start', 'main', {
        systemPrompt: [OMP_PROMPT],
      })) as { systemPrompt: string[] };
      const [base, ...added] = systemPrompt;
      for (const kept of [
        '§ Runtime',
        '# Skills & Rules',
        '# Tool Inventory',
        '§ Tool Policy',
        'SHOULD resolve prerequisites, parallelize independent calls.',
        '# Tool I/O',
        '<project-context>',
        '- OS: linux',
        '# Memory',
        '§ Something omp adds later',
        'A new harness section.',
      ])
        expect(base, kept).toContain(kept);
      for (const dropped of [
        '§ Role',
        'trusted coding assistant',
        '# Engineering',
        'settle for plausibility',
        '§ Workflow',
        '# 1. Scope',
        'smoke runs',
        '§ Delivery',
        'ground code/tool/test/doc/source claims',
        '§ Critical',
        '<critical>',
        'informed action',
        'actionable work remains',
      ])
        expect(base, dropped).not.toContain(dropped);
      expect(added.join('\n')).toContain(
        'Map the estuary before drawing its shipping routes.',
      );
      // The titles removed are said to the session, once per launch.
      await fire('before_agent_start', 'main', { systemPrompt: [OMP_PROMPT] });
      expect(did.notices).toEqual([
        'Launched as cartographer: omp prompt sections removed: Role, Engineering, Tool Policy: plausibility, Workflow, Delivery, Critical, project context <critical>',
      ]);
    });

    it('leaves omp’s prompt of a plain session untouched', async () => {
      const plain = await started();
      await plain.fire('session_start');
      expect(
        await plain.fire('before_agent_start', 'main', {
          systemPrompt: [OMP_PROMPT],
        }),
      ).toBeUndefined();
    });

    /** A lead declaring a typed assignment, as projection writes one. */
    const LEAD = () =>
      declare(
        {
          name: 'lead',
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
    const LEAD_FORM = [
      '- lead: give its assignment in the task text as one fenced code block with info string `assignment` holding one JSON object:',
      '  ```assignment',
      '  {"story": …, "examples": …, "decisions": …}',
      '  ```',
      '  - `story` (string, required): The story, by its name.',
      '  - `examples` (list of strings, at least 1, required): The visible examples, as <context>/<number>.',
      '  - `decisions` (list of strings, may be empty, required): The decisions in force.',
    ].join('\n');

    it('warns of an eval call whose code dispatches a delegate, for a launched agent or a typed delegate, and lets it through', async () => {
      omp.agents = [CARTOGRAPHER(), LEAD()];
      const EVAL_DISPATCH_WARNING =
        'dispatch from eval code: its assignment is not shown or checked and the ledger does not capture it; dispatch with the task tool to have both.';
      /** Every `tool_call` handler of the module, in order, as omp's runner fires them;
       *  what the session was told, each handler's answer checked to refuse nothing. */
      const loaded = async (flag?: string) => {
        const factory = await emitted({
          name: 'stand in',
          purpose: 'p',
          when: 'w',
          verbs: [],
        });
        const handlers = new Map<string, Handler[]>();
        await factory({
          typebox: { Type: { Unsafe: (schema: unknown) => schema } },
          registerTool: () => {},
          registerFlag: () => {},
          getFlag: (name: string) => (name === 'agent' ? flag : undefined),
          on: (event: string, handler: Handler) =>
            handlers.set(event, [...(handlers.get(event) ?? []), handler]),
          setModel: async () => {},
          setThinkingLevel: () => {},
          setActiveTools: async () => {},
        });
        const ctx = (
          kind: string,
          name: string | undefined,
          told: unknown[],
        ) => ({
          cwd: '/the/session/cwd',
          agent: { kind, name },
          model: { provider: 'fixture', id: 'base' },
          modelRegistry: { standIn: 'registry' },
          ui: { setStatus: () => {}, notify: (m: unknown) => told.push(m) },
        });
        const fire = async (
          event: string,
          payload: unknown,
          kind = 'main',
          name?: string,
        ) => {
          const told: unknown[] = [];
          for (const handler of handlers.get(event) ?? [])
            expect(
              await handler(payload, ctx(kind, name, told)),
            ).toBeUndefined();
          return told;
        };
        await fire('session_start', {});
        return fire;
      };
      const evalOf = (code: string) => ({
        toolName: 'eval',
        input: { language: 'py', code },
      });
      const dispatching = [
        'h = agent(prompt, agent="lead", label="film-approval lead")\nprint(h.id, h.status)',
        'const h = await agent({ agent: "lead", task: "Lead the story." });',
        'pool = workpool([("lead", "Lead the story.")])',
        'await tool.task({ tasks: [{ agent: "lead", task: "t" }] })',
        'await tool["task"]({"tasks": []})',
      ];
      const ordinary = [
        'print(read("design/journal/a.json"))',
        'await tool.read({ path: "design/a.md" })',
        'my_agent(1); x.agent(2); print(tool.tasks)',
      ];
      const warned = [EVAL_DISPATCH_WARNING];
      const launched = await loaded('cartographer');
      for (const code of dispatching) {
        expect(await launched('tool_call', evalOf(code)), code).toEqual(warned);
        // A delegate whose declaration carries a typed assignment is a cratylus agent too.
        expect(
          await launched('tool_call', evalOf(code), 'sub', 'lead'),
          code,
        ).toEqual(warned);
      }
      for (const code of ordinary) {
        expect(await launched('tool_call', evalOf(code)), code).toEqual([]);
        expect(
          await launched('tool_call', evalOf(code), 'sub', 'lead'),
          code,
        ).toEqual([]);
      }
      // A plain main session is no agent, nor are omp's own delegates or an untyped one: told nothing.
      const plain = await loaded();
      for (const code of dispatching) {
        expect(await plain('tool_call', evalOf(code)), code).toEqual([]);
        expect(
          await plain('tool_call', evalOf(code), 'sub', 'task'),
          code,
        ).toEqual([]);
        expect(
          await plain('tool_call', evalOf(code), 'sub', 'cartographer'),
          code,
        ).toEqual([]);
      }
      expect(
        await plain('tool_call', evalOf(dispatching[0]!), 'sub', 'lead'),
      ).toEqual(warned);
    });

    it('warns of a misfit dispatch with the assignment form, and lets it through', async () => {
      omp.agents = [LEAD()];
      const plain = await started();
      await plain.fire('session_start');
      expect(
        await plain.fire('tool_call', 'main', {
          toolName: 'task',
          toolCallId: 'call',
          input: {
            context: 'A long prose brief.',
            tasks: [{ agent: 'lead', task: 'Realize the film story, please.' }],
          },
        }),
      ).toBeUndefined();
      expect(plain.did.notices).toEqual([
        `dispatch warning, going ahead: lead assignment is missing: story, examples, decisions\n${LEAD_FORM}`,
      ]);
    });

    /** A builder declaring a typed task, as projection writes one. */
    const BUILDER = () =>
      declare(
        {
          name: 'builder',
          description: 'Builds a task.',
          assignment: {
            type: 'object',
            properties: {
              task: { type: 'string', description: 'The task, by its name.' },
              story: { type: 'string', description: 'The story it serves.' },
            },
            required: ['task'],
          },
        },
        'Build it.',
      );
    /** The lifecycle events the stand-in command was sent, in order. */
    const lifecycleSent = (calls: string) =>
      readFileSync(calls, 'utf8')
        .trim()
        .split('\n')
        .filter((line) => line !== '')
        .map((line) => JSON.parse(line) as string[])
        .filter((args) => args[0] === 'lifecycle')
        .map((args) => JSON.parse(args[1] ?? '') as Record<string, unknown>);

    it('checks and records a dispatch whatever the harness calls the tool that carries it', async () => {
      omp.agents = [LEAD(), BUILDER()];
      const cwd = mkdtempSync(join(tmpdir(), 'omp-dispatch-cwd-'));
      tmp.push(cwd);
      const calls = join(cwd, 'calls.jsonl');
      process.env.STAND_IN_CALLS = calls;
      try {
        for (const toolName of ['task', '_task', 'dispatch']) {
          const session = await started(undefined, cwd);
          await session.fire('session_start');
          // A misfit is let through under any name, and warned of.
          expect(
            await session.fire('tool_call', 'main', {
              toolName,
              toolCallId: `misfit-${toolName}`,
              input: { tasks: [{ agent: 'lead', task: 'Realize it.' }] },
            }),
            toolName,
          ).toBeUndefined();
          expect(session.did.notices, toolName).toHaveLength(1);
          // A typed dispatch is recorded, and its settled return too.
          writeFileSync(calls, '');
          await session.fire('tool_call', 'main', {
            toolName,
            toolCallId: `call-${toolName}`,
            input: {
              tasks: [
                {
                  agent: 'builder',
                  name: 'A',
                  task: '```assignment\n{"task":"renewal-form"}\n```',
                },
              ],
            },
          });
          await session.fire('tool_result', 'main', {
            toolName,
            toolCallId: `call-${toolName}`,
            details: { results: [{ index: 0, id: 'A', output: 'built' }] },
          });
          expect(lifecycleSent(calls), toolName).toEqual([
            {
              kind: 'dispatched',
              call: `call-${toolName}`,
              agent: 'A',
              role: 'builder',
              task: 'renewal-form',
            },
            { kind: 'returned', call: `call-${toolName}`, agent: 'A' },
          ]);
          expect(session.did.notices, toolName).toHaveLength(1);
        }
      } finally {
        Reflect.deleteProperty(process.env, 'STAND_IN_CALLS');
      }
    });

    it('sends the story and task an assignment names with the role, and the tokens the harness reports on return, and nothing for an item naming neither', async () => {
      omp.agents = [LEAD(), BUILDER()];
      const cwd = mkdtempSync(join(tmpdir(), 'omp-record-cwd-'));
      tmp.push(cwd);
      const calls = join(cwd, 'calls.jsonl');
      writeFileSync(calls, '');
      process.env.STAND_IN_CALLS = calls;
      try {
        const session = await started(undefined, cwd);
        await session.fire('session_start');
        expect(
          await session.fire('tool_call', 'main', {
            toolName: 'task',
            toolCallId: 'batch',
            input: {
              context: 'Renewal of a library loan.',
              tasks: [
                {
                  agent: 'lead',
                  name: 'Lead',
                  task: '```assignment\n{"story":"renewal","examples":["library/1"],"decisions":[]}\n```',
                },
                {
                  agent: 'builder',
                  name: 'Form',
                  task: '```assignment\n{"task":"renewal-form","story":"renewal"}\n```',
                },
                // Naming neither story nor task: not sent, nor its return.
                { agent: 'scout', task: 'Look around.' },
              ],
            },
          }),
        ).toBeUndefined();
        await session.fire('tool_result', 'main', {
          toolName: 'task',
          toolCallId: 'batch',
          details: {
            results: [
              { index: 0, id: 'Lead', tokens: 51234 },
              { index: 1, id: 'Form', tokens: 18000 },
              { index: 2, id: '2' },
            ],
          },
        });
        // The same return delivered again is sent once.
        await session.fire('tool_result', 'main', {
          toolName: 'task',
          toolCallId: 'batch',
          details: { results: [{ index: 1, id: 'Form', tokens: 18000 }] },
        });
        expect(lifecycleSent(calls)).toEqual([
          {
            kind: 'dispatched',
            call: 'batch',
            agent: 'Lead',
            role: 'lead',
            story: 'renewal',
          },
          {
            kind: 'dispatched',
            call: 'batch',
            agent: 'Form',
            role: 'builder',
            story: 'renewal',
            task: 'renewal-form',
          },
          { kind: 'returned', call: 'batch', agent: 'Lead', tokens: 51234 },
          { kind: 'returned', call: 'batch', agent: 'Form', tokens: 18000 },
        ]);
        // Nothing is warned of: every assignment fits, and every send succeeded.
        expect(session.did.notices).toEqual([]);
      } finally {
        Reflect.deleteProperty(process.env, 'STAND_IN_CALLS');
      }
    });

    describe('attach: a delegate holding a gate reaches its dispatcher only as the waiting notice, then its result', () => {
      type Answer =
        | { content?: unknown; details?: unknown; isError?: boolean }
        | undefined;
      const MISSING_YIELD =
        'SYSTEM WARNING: Subagent exited without calling yield tool after 3 reminders.';
      const READ_BACK =
        'The plan: three tasks, one builder each. Sign off the plan to send it to be built.';
      const DELIVERABLE = '{"story":"renewal","outcome":"merged"}';
      /** A lead's return at a delegated grant's end state: its plan sign-off taken and recorded. */
      const END_STATE =
        'Read-back: the plan sign-off was delegated to me; I took it and recorded it. The grant’s end state is reached: renewal is planned, three tasks recorded.';
      const CONTRACT = {
        type: 'object',
        properties: {
          story: { type: 'string' },
          outcome: { type: 'string' },
        },
        required: ['story', 'outcome'],
      };
      /** A lead whose decision rights hold sign-off, as projection writes the line, declaring
       *  {@link CONTRACT} as its deliverable unless `delivers` is false. */
      const GATED = (delivers = true) => ({
        ...declare(
          { name: 'lead', description: 'Holds a gate.' },
          "# lead\n\n### decision-rights\n\n- realization (how the work is built): **D** — decides\n- sign-off (agreeing a handover serves its intent): **R** — puts its handovers up for it\n\n### memory\n\n- **working** — the session's own context",
        ),
        ...(delivers ? { output: CONTRACT } : {}),
      });
      /** A result as omp 18.10.2's task tool renders it. */
      const envelope = (id: string, agent: string, output: string) =>
        `<task-result id="${id}" agent="${agent}" status="completed" duration="2m">\n<output>\n${output}\n</output>\n</task-result>`;
      const waiting = (id: string) =>
        [
          `<task-result id="${id}" agent="lead" status="waiting on the operator">`,
          `${id} (lead) waits on the operator's sign-off, in its own session. The operator joins it in omp's Agent Hub: Alt+A, select ${id}, Enter. Its result reaches you once the operator answers.`,
          '</task-result>',
        ].join('\n');
      const LEAD = {
        index: 0,
        id: 'Lead',
        agent: 'lead',
        exitCode: 0,
        stderr: '',
        output: READ_BACK,
        tokens: 900,
      };
      const FORM = {
        index: 1,
        id: 'Form',
        agent: 'builder',
        exitCode: 0,
        stderr: '',
        output: 'built',
      };
      const said = (text: string) => ({
        role: 'assistant',
        stopReason: 'stop',
        content: [{ type: 'text', text }],
      });
      const asked = (text: string) => ({ role: 'user', content: text });

      /** The emitted module in a stand-in omp process: `bind` starts one session of it, as omp
       *  binds a module's factory to each session, every session sharing the module's state;
       *  `emit` sends one of omp's events on the process's bus. */
      async function ompProcess() {
        const factory = await emitted({
          name: 'stand in',
          purpose: 'p',
          when: 'w',
          verbs: [],
        });
        const bus = new Map<string, ((data: unknown) => void)[]>();
        async function bind(
          agent: { kind: string; name: string; id: string; parentId?: string },
          entries: unknown[] = [],
        ) {
          const handlers = new Map<string, Handler>();
          const sent: unknown[] = [];
          const told: unknown[] = [];
          await factory({
            typebox: { Type: { Unsafe: (schema: unknown) => schema } },
            registerTool: () => {},
            registerFlag: () => {},
            getFlag: () => undefined,
            on: (event: string, handler: Handler) =>
              handlers.set(event, handler),
            setModel: async () => {},
            setThinkingLevel: () => {},
            setActiveTools: async () => {},
            sendMessage: (message: unknown, options: unknown) =>
              sent.push([message, options]),
            appendEntry: (customType: string, data: unknown) =>
              entries.push({ type: 'custom', customType, data }),
            events: {
              on: (channel: string, fn: (data: unknown) => void) =>
                bus.set(channel, [...(bus.get(channel) ?? []), fn]),
            },
          });
          const ctx = {
            cwd: '/the/session/cwd',
            agent,
            model: { provider: 'fixture', id: 'base' },
            modelRegistry: {},
            ui: {
              setStatus: () => {},
              notify: (message: unknown, type: unknown) =>
                told.push([message, type]),
            },
            sessionManager: { getBranch: () => [], getEntries: () => entries },
          };
          const fire = async (event: string, payload: unknown) =>
            handlers.get(event)?.(payload, ctx);
          await fire('session_start', {});
          return { fire, sent, entries, told };
        }
        const emit = (channel: string, data: unknown) => {
          for (const fn of bus.get(channel) ?? []) fn(data);
        };
        return { bind, emit };
      }
      const MAIN = { kind: 'main', name: 'main', id: 'Main' };
      const DELEGATE = {
        kind: 'sub',
        name: 'lead',
        id: 'Lead',
        parentId: 'Main',
      };

      /** A settled `task` call, and what the model is given of it once omp merges the
       *  module's answer: each field the answer returns replaces the call's own. */
      async function settle(event: Record<string, unknown>) {
        const { bind } = await ompProcess();
        const main = await bind(MAIN);
        const answer = (await main.fire('tool_result', {
          toolName: 'task',
          toolCallId: 'call',
          input: {},
          ...event,
        })) as Answer;
        return {
          answer,
          given: {
            content: answer?.content ?? event.content,
            details: answer?.details ?? event.details,
            isError: answer?.isError ?? event.isError,
          },
        };
      }

      it('gives a held reply as the waiting notice in the content and the details, every other result and the call’s error state as omp gave them', async () => {
        omp.agents = [GATED(), BUILDER()];
        const failure = 'Task execution failed: the isolation merge threw';
        const progress = [
          { index: 0, id: 'Lead', recentOutput: ['Sign off the plan'] },
          { index: 1, id: 'Form', recentOutput: ['built'] },
        ];
        const results = [
          LEAD,
          FORM,
          {
            index: 2,
            id: 'Gone',
            agent: 'builder',
            exitCode: 0,
            stderr: '',
            output: 'half',
            error: failure,
          },
        ];
        const { given } = await settle({
          content: [
            {
              type: 'text',
              text: `${envelope('Lead', 'lead', READ_BACK)}\n\n${envelope('Form', 'builder', 'built')}\n\n${failure}`,
            },
          ],
          isError: true,
          details: { results, progress, totalDurationMs: 7 },
        });
        expect(given).toEqual({
          content: [
            {
              type: 'text',
              text: `${waiting('Lead')}\n\n${envelope('Form', 'builder', 'built')}\n\n${failure}`,
            },
          ],
          isError: true,
          details: {
            results: [
              {
                index: 0,
                id: 'Lead',
                agent: 'lead',
                exitCode: 0,
                tokens: 900,
                output: waiting('Lead'),
              },
              results[1],
              results[2],
            ],
            progress: [{ ...progress[0], recentOutput: [] }, progress[1]],
            totalDurationMs: 7,
          },
        });
        expect(JSON.stringify(given)).not.toContain('Sign off the plan');
      });

      it('holds a gate only on a reply ending with the sign-off it waits on; any other reply, the deliverable or not, passes as its result', async () => {
        omp.agents = [GATED()];
        const content = [
          { type: 'text', text: envelope('Lead', 'lead', READ_BACK) },
        ];
        for (const result of [
          { ...LEAD, output: DELIVERABLE },
          { ...LEAD, output: `Done.\n\n\`\`\`json\n${DELIVERABLE}\n\`\`\`` },
          {
            ...LEAD,
            output: DELIVERABLE,
            structuredOutput: { status: 'valid', data: {} },
          },
          // A grant's end-state read-back, and other prose: results, not gates.
          { ...LEAD, output: END_STATE },
          { ...LEAD, output: 'Built renewal; two pull requests merged.' },
          { ...LEAD, output: '{"story":"renewal"}' },
        ])
          expect(
            (await settle({ content, details: { results: [result] } })).answer,
            result.output,
          ).toBeUndefined();
        for (const result of [
          LEAD,
          {
            ...LEAD,
            output: 'The plan: three tasks. Do you sign off the plan?',
          },
          { ...LEAD, output: 'The plan is below.\n\n**Sign off the plan?**' },
          {
            ...LEAD,
            output: `\`\`\`json\n{"story":"renewal"}\n\`\`\`\n${READ_BACK}`,
          },
          // Structured results: no deliverable given, and one failing the contract.
          {
            ...LEAD,
            exitCode: 1,
            stderr: MISSING_YIELD,
            error: MISSING_YIELD,
            output: `${MISSING_YIELD}\n\n${READ_BACK}`,
          },
          {
            ...LEAD,
            exitCode: 1,
            error: 'schema_violation: missing required fields: outcome',
            output: READ_BACK,
            structuredOutput: { status: 'invalid', data: READ_BACK },
          },
        ]) {
          const { given } = await settle({
            content,
            details: { results: [result] },
          });
          expect(given.content, result.output).toEqual([
            { type: 'text', text: waiting('Lead') },
          ]);
        }
      });

      it('holds no gate for a delegate without sign-off, nor for a cancelled or failed run', async () => {
        const content = [
          { type: 'text', text: envelope('Lead', 'lead', READ_BACK) },
        ];
        omp.agents = [
          {
            ...declare(
              { name: 'lead', description: 'Realizes.' },
              'Realize the story.',
            ),
            output: CONTRACT,
          },
        ];
        expect(
          (await settle({ content, details: { results: [LEAD] } })).answer,
        ).toBeUndefined();
        omp.agents = [GATED()];
        for (const result of [
          { ...LEAD, aborted: true, error: 'Cancelled by caller' },
          { ...LEAD, exitCode: 1, error: '[fixture/base] overloaded' },
        ])
          expect(
            (await settle({ content, details: { results: [result] } })).answer,
          ).toBeUndefined();
      });

      it('judges a holder declaring no JSON deliverable alike: held only where its reply ends with the sign-off it waits on', async () => {
        omp.agents = [GATED(false)];
        const { given } = await settle({
          content: [
            { type: 'text', text: envelope('Lead', 'lead', READ_BACK) },
          ],
          details: { results: [LEAD] },
        });
        expect(given.content).toEqual([
          { type: 'text', text: waiting('Lead') },
        ]);
        for (const output of [END_STATE, DELIVERABLE])
          expect(
            (
              await settle({
                content: [
                  { type: 'text', text: envelope('Lead', 'lead', output) },
                ],
                details: { results: [{ ...LEAD, output }] },
              })
            ).answer,
            output,
          ).toBeUndefined();
      });

      /** omp's background delivery of `jobs`, one message of the dispatching session. */
      const delivered = (
        timestamp: number,
        jobs: { id: string; text: string; schema?: unknown; status?: string }[],
      ) => ({
        role: 'custom',
        customType: 'async-result',
        timestamp,
        content:
          jobs.length === 1
            ? `<system-notice>\nBackground job ${jobs[0]?.id} has completed. Resume your work using the result below.\n${jobs[0]?.text}\n</system-notice>`
            : `<system-notice>\n${jobs.length} background jobs have completed. Resume your work using the results below.\n\n${jobs.map((j) => `── Job ${j.id} ──\n${j.text}`).join('\n')}\n</system-notice>`,
        details: {
          jobs: jobs.map((j) => ({
            jobId: j.id,
            type: 'task',
            agentId: j.id,
            status: j.status ?? 'completed',
            ...(j.schema === undefined ? {} : { schema: j.schema }),
          })),
        },
      });

      it('gives a later result omp hands over, the reply alone of a turn the dispatcher woke, as the waiting notice when it holds a gate, and keeps that verdict', async () => {
        omp.agents = [GATED(), BUILDER()];
        const { bind } = await ompProcess();
        const main = await bind(MAIN);
        await bind(DELEGATE);
        // omp relays a turn the dispatcher woke as its plain reply: no envelope names the agent.
        const message = delivered(1, [{ id: 'Lead', text: READ_BACK }]);
        const context = [asked('Build renewal.'), message];
        const rewritten = [
          context[0],
          {
            ...message,
            content: `<system-notice>\n${waiting('Lead')}\n</system-notice>`,
          },
        ];
        expect(await main.fire('context', { messages: context })).toEqual({
          messages: rewritten,
        });
        expect(main.entries).toEqual([
          {
            type: 'custom',
            customType: 'cratylus-gate-hold',
            data: { key: 'Lead@1', agent: 'lead' },
          },
        ]);
        expect(await main.fire('context', { messages: context })).toEqual({
          messages: rewritten,
        });
        // A process that starts afresh reads the verdict from the session's record.
        const again = await (await ompProcess()).bind(MAIN, main.entries);
        expect(await again.fire('context', { messages: context })).toEqual({
          messages: rewritten,
        });
        expect(again.entries).toHaveLength(1);
        // The deliverable, and a failed turn, pass as omp gave them.
        for (const passing of [
          delivered(2, [{ id: 'Lead', text: DELIVERABLE }]),
          delivered(4, [
            { id: 'Lead', text: envelope('Lead', 'lead', END_STATE) },
          ]),
          delivered(3, [
            {
              id: 'Lead',
              text: 'Wake turn failed: overloaded.',
              status: 'failed',
            },
          ]),
        ])
          expect(
            await main.fire('context', { messages: [passing] }),
          ).toBeUndefined();
      });

      it('rewrites only the held jobs of a background delivery, and takes omp’s verdict on a structured one', async () => {
        omp.agents = [GATED(), BUILDER()];
        const { bind } = await ompProcess();
        const main = await bind(MAIN);
        await bind(DELEGATE);
        const built = envelope('Form', 'builder', 'built');
        const message = delivered(2, [
          {
            id: 'Lead',
            text: envelope('Lead', 'lead', READ_BACK),
            schema: { status: 'invalid', data: READ_BACK },
          },
          { id: 'Form', text: built },
        ]);
        const answer = (await main.fire('context', {
          messages: [message],
        })) as {
          messages: { content: string }[];
        };
        expect(answer.messages[0]?.content).toBe(
          `<system-notice>\n2 background jobs have completed. Resume your work using the results below.\n\n── Job Lead ──\n${waiting('Lead')}\n── Job Form ──\n${built}\n</system-notice>`,
        );
        // omp found the deliverable valid: it passes.
        const valid = delivered(3, [
          {
            id: 'Lead',
            text: envelope('Lead', 'lead', DELIVERABLE),
            schema: { status: 'valid', data: {} },
          },
        ]);
        expect(
          await main.fire('context', { messages: [valid] }),
        ).toBeUndefined();
      });

      it('hands the dispatcher each later turn the operator prompts, read from that run alone: another gate as the notice, the deliverable as the result', async () => {
        omp.agents = [GATED()];
        const { bind, emit } = await ompProcess();
        const main = await bind(MAIN);
        const lead = await bind(DELEGATE);
        /** One run of the delegate: omp's events for it, its `agent_end` carrying the
         *  whole session history, as omp's does. */
        const history: unknown[] = [];
        async function runs(...messages: unknown[]) {
          await lead.fire('agent_start', {});
          for (const message of messages) {
            history.push(message);
            await lead.fire('message_end', { message });
          }
          await lead.fire('agent_end', { messages: [...history] });
        }
        /** A run's yield call and the yield tool's answer to it, as omp records both. */
        const yielded = (answer: Record<string, unknown>) => [
          {
            role: 'assistant',
            stopReason: 'toolUse',
            content: [{ type: 'toolCall', name: 'yield' }],
          },
          { role: 'toolResult', toolName: 'yield', ...answer },
        ];
        const fromDispatcher = { role: 'custom', details: { from: 'Main' } };
        // Its dispatched run: the task result carries it, so nothing is sent.
        emit('task:subagent:lifecycle', { id: 'Lead', status: 'started' });
        await runs(asked('Realize renewal.'), said(READ_BACK));
        emit('task:subagent:lifecycle', { id: 'Lead', status: 'completed' });
        expect(main.sent).toEqual([]);
        // A run the dispatcher's own message woke, and one whose yield omp's monitor
        // accepts as its result, whole or aborting, reach it from omp.
        await runs(fromDispatcher, said(READ_BACK));
        await runs(
          asked('Signed off.'),
          ...yielded({
            isError: false,
            details: { status: 'success', data: {} },
          }),
          said('Delivered.'),
        );
        await runs(
          asked('Stop.'),
          ...yielded({
            isError: false,
            details: { status: 'aborted', error: 'stopped' },
          }),
          said('Stopped.'),
        );
        expect(main.sent).toEqual([]);
        // A yield the tool rejected, and an incremental section, are no result omp hands
        // over: the gate the run then stops at is the extension's to say.
        await runs(
          asked('Signed off.'),
          ...yielded({
            isError: true,
            content: [{ type: 'text', text: 'schema_violation' }],
          }),
          said('The contract needs an outcome first. Sign off the plan again.'),
        );
        await runs(
          asked('Report as you go.'),
          ...yielded({
            isError: false,
            details: { status: 'success', type: ['findings'], data: {} },
          }),
          said('First findings in. Sign off before I go on.'),
        );
        // Runs the operator prompts, after those earlier ones in the same history.
        await runs(
          asked('Use two builders.'),
          said('Two builders now. Sign off the revised plan.'),
        );
        await runs(asked('Signed off.'), said(DELIVERABLE));
        const options = { triggerTurn: true, deliverAs: 'followUp' };
        const notice = [
          {
            customType: 'cratylus-attach',
            content: waiting('Lead'),
            display: true,
            details: { id: 'Lead', held: true },
          },
          options,
        ];
        expect(main.sent).toEqual([
          notice,
          notice,
          notice,
          [
            {
              customType: 'cratylus-attach',
              content: `<task-result id="Lead" agent="lead" status="completed">\n<output>\n${DELIVERABLE}\n</output>\n</task-result>`,
              display: true,
              details: { id: 'Lead', held: false },
            },
            options,
          ],
        ]);
        expect(JSON.stringify(main.sent)).not.toContain('revised plan');
      });

      describe('the operator is told in its own session as soon as a gate waits on it, by every route, however deep the holder', () => {
        /** What the operator's own session shows of a gate the agent `id` holds. */
        const told = (id: string) => [
          `${id} (lead) waits on your sign-off, in its own session. Join it in omp's Agent Hub: Alt+A, select ${id}, Enter.`,
          'warning',
        ];
        /** One process: the operator's main session, a delegate of it that dispatched the lead,
         *  and the lead, nested below both; what each interface showed as it started is cleared. */
        async function nested() {
          const process = await ompProcess();
          const main = await process.bind(MAIN);
          const arch = await process.bind({
            kind: 'sub',
            name: 'architect',
            id: 'Arch',
            parentId: 'Main',
          });
          const lead = await process.bind({ ...DELEGATE, parentId: 'Arch' });
          for (const session of [main, arch, lead]) session.told.length = 0;
          /** One run of the lead, as omp's events give it. */
          async function runs(...messages: unknown[]) {
            await lead.fire('agent_start', {});
            for (const message of messages)
              await lead.fire('message_end', { message });
            await lead.fire('agent_end', { messages });
          }
          return { ...process, main, arch, lead, runs };
        }
        /** No session's model is given the operator's notice. */
        const unread = (...sessions: { sent: unknown[] }[]) => {
          for (const session of sessions)
            expect(JSON.stringify(session.sent)).not.toContain('your sign-off');
        };

        it('on the task result of its dispatch, the dispatcher itself a delegate', async () => {
          omp.agents = [GATED(), BUILDER()];
          const { main, arch, lead } = await nested();
          const result = (lead: Record<string, unknown>) =>
            arch.fire('tool_result', {
              toolName: 'task',
              toolCallId: 'call',
              input: {},
              content: [
                {
                  type: 'text',
                  text: `${envelope('Lead', 'lead', String(lead.output))}\n\n${envelope('Form', 'builder', 'built')}`,
                },
              ],
              details: { results: [lead, FORM] },
            });
          const answer = await result(LEAD);
          expect(JSON.stringify(answer)).not.toContain('your sign-off');
          expect(main.told).toEqual([told('Lead')]);
          expect([arch.told, lead.told]).toEqual([[], []]);
          // Its deliverable, after another run, holds no gate: nothing more is told.
          await lead.fire('agent_start', {});
          await result({ ...LEAD, output: DELIVERABLE });
          expect(main.told).toEqual([told('Lead')]);
          unread(main, arch, lead);
        });

        it('as its dispatched run ends, while another blocking item of the same dispatch still runs', async () => {
          omp.agents = [GATED()];
          const { main, arch, lead, bind, emit } = await nested();
          const second = await bind({
            ...DELEGATE,
            id: 'Second',
            parentId: 'Arch',
          });
          main.told.length = 0;
          const lifecycle = (id: string, status: string) =>
            emit('task:subagent:lifecycle', { id, agent: 'lead', status });
          lifecycle('Lead', 'started');
          lifecycle('Second', 'started');
          // The lead's run over two prompts, omp's yield reminder the second: it stops on its read-back.
          for (const message of [said('Planning.'), said(READ_BACK)]) {
            await lead.fire('agent_start', {});
            await lead.fire('message_end', { message });
            await lead.fire('agent_end', { messages: [message] });
          }
          expect(main.told).toEqual([]);
          // omp settles it (no yield: failed) before the other item ends, and before any task result.
          lifecycle('Lead', 'failed');
          await vi.waitFor(() => expect(main.told).toEqual([told('Lead')]));
          // The other item gives its deliverable through a yield omp accepts: no gate.
          await second.fire('agent_start', {});
          for (const message of [
            {
              role: 'assistant',
              stopReason: 'toolUse',
              content: [{ type: 'toolCall', name: 'yield' }],
            },
            {
              role: 'toolResult',
              toolName: 'yield',
              isError: false,
              details: { status: 'success', data: JSON.parse(DELIVERABLE) },
            },
            said('Delivered.'),
          ])
            await second.fire('message_end', { message });
          await second.fire('agent_end', { messages: [] });
          lifecycle('Second', 'completed');
          // The task result once both have settled: the dispatcher is given the lead only as the
          // waiting notice, the other item's deliverable holds no gate, and the operator is not
          // told again.
          const answer = (await arch.fire('tool_result', {
            toolName: 'task',
            toolCallId: 'call',
            input: {},
            content: [
              {
                type: 'text',
                text: `${envelope('Lead', 'lead', READ_BACK)}\n\n${envelope('Second', 'lead', DELIVERABLE)}`,
              },
            ],
            details: {
              results: [
                { ...LEAD, exitCode: 1, error: MISSING_YIELD },
                {
                  ...LEAD,
                  index: 1,
                  id: 'Second',
                  output: DELIVERABLE,
                  structuredOutput: { status: 'valid', data: {} },
                },
              ],
            },
          })) as { content: { text: string }[] };
          expect(answer.content[0]?.text).toBe(
            `${waiting('Lead')}\n\n${envelope('Second', 'lead', DELIVERABLE)}`,
          );
          expect(main.told).toEqual([told('Lead')]);
          unread(main, arch, lead, second);
        });

        it('as each later run stops at a gate, its dispatcher’s message, a peer’s or the operator’s having started it', async () => {
          omp.agents = [GATED()];
          const { main, arch, lead, runs } = await nested();
          await runs(
            { role: 'custom', details: { from: 'Arch' } },
            said(READ_BACK),
          );
          expect(main.told).toEqual([told('Lead')]);
          await runs(
            { role: 'custom', details: { from: 'Peer' } },
            said(READ_BACK),
          );
          await runs(
            asked('Use two builders.'),
            said('Two builders now. Sign off the revised plan.'),
          );
          await runs(asked('Signed off.'), said(DELIVERABLE));
          await runs(asked('Carry it to the grant’s end.'), said(END_STATE));
          expect(main.told).toEqual([told('Lead'), told('Lead'), told('Lead')]);
          expect([arch.told, lead.told]).toEqual([[], []]);
          // The end-state read-back reaches the dispatcher unchanged, as its result.
          expect(JSON.stringify(arch.sent.at(-1))).toContain(
            'end state is reached',
          );
          unread(main, arch, lead);
        });

        it('on a background delivery of a later result, once per gate', async () => {
          omp.agents = [GATED(), BUILDER()];
          const { main, arch, runs } = await nested();
          const first = delivered(1, [{ id: 'Lead', text: READ_BACK }]);
          await arch.fire('context', { messages: [first] });
          await arch.fire('context', { messages: [first] });
          expect(main.told).toEqual([told('Lead')]);
          // A gate told as its run ended, then delivered: told once.
          await runs(
            { role: 'custom', details: { from: 'Arch' } },
            said(READ_BACK),
          );
          await arch.fire('context', {
            messages: [first, delivered(2, [{ id: 'Lead', text: READ_BACK }])],
          });
          expect(main.told).toEqual([told('Lead'), told('Lead')]);
          unread(main, arch);
          // A process started afresh reads the verdict from the record and tells nothing anew.
          const again = await ompProcess();
          const operator = await again.bind(MAIN);
          const dispatcher = await again.bind(
            { kind: 'sub', name: 'architect', id: 'Arch', parentId: 'Main' },
            arch.entries,
          );
          operator.told.length = 0;
          await dispatcher.fire('context', { messages: [first] });
          expect(operator.told).toEqual([]);
        });
      });
    });

    it('takes no other call for a dispatch: one carrying no agent and task is let through unread', async () => {
      omp.agents = [LEAD()];
      const session = await started();
      await session.fire('session_start');
      expect(
        await session.fire('tool_call', 'main', {
          toolName: 'write',
          toolCallId: 'w',
          input: { path: 'agent://lead', content: 'Realize it.' },
        }),
      ).toBeUndefined();
    });

    it('lists the assignment form of each contracted agent in every session, launched or not, main or dispatched', async () => {
      omp.agents = [
        LEAD(),
        declare({ name: 'pilot', description: 'd' }, 'Fly.'),
      ];
      const forms = `# Assignment forms\n\nGive a dispatch of these agents its assignment in its task text so:\n\n${LEAD_FORM}`;
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

    it('opens a launch whose procedure starts with reconstitution with a note on its first turn alone', async () => {
      omp.agents = [
        declare(
          { name: 'architect', description: 'Holds the design.' },
          '# architect\n\n### procedure\n\n- **reconstitution** — at every start, read back before acting\n- **judgment** — judge once\n\n### stance\n\n- **decisive** — decides',
        ),
      ];
      const { fire } = await started('architect');
      await fire('session_start');
      const turns: string[] = [];
      for (const _turn of [1, 2])
        turns.push(
          (
            (await fire('before_agent_start')) as { systemPrompt: string[] }
          ).systemPrompt.join('\n'),
        );
      expect(turns[0]).toContain('# Session start: reconstitution');
      expect(turns[0]).toContain(
        'This session starts with reconstitution (at every start, read back before acting).',
      );
      for (const line of [
        "Read each touched context's overview and the delivered workflow overview (cratylus:workflow, or the project's own workflow context where its journal holds it) first, then the detail you need of its design and of its cuts. The delivered workflow is the practice you work by, shown apart from the project's design and never part of it: read it whole, never only recalled from tool descriptions or memory.",
        'Your sources are the journal, the ledger and the example files the design names; the work itself — the project tree, source, tests — is not a source: never list, search or open it.',
        'Nothing is recorded or changed before the read-back: no dispatch, no journal append, no edit before it. In it tell the operator, in visible text rather than only in your thinking, the records as they stand now: first the current design, then what is open, each open decision named as open, then the stories and tasks in flight as the ledger records them, in your own communication style.',
        'Say nothing to the operator before the read-back. Its bottom line is the state of the records; a ruling you hold now comes after it, as its own topic, carried in the read-back and recorded only once the operator signs off.',
        'A read-back held at a gate or called by the operator ends with the sign-off it waits on and ends your turn: nothing follows it until the operator answers.',
      ])
        expect(turns[0]).toContain(line);
      // It no longer sends the agent on past the read-back in the same turn.
      expect(turns[0]).not.toContain('in the same turn');
      expect(turns[0]).not.toContain('pause for leave');
      expect(turns[1]).not.toContain('# Session start');
      // A declaration without it gets no note.
      omp.agents = [CARTOGRAPHER()];
      const other = await started('cartographer');
      await other.fire('session_start');
      expect(
        (
          (await other.fire('before_agent_start')) as { systemPrompt: string[] }
        ).systemPrompt.join('\n'),
      ).not.toContain('# Session start');
    });

    it('carries the scope a reconstitution note gives it into the session-start note', async () => {
      omp.agents = [
        declare(
          { name: 'architect', description: 'Holds the design.' },
          '# architect\n\n### procedure\n\n- **reconstitution** (records and changes nothing before its read-back) — at every start, read back before acting',
        ),
      ];
      const { fire } = await started('architect');
      await fire('session_start');
      expect(await fire('before_agent_start')).toMatchObject({
        systemPrompt: expect.arrayContaining([
          expect.stringContaining(
            'This session starts with reconstitution (at every start, read back before acting): records and changes nothing before its read-back.',
          ),
        ]),
      });
    });

    it('gives every turn of a launch that decides meaning, or keeps the records under honesty, a note of each', async () => {
      omp.agents = [
        declare(
          { name: 'architect', description: 'Holds the design.' },
          '# architect\n\n### decision-rights\n\n- intent (what is wanted and why): **I** — gives input\n- meaning (concepts and examples): **D** — decides\n\n### memory\n\n- **source-of-truth** — the concept journal and examples are authoritative over anything remembered\n\n### guardrails\n\n- **honesty** — never fabricates; says what it observed apart from what it inferred (fixed)',
        ),
      ];
      /** The system prompt a turn of `fire`'s session carries, joined. */
      const turnPrompt = async (fire: (event: string) => Promise<unknown>) => {
        const turn = await fire('before_agent_start');
        return turn &&
          typeof turn === 'object' &&
          'systemPrompt' in turn &&
          Array.isArray(turn.systemPrompt)
          ? turn.systemPrompt.join('\n')
          : '';
      };
      const { fire } = await started('architect');
      await fire('session_start');
      for (const turn of [1, 2]) {
        const prompt = await turnPrompt(fire);
        for (const line of [
          '# Meaning: yours',
          'The meaning of every context you hold is yours: its concepts, each question on them, and the approval of every one of its examples. No one else approves or confirms an example of a context you hold, and you ask no one to.',
          "Approval judges one thing: whether an example expresses its concepts' meaning accurately. Approve yourself, as they stand and in the turn they reach you, the examples returned to you that do, keeping each context's model its own; send back only an example that misses its meaning, naming the meaning it misses.",
          "Settle on sight: a decision you own whose grounds you hold is taken in the turn you hold them and reported with its reason, never deferred to a later round, another party's return or anyone's answer. At a session's start, or where the operator has called a read-back before recording, carry the ruling in the read-back and record it only once the operator signs off.",
          '# The records',
          "The journal, the ledger and your delegates' reports are the record of the design and its work, authoritative over anything remembered. State where things stand as they record it, what you observed apart from what you infer.",
          'What they do not record is unknown: say it is unrecorded, never turn its absence into a fact about the work.',
        ])
          expect(prompt, `turn ${turn}`).toContain(line);
      }
      // Recommending meaning, or keeping the records without honesty, gets neither note.
      omp.agents = [
        declare(
          { name: 'illustrator', description: 'Writes examples.' },
          '# illustrator\n\n### decision-rights\n\n- meaning (concepts and examples): **R** — recommends\n\n### memory\n\n- **source-of-truth** — authoritative',
        ),
      ];
      const other = await started('illustrator');
      await other.fire('session_start');
      const prompt = await turnPrompt(other.fire);
      expect(prompt).not.toContain('# Meaning: yours');
      expect(prompt).not.toContain('# The records');
    });

    const ARCHITECT = () =>
      declare(
        { name: 'architect', description: 'Holds the design.' },
        '# architect\n\n### procedure\n\n- **reconstitution** — at every start, read back before acting\n\n### stance\n\n- **decisive** — decides',
      );

    /** The CRATYLUS module loaded into a stand-in omp started with `--agent <agent>` on a
     *  session whose branch holds `branch`, every handler of an event fired in order, as
     *  omp's runner does; what each returned, and what the session was told. */
    async function loadedAs(agent: string, branch: readonly unknown[] = []) {
      const factory = await emitted({
        name: 'concept journal',
        purpose: 'p',
        when: 'w',
        verbs: [
          {
            name: 'define',
            concept: 'c',
            purpose: 'p',
            when: 'w',
            effect: 'appends',
            parameters: [],
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
        sessionManager: { getBranch: () => branch },
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
      { toolName: 'concept_journal_concepts', input: { verb: 'define' } },
      { toolName: 'read', input: { path: 'design/journal' } },
    ];

    it('holds no act of a reconstituting launch, before or after it speaks, and answers no reply (0142)', async () => {
      omp.agents = [ARCHITECT()];
      const { fire, told } = await loadedAs('architect');
      for (const call of acts)
        expect(await fire('tool_call', call), call.toolName).toBeUndefined();
      await fire('message_end', reply('Which option would you prefer?'));
      for (const call of acts)
        expect(await fire('tool_call', call), call.toolName).toBeUndefined();
      expect(told).toEqual([]);
    });

    const conversation = [
      {
        type: 'message',
        message: { role: 'user', content: 'Approve the cut.' },
      },
      { type: 'message', message: { role: 'assistant', content: 'Done.' } },
    ];
    /** The system prompt of the next turn, joined. */
    const note = async (fire: (e: string, p: unknown) => Promise<unknown>) => {
      const turn = await fire('before_agent_start', { systemPrompt: BASE });
      return turn && typeof turn === 'object' && 'systemPrompt' in turn
        ? String((turn.systemPrompt as string[]).join('\n'))
        : '';
    };

    it('reconstitutes a new session: the note on its first turn', async () => {
      omp.agents = [ARCHITECT()];
      const { fire } = await loadedAs('architect');
      expect(await note(fire)).toContain('# Session start: reconstitution');
    });

    it('reconstitutes nothing in a resumed session continuing a conversation', async () => {
      omp.agents = [ARCHITECT()];
      const { fire } = await loadedAs('architect', conversation);
      expect(await note(fire)).not.toContain('# Session start');
    });

    it('reconstitutes a resumed session compacted since it last spoke', async () => {
      omp.agents = [ARCHITECT()];
      const { fire } = await loadedAs('architect', [
        ...conversation,
        { type: 'compaction', summary: 'The cut was approved.' },
      ]);
      expect(await note(fire)).toContain('# Session start: reconstitution');
    });

    it('reconstitutes again once the session is compacted', async () => {
      omp.agents = [ARCHITECT()];
      const { fire } = await loadedAs('architect', conversation);
      expect(await note(fire)).not.toContain('# Session start');
      await fire('session_compact', {
        compactionEntry: { type: 'compaction' },
      });
      expect(await note(fire)).toContain('# Session start: reconstitution');
      expect(await note(fire), 'the first turn after it alone').not.toContain(
        '# Session start',
      );
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

    it('refuses no dispatch of a launched session, whatever whom its declaration names (0142)', async () => {
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
