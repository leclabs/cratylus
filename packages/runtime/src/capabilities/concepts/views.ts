// ─────────────────────────────────────────────────────────────────────────────
// The VIEWS computed from the concept journal: the current design of each
// bounded context, a concept's history, and the decisions with their status.
// Each is a pure function of the entries in append order: no clock, no
// randomness, so the same journal answers the same every time.
//
// A concept's CURRENT versions are those no later version of it supersedes.
// One current version is the concept: live, or retired when it is a
// retirement. Two or more are COMPETING versions (branches that each
// superseded the same one), reported in append order, none chosen, until a
// later version supersedes them all.
//
// A decision is SUPERSEDED once any decision supersedes it, else ACCEPTED once
// recorded accepted or its acceptance is recorded, else OPEN.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  ContextEntry,
  DecideEntry,
  Entry,
  RetireEntry,
  VersionEntry,
  WordedEntry,
} from './entries.js';

/** A live concept: its current version. */
export interface ConceptView {
  readonly name: string;
  readonly wording: string;
  readonly builtFrom: readonly string[];
  readonly reason: string;
}

/** One of a concept's competing versions; a retirement among them carries
 *  `retired` and no wording. */
export type CompetingVersion =
  | Omit<ConceptView, 'name'>
  | { readonly retired: true; readonly reason: string };

export interface ContextView {
  readonly name: string;
  readonly subject: string;
  readonly relation: string;
  readonly concepts: readonly ConceptView[];
  readonly competing: readonly {
    readonly name: string;
    readonly versions: readonly CompetingVersion[];
  }[];
  readonly retired: readonly {
    readonly name: string;
    readonly reason: string;
  }[];
}

export interface DecisionView {
  readonly id: string;
  readonly context: string;
  readonly title: string;
  readonly situation: string;
  readonly decision: string;
  readonly consequences: string;
  readonly status: 'open' | 'accepted' | 'superseded';
  readonly supersedes: string | null;
  readonly supersededBy: readonly string[];
}

export interface HistoryView {
  readonly context: string;
  readonly name: string;
  readonly versions: readonly {
    readonly id: string;
    readonly at: string;
    readonly kind: VersionEntry['kind'];
    readonly wording?: string;
    readonly builtFrom?: readonly string[];
    readonly reason: string;
    readonly supersedes: readonly string[];
  }[];
}

/** Where a concept stands: live in one version, retired, or competing. */
export type Standing =
  | { readonly is: 'live'; readonly current: WordedEntry }
  | { readonly is: 'retired'; readonly current: RetireEntry }
  | { readonly is: 'competing'; readonly current: readonly VersionEntry[] };

/** The journal folded: its contexts, concepts and decisions, each in the order
 *  first recorded. */
export class Folded {
  /** Each context by name, the first recording of a name being its own. */
  readonly contexts = new Map<string, ContextEntry>();
  /** Each context's concepts by name, each with its versions in append order. */
  readonly concepts = new Map<string, Map<string, VersionEntry[]>>();
  /** Each decision by id, the first recording of an id being its own. */
  readonly decisions = new Map<string, DecideEntry>();
  /** The decisions whose acceptance is recorded. */
  readonly acceptances = new Set<string>();
  /** The decisions superseding each decision, in append order. */
  readonly supersededBy = new Map<string, string[]>();

  constructor(entries: readonly Entry[]) {
    for (const entry of entries)
      switch (entry.kind) {
        case 'context':
          if (!this.contexts.has(entry.name))
            this.contexts.set(entry.name, entry);
          break;
        case 'define':
        case 'supersede':
        case 'retire': {
          const inContext =
            this.concepts.get(entry.context) ??
            new Map<string, VersionEntry[]>();
          this.concepts.set(entry.context, inContext);
          inContext.set(entry.name, [
            ...(inContext.get(entry.name) ?? []),
            entry,
          ]);
          break;
        }
        case 'decide':
          if (this.decisions.has(entry.decisionId)) break;
          this.decisions.set(entry.decisionId, entry);
          if (entry.supersedes !== null)
            this.supersededBy.set(entry.supersedes, [
              ...(this.supersededBy.get(entry.supersedes) ?? []),
              entry.decisionId,
            ]);
          break;
        case 'accept':
          this.acceptances.add(entry.decisionId);
          break;
      }
  }

  /** The versions of `name` in `context`, in append order; none when the
   *  context does not have it. */
  versions(context: string, name: string): readonly VersionEntry[] {
    return this.concepts.get(context)?.get(name) ?? [];
  }

  /** Where `name` in `context` stands; `undefined` when the context does not
   *  have it. */
  standing(context: string, name: string): Standing | undefined {
    const versions = this.versions(context, name);
    if (versions.length === 0) return undefined;
    const superseded = new Set(versions.flatMap((v) => v.supersedes));
    const current = versions.filter((v) => !superseded.has(v.id));
    if (current.length > 1) return { is: 'competing', current };
    const one = current[0] ?? (versions.at(-1) as VersionEntry);
    return one.kind === 'retire'
      ? { is: 'retired', current: one }
      : { is: 'live', current: one };
  }

  /** The current design of `context`, a context the journal has. */
  design(context: string): ContextView {
    const recorded = this.contexts.get(context) as ContextEntry;
    const view = {
      name: recorded.name,
      subject: recorded.subject,
      relation: recorded.relation,
      concepts: [] as ConceptView[],
      competing: [] as ContextView['competing'][number][],
      retired: [] as ContextView['retired'][number][],
    };
    for (const name of this.concepts.get(context)?.keys() ?? []) {
      const standing = this.standing(context, name) as Standing;
      switch (standing.is) {
        case 'live':
          view.concepts.push({ name, ...stated(standing.current) });
          break;
        case 'retired':
          view.retired.push({ name, reason: standing.current.reason });
          break;
        case 'competing':
          view.competing.push({
            name,
            versions: standing.current.map((v) =>
              v.kind === 'retire'
                ? { retired: true, reason: v.reason }
                : stated(v),
            ),
          });
          break;
      }
    }
    return view;
  }

  /** Every version of `name` in `context`, each exactly as recorded. */
  history(context: string, name: string): HistoryView {
    return {
      context,
      name,
      versions: this.versions(context, name).map((v) => ({
        id: v.id,
        at: v.at,
        kind: v.kind,
        ...(v.kind === 'retire'
          ? {}
          : { wording: v.wording, builtFrom: [...v.builtFrom] }),
        reason: v.reason,
        supersedes: [...v.supersedes],
      })),
    };
  }

  /** The status `id`, a decision the journal has, holds now. */
  status(id: string): DecisionView['status'] {
    if ((this.supersededBy.get(id) ?? []).length > 0) return 'superseded';
    const recorded = this.decisions.get(id) as DecideEntry;
    return recorded.status === 'accepted' || this.acceptances.has(id)
      ? 'accepted'
      : 'open';
  }

  /** Every decision, in the order recorded, as `decisions` gives it. */
  decisionViews(): DecisionView[] {
    return [...this.decisions.values()].map((d) => ({
      id: d.decisionId,
      context: d.context,
      title: d.title,
      situation: d.situation,
      decision: d.decision,
      consequences: d.consequences,
      status: this.status(d.decisionId),
      supersedes: d.supersedes,
      supersededBy: [...(this.supersededBy.get(d.decisionId) ?? [])],
    }));
  }
}

/** What a version that states its concept says. */
function stated(version: WordedEntry): Omit<ConceptView, 'name'> {
  return {
    wording: version.wording,
    builtFrom: [...version.builtFrom],
    reason: version.reason,
  };
}
