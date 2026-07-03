import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import pc from 'picocolors';
import {
  type Adapter,
  type Hook,
  type IR,
  IR_DIRNAME,
  type Manifest,
  RESOURCE_IR_KEY,
  type ResourceType,
  type Rule,
  type Scope,
  defaultIRRoot,
  findAdapter,
  findIRRoot,
  readIR,
  writeIR,
} from '../../core/index.js';
import { auditImport } from './import-audit.js';

/** The own-format pseudo-client: `import agent-forge --from <dir>` copies a
 *  foreign `.agent-forge/` IR into the local home. */
const OWN_FORMAT_CLIENT = 'agent-forge';

export interface ImportOpts {
  client: string;
  scope?: Scope;
  from?: string;
  cwd?: string;
  /** Merge into the existing IR instead of overwriting. */
  merge?: boolean;
}

export async function runImport(
  opts: ImportOpts,
  adapters: Adapter[],
): Promise<number> {
  const scope = opts.scope ?? 'project';
  const cwd = opts.cwd ?? process.cwd();
  const sourceDir = opts.from ?? cwd;

  if (opts.client === OWN_FORMAT_CLIENT) {
    return runOwnFormatImport(opts, scope, cwd);
  }

  const adapter = findAdapter(adapters, opts.client);
  if (!adapter) {
    console.error(pc.red(`agent-forge: unknown client '${opts.client}'`));
    console.error(
      `available: ${[...adapters.map((a) => a.id), OWN_FORMAT_CLIENT].join(', ')}`,
    );
    return 1;
  }

  const detected = await adapter.detect(scope, sourceDir);
  if (!detected) {
    console.error(
      pc.yellow(
        `⚠ ${opts.client}: no config detected at ${sourceDir} (scope ${scope})`,
      ),
    );
  }

  const incoming = await adapter.read(scope, sourceDir);

  const root = defaultIRRoot(scope, cwd);
  if (!existsSync(root)) {
    await mkdir(root, { recursive: true });
  }

  let ir: IR;
  let conflicts: string[] = [];
  if (opts.merge && findIRRoot(scope, cwd)) {
    // Read existing IR and merge incoming on top, preserving ours on conflict.
    const existing = await readIR(scope, cwd);
    const result = mergePreservingOurs(existing, incoming);
    ir = result.ir;
    conflicts = result.conflicts;
  } else {
    ir = {
      manifest: {
        agentForge: 1,
        scope,
        targets: [opts.client],
      } satisfies Manifest,
      ...incoming,
    };
  }

  await writeIR(ir, scope, cwd);

  const counts = countResources(ir);
  console.log(
    pc.green('✓'),
    `${opts.merge ? 'merged' : 'imported'} ${opts.client} → ${root}`,
  );
  for (const [k, n] of Object.entries(counts)) {
    if (n > 0) console.log(`    ${k}: ${n}`);
  }

  // Absent source capability is a status, never an omission: name every
  // resource type the source client declares no surface for.
  for (const [type, support] of Object.entries(
    adapter.capabilities.resources,
  )) {
    if (support !== 'none') continue;
    console.log(
      `    ${RESOURCE_IR_KEY[type as ResourceType]}: unsupported-by-source (${opts.client} declares no ${type} surface)`,
    );
  }

  // Name what the lift left behind: unrepresentable fields + unlifted files.
  const audit = auditImport(opts.client, scope, sourceDir, incoming);
  for (const u of audit.unrepresentable) {
    console.log(
      pc.yellow(
        `    unrepresentable-field: ${u.path} · ${u.field} (not modeled by the lifted IR)`,
      ),
    );
  }
  if (audit.unliftedSurfaces.length > 0) {
    console.log(
      pc.yellow(
        `⚠ unlifted-surfaces: ${audit.unliftedSurfaces.length} documented file(s) present but not imported:`,
      ),
    );
    for (const path of audit.unliftedSurfaces) {
      console.log(`    ${pc.yellow('•')} ${path}`);
    }
  }
  if (audit.fabricated.length > 0) {
    console.log(
      pc.yellow(
        `⚠ fabricated-path: ${audit.fabricated.length} unrecognized legacy path(s) present, never read:`,
      ),
    );
    for (const path of audit.fabricated) {
      console.log(`    ${pc.yellow('•')} ${path}`);
    }
  }
  if (conflicts.length > 0) {
    console.log('');
    console.log(
      pc.yellow(
        `⚠ ${conflicts.length} conflict(s) — IR preserved, theirs noted below:`,
      ),
    );
    for (const c of conflicts) console.log(`    ${pc.yellow('•')} ${c}`);
    console.log(
      pc.gray(
        '  re-run without --merge to take theirs, or hand-resolve in the IR.',
      ),
    );
  }
  return 0;
}

/**
 * Own-format import: copy a foreign `.agent-forge/` IR into the local home.
 * The source is read-only (never touched); the copy re-serializes through
 * readIR/writeIR so the result is schema-valid by construction.
 */
async function runOwnFormatImport(
  opts: ImportOpts,
  scope: Scope,
  cwd: string,
): Promise<number> {
  if (!opts.from) {
    console.error(
      pc.red(
        `agent-forge: import ${OWN_FORMAT_CLIENT} requires --from <repo>/${IR_DIRNAME}`,
      ),
    );
    return 1;
  }
  const from = resolve(opts.from);
  const sourceRoot =
    basename(from) === IR_DIRNAME ? from : join(from, IR_DIRNAME);
  if (!existsSync(sourceRoot)) {
    console.error(pc.red(`agent-forge: no ${IR_DIRNAME}/ at ${from}`));
    return 1;
  }

  let foreign: IR;
  try {
    foreign = await readIR('project', dirname(sourceRoot));
  } catch (e) {
    console.error(pc.red(`agent-forge: ${(e as Error).message}`));
    return 2;
  }

  const ir: IR = { ...foreign, manifest: { ...foreign.manifest, scope } };
  await writeIR(ir, scope, cwd);

  const root = defaultIRRoot(scope, cwd);
  console.log(pc.green('✓'), `imported ${sourceRoot} → ${root}`);
  for (const [k, n] of Object.entries(countResources(ir))) {
    if (n > 0) console.log(`    ${k}: ${n}`);
  }
  return 0;
}

interface MergeResult {
  ir: IR;
  conflicts: string[];
}

function mergePreservingOurs(existing: IR, incoming: Partial<IR>): MergeResult {
  const conflicts: string[] = [];
  const ir: IR = { ...existing };

  // Rules: by id
  if (incoming.rules) {
    const ourMap = new Map<string, Rule>(
      existing.rules?.map((r) => [r.id, r]) ?? [],
    );
    for (const theirs of incoming.rules) {
      const ours = ourMap.get(theirs.id);
      if (!ours) {
        ourMap.set(theirs.id, theirs);
      } else if (ours.body !== theirs.body) {
        conflicts.push(`rule '${theirs.id}': content differs (kept ours)`);
      }
    }
    ir.rules = Array.from(ourMap.values());
  }

  // Hooks: by (events tuple, matcher)
  if (incoming.hooks) {
    const key = (h: Hook): string =>
      `${[...h.events].sort().join(',')}|${h.matcher ?? ''}`;
    const ourMap = new Map<string, Hook>(
      existing.hooks?.map((h) => [key(h), h]) ?? [],
    );
    for (const theirs of incoming.hooks) {
      const k = key(theirs);
      const ours = ourMap.get(k);
      if (!ours) {
        ourMap.set(k, theirs);
      } else if (
        ours.command !== theirs.command ||
        ours.timeout !== theirs.timeout
      ) {
        conflicts.push(
          `hook '${theirs.id ?? k}': command/timeout differs (kept ours)`,
        );
      }
    }
    ir.hooks = Array.from(ourMap.values());
  }

  // skills/commands/agents/mcp_servers: by name
  ir.skills = mergeByName(existing.skills, incoming.skills, 'skill', conflicts);
  ir.commands = mergeByName(
    existing.commands,
    incoming.commands,
    'command',
    conflicts,
  );
  ir.agents = mergeByName(existing.agents, incoming.agents, 'agent', conflicts);
  ir.mcp_servers = mergeByName(
    existing.mcp_servers,
    incoming.mcp_servers,
    'mcp',
    conflicts,
  );

  // Permissions: combine (deny overrides allow handled by core merge but here we just union)
  if (incoming.permissions) {
    const allow = new Set([
      ...(existing.permissions?.allow ?? []),
      ...(incoming.permissions.allow ?? []),
    ]);
    const deny = new Set([
      ...(existing.permissions?.deny ?? []),
      ...(incoming.permissions.deny ?? []),
    ]);
    const ask = new Set([
      ...(existing.permissions?.ask ?? []),
      ...(incoming.permissions.ask ?? []),
    ]);
    for (const x of deny) allow.delete(x);
    ir.permissions = {
      ...(allow.size && { allow: Array.from(allow) }),
      ...(deny.size && { deny: Array.from(deny) }),
      ...(ask.size && { ask: Array.from(ask) }),
    };
  }

  // Env: ours wins per key on conflict
  if (incoming.env) {
    const out: Record<string, string> = {
      ...incoming.env,
      ...(existing.env ?? {}),
    };
    for (const k of Object.keys(incoming.env)) {
      if (
        existing.env?.[k] !== undefined &&
        existing.env[k] !== incoming.env[k]
      ) {
        conflicts.push(`env '${k}': value differs (kept ours)`);
      }
    }
    ir.env = out;
  }

  return { ir, conflicts };
}

function mergeByName<T extends { name: string }>(
  ours: T[] | undefined,
  theirs: T[] | undefined,
  label: string,
  conflicts: string[],
): T[] | undefined {
  if (!theirs) return ours;
  const map = new Map<string, T>(ours?.map((x) => [x.name, x]) ?? []);
  for (const t of theirs) {
    const o = map.get(t.name);
    if (!o) {
      map.set(t.name, t);
    } else if (JSON.stringify(o) !== JSON.stringify(t)) {
      conflicts.push(`${label} '${t.name}': differs (kept ours)`);
    }
  }
  return map.size > 0 ? Array.from(map.values()) : undefined;
}

function countResources(ir: IR): Record<string, number> {
  return {
    rules: ir.rules?.length ?? 0,
    skills: ir.skills?.length ?? 0,
    commands: ir.commands?.length ?? 0,
    agents: ir.agents?.length ?? 0,
    hooks: ir.hooks?.length ?? 0,
    mcp_servers: ir.mcp_servers?.length ?? 0,
    permissions: ir.permissions ? 1 : 0,
    env: ir.env ? Object.keys(ir.env).length : 0,
  };
}
