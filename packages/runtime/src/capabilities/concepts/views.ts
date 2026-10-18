// ─────────────────────────────────────────────────────────────────────────────
// The VIEWS computed from the concept journal: the design state and the
// current design of each bounded context, a concept's history, a context's
// own history, and the decisions with their status.
// Each is a pure function of the entries in append order: no clock, no
// randomness, so the same journal answers the same every time.
//
// CLOSED BOOKS. A journal that closed its books folds the entries its close
// brought forward with the period's own, so what stands reads the same after
// a close as before it; the history readings name the latest close and the
// commit holding the period before it, whose entries are read from version
// control. A context's IDENTITY is the one its latest close records, else
// the id of its first entry.
//
// A concept's CURRENT versions are those no later version of it supersedes.
// One current version is the concept: live, or retired when it is a
// retirement. Two or more are COMPETING versions (branches that each
// superseded the same one), reported in append order, none chosen, until a
// later version supersedes them all.
//
// The project's PURPOSE is folded the same way: its current statements are the
// purpose entries no later one supersedes; alike they are one purpose,
// different they are COMPETING, none chosen, until a later one supersedes
// them all.
//
// A context is its NAME. Its current descriptions are the entries of that name
// no later one supersedes; recorded alike on two branches they are one
// description, recorded differently they are COMPETING, none chosen, until a
// later entry of the name supersedes them all. The design shows only the
// current description; every earlier one stays in the context's history.
//
// A decision is its ENTRY; its id is the name the caller gave, which two
// branches may each give, so a reference by id holds only while one decision
// has it. A decision is SUPERSEDED once any decision supersedes it, else
// DEPRECATED once its deprecation is recorded, else ACCEPTED once recorded
// accepted or its acceptance is recorded, else OPEN. An open or accepted
// decision STANDS; a superseded or deprecated one is history. Entries are
// read as recorded: a decision recorded about a cut is read by its own status
// alone.
// Its KIND is the latest one recorded for it, on the decision itself or by a
// classification after it; every decision recorded now is of realization,
// and earlier entries are read as recorded, a decision of none having none.
//
// Past EFFORT: the efficiency entries recorded for cuts, each cut's latest
// entry of its context holding its figures; read with the context's history.
//
// The DESIGN STATE of a context is its description and its live and competing
// concepts, each a line `name ≜ residue`; nothing else. WHAT STANDS of a
// design or a decision is what a view shows unless history is asked for: a
// design without its retired concepts or the reason each live concept's
// current version was written, a decision without the decisions it replaced
// or the kinds recorded for it before the governing one.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  AcceptEntry,
  CloseEntry,
  ContextEntry,
  DecideEntry,
  DecisionKind,
  DeprecateEntry,
  EfficiencyEntry,
  Entry,
  PurposeEntry,
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

/** What a concept means: its name, its current wording and its parts — a live
 *  concept as a delivered context carries it, without the reason it was recorded. */
export type Meaning = Pick<ConceptView, 'name' | 'wording' | 'builtFrom'>;

/** One of a concept's competing versions; a retirement among them carries
 *  `retired` and no wording. */
export type CompetingVersion =
  | Omit<ConceptView, 'name'>
  | { readonly retired: true; readonly reason: string };

/** The project's purpose, what it is for: `null` while none is recorded, and
 *  while competing, each competing statement then listed in append order. */
export interface PurposeView {
  readonly purpose: string | null;
  readonly competingPurposes?: readonly string[];
}

/** A context's description: its subject and its place in the context map. */
export interface Description {
  readonly subject: string;
  readonly relation: string;
}

/** A context's design; `subject` and `relation` are `null` while its
 *  description is competing, each competing one listed in append order. */
export interface ContextView {
  readonly name: string;
  readonly subject: string | null;
  readonly relation: string | null;
  readonly competingDescriptions: readonly Description[];
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

/** One kind recorded for a decision: the entry that recorded it, the kind,
 *  and the reason where one was given. */
export interface KindRecord {
  readonly entry: string;
  readonly kind: DecisionKind;
  readonly reason?: string;
}

/** Why a decision no longer stands without a replacement: the entry that
 *  deprecated it, with its reason. */
export interface Deprecation {
  readonly entry: string;
  readonly reason: string;
}

/** A decision as the views show it: what it says first, its title, and its id
 *  and entry last, as references. */
export interface DecisionView {
  readonly title: string;
  readonly context: string;
  readonly status: 'open' | 'accepted' | 'superseded' | 'deprecated';
  /** The governing kind: the latest recorded, `null` where none is. */
  readonly kind: DecisionKind | null;
  readonly situation: string;
  readonly decision: string;
  readonly consequences: string;
  readonly supersedes: string | null;
  readonly supersededBy: readonly string[];
  /** Every kind recorded for the decision, in the order recorded. */
  readonly kinds: readonly KindRecord[];
  /** The cut it was recorded about, where its entry names one: history. */
  readonly cut?: string;
  /** The example files its entry named it keeping, as recorded. */
  readonly keeps?: readonly string[];
  /** Why it is deprecated, where it is. */
  readonly deprecation?: Deprecation;
  readonly id: string;
  readonly entry: string;
}

/** Whether `decision` stands: open or accepted, neither superseded nor
 *  deprecated. */
export const stands = (decision: DecisionView): boolean =>
  decision.status === 'open' || decision.status === 'accepted';

/** `decision` as it stands: what it says, its title first, its status and
 *  governing kind, the example files its entry names, its id and entry last as
 *  references; without what it superseded, what superseded it, every kind
 *  recorded for it, or the cut it was recorded about. */
export const standingDecision = ({
  title,
  context,
  status,
  kind,
  situation,
  decision,
  consequences,
  keeps,
  id,
  entry,
}: DecisionView) => ({
  title,
  context,
  status,
  kind,
  situation,
  decision,
  consequences,
  ...(keeps === undefined ? {} : { keeps }),
  id,
  entry,
});

/** `design` as it stands: its live concepts by their meaning alone, without
 *  the reasons their versions were written, and no retired concepts. */
export function standingDesign<
  D extends {
    readonly concepts: readonly Meaning[];
    readonly retired: readonly unknown[];
  },
>({ concepts, retired: _, ...rest }: D) {
  return {
    ...rest,
    concepts: concepts.map(({ name, wording, builtFrom }) => ({
      name,
      wording,
      builtFrom,
    })),
  };
}

/** The design state of `design`'s context, for a model to read: its subject
 *  and relation, its competing descriptions only when any, its live concepts
 *  each as one line `name ≜ residue`, and each concept's competing versions
 *  as such lines, a retirement among them as `name retired`; nothing else. */
export function designState({
  name,
  subject,
  relation,
  competingDescriptions,
  concepts,
  competing,
}: Pick<
  ContextView,
  'name' | 'subject' | 'relation' | 'competingDescriptions' | 'competing'
> & { readonly concepts: readonly Meaning[] }) {
  return {
    name,
    subject,
    relation,
    ...(competingDescriptions.length === 0 ? {} : { competingDescriptions }),
    concepts: concepts.map((c) => `${c.name} ≜ ${c.wording}`),
    competing: competing.map((c) => ({
      name: c.name,
      versions: c.versions.map((v) =>
        'wording' in v ? `${c.name} ≜ ${v.wording}` : `${c.name} retired`,
      ),
    })),
  };
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

/** Every description of a context, in append order, exactly as recorded. */
export interface ContextHistoryView {
  readonly context: string;
  readonly versions: readonly {
    readonly id: string;
    readonly at: string;
    readonly subject: string;
    readonly relation: string;
    readonly reason?: string;
    readonly supersedes: readonly string[];
  }[];
}

/** A cut's figures as last recorded, and when. */
export type EfficiencyView = Omit<EfficiencyEntry, 'id' | 'kind' | 'context'>;

/** Where a concept stands: live in one version, retired, or competing. */
export type Standing =
  | { readonly is: 'live'; readonly current: WordedEntry }
  | { readonly is: 'retired'; readonly current: RetireEntry }
  | { readonly is: 'competing'; readonly current: readonly VersionEntry[] };

/** The journal folded: its contexts, concepts and decisions, each in the order
 *  first recorded. */
export class Folded {
  /** The project's purpose entries, in append order. */
  readonly purposes: PurposeEntry[] = [];
  /** Each context's entries by name, in append order. */
  readonly contexts = new Map<string, ContextEntry[]>();
  /** Each context's concepts by name, each with its versions in append order. */
  readonly concepts = new Map<string, Map<string, VersionEntry[]>>();
  /** Each decision by its entry's id, in append order. */
  readonly decisions = new Map<string, DecideEntry>();
  /** The entries of the decisions each id names, in append order. */
  readonly named = new Map<string, string[]>();
  /** The acceptances recorded for each decision's entry, in append order. */
  readonly acceptances = new Map<string, AcceptEntry[]>();
  /** The ids of the decisions superseding each decision's entry. */
  readonly supersededBy = new Map<string, string[]>();
  /** The kinds recorded for each decision's entry, in append order. */
  readonly kinds = new Map<string, KindRecord[]>();
  /** The deprecation recorded for each decision's entry, the first kept. */
  readonly deprecations = new Map<string, DeprecateEntry>();
  /** Each context's cuts by name, each with its latest efficiency entry. */
  readonly efficiencies = new Map<string, Map<string, EfficiencyEntry>>();
  /** The closings of the journal's books, in append order. */
  readonly closes: CloseEntry[] = [];
  /** Every entry folded, by its id. */
  readonly byId = new Map<string, Entry>();

  constructor(entries: readonly Entry[]) {
    for (const entry of entries) {
      this.byId.set(entry.id, entry);
      switch (entry.kind) {
        case 'purpose':
          this.purposes.push(entry);
          break;
        case 'context':
          this.contexts.set(entry.name, [
            ...(this.contexts.get(entry.name) ?? []),
            entry,
          ]);
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
        case 'decide': {
          const target =
            entry.supersedesEntry ??
            (entry.supersedes === null
              ? undefined
              : this.only(entry.supersedes));
          this.decisions.set(entry.id, entry);
          if (entry.decisionKind !== undefined)
            this.kinds.set(entry.id, [
              { entry: entry.id, kind: entry.decisionKind },
            ]);
          this.named.set(entry.decisionId, [
            ...(this.named.get(entry.decisionId) ?? []),
            entry.id,
          ]);
          if (target !== undefined)
            this.supersededBy.set(target, [
              ...(this.supersededBy.get(target) ?? []),
              entry.decisionId,
            ]);
          break;
        }
        case 'accept': {
          const target = entry.entry ?? this.only(entry.decisionId);
          if (target !== undefined)
            this.acceptances.set(target, [
              ...(this.acceptances.get(target) ?? []),
              entry,
            ]);
          break;
        }
        case 'efficiency': {
          const cuts =
            this.efficiencies.get(entry.context) ??
            new Map<string, EfficiencyEntry>();
          this.efficiencies.set(entry.context, cuts);
          cuts.set(entry.cut, entry);
          break;
        }
        case 'deprecate':
          if (!this.deprecations.has(entry.entry))
            this.deprecations.set(entry.entry, entry);
          break;
        case 'classify':
          this.kinds.set(entry.entry, [
            ...(this.kinds.get(entry.entry) ?? []),
            {
              entry: entry.id,
              kind: entry.decisionKind,
              ...(entry.reason === undefined ? {} : { reason: entry.reason }),
            },
          ]);
          break;
        case 'close':
          this.closes.push(entry);
          break;
      }
    }
    // What a close took out still orders the views: each context and concept
    // in the order first recorded, as the latest close holding it records it.
    const reorder = <V>(map: Map<string, V>, key: (name: string) => string) => {
      const sorted = [...map].sort(([a], [b]) => (key(a) < key(b) ? -1 : 1));
      map.clear();
      for (const [name, value] of sorted) map.set(name, value);
    };
    reorder(this.contexts, (name) => this.identity(name) as string);
    for (const [context, concepts] of this.concepts)
      reorder(
        concepts,
        (name) => this.conceptIdentity(context, name) as string,
      );
  }

  /** The identity of `context`: the one the latest close holding it records,
   *  else the id of its first entry; `undefined` when the journal has none. */
  identity(context: string): string | undefined {
    for (const close of [...this.closes].reverse())
      if (Object.hasOwn(close.identities, context))
        return close.identities[context];
    return this.contexts.get(context)?.[0]?.id;
  }

  /** The id of the first version of `name` in `context`: the one the latest
   *  close holding it records, else its first version's; `undefined` when the
   *  context does not have it. */
  conceptIdentity(context: string, name: string): string | undefined {
    for (const close of [...this.closes].reverse()) {
      const recorded = close.concepts[context]?.[name];
      if (recorded !== undefined) return recorded;
    }
    return this.versions(context, name)[0]?.id;
  }

  /** The latest closing of the books, which the history readings name; none
   *  while the journal does not open from one. */
  booksClosed():
    | {
        readonly booksClosed: {
          readonly entry: string;
          readonly at: string;
          readonly by?: string;
          readonly commit: string;
        };
      }
    | Record<string, never> {
    const latest = this.closes.at(-1);
    return latest === undefined
      ? {}
      : {
          booksClosed: {
            entry: latest.id,
            at: latest.at,
            ...(latest.by === undefined ? {} : { by: latest.by }),
            commit: latest.commit,
          },
        };
  }

  /** What a close brings forward, verbatim and in id order: the current
   *  purpose entries; each context's current descriptions (every entry of a
   *  context none of whose descriptions is current); each concept's current
   *  versions unless it stands retired; and each standing decision with the
   *  acceptances recorded for it and the classification governing its kind,
   *  where one does. */
  standingEntries(): Entry[] {
    const carried: Entry[] = [...this.currentPurposes()];
    for (const [name, recorded] of this.contexts) {
      const current = this.currentDescriptions(name);
      carried.push(...(current.length === 0 ? recorded : current));
    }
    for (const [context, name] of this.carriedConcepts()) {
      const standing = this.standing(context, name) as Standing;
      carried.push(
        ...(standing.is === 'competing'
          ? standing.current
          : [standing.current]),
      );
    }
    for (const decision of this.decisionViews().filter(stands)) {
      carried.push(this.decisions.get(decision.entry) as DecideEntry);
      carried.push(...(this.acceptances.get(decision.entry) ?? []));
      const governing = this.kinds.get(decision.entry)?.at(-1)?.entry;
      if (governing !== undefined && governing !== decision.entry)
        carried.push(this.byId.get(governing) as Entry);
    }
    return carried.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  }

  /** Each concept a close brings forward, by its context and name: every one
   *  that does not stand retired. */
  carriedConcepts(): [context: string, name: string][] {
    return [...this.concepts].flatMap(([context, concepts]) =>
      [...concepts.keys()]
        .filter((name) => this.standing(context, name)?.is !== 'retired')
        .map((name): [string, string] => [context, name]),
    );
  }

  /** The entry of the one decision `id` names among those folded so far;
   *  `undefined` when none or several do. A reference written by id alone
   *  binds only where it is unambiguous. */
  private only(id: string): string | undefined {
    const entries = this.named.get(id) ?? [];
    return entries.length === 1 ? entries[0] : undefined;
  }

  /** The entries of the decisions `ref`, an entry's id or a decision's id,
   *  names: one, none, or several when an id is shared. */
  resolve(ref: string): readonly string[] {
    return this.decisions.has(ref) ? [ref] : (this.named.get(ref) ?? []);
  }

  /** Each cut of `context` with the figures last recorded for it, in the order
   *  its cuts were first recorded. */
  efficiency(context: string): EfficiencyView[] {
    return [...(this.efficiencies.get(context)?.values() ?? [])].map(
      ({ cut, agentRuns, rounds, wholeCheckRuns, tokens, at }) => ({
        cut,
        agentRuns,
        rounds,
        wholeCheckRuns,
        tokens,
        at,
      }),
    );
  }

  /** The project's current purpose entries: those no later one supersedes. */
  currentPurposes(): readonly PurposeEntry[] {
    const superseded = new Set(this.purposes.flatMap((p) => p.supersedes));
    return this.purposes.filter((p) => !superseded.has(p.id));
  }

  /** The project's purpose: one statement when settled, `null` with each
   *  distinct statement listed when competing, `null` when none is recorded. */
  purpose(): PurposeView {
    const statements = [
      ...new Set(this.currentPurposes().map((p) => p.statement)),
    ];
    return statements.length > 1
      ? { purpose: null, competingPurposes: statements }
      : { purpose: statements[0] ?? null };
  }

  /** The current entries of `context`, a context the journal has: those no
   *  later entry of its name supersedes. */
  currentDescriptions(context: string): readonly ContextEntry[] {
    const recorded = this.contexts.get(context) ?? [];
    const superseded = new Set(recorded.flatMap((c) => c.supersedes ?? []));
    return recorded.filter((c) => !superseded.has(c.id));
  }

  /** The distinct descriptions of `context`'s current entries, in append
   *  order: one when settled, two or more when competing. */
  descriptions(context: string): Description[] {
    const distinct: Description[] = [];
    for (const { subject, relation } of this.currentDescriptions(context))
      if (
        !distinct.some((d) => d.subject === subject && d.relation === relation)
      )
        distinct.push({ subject, relation });
    return distinct;
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
    const descriptions = this.descriptions(context);
    const settled = descriptions.length === 1 ? descriptions[0] : undefined;
    const view = {
      name: context,
      subject: settled?.subject ?? null,
      relation: settled?.relation ?? null,
      competingDescriptions: settled === undefined ? descriptions : [],
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

  /** Every description of `context`, a context the journal has, each exactly
   *  as recorded; `supersedes` is empty where an entry names none. */
  contextHistory(context: string): ContextHistoryView {
    return {
      context,
      versions: (this.contexts.get(context) ?? []).map((c) => ({
        id: c.id,
        at: c.at,
        subject: c.subject,
        relation: c.relation,
        ...(c.reason === undefined ? {} : { reason: c.reason }),
        supersedes: [...(c.supersedes ?? [])],
      })),
    };
  }

  /** Why the decision recorded by `entry` is deprecated; `undefined` while it
   *  is not. */
  deprecation(entry: string): Deprecation | undefined {
    const recorded = this.deprecations.get(entry);
    return recorded === undefined
      ? undefined
      : { entry: recorded.id, reason: recorded.reason };
  }

  /** The status the decision recorded by `entry` holds now. */
  status(entry: string): DecisionView['status'] {
    if ((this.supersededBy.get(entry) ?? []).length > 0) return 'superseded';
    if (this.deprecation(entry) !== undefined) return 'deprecated';
    const recorded = this.decisions.get(entry) as DecideEntry;
    return recorded.status === 'accepted' || this.acceptances.has(entry)
      ? 'accepted'
      : 'open';
  }

  /** Every decision, in the order recorded, as `decisions` gives it. */
  decisionViews(): DecisionView[] {
    return [...this.decisions.values()].map((d) => {
      const status = this.status(d.id);
      const deprecation =
        status === 'deprecated' ? this.deprecation(d.id) : undefined;
      return {
        title: d.title,
        context: d.context,
        status,
        kind: this.kinds.get(d.id)?.at(-1)?.kind ?? null,
        situation: d.situation,
        decision: d.decision,
        consequences: d.consequences,
        supersedes: d.supersedes,
        supersededBy: [...(this.supersededBy.get(d.id) ?? [])],
        kinds: [...(this.kinds.get(d.id) ?? [])],
        ...(d.cut === undefined ? {} : { cut: d.cut }),
        ...(d.keeps === undefined ? {} : { keeps: [...d.keeps] }),
        ...(deprecation === undefined ? {} : { deprecation }),
        id: d.decisionId,
        entry: d.id,
      };
    });
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
