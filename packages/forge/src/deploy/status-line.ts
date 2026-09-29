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
//     layouts; without it the status renders beneath the line). omp reads a segment
//     list only under `statusLine.preset: custom`, so install lists `status` in the
//     host's own `custom` layout, moves a host on the default preset to `custom` with
//     that preset's layout written out, and leaves a host on any other named preset
//     as it is. `ensureStatusSegment`.
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
import type {
  StatusLayout,
  StatusSegmentHost,
} from '../core/harness-adapter.js';
import {
  inlineValue,
  isBlankOrComment,
  keyOf,
  splitLines,
} from './yaml-lines.js';

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

// ── omp: config.yml `statusLine` ────────────────────────────────────────────

/** omp's own name for the preset that reads its segment lists from the host's config.
 *  Under any other preset — the default one included — omp lays out the preset's own
 *  segments and ignores `leftSegments` altogether. */
const CUSTOM_PRESET = 'custom';

/** omp's key for the row it prints beneath the editor repeating each extension's
 *  status; on by default. */
const HOOK_STATUS_KEY = 'showHookStatus';

/**
 *   - `added`        — the host's status line now lists the segment, or now hides the
 *                      row that would repeat it (written, or under `dry` would be);
 *                      `written` says what went in.
 *   - `present`      — the host is on `custom`, already lists it, and set
 *                      `showHookStatus`; the file is as it was.
 *   - `other-preset` — the host chose a named preset other than `custom`, whose layout
 *                      is the preset's own and has no such segment. Its choice is not
 *                      ours to change: the file is as it was, and `preset` names it.
 *   - `refused`      — a `statusLine` this cannot safely extend; the file is as it was.
 */
export type StatusSegmentState =
  | 'added'
  | 'present'
  | 'other-preset'
  | 'refused';

export interface StatusSegmentResult {
  readonly path: string;
  readonly state: StatusSegmentState;
  /** Whether the file was written. */
  readonly wrote: boolean;
  /** What this put in the file, one short description per key (`preset: custom`,
   *  `leftSegments: …`). Empty unless `added`. */
  readonly written: readonly string[];
  /** The preset the host is on, when `other-preset`. */
  readonly preset?: string;
  /** Why the file was left untouched, when `refused`. */
  readonly refused?: string;
}

export interface EnsureStatusSegmentOpts {
  /** Report what would be added and write nothing. */
  readonly dry?: boolean;
}

/** An insertion after line `at`, or the replacement of line `at`'s text. */
type Edit =
  | { readonly at: number; readonly replace: string }
  | { readonly at: number; readonly insert: readonly string[] };

// A sequence entry: `-` alone, or `-` and a blank.
const SEQ_ITEM = /^-(?:[ \t]|$)/;

const indentOf = (line: string): string =>
  (/^[ \t]*/.exec(line) as RegExpExecArray)[0];

/** A scalar as YAML reads it: quotes removed, nothing else interpreted. `undefined`
 *  for anything that is not one — a flow collection, an anchor, an alias, a tag or a
 *  block scalar — because it cannot be compared with a segment id. */
function scalarOf(text: string): string | undefined {
  const t = text.replace(/(^|[ \t])#.*$/, '').trim();
  if (/^[[\]{}&*!|>%@`]/.test(t)) return undefined;
  const q = /^"([^"]*)"$|^'([^']*)'$/.exec(t);
  return q ? (q[1] ?? q[2] ?? '') : t;
}

/** The value text of the `key: value` line `content` — what follows its colon. */
const inlineOf = (content: string): string =>
  inlineValue(content.slice(content.indexOf(':') + 1));

/** `key:` and one `- item` line per item, the items one step in from `indent`. */
function listLines(
  key: string,
  items: readonly string[],
  indent: string,
): string[] {
  return [`${indent}${key}:`, ...items.map((item) => `${indent}  - ${item}`)];
}

/** `segmentOptions:` and its nested mapping, one step in per level. */
function optionLines(options: StatusLayout['segmentOptions'], indent: string) {
  return [
    `${indent}segmentOptions:`,
    ...Object.entries(options).flatMap(([segment, opts]) => [
      `${indent}  ${segment}:`,
      ...Object.entries(opts).map(([k, v]) => `${indent}    ${k}: ${v}`),
    ]),
  ];
}

/** What appending the segment to the block or one-line flow list at `listAt` takes:
 *  nothing (already listed), a reason it cannot be done, or the edit. */
function planListEdit(
  lines: readonly (readonly [string, string])[],
  listAt: number,
  indent: string,
  segment: string,
):
  | { readonly kind: 'present' }
  | { readonly kind: 'refused'; readonly why: string }
  | { readonly kind: 'edit'; readonly edit: Edit } {
  const keyLine = (lines[listAt] as readonly [string, string])[0];
  const value = inlineOf(keyLine.slice(indent.length));

  // A one-line flow sequence: `[vim, model]`.
  if (value !== '') {
    const flow = /^\[(.*)\]$/.exec(value);
    if (flow === null) {
      return {
        kind: 'refused',
        why: '`leftSegments` is not a list this can extend (a scalar, anchor, alias, tag, or a flow list that is not on one line)',
      };
    }
    const flowItems = (flow[1] as string)
      .split(',')
      .filter((s) => s.trim() !== '')
      .map(scalarOf);
    if (flowItems.includes(undefined)) {
      return {
        kind: 'refused',
        why: '`leftSegments` holds an item this cannot read',
      };
    }
    if (flowItems.includes(segment)) return { kind: 'present' };
    // The segment goes before the closing bracket — the last one ahead of any comment.
    const colon = keyLine.indexOf(':');
    const comment = /[ \t]#/.exec(keyLine.slice(colon));
    const close = keyLine.lastIndexOf(
      ']',
      comment ? colon + comment.index : keyLine.length,
    );
    const before = keyLine.slice(0, close);
    const kept = before.trimEnd();
    const sep = kept.endsWith('[') ? '' : kept.endsWith(',') ? ' ' : ', ';
    return {
      kind: 'edit',
      edit: {
        at: listAt,
        replace: `${kept}${sep}${segment}${before.slice(kept.length)}${keyLine.slice(close)}`,
      },
    };
  }

  // A block sequence: the `- item` lines after the key.
  let seqIndent: string | undefined;
  let lastItem = -1;
  const items: (string | undefined)[] = [];
  for (let i = listAt + 1; i < lines.length; i++) {
    const line = (lines[i] as readonly [string, string])[0];
    if (isBlankOrComment(line)) continue;
    const ind = indentOf(line);
    const body = line.slice(ind.length);
    const inList =
      ind.length > indent.length ||
      (ind.length === indent.length && SEQ_ITEM.test(body));
    if (!inList) break;
    if (seqIndent === undefined) {
      if (!SEQ_ITEM.test(body)) {
        return {
          kind: 'refused',
          why: '`leftSegments` is not a list of `- item` lines, so a segment cannot be added safely',
        };
      }
      seqIndent = ind;
    }
    lastItem = i;
    if (ind === seqIndent && SEQ_ITEM.test(body)) {
      items.push(scalarOf(body.replace(/^-[ \t]*/, '')));
    }
  }
  if (seqIndent === undefined) {
    return {
      kind: 'refused',
      why: '`leftSegments` holds no list (null or empty), so a segment cannot be added safely',
    };
  }
  if (items.some((s) => s === undefined || s === '')) {
    return {
      kind: 'refused',
      why: '`leftSegments` holds an item this cannot read',
    };
  }
  if (items.includes(segment)) return { kind: 'present' };
  return {
    kind: 'edit',
    edit: { at: lastItem, insert: [`${seqIndent}- ${segment}`] },
  };
}

/** The file's text with `edits` applied. Inserts that share a line are one insert, in
 *  the order given. An insert after the file's last line, which carries no terminator,
 *  gives that line one and leaves the new last line without — as the file ended. */
function applyEdits(
  lines: readonly (readonly [string, string])[],
  edits: readonly Edit[],
  eol: string,
): string {
  const out = lines.map(([t, e]) => [t, e] as [string, string]);
  const inserts = new Map<number, string[]>();
  for (const edit of edits) {
    if ('replace' in edit) (out[edit.at] as [string, string])[0] = edit.replace;
    else
      inserts.set(edit.at, [...(inserts.get(edit.at) ?? []), ...edit.insert]);
  }
  // Bottom-up, so an insert never moves the line another is anchored to.
  for (const [at, added] of [...inserts].sort((a, b) => b[0] - a[0])) {
    const anchor = out[at] as [string, string];
    const unterminated = anchor[1] === '';
    if (unterminated) anchor[1] = eol;
    out.splice(
      at + 1,
      0,
      ...added.map(
        (t, i) =>
          [t, unterminated && i === added.length - 1 ? '' : eol] as [
            string,
            string,
          ],
      ),
    );
  }
  return out.map(([t, e]) => t + e).join('');
}

/**
 * Make the host's omp status line show an extension's status inline: list the harness's
 * status segment (`host.segment`) in the layout, in the YAML file at `path`.
 *
 * omp reads a segment list only under `statusLine.preset: custom`, so what has to be
 * written depends on the preset the host is on:
 *
 *  - NO PRESET SET — the harness's default preset is in effect, and its layout has no
 *    such segment. `preset: custom` is added together with the default layout's own
 *    left segments plus the segment, its right segments and its segment options, so
 *    the line looks as it did with the badge added. A `leftSegments`, `rightSegments`
 *    or `segmentOptions` the host already wrote is kept as it is (the segment is
 *    appended to a list without it) and only the missing ones are filled in.
 *  - `preset: custom` — the segment is appended to the host's `leftSegments` after its
 *    last item, or, where the host lists none, `host.customLeft` plus the segment is
 *    written. Nothing is reordered, removed or requoted. A list that has it is left.
 *  - ANY OTHER PRESET (`default` written out included) — the host's choice; nothing is
 *    written and `other-preset` names it.
 *
 * WHEREVER THE SEGMENT IS NOW IN THE LIVE LAYOUT, `showHookStatus: false` is written
 * too unless the host set that key: omp prints every extension's status beneath the
 * editor as well by default, so the badge would show twice, and the segment already
 * draws every status inline, so none is hidden. A host left on another preset gets
 * neither the segment nor this. A host on `custom` that already lists the segment
 * and set the key is left byte-identical.
 *
 * A file with no `statusLine` is the no-preset case, and is created when absent.
 * Anything this cannot extend safely (a `statusLine` that is a flow mapping, a scalar,
 * anchored or tagged; a `preset` that is not a plain scalar; a `leftSegments` that is
 * not a list, or a flow list split across lines) is left, and `refused` says why.
 * Every key the host set keeps its value, and every byte outside the inserted lines
 * survives.
 */
export function ensureStatusSegment(
  path: string,
  host: StatusSegmentHost,
  opts: EnsureStatusSegmentOpts = {},
): StatusSegmentResult {
  const dry = opts.dry ?? false;
  const segment = host.segment;
  const layout = host.defaultLayout;
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
  const finish = (
    next: string,
    written: readonly string[],
  ): StatusSegmentResult => {
    if (!dry) {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, next);
    }
    return { path, state: 'added', wrote: !dry, written };
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

  // What the default layout is, said key by key — for the file, and for the report.
  const defaultLeft = [...layout.left, segment];
  const layoutWritten = {
    preset: `preset: ${CUSTOM_PRESET}`,
    left: `leftSegments: ${defaultLeft.join(', ')}`,
    right: `rightSegments: ${layout.right.join(', ')}`,
    options: `segmentOptions: ${Object.keys(layout.segmentOptions).join(', ')}`,
    hooks: `${HOOK_STATUS_KEY}: false`,
  };

  // ── NO `statusLine`: append the default layout under `custom` ────────────────
  if (at === -1) {
    const lead = text === '' || /[\r\n]$/.test(text) ? '' : eol;
    const block = [
      'statusLine:',
      `  preset: ${CUSTOM_PRESET}`,
      ...listLines('leftSegments', defaultLeft, '  '),
      ...listLines('rightSegments', layout.right, '  '),
      ...optionLines(layout.segmentOptions, '  '),
      `  ${HOOK_STATUS_KEY}: false`,
    ];
    return finish(
      `${text}${lead}${block.join(eol)}${eol}`,
      Object.values(layoutWritten),
    );
  }

  // ── `statusLine` IS PRESENT ───────────────────────────────────────────────────
  if (inlineOf((lines[at] as [string, string])[0]) !== '') {
    return refuse(
      '`statusLine` holds an inline value (a flow mapping, scalar, anchor, alias or tag), which cannot be extended by inserting lines',
    );
  }

  // The block's own lines: every following line until one back at column 0.
  let entryIndent: string | undefined;
  let last = at; // the last line of the block that carries content
  const keyAt = new Map<string, number>(); // each first-level key's first line
  for (let i = at + 1; i < lines.length; i++) {
    const line = (lines[i] as [string, string])[0];
    if (isBlankOrComment(line)) continue;
    if (!/^[ \t]/.test(line)) break;
    const indent = indentOf(line);
    if (entryIndent === undefined) {
      entryIndent = indent;
      if (keyOf(line.slice(indent.length)) === undefined) {
        return refuse(
          '`statusLine` is not a mapping of `key: value` lines, so a layout cannot be added safely',
        );
      }
    }
    last = i;
    if (indent.length < entryIndent.length) {
      return refuse(
        '`statusLine` has entries at inconsistent indentation, so a layout cannot be added safely',
      );
    }
    const key =
      indent === entryIndent ? keyOf(line.slice(indent.length)) : undefined;
    if (key !== undefined && !keyAt.has(key)) keyAt.set(key, i);
  }
  const indent = entryIndent ?? '  ';

  // WHICH PRESET the host is on decides what a segment list means.
  const presetAt = keyAt.get('preset');
  let preset: string | undefined;
  if (presetAt !== undefined) {
    const raw = inlineOf(
      (lines[presetAt] as [string, string])[0].slice(indent.length),
    );
    preset = raw === '' ? undefined : scalarOf(raw);
    if (preset === undefined) {
      return refuse(
        '`preset` holds no plain value (a null, flow collection, anchor, alias or tag), so the layout in effect cannot be told',
      );
    }
  }
  if (preset !== undefined && preset !== CUSTOM_PRESET) {
    return { path, state: 'other-preset', wrote: false, written: [], preset };
  }
  const onCustom = preset === CUSTOM_PRESET;

  const edits: Edit[] = [];
  const inserted: string[] = [];
  const written: string[] = [];
  if (!onCustom) {
    inserted.push(`${indent}preset: ${CUSTOM_PRESET}`);
    written.push(layoutWritten.preset);
  }

  const leftAt = keyAt.get('leftSegments');
  if (leftAt === undefined) {
    const left = onCustom ? [...host.customLeft, segment] : defaultLeft;
    inserted.push(...listLines('leftSegments', left, indent));
    written.push(`leftSegments: ${left.join(', ')}`);
  } else {
    const plan = planListEdit(lines, leftAt, indent, segment);
    if (plan.kind === 'refused') return refuse(plan.why);
    if (plan.kind === 'edit') {
      edits.push(plan.edit);
      written.push(`leftSegments: + ${segment}`);
    }
  }
  // The rest of the default layout is written only where the host lacks it, and only
  // when the host is moving off the default preset: on `custom` the host's own choice
  // — an absent key included — is what it has.
  if (!onCustom) {
    if (!keyAt.has('rightSegments')) {
      inserted.push(...listLines('rightSegments', layout.right, indent));
      written.push(layoutWritten.right);
    }
    if (!keyAt.has('segmentOptions')) {
      inserted.push(...optionLines(layout.segmentOptions, indent));
      written.push(layoutWritten.options);
    }
  }
  // THE BADGE RENDERS ONCE. Wherever the layout now has the segment, the segment draws
  // every extension's status inline, so the row omp also prints beneath the editor
  // (`showHookStatus`, on by default) repeats each of them and hides none. Off unless
  // the host chose. Never here for a host left on another preset: its layout has no
  // segment, and that row is the only place a status shows.
  if (!keyAt.has(HOOK_STATUS_KEY)) {
    inserted.push(`${indent}${HOOK_STATUS_KEY}: false`);
    written.push(layoutWritten.hooks);
  }
  if (inserted.length > 0) edits.push({ at: last, insert: inserted });
  if (edits.length === 0) {
    return { path, state: 'present', wrote: false, written: [] };
  }
  return finish(applyEdits(lines, edits, eol), written);
}
