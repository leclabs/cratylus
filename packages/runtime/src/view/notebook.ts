// ─────────────────────────────────────────────────────────────────────────────
// THE NOTEBOOK VIEW — the notes grouped by kind, then by topic, behind the owed
// rulings that must be resolved first.
//
// Kinds are the `note` skill's; they arrive as display text, are never
// interpreted, and group in the order they first appear, as do topics within a
// kind. Which notes are owed rulings arrives computed: this module does not
// recognise them.
// ─────────────────────────────────────────────────────────────────────────────

import {
  type Diverged,
  type Incoherence,
  count,
  divergedLines,
  field,
  header,
  incoherenceLine,
  inline,
  list,
  resolveFirst,
} from './layers.js';

/** A note's state as its reader sees it. */
export interface Note {
  readonly kind: string;
  readonly topic: string;
  readonly body: string;
  /** The names of the plans and units the note blocks. */
  readonly blocks: readonly string[];
}

/** A live note, with the entity identity that joins and selects it; never
 *  printed. */
export interface LiveNote extends Note {
  readonly entity: string;
}

/** The notebook computed at `commit`. */
export interface NotebookState {
  readonly commit: string;
  /** Every live note, in the order given. */
  readonly notes: readonly LiveNote[];
  /** The live notes that block what they name. */
  readonly owed: readonly LiveNote[];
  readonly diverged: readonly Diverged<Note>[];
  readonly incoherent: readonly Incoherence[];
}

/** What a note says, on one line: its body and what it blocks. */
function said(note: Note): string {
  const blocks = note.blocks.length
    ? ` · blocks ${note.blocks.join(', ')}`
    : '';
  return `${inline(note.body)}${blocks}`;
}

/** One note on one line, in any layer. */
export function noteLine(note: Note): string {
  return `${note.kind} · ${note.topic} — ${said(note)}`;
}

/** One note in full. */
function noteInFull(note: Note): string[] {
  return [
    `note: ${note.kind} · ${note.topic}`,
    ...field('body', note.body),
    ...list('blocks', note.blocks),
  ];
}

/**
 * The notebook's view: the whole notebook, or, given `entity`, that live note in
 * full, or every version of that diverged note in full, beneath the header and
 * the resolve-first layer.
 */
export function notebookView(state: NotebookState, entity?: string): string {
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

  if (entity !== undefined) {
    const note = state.notes.find((n) => n.entity === entity);
    const diverged = state.diverged.find((d) => d.entity === entity);
    return [
      ...lines,
      ...(note
        ? noteInFull(note)
        : diverged
          ? divergedLines(diverged, noteInFull)
          : ['no live or diverged note is that entity']),
    ].join('\n');
  }

  const byKind = new Map<string, Map<string, LiveNote[]>>();
  for (const note of state.notes) {
    const topics = byKind.get(note.kind) ?? new Map<string, LiveNote[]>();
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
