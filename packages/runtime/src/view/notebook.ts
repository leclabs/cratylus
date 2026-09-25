// ─────────────────────────────────────────────────────────────────────────────
// THE NOTEBOOK VIEW — the notes grouped by kind, then by topic, one line per
// note led by its title, behind the owed rulings that must be resolved first.
//
// A note's title is its name. Kinds are the `note` skill's; they arrive as
// display text, are never interpreted, and group in the order they first
// appear, as do topics within a kind. Which notes are owed rulings arrives
// computed: this module does not recognise them.
// ─────────────────────────────────────────────────────────────────────────────

import {
  type Diverged,
  type Incoherence,
  type Name,
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
  named,
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

/** The notebook view's input, computed at `commit`. */
export interface NotebookState {
  readonly commit: string;
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
    ? ` · blocks ${note.blocks.map(named).join(', ')}`
    : '';
  return `${inline(named(note.title))} — ${inline(note.body)}${blocks}`;
}

/** One note on one line, wherever it stands outside its kind and topic. */
export function noteLine(note: Note): string {
  return `${said(note)} · ${note.kind} · ${note.topic}`;
}

/** One note in full; `mark` follows its title (` — withdrawn`). */
function noteInFull(note: Note, mark = ''): string[] {
  return [
    `note: ${named(note.title)}${mark}`,
    `  kind: ${note.kind}`,
    `  topic: ${note.topic}`,
    ...field('body', note.body),
    ...list('blocks', note.blocks.map(named)),
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
    header('notebook', state.commit, [
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

  const byKind = new Map<string, Map<string, Note[]>>();
  for (const note of state.notes) {
    const topics = byKind.get(note.kind) ?? new Map<string, Note[]>();
    byKind.set(note.kind, topics);
    topics.set(note.topic, [...(topics.get(note.topic) ?? []), note]);
  }
  lines.push('notes by kind, then topic:');
  for (const [kind, topics] of byKind) {
    lines.push(`  ${kind}:`);
    for (const [topic, notes] of topics) {
      lines.push(`    ${topic}:`);
      for (const note of notes) lines.push(`      ${said(note)}`);
    }
  }
  return lines.join('\n');
}
