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
// composed from the plan fold (`../plan/dispatch.ts`'s `Reading`), and reads the
// plan lifecycle only when a unit stands on some concept.
//
// Arguments, names and identities are read as the plan surface reads them:
// `--factors` is repeated once per factor, and a field left out carries over.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  ConceptChange,
  ConceptInput,
  DesignHost,
  Invocation,
} from '../../ports/design.js';
import { designView, traceView } from '../../view/design.js';
import {
  type Reading,
  agreed,
  fromAnchor,
  invocation,
  many,
  one,
  over,
  parseArgv,
  parseName,
  subject,
  toAnchor,
  verbOf,
} from '../plan/dispatch.js';
import type { Name as Anchor, Concept } from './design.js';

/** The display text of each write in a concept's history. */
const WRITTEN = { create: 'define', amend: 'amend', retract: 'retract' };

/** The design capability over the records of the repository holding `from`. */
export function designHost(from: string = process.cwd()): DesignHost {
  /** The design's view after a write, drilled into `anchor`. */
  const after = (anchor: string): string =>
    over(from, (read) => designView(read.designState(true), parseName(anchor)));

  /** `change` over `current`, as the design's boundary takes a concept. */
  const concept = (
    change: ConceptChange,
    current: Concept,
  ): { anchor: string; gloss: string; factors: Anchor[] } => ({
    anchor: change.anchor ?? current.anchor,
    gloss: change.gloss ?? current.gloss,
    factors: change.factors?.map(toAnchor) ?? [...current.factors],
  });

  /** The version a write to `anchor` carries over from: its one version, a
   *  withdrawn concept's last, or a diverged one's first. */
  const current = (read: Reading, anchor: string): Concept => {
    const standing = read.design.concept(toAnchor(anchor));
    const last = read.design
      .history(toAnchor(anchor))
      .flatMap((e) => (e.concept ? [e.concept] : []))
      .at(-1);
    return (standing.concept ??
      standing.heads.find((h) => h !== null) ??
      last) as Concept;
  };

  return {
    show: (anchor) =>
      over(from, (read) =>
        designView(
          read.designState(true),
          anchor === undefined ? undefined : parseName(anchor),
        ),
      ),

    define: (input: ConceptInput, by: Invocation) => {
      over(from, (read) => {
        read.design.define(
          { ...input, factors: input.factors.map(toAnchor) },
          by,
        );
        return '';
      });
      return after(input.anchor);
    },

    amend: (anchor, change, by) => {
      const next = over(from, (read) => {
        const next = concept(change, current(read, anchor));
        read.design.amend(toAnchor(anchor), next, by);
        return next.anchor;
      });
      return after(next);
    },

    retract: (anchor, by) => {
      over(from, (read) => {
        read.design.retract(toAnchor(anchor), by);
        return '';
      });
      return after(anchor);
    },

    reconcile: (anchor, change, by) => {
      const next = over(from, (read) => {
        const versions = read.design
          .concept(toAnchor(anchor))
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
            change.factors?.map(toAnchor) ??
            agreed(
              'design',
              versions.map((v) => v.factors),
              'factors',
            ),
        };
        read.design.reconcile(toAnchor(anchor), settled, by);
        return settled.anchor;
      });
      return after(next);
    },

    trace: (anchor) =>
      over(from, (read) => {
        const name = toAnchor(anchor);
        const entity = read.resolveConcept(anchor);
        const shown = (c: Concept) => ({
          anchor: read.anchor(c.anchor, entity),
          gloss: c.gloss,
          factors: c.factors.map(fromAnchor),
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
          closure: read.design
            .closure(name)
            .slice(1)
            .map((n) => read.concept(read.design.denotes(n) as string)),
          blast: read.design
            .blast(name)
            .slice(1)
            .map((n) => read.concept(read.design.denotes(n) as string)),
        });
      }),
  };
}

/** The design's verbs, in the order its header lists them. */
const VERBS = [
  'show',
  'define',
  'amend',
  'retract',
  'reconcile',
  'trace',
] as const;

/** Route `design <verb> [args]` to the design capability over the repository
 *  holding `from`; returns the view the verb renders. */
export function dispatchDesign(
  argv: readonly string[],
  opts: { readonly from?: string } = {},
): string {
  const verb = verbOf(argv, 'design', VERBS);
  const args = parseArgv(argv.slice(1));
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
