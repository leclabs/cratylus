// ─────────────────────────────────────────────────────────────────────────────
// A DELIVERED CONTEXT: one bounded context's current design, projected from the
// concept journal of the repository that owns it and shipped with a release: the
// practice a project's agents work by, never part of the project's design, read
// without the project holding it in its journal.
//
// THE PROJECTION (`deliverContext`) is the context's current subject and relation
// and its live concepts, each at its current version: no history, no decisions, no
// retired or competing material, nothing time-dependent. Its provenance is the
// origin that delivers it, the release's version, the context's name and its
// IDENTITY: the identity the earliest of its entries carrying one carries,
// which a closing of the books carries into each period it opens, else the id
// of its earliest entry; it holds whatever the context is later described as
// or called. Its POSITION is its 0-based place among the contexts its origin
// delivers, upstream first: every reading orders delivered contexts by origin,
// then position (`byDelivery`), never by the file each is read from.
//
// THE VIEWS show the delivered contexts APART from the project's own other
// contexts, in the place of their own `practiceOf` gives (`practice`), labelled
// as the practice the project's agents work by and offered before the project's
// other contexts, every delivered context in the delivered order; never among
// those contexts nor in the project's context map. Each is named by its origin
// (`<origin>:<context>`) and marked delivered and read-only, unless the journal
// being read holds a context whose identity is its identity: that journal owns
// the context, part of its design, and its own copy stands in the delivered
// context's place, named by its own name, unmarked and recorded into as any of
// its contexts. Nothing is ever appended to a project's journal for a delivered
// context.
// ─────────────────────────────────────────────────────────────────────────────

import type { InstallScope } from '../../runtime-config.js';
import { journalAt } from './journal.js';
import { Folded, type Meaning, designState } from './views.js';

/** A context as a release delivers it: its provenance and its current design. */
export interface DeliveredContext {
  readonly origin: string;
  readonly version: string;
  readonly context: string;
  readonly identity: string;
  /** Its 0-based place, upstream first, among the contexts its origin delivers. */
  readonly position: number;
  readonly subject: string;
  readonly relation: string;
  readonly concepts: readonly Meaning[];
}

/** Where a delivered context comes from: what its `delivered` mark carries. */
export type Provenance = Pick<
  DeliveredContext,
  'origin' | 'version' | 'context' | 'identity'
>;

/** The marks every view of a delivered context carries. */
export interface DeliveredMarks {
  readonly delivered: Provenance;
  readonly readOnly: true;
}

/**
 * The projection of `context`, by its current name or any it had, as the
 * journal of the git repository holding `from` records it now, delivered by
 * `origin` at `version`, at `position` among the contexts `origin` delivers,
 * under its current name. Refused where the journal has no such context, or
 * its description or a concept is competing: a release delivers a settled
 * design.
 */
export function deliverContext(opts: {
  readonly from: string;
  readonly context: string;
  readonly origin: string;
  readonly version: string;
  readonly position: number;
}): DeliveredContext {
  const refuse = (message: string) => new Error(`deliverContext: ${message}`);
  const folded = new Folded(journalAt(opts.from, refuse).entries());
  const context = folded.contextNamed(opts.context);
  if (context === undefined)
    throw refuse(`the journal has no bounded context '${opts.context}'`);
  const design = folded.design(context);
  if (design.subject === null || design.relation === null)
    throw refuse(
      `the bounded context '${context}' has competing descriptions; settle them before delivering it`,
    );
  if (design.competing.length > 0)
    throw refuse(
      `the bounded context '${context}' has competing versions of ${design.competing.map((c) => `'${c.name}'`).join(', ')}; settle them before delivering it`,
    );
  return {
    origin: opts.origin,
    version: opts.version,
    context,
    identity: folded.identity(context) as string,
    position: opts.position,
    subject: design.subject,
    relation: design.relation,
    concepts: design.concepts.map(({ name, wording, builtFrom }) => ({
      name,
      wording,
      builtFrom: [...builtFrom],
    })),
  };
}

/** The delivered order: by origin, then position, upstream first. */
export function byDelivery(a: DeliveredContext, b: DeliveredContext): number {
  return a.origin < b.origin
    ? -1
    : a.origin > b.origin
      ? 1
      : a.position - b.position;
}

/** The name a delivered context is shown under: `<origin>:<context>`. */
export function qualifiedName(delivered: Provenance): string {
  return `${delivered.origin}:${delivered.context}`;
}

/** The marks of `delivered`: its provenance, and that it is read-only. */
export function marksOf(delivered: DeliveredContext): DeliveredMarks {
  const { origin, version, context, identity } = delivered;
  return {
    delivered: { origin, version, context, identity },
    readOnly: true,
  };
}

/** The current design of `delivered`, as `design` gives a context's, marked. */
export function deliveredDesign(delivered: DeliveredContext) {
  return {
    name: qualifiedName(delivered),
    subject: delivered.subject,
    relation: delivered.relation,
    competingDescriptions: [],
    concepts: delivered.concepts.map(({ name, wording, builtFrom }) => ({
      name,
      wording,
      builtFrom: [...builtFrom],
    })),
    competing: [],
    retired: [],
    ...marksOf(delivered),
  };
}

/** The design state of `delivered`, as `state` gives a context's, marked. */
export function deliveredState(delivered: DeliveredContext) {
  return {
    ...designState(deliveredDesign(delivered)),
    ...marksOf(delivered),
  };
}

/** What the views say the practice place holds, where they show it. */
export const PRACTICE =
  'the practice this project’s agents work by, read first, before the project’s other contexts: every context delivered with the installation, in the delivered order, upstream first; a delivered context is not part of this project’s design, never among its contexts nor in its context map, and is read-only, never recorded into its journal; where this project’s journal holds a delivered context itself, its own copy stands in that context’s place, under its own name, unmarked, part of the project’s design and recorded into as any of its contexts';

/** The place of its own a view shows `contexts` in, the delivered ones it
 *  covers or the project's own copies in their place: labelled as the
 *  practice, apart from the project's other contexts; nothing where it covers
 *  none. */
export function practiceOf<C>(contexts: readonly C[]): {
  practice?: { about: string; contexts: readonly C[] };
} {
  return contexts.length === 0
    ? {}
    : { practice: { about: PRACTICE, contexts } };
}

/** Whether `value`, read from `file` in the installation `installation`, is a
 *  delivered context; refuses one that is not, naming the file, and one an
 *  earlier cratylus projected, without its position, naming the remedy. */
export function deliveredFrom(
  value: unknown,
  file: string,
  installation: { readonly root: string; readonly scope: InstallScope },
): DeliveredContext {
  const text = (v: unknown): v is string => typeof v === 'string';
  const record = value as Record<string, unknown> | null;
  const concepts = record?.concepts;
  const malformed = new Error(
    `${file} is not a delivered context: it needs origin, version, context, identity, a position (a whole number from 0), subject, relation and concepts each with name, wording and builtFrom`,
  );
  if (
    typeof record !== 'object' ||
    record === null ||
    !['origin', 'version', 'context', 'identity', 'subject', 'relation'].every(
      (field) => text(record[field]),
    ) ||
    !Array.isArray(concepts) ||
    !concepts.every(
      (c) =>
        typeof c === 'object' &&
        c !== null &&
        text(c.name) &&
        text(c.wording) &&
        Array.isArray(c.builtFrom) &&
        c.builtFrom.every(text),
    )
  )
    throw malformed;
  if (record.position === undefined)
    throw new Error(
      `${file} carries no position: the ${installation.scope} installation at ${installation.root} was projected by an earlier cratylus; install again with the cratylus in use, at its ${installation.scope} scope`,
    );
  if (!Number.isInteger(record.position) || (record.position as number) < 0)
    throw malformed;
  return record as unknown as DeliveredContext;
}
