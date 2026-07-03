import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, dirname, isAbsolute, join } from 'node:path';
import { load } from 'js-yaml';
import {
  type Adapter,
  type AdapterCapabilities,
  type IR,
  type Rule,
  type Scope,
  type WriteOpts,
  type WriteReport,
  mergeYamlKeys,
  parseRule,
} from '../../core/index.js';

/**
 * Aider — minimal adapter. Aider has no agent-lifecycle hooks, skills,
 * commands, subagents, or MCP [AI3][AI5][AI6]. Rules are its one surface, but
 * aider has **no conventions auto-discovery**: a conventions file (any name)
 * is inert unless wired via `.aider.conf.yml`'s `read:` key (or `--read` /
 * `/read`) [AI2]. `.aider.conf.yml` itself resolves home → git-root → cwd,
 * later wins [AI1].
 *
 * - Project scope: conventions file `<cwd>/AGENTS.md` + `<cwd>/.aider.conf.yml`
 *   with a REPO-RELATIVE `read:` entry (portable — the conf is shareable/
 *   git-committable, so an absolute path would break for every other clone).
 * - User scope: conventions file `~/.aider/AGENTS.md` (never the bare
 *   `~/AGENTS.md` — that was a fabricated write with no documented consumer)
 *   + `~/.aider.conf.yml` with an ABSOLUTE `read:` entry — this conf applies
 *   across arbitrary project cwds, so a relative entry's resolution base is
 *   undocumented/ambiguous; absolute removes the ambiguity.
 * - Both scopes: an existing `.aider.conf.yml` is merge-safe — foreign keys
 *   survive and a pre-existing `read:` list is UNIONED with, never clobbered
 *   by, forge's entry [AI1].
 */

interface AiderPaths {
  conventionsPath: string;
  confPath: string;
}

function paths(scope: Scope, cwd: string): AiderPaths {
  if (scope === 'user') {
    const home = homedir();
    return {
      conventionsPath: join(home, '.aider', 'AGENTS.md'),
      confPath: join(home, '.aider.conf.yml'),
    };
  }
  return {
    conventionsPath: join(cwd, 'AGENTS.md'),
    confPath: join(cwd, '.aider.conf.yml'),
  };
}

function normalizeReadList(raw: unknown): string[] {
  if (typeof raw === 'string') return [raw];
  if (Array.isArray(raw)) {
    return raw.filter((x): x is string => typeof x === 'string');
  }
  return [];
}

async function loadConfRead(confPath: string): Promise<string[]> {
  if (!existsSync(confPath)) return [];
  const parsed = (load(await readFile(confPath, 'utf8')) ?? {}) as {
    read?: unknown;
  };
  return normalizeReadList(parsed.read);
}

const capabilities: AdapterCapabilities = {
  resources: {
    rules: 'full',
    skills: 'none',
    commands: 'none',
    agents: 'none',
    hooks: 'none',
    mcp: 'none',
    permissions: 'none',
    env: 'none',
  },
  hooks: { supported: [], matchers: 'none', payload: 'native' },
  scopes: ['user', 'project'],
};

async function readImpl(scope: Scope, cwd: string): Promise<Partial<IR>> {
  const { conventionsPath, confPath } = paths(scope, cwd);
  const baseDir = scope === 'user' ? homedir() : cwd;
  const entries = await loadConfRead(confPath);

  const rules: Rule[] = [];
  for (const entry of entries) {
    const p = isAbsolute(entry) ? entry : join(baseDir, entry);
    if (!existsSync(p)) continue;
    const stem = basename(p).replace(/\.[^./]+$/, '');
    rules.push(parseRule(await readFile(p, 'utf8'), stem));
  }
  if (rules.length) return { rules };

  // No conf (or no read: entries) — fall back to the plain conventions file,
  // e.g. foreign/legacy state predating this adapter's read: wiring.
  if (existsSync(conventionsPath)) {
    return {
      rules: [parseRule(await readFile(conventionsPath, 'utf8'), 'main')],
    };
  }
  return {};
}

async function writeImpl(
  ir: IR,
  scope: Scope,
  cwd: string,
  opts: WriteOpts = {},
): Promise<WriteReport> {
  const { conventionsPath, confPath } = paths(scope, cwd);
  const written: string[] = [];
  const skipped: { path: string; reason: string }[] = [];
  const warnings: string[] = [];

  if (ir.rules?.length) {
    const body = ir.rules.map((r: { body: string }) => r.body).join('\n\n');
    if (!opts.dryRun) {
      await mkdir(dirname(conventionsPath), { recursive: true });
      await writeFile(conventionsPath, `${body}\n`, 'utf8');
    }
    written.push(conventionsPath);

    // Wire read: — inert conventions otherwise [AI2]. Repo-relative for
    // project scope (portable across clones); absolute for user scope (the
    // conf applies to any invocation cwd).
    const entry =
      scope === 'user' ? conventionsPath : basename(conventionsPath);
    const existingRead = await loadConfRead(confPath);
    const readList = existingRead.includes(entry)
      ? existingRead
      : [...existingRead, entry];
    if (!opts.dryRun) {
      const existingText = existsSync(confPath)
        ? await readFile(confPath, 'utf8')
        : undefined;
      const merged = mergeYamlKeys(existingText, { read: readList });
      await mkdir(dirname(confPath), { recursive: true });
      await writeFile(confPath, merged, 'utf8');
    }
    written.push(confPath);
  }

  for (const [field, label] of [
    ['skills', 'skills'],
    ['commands', 'commands'],
    ['agents', 'agents'],
    ['hooks', 'hooks'],
  ] as const) {
    const items = ir[field];
    if (items?.length) {
      warnings.push(
        `${label}: Aider has no ${label} support (${items.length} skipped)`,
      );
      for (const i of items) {
        const id =
          (i as { name?: string; id?: string }).name ??
          (i as { id?: string }).id ??
          '?';
        skipped.push({ path: `${label}/${id}`, reason: 'unsupported' });
      }
    }
  }
  if (ir.mcp_servers?.length) {
    warnings.push(
      `mcp: Aider has no MCP support (${ir.mcp_servers.length} skipped)`,
    );
  }

  return { written, skipped, warnings };
}

export const aiderAdapter: Adapter = {
  id: 'aider',
  status: { kind: 'current' },
  capabilities,
  async detect(scope: Scope, cwd: string): Promise<boolean> {
    const { conventionsPath, confPath } = paths(scope, cwd);
    return existsSync(conventionsPath) || existsSync(confPath);
  },
  read: readImpl,
  write: writeImpl,
};
export default aiderAdapter;
