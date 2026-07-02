import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';

/**
 * The scope-pollution auditor (plans/scoped-memory SPEC §6): a deterministic
 * detector over an agent home's USER-scope stores (`SELF.md`, `MEMORY.md`) for
 * markers that belong at project/plan scope. The post-dream invariant is that
 * both files load whole AND audit clean; this module is the falsifier.
 *
 * Deterministic by construction: fixed regex marker classes + an explicit
 * repo-key list (never cwd sniffing, never reasoning). Reviewed exceptions are
 * pinned via an allow-file (shrink-only ratchet): a pin is the EXACT matched
 * marker text, so it survives line-number drift; a pin that no longer matches
 * anything is reported STALE so the file only ever shrinks.
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
}

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
 * The fuzzy branch form `owner/branch-name`: a slash-joined token whose tail
 * carries a `-`/`_` (the shape of a real branch name, e.g.
 * `mav/B9-toolkit-hardening`). The lookbehind excludes `@scoped/pkg-names` and
 * deeper path tails; {@link BRANCH_DENY} excludes ordinary repo-tree prefixes
 * (those are path mentions, and `plans/<x>` is already its own class).
 */
const BRANCH_FUZZY_RE =
  /(?<![\w/.@])[a-z][A-Za-z0-9._-]*\/[A-Za-z0-9._-]*[-_][A-Za-z0-9._-]+(?![\w/])/g;
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
  for (const m of line.matchAll(BRANCH_FUZZY_RE)) {
    const prefix = m[0].slice(0, m[0].indexOf('/'));
    if (!BRANCH_DENY.has(prefix)) push('branch-ref', m[0]);
  }
  for (const key of repoKeys) {
    const re = new RegExp(`(?<![\\w-])${escapeRe(key)}(?![\\w-])`, 'gi');
    for (const m of line.matchAll(re)) push('repo-key', m[0]);
  }
  return out;
}

/** The user-scope store files the audit covers (SPEC §6: SELF + MEMORY). */
const AUDITED_FILES = ['SELF.md', 'MEMORY.md'] as const;

export interface AuditOptions {
  /** Reviewed exception pins — exact matched-marker texts to silence. */
  allowPins?: readonly string[];
  /** Known repo keys (from `.agent-factory.config` and/or a keylist file). */
  repoKeys?: readonly string[];
}

/**
 * Audit an agent home's SELF.md + MEMORY.md for scope markers. Absent files are
 * skipped (a fresh home audits clean). Pure detection — no writes, no cwd
 * dependence beyond the caller-resolved inputs.
 */
export function auditHome(home: string, opts: AuditOptions = {}): AuditReport {
  const allow = new Set(opts.allowPins ?? []);
  const repoKeys = opts.repoKeys ?? [];
  const findings: AuditFinding[] = [];
  const pinned: AuditFinding[] = [];
  const matchedPins = new Set<string>();
  const scanned: string[] = [];

  for (const name of AUDITED_FILES) {
    const file = join(home, name);
    if (!existsSync(file)) continue;
    scanned.push(file);
    const lines = readFileSync(file, 'utf8').split('\n');
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
  return { findings, pinned, stalePins, scanned };
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
 * Derive repo keys from a `.agent-factory.config`: the containing repo's
 * basename (§1: key = repo basename — the config marks its repo), plus a
 * forward-compatible `projects` field (string array or object keys) if the
 * schema ever carries one. Malformed JSON throws loudly — once present the
 * config is authoritative (docs/agent-factory-config-schema.md).
 */
export function repoKeysFromConfig(configPath: string): string[] {
  const abs = resolve(configPath);
  const parsed = JSON.parse(readFileSync(abs, 'utf8')) as unknown;
  const keys: string[] = [basename(dirname(abs))];
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
