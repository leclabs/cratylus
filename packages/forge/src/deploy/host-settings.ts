// Scalar settings in the host's YAML config, set where they are nested.
//
// A projected harness sometimes needs the HOST to hold a setting before what was
// projected works: omp's task isolation runs a dispatched agent in a copy of the
// checkout only while `task.isolation.enabled` is true, and keeps what the copy built
// out of the dispatcher's checkout only while `task.isolation.apply` is false.
//
// THE FILE IS HOST-OWNED, so it is EDITED, never re-emitted — the same discipline as
// `model-roles.ts`, for the same reason: no YAML library reads the file and none writes
// it, because either would rewrite the operator's comments, quoting, key order and
// unrelated keys. A key that is missing is inserted as whole lines, in the mapping it
// belongs to; a key that holds another value has that one line replaced; every other
// byte stays. What cannot be edited safely (a flow mapping, a scalar, a dotted key
// standing for the path, an entry whose value is not on its line) is left untouched and
// reported, and the caller carries on.
//
// It takes the path and the wanted settings as DATA: which harness, which file and which
// setting are the caller's facts, so nothing here imports an adapter. The record an
// uninstall takes the lines back by is the line diff of the edit (`HostEdit`), so an
// inserted line is removed again and a replaced one is the operator's original again.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { type HostEdit, lineHunks } from './manifest.js';
import {
  inlineValue,
  isBlankOrComment,
  keyOf,
  splitLines,
} from './yaml-lines.js';

/** The settings wanted: scalar `entries` under the mapping at `parent`. */
export interface HostSettings {
  readonly parent: readonly string[];
  readonly entries: Readonly<Record<string, string>>;
}

/** What one wanted setting came to. */
export interface HostSettingChange {
  /** The whole dotted path, `task.isolation.apply`. */
  readonly setting: string;
  /** The value now wanted, as written. */
  readonly to: string;
  /** The value the host held, or `undefined` where the key was missing. */
  readonly from: string | undefined;
}

export interface EnsureHostSettingsResult {
  readonly path: string;
  /** The settings that were missing or held another value (written, unless `dry`). */
  readonly changed: readonly HostSettingChange[];
  readonly wrote: boolean;
  /** Why nothing was written, where the file cannot be edited safely. */
  readonly refused?: string;
  /** The line diff to record for an uninstall, where the file was written. */
  readonly edit?: HostEdit;
}

const indentOf = (line: string): number =>
  (/^[ \t]*/.exec(line) as RegExpExecArray)[0].length;

/**
 * Make the YAML file at `path` hold each wanted setting.
 *
 *  - the file is absent ⇒ it is created (with its directory).
 *  - a mapping on the way to `parent` is missing ⇒ it is added, with the settings, after
 *    the last entry of the mapping that should hold it (at the end of the file for the
 *    top level), two spaces deeper than its parent.
 *  - a wanted key is missing ⇒ it is inserted after the last entry of its mapping, at the
 *    indentation its entries already use.
 *  - a wanted key holds another value ⇒ that line is replaced by `key: value`.
 *  - a key already holding the value, byte for byte, is never touched.
 */
export function ensureHostSettings(
  path: string,
  wanted: HostSettings,
  opts: { dry?: boolean } = {},
): EnsureHostSettingsResult {
  const dry = opts.dry ?? false;
  const exists = existsSync(path);
  const text = exists ? readFileSync(path, 'utf8') : '';
  const lines = splitLines(text);
  const eol = lines.find(([, t]) => t !== '')?.[1] || '\n';
  const dotted = wanted.parent.join('.');
  const refuse = (reason: string): EnsureHostSettingsResult => ({
    path,
    changed: [],
    wrote: false,
    refused: reason,
  });
  const change = (
    key: string,
    from: string | undefined,
  ): HostSettingChange => ({
    setting: `${dotted}.${key}`,
    to: wanted.entries[key] as string,
    from,
  });

  // ── DOWN THE PATH, as far as the file already goes ───────────────────────────
  // `range` is the block under the key reached so far (the whole file at the start);
  // `keyIndent` is that key's own indent (-1 for the file), and `anchor` the last line
  // of the range that carries content, where a missing child is inserted beneath.
  let from = 0;
  let to = lines.length;
  let keyIndent = -1;
  let anchor = -1;
  let entryIndent: number | undefined;
  let reached = 0; // the path's segments found
  for (const segment of wanted.parent) {
    const found = scan(lines, from, to, keyIndent);
    if (found.refused !== undefined) return refuse(found.refused);
    entryIndent = found.entryIndent;
    anchor = found.last;
    const at = found.keys.get(segment);
    if (at === undefined) break;
    const [line] = lines[at] as [string, string];
    const value = inlineValue(
      line.slice(line.indexOf(':', indentOf(line)) + 1),
    );
    if (value !== '') {
      return refuse(
        `\`${wanted.parent.slice(0, reached + 1).join('.')}\` holds the inline value \`${value}\` (a flow mapping, scalar, anchor, alias or tag), which cannot be extended by inserting lines`,
      );
    }
    reached += 1;
    keyIndent = indentOf(line);
    from = at + 1;
    to = blockEnd(lines, at, keyIndent);
    entryIndent = undefined;
    anchor = at;
  }

  // A dotted key standing for the path is the host's way of writing it, and a second
  // spelling beside it would be read against it.
  for (let i = 0; i < lines.length; i++) {
    const [line] = lines[i] as [string, string];
    if (isBlankOrComment(line) || /^\s/.test(line)) continue;
    const key = keyOf(line);
    if (key?.startsWith(`${dotted}.`) || key === dotted) {
      return refuse(
        `\`${key}\` is written as a dotted key at the top level, which cannot be edited beside the mapping it stands for`,
      );
    }
  }

  const keys = Object.keys(wanted.entries);
  const unit = '  ';
  const baseIndent = keyIndent < 0 ? '' : ' '.repeat(keyIndent);
  const moved = lines.map(([t, le]) => t + le);
  const changes: HostSettingChange[] = [];
  let inserted: string[] = [];
  let insertAfter = -1;

  if (reached < wanted.parent.length) {
    // ── A MAPPING ON THE WAY IS MISSING: add it, whole ──────────────────────────
    const open = ' '.repeat(
      entryIndent ?? (keyIndent < 0 ? 0 : keyIndent + unit.length),
    );
    const chain = wanted.parent.slice(reached);
    inserted = [
      ...chain.map(
        (segment, depth) => `${open}${unit.repeat(depth)}${segment}:`,
      ),
      ...keys.map(
        (key) =>
          `${open}${unit.repeat(chain.length)}${key}: ${wanted.entries[key]}`,
      ),
    ];
    for (const key of keys) changes.push(change(key, undefined));
    insertAfter = keyIndent < 0 ? lines.length - 1 : anchor;
  } else {
    // ── THE MAPPING IS THERE: set each key in it ────────────────────────────────
    const found = scan(lines, from, to, keyIndent);
    if (found.refused !== undefined) return refuse(found.refused);
    const open = ' '.repeat(found.entryIndent ?? keyIndent + unit.length);
    const missing: string[] = [];
    for (const key of keys) {
      const want = wanted.entries[key] as string;
      const at = found.keys.get(key);
      if (at === undefined) {
        missing.push(`${open}${key}: ${want}`);
        changes.push(change(key, undefined));
        continue;
      }
      const [line, le] = lines[at] as [string, string];
      const held = inlineValue(
        line.slice(line.indexOf(':', indentOf(line)) + 1),
      );
      if (held === '') {
        return refuse(
          `\`${dotted}.${key}\` holds its value on the lines beneath it, which cannot be replaced by editing one line`,
        );
      }
      if (held === want) continue;
      moved[at] = `${open}${key}: ${want}${le}`;
      changes.push(change(key, held));
    }
    inserted = missing;
    insertAfter = found.last;
  }

  if (changes.length === 0) return { path, changed: [], wrote: false };
  if (dry) return { path, changed: changes, wrote: false };

  let next: string;
  if (inserted.length === 0) {
    next = moved.join('');
  } else if (insertAfter < 0 || insertAfter >= lines.length - 1) {
    // After the file's last line: it gains a terminator where it had none.
    const head = moved.join('');
    const lead = head === '' || /[\r\n]$/.test(head) ? '' : eol;
    next = `${head}${lead}${inserted.join(eol)}${eol}`;
  } else {
    const head = moved.slice(0, insertAfter + 1).join('');
    const tail = moved.slice(insertAfter + 1).join('');
    next = `${head}${inserted.join(eol)}${eol}${tail}`;
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, next);
  // The lines the diff reads are the file's own, so the baseline is the text read.
  return {
    path,
    changed: changes,
    wrote: true,
    edit: { created: !exists, hunks: lineHunks(text, next) },
  };
}

/** The first line after `at` that ends the block under it: content at or above the
 *  key's own indent. Blank lines and comments never end a block. */
function blockEnd(
  lines: readonly [string, string][],
  at: number,
  keyIndent: number,
): number {
  for (let i = at + 1; i < lines.length; i++) {
    const [line] = lines[i] as [string, string];
    if (isBlankOrComment(line)) continue;
    if (indentOf(line) <= keyIndent) return i;
  }
  return lines.length;
}

/** The direct entries of the block in `[from, to)` whose parent key stands at
 *  `keyIndent`: each key's line, the indent they share, and the last line with
 *  content (the parent's own line, `from - 1`, where the block is empty). */
function scan(
  lines: readonly [string, string][],
  from: number,
  to: number,
  keyIndent: number,
): {
  keys: Map<string, number>;
  entryIndent: number | undefined;
  last: number;
  refused?: string;
} {
  const keys = new Map<string, number>();
  let entryIndent: number | undefined;
  let last = from - 1;
  for (let i = from; i < to; i++) {
    const [line] = lines[i] as [string, string];
    if (isBlankOrComment(line)) continue;
    if (keyIndent < 0 && /^(---|\.\.\.)(\s|$)/.test(line)) continue;
    const indent = indentOf(line);
    if (entryIndent === undefined) {
      entryIndent = indent;
      if (keyOf(line.slice(indent)) === undefined) {
        return {
          keys,
          entryIndent,
          last,
          refused:
            keyIndent < 0
              ? 'the file is not a block mapping at its top level, so a setting cannot be added safely'
              : 'a mapping on the path is not a mapping of `key: value` lines, so a setting cannot be added safely',
        };
      }
    }
    last = i;
    if (indent === entryIndent) {
      const key = keyOf(line.slice(indent));
      if (key !== undefined && !keys.has(key)) keys.set(key, i);
    }
  }
  return { keys, entryIndent, last };
}
