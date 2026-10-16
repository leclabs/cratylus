// ─────────────────────────────────────────────────────────────────────────────
// The concepts capability's VERB SURFACE — `concepts <verb> [args]`.
//
//   state      the design state, for a model to read: the project's purpose,
//              the delivered practice apart, then each of its own contexts'
//              subject, relation, live concepts each as `name ≜ wording`, and
//              competing versions; what a session reads first to reconstitute
//   design     the delivered practice apart, then the current design of each of
//              the project's own contexts, each concept with its parts
//   history    every version of one concept, or of a context's description
//              with the effort recorded for its past work
//   decisions  the decisions with their status, each by its title first
//   leakage    where realization shows through the journal's design and
//              examples, and where a wording tells what is not its current
//              meaning: a reading of the concept journal
//   purpose    record the project's purpose, or, with a reason, change it
//   context    record a bounded context, or, with a reason, change one
//   define     record a concept's first version
//   supersede  record a version superseding every current one
//   retire     record a concept's retirement
//   decide     record a decision of realization, open or accepted
//   accept     record the acceptance of an open decision
//   deprecate  record that a standing decision no longer applies, with why
//
// WHAT STANDS. A decision stands while it is open or accepted, until a later
// decision supersedes it or a later entry deprecates it. Every example file
// present is current. `state` is the design state alone: no decision, no
// built-from part, no reason, no retired concept, no history. `design` and
// `decisions` read only what stands, adding the history only when asked with
// `--history`; `history` is history asked for.
//
// HISTORY READ AS RECORDED. Entries are never rewritten, so what earlier
// workflows recorded is still read: a decision recorded with a kind, the
// classifications of a decision's kind, a decision recorded about a cut or
// naming example files it keeps, each read by its own status alone, and the
// efficiency entries recorded for cuts, the past effort a context's own
// history shows.
//
// A query appends nothing and prints JSON; when it read past entries written by
// a newer runtime in the journal, its answer also carries `uninterpreted`,
// saying what it read past and how it was read.
// An appending verb appends exactly one entry, stamped with who appended it, and
// prints it as JSON; when a concept's or context's wording leaks
// implementation, cites a decision by its number, recounts its history or
// only extends the version it replaces, the answer also carries the
// `warnings`, and nothing is refused for any of them. A decision records
// realization and is never warned. A context's own words include each plain
// word its current subject names, though never a command, a quotation in code
// type or a flag that holds it. Every refusal is one line opening with
// `concepts <verb>:`, thrown before anything is appended.
//
// The capability EXPLAINS ITSELF from the declarations below: its name and when
// to reach for it, and for each verb the concept it acts on, its purpose, when to
// reach for it, whether it reads or appends, and each parameter it takes. Its
// help prints the same declarations, and its calls are read against them.
// ─────────────────────────────────────────────────────────────────────────────

import { CAPABILITY_SUMMARIES } from '../../capability.js';
import type { CapabilityInterface, ExplainedVerb } from '../../explanation.js';
import {
  type Argv,
  type VerbFlags,
  readArgv,
  switchFlag,
  valueFlag,
} from '../../verb-flags.js';
import { verbOf } from '../plan/argv.js';
import {
  type DeliveredContext,
  deliveredDesign,
  deliveredState,
  marksOf,
  practiceOf,
  qualifiedName,
} from './delivered.js';
import type { ContextEntry, DecideEntry, WordedEntry } from './entries.js';
import { type Journal, journalAt } from './journal.js';
import {
  type Leak,
  type Passage,
  type Vocabulary,
  type Warning,
  extending,
  leaks,
  recounts,
  visibleExamples,
  vocabulary,
} from './leakage.js';
import {
  Folded,
  type Meaning,
  designState,
  standingDecision,
  standingDesign,
  stands,
} from './views.js';

/** The recorded bounded context `what` belongs to, given where it must be. */
const inContext = (what: string) =>
  ({
    context: valueFlag(
      `The bounded context the ${what} belongs to, one already recorded with the context verb`,
      { required: true },
    ),
  }) as const;

/** The concept a verb acts on, named in its bounded context. */
const concept = (description: string) =>
  ({ name: 'concept', description }) as const;

/** A concept a version is built from, given once per concept. */
const BUILT_FROM = {
  'built-from': valueFlag(
    'A concept it is built from; repeat once per concept, none for a primitive',
    { repeats: true },
  ),
} as const;

/** The values a decision is recorded with. */
const STATUSES = ['open', 'accepted'] as const;

/** Whether `status` is one a decision is recorded with. */
const isStatus = (status: string): status is (typeof STATUSES)[number] =>
  (STATUSES as readonly string[]).includes(status);

/** The concepts capability's verbs, queries first, each with the concept it acts
 *  on, its purpose, when to reach for it, whether it reads or appends, the
 *  positional it acts on and the flags it takes. */
export const VERBS = {
  state: {
    concept: 'conceptual design',
    effect: 'reads',
    purpose:
      'Read the design state, worked out afresh from the journal for a model to read: the project’s purpose first, what the project is for; then, in a place of its own (practice), the practice the project’s agents work by, delivered with the installation and never part of the project’s design; then each of the project’s own bounded contexts: its subject, its place in the context map, its live concepts each as one line “name ≜ wording”, and the competing versions none has settled, each such a line or “name retired”; nothing else: decisions, the concepts each is built from, why each version was written, earlier versions and retired concepts are read apart',
    when: 'First, at the start of a session or after it was compacted, for the delivered practice and each bounded context the work touches, to recover what the design means from what is recorded rather than from memory, before reading the standing decisions the work needs and reading the design back; the delivered practice, each context named by its origin and context, marked delivered and read-only, is shown apart from the project’s contexts and never in its context map, unless this journal holds that context itself, when it is one of the project’s own contexts',
    positional: null,
    flags: {
      context: valueFlag(
        'Only this bounded context; every context when left out',
      ),
    },
  },
  design: {
    concept: 'conceptual design',
    effect: 'reads',
    purpose:
      'Show the delivered practice the project’s agents work by in a place of its own (practice), then the current conceptual design of each of the project’s own bounded contexts: its live concepts, each by its current meaning with the concepts it is built from, and competing versions; retired concepts and why each live concept’s version was written are history, shown only when asked',
    when: 'Beyond the design state, before work relies on how a concept is built from others, or after recording a change to the design, to see the design as it currently stands with its parts; the project’s design is its own contexts only, the delivered practice shown apart from them, marked delivered and read-only',
    positional: null,
    flags: {
      context: valueFlag(
        'Only this bounded context; every context when left out',
      ),
      history: switchFlag(
        'Also its history: retired concepts with why each was retired, and why each live concept’s version was written',
      ),
    },
  },
  history: {
    concept: 'concept',
    effect: 'reads',
    purpose:
      'Show every version of one concept in the order recorded, each with the reason it was written, exactly as recorded; given no concept, show the bounded context’s own history instead: every description of its subject and place in the context map, each change with its reason, and, where any is recorded, the effort its past work took, each piece of work by its name with the figures last recorded for it',
    when: 'To see how a concept came to mean what it does: what it meant before, why each change was made, or why it was retired; without a concept, to see what a bounded context was about and how it stood to the others before, why each change was made, and what its past work took',
    positional: {
      ...concept(
        'The concept whose versions to show, by its name in the bounded context; leave it out to show the bounded context’s own history',
      ),
      optional: true,
    },
    flags: {
      context: valueFlag(
        'The bounded context the concept belongs to, or, without a concept, the one whose own history to show; one already recorded with the context verb',
        { required: true },
      ),
    },
  },
  decisions: {
    concept: 'decision',
    effect: 'reads',
    purpose:
      'List the standing decisions, the choices of realization that bind the work, read apart from the design state, in the order recorded, each by what it says first, its title, then open or accepted, its governing kind and its text, its id and entry last as references; asked for history, every decision, each open, accepted, superseded or deprecated, with what it superseded, what superseded it and every kind recorded for it. A decision stands until a later decision supersedes it or a later entry deprecates it with a reason',
    when: 'Once the design state is read, for the standing decisions the work needs, before acting on a choice or after recording or accepting a decision; with history, to see how a choice was reached or why one no longer applies',
    positional: null,
    flags: {
      context: valueFlag(
        'Only the decisions of this bounded context; every context’s when left out',
      ),
      open: switchFlag('Only the decisions still awaiting acceptance'),
      history: switchFlag(
        'Also the decisions superseded or deprecated, and for every decision what it superseded, what superseded it and every kind recorded for it: the history of how each choice was reached',
      ),
    },
  },
  leakage: {
    concept: 'concept journal',
    effect: 'reads',
    purpose:
      'Show where realization shows through text that should state meaning: each live concept’s wording and visible example that names code, files, commands, flags, identifiers, tools or libraries instead of what must hold, and each live concept’s wording and current context description that cites a decision by its number, recounts its history (what changed, or what something used to be or no longer is) or only extends the version it replaces, keeping its wording whole and adding to it, as a warning naming its passage and the words that leak; a decision records realization and is never inspected, the words a context’s concept names are its own words, never a leak, and so is each word its current subject names as that plain word on its own, though never a command, code span or flag that holds it',
    when: 'Before a design or its examples are confirmed, or after recording one, to see what may leak implementation and judge each warning; a warning never refuses anything, since a word list cannot tell every legitimate use from a leak',
    positional: null,
    flags: {
      context: valueFlag(
        'Only this bounded context’s concepts, description and examples; every context’s when left out',
      ),
    },
  },
  purpose: {
    concept: 'concept journal',
    effect: 'appends',
    purpose:
      'Record the project’s purpose: what the project is for, in plain words, which the design state shows first; or, given a reason, change it by a new statement that supersedes the current one, which stays in the journal',
    when: 'A reason marks a change. Without a reason, once, when the project’s purpose is first stated; with a reason, when what the project is for changes, or to settle purposes recorded differently in separate lines of work that were later joined',
    positional: null,
    flags: {
      statement: valueFlag(
        'What the project is for, in plain words a newcomer understands',
        { required: true },
      ),
      reason: valueFlag(
        'Why the purpose changes; needed to change a recorded one, and giving it marks the call as a change, never a first recording',
      ),
    },
  },
  context: {
    concept: 'bounded context',
    effect: 'appends',
    purpose:
      'Record a new bounded context: a subject with its own model and vocabulary, and its place in the context map; or, given a reason, change a recorded context’s subject or place in the context map by a new description that supersedes the current one, which stays in the context’s history',
    when: 'A reason marks a change. Without a reason, before the first concept or decision of a subject that has no bounded context yet; with a reason, when a recorded context’s subject or relation changes, or to settle descriptions recorded differently in separate lines of work that were later joined',
    positional: {
      name: 'context',
      description:
        'The bounded context’s name, the word its concepts and decisions are recorded under; a change names a context already recorded',
    },
    flags: {
      subject: valueFlag(
        'The subject the context models, in its own words; needed to record a new context, and when changing a recorded one, the current subject is kept when left out',
      ),
      relation: valueFlag(
        'How it relates to the other bounded contexts in the context map; none when left out on recording, the current relation kept when left out on a change',
      ),
      reason: valueFlag(
        'Why a recorded context changes; needed to change one, and giving it marks the call as a change, never a recording',
      ),
    },
  },
  define: {
    concept: 'concept',
    effect: 'appends',
    purpose:
      'Record a new concept in one bounded context: its first version, in the context’s own words, with the reason it is written',
    when: 'When the design gains a concept it does not have yet; a concept already in the design changes by supersession instead',
    positional: concept(
      'The new concept’s name, the word its bounded context uses for it',
    ),
    flags: {
      ...inContext('concept'),
      wording: valueFlag(
        'What the concept means, in its bounded context’s own words, naming no implementation, decision or history',
        { required: true },
      ),
      reason: valueFlag('Why the concept is defined', { required: true }),
      ...BUILT_FROM,
    },
  },
  supersede: {
    concept: 'supersession',
    effect: 'appends',
    purpose:
      'Record a new meaning for a concept that stays in the design: a new version, with its reason and who records it, superseding every current one while its earlier versions stay in its history; it also settles competing versions and brings a retired concept back',
    when: 'When a concept remains part of the design but its meaning changes, when competing versions must be settled, or when a retired concept returns; never to take a concept out of the design, which is retirement',
    positional: concept(
      'The concept whose meaning changes, by its name in the bounded context',
    ),
    flags: {
      ...inContext('concept'),
      wording: valueFlag(
        'What the concept now means, restated whole in its bounded context’s own words, naming no implementation, decision or history',
        { required: true },
      ),
      reason: valueFlag('Why its meaning changes', { required: true }),
      ...BUILT_FROM,
    },
  },
  retire: {
    concept: 'retirement',
    effect: 'appends',
    purpose:
      'Record that a concept leaves the current design, with the reason and who records it: it is no longer live, and its history is kept',
    when: 'When the design no longer has the concept at all; a concept that stays in the design but now means something else is superseded instead',
    positional: concept(
      'The concept that leaves the design, by its name in the bounded context',
    ),
    flags: {
      ...inContext('concept'),
      reason: valueFlag('Why the concept leaves the design', {
        required: true,
      }),
    },
  },
  decide: {
    concept: 'decision',
    effect: 'appends',
    purpose:
      'Record a new decision of realization: a choice of how the design is realized, the lead’s technical choice or the operator’s requirement or recommendation, with its situation, what is decided and its consequences, open or accepted, optionally superseding an earlier decision; every new decision is marked realization, since meaning is recorded only as a concept’s version, whose reason is its why',
    when: 'When a choice of realization is made or proposed: recorded open while it awaits agreement, accepted when it is already agreed; a decision is never edited, so a changed choice is a new decision superseding the earlier one; a change to what the design means is a concept’s new version instead',
    positional: {
      name: 'id',
      description:
        'The new decision’s id, by which it is accepted and later superseded',
    },
    flags: {
      ...inContext('decision'),
      title: valueFlag('The decision’s title, naming the choice in a line', {
        required: true,
      }),
      situation: valueFlag('The situation that calls for the decision', {
        required: true,
      }),
      decision: valueFlag('What is decided', { required: true }),
      consequences: valueFlag(
        'What follows from it for the design and the work',
        { required: true },
      ),
      status: valueFlag(
        'How the decision is recorded: open, awaiting acceptance, or accepted, already agreed',
        { required: true, values: STATUSES },
      ),
      supersedes: valueFlag(
        'An earlier decision this one replaces: its id, or, where two decisions share the id, the entry the decisions reading lists for the one meant',
      ),
    },
  },
  accept: {
    concept: 'decision',
    effect: 'appends',
    purpose:
      'Record that an open decision is agreed, as a record of its own, so the decision becomes settled and its record never changes',
    when: 'When an open decision is agreed, and only then; it never records a new decision, and an accepted decision changes only by a later decision that supersedes it',
    positional: {
      name: 'id',
      description:
        'The open decision to accept: its id, or, where two decisions share the id, the entry the decisions reading lists for the one meant',
    },
    flags: {
      reason: valueFlag(
        'Why it is accepted; the acceptance carries no reason when left out',
      ),
    },
  },
  deprecate: {
    concept: 'decision',
    effect: 'appends',
    purpose:
      'Record that a standing decision no longer applies and has no replacement, with the reason, as a record of its own: the decision is deprecated, kept as history and no longer shown as standing, and its record never changes',
    when: 'When a standing decision is about a finished piece of work or is now stated by the concepts, so it no longer stands as a rule; a choice that changes is superseded by a later decision instead',
    positional: {
      name: 'id',
      description:
        'The standing decision to deprecate: its id, or, where two decisions share the id, the entry the decisions reading lists for the one meant',
    },
    flags: {
      reason: valueFlag('Why the decision no longer applies', {
        required: true,
      }),
    },
  },
} as const satisfies VerbFlags<string, ExplainedVerb>;

/** The concept journal, as it explains itself. */
export const JOURNAL: CapabilityInterface = {
  name: 'concept journal',
  purpose: CAPABILITY_SUMMARIES.concepts,
  when: 'Whenever work touches a project’s conceptual design: at the start of a session, or after it was compacted, to read the design state of the delivered practice and of each context the work touches first, then the standing decisions its work needs, and the history only when how something came to be matters; to read the design back before acting; and to record the project’s purpose, each change to a bounded context or a concept as a new version with its reason, and each decision of realization as it is made, so the design is kept nowhere else. A project’s design and context map are its own contexts only: its readings of the design state and the current design show the contexts the installation delivers apart from them, in a place of their own (practice), as the practice the project’s agents work by, named by origin and context, marked delivered and read-only, and still offered first; nothing is ever recorded into one. A project whose journal holds such a context itself reads its own, as part of its design. Decisions are shown by their titles first, their ids only as references',
  verbs: VERBS,
};

/** Route `concepts <verb> [args]` to the journal of the git repository holding
 *  `from`, showing apart from its contexts the ones `delivered` holds, which the
 *  command reads from the installation it reaches and a library caller hands in
 *  or leaves out; returns what the verb prints as JSON, a reading with what it
 *  read past of the journal. */
export function dispatchConcepts(
  argv: readonly string[],
  opts: {
    readonly from?: string;
    readonly delivered?: readonly DeliveredContext[];
  } = {},
): unknown {
  const verb = verbOf(argv, 'concepts', VERBS);
  const args = readArgv(argv.slice(1), 'concepts', verb, VERBS[verb]);
  const refuse = (message: string) => new Error(`concepts ${verb}: ${message}`);
  const delivered = opts.delivered ?? [];
  if (VERBS[verb].effect === 'appends') {
    const target =
      verb === 'context' ? args.positionals[0] : args.flags.get('context')?.[0];
    const named = delivered.find((d) => qualifiedName(d) === target);
    if (named !== undefined)
      throw refuse(
        `the bounded context '${target}' is delivered by ${named.origin} at version ${named.version} and is read-only; nothing is recorded into it, and a project changes only its own contexts`,
      );
  }
  const journal = journalAt(opts.from ?? process.cwd(), refuse);
  const answer = answerOf(verb, args, journal, delivered, refuse);
  const report =
    VERBS[verb].effect === 'reads' ? journal.readPast().report() : undefined;
  return report === undefined
    ? answer
    : { ...(answer as object), uninterpreted: report };
}

/** What `verb`, given `args`, answers from `journal` and the contexts
 *  `delivered` holds. */
function answerOf(
  verb: keyof typeof VERBS,
  args: Argv,
  journal: Journal,
  delivered: readonly DeliveredContext[],
  refuse: (message: string) => Error,
): unknown {
  const folded = new Folded(journal.entries());
  const read = reader(args, refuse);
  /** The delivered contexts shown: each this journal does not hold itself, by
   *  the identity of the entry that first recorded it. */
  const held = new Set(
    [...folded.contexts.values()].flat().map((entry) => entry.id),
  );
  const shown = delivered.filter((d) => !held.has(d.identity));
  /** The shown delivered context `--context` names, if it names one. */
  const deliveredNamed = (): DeliveredContext | undefined => {
    const name = args.flags.get('context')?.[0];
    return shown.find((d) => qualifiedName(d) === name);
  };

  /** The recorded context `--context` names, given once. */
  const context = (): string => {
    const name = read.required('context', 'the bounded context');
    if (!folded.contexts.has(name))
      throw refuse(
        `the journal has no bounded context '${name}'; record it with concepts context first`,
      );
    return name;
  };
  /** The contexts a query covers: the one `--context` names, else all; the
   *  journal's own, and the delivered ones shown. */
  const covering = (): {
    own: string[];
    delivered: readonly DeliveredContext[];
  } => {
    if (!args.flags.has('context'))
      return { own: [...folded.contexts.keys()], delivered: shown };
    const named = deliveredNamed();
    return named === undefined
      ? { own: [context()], delivered: [] }
      : { own: [], delivered: [named] };
  };
  /** The current versions a new version of `name` in `where` supersedes;
   *  refuses a concept the context does not have, or, unless `revive`, a
   *  retired one. */
  const superseding = (
    where: string,
    name: string,
    revive: boolean,
  ): string[] => {
    const standing = folded.standing(where, name);
    if (standing === undefined)
      throw refuse(`the bounded context '${where}' has no concept '${name}'`);
    if (standing.is === 'retired' && !revive)
      throw refuse(`the concept '${name}' in '${where}' is already retired`);
    return standing.is === 'competing'
      ? standing.current.map((v) => v.id)
      : [standing.current.id];
  };
  /** The entry of the one decision `ref` names; refuses none, or an id
   *  several decisions share. */
  const decisionOf = (ref: string): string => {
    const entries = folded.resolve(ref);
    if (entries.length === 0)
      throw refuse(`the journal has no decision '${ref}'`);
    if (entries.length > 1)
      throw refuse(
        `the id '${ref}' is shared by the decisions ${entries.join(', ')}; name one by its entry`,
      );
    return entries[0] as string;
  };
  /** Whether history is asked for. */
  const history = args.flags.has('history');
  /** `design` as shown: whole when history is asked for, else as it stands. */
  const shownDesign = <
    D extends {
      readonly concepts: readonly Meaning[];
      readonly retired: readonly unknown[];
    },
  >(
    design: D,
  ) => (history ? design : standingDesign(design));
  /** The words of `where`: the names of its live concepts and of `also`, and
   *  the plain words its current subject names (each, while descriptions
   *  compete). */
  const own = (where: string, ...also: string[]) =>
    vocabulary(
      [...folded.design(where).concepts.map((c) => c.name), ...also],
      folded.descriptions(where).map((d) => d.subject),
    );
  /** The warnings on `passage`, one per distinct leak in `found`. */
  const distinct = (passage: Passage, found: readonly Leak[]): Warning[] =>
    found
      .filter(
        (leak, i) =>
          found.findIndex(
            (other) => other.words === leak.words && other.rule === leak.rule,
          ) === i,
      )
      .map((leak) => ({ passage, ...leak }));
  /** The warnings on `passage`, one per distinct leak in `texts`, read
   *  against `words`, its context's own. */
  const warnings = (
    passage: Passage,
    texts: readonly string[],
    words: Vocabulary,
  ): Warning[] =>
    distinct(
      passage,
      texts.flatMap((text) => leaks(text, words)),
    );
  /** The warnings on `passage`, a wording, where it cites a decision by its
   *  number, recounts its history, or only extends one of `replaced`, the
   *  wordings it supersedes. */
  const restating = (
    passage: Passage,
    wording: string,
    replaced: readonly string[],
  ): Warning[] =>
    distinct(passage, [...recounts(wording), ...extending(wording, replaced)]);
  /** The warnings on the description `entry` of `where` gives, for each of
   *  `fields`, against the descriptions it supersedes. */
  const described = (
    where: string,
    entry: Pick<ContextEntry, 'subject' | 'relation' | 'supersedes'>,
    fields: readonly ('subject' | 'relation')[],
  ): Warning[] => {
    const replaced = (folded.contexts.get(where) ?? []).filter((c) =>
      (entry.supersedes ?? []).includes(c.id),
    );
    return fields.flatMap((field) =>
      restating(
        { kind: 'context', context: where, field },
        entry[field],
        replaced.map((c) => c[field]),
      ),
    );
  };
  /** The wordings of the versions of `name` in `where` that `supersedes`
   *  names; a retirement has none. */
  const replacedWordings = (
    where: string,
    name: string,
    supersedes: readonly string[],
  ): string[] =>
    folded
      .versions(where, name)
      .flatMap((v) =>
        v.kind !== 'retire' && supersedes.includes(v.id) ? [v.wording] : [],
      );

  switch (verb) {
    case 'state': {
      const covered = covering();
      return {
        ...folded.purpose(),
        ...practiceOf(covered.delivered.map(deliveredState)),
        contexts: covered.own.map((where) => designState(folded.design(where))),
      };
    }
    case 'leakage': {
      // Only the journal's own contexts: a delivered one is read, never recorded here.
      const covered = covering().own;
      const recorded = covered.flatMap((where) => {
        const words = own(where);
        return [
          ...folded
            .currentDescriptions(where)
            .flatMap((entry) =>
              described(where, entry, ['subject', 'relation']),
            ),
          ...folded.design(where).concepts.flatMap((c) => {
            const passage: Passage = {
              kind: 'concept',
              context: where,
              name: c.name,
            };
            const current = folded.standing(where, c.name)?.current as
              | WordedEntry
              | undefined;
            return [
              ...warnings(passage, [c.wording], words),
              ...restating(
                passage,
                c.wording,
                replacedWordings(where, c.name, current?.supersedes ?? []),
              ),
            ];
          }),
        ];
      });
      const examples = visibleExamples(journal.root)
        .filter(
          (e) => !args.flags.has('context') || covered.includes(e.context),
        )
        .flatMap((e) =>
          warnings(
            { kind: 'example', file: e.file, number: e.number },
            [e.text],
            folded.contexts.has(e.context) ? own(e.context) : vocabulary([]),
          ),
        );
      return { warnings: [...recorded, ...examples] };
    }
    case 'history': {
      const named = deliveredNamed();
      if (named !== undefined) {
        const { subject, relation, concepts } = named;
        if (args.positionals.length === 0)
          return {
            context: qualifiedName(named),
            versions: [],
            current: { subject, relation, concepts },
            ...marksOf(named),
          };
        const name = read.named('concept');
        const meaning = concepts.find((c) => c.name === name);
        if (meaning === undefined)
          throw refuse(
            `the delivered context '${qualifiedName(named)}' has no concept '${name}'`,
          );
        return {
          context: qualifiedName(named),
          name,
          versions: [],
          current: { wording: meaning.wording, builtFrom: meaning.builtFrom },
          ...marksOf(named),
        };
      }
      const where = context();
      if (args.positionals.length === 0) {
        const efficiency = folded.efficiency(where);
        return {
          ...folded.contextHistory(where),
          ...(efficiency.length === 0 ? {} : { efficiency }),
        };
      }
      const name = read.named('concept');
      if (folded.versions(where, name).length === 0)
        throw refuse(`the bounded context '${where}' has no concept '${name}'`);
      return folded.history(where, name);
    }
    case 'design': {
      const covered = covering();
      return {
        ...practiceOf(
          covered.delivered.map((d) => shownDesign(deliveredDesign(d))),
        ),
        contexts: covered.own.map((where) => shownDesign(folded.design(where))),
      };
    }
    case 'decisions': {
      // A delivered context carries no decisions of its own.
      if (deliveredNamed() !== undefined) return { decisions: [] };
      const only = args.flags.has('context') ? context() : undefined;
      const open = args.flags.has('open');
      return {
        decisions: folded
          .decisionViews()
          .filter(
            (d) =>
              (only === undefined || d.context === only) &&
              (!open || d.status === 'open') &&
              (history || stands(d)),
          )
          .map((d) => (history ? d : standingDecision(d))),
      };
    }
    case 'purpose': {
      const statement = read.required('statement', 'the purpose');
      const reason = read.optional('reason');
      const current = folded.currentPurposes();
      if (reason === undefined) {
        if (current.length > 0)
          throw refuse(
            'the project’s purpose is already recorded; give --reason to change it',
          );
        return journal.append({ kind: 'purpose', statement, supersedes: [] });
      }
      if (current.length === 0)
        throw refuse(
          'the project has no purpose recorded; record it without --reason first',
        );
      if (reason.trim() === '')
        throw refuse('the reason is empty; give why the purpose changes');
      return journal.append({
        kind: 'purpose',
        statement,
        reason,
        supersedes: current.map((p) => p.id),
      });
    }
    case 'context': {
      const name = read.named('context');
      const reason = read.optional('reason');
      const subject = read.optional('subject');
      const relation = read.optional('relation');
      const recorded = folded.contexts.has(name);
      if (reason === undefined) {
        if (recorded)
          throw refuse(
            `the bounded context '${name}' is already recorded; give --reason to change it`,
          );
        const draft: Omit<ContextEntry, 'id' | 'at'> = {
          kind: 'context',
          name,
          subject: read.required('subject', 'the subject'),
          relation: relation ?? '',
        };
        const found = described(name, draft, ['subject', 'relation']);
        const entry = journal.append(draft);
        return found.length === 0 ? entry : { ...entry, warnings: found };
      }
      if (!recorded)
        throw refuse(
          `the journal has no bounded context '${name}'; record it without --reason first`,
        );
      if (reason.trim() === '')
        throw refuse('the reason is empty; give why the context changes');
      if (subject === undefined && relation === undefined)
        throw refuse('give the --subject or --relation that changes, or both');
      if (subject !== undefined && subject.trim() === '')
        throw refuse(
          'the subject is empty; give one, or leave --subject out to keep it',
        );
      const descriptions = folded.descriptions(name);
      /** The current `field`, carried over; refused while competing
       *  descriptions differ on it, or where none is current. */
      const carried = (field: 'subject' | 'relation'): string => {
        const [first] = descriptions;
        if (first === undefined)
          throw refuse(
            `the bounded context '${name}' has no current description; give --${field} to settle it`,
          );
        if (new Set(descriptions.map((d) => d[field])).size > 1)
          throw refuse(
            `the competing descriptions differ in their ${field}; give --${field} to settle it`,
          );
        return first[field];
      };
      const draft: Omit<ContextEntry, 'id' | 'at'> = {
        kind: 'context',
        name,
        subject: subject ?? carried('subject'),
        relation: relation ?? carried('relation'),
        reason,
        supersedes: folded.currentDescriptions(name).map((c) => c.id),
      };
      const found = described(name, draft, [
        ...(subject === undefined ? [] : (['subject'] as const)),
        ...(relation === undefined ? [] : (['relation'] as const)),
      ]);
      const entry = journal.append(draft);
      return found.length === 0 ? entry : { ...entry, warnings: found };
    }
    case 'define':
    case 'supersede': {
      const name = read.named('concept');
      const where = context();
      const wording = read.required('wording', 'the wording');
      const reason = read.required('reason', 'the reason');
      const builtFrom = args.flags.get('built-from') ?? [];
      if (verb === 'define' && folded.versions(where, name).length > 0)
        throw refuse(
          `the bounded context '${where}' already has the concept '${name}'; supersede it instead`,
        );
      const supersedes =
        verb === 'define' ? [] : superseding(where, name, true);
      const draft: Omit<WordedEntry, 'id' | 'at'> = {
        kind: verb,
        context: where,
        name,
        wording,
        builtFrom,
        reason,
        supersedes,
      };
      const passage: Passage = { kind: 'concept', context: where, name };
      const found = [
        ...warnings(passage, [wording], own(where, name)),
        ...restating(
          passage,
          wording,
          replacedWordings(where, name, supersedes),
        ),
      ];
      const entry = journal.append(draft);
      return found.length === 0 ? entry : { ...entry, warnings: found };
    }
    case 'retire': {
      const name = read.named('concept');
      const where = context();
      const reason = read.required('reason', 'the reason');
      const supersedes = superseding(where, name, false);
      return journal.append({
        kind: 'retire',
        context: where,
        name,
        reason,
        supersedes,
      });
    }
    case 'decide': {
      const decisionId = read.named('decision id');
      const where = context();
      const [title, situation, decision, consequences] = (
        ['title', 'situation', 'decision', 'consequences'] as const
      ).map((flag) => read.required(flag, `the ${flag}`)) as [
        string,
        string,
        string,
        string,
      ];
      const status = read.required('status', 'the status (open or accepted)');
      if (!isStatus(status))
        throw refuse(
          `the status is '${status}'; a decision is recorded open or accepted`,
        );
      const ref = read.optional('supersedes');
      if (folded.named.has(decisionId) || folded.decisions.has(decisionId))
        throw refuse(`the decision '${decisionId}' is already recorded`);
      const superseded = ref === undefined ? undefined : decisionOf(ref);
      const draft: Omit<DecideEntry, 'id' | 'at'> = {
        kind: 'decide',
        decisionId,
        context: where,
        title,
        situation,
        decision,
        consequences,
        status,
        supersedes:
          superseded === undefined
            ? null
            : (folded.decisions.get(superseded) as DecideEntry).decisionId,
        ...(superseded === undefined ? {} : { supersedesEntry: superseded }),
        decisionKind: 'realization',
      };
      return journal.append(draft);
    }
    case 'accept': {
      const ref = read.named('decision');
      const reason = read.optional('reason');
      if (reason !== undefined && reason.trim() === '')
        throw refuse('the reason is empty; give one, or leave --reason out');
      const entry = decisionOf(ref);
      const status = folded.status(entry);
      if (status !== 'open')
        throw refuse(
          `the decision '${ref}' is ${status}; only an open decision is accepted`,
        );
      return journal.append({
        kind: 'accept',
        decisionId: (folded.decisions.get(entry) as DecideEntry).decisionId,
        entry,
        ...(reason === undefined ? {} : { reason }),
      });
    }
    case 'deprecate': {
      const ref = read.named('decision');
      const reason = read.required('reason', 'why it no longer applies');
      const entry = decisionOf(ref);
      const status = folded.status(entry);
      if (status === 'superseded' || status === 'deprecated')
        throw refuse(
          `the decision '${ref}' is ${status}; only a standing decision is deprecated`,
        );
      return journal.append({
        kind: 'deprecate',
        decisionId: (folded.decisions.get(entry) as DecideEntry).decisionId,
        entry,
        reason,
      });
    }
  }
}

/** How a verb reads its words: the positional it names, and each flag given
 *  at most once, refusing a second value, and a required one absent or empty. */
function reader(args: Argv, refuse: (message: string) => Error) {
  const optional = (flag: string): string | undefined => {
    const values = args.flags.get(flag);
    if (values !== undefined && values.length > 1)
      throw refuse(`--${flag} is given ${values.length} times; give it once`);
    return values?.[0];
  };
  return {
    optional,
    required(flag: string, what: string): string {
      const value = optional(flag);
      if (value === undefined || value.trim() === '')
        throw refuse(`give ${what} with --${flag}`);
      return value;
    },
    named(what: string): string {
      const named = args.positionals[0];
      if (named === undefined || named.trim() === '')
        throw refuse(`name the ${what} it acts on`);
      return named;
    },
  };
}
