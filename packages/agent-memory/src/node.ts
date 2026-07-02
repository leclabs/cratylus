import {
  existsSync,
  readFileSync,
  readdirSync,
  realpathSync,
  statSync,
} from 'node:fs';
import { homedir, hostname } from 'node:os';
import { dirname, isAbsolute, join, resolve, sep } from 'node:path';

/**
 * The scope resolver (plans/scoped-memory-v2 SPEC D3): `node(cwd, host)` — the
 * nearest ancestor of `cwd` (reflexive: `cwd` itself qualifies) holding a
 * boundary marker. **Total** over stored record fields: every `(cwd, host)`
 * resolves to some node; a nonexistent `cwd` folds to its nearest existing
 * ancestor first; a markerless `cwd` is its own boundary. Scope is COMPUTED
 * here, never reasoned by an agent and never stored on a record.
 *
 * Default markers: `.git` (project; a `.git` FILE — worktree/submodule —
 * resolves through to the primary checkout's node) · a package manifest
 * (package) · `PLAN.md` (plan) · `$HOME` (user). The set extends via
 * `memory.scopeMarkers` (glob list) in `.agent-factory.config`.
 *
 * Foreign-host records (host ≠ current) cannot be resolved against this
 * filesystem — a path that happens to exist locally proves nothing about the
 * capturing host. The only checkable marker is that host's `$HOME` prefix,
 * sourced from `.agent-factory.config` `host.<name>.homedir`; otherwise the
 * cwd is its own boundary (the honest total answer).
 */

/** The default boundary-marker set (SPEC D3). Order = tie-break order within a dir. */
export const DEFAULT_MARKERS: readonly string[] = [
  '.git',
  'package.json',
  'pyproject.toml',
  'Cargo.toml',
  'go.mod',
  'PLAN.md',
];

/** Everything `resolveNode` needs about the world — injectable for tests. */
export interface NodeConfig {
  /** Marker patterns, defaults first then config globs (order = precedence within a dir). */
  markers: readonly string[];
  /** Short hostname of the machine running the resolver. */
  currentHost: string;
  /** Absolute `$HOME` on this machine — the `user` boundary. */
  currentHome: string;
  /** Per-host absolute `$HOME` map from `.agent-factory.config` `host.<name>.homedir`. */
  hostHomes: Readonly<Record<string, string>>;
}

/** A resolved node: the boundary directory + which marker established it. */
export interface NodeResolution {
  /** Absolute path of the boundary directory. */
  node: string;
  /**
   * The marker basis: a marker pattern (`.git`, `PLAN.md`, a config glob),
   * `.git-file` (worktree/submodule resolved to primary), `$HOME`,
   * `markerless` (cwd is its own boundary), or `foreign-cwd` (foreign host,
   * no config home covers the cwd).
   */
  basis: string;
}

/** First DNS label of a hostname — fleet host keys are short names. */
export function shortHost(h: string): string {
  return h.split('.')[0] as string;
}

/** Anchored basename glob: `*` = any run, `?` = one char, else literal. */
export function globMatch(pattern: string, name: string): boolean {
  let re = '^';
  for (const ch of pattern) {
    if (ch === '*') re += '.*';
    else if (ch === '?') re += '.';
    else re += ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  re += '$';
  return new RegExp(re).test(name);
}

const hasWildcard = (p: string): boolean => p.includes('*') || p.includes('?');

/** `p` equals `base` or sits strictly under it. */
export function underOrEqual(p: string, base: string): boolean {
  return p === base || p.startsWith(base.endsWith(sep) ? base : base + sep);
}

/** Symlink-free canonical form of an EXISTING path (identity when unresolvable). */
export function canonical(p: string): string {
  try {
    return realpathSync(p);
  } catch {
    return p;
  }
}

/** The first marker (in `markers` order) present in `dir`, or null. */
function markerIn(
  dir: string,
  markers: readonly string[],
): { marker: string; matchedFile: string } | null {
  let entries: string[] | null = null; // lazy readdir, only for wildcard patterns
  for (const marker of markers) {
    if (!hasWildcard(marker)) {
      if (existsSync(join(dir, marker))) return { marker, matchedFile: marker };
      continue;
    }
    if (entries === null) {
      try {
        entries = readdirSync(dir);
      } catch {
        entries = [];
      }
    }
    // Deterministic: readdir order is fs-dependent, so pick the sorted-first match.
    const hit = [...entries].sort().find((e) => globMatch(marker, e));
    if (hit !== undefined) return { marker, matchedFile: hit };
  }
  return null;
}

/**
 * Resolve a `.git` FILE (worktree or submodule pointer) through to the primary
 * checkout's root: the `gitdir:` target lives under `<primary>/.git/worktrees/…`
 * or `<primary>/.git/modules/…`, so the directory holding that `.git` dir is
 * the primary root. Returns null when the pointer has no such shape.
 */
function primaryCheckoutRoot(gitFile: string): string | null {
  let content: string;
  try {
    content = readFileSync(gitFile, 'utf8');
  } catch {
    return null;
  }
  const m = /^gitdir:\s*(.+)\s*$/m.exec(content);
  if (m === null) return null;
  const target = m[1] as string;
  const abs = isAbsolute(target)
    ? resolve(target)
    : resolve(dirname(gitFile), target);
  const needle = `${sep}.git${sep}`;
  const idx = abs.indexOf(needle);
  if (idx === -1) return null;
  return canonical(abs.slice(0, idx));
}

/**
 * `node(cwd, host)` — see the module doc. Total: never throws on any stored
 * `(cwd, host)` pair; filesystem errors degrade to markerless resolution.
 */
export function resolveNode(
  cwd: string,
  host: string | undefined,
  cfg: NodeConfig,
): NodeResolution {
  const p = resolve(cwd);

  // Foreign host: the local filesystem is not evidence. Only the config-known
  // $HOME prefix is checkable; otherwise the cwd is its own boundary.
  if (host !== undefined && host !== cfg.currentHost) {
    const foreignHome = cfg.hostHomes[host];
    if (foreignHome !== undefined && underOrEqual(p, resolve(foreignHome)))
      return { node: resolve(foreignHome), basis: '$HOME' };
    return { node: p, basis: 'foreign-cwd' };
  }

  // A nonexistent cwd folds to its nearest existing ancestor (SPEC D3).
  let start = p;
  while (!existsSync(start)) {
    const parent = dirname(start);
    if (parent === start) break;
    start = parent;
  }
  // Canonicalize: one node, ONE name. `process.cwd()` records symlink-free
  // realpaths (macOS `/tmp` → `/private/tmp`), so every same-host resolution
  // must speak the same canonical form or lattice joins (fold ↔ read --under
  // ↔ node) silently miss.
  start = canonical(start);

  // Walk up from `start` (reflexive). Nearest marker wins, of any kind.
  let dir = start;
  for (;;) {
    if (dir === cfg.currentHome) return { node: dir, basis: '$HOME' };
    const hit = markerIn(dir, cfg.markers);
    if (hit !== null) {
      if (hit.marker === '.git') {
        const gitPath = join(dir, '.git');
        let isFile = false;
        try {
          isFile = statSync(gitPath).isFile();
        } catch {
          /* raced away — treat as ordinary marker */
        }
        if (isFile) {
          const primary = primaryCheckoutRoot(gitPath);
          if (primary !== null) return { node: primary, basis: '.git-file' };
        }
      }
      return { node: dir, basis: hit.marker };
    }
    const parent = dirname(dir);
    if (parent === dir) break; // filesystem root
    dir = parent;
  }

  // No marker anywhere up the chain: the cwd is its own boundary.
  return { node: start, basis: 'markerless' };
}

/**
 * Build a {@link NodeConfig} from a `.agent-factory.config` (or none). Reads
 * `memory.scopeMarkers` (glob list, appended after the defaults) and
 * `host.<name>.homedir` (absolute per-host `$HOME`). Malformed JSON throws
 * loudly — once present the config is authoritative.
 */
export function loadNodeConfig(configPath?: string): NodeConfig {
  const markers = [...DEFAULT_MARKERS];
  const hostHomes: Record<string, string> = {};
  if (configPath !== undefined && existsSync(configPath)) {
    const parsed = JSON.parse(readFileSync(configPath, 'utf8')) as unknown;
    if (typeof parsed === 'object' && parsed !== null) {
      const cfg = parsed as Record<string, unknown>;
      const memory = cfg.memory;
      if (typeof memory === 'object' && memory !== null) {
        const scopeMarkers = (memory as Record<string, unknown>).scopeMarkers;
        if (Array.isArray(scopeMarkers)) {
          for (const m of scopeMarkers)
            if (typeof m === 'string' && m.length > 0) markers.push(m);
        }
      }
      const host = cfg.host;
      if (typeof host === 'object' && host !== null) {
        for (const [name, entry] of Object.entries(
          host as Record<string, unknown>,
        )) {
          if (typeof entry !== 'object' || entry === null) continue;
          const hd = (entry as Record<string, unknown>).homedir;
          if (typeof hd === 'string' && isAbsolute(hd)) hostHomes[name] = hd;
        }
      }
    }
  }
  return {
    markers,
    currentHost: shortHost(hostname()),
    currentHome: canonical(homedir()),
    hostHomes,
  };
}
