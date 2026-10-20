// ─────────────────────────────────────────────────────────────────────────────
// The VIEWS computed from the concept journal: the design state and the
// current design of each bounded context, a concept's history, a context's
// own history, and the decisions with their status.
// Each is a pure function of the entries in append order: no clock, no
// randomness, so the same journal answers the same every time.
//
// CLOSED BOOKS. A close opens a new period with an entry per current version
// of each standing item, each an ordinary entry of its item's kind superseding
// nothing, so every fold reads the period from its openings as it reads any
// entries; nothing of the closed period is read. A context's IDENTITY is the
// identity its earliest entry carrying one carries, else its earliest entry's
// id. The history readings name the latest opening's close, `booksClosed`, with
// the commit holding the closed period, and mark each opening they list as
// brought forward from it. A version joined from a line of work that branched
// before a close supersedes versions the journal does not hold, so it competes
// with its item's opening; a reference to a decision's entry the journal does
// not hold binds by the decision's name where one decision has it.
//
// A concept's CURRENT versions are those no later version of it supersedes.
// One current version is the concept: live, or retired when it is a
// retirement. Two or more are COMPETING versions (branches that each
// superseded the same one), reported in append order, none chosen, until a
// later version supersedes them all.
//
// A concept is ONE THROUGH ITS NAMES: the versions of a context joined by
// supersession or by a shared name, whatever order they were recorded in, so
// a rename to a name and a define of it on joined lines are one concept,
// competing. A rename gives it a new name from then on, and every name it has
// had in the period names it. Its name is its current version's; while
// competing versions name it differently it is the name of the latest version
// they all supersede, else of its earliest version. A built-from reference
// names a concept by the name it had when written: the design shows it by the
// concept's current name, the history exactly as recorded.
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
// current description; every earlier one stays in the context's history. A
// context is RETIRED while every current entry of it is a retirement, one or
// several: no reading of the design shows it or its concepts, its decisions
// are history, and a close carries nothing of it; a later description with
// its reason, superseding the retirements, brings it back as it stood. A
// retirement current beside a current description COMPETES with it as a
// description does, marked retired with its reason, until a later
// description or retirement supersedes them all.
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
// concepts, each a line `term ≜ correction`; nothing else. WHAT STANDS of a
// design or a decision is what a view shows unless history is asked for: a
// design without its retired concepts or the reason each live concept's
// current version was written, a decision without the decisions it replaced
// or the kinds recorded for it before the governing one.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  ContextEntry,
  DecideEntry,
  DecisionKind,
  DeprecateEntry,
  Draft,
  EfficiencyEntry,
  Entry,
  PurposeEntry,
  RetireContextEntry,
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
 *  `retired` and no wording, and a version naming the concept otherwise than
 *  the name it is listed under carries the name it gives. */
export type CompetingVersion =
  | (Omit<ConceptView, 'name'> & { readonly name?: string })
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

/** One of a context's competing descriptions; a retirement among them carries
 *  `retired` and its reason. */
export type CompetingDescription =
  | Description
  | { readonly retired: true; readonly reason: string };

/** A context's design; `subject` and `relation` are `null` while its
 *  description is competing, each competing one listed in append order. */
export interface ContextView {
  readonly name: string;
  readonly subject: string | null;
  readonly relation: string | null;
  readonly competingDescriptions: readonly CompetingDescription[];
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
  /** The commit it was brought forward from, where its entry is an opening. */
  readonly broughtForward?: string;
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
 *  each as one line `term ≜ correction`, and each concept's competing versions
 *  as such lines, a retirement among them as `term retired`; nothing else. */
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
        'wording' in v
          ? `${v.name ?? c.name} ≜ ${v.wording}`
          : `${c.name} retired`,
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
    readonly name: string;
    readonly was?: string;
    readonly wording?: string;
    readonly builtFrom?: readonly string[];
    readonly reason: string;
    readonly supersedes: readonly string[];
    readonly broughtForward?: string;
  }[];
}

/** Every description of a context and every retirement of it, in append
 *  order, exactly as recorded; a retirement carries `retired` and its reason. */
export interface ContextHistoryView {
  readonly context: string;
  readonly versions: readonly (
    | {
        readonly id: string;
        readonly at: string;
        readonly subject: string;
        readonly relation: string;
        readonly reason?: string;
        readonly supersedes: readonly string[];
        readonly broughtForward?: string;
      }
    | {
        readonly id: string;
        readonly at: string;
        readonly retired: true;
        readonly reason: string;
        readonly supersedes: readonly string[];
        readonly broughtForward?: string;
      }
  )[];
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
  /** Each context's retirements by name, in append order. */
  readonly retirements = new Map<string, RetireContextEntry[]>();
  /** Each context's concepts, each by the name of its earliest version, with
   *  its versions in append order. */
  readonly concepts = new Map<string, Map<string, VersionEntry[]>>();
  /** Each context's names, each with the concept it names: every name a
   *  concept has had in the period, by the name of its earliest version. */
  private readonly names = new Map<string, Map<string, string>>();
  /** Each decision by its entry's id, in append order. */
  readonly decisions = new Map<string, DecideEntry>();
  /** The entries of the decisions each id names, in append order. */
  readonly named = new Map<string, string[]>();
  /** The entries of the decisions whose acceptance is recorded. */
  readonly acceptances = new Set<string>();
  /** The ids of the decisions superseding each decision's entry. */
  readonly supersededBy = new Map<string, string[]>();
  /** The kinds recorded for each decision's entry, in append order. */
  readonly kinds = new Map<string, KindRecord[]>();
  /** The deprecation recorded for each decision's entry, the first kept. */
  readonly deprecations = new Map<string, DeprecateEntry>();
  /** Each context's cuts by name, each with its latest efficiency entry. */
  readonly efficiencies = new Map<string, Map<string, EfficiencyEntry>>();
  /** The latest opening entry, where a close opened the journal's period. */
  private opening: Entry | undefined;

  constructor(entries: readonly Entry[]) {
    // Every decision the journal holds, by its name: a reference to an entry
    // it does not hold, one a close took out, binds by the decision's name,
    // where one decision has it.
    const held = new Map<string, string[]>();
    for (const entry of entries)
      if (entry.kind === 'decide')
        held.set(entry.decisionId, [
          ...(held.get(entry.decisionId) ?? []),
          entry.id,
        ]);
    const decisions = new Set([...held.values()].flat());
    /** The decision a reference to the entry `ref` of the decision `name`
     *  binds to; one by name alone binds among the decisions folded so far. */
    const bind = (ref: string | undefined, name: string) => {
      if (ref === undefined) return this.only(name);
      if (decisions.has(ref)) return ref;
      const named = held.get(name) ?? [];
      return named.length === 1 ? named[0] : undefined;
    };
    /** Each context's concept versions, in append order. */
    const recorded = new Map<string, VersionEntry[]>();
    for (const entry of entries) {
      if (broughtForward(entry) !== undefined) this.opening = entry;
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
        case 'retire-context':
          this.retirements.set(entry.context, [
            ...(this.retirements.get(entry.context) ?? []),
            entry,
          ]);
          break;
        case 'define':
        case 'supersede':
        case 'rename':
        case 'retire': {
          recorded.set(entry.context, [
            ...(recorded.get(entry.context) ?? []),
            entry,
          ]);
          break;
        }
        case 'decide': {
          const target =
            entry.supersedes === null
              ? undefined
              : bind(entry.supersedesEntry, entry.supersedes);
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
          const target = bind(entry.entry, entry.decisionId);
          if (target !== undefined) this.acceptances.add(target);
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
        case 'deprecate': {
          const target = bind(entry.entry, entry.decisionId);
          if (target !== undefined && !this.deprecations.has(target))
            this.deprecations.set(target, entry);
          break;
        }
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
      }
    }
    for (const [context, versions] of recorded) {
      const inContext = new Map<string, VersionEntry[]>();
      const names = new Map<string, string>();
      for (const concept of joined(versions)) {
        const key = (concept[0] as VersionEntry).name;
        inContext.set(key, concept);
        for (const v of concept)
          for (const name of v.kind === 'rename' ? [v.name, v.was] : [v.name])
            names.set(name, key);
      }
      this.concepts.set(context, inContext);
      this.names.set(context, names);
    }
  }

  /** The identity of `context`: the one its earliest entry carrying one
   *  carries, else its earliest entry's id; `undefined` when the journal has
   *  no such context. */
  identity(context: string): string | undefined {
    const recorded = this.contexts.get(context) ?? [];
    return (
      recorded.find((c) => c.identity !== undefined)?.identity ??
      recorded[0]?.id
    );
  }

  /** The latest closing of the books, which the history readings name: when
   *  its openings were written, who closed, and the commit holding the closed
   *  period; none while no close opened the journal's period. */
  booksClosed():
    | {
        readonly booksClosed: {
          readonly at: string;
          readonly by?: string;
          readonly commit: string;
        };
      }
    | Record<string, never> {
    const opening = this.opening;
    return opening === undefined
      ? {}
      : {
          booksClosed: {
            at: opening.at,
            ...(opening.by === undefined ? {} : { by: opening.by }),
            commit: broughtForward(opening) as string,
          },
        };
  }

  /** The opening entries of a close at `commit`, in the order the readings
   *  list what they open: the purpose; each context, a retirement competing
   *  with its description opening beside it; each live concept, context by
   *  context, under its current name, each built-from reference by its
   *  concept's current name; each standing decision. One per current
   *  version, so competing versions still compete, each superseding nothing
   *  and brought forward from `commit`; a retired context with its concepts
   *  and decisions, a retired concept, a superseded or deprecated decision,
   *  an acceptance, a classification and a cut's figures stay in the closed
   *  period. A close is refused before while any concept's current versions
   *  name it differently (`namesCompeting`). */
  openings(commit: string): Draft[] {
    const opened = { supersedes: [], broughtForward: commit } as const;
    const drafts: Draft[] = this.currentPurposes().map((p) => ({
      kind: 'purpose',
      statement: p.statement,
      ...(p.reason === undefined ? {} : { reason: p.reason }),
      ...opened,
    }));
    for (const name of this.contexts.keys()) {
      if (this.retired(name)) continue;
      const identity = this.identity(name) as string;
      for (const c of this.currentEntries(name))
        drafts.push(
          c.kind === 'retire-context'
            ? {
                kind: 'retire-context',
                context: name,
                reason: c.reason,
                ...opened,
              }
            : {
                kind: 'context',
                name,
                subject: c.subject,
                relation: c.relation,
                ...(c.reason === undefined ? {} : { reason: c.reason }),
                identity,
                ...opened,
              },
        );
    }
    for (const context of new Set([
      ...this.contexts.keys(),
      ...this.concepts.keys(),
    ]))
      for (const versions of this.retired(context)
        ? []
        : (this.concepts.get(context)?.values() ?? [])) {
        const standing = settle(versions) as Standing;
        if (standing.is === 'retired') continue;
        for (const v of standing.is === 'live'
          ? [standing.current]
          : standing.current)
          drafts.push(
            v.kind === 'retire'
              ? {
                  kind: 'retire',
                  context,
                  name: v.name,
                  reason: v.reason,
                  ...opened,
                }
              : {
                  kind: 'define',
                  context,
                  name: v.name,
                  wording: v.wording,
                  builtFrom: v.builtFrom.map((ref) =>
                    this.current(context, ref),
                  ),
                  reason: v.reason,
                  ...opened,
                },
          );
      }
    for (const view of this.decisionViews().filter(
      (d) => stands(d) && !this.retired(d.context),
    ))
      drafts.push({
        kind: 'decide',
        decisionId: view.id,
        context: view.context,
        title: view.title,
        situation: view.situation,
        decision: view.decision,
        consequences: view.consequences,
        status: view.status === 'accepted' ? 'accepted' : 'open',
        supersedes: null,
        ...(view.kind === null ? {} : { decisionKind: view.kind }),
        broughtForward: commit,
      });
    return drafts;
  }

  /** Each concept of a context not retired, by its context and the name it is
   *  listed under, whose current versions name it differently. */
  namesCompeting(): { readonly context: string; readonly name: string }[] {
    return [...this.concepts].flatMap(([context, concepts]) =>
      this.retired(context)
        ? []
        : [...concepts.values()].flatMap((versions) => {
            const standing = settle(versions) as Standing;
            return standing.is === 'competing' &&
              new Set(standing.current.map((v) => v.name)).size > 1
              ? [{ context, name: nameIn(versions) as string }]
              : [];
          }),
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
   *  later entry of its name, nor a retirement of it, supersedes. */
  currentDescriptions(context: string): readonly ContextEntry[] {
    const recorded = this.contexts.get(context) ?? [];
    const superseded = new Set(
      [...recorded, ...(this.retirements.get(context) ?? [])].flatMap(
        (c) => c.supersedes ?? [],
      ),
    );
    return recorded.filter((c) => !superseded.has(c.id));
  }

  /** The retirements of `context` no later description or retirement of it
   *  supersedes. */
  currentRetirements(context: string): readonly RetireContextEntry[] {
    const retirements = this.retirements.get(context) ?? [];
    const superseded = new Set(
      [...(this.contexts.get(context) ?? []), ...retirements].flatMap(
        (c) => c.supersedes ?? [],
      ),
    );
    return retirements.filter((r) => !superseded.has(r.id));
  }

  /** Whether `context` is retired: every current entry of it, one or
   *  several, is a retirement. */
  retired(context: string): boolean {
    return (
      this.currentDescriptions(context).length === 0 &&
      this.currentRetirements(context).length > 0
    );
  }

  /** The current descriptions and retirements of `context`, in append
   *  order. */
  currentEntries(
    context: string,
  ): readonly (ContextEntry | RetireContextEntry)[] {
    return [
      ...this.currentDescriptions(context),
      ...this.currentRetirements(context),
    ].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
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

  /** The versions of the concept `name`, its current name or one it had, names
   *  in `context`, in append order; none when the context has no such name. */
  versions(context: string, name: string): readonly VersionEntry[] {
    const first = this.names.get(context)?.get(name);
    return first === undefined
      ? []
      : (this.concepts.get(context)?.get(first) ?? []);
  }

  /** Where the concept `name` names in `context` stands; `undefined` when the
   *  context has no such name. */
  standing(context: string, name: string): Standing | undefined {
    return settle(this.versions(context, name));
  }

  /** The name of the concept `name`, its current name or one it had, names in
   *  `context`; `undefined` when the context has no such name. */
  nameOf(context: string, name: string): string | undefined {
    return nameIn(this.versions(context, name));
  }

  /** Whether `a` and `b` name one concept in `context`. */
  same(context: string, a: string, b: string): boolean {
    const names = this.names.get(context);
    return names?.get(a) !== undefined && names.get(a) === names.get(b);
  }

  /** The concept `ref` names in `context` by its current name; `ref` as
   *  written where the context has no such name. */
  private current(context: string, ref: string): string {
    return this.nameOf(context, ref) ?? ref;
  }

  /** What `version` of a concept in `context` says, each concept it is built
   *  from by its current name. */
  private stated(context: string, version: WordedEntry) {
    return {
      wording: version.wording,
      builtFrom: version.builtFrom.map((ref) => this.current(context, ref)),
      reason: version.reason,
    };
  }

  /** The current design of `context`, a context the journal has. */
  design(context: string): ContextView {
    const descriptions = this.descriptions(context);
    const retirements = this.currentRetirements(context);
    const settled =
      descriptions.length === 1 && retirements.length === 0
        ? descriptions[0]
        : undefined;
    /** The competing descriptions, alike ones once, and retirements, in
     *  append order. */
    const competing: CompetingDescription[] = [];
    for (const c of this.currentEntries(context))
      if (c.kind === 'retire-context')
        competing.push({ retired: true, reason: c.reason });
      else if (
        !competing.some(
          (d) =>
            'subject' in d &&
            d.subject === c.subject &&
            d.relation === c.relation,
        )
      )
        competing.push({ subject: c.subject, relation: c.relation });
    const view = {
      name: context,
      subject: settled?.subject ?? null,
      relation: settled?.relation ?? null,
      competingDescriptions: settled === undefined ? competing : [],
      concepts: [] as ConceptView[],
      competing: [] as ContextView['competing'][number][],
      retired: [] as ContextView['retired'][number][],
    };
    for (const versions of this.concepts.get(context)?.values() ?? []) {
      const standing = settle(versions) as Standing;
      const name = nameIn(versions) as string;
      switch (standing.is) {
        case 'live':
          view.concepts.push({
            name,
            ...this.stated(context, standing.current),
          });
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
                : {
                    ...(v.name === name ? {} : { name: v.name }),
                    ...this.stated(context, v),
                  },
            ),
          });
          break;
      }
    }
    return view;
  }

  /** Every version of the concept `name`, its current name or one it had,
   *  names in `context`, each exactly as recorded with the name it was
   *  recorded under, under the concept's name now. */
  history(context: string, name: string): HistoryView {
    const versions = this.versions(context, name);
    return {
      context,
      name: nameIn(versions) ?? name,
      versions: versions.map((v) => ({
        id: v.id,
        at: v.at,
        kind: v.kind,
        name: v.name,
        ...(v.kind === 'rename' ? { was: v.was } : {}),
        ...(v.kind === 'retire'
          ? {}
          : { wording: v.wording, builtFrom: [...v.builtFrom] }),
        reason: v.reason,
        supersedes: [...v.supersedes],
        ...marked(v),
      })),
    };
  }

  /** Every description and retirement of `context`, a context the journal
   *  has, in append order, each exactly as recorded; `supersedes` is empty
   *  where a description names none. */
  contextHistory(context: string): ContextHistoryView {
    const entries = [
      ...(this.contexts.get(context) ?? []),
      ...(this.retirements.get(context) ?? []),
    ].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    return {
      context,
      versions: entries.map((c) =>
        c.kind === 'retire-context'
          ? {
              id: c.id,
              at: c.at,
              retired: true as const,
              reason: c.reason,
              supersedes: [...c.supersedes],
              ...marked(c),
            }
          : {
              id: c.id,
              at: c.at,
              subject: c.subject,
              relation: c.relation,
              ...(c.reason === undefined ? {} : { reason: c.reason }),
              supersedes: [...(c.supersedes ?? [])],
              ...marked(c),
            },
      ),
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
        ...marked(d),
        id: d.decisionId,
        entry: d.id,
      };
    });
  }
}

/** The commit `entry` was brought forward from, where it is an opening. */
function broughtForward(entry: Entry): string | undefined {
  return 'broughtForward' in entry ? entry.broughtForward : undefined;
}

/** `entry`'s mark as brought forward, where it is an opening: none else. */
function marked(entry: Entry): { readonly broughtForward?: string } {
  const commit = broughtForward(entry);
  return commit === undefined ? {} : { broughtForward: commit };
}

/** Where a concept with `versions`, in append order, stands; `undefined` for
 *  none. */
function settle(versions: readonly VersionEntry[]): Standing | undefined {
  if (versions.length === 0) return undefined;
  const superseded = new Set(versions.flatMap((v) => v.supersedes));
  const current = versions.filter((v) => !superseded.has(v.id));
  if (current.length > 1) return { is: 'competing', current };
  const one = current[0] ?? (versions.at(-1) as VersionEntry);
  return one.kind === 'retire'
    ? { is: 'retired', current: one }
    : { is: 'live', current: one };
}

/** The name of a concept with `versions`, in append order: the one name its
 *  current versions give it, or, while competing versions name it
 *  differently, that of the latest version every current one supersedes,
 *  directly or through others, else of its earliest version; `undefined` for
 *  none. */
function nameIn(versions: readonly VersionEntry[]): string | undefined {
  const standing = settle(versions);
  if (standing === undefined) return undefined;
  if (standing.is !== 'competing') return standing.current.name;
  const given = new Set(standing.current.map((v) => v.name));
  if (given.size === 1) return [...given][0];
  const byId = new Map(versions.map((v) => [v.id, v]));
  const ancestry = standing.current.map((v) => {
    const reached = new Set<string>();
    const pending = [...v.supersedes];
    for (let id = pending.pop(); id !== undefined; id = pending.pop()) {
      const version = byId.get(id);
      if (version === undefined || reached.has(id)) continue;
      reached.add(id);
      pending.push(...version.supersedes);
    }
    return reached;
  });
  const common = versions.filter((v) => ancestry.every((a) => a.has(v.id)));
  return (common.at(-1) ?? (versions[0] as VersionEntry)).name;
}

/** The concepts `versions`, a context's in append order, make: the versions
 *  joined by supersession or by a name they share (a rename's earlier name
 *  included), whatever the order they were recorded in, each concept's in
 *  append order and the concepts in the order of their earliest versions. */
function joined(versions: readonly VersionEntry[]): VersionEntry[][] {
  const parent = versions.map((_, i) => i);
  const root = (i: number): number => {
    let r = i;
    while (parent[r] !== r) r = parent[r] as number;
    parent[i] = r;
    return r;
  };
  const join = (a: number, b: number) => {
    const [x, y] = [root(a), root(b)];
    parent[Math.max(x, y)] = Math.min(x, y);
  };
  const byName = new Map<string, number>();
  const byId = new Map(versions.map((v, i) => [v.id, i]));
  versions.forEach((v, i) => {
    for (const name of v.kind === 'rename' ? [v.name, v.was] : [v.name]) {
      const other = byName.get(name);
      if (other === undefined) byName.set(name, i);
      else join(i, other);
    }
    for (const id of v.supersedes) {
      const other = byId.get(id);
      if (other !== undefined) join(i, other);
    }
  });
  const concepts = new Map<number, VersionEntry[]>();
  versions.forEach((v, i) =>
    concepts.set(root(i), [...(concepts.get(root(i)) ?? []), v]),
  );
  return [...concepts.values()];
}
