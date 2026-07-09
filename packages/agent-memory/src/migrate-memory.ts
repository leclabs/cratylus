import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import {
  type EpisodicItem,
  assertLinesFromSource,
  extractItems,
} from './migrate.js';
import { monotonicFactory } from './ulid.js';

/**
 * One-time migration: convert a live agent's monolithic markdown `MEMORY.md`
 * (a list of `- ` fact bullets under `## ` sections) into **sharded** files —
 * one memory per `MEMORY/<ulid>.md` — per `decisions/0003-shard-layout`.
 *
 * This is the Phase-4 machinery of `sharded-memory-store`. It is the semantic
 * sibling of {@link migrateFile} (md→JSONL for EPISODIC): same parser
 * ({@link extractItems}), same **two-leg no-loss gate** ({@link assertNoLoss}'s
 * round-trip + {@link assertLinesFromSource} independent line-coverage), proven
 * BEFORE any file is written.
 *
 * **Faithful, not enriching.** Each shard's body is the original bullet text
 * VERBATIM (so the gate passes); the `0003` frontmatter enrichments
 * (`topic`/`kind`/`basis` for relevance) are the Dreamer's later `consolidate`
 * job, NOT mechanically derivable from a bullet. The migration writes only the
 * provenance frontmatter it can know for certain: the minted `id`, a
 * `migrated: MEMORY.md` marker, and the source `section`.
 *
 * **Live-rollout gated.** Building + fixture-testing this tool is self-contained
 * Mav work; APPLYING it to a live agent must wait for the constitution Phase 3
 * (``dream``/``wake`` updated to read sharded `MEMORY/*.md`) — migrating an
 * agent's MEMORY to shards while its wake still reads `MEMORY.md` saws off the
 * running protocol (the md→JSONL atomic-coupling lesson). This module never
 * deletes the source; the caller applies it deliberately at a session boundary.
 */

/** Marker stamped on every shard's frontmatter, mirroring the episodic `imported`. */
export const MEMORY_MIGRATED_MARKER = 'MEMORY.md';

/** A single sharded memory: a `MEMORY/<ulid>.md` file's identity + content. */
export interface MemoryShard {
  /** The minted ULID — equals the filename stem (`<id>.md`). */
  id: string;
  /** The file basename, `<id>.md`. */
  filename: string;
  /** The source `## ` heading this fact lived under (round-trips the parse). */
  section: string;
  /** The fact body, VERBATIM from `MEMORY.md` (keeps its leading `- `). */
  body: string;
  /** The full file content (frontmatter + body) that gets written. */
  content: string;
}

export interface MigrateMemoryOptions {
  /** ULID source — inject a deterministic factory in tests. Defaults to a fresh monotonic factory. */
  ulid?: () => string;
}

/** Emit a shard's full file content: provenance frontmatter, then the verbatim body. */
export function renderShard(id: string, section: string, body: string): string {
  // section is JSON-encoded so an arbitrary heading (colons, quotes) round-trips
  // exactly through a trivial, dependency-free parser — episodic ships no YAML lib.
  const frontmatter = [
    '---',
    `id: ${id}`,
    `migrated: ${MEMORY_MIGRATED_MARKER}`,
    `section: ${JSON.stringify(section)}`,
    '---',
  ].join('\n');
  return `${frontmatter}\n${body}\n`;
}

/**
 * Parse one `MEMORY/<ulid>.md` shard back into its frontmatter + body — the
 * inverse of {@link renderShard}. Tolerant only of the shape this migration
 * writes (a `---` fenced head of `key: value` lines, then the body).
 */
export function parseShard(content: string): {
  id: string;
  section: string;
  body: string;
} {
  const lines = content.split('\n');
  if (lines[0] !== '---')
    throw new Error('Shard missing opening frontmatter fence');
  let i = 1;
  const fm = new Map<string, string>();
  for (; i < lines.length; i++) {
    if (lines[i] === '---') {
      i++;
      break;
    }
    const line = lines[i] as string;
    const sep = line.indexOf(': ');
    if (sep === -1) throw new Error(`Malformed frontmatter line: ${line}`);
    fm.set(line.slice(0, sep), line.slice(sep + 2));
  }
  const id = fm.get('id');
  const rawSection = fm.get('section');
  if (id === undefined || rawSection === undefined)
    throw new Error('Shard frontmatter missing id or section');
  // Body is everything after the closing fence, minus the single trailing newline
  // renderShard added (split drops nothing; the last element is '' for that newline).
  const bodyLines = lines.slice(i);
  if (bodyLines[bodyLines.length - 1] === '') bodyLines.pop();
  return {
    id,
    section: JSON.parse(rawSection) as string,
    body: bodyLines.join('\n'),
  };
}

/**
 * Convert `MEMORY.md` markdown to ordered shards, asserting no loss. Pure (no
 * file IO) so it is trivially testable; {@link migrateMemoryDir} wraps it.
 */
export function factsToShards(
  markdown: string,
  opts: MigrateMemoryOptions = {},
): MemoryShard[] {
  const mint = opts.ulid ?? monotonicFactory();
  const shards = extractItems(markdown).map((item) => {
    const id = mint();
    return {
      id,
      filename: `${id}.md`,
      section: item.section,
      body: item.text,
      content: renderShard(id, item.section, item.text),
    };
  });
  assertNoLoss(markdown, shards); // belt-and-suspenders: never emit a lossy result
  return shards;
}

/** Recover the items a set of shards encodes — the inverse of {@link factsToShards}'s mapping. */
export function shardsToItems(shards: readonly MemoryShard[]): EpisodicItem[] {
  return shards.map((s) => {
    const parsed = parseShard(s.content);
    return { section: parsed.section, text: parsed.body };
  });
}

/**
 * Prove the sharding lost nothing, with the same **two legs** as the EPISODIC
 * migration: (1) round-trip — items recovered from the shards' content equal, in
 * order and content, what {@link extractItems} finds in `markdown`; (2)
 * independent — every non-blank line a shard body carries is a real source line,
 * no more often than the source holds it ({@link assertLinesFromSource}, which
 * does NOT reuse `extractItems`, so it catches fabrication/dup the shared-parser
 * leg cannot). Runs before any shard file is written.
 */
export function assertNoLoss(
  markdown: string,
  shards: readonly MemoryShard[],
): void {
  const source = extractItems(markdown);
  const round = shardsToItems(shards);
  if (source.length !== round.length)
    throw new Error(
      `MEMORY migration lost facts: source has ${source.length}, shards have ${round.length}`,
    );
  for (let i = 0; i < source.length; i++) {
    const a = source[i] as EpisodicItem;
    const b = round[i] as EpisodicItem;
    if (a.section !== b.section || a.text !== b.text)
      throw new Error(
        `MEMORY migration diverged at fact ${i}:\n  source: [${a.section}] ${JSON.stringify(a.text)}\n  shard:  [${b.section}] ${JSON.stringify(b.text)}`,
      );
  }
  assertLinesFromSource(markdown, round); // leg 2 — independent of extractItems
}

export interface MigrateMemoryFileOptions extends MigrateMemoryOptions {
  /** Refuse to write into a destDir that already holds `*.md` shards unless true. Default false. */
  overwrite?: boolean;
  /** Don't write; just return the shards. Default false. */
  dryRun?: boolean;
}

export interface MigrateMemoryResult {
  shards: MemoryShard[];
  /** Fact count migrated — the figure the no-loss gate is checked against. */
  factCount: number;
  /** Whether shard files were written (false for a dry run). */
  written: boolean;
}

/**
 * Migrate one agent's `MEMORY.md` into a directory of `<ulid>.md` shards. Reads
 * `srcPath`, converts (with the no-loss gate), and — unless `dryRun` — writes one
 * file per fact into `destDir` (created as needed). NEVER deletes the source: the
 * caller backs it up and removes it deliberately at a session boundary, after the
 * constitution Phase 3 lands (see the module note).
 */
export function migrateMemoryDir(
  srcPath: string,
  destDir: string,
  opts: MigrateMemoryFileOptions = {},
): MigrateMemoryResult {
  if (!existsSync(srcPath))
    throw new Error(`Source MEMORY.md not found: ${srcPath}`);
  if (!opts.dryRun && !opts.overwrite && existsSync(destDir)) {
    const clash = readdirSync(destDir).some((f) => f.endsWith('.md'));
    if (clash)
      throw new Error(
        `Destination already holds shards (pass overwrite to add): ${destDir}`,
      );
  }
  const markdown = readFileSync(srcPath, 'utf8');
  const shards = factsToShards(markdown, opts);
  const written = !opts.dryRun;
  if (written) {
    mkdirSync(destDir, { recursive: true });
    for (const s of shards)
      writeFileSync(join(destDir, s.filename), s.content, 'utf8');
  }
  return { shards, factCount: shards.length, written };
}
