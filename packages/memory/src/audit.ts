import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
// One home for the marker set and for canonicalization: `node.ts` owns what
// "boundary" means, and this module must not restate it. (`node` imports
// nothing from here, so the edge is one-way.)
import { DEFAULT_MARKERS, canonical } from './node.js';

/**
 * The scope-pollution auditor: a deterministic detector over an agent home's
 * resident stores — `SEMANTIC.md` and `PROCEDURAL.md`, the two shared-home
 * partitions of the route target set in `route.ts` — for markers that belong at
 * a project or plan node rather than in an agent's home. The post-dream
 * invariant is that both files load whole AND audit clean; this module is the
 * falsifier and dream's exit gate.
 *
 * Deterministic by construction: fixed regex marker classes + an explicit
 * repo-key list (never cwd sniffing, never reasoning). Reviewed exceptions are
 * pinned via an allow-file (shrink-only ratchet): a pin is the EXACT matched
 * marker text, so it survives line-number drift; a pin that no longer matches
 * anything is reported STALE so the file only ever shrinks.
 *
 * This module also owns the one QUANTITY over a store — {@link STORE_WATERMARK}
 * and the two write predicates derived from it ({@link refusesAppend},
 * {@link refusesReplace}). They live here, beside the pressure report, so the
 * bound has exactly ONE home: what the audit reports and what the write paths
 * refuse can never drift apart. Still pure — the predicates decide, the write
 * sites in `dream.ts` / `cli.ts` act.
 */

/** The marker classes the detector recognizes (SPEC §6). */
export type MarkerClass =
  | 'workspace-path'
  | 'plan-path'
  | 'branch-ref'
  | 'issue-ref'
  | 'repo-key';

/** One detected scope marker: file + 1-based line + class + exact matched text. */
export interface AuditFinding {
  /** Absolute path of the audited store file. */
  file: string;
  /** 1-based line number. */
  line: number;
  cls: MarkerClass;
  /** The exact matched marker text — also the allow-file pin key. */
  match: string;
}

/**
 * A store that has outgrown the size at which loading it whole stays affordable.
 * NOT an {@link AuditFinding}: nothing in the file is wrong, so it has no line
 * and no matched text — it is a property of the store, not of a line in it.
 *
 * This is the quantity the machinery was blind to. Every other audit signal is
 * a PURITY predicate, so a store could grow without bound and still report
 * clean; `depalimpsest` had no fireable trigger because nothing measured size.
 */
export interface StorePressure {
  /** Absolute path of the store that is over. */
  file: string;
  bytes: number;
  /** The byte watermark it exceeded. */
  watermark: number;
}

/** The audit verdict: unpinned findings fail; pins and stale pins are reported. */
export interface AuditReport {
  /** Findings NOT covered by an allow pin — any entry here fails the audit. */
  findings: AuditFinding[];
  /** Findings silenced by a reviewed allow pin. */
  pinned: AuditFinding[];
  /** Allow pins that matched nothing this run — remove them (shrink-only). */
  stalePins: string[];
  /** Store files actually scanned (absent files are skipped, not errors). */
  scanned: string[];
  /** Stores over the byte watermark — dream's `depalimpsest` trigger. */
  pressure: StorePressure[];
}

/**
 * Default byte ceiling per whole-read prose store. Wake loads SEMANTIC and
 * PROCEDURAL in full on every session, so their size is a per-session context
 * cost, not a disk cost. Set below the point where that read starts to crowd
 * out the work it is supposed to serve.
 *
 * **CORPUS-DERIVED, not chosen** (close-out SPEC §Decision 3b(i), measured over
 * the live homes). The bracket the number sits in:
 *
 * | store                       | bytes  |
 * | --------------------------- | ------ |
 * | baseline seeded agents (×8) | 470–496 |
 * | the largest UNCOMPLAINED store | 4 379 |
 * | the one store called BLOATED   | 15 969 |
 *
 * 8 000 is the only round value inside that bracket: it fires on exactly the
 * complained-about store and on nothing else, with 1.8× headroom over the
 * largest clean one. The rationale above is unchanged — only its calibration
 * was ever wrong. The prior 16 000 sat **31 bytes above** the bloated store, so
 * the bound existed and had never once fired.
 *
 * It is also no longer advisory. Both prose-store write paths refuse past it —
 * see {@link refusesAppend} / {@link refusesReplace}.
 */
export const STORE_WATERMARK = 8_000;

/**
 * Does the ceiling refuse an APPEND that would leave the store at `after`
 * bytes? A bounded container cannot bloat: refusing the append is what converts
 * unbounded growth into a forced eviction decision, without the guard taking
 * any judgement about the content being written (that judgement is the dream
 * agent's, and stays there).
 *
 * Accepts ⇔ `after ≤ ceiling` — landing exactly ON the ceiling is legal.
 */
export function refusesAppend(
  after: number,
  ceiling: number = STORE_WATERMARK,
): boolean {
  return after > ceiling;
}

/**
 * Does the ceiling refuse a whole-file REPLACE of a `before`-byte store with an
 * `after`-byte body?
 *
 * ```
 * accepts ⇔ after ≤ ceiling  ∨  after < before
 * ```
 *
 * **The second disjunct is load-bearing and the asymmetry with
 * {@link refusesAppend} is deliberate.** Without it a store already over the
 * ceiling could never be repaired — every replace would be refused for still
 * being over, while every append was refused too, leaving the store bricked.
 * With it, an over-ceiling store is *legal-but-frozen-to-shrink*: it converges
 * across successive consolidations at the agent's own pace, which is also why
 * lowering the ceiling owes no migration of existing stores.
 *
 * The shrink must be STRICT: an equal-size rewrite of an over-ceiling store
 * makes no progress and is refused, so the escape can never be used to hold
 * position above the line.
 */
export function refusesReplace(
  before: number,
  after: number,
  ceiling: number = STORE_WATERMARK,
): boolean {
  return after > ceiling && after >= before;
}

/**
 * The refusal text a rejected write must carry: **the store, the ceiling, and
 * the overage in bytes**. A bare refusal invites a retry loop; a refusal that
 * names the target turns the next act into a distillation with a known budget.
 * It also names the escape, so the reader knows the store is not bricked.
 */
export function ceilingRefusal(
  file: string,
  after: number,
  ceiling: number = STORE_WATERMARK,
): string {
  return [
    `${basename(file)} would be ${after}B — ${after - ceiling}B over the ${ceiling}B store ceiling.`,
    `Refused (${file}).`,
    'Evict first: distil the store to fit and land it with `memory replace`;',
    'a replace that STRICTLY shrinks the store is accepted even while it is still over.',
  ].join(' ');
}

/**
 * Default backlog watermark: unfolded EPISODIC records past which a dream is
 * owed. Conservative and below the harness compaction point, so the signal
 * arrives while there is still room to act on it.
 */
export const BACKLOG_WATERMARK = 12;

/** Fixed marker-class regexes. Each must be `g`-flagged (scanned via matchAll). */
const DETECTORS: ReadonlyArray<{ cls: MarkerClass; re: RegExp }> = [
  // A workspace checkout path: `~/workspaces/<x>` or an absolute macOS/Linux form.
  {
    cls: 'workspace-path',
    re: /(?:~|\/(?:Users|home)\/[A-Za-z0-9._-]+)\/workspaces\/[A-Za-z0-9._-]+/g,
  },
  // A plan directory reference: `plans/<x>` (with or without trailing slash).
  { cls: 'plan-path', re: /\bplans\/[A-Za-z0-9._-]+/g },
  // Explicit git ref forms.
  { cls: 'branch-ref', re: /\b(?:refs\/heads|origin)\/[A-Za-z0-9./_-]+/g },
  // An issue/PR number (`#42`) or URL tail (`pull/42`, `issues/42`). The
  // lookbehind keeps markdown headings, hex colors, and HTML entities out.
  { cls: 'issue-ref', re: /(?<![\w#&])#\d+\b/g },
  { cls: 'issue-ref', re: /\b(?:pull|issues)\/\d+\b/g },
];

/**
 * Context-anchored branch detection (the amendment: a bare fuzzy
 * `owner/branch-with-dash` match fired on corpus-speak — `autonomy/
 * human-on-the-loop`, `diff/round-trip` — pervasive in this fleet's SELF/MEMORY
 * register, which would force mass allow-pinning and defeat the ratchet). A
 * bare slash-token is a branch-ref ONLY within {@link BRANCH_CONTEXT_WINDOW}
 * tokens of git context: a git verb/noun ({@link GIT_KEYWORD_RE}) or a
 * commit-sha-shaped token ({@link SHA_RE}). Explicit `refs/heads/…` /
 * `origin/…` forms carry their context lexically and stay in {@link DETECTORS}.
 * {@link BRANCH_DENY} still excludes ordinary repo-tree prefixes (those are
 * path mentions, and `plans/<x>` is already its own class).
 */
const GIT_KEYWORD_RE =
  /^(?:branch(?:es)?|checkout|merge[ds]?|rebase[ds]?|push(?:e[ds])?|pull|prs?|mrs?)$/i;
const SHA_RE = /^[0-9a-f]{7,40}$/i;
/** A slash-joined ref-shaped token: letter-led first segment, slashy tail. */
const SLASH_REF_RE = /^[A-Za-z][A-Za-z0-9._-]*\/[A-Za-z0-9._/-]+$/;
/** Surrounding punctuation stripped per token. `@` is kept, so `@scope/pkg` stays non-ref-shaped. */
const TOKEN_TRIM_RE = /^[`'"()[\]{}<>,.;:!?*]+|[`'"()[\]{}<>,.;:!?*]+$/g;
const BRANCH_CONTEXT_WINDOW = 3;

/** The deny-listed prefixes for the context-anchored form (ordinary repo-tree path mentions). */
const BRANCH_DENY: ReadonlySet<string> = new Set([
  'agents',
  'apps',
  'dist',
  'docs',
  'ideas',
  'node_modules',
  'packages',
  'plans',
  'skills',
  'src',
  'test',
  'tests',
  'toolkit',
  'workspaces',
]);

/** The slash-tokens in `line` that sit within the context window of git context. */
function branchRefsInContext(line: string): string[] {
  const tokens = line
    .split(/\s+/)
    .filter((t) => t.length > 0)
    .map((t) => t.replace(TOKEN_TRIM_RE, ''));
  const anchors: number[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i] as string;
    if (GIT_KEYWORD_RE.test(t) || SHA_RE.test(t)) anchors.push(i);
  }
  if (anchors.length === 0) return [];
  const out: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i] as string;
    if (!SLASH_REF_RE.test(t)) continue;
    if (BRANCH_DENY.has(t.slice(0, t.indexOf('/')))) continue;
    // A token whose EVERY segment is itself a git verb/noun (`merge/push`,
    // `pull/push`) is an act-pair enumeration, not a branch name — and it is
    // guaranteed keyword-adjacent, so anchoring alone can never exclude it.
    if (t.split('/').every((seg) => GIT_KEYWORD_RE.test(seg))) continue;
    if (
      anchors.some((a) => a !== i && Math.abs(a - i) <= BRANCH_CONTEXT_WINDOW)
    )
      out.push(t);
  }
  return out;
}

/** Escape a literal for embedding in a RegExp. */
function escapeRe(literal: string): string {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Scan one line for scope markers. `repoKeys` are matched case-insensitively on
 * word boundaries. Findings are deduped per (class, match) within the line.
 */
export function scanLine(
  line: string,
  repoKeys: readonly string[] = [],
): Array<{ cls: MarkerClass; match: string }> {
  const seen = new Set<string>();
  const out: Array<{ cls: MarkerClass; match: string }> = [];
  const push = (cls: MarkerClass, match: string): void => {
    const key = `${cls} ${match}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ cls, match });
  };
  for (const { cls, re } of DETECTORS) {
    for (const m of line.matchAll(re)) push(cls, m[0]);
  }
  for (const match of branchRefsInContext(line)) push('branch-ref', match);
  for (const key of repoKeys) {
    const re = new RegExp(`(?<![\\w-])${escapeRe(key)}(?![\\w-])`, 'gi');
    for (const m of line.matchAll(re)) push('repo-key', m[0]);
  }
  return out;
}

/** The resident store files the audit covers — the v2 scan set. */
const AUDITED_FILES = ['SEMANTIC.md', 'PROCEDURAL.md'] as const;

export interface AuditOptions {
  /** Reviewed exception pins — exact matched-marker texts to silence. */
  allowPins?: readonly string[];
  /** Known repo keys (from `.cratylus.memory.json` and/or a keylist file). */
  repoKeys?: readonly string[];
  /** Byte watermark per store; defaults to {@link STORE_WATERMARK}. */
  watermark?: number;
}

/**
 * Audit an agent home's SEMANTIC.md + PROCEDURAL.md for scope markers. Absent
 * files are skipped (a fresh home audits clean). Pure detection — no writes,
 * no cwd dependence beyond the caller-resolved inputs.
 */
export function auditHome(home: string, opts: AuditOptions = {}): AuditReport {
  const allow = new Set(opts.allowPins ?? []);
  const repoKeys = opts.repoKeys ?? [];
  const findings: AuditFinding[] = [];
  const pinned: AuditFinding[] = [];
  const matchedPins = new Set<string>();
  const scanned: string[] = [];
  const watermark = opts.watermark ?? STORE_WATERMARK;
  const pressure: StorePressure[] = [];

  for (const name of AUDITED_FILES) {
    const file = join(home, name);
    if (!existsSync(file)) continue;
    scanned.push(file);
    const text = readFileSync(file, 'utf8');
    const bytes = Buffer.byteLength(text, 'utf8');
    if (bytes > watermark) pressure.push({ file, bytes, watermark });
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const lineText = lines[i] as string;
      for (const { cls, match } of scanLine(lineText, repoKeys)) {
        const finding: AuditFinding = { file, line: i + 1, cls, match };
        if (allow.has(match)) {
          matchedPins.add(match);
          pinned.push(finding);
        } else {
          findings.push(finding);
        }
      }
    }
  }

  const stalePins = [...allow].filter((p) => !matchedPins.has(p));
  return { findings, pinned, stalePins, scanned, pressure };
}

/**
 * Load allow pins / repo keys from a one-entry-per-line file. Whitespace is
 * trimmed; blank lines are skipped. Every non-blank line is a literal entry
 * (no comment syntax — a pin like `#42` must stay representable).
 */
export function loadLines(file: string): string[] {
  return readFileSync(file, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

/**
 * Is `dir` a repo root? A BOUNDARY MARKER says so — `.git`, a package manifest,
 * `PLAN.md` ({@link DEFAULT_MARKERS}) — never the presence of some other file
 * that merely happens to sit there. `$HOME` is excluded outright: it is the
 * USER boundary, and `resolveNode` already ranks it above every marker (it
 * returns at `currentHome` before `markerIn` is ever consulted), so a stray
 * manifest in `~` does not make `~` a repo here either.
 */
function bearsRepoMarker(dir: string): boolean {
  // Canonical on BOTH sides: one directory, one name (`node.ts` canonical()).
  if (canonical(dir) === canonical(homedir())) return false;
  // DEFAULT_MARKERS are literals, never globs — plain existence is exact.
  return DEFAULT_MARKERS.some((m) => existsSync(join(dir, m)));
}

/**
 * Derive repo keys from a `.cratylus.memory.json`: its `projects` field (string
 * array or object keys), plus the basename of its directory **when that
 * directory independently proves itself a repo** ({@link bearsRepoMarker}).
 * Malformed JSON throws loudly — once present the config is authoritative. The
 * schema is documented by example in `.cratylus.memory.json.example` at the
 * repo root, and derived in `node.ts` beside the `CONFIG_FILE` literal.
 *
 * ── PRESENCE IS NO LONGER THE ASSERTION (2026-08-05) ─────────────────────────
 *
 * This read used to be `[basename(dirname(abs)), …]` unconditionally: the
 * file's PRESENCE asserted *"this directory is a repo, and its key is the
 * basename."* That was a THIRD meaning stacked on an artifact already carrying
 * fleet-global facts (scope markers, per-host `$HOME`s) — the conflation that
 * made *"whose config is it?"* undecidable.
 *
 * Separating them was not cosmetic; it is what makes the resolution fix safe.
 * While resolution was bare-cwd, `dirname(config) === repo root` held BY
 * ACCIDENT — the only reachable config was one you were standing on. Now that
 * `resolveConfigPath` falls back to `$HOME`, that basename is the OPERATOR'S
 * USERNAME, and every repo key becomes a case-insensitive word-boundary regex
 * over both prose stores: a `~`-hosted config would have made the audit fire on
 * every mention of the operator's own name, in every agent home, forever.
 *
 * So the two concerns now answer separately. CONTENT (`projects`) states what
 * the operator declares. LOCATION contributes only through the boundary marker
 * that already means "repo" everywhere else in this package. The config asserts
 * nothing by sitting somewhere.
 */
export function repoKeysFromConfig(configPath: string): string[] {
  const abs = resolve(configPath);
  const parsed = JSON.parse(readFileSync(abs, 'utf8')) as unknown;
  const dir = dirname(abs);
  const keys: string[] = bearsRepoMarker(dir) ? [basename(dir)] : [];
  if (typeof parsed === 'object' && parsed !== null && 'projects' in parsed) {
    const projects = (parsed as Record<string, unknown>).projects;
    if (Array.isArray(projects)) {
      for (const p of projects) if (typeof p === 'string') keys.push(p);
    } else if (typeof projects === 'object' && projects !== null) {
      keys.push(...Object.keys(projects));
    }
  }
  return [...new Set(keys)];
}
