// ─────────────────────────────────────────────────────────────────────────────
// THE NOTEBOOK VIEW — the notes grouped by kind, then by topic, one line per
// note led by its title, behind the owed rulings that must be resolved first.
//
// A diverged note keeps its place, marked, under the kind and topic of every
// version of it.
//
// A note's title is its name. Kinds are the `note` skill's; they arrive as
// display text, are never interpreted, and group in the order they first
// appear, as do topics within a kind. Which notes are owed rulings arrives
// computed: this module does not recognise them.
// ─────────────────────────────────────────────────────────────────────────────

import { type Name, printed } from '../record-store/names.js';
import {
  type Computed,
  type Diverged,
  type Incoherence,
  count,
  denotes,
  denotesAny,
  divergedLines,
  drilled,
  field,
  header,
  incoherenceLine,
  inline,
  list,
  resolveFirst,
} from './layers.js';

/** A note's whole state as its reader sees it. */
export interface Note {
  readonly title: Name;
  readonly kind: string;
  readonly topic: string;
  readonly body: string;
  /** The plans and units the note blocks. */
  readonly blocks: readonly Name[];
}

/** The notebook view's input. */
export interface NotebookState extends Computed {
  /** Every live note, in the order given. */
  readonly notes: readonly Note[];
  /** The live notes that block what they name. */
  readonly owed: readonly Note[];
  readonly diverged: readonly Diverged<Note>[];
  /** Withdrawn notes, each its last version, so a withdrawn holder of a
   *  shared title drills to what the view is given of it. */
  readonly withdrawn: readonly Note[];
  readonly incoherent: readonly Incoherence[];
}

/** What a note says, on one line, led by its title. */
function said(note: Note): string {
  const blocks = note.blocks.length
    ? ` · blocks ${note.blocks.map(printed).join('; ')}`
    : '';
  return `${inline(printed(note.title))} — ${inline(note.body)}${blocks}`;
}

/** One note on one line, wherever it stands outside its kind and topic. */
export function noteLine(note: Note): string {
  return `${said(note)} · ${note.kind} · ${note.topic}`;
}

/** One note in full; `mark` follows its title (` — withdrawn`). */
function noteInFull(note: Note, mark = ''): string[] {
  return [
    `note: ${printed(note.title)}${mark}`,
    `  kind: ${note.kind}`,
    `  topic: ${note.topic}`,
    ...field('body', note.body),
    ...list('blocks', note.blocks.map(printed)),
  ];
}

/**
 * The notebook's view: the whole notebook, or, given the `title` of a note,
 * every live or withdrawn note it names in full and every version of every
 * diverged note it names by any of its titles in full, beneath the header and
 * the resolve-first layer.
 */
export function notebookView(state: NotebookState, title?: Name): string {
  const lines = [
    header('notebook', state, [
      count(state.notes.length, 'note', 'notes'),
      count(state.owed.length, 'owed ruling', 'owed rulings'),
      `${state.diverged.length} diverged`,
      `${state.incoherent.length} incoherent`,
    ]),
    ...resolveFirst([
      ...state.diverged.flatMap((d) => divergedLines(d, (v) => [noteLine(v)])),
      ...state.incoherent.map(incoherenceLine),
      ...state.owed.map((note) => `owed ruling: ${noteLine(note)}`),
    ]),
  ];

  if (title !== undefined)
    return [
      ...lines,
      ...drilled(title, [
        ...state.notes
          .filter((n) => denotes(title, n.title))
          .map((n) => noteInFull(n)),
        ...state.withdrawn
          .filter((n) => denotes(title, n.title))
          .map((n) => noteInFull(n, ' — withdrawn')),
        ...state.diverged
          .filter((d) => denotesAny(title, d.names))
          .map((d) => divergedLines(d, (n) => noteInFull(n))),
      ]),
    ].join('\n');

  // Each note in its kind and topic, and a diverged one, marked, in the place
  // of every version of it.
  const byKind = new Map<string, Map<string, string[]>>();
  const place = (kind: string, topic: string, line: string): void => {
    const topics = byKind.get(kind) ?? new Map<string, string[]>();
    byKind.set(kind, topics);
    const lines = topics.get(topic) ?? [];
    if (!lines.includes(line)) topics.set(topic, [...lines, line]);
  };
  for (const note of state.notes) place(note.kind, note.topic, said(note));
  for (const d of state.diverged) {
    const line = `${d.names.map(printed).join(' or ')} — diverged, ${count(d.versions.length, 'version', 'versions')}${d.retracted.length ? ' and a retraction' : ''}`;
    for (const { value } of d.versions) place(value.kind, value.topic, line);
  }
  lines.push('notes by kind, then topic:');
  for (const [kind, topics] of byKind) {
    lines.push(`  ${kind}:`);
    for (const [topic, said] of topics) {
      lines.push(`    ${topic}:`);
      for (const line of said) lines.push(`      ${line}`);
    }
  }
  return lines.join('\n');
}
