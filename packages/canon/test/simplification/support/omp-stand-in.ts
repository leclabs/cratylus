// The projected omp extension modules, loaded in process into a stand-in omp.
//
// No omp runs and no model is asked. Each `@oh-my-pi/*` import of a projected module
// is rewritten to a stand-in module exporting whatever names it imports, answering
// from a registry set here: agent discovery from the projected declarations, a
// front-matter reader, settings handles, a spawn policy read as omp reads one, and a
// judge (`completeSimple`) that answers every verdict field it is asked for with one
// polarity and counts each time it is asked. The installed command the modules reach
// is a stand-in on PATH answering its version, each capability's explanation and the
// answers a session is given, and `{}` to anything else.
//
// What the session is shown is recorded: every `ui` call, every message sent, entry
// appended, line written to stderr and exit attempted.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CLI_BIN } from '@cratylus/runtime/bin-name';
import { vi } from 'vitest';
import { CLI_VERSION, scratchDir } from './cli.js';
import {
  type Projection,
  extensionModules,
  frontMatterOf,
} from './projection.js';

const REGISTRY = 'cratylusSimplificationOmpStandIn';

/** One thing a session was shown, by the call that showed it. */
export interface Shown {
  readonly kind: string;
  readonly level?: string;
  readonly text: string;
}

/** What firing one event did. */
export interface Outcome {
  /** The reason, when a handler refused the act. */
  readonly blocked?: string;
  /** Whether a handler consumed the input, so the agent never reads it. */
  readonly handled: boolean;
  /** A handler's error, or an exit it attempted. */
  readonly threw?: string;
  /** What the session was shown while the event ran. */
  readonly shown: readonly Shown[];
  /** The event's system prompt after every handler, for a turn start. */
  readonly systemPrompt?: readonly string[];
}

export interface StandIn {
  /** Fire `event` as the session `at` (the main session by default). */
  fire(
    event: string,
    payload: Record<string, unknown>,
    at?: { kind: 'main' | 'sub'; name?: string },
  ): Promise<Outcome>;
  /** Everything the session was shown, in order. */
  readonly shown: Shown[];
  /** How many times a model was asked for a verdict. */
  judged(): number;
  close(): void;
}

export interface Start {
  /** The `--agent` the main session was started with. */
  readonly agent?: string;
  /** Prompts given on the command line. */
  readonly cliPrompts?: readonly string[];
  /** The value the judge gives every verdict field it is asked for; `'none'`, an
   *  answer carrying no verdict. */
  readonly verdict?: boolean | 'none';
  /** The installed command's answers, by `<capability> <verb>`. */
  readonly answers?: Readonly<Record<string, unknown>>;
  readonly cwd?: string;
}

const text = (value: unknown): string =>
  typeof value === 'string' ? value : (JSON.stringify(value) ?? String(value));

/** A setting handle as omp's registry gives one. */
const handle = (id: string) => ({
  segments: id.split('.'),
  get: () => undefined,
  override: () => {},
  clearOverride: () => {},
});

/** Every field a judge prompt asks a verdict on: `"<field>": <true or false>`. */
function verdictFields(input: unknown): string[] {
  const asked = JSON.stringify(input) ?? '';
  const fields = new Set<string>();
  for (const m of asked.matchAll(
    /\\?"([A-Za-z_][\w-]*)\\?"\s*:\s*<?\s*(?:true|false|boolean)/g,
  ))
    if (m[1] !== undefined && m[1] !== 'reason') fields.add(m[1]);
  return fields.size > 0
    ? [...fields]
    : ['refuse', 'refused', 'drift', 'given', 'met', 'value'];
}

/** The projected module with each `@oh-my-pi/*` import taken from `standIn`, and the
 *  names it imports. */
function rewritten(
  source: string,
  standIn: string,
): { text: string; names: string[] } {
  const names: string[] = [];
  const from = JSON.stringify(standIn);
  let out = source.replace(
    /import\s+type\s+[^;]*?from\s*["']@oh-my-pi\/[^"']+["'];?/g,
    '',
  );
  out = out.replace(
    /import\s*\{([^}]*)\}\s*from\s*["']@oh-my-pi\/[^"']+["'];?/g,
    (_all, list: string) => {
      const kept = list
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s !== '' && !s.startsWith('type '));
      for (const k of kept) names.push(k.split(/\s+as\s+/)[0]?.trim() ?? k);
      return kept.length === 0
        ? ''
        : `import { ${kept.join(', ')} } from ${from};`;
    },
  );
  out = out.replace(
    /import\s+\*\s+as\s+(\w+)\s+from\s*["']@oh-my-pi\/[^"']+["'];?/g,
    (_all, name: string) =>
      `const ${name} = Reflect.get(globalThis, "${REGISTRY}");`,
  );
  out = out.replace(
    /import\s+(\w+)\s+from\s*["']@oh-my-pi\/[^"']+["'];?/g,
    (_all, name: string) =>
      `const ${name} = Reflect.get(Reflect.get(globalThis, "${REGISTRY}"), "default");`,
  );
  return { text: out, names };
}

/** The projection's extension modules loaded into a stand-in omp started as `start`
 *  says, before any event. */
export async function standIn(
  p: Projection,
  start: Start = {},
): Promise<StandIn> {
  const dir = scratchDir('simplification-omp-');
  const cwd = start.cwd ?? join(dir, 'cwd');
  mkdirSync(cwd, { recursive: true });
  const shown: Shown[] = [];
  let judged = 0;
  const agents = p.agents.map((d) => ({
    name: d.name,
    description: d.front.description,
    systemPrompt: d.body,
    ...(d.front.model === undefined ? {} : { model: d.front.model }),
    thinkingLevel: d.front['thinking-level'],
    ...(typeof d.front.spawns === 'string' && d.front.spawns.trim() !== ''
      ? { spawns: d.front.spawns }
      : Array.isArray(d.front.spawns) && d.front.spawns.length > 0
        ? { spawns: d.front.spawns }
        : {}),
    ...(d.front.tools === undefined ? {} : { tools: d.front.tools }),
    ...(d.front.output === undefined ? {} : { output: d.front.output }),
    source: 'project',
    filePath: d.file,
  }));
  const scope = {
    standIn: 'session settings',
    overlayLayers: () => ({ overrides: {} }),
  };
  const registry: Record<string, unknown> = {
    parseArgs: () =>
      start.cliPrompts === undefined ? {} : { messages: [...start.cliPrompts] },
    resolveAgentModelSelection: () => ({ patterns: [], role: undefined }),
    resolveModelOverrideWithAuthFallback: async () => ({
      explicitThinkingLevel: false,
      authFallbackUsed: false,
    }),
    DEFAULT_PREWALK_TARGET: '@smol',
    resolveAgentAdvisorSelection: () => undefined,
    resolveAgentAdvisorRolePattern: (pattern: string) => pattern,
    resolveAgentPrewalkPattern: () => undefined,
    resolveConfiguredModelPatterns: (pattern: string) => [pattern],
    cfgModelRoles: handle('modelRoles'),
    lookup: (id: string) => handle(id),
    findScopedSettings: () => scope,
    settings: { standIn: 'global settings' },
    buildSkillPromptMessage: async () => ({ message: '' }),
    getActiveSkills: () => [],
    cfgPersonality: handle('personality'),
    cfgPrewalkEnabled: handle('prewalk.enabled'),
    cfgReadSummarizeEnabled: handle('read.summarize.enabled'),
    discoverAgents: async () => ({ agents }),
    resolveAgentPrewalkDefault: (agent: { prewalk?: unknown }) => agent.prewalk,
    cfgTaskAgentModelOverrides: { get: () => ({}) },
    cfgTaskAgentAdvisor: { get: () => ({}) },
    cfgTaskAgentPrewalk: { get: () => ({}) },
    cfgTaskPrewalk: { get: () => false },
    // omp's meanings: `*` or absent anyone, empty no one, a list exactly those.
    resolveSpawnPolicy: (spawns?: string) => {
      const said = (spawns ?? '*').trim();
      if (said === '*')
        return { enabled: true, allowedAgents: null, allowedErrorText: '*' };
      const allowed = said
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      return allowed.length === 0
        ? { enabled: false, allowedAgents: allowed, allowedErrorText: 'none' }
        : {
            enabled: true,
            allowedAgents: allowed,
            allowedErrorText: allowed.join(','),
          };
    },
    parseFrontmatter: (source: string) => {
      const { front, body } = frontMatterOf(source);
      return { frontmatter: front, body };
    },
    completeSimple: async (_model: unknown, input: unknown) => {
      judged += 1;
      const verdict = start.verdict ?? true;
      if (verdict === 'none') return { content: [{ type: 'text', text: '' }] };
      const answer = Object.fromEntries([
        ...verdictFields(input).map((f) => [f, verdict]),
        ['reason', 'the stand-in judge'],
      ]);
      return { content: [{ type: 'text', text: JSON.stringify(answer) }] };
    },
  };
  (globalThis as Record<string, unknown>)[REGISTRY] = registry;

  // The installed command, answering as one of the same version.
  const bin = join(dir, 'bin');
  mkdirSync(bin);
  writeFileSync(
    join(bin, CLI_BIN),
    [
      `#!${process.execPath}`,
      'const args = process.argv.slice(2);',
      `const answers = ${JSON.stringify(start.answers ?? {})};`,
      `if (args[0] === '--version') process.stdout.write(${JSON.stringify(`${CLI_VERSION}\n`)});`,
      "else if (args.includes('--explain')) process.stdout.write(JSON.stringify({ name: `stand in ${args[0]}`, purpose: 'p', when: 'w', verbs: [] }));",
      "else if (Object.hasOwn(answers, args.slice(0, 2).join(' '))) process.stdout.write(JSON.stringify(answers[args.slice(0, 2).join(' ')]));",
      "else process.stdout.write('{}');",
      '',
    ].join('\n'),
    { mode: 0o755 },
  );
  const PATH = process.env.PATH;
  process.env.PATH = `${bin}:${PATH ?? ''}`;

  // The installation: its package names the version that projected it.
  const root = join(dir, 'root');
  mkdirSync(join(root, 'extensions'), { recursive: true });
  writeFileSync(
    join(root, 'package.json'),
    JSON.stringify({ name: 'cratylus-omp', version: CLI_VERSION }),
  );
  const modules = extensionModules(p).map((m) => {
    const r = rewritten(m.text, './omp-stand-in.mjs');
    return { ...m, ...r };
  });
  const names = new Set(modules.flatMap((m) => m.names));
  writeFileSync(
    join(root, 'extensions', 'omp-stand-in.mjs'),
    [...names]
      .map((n) => {
        const fallback = n.startsWith('cfg')
          ? '({ get: () => undefined, override() {}, clearOverride() {} })'
          : '(() => undefined)';
        return `export const ${n} = globalThis.${REGISTRY}.${n} ?? ${fallback};`;
      })
      .join('\n'),
  );

  const handlers = new Map<string, ((e: unknown, c: unknown) => unknown)[]>();
  const record =
    (kind: string) =>
    (...args: unknown[]) => {
      shown.push({ kind, text: args.map(text).join(' ') });
      return undefined;
    };
  const known: Record<string, unknown> = {
    typebox: {
      Type: new Proxy({}, { get: () => (schema: unknown) => schema }),
    },
    registerTool: () => {},
    registerFlag: () => {},
    registerCommand: () => {},
    registerShortcut: () => {},
    getFlag: (name: string) => (name === 'agent' ? start.agent : undefined),
    on: (event: string, handler: (e: unknown, c: unknown) => unknown) =>
      handlers.set(event, [...(handlers.get(event) ?? []), handler]),
    setModel: async () => true,
    setThinkingLevel: () => {},
    setActiveTools: async (tools: unknown) => {
      shown.push({ kind: 'setActiveTools', text: text(tools) });
    },
    getActiveTools: () => [],
    exec: async () => ({ code: 0, stdout: '', stderr: '', killed: false }),
  };
  const pi = new Proxy(known, {
    get: (target, prop) => {
      if (typeof prop !== 'string' || prop === 'then' || prop === 'pi')
        return undefined;
      return prop in target ? target[prop] : record(prop);
    },
  });

  const branch: unknown[] = [];
  const ui = new Proxy(
    {},
    {
      get: (_t, prop) => {
        if (typeof prop !== 'string' || prop === 'then') return undefined;
        if (prop === 'notify')
          return (message: unknown, level?: unknown) =>
            shown.push({
              kind: 'notify',
              level: String(level ?? 'info'),
              text: text(message),
            });
        if (prop === 'setStatus')
          return (_key: unknown, value: unknown) =>
            shown.push({
              kind: 'status',
              text: value === undefined ? '' : text(value),
            });
        return record(`ui.${prop}`);
      },
    },
  );
  const ctxOf = (at: { kind: 'main' | 'sub'; name?: string }) => ({
    cwd,
    agent: {
      kind: at.kind,
      name: at.name ?? (at.kind === 'main' ? 'main' : 'task'),
    },
    model: { provider: 'fixture', id: 'base' },
    modelRegistry: {
      find: () => undefined,
      getApiKeyAndHeaders: async () => ({ ok: false }),
    },
    ui,
    hasUI: true,
    sessionManager: {
      getBranch: () => branch,
      getEntries: () => branch,
      getHeader: () => undefined,
      getSessionId: () => 'stand-in-session',
    },
    isIdle: () => true,
    abort: () => {},
  });

  /** Run `body` with exits and stderr writes recorded, never taken. */
  const guarded = async <T>(body: () => Promise<T>): Promise<T> => {
    const exit = vi.spyOn(process, 'exit').mockImplementation(((
      code?: number,
    ) => {
      throw new Error(`process.exit(${code ?? ''})`);
    }) as never);
    const stderr = vi.spyOn(process.stderr, 'write').mockImplementation(((
      chunk: unknown,
    ) => {
      shown.push({ kind: 'stderr', text: text(String(chunk)) });
      return true;
    }) as never);
    try {
      return await body();
    } finally {
      exit.mockRestore();
      stderr.mockRestore();
    }
  };

  await guarded(async () => {
    for (const m of modules) {
      const file = join(root, 'extensions', m.name);
      writeFileSync(file, m.text);
      // Dynamic: the module under test is the projected bytes, written to disk here.
      const loaded = (await import(file)) as {
        default: (pi: unknown) => unknown;
      };
      await loaded.default(pi);
    }
  });

  return {
    shown,
    judged: () => judged,
    close: () => {
      process.env.PATH = PATH;
      Reflect.deleteProperty(globalThis, REGISTRY);
    },
    fire: (event, payload, at = { kind: 'main' }) =>
      guarded(async (): Promise<Outcome> => {
        const before = shown.length;
        let blocked: string | undefined;
        let handled = false;
        let threw: string | undefined;
        let systemPrompt: string[] | undefined;
        if (event === 'message_end' || event === 'assistant_message')
          branch.push({ type: 'message', message: payload.message });
        for (const h of handlers.get(event) ?? []) {
          let r: unknown;
          try {
            r = await h(payload, ctxOf(at));
          } catch (error) {
            threw = error instanceof Error ? error.message : String(error);
            break;
          }
          if (r === null || typeof r !== 'object') continue;
          if ('block' in r && r.block === true) {
            blocked = 'reason' in r ? text(r.reason) : '';
            break;
          }
          if (
            ('handled' in r && r.handled === true) ||
            ('action' in r && r.action === 'handled')
          ) {
            handled = true;
            break;
          }
          if ('systemPrompt' in r && r.systemPrompt !== undefined) {
            payload.systemPrompt = r.systemPrompt;
            systemPrompt = [r.systemPrompt].flat().map(text);
          }
          if ('message' in r && r.message !== undefined)
            shown.push({ kind: `${event}.message`, text: text(r.message) });
        }
        return {
          ...(blocked === undefined ? {} : { blocked }),
          handled,
          ...(threw === undefined ? {} : { threw }),
          shown: shown.slice(before),
          ...(systemPrompt === undefined ? {} : { systemPrompt }),
        };
      }),
  };
}

/** A fence carrying `assignment` as the typed assignment of a task text. */
export const fenced = (
  assignment: Record<string, unknown>,
  prose = '',
): string =>
  `${prose}${prose === '' ? '' : '\n\n'}\`\`\`assignment\n${JSON.stringify(assignment)}\n\`\`\``;

/** An assignment holding every field `schema` requires, each of its declared type. */
export function completeAssignment(schema: unknown): Record<string, unknown> {
  const s =
    schema !== null && typeof schema === 'object'
      ? (schema as {
          properties?: Record<string, { type?: string }>;
          required?: string[];
        })
      : {};
  const out: Record<string, unknown> = {};
  for (const field of s.required ?? []) {
    const type = s.properties?.[field]?.type;
    out[field] =
      type === 'array'
        ? [
            field === 'examples'
              ? 'harbour/1'
              : field === 'decisions'
                ? '0142'
                : 'mooring',
          ]
        : type === 'boolean'
          ? true
          : type === 'object'
            ? {}
            : type === 'number' || type === 'integer'
              ? 1
              : field === 'cut'
                ? 'lantern'
                : field === 'workPackage'
                  ? 'moorings'
                  : 'mooring';
  }
  return out;
}

/** The cut-state answers that let any cut-reading check of a dispatch pass: the cut
 *  `lantern` on `feature/lantern`, its one package `moorings` ready and owning its one
 *  example, which a frozen check names. */
export const SETTLED_CUT: Readonly<Record<string, unknown>> = {
  'workPackage state': {
    branch: 'feature/lantern',
    workPackages: [{ name: 'moorings', status: 'pending' }],
    ready: ['moorings'],
  },
  'workPackage inventory': {
    unserved: [],
    unowned: [],
    examples: [{ ref: 'harbour/1', package: 'moorings' }],
  },
  'workPackage frozen': { cuts: [{ cut: 'lantern', unchecked: [] }] },
};
