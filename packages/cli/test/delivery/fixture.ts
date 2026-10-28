import '../typed-handoff/binding/omp-mocks.js';
import {
  chmodSync,
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { expect, vi } from 'vitest';
import type { Host, ToolResult } from '../capability-port/fixture.js';
import { host, run, success, toolJSON } from '../capability-port/fixture.js';
import { omp } from '../typed-handoff/binding/omp-mocks.js';
import { parseYaml } from '../yaml.js';
export { success };
export const here = dirname(fileURLToPath(import.meta.url));
export function put(path: string, text: string) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
}
export type Tree = Record<string, { text?: string; link?: string }>;
export function tree(root: string): Tree {
  const out: Tree = {};
  function walk(path: string) {
    if (!existsSync(path)) return;
    for (const name of readdirSync(path).sort()) {
      const file = join(path, name);
      const stat = lstatSync(file);
      if (stat.isSymbolicLink())
        out[relative(root, file)] = { link: readlinkSync(file) };
      else if (stat.isDirectory()) walk(file);
      else out[relative(root, file)] = { text: readFileSync(file, 'utf8') };
    }
  }
  walk(root);
  return out;
}
export function version(h: Host, value: string, prefix = h.prefix) {
  const file = join(prefix, 'node_modules/cratylus/package.json');
  const pkg = JSON.parse(readFileSync(file, 'utf8'));
  pkg.version = value;
  writeFileSync(file, JSON.stringify(pkg));
  if (prefix === h.prefix)
    expect(success(h.command(['--version'])).trim()).toBe(value);
}
export function fresh() {
  const h = host();
  success(h.install);
  rmSync(h.home, { recursive: true, force: true });
  mkdirSync(h.home);
  version(h, '2.4.0');
  return h;
}
export const owned = (h: Host) => join(h.home, '.cratylus/omp');
export function install(h: Host, home = h.home, cwd = h.cwd) {
  return h.command(
    ['install', '--harness', 'omp', '--home', home, '--model-roles', 'default'],
    cwd,
  );
}
export function uninstall(h: Host) {
  return h.command(['uninstall', '--harness', 'omp', '--home', h.home]);
}
export function earlier(h: Host, fixture = 'earlier-installation.json') {
  rmSync(h.home, { recursive: true, force: true });
  mkdirSync(h.home);
  const saved = JSON.parse(readFileSync(join(here, fixture), 'utf8')) as {
    entries: Record<string, { text?: string; link?: string; mode?: number }>;
  };
  for (const [name, item] of Object.entries(saved.entries)) {
    const expand = (s: string) =>
      s
        .replaceAll('<HOME>', h.home)
        .replaceAll('<PREFIX>', h.prefix)
        .replaceAll('<PROJECT>', h.cwd);
    const path = join(h.home, name);
    mkdirSync(dirname(path), { recursive: true });
    if (item.link) symlinkSync(expand(item.link), path);
    else writeFileSync(path, expand(item.text!));
    if (item.mode !== undefined) chmodSync(path, item.mode);
  }
  expect(
    readFileSync(join(h.home, '.agents/skills/event-tap/SKILL.md'), 'utf8'),
  ).toMatch(/event/i);
  const { modelRoles } = settings(h);
  expect(
    Object.keys(modelRoles as object).length,
    'captured earlier bindings',
  ).toBeGreaterThan(0);
  // These answers became the host's own, not removable projection
  // (design/decisions/install-keeps-each-tiers-model-as-the-hosts-setting.md).
  return { '.omp/agent/config.yml': JSON.stringify({ modelRoles }) };
}
export function settings(h: Host): Record<string, unknown> {
  const text = readFileSync(join(h.home, '.omp/agent/config.yml'), 'utf8');
  try {
    return parseYaml(text) as Record<string, unknown>;
  } catch (error) {
    throw new Error(`${error}\nHost settings after install:\n${text}`);
  }
}
export function treeWithoutBindings(h: Host): Tree {
  const after = tree(h.home);
  const path = '.omp/agent/config.yml';
  if (after[path]) {
    const { modelRoles: _bindings, ...rest } = settings(h);
    after[path] = { text: JSON.stringify(rest) };
  }
  return after;
}
export function hostMaterial(h: Host, inherited: Record<string, string> = {}) {
  const material = {
    '.omp/agent/agents/business-analyst.md':
      '---\nname: business-analyst\ndescription: Host business analyst\n---\nMira owns this declaration.\n',
    '.agents/skills/host-skill/SKILL.md':
      '---\nname: host-skill\ndescription: Host skill\n---\nMira owns this skill.\n',
    '.omp/agent/extensions/host.ts': 'export default function host() {}\n',
    '.omp/agent/config.yml': `${JSON.stringify({ modelRoles: { ...JSON.parse(inherited['.omp/agent/config.yml'] ?? '{}').modelRoles, default: 'host/model' }, theme: 'host-theme', extensions: ['./extensions/host.ts'], statusLine: { preset: 'custom', leftSegments: ['model'], rightSegments: ['cwd'], showHookStatus: false } })}\n`,
  };
  for (const [path, text] of Object.entries(material))
    put(join(h.home, path), text);
  return material;
}
export function preserved(h: Host, material: Record<string, string>) {
  for (const [path, text] of Object.entries(material)) {
    const after = readFileSync(join(h.home, path), 'utf8');
    if (path.endsWith('config.yml')) {
      expect(parseYaml(after)).toMatchObject(JSON.parse(text));
    } else expect(after, path).toBe(text);
  }
}
// Physical leaves, not stat()-followed copies: a reference remains distinguishable from a copy.
export function assertOwned(h: Host, before: Tree = {}) {
  const root = owned(h);
  const after = tree(h.home);
  expect(
    existsSync(join(root, 'extensions/cratylus.ts')),
    'the projection has one owned root',
  ).toBe(true);
  for (const [path, item] of Object.entries(after)) {
    if (
      path.startsWith('.cratylus/omp/') ||
      JSON.stringify(item) === JSON.stringify(before[path])
    )
      continue;
    if (item.link) {
      const target = realpathSync(join(h.home, path));
      expect(
        target === root || target.startsWith(`${root}/`),
        `${path} resolves into the owned root`,
      ).toBe(true);
    } else {
      // A harness configuration may carry the reference instead of a symlink. Its
      // unrelated pre-existing values must survive; a generated material copy is not a reference.
      const text = item.text!;
      let parsed: [unknown, unknown] | undefined;
      try {
        parsed = [parseYaml(before[path]?.text ?? ''), parseYaml(text)];
      } catch {}
      // Retained host answers may be serialized differently; content defines ownership.
      if (before[path] && parsed && isDeepStrictEqual(parsed[0], parsed[1]))
        continue;
      const references = [
        ...text.matchAll(
          /([^\s"'`=;()[\]{}<>]*\.cratylus\/omp[^\s"'`;,()[\]{}<>]*)/g,
        ),
      ].map((m) => m[1]!);
      expect(
        references.length,
        `${path}: outside changes must be references, not projected copies`,
      ).toBeGreaterThan(0);
      for (const ref of references) {
        const target = ref.startsWith('file://')
          ? fileURLToPath(ref)
          : ref.startsWith('~/')
            ? join(h.home, ref.slice(2))
            : resolve(dirname(join(h.home, path)), ref);
        expect(
          existsSync(target),
          `${path} has a live reference to ${target}`,
        ).toBe(true);
      }
      for (const [projected, material] of Object.entries(tree(root))) {
        if (
          !/^(?:agents|skills|extensions)\//.test(projected) ||
          !material.text?.trim()
        )
          continue;
        expect(
          text.includes(material.text),
          `${path} cannot carry a second copy of ${projected}`,
        ).toBe(false);
      }
      if (parsed) {
        const [oldValue, newValue] = parsed;
        if (newValue && typeof newValue === 'object') {
          const inspect = (previous: unknown, next: unknown, key: string) => {
            if (JSON.stringify(previous) === JSON.stringify(next)) return;
            if (Array.isArray(next)) {
              const old = Array.isArray(previous) ? previous : [];
              for (const value of old)
                expect(
                  next.some((v) => JSON.stringify(v) === JSON.stringify(value)),
                  `${path}:${key} preserves host value`,
                ).toBe(true);
              for (const value of next)
                if (
                  !old.some((v) => JSON.stringify(v) === JSON.stringify(value))
                )
                  inspect(undefined, value, key);
            } else if (next && typeof next === 'object') {
              const old =
                previous && typeof previous === 'object'
                  ? (previous as Record<string, unknown>)
                  : {};
              const current = next as Record<string, unknown>;
              for (const name of Object.keys(old))
                expect(
                  name in current,
                  `${path}:${key}.${name} keeps host setting`,
                ).toBe(true);
              for (const [name, value] of Object.entries(current))
                inspect(old[name], value, `${key}.${name}`);
            } else {
              expect(typeof next, `${path}:${key} adds only a reference`).toBe(
                'string',
              );
              expect(
                references.some((ref) => String(next).includes(ref)),
                `${path}:${key} adds only a root reference`,
              ).toBe(true);
            }
          };
          inspect(oldValue, newValue, '');
        }
      }
    }
  }
}
export function assertRemoved(h: Host) {
  expect(existsSync(owned(h)), 'uninstall removes the whole root').toBe(false);
  for (const [path, item] of Object.entries(tree(h.home))) {
    expect(
      item.link ?? item.text,
      `${path} retains no owned-root reference`,
    ).not.toContain('.cratylus/omp');
  }
}
interface Tool {
  name: string;
  parameters: {
    type?: string;
    properties?: Record<string, unknown>;
    required?: string[];
  };
  approval?: string | ((args: Record<string, unknown>) => string);
  execute(
    id: string,
    args: Record<string, unknown>,
    signal: unknown,
    update: unknown,
    ctx: unknown,
  ): Promise<ToolResult>;
}
export interface Loaded {
  tools: Tool[];
  notifications: { text: string; level: string }[];
  start(): Promise<void>;
  call(name: string, args?: Record<string, unknown>): Promise<ToolResult>;
  restore(): void;
}
export async function load(h: Host, cwd = h.cwd): Promise<Loaded> {
  const previous = { HOME: process.env.HOME, PATH: process.env.PATH };
  process.env.HOME = h.home;
  process.env.PATH = h.env.PATH;
  omp.agents = [];
  const notifications: { text: string; level: string }[] = [];
  const handlers = new Map<
    string,
    ((event: unknown, ctx: unknown) => unknown)[]
  >();
  const tools: Tool[] = [];
  const ctx = {
    cwd,
    agent: { kind: 'main', name: 'main' },
    model: { provider: 'fixture', id: 'base' },
    modelRegistry: {},
    ui: {
      setStatus() {},
      notify(text: string, level: string) {
        notifications.push({ text, level });
      },
    },
    sessionManager: { getSessionId: () => 'delivery-session' },
  };
  const pi = {
    typebox: { Type: { Unsafe: (s: unknown) => s } },
    registerTool: (t: Tool) => tools.push(t),
    registerFlag() {},
    getFlag() {},
    on: (name: string, fn: (e: unknown, c: unknown) => unknown) =>
      handlers.set(name, [...(handlers.get(name) ?? []), fn]),
    setModel: async () => {},
    setThinkingLevel() {},
    setActiveTools() {},
  };
  const extension = join(owned(h), 'extensions/cratylus.ts');
  // The old location is loaded only to measure the pre-cut extension's behavior,
  // not to grant an alternative layout: the projection is separately required to use the new root.
  const path = existsSync(extension)
    ? extension
    : join(h.home, '.omp/agent/extensions/cratylus.ts');
  try {
    // Each load models a new omp process, not the preceding session's module cache.
    vi.resetModules();
    await (await import(path)).default(pi);
    const start = async () => {
      for (const fn of handlers.get('session_start') ?? []) await fn({}, ctx);
    };
    const call = async (name: string, args: Record<string, unknown> = {}) => {
      const t = tools.find((t) => t.name === name);
      expect(t, `omp registers ${name}`).toBeDefined();
      try {
        return await t!.execute(
          'delivery-call',
          args,
          undefined,
          undefined,
          ctx,
        );
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: error instanceof Error ? error.message : String(error),
            },
          ],
        };
      }
    };
    return {
      tools,
      notifications,
      start,
      call,
      restore() {
        process.env.HOME = previous.HOME;
        process.env.PATH = previous.PATH;
      },
    };
  } catch (error) {
    process.env.HOME = previous.HOME;
    process.env.PATH = previous.PATH;
    throw error;
  }
}
export async function versions(extension: Loaded) {
  const t = extension.tools.find((t) => t.name === 'version_skew');
  expect(t, 'omp registers version_skew').toBeDefined();
  expect(Object.keys(t!.parameters.properties ?? {})).toEqual([]);
  expect(t!.parameters.required ?? []).toEqual([]);
  const approval =
    typeof t!.approval === 'function' ? t!.approval({}) : t!.approval;
  expect(approval, 'version tool is read-only').toBe('read');
  return toolJSON(await extension.call('version_skew')) as {
    artifacts: string;
    command: string;
    scope: 'user' | 'project';
    installation: string;
  };
}
export function skew(
  notifications: { text: string; level: string }[],
  artifacts: string,
  command: string,
) {
  const warning = notifications.filter(
    (n) =>
      n.level === 'warning' &&
      n.text.includes(artifacts) &&
      n.text.includes(command),
  );
  expect(
    warning,
    'startup warns immediately, naming both versions',
  ).toHaveLength(1);
  expect(warning[0]!.text).toMatch(/install/i);
  expect(warning[0]!.text).toMatch(/(?:again|re.?install)/i);
  expect(warning[0]!.text).toMatch(/cratylus/i);
}
export function normalizeProjection(h: Host) {
  const projection = Object.fromEntries(
    Object.entries(tree(owned(h))).map(([path, item]) => [
      path,
      /^(?:agents|skills|extensions)\//.test(path) ? item : { metadata: true },
    ]),
  );
  // Metadata filenames belong to the projection; incidental timestamps do not
  // define it. The recorded version is separately read through the version tool.
  return JSON.stringify(projection)
    .replaceAll(h.home, '<HOME>')
    .replaceAll(h.prefix, '<PREFIX>')
    .replaceAll(h.cwd, '<PROJECT>');
}
export function noTap(h: Host) {
  expect(success(h.command(['--help']))).not.toMatch(/event[-_ ]?tap/i);
  expect(
    h.command(['eventTap', '--help']).code,
    'event tap is not a hidden command',
  ).not.toBe(0);
  const projection = tree(h.home);
  expect(
    JSON.stringify(projection),
    'no installed event tap, including disabled scripts',
  ).not.toMatch(/event[-_ ]?tap/i);
}

// These are the actual pre-delivery packages, not today's code with another label.
export function earlierCommand(h: Host) {
  const prefix = join(h.root, 'earlier-command');
  cpSync(h.prefix, prefix, { recursive: true, verbatimSymlinks: true });
  for (const [archive, name] of [
    ['cratylus-0.11.0.tgz', 'cratylus'],
    ['cratylus-canon-0.14.0.tgz', '@cratylus/canon'],
    ['cratylus-forge-0.14.5.tgz', '@cratylus/forge'],
    ['cratylus-runtime-0.10.0.tgz', '@cratylus/runtime'],
    ['cratylus-schema-0.9.1.tgz', '@cratylus/schema'],
    // A dependency of the earlier runtime that today's packages no longer bring.
    ['dagrejs-graphlib-4.0.5.tgz', '@dagrejs/graphlib'],
  ]) {
    const target = join(prefix, 'node_modules', name!);
    rmSync(target, { recursive: true, force: true });
    mkdirSync(target, { recursive: true });
    success(
      run(
        'tar',
        [
          '-xzf',
          join(here, 'earlier-build', archive!),
          '--strip-components=1',
          '-C',
          target,
        ],
        h.cwd,
        h.env,
      ),
    );
  }
  const currentPath = h.env.PATH;
  h.env.PATH = `${join(prefix, 'node_modules/.bin')}:${currentPath}`;
  const value = success(h.command(['--version'])).trim();
  expect(value).toBe('0.11.0');
  expect(
    h.command(['versionSkew', '--explain']).code,
    'genuinely predates the version capability',
  ).not.toBe(0);
  return {
    version: value,
    /** Install with the earlier command's own surface: 0.11.0 took no run without a practices choice. */
    install: () =>
      h.command([
        'install',
        '--harness',
        'omp',
        '--home',
        h.home,
        '--all',
        '--model-roles',
        'default',
      ]),
    restore: () => {
      h.env.PATH = currentPath;
    },
  };
}
