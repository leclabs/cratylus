// The host's status line — where the persona badge is made visible, on each harness.
//
// The badge itself is projected (a file per persona, and on Claude Code one worker);
// what only install can do is make the HOST'S status line show it. That is the host's
// own configuration, and the two harnesses keep it in different shapes.
//
//   · CLAUDE CODE'S status line is ONE command in `settings.json`, with no segments to
//     add to, so the badge cannot sit beside the host's own line. Where the host has
//     none, install sets the badge worker as the line. Where it has one, install never
//     replaces it: it says so and offers to WRAP it — the worker runs the host's
//     command and puts the badge in front of its output. `ensureBadgeStatusLine`.
//
//   · OMP's status line is a list of segments, and an extension's status renders only
//     where the host's layout lists the `status` segment (absent from omp's own
//     layout; without it the status renders beneath the line). Install adds `status`
//     to the host's `statusLine.leftSegments`. `ensureStatusSegment`.
//
// BOTH FILES ARE HOST-OWNED, so both are added to and never re-emitted. The YAML is
// edited as text — whole lines inserted, no library reading it and none writing it —
// for the reason `model-roles.ts` gives: a serializer would rewrite the operator's
// comments, quoting, key order and unrelated keys, and every byte that is not the new
// entry must survive. What an insertion cannot safely extend is left untouched and
// reported. `settings.json` is JSON, merged the way `deploy` already merges its
// `hooks` block into it.
//
// Both take the path and what to write as DATA: which harness, which file and which
// command are the caller's facts, so nothing here imports an adapter.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

// ── Claude Code: settings.json `statusLine` ─────────────────────────────────

/**
 * What became of the host's `statusLine`.
 *   - `set`     — the host had none; the badge worker is now the line.
 *   - `wrapped` — the host's own command now runs inside the worker.
 *   - `kept`    — already the worker, or already wrapped in it; nothing to do.
 *   - `offer`   — the host's own line, left as it is; wrapping was not asked for.
 *   - `refused` — a `statusLine` (or settings file) this cannot safely extend.
 */
export type BadgeStatusLineState =
  | 'set'
  | 'wrapped'
  | 'kept'
  | 'offer'
  | 'refused';

export interface BadgeStatusLineResult {
  readonly path: string;
  readonly state: BadgeStatusLineState;
  /** Whether the file was written. Never under `dry`, never for `kept`, `offer` or
   *  `refused`. */
  readonly wrote: boolean;
  /** Why nothing was done, when `refused`. */
  readonly refused?: string;
}

export interface EnsureBadgeStatusLineOpts {
  /** Wrap the host's own command in the worker instead of only offering to. */
  readonly wrap?: boolean;
  /** Report what would change and write nothing. */
  readonly dry?: boolean;
}

/** A string as ONE shell word, single-quoted — the only quoting with nothing to
 *  interpret inside it. An embedded `'` closes the quote, is escaped, and reopens. */
function shellQuote(s: string): string {
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

/**
 * Make the host's Claude Code status line show the persona badge, without ever
 * replacing what the host has.
 *
 *  - no `statusLine` ⇒ `{type: "command", command: workerCommand}` is set.
 *  - it already IS `workerCommand`, or wraps a command with it ⇒ nothing changes, so
 *    a second run never wraps twice.
 *  - it is the host's own command ⇒ left byte-identical and reported as `offer`; with
 *    `opts.wrap`, its command becomes `workerCommand '<host command>'` — the host's
 *    command verbatim as the worker's one argument — and every other key it carries
 *    (`padding`, …) is kept.
 *  - it is anything else (not an object, not a `command` line, no command), or the
 *    file is not a JSON object ⇒ nothing is written and `refused` says why.
 *
 * `workerCommand` is the adapter's own (`HarnessAdapter.statusLine.command`).
 */
export function ensureBadgeStatusLine(
  path: string,
  workerCommand: string,
  opts: EnsureBadgeStatusLineOpts = {},
): BadgeStatusLineResult {
  const refuse = (refused: string): BadgeStatusLineResult => ({
    path,
    state: 'refused',
    wrote: false,
    refused,
  });
  const write = (
    settings: Record<string, unknown>,
    state: 'set' | 'wrapped',
  ): BadgeStatusLineResult => {
    if (opts.dry) return { path, state, wrote: false };
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, `${JSON.stringify(settings, null, 2)}\n`);
    return { path, state, wrote: true };
  };

  let settings: Record<string, unknown> = {};
  if (existsSync(path)) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(path, 'utf8'));
    } catch (e) {
      return refuse(`the file is not valid JSON (${(e as Error).message})`);
    }
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return refuse('the file is not a JSON object');
    }
    settings = parsed as Record<string, unknown>;
  }

  const host = settings.statusLine as
    | { type?: unknown; command?: unknown }
    | null
    | undefined;
  if (host === undefined || host === null) {
    return write(
      { ...settings, statusLine: { type: 'command', command: workerCommand } },
      'set',
    );
  }
  if (
    typeof host !== 'object' ||
    Array.isArray(host) ||
    host.type !== 'command' ||
    typeof host.command !== 'string' ||
    host.command === ''
  ) {
    return refuse(
      '`statusLine` is not a `command` status line, so there is no command to wrap',
    );
  }
  const command = host.command;
  if (command === workerCommand || command.startsWith(`${workerCommand} `)) {
    return { path, state: 'kept', wrote: false };
  }
  if (!opts.wrap) return { path, state: 'offer', wrote: false };
  return write(
    {
      ...settings,
      statusLine: {
        ...host,
        command: `${workerCommand} ${shellQuote(command)}`,
      },
    },
    'wrapped',
  );
}

// ── omp: config.yml `statusLine.leftSegments` ───────────────────────────────

/** The segment omp renders an extension's status in. */
export const OMP_STATUS_SEGMENT = 'status';

/** omp's own left segments for a custom layout (`CUSTOM_STATUS_LINE_DEFAULTS.left`):
 *  what the host has when it names none, so what a host with no list gets — plus
 *  {@link OMP_STATUS_SEGMENT}. */
export const OMP_DEFAULT_LEFT_SEGMENTS: readonly string[] = [
  'vim',
  'model',
  'mode',
  'path',
  'git',
  'pr',
];

/**
 *   - `added`   — `status` is now in `statusLine.leftSegments` (written, or under
 *                 `dry` would be): `wrote`d as omp's default list plus `status` when
 *                 the host had no list, and appended to the host's own list otherwise.
 *   - `present` — the list already has it; the file is as it was.
 *   - `refused` — a `statusLine` this cannot safely extend; the file is as it was.
 */
export type StatusSegmentState = 'added' | 'present' | 'refused';

export interface StatusSegmentResult {
  readonly path: string;
  readonly state: StatusSegmentState;
  /** Whether the file was written. */
  readonly wrote: boolean;
  /** The segment ids this put in the file — the whole default list when the host had
   *  none, just `status` when it appended. Empty unless `added`. */
  readonly written: readonly string[];
  /** Why the file was left untouched, when `refused`. */
  readonly refused?: string;
}

export interface EnsureStatusSegmentOpts {
  /** Report what would be added and write nothing. */
  readonly dry?: boolean;
}

// One `key:` at the head of a line, quoted or plain. A plain key may not open with a
// YAML indicator, which is what keeps `- item`, `[a]`, `{a: b}` and `&a x: y` from
// reading as keys.
const KEY_LINE =
  /^(?:"([^"]*)"|'([^']*)'|((?!-(?:[ \t]|$))[^\s#'"[\]{}?&*!|>%@`,][^:#]*?))[ \t]*:(?:[ \t]|$)/;
// A sequence entry: `-` alone, or `-` and a blank.
const SEQ_ITEM = /^-(?:[ \t]|$)/;

/** `[text, terminator]` for each line, so the file's own line endings are kept. */
function splitLines(text: string): [string, string][] {
  const lines: [string, string][] = [];
  const re = /([^\r\n]*)(\r\n|\n|\r|$)/gy;
  let m: RegExpExecArray | null = re.exec(text);
  while (m !== null && m.index < text.length) {
    lines.push([m[1] as string, m[2] as string]);
    m = re.exec(text);
  }
  return lines;
}

const isBlankOrComment = (line: string): boolean => {
  const t = line.trim();
  return t === '' || t.startsWith('#');
};

const indentOf = (line: string): string =>
  (/^[ \t]*/.exec(line) as RegExpExecArray)[0];

/** The key a line names, or `undefined` when it is not a `key:` line. */
function keyOf(content: string): string | undefined {
  const m = KEY_LINE.exec(content);
  if (m === null) return undefined;
  return (m[1] ?? m[2] ?? m[3] ?? '').trim();
}

/** What follows a key's colon, comment removed. */
function inlineValue(content: string): string {
  return content
    .slice(content.indexOf(':') + 1)
    .replace(/(^|[ \t])#.*$/, '')
    .trim();
}

/** A scalar as YAML reads it: quotes removed, nothing else interpreted. `undefined`
 *  for anything that is not one — a flow collection, an anchor, an alias, a tag or a
 *  block scalar — because it cannot be compared with a segment id. */
function scalarOf(text: string): string | undefined {
  const t = text.replace(/(^|[ \t])#.*$/, '').trim();
  if (/^[[\]{}&*!|>%@`]/.test(t)) return undefined;
  const q = /^"([^"]*)"$|^'([^']*)'$/.exec(t);
  return q ? (q[1] ?? q[2] ?? '') : t;
}

/** The lines omp's default list plus `status` occupies, at `indent`. */
function defaultListLines(indent: string, itemIndent: string): string[] {
  return [
    `${indent}leftSegments:`,
    ...[...OMP_DEFAULT_LEFT_SEGMENTS, OMP_STATUS_SEGMENT].map(
      (id) => `${itemIndent}- ${id}`,
    ),
  ];
}

/**
 * Make sure omp's `status` segment is in the host's `statusLine.leftSegments` in the
 * YAML file at `path`.
 *
 *  - the file has no `statusLine` ⇒ a `statusLine:` block holding omp's default left
 *    list plus `status` is appended at the end; the file is created when absent.
 *  - `statusLine` is a block mapping with no `leftSegments` ⇒ that list is inserted
 *    after the mapping's last entry, at the indentation its entries use.
 *  - `leftSegments` is a block sequence, or a one-line flow sequence, without `status`
 *    ⇒ `status` is appended to it, after the last item. Nothing is reordered,
 *    removed or requoted.
 *  - it already lists `status` ⇒ the file is not touched.
 *  - anything this cannot extend safely (a `statusLine` that is a flow mapping, a
 *    scalar, anchored or tagged; a `leftSegments` that is not a list; a list split
 *    across lines in flow style) ⇒ nothing is written and `refused` says why.
 */
export function ensureStatusSegment(
  path: string,
  opts: EnsureStatusSegmentOpts = {},
): StatusSegmentResult {
  const dry = opts.dry ?? false;
  const text = existsSync(path) ? readFileSync(path, 'utf8') : '';
  const lines = splitLines(text);
  const eol = lines.find(([, t]) => t !== '')?.[1] || '\n';

  const refuse = (refused: string): StatusSegmentResult => ({
    path,
    state: 'refused',
    wrote: false,
    written: [],
    refused,
  });
  const present: StatusSegmentResult = {
    path,
    state: 'present',
    wrote: false,
    written: [],
  };
  const finish = (next: string, written: string[]): StatusSegmentResult => {
    if (!dry) {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, next);
    }
    return { path, state: 'added', wrote: !dry, written };
  };
  /** `inserted` lines go after line `last`; the anchor may be the file's last line and
   *  carry no terminator, in which case it gains one and the new lines end the way the
   *  file did — without. */
  const insertAfter = (
    last: number,
    inserted: readonly string[],
    written: string[],
  ): StatusSegmentResult => {
    const [anchorText, anchorEol] = lines[last] as [string, string];
    const head = lines
      .slice(0, last)
      .map(([t, e]) => t + e)
      .join('');
    const tail = lines
      .slice(last + 1)
      .map(([t, e]) => t + e)
      .join('');
    return finish(
      anchorEol === ''
        ? `${head}${anchorText}${eol}${inserted.join(eol)}`
        : `${head}${anchorText}${anchorEol}${inserted.join(eol)}${eol}${tail}`,
      written,
    );
  };

  // The top-level `statusLine` key — and, while looking, whether the document is a
  // block mapping at all, since appending a key to anything else corrupts it.
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
          'the file is not a block mapping at its top level, so a `statusLine:` key cannot be added safely',
        );
      }
      continue;
    }
    sawTopLevel = true;
    if (key === 'statusLine') {
      at = i;
      break;
    }
  }

  const written = [...OMP_DEFAULT_LEFT_SEGMENTS, OMP_STATUS_SEGMENT];

  // ── NO `statusLine`: append a block ───────────────────────────────────────────
  if (at === -1) {
    const lead = text === '' || /[\r\n]$/.test(text) ? '' : eol;
    const block = ['statusLine:', ...defaultListLines('  ', '    ')];
    return finish(`${text}${lead}${block.join(eol)}${eol}`, written);
  }

  // ── `statusLine` IS PRESENT ───────────────────────────────────────────────────
  if (inlineValue((lines[at] as [string, string])[0]) !== '') {
    return refuse(
      '`statusLine` holds an inline value (a flow mapping, scalar, anchor, alias or tag), which cannot be extended by inserting lines',
    );
  }

  // The block's own lines: every following line until one back at column 0.
  let entryIndent: string | undefined;
  let last = at; // the last line of the block that carries content
  let listAt = -1; // the `leftSegments` line, when there is one
  for (let i = at + 1; i < lines.length; i++) {
    const line = (lines[i] as [string, string])[0];
    if (isBlankOrComment(line)) continue;
    if (!/^[ \t]/.test(line)) break;
    const indent = indentOf(line);
    if (entryIndent === undefined) {
      entryIndent = indent;
      if (keyOf(line.slice(indent.length)) === undefined) {
        return refuse(
          '`statusLine` is not a mapping of `key: value` lines, so a list cannot be added safely',
        );
      }
    }
    last = i;
    if (indent.length < entryIndent.length) {
      return refuse(
        '`statusLine` has entries at inconsistent indentation, so a list cannot be added safely',
      );
    }
    if (
      indent === entryIndent &&
      keyOf(line.slice(indent.length)) === 'leftSegments' &&
      listAt === -1
    ) {
      listAt = i;
    }
  }

  const indent = entryIndent ?? '  ';

  // ── NO `leftSegments`: insert omp's default list plus `status` ────────────────
  if (listAt === -1) {
    return insertAfter(last, defaultListLines(indent, `${indent}  `), written);
  }

  // ── `leftSegments` IS PRESENT ────────────────────────────────────────────────
  const keyLine = (lines[listAt] as [string, string])[0];
  const value = inlineValue(keyLine.slice(indent.length));

  // A one-line flow sequence: `[vim, model]`.
  if (value !== '') {
    const flow = /^\[(.*)\]$/.exec(value);
    if (flow === null) {
      return refuse(
        '`leftSegments` is not a list this can extend (a scalar, anchor, alias, tag, or a flow list that is not on one line)',
      );
    }
    const flowItems = (flow[1] as string)
      .split(',')
      .filter((s) => s.trim() !== '')
      .map(scalarOf);
    if (flowItems.includes(undefined)) {
      return refuse('`leftSegments` holds an item this cannot read');
    }
    if (flowItems.includes(OMP_STATUS_SEGMENT)) return present;
    // `status` goes before the closing bracket — the last one ahead of any comment.
    const colon = keyLine.indexOf(':');
    const comment = /[ \t]#/.exec(keyLine.slice(colon));
    const close = keyLine.lastIndexOf(
      ']',
      comment ? colon + comment.index : keyLine.length,
    );
    const before = keyLine.slice(0, close);
    const kept = before.trimEnd();
    const sep = kept.endsWith('[') ? '' : kept.endsWith(',') ? ' ' : ', ';
    const edited = `${kept}${sep}${OMP_STATUS_SEGMENT}${before.slice(kept.length)}${keyLine.slice(close)}`;
    return finish(
      lines.map(([t, e], i) => (i === listAt ? edited + e : t + e)).join(''),
      [OMP_STATUS_SEGMENT],
    );
  }

  // A block sequence: the `- item` lines after the key.
  let seqIndent: string | undefined;
  let lastItem = -1;
  const items: (string | undefined)[] = [];
  for (let i = listAt + 1; i < lines.length; i++) {
    const line = (lines[i] as [string, string])[0];
    if (isBlankOrComment(line)) continue;
    const ind = indentOf(line);
    const body = line.slice(ind.length);
    const inList =
      ind.length > indent.length ||
      (ind.length === indent.length && SEQ_ITEM.test(body));
    if (!inList) break;
    if (seqIndent === undefined) {
      if (!SEQ_ITEM.test(body)) {
        return refuse(
          '`leftSegments` is not a list of `- item` lines, so a segment cannot be added safely',
        );
      }
      seqIndent = ind;
    }
    lastItem = i;
    if (ind === seqIndent && SEQ_ITEM.test(body)) {
      items.push(scalarOf(body.replace(/^-[ \t]*/, '')));
    }
  }
  if (seqIndent === undefined) {
    return refuse(
      '`leftSegments` holds no list (null or empty), so a segment cannot be added safely',
    );
  }
  if (items.some((s) => s === undefined || s === '')) {
    return refuse('`leftSegments` holds an item this cannot read');
  }
  if (items.includes(OMP_STATUS_SEGMENT)) return present;
  return insertAfter(
    lastItem,
    [`${seqIndent}- ${OMP_STATUS_SEGMENT}`],
    [OMP_STATUS_SEGMENT],
  );
}
