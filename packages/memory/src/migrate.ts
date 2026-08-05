import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import type { EpisodicRecord, JsonValue } from './record.js';
import { serializeRecord } from './record.js';
import { DEFAULT_EPISODIC_PATH } from './store.js';
import { monotonicFactory } from './ulid.js';

/**
 * One-time migration: convert a live agent's markdown `EPISODIC.md` into the
 * portable JSONL `EPISODIC.jsonl` event log, losing nothing.
 *
 * This is the machinery half of the consent-gated `migrate-live-episodic` task
 * (plans/memory-model-redesign). It is **content-preserving by construction**:
 * every memory item in the markdown becomes exactly one OPEN record, and
 * {@link assertNoLoss} proves the item set survives the round trip before any
 * file is written.
 *
 * What is an "item": EPISODIC.md is a list of bulleted memories under `## `
 * sections (e.g. `## Next steps (carried)`, `## Stream`). Each top-level `- `
 * bullet — together with its continuation/nested lines — is one item. The
 * pre-`##` preamble and HTML comments are **protocol scaffolding** (regenerated
 * by the seed template), not memory, and are dropped. Any non-bullet prose block
 * inside a content section is preserved too, so nothing is silently lost.
 */

/** A single memory item lifted from EPISODIC.md, with its section provenance. */
export interface EpisodicItem {
  /** The `## ` heading this item lived under, verbatim (e.g. `Next steps (carried)`). */
  section: string;
  /** The item's markdown, trimmed of trailing blank lines; bullets keep their `- `. */
  text: string;
}

/** The open `body` shape a migrated record carries — faithful and reversible. */
export interface MigratedBody {
  /** Provenance marker: this record was imported from a markdown EPISODIC. */
  imported: 'EPISODIC.md';
  /** The source `## ` section heading. */
  section: string;
  /** The item's original markdown text. */
  text: string;
  [key: string]: JsonValue;
}

export interface MigrateOptions {
  /**
   * Legacy scope stamp for migrated records — INERT v1 data under the v2
   * schema (migrated records carry no `cwd`, so they fold to the `legacy`
   * bucket regardless). Kept for provenance. Default `user`.
   */
  scope?: string;
  /** ULID source — inject a deterministic factory in tests. Defaults to a fresh monotonic factory. */
  ulid?: () => string;
}

const HTML_COMMENT_OPEN = '<!--';
const HTML_COMMENT_CLOSE = '-->';
const HEADING = /^##\s+(.*\S)\s*$/;
const BULLET = /^[-*]\s+\S/;
// A fenced-code delimiter (``` or ~~~, up to 3 spaces of indent, optional info).
// Inside a fence, a column-0 `## ` or `- ` is code, NOT a heading/bullet.
const FENCE = /^ {0,3}(`{3,}|~{3,})/;

/**
 * Parse EPISODIC.md markdown into its ordered list of memory items, in document
 * order. The definition of "what counts as content"; {@link migrateMarkdown}
 * converts what it returns and {@link assertNoLoss}'s round-trip leg checks
 * against it (a second, independent leg guards against this parser regressing).
 *
 * `section` is the `## ` heading an item lived under — a **label, not a unique
 * key**: a file with two identically-titled sections yields items sharing a
 * `section` string. Order is positional, so they still reconstruct in document
 * order; downstream must not treat `section` as a primary key.
 */
export function extractItems(markdown: string): EpisodicItem[] {
  const lines = markdown.split('\n');
  const items: EpisodicItem[] = [];
  let section: string | null = null; // null until the first `## ` — preamble is scaffolding
  let inComment = false;
  let inFence = false;
  let buf: string[] = [];

  const flush = (): void => {
    if (section === null) {
      buf = [];
      return;
    }
    // Trim leading/trailing blank lines from the accumulated block.
    while (buf.length > 0 && buf[0]?.trim() === '') buf.shift();
    while (buf.length > 0 && buf[buf.length - 1]?.trim() === '') buf.pop();
    if (buf.length > 0) items.push({ section, text: buf.join('\n') });
    buf = [];
  };

  for (const line of lines) {
    // Fenced code is opaque: a fence delimiter toggles the block, and while open
    // every line is verbatim continuation of the current item — never a heading,
    // bullet, or comment boundary. Checked FIRST so nothing inside a fence is
    // misread (the blind spot assertNoLoss's round-trip leg could not catch).
    if (FENCE.test(line)) {
      buf.push(line);
      inFence = !inFence;
      continue;
    }
    if (inFence) {
      buf.push(line);
      continue;
    }

    // HTML comment spans (possibly multi-line) are scaffolding — skip wholesale.
    if (inComment) {
      if (line.includes(HTML_COMMENT_CLOSE)) inComment = false;
      continue;
    }
    if (line.trimStart().startsWith(HTML_COMMENT_OPEN)) {
      if (!line.includes(HTML_COMMENT_CLOSE)) inComment = true;
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      flush(); // close any open item before leaving the section
      section = heading[1] as string;
      continue;
    }

    // A top-level bullet starts a new item; flush the previous block first.
    if (BULLET.test(line)) {
      flush();
      buf.push(line);
      continue;
    }

    // Continuation (indented/nested/wrapped) or orphan prose: accrue into the
    // current block. Blank lines accrue too and are trimmed at flush time.
    buf.push(line);
  }
  flush();
  return items;
}

/** Build one OPEN record from an item. Exposed for symmetry with {@link recordsToItems}. */
function itemToRecord(
  item: EpisodicItem,
  scope: string,
  id: string,
): EpisodicRecord {
  const body: MigratedBody = {
    imported: 'EPISODIC.md',
    section: item.section,
    text: item.text,
  };
  return { id, scope, path: DEFAULT_EPISODIC_PATH, body };
}

/** Recover the items a set of migrated records encodes — the inverse of {@link extractItems}'s mapping. */
export function recordsToItems(
  records: readonly EpisodicRecord[],
): EpisodicItem[] {
  return records.map((rec) => {
    const b = rec.body;
    if (
      typeof b !== 'object' ||
      b === null ||
      Array.isArray(b) ||
      b.imported !== 'EPISODIC.md' ||
      typeof b.section !== 'string' ||
      typeof b.text !== 'string'
    ) {
      throw new Error(`Record ${rec.id} is not a migrated EPISODIC.md import`);
    }
    return { section: b.section, text: b.text };
  });
}

/** Non-blank lines of a blob, in order — the unit the independent leg counts. */
function nonBlankLines(s: string): string[] {
  return s.split('\n').filter((l) => l.trim().length > 0);
}

/**
 * Independent no-loss leg: every non-blank line the `items` carry must be a line
 * of `markdown`, no more often than `markdown` contains it. Does NOT call
 * {@link extractItems}, so it catches a parser regression that fabricates or
 * duplicates content even when the round-trip leg (which shares the parser)
 * would pass. (It cannot detect a *dropped* content line — an absent line is
 * indistinguishable from intentionally-dropped scaffolding without re-parsing.)
 */
export function assertLinesFromSource(
  markdown: string,
  items: readonly EpisodicItem[],
): void {
  const sourceCounts = new Map<string, number>();
  for (const l of nonBlankLines(markdown)) {
    sourceCounts.set(l, (sourceCounts.get(l) ?? 0) + 1);
  }
  const itemCounts = new Map<string, number>();
  for (const it of items) {
    for (const l of nonBlankLines(it.text)) {
      itemCounts.set(l, (itemCounts.get(l) ?? 0) + 1);
    }
  }
  for (const [line, n] of itemCounts) {
    if (n > (sourceCounts.get(line) ?? 0)) {
      throw new Error(
        `EPISODIC migration fabricated or duplicated a line absent from source (${n} > ${sourceCounts.get(line) ?? 0}): ${JSON.stringify(line)}`,
      );
    }
  }
}

/**
 * Prove the conversion lost nothing, with **two legs**:
 *
 *  1. *Round-trip leg* — the items recovered from `records` equal, in order and
 *     content, the items {@link extractItems} finds in `markdown`. This shares
 *     `extractItems`, so it proves the records faithfully encode whatever the
 *     parser returned — not that the parser read the markdown correctly.
 *  2. *Independent leg* — does NOT reuse `extractItems`: every non-blank line a
 *     record carries must be a real source line, and no more often than the
 *     source contains it. This catches fabrication or duplication (e.g. a parser
 *     regression inventing content or a phantom section) that leg 1 cannot see.
 *
 * Together the gate is sound rather than merely self-consistent. Runs *before*
 * the migration writes anything.
 */
export function assertNoLoss(
  markdown: string,
  records: readonly EpisodicRecord[],
): void {
  const source = extractItems(markdown);
  const round = recordsToItems(records);
  if (source.length !== round.length) {
    throw new Error(
      `EPISODIC migration lost items: source has ${source.length}, records have ${round.length}`,
    );
  }
  for (let i = 0; i < source.length; i++) {
    const a = source[i] as EpisodicItem;
    const b = round[i] as EpisodicItem;
    if (a.section !== b.section || a.text !== b.text) {
      throw new Error(
        `EPISODIC migration diverged at item ${i}:\n  source: [${a.section}] ${JSON.stringify(a.text)}\n  record: [${b.section}] ${JSON.stringify(b.text)}`,
      );
    }
  }
  assertLinesFromSource(markdown, round); // leg 2 — independent of extractItems
}

/**
 * Convert EPISODIC.md markdown to ordered JSONL records, asserting no loss.
 * Pure (no file IO) so it is trivially testable; {@link migrateFile} wraps it.
 */
export function migrateMarkdown(
  markdown: string,
  opts: MigrateOptions = {},
): EpisodicRecord[] {
  const scope = opts.scope ?? 'user';
  const mint = opts.ulid ?? monotonicFactory();
  const records = extractItems(markdown).map((item) =>
    itemToRecord(item, scope, mint()),
  );
  assertNoLoss(markdown, records); // belt-and-suspenders: never emit a lossy result
  return records;
}

/** Serialize records to a JSONL blob (one record per line, trailing newline). */
export function recordsToJsonl(records: readonly EpisodicRecord[]): string {
  if (records.length === 0) return '';
  return `${records.map(serializeRecord).join('\n')}\n`;
}

export interface MigrateFileOptions extends MigrateOptions {
  /** Refuse to overwrite an existing destination unless true. Default false. */
  overwrite?: boolean;
  /** Don't write; just return the records and JSONL. Default false. */
  dryRun?: boolean;
}

export interface MigrateFileResult {
  records: EpisodicRecord[];
  jsonl: string;
  /** Item count migrated — the figure the no-loss diff is checked against. */
  itemCount: number;
  /** Whether bytes were written (false for a dry run). */
  written: boolean;
}

/**
 * Migrate one agent's `EPISODIC.md` file to `EPISODIC.jsonl`. Reads `srcPath`,
 * converts (with the no-loss gate), and — unless `dryRun` — writes `destPath`.
 * Never deletes the source: the caller backs it up and removes it deliberately,
 * per the per-agent consent flow.
 */
export function migrateFile(
  srcPath: string,
  destPath: string,
  opts: MigrateFileOptions = {},
): MigrateFileResult {
  if (!existsSync(srcPath))
    throw new Error(`Source EPISODIC.md not found: ${srcPath}`);
  if (!opts.dryRun && !opts.overwrite && existsSync(destPath)) {
    throw new Error(
      `Destination exists (pass overwrite to replace): ${destPath}`,
    );
  }
  const markdown = readFileSync(srcPath, 'utf8');
  const records = migrateMarkdown(markdown, opts);
  const jsonl = recordsToJsonl(records);
  const written = !opts.dryRun;
  if (written) writeFileSync(destPath, jsonl, 'utf8');
  return { records, jsonl, itemCount: records.length, written };
}
