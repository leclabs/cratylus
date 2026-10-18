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
// IDENTITY: the id of the entry that first recorded it, as the journal's latest
// closing of the books records it, which holds whatever the context is later
// described as or called.
//
// THE VIEWS show a delivered context APART from the project's own contexts, in
// the place of its own `practiceOf` gives (`practice`), labelled as the practice
// the project's agents work by and offered before the project's contexts; never
// among them nor in the project's context map. It is named by its origin
// (`<origin>:<context>`) and marked delivered and read-only, unless the journal
// being read holds a context entry whose id is its identity, or a close that
// records it among the ids a context has held: that journal owns
// the context, which is then part of its design and shown among its own. Nothing
// is ever appended to a project's journal for a delivered context.
// ─────────────────────────────────────────────────────────────────────────────

import { journalAt } from './journal.js';
import { Folded, type Meaning, designState } from './views.js';

/** A context as a release delivers it: its provenance and its current design. */
export interface DeliveredContext {
  readonly origin: string;
  readonly version: string;
  readonly context: string;
  readonly identity: string;
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
 * The projection of `context`, as the journal of the git repository holding
 * `from` records it now, delivered by `origin` at `version`. Refused where the
 * journal has no such context, or its description or a concept is competing:
 * a release delivers a settled design.
 */
export function deliverContext(opts: {
  readonly from: string;
  readonly context: string;
  readonly origin: string;
  readonly version: string;
}): DeliveredContext {
  const refuse = (message: string) => new Error(`deliverContext: ${message}`);
  const folded = new Folded(journalAt(opts.from, refuse).entries());
  const identity = folded.identity(opts.context);
  if (identity === undefined)
    throw refuse(`the journal has no bounded context '${opts.context}'`);
  const design = folded.design(opts.context);
  if (design.subject === null || design.relation === null)
    throw refuse(
      `the bounded context '${opts.context}' has competing descriptions; settle them before delivering it`,
    );
  if (design.competing.length > 0)
    throw refuse(
      `the bounded context '${opts.context}' has competing versions of ${design.competing.map((c) => `'${c.name}'`).join(', ')}; settle them before delivering it`,
    );
  return {
    origin: opts.origin,
    version: opts.version,
    context: opts.context,
    identity,
    subject: design.subject,
    relation: design.relation,
    concepts: design.concepts.map(({ name, wording, builtFrom }) => ({
      name,
      wording,
      builtFrom: [...builtFrom],
    })),
  };
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

/** What the views say the delivered practice is, in the place they show it. */
export const PRACTICE =
  'the practice this project’s agents work by, delivered with the installation and read first, before the project’s own contexts; it is not part of this project’s design, never among its contexts nor in its context map, and is read-only, never recorded into its journal';

/** The place of its own a view shows `contexts`, the delivered ones it covers,
 *  in: labelled as the practice, apart from the project's contexts; nothing
 *  where it covers none. */
export function practiceOf<C>(contexts: readonly C[]): {
  practice?: { about: string; contexts: readonly C[] };
} {
  return contexts.length === 0
    ? {}
    : { practice: { about: PRACTICE, contexts } };
}

/** Whether `value`, read from `file`, is a delivered context; refuses one that
 *  is not, naming the file. */
export function deliveredFrom(value: unknown, file: string): DeliveredContext {
  const text = (v: unknown): v is string => typeof v === 'string';
  const record = value as Record<string, unknown> | null;
  const concepts = record?.concepts;
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
    throw new Error(
      `${file} is not a delivered context: it needs origin, version, context, identity, subject, relation and concepts each with name, wording and builtFrom`,
    );
  return record as unknown as DeliveredContext;
}
