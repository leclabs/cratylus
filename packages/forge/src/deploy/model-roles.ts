// The host's `modelRoles` mapping — the one place a held role becomes a model.
//
// A projected definition names the ROLE an agent holds and never a model; the host
// decides which model fills a role in its own config file. This module adds, for a
// role the host has not mapped, an entry that aliases the harness's nearest built-in
// role, so a freshly installed agent routes somewhere sensible until its operator
// chooses. It never changes an entry that is already there.
//
// THE FILE IS HOST-OWNED, so it is EDITED, never re-emitted. The write is a text
// insertion of whole lines: no YAML library reads the file and no serializer writes
// it, because either would rewrite the operator's comments, quoting, key order and
// unrelated keys — every byte that is not the new entry must survive. What the
// insertion cannot safely extend (a flow mapping, a scalar, an anchor, an alias, a
// tag, a block scalar, a mapping whose entries are not `key: value` lines) is left
// untouched and reported, and the caller carries on.
//
// It takes the path and the wanted entries as DATA: which harness, which role and
// which alias are the caller's facts, so nothing here imports an adapter.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { type HostEdit, adoptedHunk, lineHunks } from './manifest.js';
import {
  inlineValue,
  isBlankOrComment,
  keyOf,
  splitLines,
} from './yaml-lines.js';

/** One mapping the host should have: the role, and the alias or model it routes to. */
export interface ModelRoleEntry {
  readonly role: string;
  /** The routed value, unquoted (e.g. `@task`); it is written double-quoted. */
  readonly value: string;
}

export interface AddModelRolesOpts {
  /** Report what would be added and write nothing. */
  readonly dry?: boolean;
  /** Record as install's own the entries the host already has that are byte for byte
   *  the ones this would write: for a host installed before edits were recorded. */
  readonly adopt?: boolean;
}

export interface AddModelRolesResult {
  readonly path: string;
  /** The entries the host lacked — written, or under `dry`, that would be. Empty
   *  when the host already had every wanted role, and when `refused`. */
  readonly added: readonly ModelRoleEntry[];
  /** Whether the file was written. */
  readonly wrote: boolean;
  /** Why the file was left untouched, when its `modelRoles` cannot be safely
   *  extended. Absent otherwise. */
  readonly refused?: string;
  /** What was put in the file, and what was adopted, for the deploy manifest — an
   *  uninstall takes exactly this out. Present when the file was written, and under
   *  `adopt` when a line was adopted. */
  readonly edit?: HostEdit;
}

const PLAIN_KEY = /^[A-Za-z0-9_][A-Za-z0-9_.-]*$/;

/** The whole line an entry occupies, without its terminator. */
export function modelRoleLine(entry: ModelRoleEntry, indent: string): string {
  const key = PLAIN_KEY.test(entry.role)
    ? entry.role
    : JSON.stringify(entry.role);
  return `${indent}${key}: ${JSON.stringify(entry.value)}`;
}

/**
 * Add each wanted entry the host's `modelRoles` lacks to the YAML file at `path`.
 *
 *  - `modelRoles:` is a block mapping ⇒ each missing entry is inserted after the
 *    mapping's last entry, at the indentation its entries already use (two spaces
 *    when it has none).
 *  - the file has no `modelRoles` key ⇒ a `modelRoles:` block is appended at the end.
 *  - the file is absent ⇒ it is created (with its directory).
 *  - `modelRoles` holds a value this cannot safely extend ⇒ nothing is written and
 *    `refused` says why.
 *
 * An entry whose role already has a key is never touched, whatever its value.
 */
export function addModelRoles(
  path: string,
  wanted: readonly ModelRoleEntry[],
  opts: AddModelRolesOpts = {},
): AddModelRolesResult {
  const dry = opts.dry ?? false;
  const exists = existsSync(path);
  const text = exists ? readFileSync(path, 'utf8') : '';
  const lines = splitLines(text);
  const eol = lines.find(([, t]) => t !== '')?.[1] || '\n';

  const refuse = (reason: string): AddModelRolesResult => ({
    path,
    added: [],
    wrote: false,
    refused: reason,
  });
  const finish = (
    added: readonly ModelRoleEntry[],
    next: string,
    adopted: readonly number[] = [],
  ): AddModelRolesResult => {
    if (added.length === 0) return { path, added, wrote: false };
    if (dry) return { path, added, wrote: false };
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, next);
    return {
      path,
      added,
      wrote: true,
      edit: {
        created: !exists,
        hunks: [
          ...lineHunks(text, next),
          ...adopted.map((i) => adoptedHunk(next, i, 1)),
        ],
      },
    };
  };

  // The top-level `modelRoles` key, and — while looking — whether the document is
  // a block mapping at all, since appending a key to anything else corrupts it.
  let at = -1;
  let sawTopLevel = false;
  for (let i = 0; i < lines.length; i++) {
    const line = (lines[i] as [string, string])[0];
    if (isBlankOrComment(line) || /^\s/.test(line)) continue;
    if (/^(---|\.\.\.)(\s|$)/.test(line) || line.startsWith('%')) continue;
    const key = keyOf(line);
    if (key === undefined) {
      if (!sawTopLevel) {
        return refuse(
          'the file is not a block mapping at its top level, so a `modelRoles:` key cannot be added safely',
        );
      }
      continue;
    }
    sawTopLevel = true;
    if (key === 'modelRoles') {
      at = i;
      break;
    }
  }

  // ── NO `modelRoles` KEY: append a block ───────────────────────────────────────
  if (at === -1) {
    if (wanted.length === 0) return { path, added: [], wrote: false };
    const body = wanted.map((e) => modelRoleLine(e, '  ')).join(eol);
    const lead = text === '' || /[\r\n]$/.test(text) ? '' : eol;
    return finish(wanted, `${text}${lead}modelRoles:${eol}${body}${eol}`);
  }

  // ── THE KEY IS PRESENT ───────────────────────────────────────────────────────
  const keyLine = (lines[at] as [string, string])[0];
  const colon = keyLine.indexOf(':', keyLine.indexOf('modelRoles'));
  const value = inlineValue(keyLine.slice(colon + 1));
  if (value !== '') {
    return refuse(
      `\`modelRoles\` holds the inline value \`${value}\` (a flow mapping, scalar, anchor, alias or tag), which cannot be extended by inserting lines`,
    );
  }

  // The block's entries: every following line until one back at column 0.
  let entryIndent: string | undefined;
  let last = at; // the last line of the block that carries content
  const present = new Set<string>();
  const entryAt = new Map<string, number>(); // each key's first line
  for (let i = at + 1; i < lines.length; i++) {
    const line = (lines[i] as [string, string])[0];
    if (isBlankOrComment(line)) {
      // A column-0 comment does not end the mapping; a column-0 key does.
      continue;
    }
    if (!/^[ \t]/.test(line)) break;
    const indent = /^[ \t]*/.exec(line)?.[0] as string;
    if (entryIndent === undefined) {
      entryIndent = indent;
      if (keyOf(line.slice(indent.length)) === undefined) {
        return refuse(
          '`modelRoles` is not a mapping of `key: value` lines, so an entry cannot be added safely',
        );
      }
    }
    last = i;
    if (indent === entryIndent) {
      const key = keyOf(line.slice(indent.length));
      if (key !== undefined) {
        present.add(key);
        if (!entryAt.has(key)) entryAt.set(key, i);
      }
    } else if (indent.length < entryIndent.length) {
      return refuse(
        '`modelRoles` has entries at inconsistent indentation, so an entry cannot be added safely',
      );
    }
  }

  const indent = entryIndent ?? '  ';
  // Lines the host already has that are byte for byte what this would write. Under
  // `adopt` they are recorded as install's own, exactly as a hand-made link to the
  // launcher is adopted: an install from before edits were recorded put them there, and
  // nothing else could tell them apart from the host's.
  const adopted =
    opts.adopt === true && !dry
      ? wanted.flatMap((e) => {
          const i = entryAt.get(e.role);
          return i !== undefined &&
            (lines[i] as [string, string])[0] === modelRoleLine(e, indent)
            ? [i]
            : [];
        })
      : [];
  const missing = wanted.filter((e) => !present.has(e.role));
  if (missing.length === 0) {
    return adopted.length === 0
      ? { path, added: [], wrote: false }
      : {
          path,
          added: [],
          wrote: false,
          edit: {
            created: false,
            hunks: adopted.map((i) => adoptedHunk(text, i, 1)),
          },
        };
  }

  const inserted = missing.map((e) => modelRoleLine(e, indent));
  // The anchor line may be the file's last, with no terminator: it gains one, and
  // the new lines end the way the file did — without one.
  const [anchorText, anchorEol] = lines[last] as [string, string];
  const head = lines
    .slice(0, last)
    .map(([t, e]) => t + e)
    .join('');
  const tail = lines
    .slice(last + 1)
    .map(([t, e]) => t + e)
    .join('');
  const next =
    anchorEol === ''
      ? `${head}${anchorText}${eol}${inserted.join(eol)}`
      : `${head}${anchorText}${anchorEol}${inserted.join(eol)}${eol}${tail}`;
  return finish(missing, next, adopted);
}
