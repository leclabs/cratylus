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
 * ancestor first; a markerless `cwd` is its own boundary.
 *
 * What this computes is PROVENANCE — *where a record was captured*, never *what
 * it is about*. Nothing may read a node as a content-scope judgement (the dream
 * routing law used to, and was thereby unsatisfiable for every in-repo record).
 * Provenance is COMPUTED here, never reasoned by an agent, never stored on a
 * record.
 *
 * The fold-to-ancestor is inference, and it is bounded: it may stand on a
 * MARKER, never on `$HOME`/`markerless`. A vanished `cwd` whose walk finds no
 * marker resolves to `vanished-cwd` in the `legacy` bucket — see the walk.
 *
 * Default markers: `.git` (project; a `.git` FILE — worktree/submodule —
 * resolves through to the primary checkout's node) · a package manifest
 * (package) · `PLAN.md` (plan) · `$HOME` (user). The set extends via
 * `memory.scopeMarkers` (glob list) in `.cratylus.config`.
 *
 * Foreign-host records (host ≠ current) cannot be resolved against this
 * filesystem — a path that happens to exist locally proves nothing about the
 * capturing host. The only checkable marker is that host's `$HOME` prefix,
 * sourced from `.cratylus.config` `host.<name>.homedir`; otherwise the
 * cwd is its own boundary (the honest total answer).
 */

/**
 * The bucket for a record whose node is not MEASURABLE. One bucket, one name:
 * this is `fold.LEGACY_NODE`'s bucket (a cwd-less record) — a vanished cwd with
 * no marker to stand on is the same unmeasured state, reached differently.
 * Declared here rather than imported because `fold` imports `node`, never the
 * reverse.
 */
const LEGACY_NODE = 'legacy';

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
  /** Per-host absolute `$HOME` map from `.cratylus.config` `host.<name>.homedir`. */
  hostHomes: Readonly<Record<string, string>>;
}

/** A resolved node: the boundary directory + which marker established it. */
export interface NodeResolution {
  /** Absolute path of the boundary directory, or `legacy` when unmeasurable. */
  node: string;
  /**
   * The marker basis: a marker pattern (`.git`, `PLAN.md`, a config glob),
   * `.git-file` (worktree/submodule resolved to primary), `$HOME`,
   * `markerless` (cwd is its own boundary), `foreign-cwd` (foreign host, no
   * config home covers the cwd), or `vanished-cwd` (the cwd is gone and the
   * fold found no marker to stand on — node is `legacy`).
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

  // A nonexistent cwd folds to its nearest existing ancestor (SPEC D3). The
  // fold is INFERENCE, and this loop is the only place that knows it happened —
  // so carry the fact out rather than discarding it.
  let start = p;
  let vanished = false;
  while (!existsSync(start)) {
    vanished = true;
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
  //
  // A VANISHED cwd narrows what the walk is entitled to conclude. A MARKER
  // ancestor is still evidence: `<repo>/build/x`, deleted since capture, is
  // unambiguously a record of `<repo>`. But `$HOME` and `markerless` are the
  // walk running OUT of evidence, and for a vanished cwd that is not a finding
  // — it is an ORPHAN. Returning `$HOME` there LAUNDERS a renamed-away repo's
  // records into the `user` boundary, indistinguishable from a session
  // genuinely run from `~` (the live shape: `~/workspaces` bears no marker, so
  // every renamed repo under it resolved to `$HOME`). The durable stores gate
  // on exactly that distinction, so the honest answer is the legacy bucket.
  const orphan: NodeResolution = { node: LEGACY_NODE, basis: 'vanished-cwd' };
  let dir = start;
  for (;;) {
    if (dir === cfg.currentHome)
      return vanished ? orphan : { node: dir, basis: '$HOME' };
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

  // No marker anywhere up the chain: the cwd is its own boundary — unless the
  // cwd is gone, in which case `start` is an ancestor nobody measured.
  return vanished ? orphan : { node: start, basis: 'markerless' };
}

/**
 * Build a {@link NodeConfig} from a `.cratylus.config` (or none). Reads
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

// ── The config's ONE home ───────────────────────────────────────────────────
//
// The filename and the env var are the SAME SIGN in two dialects, and the
// precedence chain over them was written twice — in `cli.ts` and `strategy.ts` —
// with the literal repeated in each. Two homes for one name is how
// the retired name survived a scope rename AND a bin migration: nothing
// could grep for it as a brand, because it was a bare string in an `existsSync`
// call rather than an import specifier or a bin key.
//
// THE `fleet` SECTION IS GONE. The tracked example documented `fleet.hosts` and
// per-host ssh users, and NOTHING EVER READ THEM — `loadNodeConfig` reads
// `memory.scopeMarkers` and `host.<name>.homedir`, nothing else. It was a schema
// for a feature this repository does not have, describing one operator's private
// host topology. Deployment across machines is the operator's concern, not this
// project's; what remains is memory SCOPING, which is genuinely ours.

/** The config file a repository may carry, resolved relative to the cwd. */
export const CONFIG_FILE = '.cratylus.config';

/** The env var naming an explicit config path. Same sign as {@link CONFIG_FILE}. */
export const CONFIG_ENV = 'CRATYLUS_CONFIG';

/** `--config`/override ▸ `$CRATYLUS_CONFIG` ▸ a cwd-present `.cratylus.config` ▸ none. */
export function resolveConfigPath(override?: string): string | undefined {
  return (
    override ??
    process.env[CONFIG_ENV] ??
    (existsSync(CONFIG_FILE) ? CONFIG_FILE : undefined)
  );
}
