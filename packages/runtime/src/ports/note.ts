// ─────────────────────────────────────────────────────────────────────────────
// The note capability PORT — the notebook, met in its own verbs.
//
// PURE INTERFACE — no implementation. `capabilities/note/` realizes it over the
// notebook records. A note's title is its name and addresses it; what a note
// blocks is named by plan or unit name, a unit as the view prints it,
// `u of plan p`, or bare where its name is its own. Every output is the notebook's
// view, rendered text. Where a merge left one title held by more than one note,
// the view prints each holder's identity beside it as `title (identity <id>)`,
// and that printed form is the one input addressing one holder.
//
// A note's kind is a label the realization never interprets.
// ─────────────────────────────────────────────────────────────────────────────

import type { Invocation } from './design.js';

/** A note as a capture gives it. */
export interface NoteInput {
  readonly title: string;
  readonly kind: string;
  readonly topic: string;
  readonly body: string;
  /** The plans and units it blocks, by name. */
  readonly blocks: readonly string[];
}

/** A whole-state version given as a change: each field given replaces the
 *  note's, and each field left out carries over from it. */
export type NoteChange = Partial<NoteInput>;

/** What now carries a note taken up: a concept, by its anchor, or a unit, named
 *  as `blocks` names one. Exactly one. */
export type NoteCarrier =
  | { readonly concept: string }
  | { readonly unit: string };

/** The notebook's verbs. `show` renders the whole notebook or, given a title,
 *  one note in full. Every write returns the view of what it wrote. */
export interface NoteHost {
  show(title?: string): string;
  capture(note: NoteInput, by: Invocation): string;
  revise(title: string, change: NoteChange, by: Invocation): string;
  /** A note taken up, resolved to what now carries it; a note withdrawn with
   *  nothing carrying it is retracted. */
  resolve(title: string, carrier: NoteCarrier, by: Invocation): string;
  retract(title: string, by: Invocation): string;
  /** One version over every version of a diverged note. A field its versions
   *  agree on carries over; one they disagree on must be given. */
  reconcile(title: string, change: NoteChange, by: Invocation): string;
}
