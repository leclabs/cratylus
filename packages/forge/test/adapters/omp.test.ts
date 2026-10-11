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
/** The judge the session module's guards ask (`completeSimple`), answering `verdict`, or, for a
 *  system prompt `answers` names, its answer there. */
const judge = vi.hoisted(() => ({
  verdict: '',
  answers: {} as Record<string, string>,
  asked: [] as unknown[],
}));
vi.mock('@oh-my-pi/pi-ai', () => ({
  completeSimple: async (_model: unknown, input: unknown) => {
    judge.asked.push(input);
    const prompts =
      input !== null && typeof input === 'object' && 'systemPrompt' in input
        ? input.systemPrompt
        : undefined;
    const prompt = Array.isArray(prompts) ? prompts[0] : undefined;
    const answer =
      typeof prompt === 'string' ? judge.answers[prompt] : undefined;
    return { content: [{ type: 'text', text: answer ?? judge.verdict }] };
  },
}));
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
  it('carries name, description, the empty key and the model role named for the agent', () => {
    const front = frontMatter(agentToOmpMd(AGENT, CTX));
    expect(front).toEqual({
      name: 'mav',
      description: 'the builder: ships things',
      key: 'null',
      model: '@mav',
    });
    expect(Object.keys(front)).toEqual(['name', 'description', 'key', 'model']);
  });

  it('writes every setting in the order omp reads them, each only where it applies', () => {
    const front = frontMatter(
      agentToOmpMd(
        agent({
          mark: { emoji: '✈️', hue: 'green' },
          dispatches: ['illustrator', 'lead', 'researcher'],
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

  it('dispatches exactly its handoffs, the researcher as omp’s own scout', () => {
    const spawns = (dispatches: readonly string[] | undefined) =>
      frontMatter(agentToOmpMd(agent({ dispatches }), CTX)).spawns;
    expect(spawns(['illustrator', 'lead', 'researcher'])).toBe(
      'illustrator, lead, scout',
    );
    // `""` denies every dispatch: an agent that hands off to no one dispatches no one.
    expect(spawns([])).toBe('');
    // Undeclared handoffs leave omp's default in place.
    expect(spawns(undefined)).toBeUndefined();
    expect(ompHarnessAdapter.nativeAgents).toEqual({ researcher: 'scout' });
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
      expect(fence.split('\n')).toHaveLength(4);
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
  const host = [
    ['default', 'anthropic/frontier-model:low'],
    ['smol', 'anthropic/small-model:medium'],
    ['plan', '@default'],
    ['second', 'anthropic/other-model:high'],
    ['alternate', 'openai/other-family:max'],
    ['later', 'google/third-family'],
  ] as const;

  it("binds an agent's own role to its tier and effort", () => {
    expect(ompRoleRouting.agentRole({ tier: 'frontier', effort: 'high' })).toBe(
      '@frontier:high',
    );
  });

  it('seeds each tier from the host’s own roles, its thinking level dropped', () => {
    expect(ompRoleRouting.seedTier('frontier', host)).toBe(
      'anthropic/frontier-model',
    );
    expect(ompRoleRouting.seedTier('fast', host)).toBe('anthropic/small-model');
    // The first entry, in file order, of another provider than the frontier's; an
    // alias names no provider.
    expect(ompRoleRouting.seedTier('frontier-other-family', host)).toBe(
      'openai/other-family',
    );
  });

  it('reads the frontier the host already set when it seeds the other family', () => {
    expect(
      ompRoleRouting.seedTier('frontier-other-family', [
        ['frontier', 'openai/chosen'],
        ...host,
      ]),
    ).toBe('anthropic/frontier-model');
  });

  it('seeds nothing it has no model for', () => {
    expect(ompRoleRouting.seedTier('frontier', [])).toBeUndefined();
    expect(
      ompRoleRouting.seedTier('fast', [['default', 'a/b']]),
    ).toBeUndefined();
    expect(
      ompRoleRouting.seedTier('frontier-other-family', [['default', 'a/b']]),
    ).toBeUndefined();
    expect(ompRoleRouting.seedTier('no-such-tier', host)).toBeUndefined();
  });
});

describe('omp scopes nothing per agent', () => {
  it('narrows no event to one agent, so a guard an agent composes is reported', () => {
    for (const event of Object.keys(ompHarnessAdapter.nativeEvents)) {
      expect(ompHarnessAdapter.scopes(event as never), event).toBe(false);
    }
    expect(ompHarnessAdapter.enforcingSurface).toBeUndefined();
  });

  it('places every scoped module in the session root and refuses an agent scope', () => {
    expect(ompHarnessAdapter.scopedRel?.('m.ts')).toBe('agent/extensions/m.ts');
    expect(ompHarnessAdapter.scopedRel?.('m.ts', SESSION_SCOPE)).toBe(
      'agent/extensions/m.ts',
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

  /** The emitted module's factory, written to disk beside a `cratylus` on PATH
   *  that answers `<capability> --explain` with `explanation` under that
   *  capability's own name (`<name> <capability>`), and any other call with its
   *  argv as JSON (or, for a verb named `refuse`, a refusal on stderr). */
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
        `if (args.includes('--explain')) { const said = JSON.parse(require('node:fs').readFileSync(${JSON.stringify(said)}, 'utf8')); process.stdout.write(JSON.stringify({ ...said, name: \`\${said.name} \${args[0]}\` })); }`,
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
     *  order the adapter offers its capabilities. */
    const TOOLS = OMP_CAPABILITY_TOOLS.map(
      (capability) => `stand_in_${capability.toLowerCase()}`,
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

    it('offers the work package capability whole every turn, the concept journal as a device', async () => {
      expect(OMP_ESSENTIAL_CAPABILITIES).toEqual(['workPackage']);
      const tools = await load(EXPLANATION);
      expect(
        Object.fromEntries(
          OMP_CAPABILITY_TOOLS.map((capability, i) => [
            capability,
            tools[i]?.loadMode,
          ]),
        ),
      ).toEqual({ concepts: 'discoverable', workPackage: 'essential' });
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
        const all = TOOLS.map((n) => [n, ['look', 'put', 'refuse']]);
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
        cwd: '/the/session/cwd',
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
          description: 'Realizes a cut.',
          assignment: {
            type: 'object',
            properties: {
              cut: { type: 'string', description: 'The cut, by its name.' },
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
            required: ['cut', 'examples', 'decisions'],
          },
        },
        'Realize the cut.',
      );
    const LEAD_FORM = [
      '- lead: give its assignment in the task text as one fenced code block with info string `assignment` holding one JSON object:',
      '  ```assignment',
      '  {"cut": …, "examples": …, "decisions": …}',
      '  ```',
      '  - `cut` (string, required): The cut, by its name.',
      '  - `examples` (list of strings, at least 1, required): The visible examples, as <context>/<number>.',
      '  - `decisions` (list of strings, may be empty, required): The decisions in force.',
    ].join('\n');

    it('refuses an eval call whose code dispatches a delegate, for a launched agent or a typed delegate, and no other eval code', async () => {
      omp.agents = [CARTOGRAPHER(), LEAD()];
      const EVAL_DISPATCH_REFUSAL =
        'dispatch: dispatch a delegate with the task tool, where its assignment is checked.';
      /** Every `tool_call` handler of the module, in order, as omp's runner fires them. */
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
        const ctx = (kind: string, name?: string) => ({
          cwd: '/the/session/cwd',
          agent: { kind, name },
          model: { provider: 'fixture', id: 'base' },
          modelRegistry: { standIn: 'registry' },
          ui: { setStatus: () => {}, notify: () => {} },
        });
        const fire = async (
          event: string,
          payload: unknown,
          kind = 'main',
          name?: string,
        ) => {
          for (const handler of handlers.get(event) ?? []) {
            const result = (await handler(payload, ctx(kind, name))) as
              | { block?: boolean }
              | undefined;
            if (result?.block) return result;
          }
          return undefined;
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
        'const h = await agent({ agent: "lead", task: "Lead the cut." });',
        'pool = workpool([("lead", "Lead the cut.")])',
        'await tool.task({ tasks: [{ agent: "lead", task: "t" }] })',
        'await tool["task"]({"tasks": []})',
      ];
      const ordinary = [
        'print(read("design/journal/a.json"))',
        'await tool.read({ path: "design/a.md" })',
        'my_agent(1); x.agent(2); print(tool.tasks)',
      ];
      const refused = { block: true, reason: EVAL_DISPATCH_REFUSAL };
      const launched = await loaded('cartographer');
      for (const code of dispatching) {
        expect(await launched('tool_call', evalOf(code)), code).toEqual(
          refused,
        );
        // A delegate whose declaration carries a typed assignment is a cratylus agent too.
        expect(
          await launched('tool_call', evalOf(code), 'sub', 'lead'),
          code,
        ).toEqual(refused);
      }
      for (const code of ordinary) {
        expect(await launched('tool_call', evalOf(code)), code).toBeUndefined();
        expect(
          await launched('tool_call', evalOf(code), 'sub', 'lead'),
          code,
        ).toBeUndefined();
      }
      // A plain main session is no agent, nor are omp's own delegates or an untyped one: never refused.
      const plain = await loaded();
      for (const code of dispatching) {
        expect(await plain('tool_call', evalOf(code)), code).toBeUndefined();
        expect(
          await plain('tool_call', evalOf(code), 'sub', 'task'),
          code,
        ).toBeUndefined();
        expect(
          await plain('tool_call', evalOf(code), 'sub', 'cartographer'),
          code,
        ).toBeUndefined();
      }
      expect(
        await plain('tool_call', evalOf(dispatching[0]!), 'sub', 'lead'),
      ).toEqual(refused);
    });

    it('teaches the assignment form in the refusal of a misfit dispatch', async () => {
      omp.agents = [LEAD()];
      const plain = await started();
      await plain.fire('session_start');
      const refused = (await plain.fire('tool_call', 'main', {
        toolName: 'task',
        toolCallId: 'call',
        input: {
          context: 'A long prose brief.',
          tasks: [{ agent: 'lead', task: 'Realize the film cut, please.' }],
        },
      })) as { block: boolean; reason: string };
      expect(refused.block).toBe(true);
      expect(refused.reason).toBe(
        `lead assignment is missing: cut, examples, decisions\n${LEAD_FORM}`,
      );
    });

    it('lists the assignment form of each contracted agent a session may dispatch, launched or not, main or dispatched', async () => {
      omp.agents = [
        LEAD(),
        // omp's discovery parses `spawns` onto the declaration.
        {
          ...declare(
            { name: 'pilot', description: 'd', spawns: 'lead' },
            'Fly.',
          ),
          spawns: 'lead',
        },
      ];
      const forms = `# Assignment forms\n\nA dispatch of these agents is refused unless its task text carries the assignment so:\n\n${LEAD_FORM}`;
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
      // A session whose dispatch policy excludes the lead lists no form.
      omp.agents = [
        LEAD(),
        declare(
          { name: 'scout', description: 'd', spawns: 'cartographer' },
          'Look.',
        ),
      ];
      const scout = await started('scout');
      await scout.fire('session_start');
      const { systemPrompt } = (await scout.fire('before_agent_start')) as {
        systemPrompt: string[];
      };
      expect(systemPrompt.join('\n')).not.toContain('# Assignment forms');
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
        "Read each touched context's overview first, then the detail you need of its design and of its cuts.",
        'Your sources are the journal, the ledger and the example files the design names; the work itself — the project tree, source, tests — is not a source: never list, search or open it.',
        'Before any act (no dispatch, no journal append, no edit before it), tell the operator, in visible text rather than only in your thinking, the records as they stand now: the current design, each open decision named as open, and each cut in flight as the ledger records it, in your own communication style.',
        'Say nothing to the operator before the readback. Its bottom line is the state of the records; a decision you take now comes after it, as its own topic.',
        'Then do what the operator asked in the same turn, and settle what you hold, on sight. The readback is not a pause for leave.',
      ])
        expect(turns[0]).toContain(line);
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

    const ARCHITECT = () =>
      declare(
        { name: 'architect', description: 'Holds the design.' },
        '# architect\n\n### procedure\n\n- **reconstitution** — at every start, read back before acting\n\n### stance\n\n- **decisive** — decides',
      );

    /** The CRATYLUS module and a session module carrying `guards`, loaded into one
     *  stand-in omp started with `--agent <agent>` on a session whose branch holds
     *  `branch`. omp's flag values are the runtime's, but each extension reads only
     *  the flags it registered itself (`getFlag` on an unregistered name:
     *  undefined), as omp's runner does. */
    async function twoModules(
      agent: string,
      guards: Parameters<
        NonNullable<typeof ompHarnessAdapter.scopeActivatedSurface>
      >[2],
      branch: readonly unknown[] = [],
    ) {
      const [session] =
        ompHarnessAdapter.scopeActivatedSurface?.([], [], guards) ?? [];
      const dir = mkdtempSync(join(tmpdir(), 'omp-session-'));
      tmp.push(dir);
      const file = join(dir, OMP_SESSION_MODULE);
      writeFileSync(file, session?.content ?? '');
      // Dynamic: the module under test is the emitted bytes, written to disk here.
      const sessionModule = (await import(file)).default;
      const cratylusModule = await emitted({
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
          {
            name: 'overview',
            concept: 'c',
            purpose: 'p',
            when: 'w',
            effect: 'reads',
            parameters: [],
          },
        ],
      });
      const flagValues: Record<string, string> = { agent };
      const handlers = new Map<string, Handler[]>();
      const relayed: unknown[] = [];
      const extensionApi = () => {
        const registered = new Set<string>();
        return {
          typebox: { Type: { Unsafe: (schema: unknown) => schema } },
          registerTool: () => {},
          registerFlag: (name: string) => registered.add(name),
          getFlag: (name: string) =>
            registered.has(name) ? flagValues[name] : undefined,
          on: (event: string, handler: Handler) =>
            handlers.set(event, [...(handlers.get(event) ?? []), handler]),
          setModel: async () => {},
          setThinkingLevel: () => {},
          setActiveTools: async () => {},
          sendUserMessage: (message: unknown) => relayed.push(message),
        };
      };
      await cratylusModule(extensionApi());
      await sessionModule(extensionApi());
      const ctx = {
        cwd: '/the/session/cwd',
        agent: { kind: 'main' },
        model: { provider: 'fixture', id: 'base' },
        modelRegistry: {
          getApiKeyAndHeaders: async () => ({ ok: true, apiKey: 'fixture' }),
        },
        ui: { setStatus: () => {}, notify: () => {} },
        sessionManager: { getBranch: () => branch },
      };
      // omp's runner: the handlers in order, the first refusal ends the call.
      const fire = async (event: string, payload: unknown) => {
        let answer: unknown;
        for (const handler of handlers.get(event) ?? []) {
          const result = (await handler(payload, ctx)) as
            | { block?: boolean }
            | undefined;
          if (result !== undefined) answer = result;
          if (result?.block) break;
        }
        return answer;
      };
      await fire('session_start', {});
      judge.asked.length = 0;
      judge.answers = {};
      return { fire, relayed };
    }

    /** A guard on every tool call, composed into `agents`. */
    const surveyGuard = (agents: string[]) => ({
      guard: {
        id: 'survey',
        residue: '',
        substrate: 'harness' as const,
        events: ['tool.use.pre'] as ['tool.use.pre'],
        tell: 'surveying',
        judge: { prompt: 'Judge the call.', verdict: {}, refusesOn: 'surveys' },
        refusal: 'surveying:',
      },
      agents,
    });
    /** A guard at turn end only, which lends the judge and judges no tool call. */
    const replyGuard = {
      ...surveyGuard(['architect']),
      guard: {
        ...surveyGuard(['architect']).guard,
        events: ['turn.end'] as ['turn.end'],
      },
    };

    it('judges a guard for the agent the main session was launched as, though omp answers --agent only to the module that registered it', async () => {
      omp.agents = [CARTOGRAPHER()];
      const { fire, relayed } = await twoModules('cartographer', [
        surveyGuard(['cartographer']),
      ]);
      judge.verdict = JSON.stringify({
        surveys: true,
        reason: 'it reads src.',
      });
      const call = { toolName: 'read', input: { path: 'src/film.ts' } };
      expect(await fire('tool_call', call)).toEqual({
        block: true,
        reason: 'surveying: it reads src.',
      });
      expect(judge.asked).toHaveLength(1);
      expect(relayed).toEqual([]);
    });

    /** A tool-call guard whose judge reads the conversation, composed into `agents`. */
    const pastGuard = (agents: string[]) => ({
      guard: {
        ...surveyGuard(agents).guard,
        id: 'past',
        tell: 'procedure past objective',
        judge: {
          prompt: 'Judge the call in its conversation.',
          verdict: {},
          refusesOn: 'pastObjective',
          conversation: true,
        },
        refusal:
          'procedure past objective: your objective is met; report the outcome and stop.',
      },
      agents,
    });
    const message = (m: Record<string, unknown>) => ({
      type: 'message',
      message: m,
    });
    /** A continuing session: a request, its outcome reported, a closing request. */
    const exchanged = [
      message({ role: 'user', content: 'Before compaction, forgotten.' }),
      { type: 'compaction', summary: 'Earlier work.' },
      message({
        role: 'user',
        content: [{ type: 'text', text: 'Separate approval from release.' }],
      }),
      message({
        role: 'assistant',
        content: [
          { type: 'thinking', thinking: 'Private reasoning.' },
          { type: 'text', text: 'I dispatched the lead.' },
          { type: 'toolCall', name: 'task', arguments: { agent: 'lead' } },
        ],
      }),
      message({
        role: 'toolResult',
        toolName: 'task',
        isError: true,
        content: [{ type: 'text', text: 'lead dispatch refused.' }],
      }),
      message({
        role: 'toolResult',
        toolName: 'task',
        content: [
          { type: 'text', text: 'Outcome achieved; both assayers accept.' },
        ],
      }),
      message({
        role: 'toolResult',
        toolName: 'read',
        content: [{ type: 'text', text: 'file bytes' }],
      }),
      message({
        role: 'user',
        attribution: 'agent',
        content: 'descend guard — the judge gave no verdict.',
      }),
      // A reply refused at its stop never reached the operator: the judge never reads it.
      message({
        role: 'assistant',
        content: [
          { type: 'text', text: 'Night shoots are the operator’s call.' },
        ],
      }),
      {
        type: 'custom_message',
        customType: 'session-stop-continuation',
        content: 'hand-back: this reply hands back a decision you own.',
      },
      message({ role: 'user', content: 'Close the design work.' }),
    ];
    /** The text the judge was asked about: the one user message of its input. */
    const payload = (asked: unknown): string => {
      const messages =
        asked !== null &&
        typeof asked === 'object' &&
        'messages' in asked &&
        Array.isArray(asked.messages)
          ? asked.messages
          : [];
      const first: unknown = messages[0];
      return first !== null &&
        typeof first === 'object' &&
        'content' in first &&
        typeof first.content === 'string'
        ? first.content
        : '';
    };
    const closing = {
      toolName: 'bash',
      input: { command: 'cat design/journal/*.json' },
    };

    it('gives a guard whose judge reads the conversation the visible exchange so far, then the call, and refuses on its verdict', async () => {
      omp.agents = [ARCHITECT()];
      const { fire, relayed } = await twoModules(
        'architect',
        [pastGuard(['architect'])],
        exchanged,
      );
      judge.verdict = JSON.stringify({
        pastObjective: true,
        reason:
          'The lead reported the outcome achieved; the call reads the design again.',
      });
      expect(await fire('tool_call', closing)).toEqual({
        block: true,
        reason:
          'procedure past objective: your objective is met; report the outcome and stop. The lead reported the outcome achieved; the call reads the design again.',
      });
      expect(judge.asked).toHaveLength(1);
      expect(payload(judge.asked[0])).toBe(
        [
          'Conversation so far:',
          'Operator:\nSeparate approval from release.',
          '',
          'Agent:\nI dispatched the lead.',
          '',
          'Delegate report:\nOutcome achieved; both assayers accept.',
          '',
          'Operator:\nClose the design work.',
          '',
          'Act:',
          JSON.stringify({ tool: closing.toolName, input: closing.input }),
          '',
          'Answer with exactly one JSON object and nothing else: {"pastObjective": <true or false>, "reason": "<one sentence>"}',
        ].join('\n'),
      );
      expect(relayed).toEqual([]);
    });

    it('allows the call when its conversation-reading judge finds the objective not met', async () => {
      omp.agents = [ARCHITECT()];
      const { fire } = await twoModules(
        'architect',
        [pastGuard(['architect'])],
        exchanged,
      );
      judge.verdict = JSON.stringify({
        pastObjective: false,
        reason: 'The request is not met yet.',
      });
      expect(await fire('tool_call', closing)).toBeUndefined();
      expect(judge.asked).toHaveLength(1);
    });

    it('fails open, aloud, when the conversation-reading judge gives no verdict', async () => {
      omp.agents = [ARCHITECT()];
      const { fire, relayed } = await twoModules(
        'architect',
        [pastGuard(['architect'])],
        exchanged,
      );
      judge.verdict = 'The objective seems met.';
      expect(await fire('tool_call', closing)).toBeUndefined();
      expect(relayed).toEqual([
        'past guard — the judge gave no verdict (it answered: The objective seems met.), so this act was NOT judged.',
      ]);
    });

    it("reads a guard's verdict from the last JSON object carrying its field, whatever prose or fence surrounds it", async () => {
      omp.agents = [ARCHITECT()];
      const { fire, relayed } = await twoModules('architect', [
        surveyGuard(['architect']),
      ]);
      const call = { toolName: 'read', input: { path: 'src/film.ts' } };
      for (const answer of [
        'The call reads source.\n{"surveys": true, "reason": "it reads src."}',
        '```json\n{"surveys": true, "reason": "it reads src."}\n```',
        'Draft: {"surveys": false, "reason": "draft"}. Final, with {"note": {"x": 1}} beside it:\n```\n{"surveys": true, "reason": "it reads src.", "detail": {"path": "src/film.ts"}}\n```\nDone.',
        '{"surveys": true, "reason": "it reads src."} {"other": "no verdict field"}',
      ]) {
        judge.verdict = answer;
        expect(await fire('tool_call', call), answer).toEqual({
          block: true,
          reason: 'surveying: it reads src.',
        });
      }
      expect(relayed).toEqual([]);
      for (const answer of [
        'The objective is not met, so the call is allowed.',
        '{"reason": "no verdict field"}',
        '{"surveys": "yes", "reason": "not a boolean"}',
        '{"surveys": true, "reason": "never closed"',
      ]) {
        judge.verdict = answer;
        expect(await fire('tool_call', call), answer).toBeUndefined();
      }
      expect(relayed).toHaveLength(4);
    });

    /** A turn-end guard whose judge reads the decisions recorded this turn, composed into `agents`. */
    const recordGuard = (agents: string[]) => ({
      guard: {
        ...surveyGuard(agents).guard,
        id: 'unrecorded',
        events: ['turn.end'] as ['turn.end'],
        tell: 'holding open',
        judge: {
          prompt: 'Judge the reply against what was recorded.',
          verdict: {},
          refusesOn: 'unrecorded',
          recorded: true,
        },
        refusal:
          'holding open: a decision is taken when it is recorded. Record it, then report it.',
      },
      agents,
    });
    /** One call of the stand-in journal (`concept journal <capability>`), and its result. */
    const journalCall = (
      id: string,
      call: { name: string; arguments: Record<string, unknown> },
      isError = false,
    ) => [
      message({
        role: 'assistant',
        content: [{ type: 'toolCall', id, ...call }],
      }),
      message({
        role: 'toolResult',
        toolCallId: id,
        toolName: call.name,
        isError,
        content: [{ type: 'text', text: isError ? 'refused' : 'appended' }],
      }),
    ];
    const JOURNAL = 'concept_journal_concepts';
    /** A session whose current turn recorded two decisions, one each way of calling the journal. */
    const recordedTurn = [
      message({ role: 'user', content: 'Settle night shoots.' }),
      ...journalCall('earlier', {
        name: JOURNAL,
        arguments: { verb: 'define', name: 'earlier turn' },
      }),
      message({ role: 'user', content: 'Now settle approval.' }),
      message({
        role: 'user',
        attribution: 'agent',
        content: 'a guard notice, never the operator',
      }),
      ...journalCall('tool', {
        name: JOURNAL,
        arguments: { verb: 'define', name: 'approval', reason: 'distinct' },
      }),
      ...journalCall('device', {
        name: 'write',
        arguments: {
          path: `xd://${JOURNAL}`,
          content: JSON.stringify({ verb: 'define', name: 'release' }),
        },
      }),
      ...journalCall(
        'refused',
        { name: JOURNAL, arguments: { verb: 'define', name: 'refused' } },
        true,
      ),
      ...journalCall('read', {
        name: JOURNAL,
        arguments: { verb: 'overview' },
      }),
      ...journalCall('file', {
        name: 'write',
        arguments: { path: 'notes.md', content: 'x' },
      }),
    ];
    const settled = {
      last_assistant_message: 'Approval is settled: it is not release.',
      stop_hook_active: false,
    };

    it("gives a guard whose judge reads the decisions recorded this turn each journal append that took effect since the operator's last message, and refuses the stop on its verdict", async () => {
      omp.agents = [ARCHITECT()];
      const { fire, relayed } = await twoModules(
        'architect',
        [recordGuard(['architect']), replyGuard],
        recordedTurn,
      );
      judge.verdict = JSON.stringify({
        unrecorded: true,
        surveys: true,
        reason: 'Release is reported settled and is not recorded.',
      });
      expect(await fire('session_stop', settled)).toEqual({
        decision: 'block',
        reason:
          'holding open: a decision is taken when it is recorded. Record it, then report it. Release is reported settled and is not recorded.\n\nsurveying: Release is reported settled and is not recorded.',
      });
      expect(judge.asked.map(payload)).toEqual([
        [
          'Decisions recorded this turn:',
          'define {"name":"approval","reason":"distinct"}',
          'define {"name":"release"}',
          '',
          'Reply:\nApproval is settled: it is not release.',
        ].join('\n'),
        'Reply:\nApproval is settled: it is not release.',
      ]);
      expect(relayed).toEqual([]);
      // It counts toward the turn's stop allowance with the other turn-end guards.
      expect(
        await fire('session_stop', { ...settled, stop_hook_active: true }),
      ).toMatchObject({ decision: 'block' });
      expect(
        await fire('session_stop', { ...settled, stop_hook_active: true }),
      ).toBeUndefined();
      expect(relayed).toHaveLength(2);
    });

    it('tells the judge none was recorded this turn, and allows the stop when it finds nothing held open', async () => {
      omp.agents = [ARCHITECT()];
      const { fire } = await twoModules(
        'architect',
        [recordGuard(['architect'])],
        [
          ...recordedTurn,
          message({ role: 'user', content: 'And scheduling?' }),
        ],
      );
      judge.verdict = JSON.stringify({
        unrecorded: false,
        reason: 'It keeps the question open.',
      });
      expect(await fire('session_stop', settled)).toBeUndefined();
      expect(judge.asked.map(payload)).toEqual([
        'Decisions recorded this turn:\n(none)\n\nReply:\nApproval is settled: it is not release.',
      ]);
    });

    it('fails open, aloud, when the decisions recorded this turn cannot be read or the judge gives no verdict', async () => {
      omp.agents = [ARCHITECT()];
      const { fire, relayed } = await twoModules(
        'architect',
        [recordGuard(['architect'])],
        recordedTurn,
      );
      judge.verdict = 'It reports a settled question.';
      expect(await fire('session_stop', settled)).toBeUndefined();
      const reader = Symbol.for('cratylus.recorded-this-turn');
      const globals: Record<symbol, unknown> = globalThis;
      const lent = globals[reader];
      delete globals[reader];
      try {
        expect(
          await fire('session_stop', { ...settled, stop_hook_active: true }),
        ).toBeUndefined();
      } finally {
        globals[reader] = lent;
      }
      expect(relayed).toEqual([
        'unrecorded guard — the judge gave no verdict (it answered: It reports a settled question.), so this act was NOT judged.',
        'unrecorded guard — the decisions recorded this turn could not be read, so this act was NOT judged.',
      ]);
      expect(judge.asked).toHaveLength(1);
    });

    /** A judgment the guards below read, made at turn end only. */
    const heldJudgment = {
      id: 'owned-question',
      events: ['turn.end'] as ['turn.end'],
      prompt: 'Judge what each owned question needs.',
      verdict: {},
      carries: 'questions',
      conversation: true,
    };
    type GuardEvent = 'turn.end' | 'tool.use.pre';
    /** A guard on `events`, refusing on `field`, whose judge reads `heldJudgment`. */
    const readingGuard = (
      id: string,
      field: string,
      events: readonly [GuardEvent, ...GuardEvent[]],
    ) => ({
      guard: {
        ...surveyGuard(['architect']).guard,
        id,
        events,
        tell: id,
        judge: {
          prompt: `Judge for ${id}.`,
          verdict: {},
          refusesOn: field,
          reads: heldJudgment,
        },
        refusal: `${id}:`,
      },
      agents: ['architect'],
    });
    const readers = () => [
      readingGuard('hand-back', 'handsBack', ['turn.end']),
      readingGuard('bottom-line', 'buries', ['turn.end', 'tool.use.pre']),
      replyGuard,
    ];
    /** The system prompt the judge was asked with. */
    const promptOf = (asked: unknown): string => {
      const prompts =
        asked !== null && typeof asked === 'object' && 'systemPrompt' in asked
          ? asked.systemPrompt
          : undefined;
      const prompt: unknown = Array.isArray(prompts) ? prompts[0] : undefined;
      return typeof prompt === 'string' ? prompt : '';
    };
    /** What the judge was asked under `prompt`, each time it was. */
    const askedUnder = (prompt: string): string[] =>
      judge.asked.filter((a) => promptOf(a) === prompt).map(payload);
    const handedBack = {
      last_assistant_message: 'Is approval release? You choose.',
      stop_hook_active: false,
    };
    const handedBackAct = 'Reply:\nIs approval release? You choose.';

    it('makes a shared judgment once per act and gives that one answer to every guard reading it, and none to a guard that does not', async () => {
      omp.agents = [ARCHITECT()];
      const { fire, relayed } = await twoModules(
        'architect',
        readers(),
        exchanged,
      );
      const held = {
        questions: [
          {
            question: 'Is approval release?',
            holds: true,
            reason: 'The design separates them.',
          },
        ],
      };
      judge.answers = {
        [heldJudgment.prompt]: `Judged:\n${JSON.stringify(held)}`,
        'Judge for hand-back.': JSON.stringify({
          handsBack: true,
          reason: 'It asks the operator what it holds.',
        }),
        'Judge for bottom-line.': JSON.stringify({
          buries: false,
          reason: 'In shape.',
        }),
      };
      judge.verdict = JSON.stringify({ surveys: false, reason: 'in shape.' });
      expect(await fire('session_stop', handedBack)).toEqual({
        decision: 'block',
        reason: 'hand-back: It asks the operator what it holds.',
      });
      expect(relayed).toEqual([]);
      expect(judge.asked).toHaveLength(4);
      // The judgment, once, by its own prompt, over the conversation and the reply.
      expect(askedUnder(heldJudgment.prompt)).toEqual([
        [
          'Conversation so far:',
          'Operator:\nSeparate approval from release.',
          '',
          'Agent:\nI dispatched the lead.',
          '',
          'Delegate report:\nOutcome achieved; both assayers accept.',
          '',
          'Operator:\nClose the design work.',
          '',
          `Act:\n${handedBackAct}`,
          '',
          'Answer with exactly one JSON object and nothing else, carrying "questions" as your instructions give it.',
        ].join('\n'),
      ]);
      // Each guard reading it is given that one answer ahead of the act, and judges by its own prompt.
      const given = `Judgment owned-question, made once for this act:\n${JSON.stringify(held)}`;
      for (const id of ['hand-back', 'bottom-line'])
        expect(askedUnder(`Judge for ${id}.`), id).toEqual([
          `${given}\n\n${handedBackAct}`,
        ]);
      expect(askedUnder('Judge the call.')).toEqual([handedBackAct]);
      // A tool call is no act it is made for: its reader on the call is given nothing.
      judge.asked.length = 0;
      judge.answers['Judge for bottom-line.'] = JSON.stringify({
        buries: false,
        reason: 'A first action.',
      });
      expect(await fire('tool_call', closing)).toBeUndefined();
      expect(judge.asked.map(promptOf)).toEqual(['Judge for bottom-line.']);
      expect(payload(judge.asked[0])).toBe(
        JSON.stringify({ tool: closing.toolName, input: closing.input }),
      );
    });

    it('fails open, aloud, when a shared judgment cannot be made: its readers are told none was made and still judge the act', async () => {
      omp.agents = [ARCHITECT()];
      const { fire, relayed } = await twoModules(
        'architect',
        readers(),
        exchanged,
      );
      judge.answers = {
        [heldJudgment.prompt]: 'It seems held.',
        'Judge for hand-back.': JSON.stringify({
          handsBack: false,
          reason: 'Nothing is handed back on a judgment never made.',
        }),
        'Judge for bottom-line.': JSON.stringify({
          buries: true,
          reason: 'Its conclusion comes last.',
        }),
      };
      judge.verdict = JSON.stringify({ surveys: false, reason: 'in shape.' });
      expect(await fire('session_stop', handedBack)).toEqual({
        decision: 'block',
        reason: 'bottom-line: Its conclusion comes last.',
      });
      expect(relayed).toEqual([
        'owned-question judgment — the judge gave no judgment (it answered: It seems held.), so it was NOT made for this act, and the guards reading it refused nothing on it.',
      ]);
      expect(askedUnder(heldJudgment.prompt)).toHaveLength(1);
      for (const id of ['hand-back', 'bottom-line'])
        expect(askedUnder(`Judge for ${id}.`), id).toEqual([
          `Judgment owned-question: none could be made for this act.\n\n${handedBackAct}`,
        ]);
    });

    it('makes no shared judgment where no guard reading it is in force', async () => {
      omp.agents = [ARCHITECT(), CARTOGRAPHER()];
      const { fire } = await twoModules('cartographer', readers());
      judge.verdict = JSON.stringify({ handsBack: true, reason: 'never.' });
      expect(await fire('session_stop', handedBack)).toBeUndefined();
      expect(judge.asked).toEqual([]);
    });

    it('gives a guard whose judge reads the call alone no conversation, and judges no other agent', async () => {
      omp.agents = [ARCHITECT(), CARTOGRAPHER()];
      const architect = await twoModules(
        'architect',
        [surveyGuard(['architect'])],
        exchanged,
      );
      judge.verdict = JSON.stringify({ surveys: false, reason: 'in place.' });
      await architect.fire('tool_call', closing);
      expect(payload(judge.asked[0])).toBe(
        JSON.stringify({ tool: closing.toolName, input: closing.input }),
      );
      const other = await twoModules(
        'cartographer',
        [pastGuard(['architect'])],
        exchanged,
      );
      judge.verdict = JSON.stringify({ pastObjective: true, reason: 'met.' });
      expect(await other.fire('tool_call', closing)).toBeUndefined();
      expect(judge.asked).toEqual([]);
    });

    it('judges every guard on one stop and refuses it twice in a turn, each time with each reason', async () => {
      omp.agents = [ARCHITECT()];
      const second = {
        ...replyGuard,
        guard: {
          ...replyGuard.guard,
          id: 'shape',
          tell: 'misshapen',
          judge: { ...replyGuard.guard.judge, refusesOn: 'misshapen' },
          refusal: 'misshapen:',
        },
      };
      // A continuing session, which owes no readback: each refusal is the guards' alone.
      const { fire, relayed } = await twoModules(
        'architect',
        [replyGuard, second],
        [{ type: 'message', message: { role: 'user', content: 'Go on.' } }],
      );
      judge.verdict = JSON.stringify({
        surveys: true,
        misshapen: true,
        reason: 'it buries the outcome.',
      });
      const stop = (active: boolean) => ({
        last_assistant_message:
          'Decision 0091 is recorded; entry 7 is a placeholder.',
        stop_hook_active: active,
      });
      const refused = {
        decision: 'block',
        reason:
          'surveying: it buries the outcome.\n\nmisshapen: it buries the outcome.',
      };
      expect(await fire('session_stop', stop(false))).toEqual(refused);
      expect(judge.asked).toHaveLength(2);
      // The rewrite the refusal forced is judged and refused again, in the same shape.
      expect(await fire('session_stop', stop(true))).toEqual(refused);
      expect(relayed).toEqual([]);
      // The third stop of the turn is refused no more: each reason is relayed.
      expect(await fire('session_stop', stop(true))).toBeUndefined();
      expect(relayed).toEqual([
        'surveying: it buries the outcome.',
        'misshapen: it buries the outcome.',
      ]);
      // A new turn's first stop (omp's `stop_hook_active` false again) starts the count over.
      expect(await fire('session_stop', stop(false))).toEqual(refused);
      expect(await fire('session_stop', stop(true))).toEqual(refused);
      expect(await fire('session_stop', stop(true))).toBeUndefined();
    });

    it('starts the count over when a turn ends with its stop let through', async () => {
      omp.agents = [ARCHITECT()];
      const { fire } = await twoModules('architect', [replyGuard]);
      const stop = (active: boolean) => ({
        last_assistant_message: 'Night shoots are settled.',
        stop_hook_active: active,
      });
      judge.verdict = JSON.stringify({ surveys: true, reason: 'buried.' });
      expect(await fire('session_stop', stop(false))).toMatchObject({
        decision: 'block',
      });
      judge.verdict = JSON.stringify({ surveys: false, reason: 'in shape.' });
      expect(await fire('session_stop', stop(true))).toBeUndefined();
      judge.verdict = JSON.stringify({ surveys: true, reason: 'buried.' });
      expect(await fire('session_stop', stop(false))).toMatchObject({
        decision: 'block',
      });
      expect(await fire('session_stop', stop(true))).toMatchObject({
        decision: 'block',
      });
    });

    const READBACK_REFUSAL =
      'reconstitution: give the operator the readback (current design, open decisions, cuts in flight) in visible text before this act, then make this call again in the same turn.';
    const READBACK_UNSEEN_REFUSAL =
      'reconstitution: give the operator the readback (current design, open decisions, cuts in flight) as the text of your reply. The operator has seen no text from you yet, and your thinking is not visible to the operator. Write the readback as reply text, then make this call again in the same turn.';
    const reply = (text: string) => ({
      message: {
        role: 'assistant',
        content: [
          { type: 'thinking', thinking: 'The design is…' },
          { type: 'text', text },
        ],
      },
    });
    // The stand-in explains each capability as `concept journal <capability>`.
    const changing = [
      { toolName: 'task', input: { tasks: [{ agent: 'scout' }] } },
      { toolName: 'write', input: { path: 'notes.md', content: 'x' } },
      { toolName: 'edit', input: { path: 'design/a.md' } },
      { toolName: 'concept_journal_concepts', input: { verb: 'define' } },
      {
        toolName: 'write',
        input: {
          path: 'xd://concept_journal_concepts',
          content: JSON.stringify({ verb: 'define' }),
        },
      },
    ];
    const reading = [
      { toolName: 'read', input: { path: 'design/journal' } },
      { toolName: 'concept_journal_concepts', input: { verb: 'overview' } },
      {
        toolName: 'write',
        input: {
          path: 'xd://concept_journal_concepts',
          content: JSON.stringify({ verb: 'overview' }),
        },
      },
    ];

    it('refuses each act of a reconstituting launch that changes something before any readback, and never a read', async () => {
      omp.agents = [ARCHITECT()];
      const { fire } = await twoModules('architect', [replyGuard]);
      for (const call of changing)
        expect(await fire('tool_call', call), call.toolName).toEqual({
          block: true,
          reason: READBACK_UNSEEN_REFUSAL,
        });
      for (const call of reading)
        expect(await fire('tool_call', call), call.toolName).toBeUndefined();
      expect(judge.asked, 'nothing visible yet: no judge asked').toEqual([]);
    });

    it('tells a launch whose readback is only in its thinking that the operator has seen no text yet', async () => {
      omp.agents = [ARCHITECT()];
      const { fire } = await twoModules('architect', [replyGuard]);
      await fire('message_end', reply(''));
      expect(await fire('tool_call', changing[0])).toEqual({
        block: true,
        reason: READBACK_UNSEEN_REFUSAL,
      });
      expect(judge.asked, 'nothing visible: no judge asked').toEqual([]);
    });

    it('refuses an act after visible text the judge finds no readback in, naming why', async () => {
      omp.agents = [ARCHITECT()];
      const { fire } = await twoModules('architect', [replyGuard]);
      await fire('message_end', reply('Reconstitution comes first.'));
      judge.verdict = JSON.stringify({
        given: false,
        reason: 'It promises a readback and gives none.',
      });
      expect(await fire('tool_call', changing[0])).toEqual({
        block: true,
        reason: `${READBACK_REFUSAL} It promises a readback and gives none.`,
      });
      expect(judge.asked).toHaveLength(1);
      expect(JSON.stringify(judge.asked[0])).toContain(
        'Reconstitution comes first.',
      );
      expect(JSON.stringify(judge.asked[0])).not.toContain('The design is…');
    });

    it('allows every act once a judge finds the readback, asking once', async () => {
      omp.agents = [ARCHITECT()];
      const { fire } = await twoModules('architect', [replyGuard]);
      await fire(
        'message_end',
        reply(
          'Film: approval is settled; one open decision; no cut in flight.',
        ),
      );
      judge.verdict = JSON.stringify({ given: true, reason: 'All three.' });
      for (const call of changing.slice(1))
        expect(await fire('tool_call', call), call.toolName).toBeUndefined();
      expect(judge.asked).toHaveLength(1);
    });

    it('counts no readback from a reply a turn-end guard refused at its stop', async () => {
      omp.agents = [ARCHITECT()];
      const { fire } = await twoModules('architect', [replyGuard]);
      const readback =
        'Film: approval is settled; night shoots are open; no cut in flight.';
      await fire('message_end', reply(readback));
      judge.verdict = JSON.stringify({
        surveys: true,
        given: true,
        reason: 'It opens with mechanics.',
      });
      expect(
        await fire('session_stop', {
          last_assistant_message: readback,
          stop_hook_active: false,
        }),
      ).toMatchObject({ decision: 'block' });
      judge.asked.length = 0;
      expect(await fire('tool_call', changing[1])).toEqual({
        block: true,
        reason: READBACK_UNSEEN_REFUSAL,
      });
      expect(judge.asked, 'nothing reached the operator').toEqual([]);
    });

    it('adds to a refused stop that the readback is still owed and goes first, only while it is owed', async () => {
      omp.agents = [ARCHITECT()];
      const OWED =
        'reconstitution: your readback (current design, open decisions, cuts in flight) is still owed; give it first.';
      const readback =
        'Film: approval is settled; night shoots are open; no cut in flight. Decision 0091 is recorded.';
      const stop = {
        last_assistant_message: readback,
        stop_hook_active: false,
      };
      // Owed: the refusal carries every guard's reason, then the line.
      const owing = await twoModules('architect', [replyGuard]);
      await owing.fire('message_end', reply(readback));
      judge.verdict = JSON.stringify({ surveys: true, reason: 'buried.' });
      expect(await owing.fire('session_stop', stop)).toEqual({
        decision: 'block',
        reason: `surveying: buried.\n\n${OWED}`,
      });
      // A session continuing a conversation owes none: the refusal is the guard's alone.
      const continuing = await twoModules(
        'architect',
        [replyGuard],
        [{ type: 'message', message: { role: 'user', content: 'Go on.' } }],
      );
      expect(await continuing.fire('session_stop', stop)).toEqual({
        decision: 'block',
        reason: 'surveying: buried.',
      });
      // Once the readback is counted, none is owed any more.
      const counted = await twoModules('architect', [replyGuard]);
      await counted.fire('message_end', reply(readback));
      judge.verdict = JSON.stringify({ given: true, reason: 'All three.' });
      expect(await counted.fire('tool_call', changing[1])).toBeUndefined();
      judge.verdict = JSON.stringify({ surveys: true, reason: 'buried.' });
      expect(await counted.fire('session_stop', stop)).toEqual({
        decision: 'block',
        reason: 'surveying: buried.',
      });
    });

    it('counts a readback given in the same message as the act, before that message ends', async () => {
      omp.agents = [ARCHITECT()];
      const { fire } = await twoModules('architect', [replyGuard]);
      const readback =
        'Film: approval is settled; night shoots are open; no cut in flight.';
      // omp finalizes the message before it dispatches its calls; `message_end` comes later.
      await fire('assistant_message', reply(readback));
      judge.verdict = JSON.stringify({ given: true, reason: 'All three.' });
      expect(await fire('tool_call', changing[3])).toBeUndefined();
      expect(await fire('tool_call', changing[4])).toBeUndefined();
      expect(judge.asked).toHaveLength(1);
      expect(JSON.stringify(judge.asked[0])).toContain('night shoots are open');
    });

    it('still counts no in-progress reply a turn-end guard withdrew', async () => {
      omp.agents = [ARCHITECT()];
      const { fire } = await twoModules('architect', [replyGuard]);
      const readback =
        'Film: approval is settled; night shoots are open; no cut in flight.';
      await fire('assistant_message', reply(readback));
      judge.verdict = JSON.stringify({
        surveys: true,
        reason: 'It opens with mechanics.',
      });
      await fire('session_stop', {
        last_assistant_message: readback,
        stop_hook_active: false,
      });
      judge.asked.length = 0;
      expect(await fire('tool_call', changing[1])).toEqual({
        block: true,
        reason: READBACK_UNSEEN_REFUSAL,
      });
    });

    it('lets the act through aloud when the judge gives no verdict', async () => {
      omp.agents = [ARCHITECT()];
      const { fire, relayed } = await twoModules('architect', [replyGuard]);
      await fire('message_end', reply('The design is as follows.'));
      judge.verdict = 'not json';
      expect(await fire('tool_call', changing[1])).toBeUndefined();
      expect(relayed).toEqual([
        'reconstitution — the judge gave no verdict on the readback, so this act was NOT judged.',
      ]);
    });

    it('holds nothing for a launch whose procedure has no reconstitution', async () => {
      omp.agents = [CARTOGRAPHER()];
      const { fire } = await twoModules('cartographer', [replyGuard]);
      expect(await fire('tool_call', changing[1])).toBeUndefined();
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

    it('reconstitutes a new session: the note on its first turn, its acts held', async () => {
      omp.agents = [ARCHITECT()];
      const { fire } = await twoModules('architect', [replyGuard]);
      expect(await note(fire)).toContain('# Session start: reconstitution');
      expect(await fire('tool_call', changing[1])).toEqual({
        block: true,
        reason: READBACK_UNSEEN_REFUSAL,
      });
    });

    it('reconstitutes nothing in a resumed session continuing a conversation', async () => {
      omp.agents = [ARCHITECT()];
      const { fire } = await twoModules(
        'architect',
        [replyGuard],
        conversation,
      );
      expect(await note(fire)).not.toContain('# Session start');
      for (const call of changing)
        expect(await fire('tool_call', call), call.toolName).toBeUndefined();
      expect(judge.asked).toEqual([]);
    });

    it('reconstitutes a resumed session compacted since it last spoke', async () => {
      omp.agents = [ARCHITECT()];
      const { fire } = await twoModules(
        'architect',
        [replyGuard],
        [
          ...conversation,
          { type: 'compaction', summary: 'The cut was approved.' },
        ],
      );
      expect(await note(fire)).toContain('# Session start: reconstitution');
      expect((await fire('tool_call', changing[1])) as object).toMatchObject({
        block: true,
      });
    });

    it('reconstitutes again once the session is compacted', async () => {
      omp.agents = [ARCHITECT()];
      const { fire } = await twoModules(
        'architect',
        [replyGuard],
        conversation,
      );
      expect(await note(fire)).not.toContain('# Session start');
      await fire('session_compact', {
        compactionEntry: { type: 'compaction' },
      });
      expect(await note(fire)).toContain('# Session start: reconstitution');
      expect(await fire('tool_call', changing[1])).toEqual({
        block: true,
        reason: READBACK_UNSEEN_REFUSAL,
      });
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
      // As dispatch passes `spawns` to a child: `*` anyone, absent as omp's discovery reads
      // it (`*` with `task` among the tools, else no one). An explicitly empty `spawns` in
      // the file is no one, though omp's discovery reads it as absent and so as `*`.
      const none =
        "Cannot spawn 'pilot'. Allowed: none (spawns disabled for this agent)";
      const declared = (
        said: Record<string, unknown>,
        discovered: unknown,
      ) => ({
        ...WHOLE(),
        ...declare(
          {
            name: 'cartographer',
            description: 'Charts the estuary.',
            model: 'fixture/declared',
            ...said,
          },
          'Map the estuary before drawing its shipping routes.',
        ),
        spawns: discovered,
      });
      const withTask = ['read', 'task'];
      for (const [label, agent, refusal] of [
        [
          'empty list with task',
          declared({ tools: withTask, spawns: [] }, '*'),
          none,
        ],
        [
          'blank string with task',
          declared({ tools: withTask, spawns: ' ' }, '*'),
          none,
        ],
        ['absent without task', declared({ tools: ['read'] }, undefined), none],
        ['absent with task', declared({ tools: withTask }, '*'), undefined],
        ['*', declared({ tools: withTask, spawns: '*' }, '*'), undefined],
        [
          'bundled, as discovered',
          {
            ...WHOLE(),
            filePath: 'embedded:cartographer.md',
            source: 'bundled',
            spawns: '*',
          },
          undefined,
        ],
      ] as const) {
        omp.agents = [agent];
        const launched = await started('cartographer');
        await launched.fire('session_start');
        expect(
          await launched.fire(
            'before_subagent_spawn',
            undefined,
            spawning('pilot'),
          ),
          label,
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
