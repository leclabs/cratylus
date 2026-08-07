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
 * The scope resolver: `node(cwd, host)` — the
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
 * `memory.scopeMarkers` (glob list) in `.cratylus.memory.json`.
 *
 * Foreign-host records (host ≠ current) cannot be resolved against this
 * filesystem — a path that happens to exist locally proves nothing about the
 * capturing host. The only checkable marker is that host's `$HOME` prefix,
 * sourced from `.cratylus.memory.json` `host.<name>.homedir`; otherwise the
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

/** The default boundary-marker set. Order = tie-break order within a dir. */
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
  /** Per-host absolute `$HOME` map from `.cratylus.memory.json` `host.<name>.homedir`. */
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

  // A nonexistent cwd folds to its nearest existing ancestor. The
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
 * Build a {@link NodeConfig} from a `.cratylus.memory.json` (or none). Reads
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
//
// ── WHY THIS NAME — the derivation, recorded (2026-08-05) ────────────────────
//
// A BRAND SWEEP IS NOT A DERIVATION. Write `<BIN>` for the bare bin mark
// (`bin-name.ts`). The sign here USED to be `.<BIN>.config` / `$<BIN>_CONFIG`:
// picked by default when the scope was renamed, with no argument written
// anywhere — so the next sweep would have rewritten it the same way,
// unexamined, forever. The argument lives HERE, beside the literal, because
// that is the one site a sweep cannot overwrite without first reading it.
//
// (i) TWO CONCEPTS, NOT ONE. This is NOT the runtime host dotfile
// (`runtime/src/runtime-config.ts`, `~/.cratylus.json`). A merge was
// considered and rejected on three measured axes:
//   · AUTHORITY — the runtime dotfile is PROJECTED by deploy; this one is
//     OPERATOR-AUTHORED and ships a hand-copied `.example`. Merging would put
//     operator ground in a projector-owned file, and deploy would clobber it.
//   · LOCATION — `homedir()`-ONLY there; cwd-ward first here, `$HOME` only as
//     the fallback (`resolveConfigPath` below — the nearer file overrides).
//   · REFERENT — provider wiring there, boundary/scope semantics here.
// The only thing the two shared was the word `config`, and `config` is vacuous
// — which is exactly why the wrong guess was easy to make.
//
// (ii) IT IS MEMORY'S. Every live reference sits in this package plus memory's
// own port; no non-memory consumer exists and none is possible — the `fleet`
// section that WAS general was deleted precisely because nothing read it (see
// above). The file's top key already says `memory`. Hence the `memory` facet,
// on the `tsconfig.build.json` precedent already in this tree.
//
// (iii) `.json`, NOT `.config` — the extension lied about the format. The
// content is `JSON.parse`d (`loadNodeConfig` below, `repoKeysFromConfig` in
// `audit.ts`). `.config` predicted an ini/toml/rc dialect that never existed.
//
// (iv) THE OLD NAME SQUATTED A SLOT IT DOES NOT OWN. The rule already in force
// in this tree is `` `.${BIN}.json` `` (`runtime/src/bin-name.ts` records a
// deliberate two-bin derivation), so `.<BIN>.config` decodes as "the <BIN>
// BIN's config" — it squats the bare-mark slot the build CLI's own config must
// one day take. Blind reverse decode of the old name predicts general tool
// settings; the content is scope markers and per-host `$HOME`s. MISS. The
// faceted name decodes to its contents. HIT.
//
// (v) THE ENV VAR IS A SECOND, CLEANER KILL. Two registers, two rules, both
// already in force here: files ↦ `.cratylus*` · env ↦ `AGENT_*`. `store.ts`
// declares the `AGENT_*` namespace as this package's own, and the live surface
// is `AGENT_RUNTIME_CONFIG` · `AGENT_SESSION_ID` · `AGENT_SESSION_ID_FROM`.
// `$<BIN>_CONFIG` was the sole outlier — a file-register mark wearing an
// env-register hat.

/** The config file's basename. Its shape is whatever the readers below accept — a
 *  bespoke surface slated for replacement by a mature memory backend, so it gains no
 *  schema of its own in the meantime. */
export const CONFIG_FILE = '.cratylus.memory.json';

/** The env var naming an explicit config path. Same sign as {@link CONFIG_FILE}. */
export const CONFIG_ENV = 'AGENT_MEMORY_CONFIG';

/** The nearest {@link CONFIG_FILE} at or above `from` (absolute), or none. */
function nearestConfigAtOrAbove(from: string): string | undefined {
  let dir = resolve(from);
  for (;;) {
    const candidate = join(dir, CONFIG_FILE);
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) return undefined; // filesystem root
    dir = parent;
  }
}

/**
 * `--config`/override ▸ `$AGENT_MEMORY_CONFIG` ▸ the nearest
 * `.cratylus.memory.json` at or above the cwd ▸ `$HOME/.cratylus.memory.json` ▸
 * none. Always ABSOLUTE when it resolves from the filesystem.
 *
 * ── WHICH MODEL WON, AND WHY (2026-08-05) ───────────────────────────────────
 *
 * The defect: the last step used to be `existsSync(CONFIG_FILE)` against the
 * BARE CWD — no walk, no `~`. Run the tool from anywhere but the one directory
 * holding the file and the config silently vanished, reverting `resolveNode` to
 * {@link DEFAULT_MARKERS} with nothing reported. Two models were available:
 * widen RESOLUTION until it reaches everywhere the content governs, or narrow
 * the CONTENT to what a bare-cwd lookup can honestly serve.
 *
 * **RESOLUTION WIDENED.** The content cannot be narrowed, because neither key
 * is a statement about the cwd:
 *   · `memory.scopeMarkers` extends the marker set for `resolveNode`, which
 *     runs over EVERY stored record's cwd. Node identity must be
 *     cwd-INVARIANT — the lattice joins (fold ↔ `read --under` ↔ node) are
 *     equality on node strings, so a marker set that applies only while you
 *     happen to stand in one directory would resolve the SAME record to two
 *     different nodes depending on where the CLI was invoked. That is not a
 *     narrower feature, it is a broken one.
 *   · `host.<name>.homedir` is a claim about OTHER MACHINES — the only
 *     checkable evidence for a foreign-host record. No cwd could make it local.
 * Narrowing was therefore never a live option; the acceptance criterion's
 * second branch is unreachable for this content, and saying so is the ruling.
 *
 * The walk is the same nearest-ancestor idiom `resolveNode` already uses, so a
 * repo-carried config now works from any directory of that repo (the same
 * defect, one scope smaller), and `$HOME` closes the case the walk cannot
 * reach — a cwd outside `$HOME` entirely. Nearest wins: a checkout may override
 * the fleet default, never the reverse.
 *
 * `??` on the env read is load-bearing: `''` means "no config" (the test
 * suite's hermetic sentinel) and must NOT fall through to the walk.
 */
export function resolveConfigPath(override?: string): string | undefined {
  if (override !== undefined) return override;
  const fromEnv = process.env[CONFIG_ENV];
  if (fromEnv !== undefined) return fromEnv;
  const nearest = nearestConfigAtOrAbove(process.cwd());
  if (nearest !== undefined) return nearest;
  const inHome = join(homedir(), CONFIG_FILE);
  return existsSync(inHome) ? inHome : undefined;
}
