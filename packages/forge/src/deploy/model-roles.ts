// The host's `modelRoles` mapping — the one place an agent's model role becomes a model.
//
// A projected definition names the model ROLE named for its agent and never a model;
// the host decides which model fills a role in its own config file. This module adds
// the entries the caller wants and the host lacks — on omp each agent's own role and
// the tier roles they alias — and moves only the entries the caller vouches are its
// own seed. It never changes another entry that is already there.
//
// THE FILE IS HOST-OWNED, so it is EDITED, never re-emitted. The write is a text
// insertion of whole lines: no YAML library reads the file and no serializer writes
// it, because either would rewrite the product owner's comments, quoting, key order and
// unrelated keys — every byte that is not the new entry must survive. What the
// insertion cannot safely extend (a flow mapping, a scalar, an anchor, an alias, a
// tag, a block scalar, a mapping whose entries are not `key: value` lines) is left
// untouched and reported, and the caller carries on. The one exception is a file that
// is a single JSON document, which has no comments or quoting to lose: it is written
// back whole, and only where writing it back unchanged reproduces it byte for byte.
//
// It takes the path and the wanted entries as DATA: which harness, which role and
// which alias are the caller's facts, so nothing here imports an adapter.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  type HostEdit,
  type LineHunk,
  adoptedHunk,
  lineHunks,
} from './manifest.js';
import {
  TOP_LEVEL_KEY,
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
  /** Entries whose role already has a line that is install's own seed, to be moved to
   *  the value given: the one case in which an existing entry is changed. The caller
   *  vouches that each line is install's; a role with no line, or a line already
   *  holding the value, is ignored. */
  readonly retarget?: readonly ModelRoleEntry[];
}

/** One existing entry moved to a new value. */
export interface RetargetedModelRole {
  readonly role: string;
  /** The value it now holds. */
  readonly value: string;
  /** In a YAML file, the line that moved: as it stood and as it now stands, each with
   *  its terminator, and the new line as a hunk of its own, for a record that never
   *  held `from`. Absent in a JSON file, whose rewrite is recorded whole in `edit`. */
  readonly line?: {
    readonly from: string;
    readonly to: string;
    readonly hunk: LineHunk;
  };
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
  /** For each wanted role a YAML file already has, its whole line as it stands, with
   *  its terminator. Empty when `refused`, and in a JSON file. */
  readonly current: Readonly<Record<string, string>>;
  /** Every entry the host's `modelRoles` held before this edit, as role and value
   *  (unquoted), in file order. Empty when `refused`. */
  readonly host: readonly (readonly [role: string, value: string])[];
  /** The existing lines `retarget` moved (or, under `dry`, would). */
  readonly retargeted: readonly RetargetedModelRole[];
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
 *  - the file is a JSON document (JSON is YAML, and omp reads it as such) ⇒ the
 *    entries join its `modelRoles` object and the document is written back in the
 *    layout it had, when that layout is one JSON serialization reproduces byte for
 *    byte; otherwise it is refused.
 *  - `modelRoles` holds a value this cannot safely extend ⇒ nothing is written and
 *    `refused` says why.
 *
 * An entry whose role already has a key is never touched, whatever its value, unless
 * the caller names it in `retarget`.
 */
export function addModelRoles(
  path: string,
  wanted: readonly ModelRoleEntry[],
  opts: AddModelRolesOpts = {},
): AddModelRolesResult {
  const dry = opts.dry ?? false;
  const exists = existsSync(path);
  const text = exists ? readFileSync(path, 'utf8') : '';
  if (/^\s*\{/.test(text)) {
    return addJsonModelRoles(path, text, wanted, opts);
  }
  const lines = splitLines(text);
  const eol = lines.find(([, t]) => t !== '')?.[1] || '\n';

  const refuse = (reason: string): AddModelRolesResult => ({
    path,
    added: [],
    wrote: false,
    refused: reason,
    current: {},
    host: [],
    retargeted: [],
  });
  const nothing = { current: {}, host: [], retargeted: [] } as const;
  // `moved` is the text with the retargeted lines already changed: the lines install
  // gains are read against it, since a moved line is not an insertion.
  const finish = (
    added: readonly ModelRoleEntry[],
    moved: string,
    next: string,
    current: Record<string, string>,
    host: readonly (readonly [string, string])[],
    retargeted: readonly RetargetedModelRole[],
    adopted: (source: string) => LineHunk[] = () => [],
  ): AddModelRolesResult => {
    const rest = { current, host, retargeted };
    if (added.length === 0 && retargeted.length === 0) {
      return { path, added, wrote: false, ...rest };
    }
    if (dry) return { path, added, wrote: false, ...rest };
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, next);
    const hunks = [...lineHunks(moved, next), ...adopted(next)];
    return {
      path,
      added,
      wrote: true,
      ...rest,
      ...(hunks.length > 0 ? { edit: { created: !exists, hunks } } : {}),
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
    if (wanted.length === 0)
      return { path, added: [], wrote: false, ...nothing };
    const body = wanted.map((e) => modelRoleLine(e, '  ')).join(eol);
    const lead = text === '' || /[\r\n]$/.test(text) ? '' : eol;
    return finish(
      wanted,
      text,
      `${text}${lead}modelRoles:${eol}${body}${eol}`,
      {},
      [],
      [],
    );
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
  const host: [string, string][] = [];
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
      const content = line.slice(indent.length);
      const key = keyOf(content);
      if (key !== undefined) {
        present.add(key);
        if (!entryAt.has(key)) {
          entryAt.set(key, i);
          const head = TOP_LEVEL_KEY.exec(content)?.[0].length ?? 0;
          host.push([key, scalarOf(inlineValue(content.slice(head)))]);
        }
      }
    } else if (indent.length < entryIndent.length) {
      return refuse(
        '`modelRoles` has entries at inconsistent indentation, so an entry cannot be added safely',
      );
    }
  }

  const indent = entryIndent ?? '  ';
  const current: Record<string, string> = {};
  for (const e of wanted) {
    const i = entryAt.get(e.role);
    if (i !== undefined) {
      const [t, le] = lines[i] as [string, string];
      current[e.role] = t + le;
    }
  }
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
  // A block that is nothing BUT adopted entries under a bare `modelRoles:` key was
  // created by that install, key line included — it is recorded whole, so the key goes
  // with its last entry. A host's own entry in the block makes the key the host's.
  const wholeBlock =
    adopted.length > 0 &&
    (lines[at] as [string, string])[0] === 'modelRoles:' &&
    adopted.length === last - at &&
    adopted.every((i) => i > at && i <= last);
  const adoptedHunks = (source: string): LineHunk[] =>
    wholeBlock
      ? [adoptedHunk(source, at, last - at + 1)]
      : adopted.map((i) => adoptedHunk(source, i, 1));

  // The seeds to move: the line changes in place, so the file keeps its order, and the
  // change is not read as an insertion, which an uninstall would take out whole.
  const moves: {
    role: string;
    value: string;
    at: number;
    from: string;
    to: string;
  }[] = [];
  for (const e of opts.retarget ?? []) {
    const i = entryAt.get(e.role);
    if (i === undefined) continue;
    const [t, le] = lines[i] as [string, string];
    const line = modelRoleLine(e, indent);
    if (t !== line)
      moves.push({
        role: e.role,
        value: e.value,
        at: i,
        from: t + le,
        to: line + le,
      });
  }
  const moved = lines.map(
    ([t, le], i) => moves.find((m) => m.at === i)?.to ?? t + le,
  );
  const movedText = moved.join('');
  const retargetedOf = (source: string): RetargetedModelRole[] =>
    moves.map((m) => ({
      role: m.role,
      value: m.value,
      line: { from: m.from, to: m.to, hunk: adoptedHunk(source, m.at, 1) },
    }));

  const missing = wanted.filter((e) => !present.has(e.role));
  if (missing.length === 0) {
    if (moves.length > 0) {
      return finish(
        [],
        movedText,
        movedText,
        current,
        host,
        retargetedOf(movedText),
      );
    }
    return adopted.length === 0
      ? { path, added: [], wrote: false, current, host, retargeted: [] }
      : {
          path,
          added: [],
          wrote: false,
          current,
          host,
          retargeted: [],
          edit: { created: false, hunks: adoptedHunks(text) },
        };
  }

  const inserted = missing.map((e) => modelRoleLine(e, indent));
  // The anchor line may be the file's last, with no terminator: it gains one, and
  // the new lines end the way the file did — without one.
  const anchorEol = (lines[last] as [string, string])[1];
  const head = moved.slice(0, last).join('');
  const anchor = moved[last] as string;
  const tail = moved.slice(last + 1).join('');
  const next =
    anchorEol === ''
      ? `${head}${anchor}${eol}${inserted.join(eol)}`
      : `${head}${anchor}${inserted.join(eol)}${eol}${tail}`;
  return finish(
    missing,
    movedText,
    next,
    current,
    host,
    retargetedOf(next),
    adoptedHunks,
  );
}

/** A YAML scalar as written on one line, unquoted: a double-quoted one read as the
 *  JSON string it is, a single-quoted one with its doubled quotes undone, a plain one
 *  as it stands. */
function scalarOf(raw: string): string {
  if (raw.length >= 2 && raw.startsWith('"') && raw.endsWith('"')) {
    try {
      return JSON.parse(raw) as string;
    } catch {
      return raw;
    }
  }
  if (raw.length >= 2 && raw.startsWith("'") && raw.endsWith("'")) {
    return raw.slice(1, -1).replace(/''/g, "'");
  }
  return raw;
}

/** The JSON layouts a document is written back in: compact, or indented by two
 *  spaces, four, or a tab. */
const JSON_LAYOUTS: readonly (number | string | undefined)[] = [
  undefined,
  2,
  4,
  '\t',
];

/**
 * {@link addModelRoles} for a file that is one JSON document. The document is parsed
 * and written back whole, so it is edited only where writing it back unchanged would
 * reproduce it byte for byte — in one of {@link JSON_LAYOUTS}, with its final line
 * ending — and nothing of the host's can be lost. The rewrite is recorded as the one
 * hunk it is, which an uninstall undoes while the file still reads as install left it.
 */
function addJsonModelRoles(
  path: string,
  text: string,
  wanted: readonly ModelRoleEntry[],
  opts: AddModelRolesOpts,
): AddModelRolesResult {
  const refuse = (reason: string): AddModelRolesResult => ({
    path,
    added: [],
    wrote: false,
    refused: reason,
    current: {},
    host: [],
    retargeted: [],
  });
  const isMapping = (v: unknown): v is Record<string, unknown> =>
    typeof v === 'object' && v !== null && !Array.isArray(v);
  let doc: unknown;
  try {
    doc = JSON.parse(text);
  } catch {
    return refuse(
      'the file opens a flow mapping that is not JSON, so a `modelRoles` entry cannot be added safely',
    );
  }
  if (!isMapping(doc)) {
    return refuse(
      'the file is a JSON document that is not an object, so a `modelRoles` key cannot be added safely',
    );
  }
  const terminator = /\r?\n$/.exec(text)?.[0] ?? '';
  const body = text.slice(0, text.length - terminator.length);
  const layout = JSON_LAYOUTS.findIndex(
    (l) => JSON.stringify(doc, null, l) === body,
  );
  if (layout < 0) {
    return refuse(
      'the file is JSON in a layout that writing it back would change, so a `modelRoles` entry cannot be added without rewriting bytes of yours',
    );
  }
  const roles = doc.modelRoles;
  if (
    roles !== undefined &&
    !(
      isMapping(roles) &&
      Object.values(roles).every((v) => typeof v === 'string')
    )
  ) {
    return refuse(
      '`modelRoles` is not a mapping of names to models, so an entry cannot be added safely',
    );
  }
  const held = (roles ?? {}) as Record<string, string>;
  const host = Object.entries(held);
  const added = wanted.filter((e) => !Object.hasOwn(held, e.role));
  const retargeted: RetargetedModelRole[] = (opts.retarget ?? [])
    .filter((e) => Object.hasOwn(held, e.role) && held[e.role] !== e.value)
    .map((e) => ({ role: e.role, value: e.value }));
  const result = { path, added, current: {}, host, retargeted };
  if ((added.length === 0 && retargeted.length === 0) || opts.dry === true) {
    return { ...result, wrote: false };
  }
  const next: Record<string, string> = { ...held };
  for (const e of [...retargeted, ...added]) next[e.role] = e.value;
  const written = `${JSON.stringify({ ...doc, modelRoles: next }, null, JSON_LAYOUTS[layout])}${terminator}`;
  writeFileSync(path, written);
  return {
    ...result,
    wrote: true,
    edit: { created: false, hunks: lineHunks(text, written) },
  };
}
