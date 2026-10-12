// ─────────────────────────────────────────────────────────────────────────────
// The concepts capability's VERB SURFACE — `concepts <verb> [args]`.
//
//   overview   each context told whole for a reader of it: subject and
//              relation, concepts whole before parts, open decisions and the
//              cuts in flight; what a session reads first to reconstitute
//   state      the whole state of each context in one answer: the query a
//              session reconstitutes its detail from
//   design     the current design of each context
//   history    every version of one concept, or of a context's description
//   decisions  the decisions with their status
//   leakage    the implementation leakage in the design, decisions and examples
//   context    record a bounded context, or, with a reason, change one
//   define     record a concept's first version
//   supersede  record a version superseding every current one
//   retire     record a concept's retirement
//   decide     record a decision, open or accepted, and optionally its kind
//   accept     record the acceptance of an open decision
//   classify   record which kind a recorded decision is: meaning or realization
//
// A query appends nothing and prints JSON; when it read past entries written by
// a newer runtime, in the journal or, for `overview`, the ledger, its answer
// also carries `uninterpreted`, saying what it read past and how it was read.
// An appending verb appends exactly one entry and prints it as JSON; when what
// it recorded leaks implementation, the answer also carries the `warnings`, and
// nothing is refused for leakage. A decision constraining realization is never
// warned, and a context's own words include each plain word its current
// subject names, though never a command, a
// quotation in code type or a flag that holds it. Every refusal is one line
// opening with `concepts <verb>:`, thrown before anything is appended.
//
// THE FREEZE: `define`, `supersede` and `retire` of a concept that a cut opened
// and not integrated names in its examples, in the same bounded context, are
// refused unless the agent making the call (`../../acting-agent.ts`) is the
// architect every such cut records for that context; while what is frozen
// cannot be read, every one of them is refused. What is frozen is read from the
// ledger and the record (`../work-package/frozen.ts`), never kept here.
//
// The capability EXPLAINS ITSELF from the declarations below: its name and when
// to reach for it, and for each verb the concept it acts on, its purpose, when to
// reach for it, whether it reads or appends, and each parameter it takes. Its
// help prints the same declarations, and its calls are read against them.
// ─────────────────────────────────────────────────────────────────────────────

import { actingAgent } from '../../acting-agent.js';
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
  type FrozenCut,
  cutsInLedger,
  frozenCuts,
} from '../work-package/index.js';
import {
  type ClassifyEntry,
  type ContextEntry,
  DECISION_KINDS,
  type DecideEntry,
  type DecisionKind,
  type WordedEntry,
} from './entries.js';
import { type Journal, type ReadPast, journalAt } from './journal.js';
import {
  type Passage,
  type Vocabulary,
  type Warning,
  leaks,
  visibleExamples,
  vocabulary,
} from './leakage.js';
import { overviewOf } from './overview.js';
import { type DecisionView, Folded } from './views.js';

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

/** Whether `kind` is one a decision is of. */
const isDecisionKind = (kind: string): kind is DecisionKind =>
  (DECISION_KINDS as readonly string[]).includes(kind);

/** The concepts capability's verbs, queries first, each with the concept it acts
 *  on, its purpose, when to reach for it, whether it reads or appends, the
 *  positional it acts on and the flags it takes. */
export const VERBS = {
  overview: {
    concept: 'context overview',
    effect: 'reads',
    purpose:
      'Tell each bounded context whole, worked out afresh from the recorded design and the ledger (the record of the cuts and their work packages): its subject and place in the context map first, then its live concepts each whole before the parts it is built from with its current meaning and any cycle among them named, then its open decisions, then the cuts in flight that touch it (changes to the design being built now), together as a plain prose account for a reader of that context',
    when: 'First, at the start of a session or after it was compacted, for each bounded context the work touches, before reading the detail it needs about its design, its decisions and its cuts, and reading back the current design, open decisions and cuts in flight',
    positional: null,
    flags: {
      context: valueFlag(
        'Only this bounded context; every context when left out',
      ),
    },
  },
  state: {
    concept: 'conceptual design',
    effect: 'reads',
    purpose:
      'Read the whole state of each bounded context in one answer: its live concepts (the current version of each), competing versions none has chosen, retired concepts, accepted decisions (settled), open decisions (not settled) and, for each of its cuts (a change to the design built and judged as a whole), how much work it took as last recorded',
    when: 'At the start of a session, or after it was compacted, once each touched context’s overview is read, to recover the detail of the conceptual design, its decisions and what is still open from what is recorded rather than from memory, and read them back before acting',
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
      'Show the current conceptual design of each bounded context: its live concepts, each at its current version, competing versions and retired concepts',
    when: 'Before work relies on what a concept means now, or after recording a change to the design, to see the design as it currently stands',
    positional: null,
    flags: {
      context: valueFlag(
        'Only this bounded context; every context when left out',
      ),
    },
  },
  history: {
    concept: 'concept',
    effect: 'reads',
    purpose:
      'Show every version of one concept in the order recorded, each with the reason it was written, exactly as recorded; given no concept, show the bounded context’s own history instead: every description of its subject and place in the context map, each change with its reason',
    when: 'To see how a concept came to mean what it does: what it meant before, why each change was made, or why it was retired; without a concept, to see what a bounded context was about and how it stood to the others before, and why each change was made',
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
      'List the decisions in the order recorded, each open, accepted or superseded',
    when: 'To see what has been decided and what still awaits acceptance, before acting on a choice or after recording or accepting a decision',
    positional: null,
    flags: {
      context: valueFlag(
        'Only the decisions of this bounded context; every context’s when left out',
      ),
      open: switchFlag('Only the decisions still awaiting acceptance'),
    },
  },
  leakage: {
    concept: 'implementation leakage',
    effect: 'reads',
    purpose:
      'Show where realization shows through text that should state meaning: each live concept, decision and visible example that names code, files, commands, flags, identifiers, tools or libraries instead of what must hold, as a warning naming its passage and the words that leak; a decision recorded as constraining realization names what it constrains on purpose and is never inspected, the words a context’s concept names are its own words, never a leak, and so is each word its current subject names as that plain word on its own, though never a command, code span or flag that holds it',
    when: 'Before a design, its decisions or its examples are confirmed, or after recording one, to see what may leak implementation and judge each warning; a warning never refuses anything, since a word list cannot tell every legitimate use from a leak, and a decision of no recorded kind is inspected as stating meaning',
    positional: null,
    flags: {
      context: valueFlag(
        'Only this bounded context’s concepts, decisions and examples; every context’s when left out',
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
        'What the concept means, in its bounded context’s own words, naming no implementation',
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
      'Record a new meaning for a concept that stays in the design: a new version, with its reason, superseding every current one while its earlier versions stay in its history; it also settles competing versions and brings a retired concept back; refused, with nothing recorded, while a cut not yet integrated freezes the concept in its bounded context, unless the agent making the call is that cut’s architect',
    when: 'When a concept remains part of the design but its meaning changes, when competing versions must be settled, or when a retired concept returns; never to take a concept out of the design, which is retirement',
    positional: concept(
      'The concept whose meaning changes, by its name in the bounded context',
    ),
    flags: {
      ...inContext('concept'),
      wording: valueFlag(
        'What the concept now means, in its bounded context’s own words, naming no implementation',
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
      'Record that a concept leaves the current design, with the reason: it is no longer live, and its history is kept; refused, with nothing recorded, while a cut not yet integrated freezes the concept in its bounded context, unless the agent making the call is that cut’s architect',
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
      'Record a new decision about the conceptual design or how it is realized: its situation, what is decided and its consequences, open or accepted, optionally superseding an earlier decision',
    when: 'When a choice is made or proposed: recorded open while it awaits agreement, accepted when it is already agreed; a decision is never edited, so a changed choice is a new decision superseding the earlier one',
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
      kind: valueFlag(
        'What the decision is about: meaning, stating what the design means, or realization, constraining how it is realized; a decision recorded without it is inspected as stating meaning',
        { values: DECISION_KINDS },
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
  classify: {
    concept: 'decision',
    effect: 'appends',
    purpose:
      'Record which kind a recorded decision is, stating meaning or constraining realization, as a record of its own, so the decision’s record never changes; the latest kind recorded governs and every earlier one stays in its history',
    when: 'When a decision recorded without its kind must say it, or when what a decision is about was recorded wrongly; a decision constraining realization is then no longer inspected for leakage, and one already of a kind changes kind only with a reason',
    positional: {
      name: 'id',
      description:
        'The decision to classify: its id, or, where two decisions share the id, the entry the decisions reading lists for the one meant',
    },
    flags: {
      kind: valueFlag(
        'Which kind the decision is: meaning, stating what the design means, or realization, constraining how it is realized',
        { required: true, values: DECISION_KINDS },
      ),
      reason: valueFlag(
        'Why the decision is of this kind; needed when a kind is already recorded for it, and a first classification carries none when left out',
      ),
    },
  },
} as const satisfies VerbFlags<string, ExplainedVerb>;

/** The concept journal, as it explains itself. */
export const JOURNAL: CapabilityInterface = {
  name: 'concept journal',
  purpose: CAPABILITY_SUMMARIES.concepts,
  when: 'Whenever work touches a project’s conceptual design: at the start of a session, or after it was compacted, to read each touched context’s overview first and then the detail it needs; to read back its current concepts, their history and its decisions before acting; and to record each change to a bounded context, a concept or a decision as it is made, so the design is kept nowhere else',
  verbs: VERBS,
};

/** What `state` says each part of its answer is. */
const READING = {
  competingDescriptions:
    'descriptions of the context recorded differently on merged branches; while any are listed, subject and relation are null and none is chosen until a later concepts context with a reason settles them',
  concepts: 'the live concepts of the context, each its current version',
  competing:
    'concepts with two or more versions superseding the same one; none is chosen until a later version supersedes them all',
  retired: 'concepts retired from the design, each with its reason',
  'decisions.accepted': 'decisions accepted and not superseded: settled',
  'decisions.open': 'decisions recorded and not yet accepted: not settled',
  'decisions.entry':
    'the decision’s identity; two decisions may share an id, and then each is referred to by its entry',
  efficiency:
    'each cut of the context with the figures last recorded for it: its agent runs in total and by role, its rounds, its whole-check runs, its tokens (null when no run carried any) and when they were recorded',
} as const;

/** Route `concepts <verb> [args]` to the journal of the git repository holding
 *  `from`; returns what the verb prints as JSON, a reading with what it read
 *  past of the journal and of any other ledger it read. */
export function dispatchConcepts(
  argv: readonly string[],
  opts: { readonly from?: string } = {},
): unknown {
  const verb = verbOf(argv, 'concepts', VERBS);
  const args = readArgv(argv.slice(1), 'concepts', verb, VERBS[verb]);
  const refuse = (message: string) => new Error(`concepts ${verb}: ${message}`);
  const journal = journalAt(opts.from ?? process.cwd(), refuse);
  const ledgers: ReadPast[] = [];
  const answer = answerOf(verb, args, journal, refuse, ledgers);
  const report =
    VERBS[verb].effect === 'reads'
      ? ledgers.reduce((all, one) => all.with(one), journal.readPast()).report()
      : undefined;
  return report === undefined
    ? answer
    : { ...(answer as object), uninterpreted: report };
}

/** What `verb`, given `args`, answers from `journal`; each other ledger it
 *  reads adds what it read past to `ledgers`. */
function answerOf(
  verb: keyof typeof VERBS,
  args: Argv,
  journal: Journal,
  refuse: (message: string) => Error,
  ledgers: ReadPast[],
): unknown {
  const folded = new Folded(journal.entries());
  const read = reader(args, refuse);

  /** The recorded context `--context` names, given once. */
  const context = (): string => {
    const name = read.required('context', 'the bounded context');
    if (!folded.contexts.has(name))
      throw refuse(
        `the journal has no bounded context '${name}'; record it with concepts context first`,
      );
    return name;
  };
  /** The contexts a query covers: the one `--context` names, else all. */
  const contexts = (): string[] =>
    args.flags.has('context') ? [context()] : [...folded.contexts.keys()];
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
  /** Refuse a change to the concept `name` in `where` that a frozen cut
   *  naming it forbids: a change by any agent but the architect each such
   *  cut records for `where`; and any change while the freeze cannot be read. */
  const unfrozen = (where: string, name: string): void => {
    let cuts: readonly FrozenCut[];
    try {
      cuts = frozenCuts(journal.root).cuts;
    } catch (error) {
      const why = error instanceof Error ? error.message : String(error);
      throw refuse(
        `the concept '${name}' in '${where}' cannot be checked against the freeze, so the change is refused: what is frozen cannot be read: ${why.replace(/\s*\n\s*/g, ' ')}`,
      );
    }
    const holding = cuts.filter((c) =>
      c.concepts.some((k) => k.context === where && k.name === name),
    );
    const agent = actingAgent();
    if (
      holding.length === 0 ||
      (agent !== undefined &&
        holding.every((c) => c.architects[where] === agent))
    )
      return;
    const by = holding.map((c) => {
      const architect = c.architects[where];
      return `'${c.cut}' (architect ${architect === undefined ? 'none' : `'${architect}'`})`;
    });
    throw refuse(
      `the concept '${name}' in '${where}' is frozen by the ${holding.length === 1 ? 'cut' : 'cuts'} ${by.join(', ')}; only the architect may change it until the cut is integrated, and the call is made by ${agent === undefined ? 'an unknown agent' : `'${agent}'`}`,
    );
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
  const state = (decisions: readonly DecisionView[], where: string) => ({
    ...folded.design(where),
    decisions: {
      accepted: decisions.filter(
        (d) => d.context === where && d.status === 'accepted',
      ),
      open: decisions.filter((d) => d.context === where && d.status === 'open'),
    },
    efficiency: folded.efficiency(where),
  });
  /** The words of `where`: the names of its live concepts and of `also`, and
   *  the plain words its current subject names (each, while descriptions
   *  compete). */
  const own = (where: string, ...also: string[]) =>
    vocabulary(
      [...folded.design(where).concepts.map((c) => c.name), ...also],
      folded.descriptions(where).map((d) => d.subject),
    );
  /** The warnings on `passage`, one per distinct leak in `texts`, read
   *  against `words`, its context's own. */
  const warnings = (
    passage: Passage,
    texts: readonly string[],
    words: Vocabulary,
  ): Warning[] => {
    const found = texts.flatMap((text) => leaks(text, words));
    return found
      .filter(
        (leak, i) =>
          found.findIndex(
            (other) => other.words === leak.words && other.rule === leak.rule,
          ) === i,
      )
      .map((leak) => ({ passage, ...leak }));
  };

  switch (verb) {
    case 'overview': {
      const covered = contexts();
      const decisions = folded.decisionViews();
      const { cuts, readPast } = cutsInLedger(journal.root, refuse);
      ledgers.push(readPast);
      return {
        contexts: covered.map((where) =>
          overviewOf(folded.design(where), decisions, cuts),
        ),
      };
    }
    case 'state': {
      const decisions = folded.decisionViews();
      return {
        reading: READING,
        contexts: contexts().map((where) => state(decisions, where)),
      };
    }
    case 'leakage': {
      const covered = contexts();
      const decisions = folded.decisionViews();
      const recorded = covered.flatMap((where) => {
        const words = own(where);
        return [
          ...folded
            .design(where)
            .concepts.flatMap((c) =>
              warnings(
                { kind: 'concept', context: where, name: c.name },
                [c.wording],
                words,
              ),
            ),
          ...decisions
            .filter(
              (d) =>
                d.context === where &&
                d.status !== 'superseded' &&
                d.kind !== 'realization',
            )
            .flatMap((d) =>
              warnings(
                { kind: 'decision', context: where, id: d.id },
                [d.title, d.situation, d.decision, d.consequences],
                words,
              ),
            ),
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
      const where = context();
      if (args.positionals.length === 0) return folded.contextHistory(where);
      const name = read.named('concept');
      if (folded.versions(where, name).length === 0)
        throw refuse(`the bounded context '${where}' has no concept '${name}'`);
      return folded.history(where, name);
    }
    case 'design':
      return { contexts: contexts().map((where) => folded.design(where)) };
    case 'decisions': {
      const only = args.flags.has('context') ? context() : undefined;
      const open = args.flags.has('open');
      return {
        decisions: folded
          .decisionViews()
          .filter(
            (d) =>
              (only === undefined || d.context === only) &&
              (!open || d.status === 'open'),
          ),
      };
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
        return journal.append({
          kind: 'context',
          name,
          subject: read.required('subject', 'the subject'),
          relation: relation ?? '',
        });
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
      return journal.append(draft);
    }
    case 'define':
    case 'supersede': {
      const name = read.named('concept');
      const where = context();
      unfrozen(where, name);
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
      const found = warnings(
        { kind: 'concept', context: where, name },
        [wording],
        own(where, name),
      );
      const entry = journal.append(draft);
      return found.length === 0 ? entry : { ...entry, warnings: found };
    }
    case 'retire': {
      const name = read.named('concept');
      const where = context();
      unfrozen(where, name);
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
      const kind = read.optional('kind');
      if (kind !== undefined && !isDecisionKind(kind))
        throw refuse(
          `the kind is '${kind}'; a decision states meaning or constrains realization`,
        );
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
        ...(kind === undefined ? {} : { decisionKind: kind }),
      };
      const found =
        kind === 'realization'
          ? []
          : warnings(
              { kind: 'decision', context: where, id: decisionId },
              [title, situation, decision, consequences],
              own(where),
            );
      const entry = journal.append(draft);
      return found.length === 0 ? entry : { ...entry, warnings: found };
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
    case 'classify': {
      const ref = read.named('decision');
      const kind = read.required('kind', 'the kind (meaning or realization)');
      if (!isDecisionKind(kind))
        throw refuse(
          `the kind is '${kind}'; a decision states meaning or constrains realization`,
        );
      const reason = read.optional('reason');
      if (reason !== undefined && reason.trim() === '')
        throw refuse('the reason is empty; give why the decision is this kind');
      const entry = decisionOf(ref);
      const recorded = (folded.kinds.get(entry) ?? []).at(-1);
      if (recorded !== undefined && reason === undefined)
        throw refuse(
          `the decision '${ref}' is already recorded as ${recorded.kind}; give --reason to classify it again`,
        );
      const draft: Omit<ClassifyEntry, 'id' | 'at'> = {
        kind: 'classify',
        decisionId: (folded.decisions.get(entry) as DecideEntry).decisionId,
        entry,
        decisionKind: kind,
        ...(reason === undefined ? {} : { reason }),
      };
      return journal.append(draft);
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
