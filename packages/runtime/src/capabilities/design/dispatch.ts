// ─────────────────────────────────────────────────────────────────────────────
// The design capability's VERB SURFACE — `design <verb> [args]`.
//
//   show       the whole lattice root to primitive, or one concept in full
//   define     a concept: `<anchor> --gloss <g> [--factors <anchor>]…`
//   amend      a new version of a concept (`--anchor` relabels it); amending a
//              withdrawn concept reinstates it
//   retract    a concept nothing live factors on
//   reconcile  a diverged concept: one version over every version
//   trace      how a concept came to be, its closure and its blast
//
// The design knows nothing of plans. `trace` reads the design alone; `show`
// joins the plans standing on each concept only as the view's cross-reference,
// composed from the plan fold, and on a host without the plan lifecycle shows
// the design and says the cross-reference waits for a deploy. A write writes
// all or nothing (`../plan/reading.ts`'s `act`).
//
// Arguments, names and identities are read as the plan surface reads them:
// `--factors` is repeated once per factor, and a field left out carries over.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  ConceptChange,
  ConceptInput,
  DesignHost,
} from '../../ports/design.js';
import { type Name, parsed } from '../../record-store/names.js';
import { type VerbFlags, readArgv, valueFlag } from '../../verb-flags.js';
import { designView, traceView } from '../../view/design.js';
import {
  INVOCATION,
  invocation,
  many,
  one,
  subject,
  verbOf,
} from '../plan/argv.js';
import { type Reading, act, agreed, look } from '../plan/reading.js';
import type { Concept } from './design.js';

/** The display text of each write in a concept's history. */
const WRITTEN = { create: 'define', amend: 'amend', retract: 'retract' };

/** The design capability over the records of the repository holding `from`. */
export function designHost(from: string = process.cwd()): DesignHost {
  /** A design write, all or nothing, and the design's view drilled into the
   *  anchor it returns. */
  const write = (verb: (read: Reading) => string): string =>
    act('design', from, verb, (read, anchor) =>
      designView(read.designState(true), anchor),
    );

  /** `change` over `current`, as the design's boundary takes a concept. */
  const concept = (change: ConceptChange, current: Concept): Concept => ({
    anchor: change.anchor ?? current.anchor,
    gloss: change.gloss ?? current.gloss,
    factors: change.factors?.map(parsed) ?? [...current.factors],
  });

  /** The version a write to `anchor` carries over from: its one version, or a
   *  withdrawn concept's last. */
  const current = (read: Reading, anchor: Name): Concept => {
    const standing = read.design.concept(anchor);
    const last = read.design
      .history(anchor)
      .flatMap((e) => (e.concept ? [e.concept] : []))
      .at(-1);
    return (standing.concept ?? last) as Concept;
  };

  return {
    show: (anchor) =>
      look('design', from, (read) =>
        designView(
          read.designState(true),
          anchor === undefined ? undefined : parsed(anchor),
        ),
      ),

    define: (input: ConceptInput, by) =>
      write((read) => {
        read.design.define(
          { ...input, factors: input.factors.map(parsed) },
          by,
        );
        return input.anchor;
      }),

    amend: (anchor, change, by) =>
      write((read) => {
        const name = parsed(anchor);
        const next = concept(change, current(read, name));
        read.design.amend(name, next, by);
        return next.anchor;
      }),

    retract: (anchor, by) =>
      write((read) => {
        const name = parsed(anchor);
        read.design.retract(name, by);
        return typeof name === 'string' ? name : name.name;
      }),

    reconcile: (anchor, change, by) =>
      write((read) => {
        const name = parsed(anchor);
        const versions = read.design
          .concept(name)
          .heads.flatMap((h) => (h ? [h] : []));
        const settled = {
          anchor:
            change.anchor ??
            agreed(
              'design',
              versions.map((v) => v.anchor),
              'anchor',
            ),
          gloss:
            change.gloss ??
            agreed(
              'design',
              versions.map((v) => v.gloss),
              'gloss',
            ),
          factors:
            change.factors?.map(parsed) ??
            agreed(
              'design',
              versions.map((v) => v.factors),
              'factors',
            ),
        };
        read.design.reconcile(name, settled, by);
        return settled.anchor;
      }),

    trace: (anchor) =>
      look('design', from, (read) => {
        const name = parsed(anchor);
        const entity = read.resolveConcept(anchor);
        const shown = (c: Concept) => ({
          anchor: read.anchor(c.anchor, entity),
          gloss: c.gloss,
          factors: c.factors,
        });
        return traceView(read.designState(false), {
          anchor: read.concept(entity),
          history: read.design.history(name).map((e) => ({
            verb: WRITTEN[e.operation],
            concept: e.concept ? shown(e.concept) : null,
            author: e.author,
            time: e.time,
            reason: e.reason,
          })),
          closure: read.design.closure(name).slice(1),
          blast: read.design.blast(name).slice(1),
        });
      }),
  };
}

/** The flags of a concept’s fields, each described once. */
const FIELDS = {
  gloss: valueFlag('What the concept is, in one line'),
  factors: valueFlag(
    'A concept it decomposes into; repeat once per factor, or give an empty one for none',
  ),
} as const;

/** The flag that relabels a concept. */
const ANCHOR = {
  anchor: valueFlag('The anchor the concept is relabelled to'),
} as const;

/** The design's verbs, in the order its header lists them, each with what it
 *  does, the positional it acts on and the flags it takes. */
export const VERBS = {
  show: {
    summary: 'Show the whole lattice root to primitive, or one concept in full',
    positional: '[concept]',
    flags: {},
  },
  define: {
    summary: 'Define a new concept, naming its gloss and its factors',
    positional: '<concept>',
    flags: { ...FIELDS, ...INVOCATION },
  },
  amend: {
    summary:
      'Write a new version of a concept; a field left out carries over, and amending a withdrawn concept reinstates it',
    positional: '<concept>',
    flags: { ...ANCHOR, ...FIELDS, ...INVOCATION },
  },
  retract: {
    summary: 'Withdraw a concept that nothing live factors on',
    positional: '<concept>',
    flags: { ...INVOCATION },
  },
  reconcile: {
    summary:
      'Settle a diverged concept with one version over every version; give each field the versions disagree on',
    positional: '<concept>',
    flags: { ...ANCHOR, ...FIELDS, ...INVOCATION },
  },
  trace: {
    summary:
      'Show how a concept came to be, what it stands on and what stands on it',
    positional: '<concept>',
    flags: {},
  },
} as const satisfies VerbFlags;

/** Route `design <verb> [args]` to the design capability over the repository
 *  holding `from`; returns the view the verb renders. */
export function dispatchDesign(
  argv: readonly string[],
  opts: { readonly from?: string } = {},
): string {
  const verb = verbOf(argv, 'design', VERBS);
  const args = readArgv(argv.slice(1), 'design', verb, VERBS[verb]);
  const host = designHost(opts.from);
  const change = (): ConceptChange => {
    const [anchor, gloss, factors] = [
      one(args, 'anchor'),
      one(args, 'gloss'),
      many(args, 'factors'),
    ];
    return {
      ...(anchor === undefined ? {} : { anchor }),
      ...(gloss === undefined ? {} : { gloss }),
      ...(factors === undefined ? {} : { factors }),
    };
  };
  const anchor = () => subject(args, 'design', verb, 'concept');
  switch (verb) {
    case 'show':
      return host.show(args.positionals[0]);
    case 'define':
      return host.define(
        {
          anchor: anchor(),
          gloss: one(args, 'gloss') ?? '',
          factors: many(args, 'factors') ?? [],
        },
        invocation(args, 'design', verb),
      );
    case 'amend':
      return host.amend(anchor(), change(), invocation(args, 'design', verb));
    case 'retract':
      return host.retract(anchor(), invocation(args, 'design', verb));
    case 'reconcile':
      return host.reconcile(
        anchor(),
        change(),
        invocation(args, 'design', verb),
      );
    case 'trace':
      return host.trace(anchor());
  }
}
