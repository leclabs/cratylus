// ─────────────────────────────────────────────────────────────────────────────
// The note capability's VERB SURFACE — `note <verb> [args]`.
//
//   show       the notebook by kind, then topic, or one note in full
//   capture    a note: `<title> --kind <k> --topic <t> --body <b>
//              [--blocks <plan, unit or concept>]…`
//   revise     a new version of a note (`--title` retitles it)
//   retract    a note
//   reconcile  a diverged note: one version over every version
//
// A note's title is its name and addresses it. What a note blocks is named by
// plan, unit or concept name and resolved here: a unit as the view prints it,
// `u of plan p`, or bare where its name is its own; a concept as `concept c`,
// or bare where no plan or unit holds its anchor. Anyone may write a note, and
// capture has no admission bar beyond the note's shape and its title law.
//
// Arguments, names and identities are read as the plan surface reads them
// (`../plan/argv.ts`, `../plan/reading.ts`); `--blocks` is repeated once per
// member. A write writes all or nothing.
// ─────────────────────────────────────────────────────────────────────────────

import type { NoteChange, NoteHost, NoteInput } from '../../ports/note.js';
import { bare, parsed } from '../../record-store/names.js';
import { type VerbFlags, readArgv } from '../../verb-flags.js';
import { notebookView } from '../../view/notebook.js';
import {
  INVOCATION,
  invocation,
  many,
  one,
  subject,
  verbOf,
} from '../plan/argv.js';
import { type Reading, act, agreed, look } from '../plan/reading.js';
import { type Note, capture, reconcile, retract, revise } from './notebook.js';

/** The note capability over the records of the repository holding `from`. */
export function noteHost(from: string = process.cwd()): NoteHost {
  /** A note write, all or nothing, and the notebook's view drilled into the
   *  title it returns. */
  const write = (verb: (read: Reading) => string): string =>
    act('note', from, verb, (read, title) =>
      notebookView(read.noteState(), title),
    );

  /** The note `title` names; refuses a title no note holds. */
  const resolve = (read: Reading, title: string): string => {
    const entity = read.findNote(title);
    if (entity === undefined)
      throw new Error(
        `no note is titled ${JSON.stringify(title)}; \`note capture\` captures one`,
      );
    return entity;
  };

  /** `change` over `current`, what it blocks resolved. */
  const note = (read: Reading, change: NoteChange, current: Note): Note => ({
    title: change.title ?? current.title,
    kind: change.kind ?? current.kind,
    topic: change.topic ?? current.topic,
    body: change.body ?? current.body,
    blocks: change.blocks?.map((b) => read.resolveBlocked(b)) ?? current.blocks,
  });

  /** Every version of the note `entity`: its one, or each of a diverged one. */
  const versions = (read: Reading, entity: string): readonly Note[] =>
    read.book.live.find((n) => n.entity === entity) !== undefined
      ? read.book.live.filter((n) => n.entity === entity)
      : (read.book.diverged.find((d) => d.entity === entity)?.versions ?? []);

  return {
    show: (title) =>
      look('note', from, (read) =>
        notebookView(
          read.noteState(),
          title === undefined ? undefined : parsed(title),
        ),
      ),

    capture: (input: NoteInput, by) =>
      write((read) => {
        capture(
          read.store,
          {
            ...input,
            blocks: input.blocks.map((b) => read.resolveBlocked(b)),
          },
          by,
        );
        return input.title;
      }),

    revise: (title, change, by) =>
      write((read) => {
        const entity = resolve(read, title);
        const [current] = versions(read, entity);
        const written = note(read, change, current as Note);
        revise(read.store, entity, written, by);
        return written.title;
      }),

    retract: (title, by) =>
      write((read) => {
        retract(read.store, resolve(read, title), by);
        return bare(parsed(title));
      }),

    reconcile: (title, change, by) =>
      write((read) => {
        const entity = resolve(read, title);
        const heads = versions(read, entity);
        const pick = <K extends keyof Note>(key: K): Note[K] =>
          agreed(
            'note',
            heads.map((n) => n[key]),
            key,
          );
        const written = note(read, change, {
          title: change.title ?? pick('title'),
          kind: change.kind ?? pick('kind'),
          topic: change.topic ?? pick('topic'),
          body: change.body ?? pick('body'),
          blocks: change.blocks === undefined ? pick('blocks') : [],
        });
        reconcile(read.store, entity, written, by);
        return written.title;
      }),
  };
}

/** The notebook's verbs, in the order its header lists them, and the flags
 *  each takes. */
export const VERBS = {
  show: {},
  capture: {
    kind: 'value',
    topic: 'value',
    body: 'value',
    blocks: 'value',
    ...INVOCATION,
  },
  revise: {
    title: 'value',
    kind: 'value',
    topic: 'value',
    body: 'value',
    blocks: 'value',
    ...INVOCATION,
  },
  retract: { ...INVOCATION },
  reconcile: {
    title: 'value',
    kind: 'value',
    topic: 'value',
    body: 'value',
    blocks: 'value',
    ...INVOCATION,
  },
} as const satisfies VerbFlags;

/** Route `note <verb> [args]` to the note capability over the repository
 *  holding `from`; returns the view the verb renders. */
export function dispatchNote(
  argv: readonly string[],
  opts: { readonly from?: string } = {},
): string {
  const verb = verbOf(argv, 'note', VERBS);
  const args = readArgv(argv.slice(1), 'note', verb, VERBS[verb]);
  const host = noteHost(opts.from);
  const title = () => subject(args, 'note', verb, 'note');
  const change = (): NoteChange => {
    const found: { -readonly [K in keyof NoteChange]: NoteChange[K] } = {};
    for (const key of ['title', 'kind', 'topic', 'body'] as const) {
      const value = one(args, key);
      if (value !== undefined) found[key] = value;
    }
    const blocks = many(args, 'blocks');
    if (blocks !== undefined) found.blocks = blocks;
    return found;
  };
  switch (verb) {
    case 'show':
      return host.show(args.positionals[0]);
    case 'capture': {
      const missing = ['kind', 'topic', 'body'].filter(
        (f) => one(args, f) === undefined,
      );
      if (missing.length > 0)
        throw new Error(
          `note capture: give ${missing.map((f) => `--${f}`).join(', ')}; a note has a title, kind, topic and body`,
        );
      return host.capture(
        {
          title: title(),
          kind: one(args, 'kind') as string,
          topic: one(args, 'topic') as string,
          body: one(args, 'body') as string,
          blocks: many(args, 'blocks') ?? [],
        },
        invocation(args, 'note', verb),
      );
    }
    case 'revise':
      return host.revise(title(), change(), invocation(args, 'note', verb));
    case 'retract':
      return host.retract(title(), invocation(args, 'note', verb));
    case 'reconcile':
      return host.reconcile(title(), change(), invocation(args, 'note', verb));
  }
}
