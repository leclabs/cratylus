// ─────────────────────────────────────────────────────────────────────────────
// The concepts capability's VERB SURFACE — `concepts <verb> [args]`.
//
//   state      the whole state of each context in one answer: the query a
//              session reconstitutes from
//   design     the current design of each context
//   history    every version of one concept
//   decisions  the decisions with their status
//   context    record a bounded context
//   define     record a concept's first version
//   supersede  record a version superseding every current one
//   retire     record a concept's retirement
//   decide     record a decision, open or accepted
//   accept     record the acceptance of an open decision
//
// A query appends nothing and prints JSON. An appending verb appends exactly one
// entry and prints it as JSON. Every refusal is one line opening with
// `concepts <verb>:`, thrown before anything is appended.
// ─────────────────────────────────────────────────────────────────────────────

import {
  type Argv,
  type VerbFlags,
  readArgv,
  switchFlag,
  valueFlag,
} from '../../verb-flags.js';
import { verbOf } from '../plan/argv.js';
import type { DecideEntry, WordedEntry } from './entries.js';
import { journalAt } from './journal.js';
import { type DecisionView, Folded } from './views.js';

const CONTEXT = {
  context: valueFlag(
    'The bounded context it belongs to, one recorded by concepts context',
  ),
} as const;

const VERSION = {
  ...CONTEXT,
  wording: valueFlag('What the concept says, in the context’s own words'),
  reason: valueFlag('Why this version is recorded'),
  'built-from': valueFlag(
    'A concept it is built from; repeat once per concept, none for a primitive',
  ),
} as const;

/** The concepts capability's verbs, queries first, each with what it does, the
 *  positional it acts on and the flags it takes. */
export const VERBS = {
  state: {
    summary:
      'Read the whole state of each context in one answer, to reconstitute from: its live concepts (current version of each), competing versions none has chosen, retired concepts, accepted decisions (settled) and open decisions (not settled)',
    positional: null,
    flags: { context: valueFlag('Only this bounded context') },
  },
  design: {
    summary:
      'Show the current design of each context: its live concepts, competing versions and retired concepts',
    positional: null,
    flags: { context: valueFlag('Only this bounded context') },
  },
  history: {
    summary:
      'Show every version of one concept in append order, each with its reason, exactly as recorded',
    positional: '<concept>',
    flags: { ...CONTEXT },
  },
  decisions: {
    summary:
      'List the decisions in the order recorded, each open, accepted or superseded',
    positional: null,
    flags: {
      context: valueFlag('Only the decisions of this bounded context'),
      open: switchFlag('Only the open decisions'),
    },
  },
  context: {
    summary:
      'Record a bounded context with its subject and its place in the context map',
    positional: '<name>',
    flags: {
      subject: valueFlag('What the context is about'),
      relation: valueFlag('How it relates to the other contexts'),
    },
  },
  define: {
    summary: 'Record the first version of a concept in one bounded context',
    positional: '<concept>',
    flags: VERSION,
  },
  supersede: {
    summary:
      'Record a new version of a concept superseding every current version, resolving competing ones',
    positional: '<concept>',
    flags: VERSION,
  },
  retire: {
    summary: 'Record the retirement of a concept, with its reason',
    positional: '<concept>',
    flags: { ...CONTEXT, reason: valueFlag('Why the concept is retired') },
  },
  decide: {
    summary:
      'Record a decision, open or accepted: its situation, the decision and its consequences',
    positional: '<id>',
    flags: {
      ...CONTEXT,
      title: valueFlag('The decision’s title'),
      situation: valueFlag('The situation that calls for the decision'),
      decision: valueFlag('What is decided'),
      consequences: valueFlag('What follows from it'),
      status: valueFlag('How the decision is recorded: open or accepted'),
      supersedes: valueFlag(
        'The id of an earlier decision this one supersedes',
      ),
    },
  },
  accept: {
    summary:
      'Record the acceptance of an open decision, an entry of its own; the decision’s record never changes',
    positional: '<id>',
    flags: { reason: valueFlag('Why it is accepted') },
  },
} as const satisfies VerbFlags;

/** What `state` says each part of its answer is. */
const READING = {
  concepts: 'the live concepts of the context, each its current version',
  competing:
    'concepts with two or more versions superseding the same one; none is chosen until a later version supersedes them all',
  retired: 'concepts retired from the design, each with its reason',
  'decisions.accepted': 'decisions accepted and not superseded: settled',
  'decisions.open': 'decisions recorded and not yet accepted: not settled',
} as const;

/** Route `concepts <verb> [args]` to the journal of the git repository holding
 *  `from`; returns what the verb prints as JSON. */
export function dispatchConcepts(
  argv: readonly string[],
  opts: { readonly from?: string } = {},
): unknown {
  const verb = verbOf(argv, 'concepts', VERBS);
  const args = readArgv(argv.slice(1), 'concepts', verb, VERBS[verb]);
  const refuse = (message: string) => new Error(`concepts ${verb}: ${message}`);
  const journal = journalAt(opts.from ?? process.cwd(), refuse);
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
   *  refuses a concept the context does not have, or a retired one. */
  const superseding = (where: string, name: string): string[] => {
    const standing = folded.standing(where, name);
    if (standing === undefined)
      throw refuse(`the bounded context '${where}' has no concept '${name}'`);
    if (standing.is === 'retired')
      throw refuse(`the concept '${name}' in '${where}' is retired`);
    return standing.is === 'competing'
      ? standing.current.map((v) => v.id)
      : [standing.current.id];
  };
  const state = (decisions: readonly DecisionView[], where: string) => ({
    ...folded.design(where),
    decisions: {
      accepted: decisions.filter(
        (d) => d.context === where && d.status === 'accepted',
      ),
      open: decisions.filter((d) => d.context === where && d.status === 'open'),
    },
  });

  switch (verb) {
    case 'state': {
      const decisions = folded.decisionViews();
      return {
        reading: READING,
        contexts: contexts().map((where) => state(decisions, where)),
      };
    }
    case 'history': {
      const where = context();
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
      const subject = read.required('subject', 'the subject');
      const relation = read.optional('relation') ?? '';
      if (folded.contexts.has(name))
        throw refuse(`the bounded context '${name}' is already recorded`);
      return journal.append({ kind: 'context', name, subject, relation });
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
      const supersedes = verb === 'define' ? [] : superseding(where, name);
      const draft: Omit<WordedEntry, 'id' | 'at'> = {
        kind: verb,
        context: where,
        name,
        wording,
        builtFrom,
        reason,
        supersedes,
      };
      return journal.append(draft);
    }
    case 'retire': {
      const name = read.named('concept');
      const where = context();
      const reason = read.required('reason', 'the reason');
      const supersedes = superseding(where, name);
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
      if (status !== 'open' && status !== 'accepted')
        throw refuse(
          `the status is '${status}'; a decision is recorded open or accepted`,
        );
      const supersedes = read.optional('supersedes') ?? null;
      if (folded.decisions.has(decisionId))
        throw refuse(`the decision '${decisionId}' is already recorded`);
      if (supersedes !== null && !folded.decisions.has(supersedes))
        throw refuse(
          `the journal has no decision '${supersedes}' to supersede`,
        );
      const draft: Omit<DecideEntry, 'id' | 'at'> = {
        kind: 'decide',
        decisionId,
        context: where,
        title,
        situation,
        decision,
        consequences,
        status,
        supersedes,
      };
      return journal.append(draft);
    }
    case 'accept': {
      const decisionId = read.named('decision id');
      const reason = read.optional('reason');
      if (reason !== undefined && reason.trim() === '')
        throw refuse('the reason is empty; give one, or leave --reason out');
      if (!folded.decisions.has(decisionId))
        throw refuse(`the journal has no decision '${decisionId}'`);
      const status = folded.status(decisionId);
      if (status !== 'open')
        throw refuse(
          `the decision '${decisionId}' is ${status}; only an open decision is accepted`,
        );
      return journal.append({
        kind: 'accept',
        decisionId,
        ...(reason === undefined ? {} : { reason }),
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
