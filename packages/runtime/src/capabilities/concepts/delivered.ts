// ─────────────────────────────────────────────────────────────────────────────
// A DELIVERED CONTEXT: one bounded context's current design, projected from the
// concept journal of the repository that owns it and shipped with a release, so
// every project reads it beside its own contexts without holding it in its journal.
//
// THE PROJECTION (`deliverContext`) is the context's current subject and relation
// and its live concepts, each at its current version: no history, no decisions, no
// retired or competing material, nothing time-dependent. Its provenance is the
// origin that delivers it, the release's version, the context's name and its
// IDENTITY: the id of the entry that first recorded the context, which holds
// whatever the context is later described as or called.
//
// THE VIEWS show a delivered context under its origin-qualified name
// (`<origin>:<context>`), marked delivered and read-only, unless the journal being
// read holds a context entry whose id is its identity: that journal owns the
// context, so its own design is the one shown. Nothing is ever appended to a
// project's journal for a delivered context.
// ─────────────────────────────────────────────────────────────────────────────

import { journalAt } from './journal.js';
import { overviewOf } from './overview.js';
import { Folded, type Meaning } from './views.js';

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
  const [first] = folded.contexts.get(opts.context) ?? [];
  if (first === undefined)
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
    identity: first.id,
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

/** The overview of `delivered`, as `overview` gives a context's, marked, its
 *  account saying first where it comes from and that it is read-only. */
export function deliveredOverview(delivered: DeliveredContext) {
  const overview = overviewOf(deliveredDesign(delivered), [], []);
  return {
    ...overview,
    account: `The ${qualifiedName(delivered)} context is delivered by ${delivered.origin} at version ${delivered.version} and is read-only: it is read as delivered, never recorded into or changed through this project’s journal.\n\n${overview.account}`,
    ...marksOf(delivered),
  };
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
