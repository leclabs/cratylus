// ─────────────────────────────────────────────────────────────────────────────
// The note capability's VERB SURFACE — `note <verb> [args]`.
//
//   show       the notebook by kind, then topic, or one note in full
//   capture    a note: `<title> --kind <k> --topic <t> --body <b>
//              [--blocks <plan or unit>]…`
//   revise     a new version of a note (`--title` retitles it)
//   resolve    a note taken up: `<title> --concept <anchor>` or
//              `--unit <u of plan p>`, the live concept or unit that now
//              carries it
//   retract    a note withdrawn with nothing carrying it
//   reconcile  a diverged note: one version over every version, resolved to
//              `--concept` or `--unit` when given
//
// A note's title is its name and addresses it. What a note blocks is named by
// plan or unit name and resolved here: a unit as the view prints it,
// `u of plan p`, or bare where its name is its own. Anyone may write a note, and
// capture has no admission bar beyond the note's shape and its title law.
//
// Arguments, names and identities are read as the plan surface reads them
// (`../plan/argv.ts`, `../plan/reading.ts`); `--blocks` is repeated once per
// member. A write writes all or nothing.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  NoteCarrier,
  NoteChange,
  NoteHost,
  NoteInput,
} from '../../ports/note.js';
import { bare, parsed } from '../../record-store/names.js';
import { type VerbFlags, readArgv, valueFlag } from '../../verb-flags.js';
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
import {
  type Note,
  capture,
  reconcile,
  resolve,
  retract,
  revise,
} from './notebook.js';

/** The note capability over the records of the repository holding `from`. */
export function noteHost(from: string = process.cwd()): NoteHost {
  /** A note write, all or nothing, and the notebook's view drilled into the
   *  title it returns. */
  const write = (verb: (read: Reading) => string): string =>
    act('note', from, verb, (read, title) =>
      notebookView(read.noteState(), title),
    );

  /** The note `title` names; refuses a title no note holds. */
  const titled = (read: Reading, title: string): string => {
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
        const entity = titled(read, title);
        const [current] = versions(read, entity);
        const written = note(read, change, current as Note);
        revise(read.store, entity, written, by);
        return written.title;
      }),

    resolve: (title, carrier, by) =>
      write((read) => {
        const entity = titled(read, title);
        const to = read.resolveCarrier(carrier);
        resolve(read.store, entity, to, by);
        return bare(parsed(title));
      }),

    retract: (title, by) =>
      write((read) => {
        retract(read.store, titled(read, title), by);
        return bare(parsed(title));
      }),

    reconcile: (title, change, by, carrier) =>
      write((read) => {
        const entity = titled(read, title);
        const heads = versions(read, entity);
        const pick = <K extends keyof Note>(key: K): Note[K] =>
          agreed(
            'note',
            heads.map((n) => n[key]),
            key,
          );
        if (
          carrier === undefined &&
          new Set(heads.map((n) => JSON.stringify(n.resolved ?? null))).size > 1
        )
          throw new Error(
            'note reconcile: its versions disagree on whether it is resolved, or on what carries it; give --concept or --unit',
          );
        const resolved =
          carrier === undefined
            ? heads[0]?.resolved
            : read.resolveCarrier(carrier);
        const written: Note = {
          ...note(read, change, {
            title: change.title ?? pick('title'),
            kind: change.kind ?? pick('kind'),
            topic: change.topic ?? pick('topic'),
            body: change.body ?? pick('body'),
            blocks: change.blocks === undefined ? pick('blocks') : [],
          }),
          ...(resolved === undefined ? {} : { resolved }),
        };
        reconcile(read.store, entity, written, by);
        return written.title;
      }),
  };
}

/** The flags of a note’s fields besides its title, each described once. */
const FIELDS = {
  kind: valueFlag('What the note is: an idea, a question or a decision'),
  topic: valueFlag('What the note is about'),
  body: valueFlag('The note’s whole statement'),
  blocks: valueFlag(
    'A plan, or a unit as `u of plan p`, the note blocks; repeat once per block, or give an empty one for none',
  ),
} as const;

/** The flag that retitles a note. */
const TITLE = {
  title: valueFlag('The title the note is renamed to'),
} as const;

/** The flags that name what carries a note taken up: a note is resolved to
 *  exactly one, and a diverged note reconciled to at most one. */
const CARRIER = {
  concept: valueFlag(
    'The anchor of the live concept that now carries the note',
  ),
  unit: valueFlag(
    'The live unit, as `u of plan p` or bare where its name is its own, that now carries the note',
  ),
} as const;

/** The notebook's verbs, in the order its header lists them, each with what
 *  it does, the positional it acts on and the flags it takes. */
export const VERBS = {
  show: {
    summary:
      'Show the notebook by kind and topic, owed rulings first, or one note in full',
    positional: '[title]',
    flags: {},
  },
  capture: {
    summary: 'Capture a note of a title, kind, topic and body',
    positional: '<title>',
    flags: { ...FIELDS, ...INVOCATION },
  },
  revise: {
    summary: 'Write a new version of a note; a field left out carries over',
    positional: '<title>',
    flags: { ...TITLE, ...FIELDS, ...INVOCATION },
  },
  resolve: {
    summary:
      'Resolve a note taken up to the concept or unit that now carries it',
    positional: '<title>',
    flags: { ...CARRIER, ...INVOCATION },
  },
  retract: {
    summary: 'Retract a note withdrawn with nothing carrying it',
    positional: '<title>',
    flags: { ...INVOCATION },
  },
  reconcile: {
    summary:
      'Settle a diverged note with one version over every version; give each field the versions disagree on, and the carrier where they disagree on it',
    positional: '<title>',
    flags: { ...TITLE, ...FIELDS, ...CARRIER, ...INVOCATION },
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
  /** What the flags name as carrier; exactly one when `needed`, else at most
   *  one. */
  const carrier = (needed: boolean): NoteCarrier | undefined => {
    const concept = one(args, 'concept');
    const unit = one(args, 'unit');
    if (
      (concept !== undefined && unit !== undefined) ||
      (needed && concept === undefined && unit === undefined)
    )
      throw new Error(
        `note ${verb}: give ${needed ? 'exactly' : 'at most'} one of --concept and --unit; a note is resolved to the one concept or unit that carries it`,
      );
    return concept !== undefined
      ? { concept }
      : unit !== undefined
        ? { unit }
        : undefined;
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
    case 'resolve':
      return host.resolve(
        title(),
        carrier(true) as NoteCarrier,
        invocation(args, 'note', verb),
      );
    case 'retract':
      return host.retract(title(), invocation(args, 'note', verb));
    case 'reconcile':
      return host.reconcile(
        title(),
        change(),
        invocation(args, 'note', verb),
        carrier(false),
      );
  }
}
