// ─────────────────────────────────────────────────────────────────────────────
// The work package capability's VERB SURFACE — `workPackage <verb> --cut <name>
// [args]`, a cut identified by its name alone, across contexts.
//
//   inventory   every visible example of the cut, the package owning it, and
//               every concept with the packages serving it
//   assignment  one builder's assignment: its package and the examples it owns
//   levels      the levels of the dependency graph
//   history     the commits made as one package's, in order
//   efficiency  the cut's figures: agent runs, rounds, whole-check runs, tokens
//   state       the cut's record, phase, package statuses and ready packages
//   frozen      every cut opened and not integrated, and what each freezes;
//               the one verb that takes no --cut
//   open        record the cut: its branch and each context's architect; from
//               then the cut is frozen
//   freeze      freeze with the cut checks that bind its examples
//   integrate   record the cut integrated, ending its freeze; the architect's
//   submit      record a new work package
//   update      replace fields of a recorded work package
//   commit      commit paths as one package's builder
//   check       record one whole-check run
//   record      record the cut's figures in the concept journal
//
// A cut is FROZEN from its `open` until its `integrate` (`frozen.ts`). Only the
// agent making the call, named by the harness (`../../acting-agent.ts`), may
// integrate a cut, and only when it is the architect the cut records for each
// of its contexts.
//
// Every answer is JSON; a reading that read past ledger entries of kinds this
// runtime does not know, written by a newer one, also carries `uninterpreted`,
// saying what it read past and how it was read. An appending verb appends one
// entry to the ledger (`ledger.ts`), or, for `record`, entries to the concept
// journal. Every refusal opens with `workPackage <verb>:` and is thrown before
// anything is appended, staged or committed. No verb writes a lifecycle entry:
// a dispatch, a return, a verdict and a report reach the ledger only from the
// harness's own events, through the `cratylus lifecycle` command
// (`../../lifecycle/`).
//
// The capability EXPLAINS ITSELF from the declarations below, as the concept
// journal does: its name and when, and for each verb its concept, purpose, when,
// effect and every parameter it takes.
// ─────────────────────────────────────────────────────────────────────────────

import { statSync } from 'node:fs';
import { join } from 'node:path';
import { actingAgent } from '../../acting-agent.js';
import { CAPABILITY_SUMMARIES } from '../../capability.js';
import type { CapabilityInterface, ExplainedVerb } from '../../explanation.js';
import { ulid } from '../../ulid.js';
import { type VerbFlags, readArgv, valueFlag } from '../../verb-flags.js';
import { journalAt } from '../concepts/journal.js';
import { Folded as Journal } from '../concepts/views.js';
import { verbOf } from '../plan/argv.js';
import { type Cut, cutAt } from './cut.js';
import { type CutRecord, type WorkPackage, foldCut } from './fold.js';
import { frozenIn } from './frozen.js';
import { commitPaths, filesOf, topOf } from './git.js';
import { dependencyGraph } from './graph.js';
import { type Ledger, type PackageFields, ledgerAt } from './ledger.js';
import { conceptsNamed, readCut } from './reading.js';

/** The flag every verb but `frozen` takes: the cut it acts on. */
const CUT = {
  cut: valueFlag(
    'The cut, by its name: one reviewable change, whose examples are those written for it in each of its contexts',
    { required: true },
  ),
} as const;

/** The work package a verb acts on, by its name. */
const PACKAGE = {
  name: 'package',
  description: 'The work package, by its name',
} as const;

/** The fields of a work package, each given once per value. */
const fields = (required: boolean) =>
  ({
    output: valueFlag(
      'An output of the package: a file the work package alone writes, or, ending in /, a folder whose every file it alone writes; repeat once per output',
      { repeats: true, ...(required ? { required: true } : {}) },
    ),
    concept: valueFlag(
      'A concept the package serves, one the cut’s examples name, by its name, or as <context>/<name> where two of the cut’s contexts share the name; repeat once per concept',
      { repeats: true, ...(required ? { required: true } : {}) },
    ),
    'depends-on': valueFlag(
      'A work package of the cut whose builder must have returned its work first; repeat once per package',
      { repeats: true },
    ),
    needs: valueFlag(
      'An output of a package it depends on that it uses but never writes; repeat once per output',
      { repeats: true },
    ),
  }) as const;

/** The work package capability's verbs, queries first. */
export const VERBS = {
  inventory: {
    concept: 'work package',
    effect: 'reads',
    purpose:
      'Account for every example of the cut, named by its context and number: the concepts it names and the one work package that owns it, or none; and for every concept of the cut, in its own context, the work packages serving it, or none',
    when: 'After submitting or updating work packages, to see that every concept is served and every example has its one owner before any builder is set to work',
    positional: null,
    flags: CUT,
  },
  assignment: {
    concept: 'work package',
    effect: 'reads',
    purpose:
      'Give one builder, the agent that builds one work package until its examples pass, its assignment: the package’s outputs, concepts, dependencies and needed outputs, and exactly the examples it owns, each with its text',
    when: 'When handing a work package to its builder, so the builder receives its own examples and nothing of another’s',
    positional: PACKAGE,
    flags: CUT,
  },
  levels: {
    concept: 'dependency graph',
    effect: 'reads',
    purpose:
      'Show the levels of the cut’s work packages, computed from which must return before which, so the packages of one level can be built side by side, each with where it stands; refused while packages depend on each other in a cycle, naming them',
    when: 'To see the order and the parallel work the packages allow, before any builder is set to work or after changing their dependencies',
    positional: null,
    flags: CUT,
  },
  history: {
    concept: 'work package',
    effect: 'reads',
    purpose: 'Show the commits made as one work package’s, in the order made',
    when: 'To see what a builder has committed for its work package',
    positional: PACKAGE,
    flags: CUT,
  },
  efficiency: {
    concept: 'efficiency',
    effect: 'reads',
    purpose:
      'Show the cut’s effort: how many times an agent worked on it, in total and by the role it worked in (lead, builder, assayer and so on), the tokens they spent, its rounds (each ending with one run of the whole check, every example of the cut checked at once), and the rounds that resolved none of the previous round’s failures',
    when: 'To see how much effort the cut has taken and whether its rounds are converging',
    positional: null,
    flags: CUT,
  },
  state: {
    concept: 'ledger',
    effect: 'reads',
    purpose:
      'Tell where the cut stands, from its ledger (the cut’s history of what its agents were given and returned): its branch, contexts and the architect holding each; its phase; whether it is integrated; each work package’s status, approved only once two independent assayers (agents who judge the work against its examples) both pass it; the packages ready for their builder, never started or returned to build by a finding or a failing whole check; and the last report its lead (the agent running the cut) returned',
    when: 'Before acting on a cut, and whenever its progress matters: each answer is worked out afresh, so an earlier answer never stands for the current state',
    positional: null,
    flags: CUT,
  },
  frozen: {
    concept: 'freeze',
    effect: 'reads',
    purpose:
      'Show every cut opened and not yet integrated, and what each freezes: for each of its contexts its examples and its held-out example text, frozen from its opening; the checks frozen with it and, once any is, its judgment folder with everything in it, its held-out checks; and each concept its examples name, in its own context; with the architect who alone may change them',
    when: 'Before changing an example, a judgment, a check or a concept, to see whether a cut freezes it and whose change it is; the one account of what is frozen',
    positional: null,
    flags: {},
  },
  open: {
    concept: 'cut',
    effect: 'appends',
    purpose:
      'Record the cut: the branch its change is built on and, for each of its contexts, the architect who holds it, who approves that context’s examples and settles its meaning questions; from then the cut is frozen, its examples, its held-out example text and the concepts its examples name changed only by its architect until it is integrated, its judgment folder left open to its check-writer until its checks are frozen; refused when its contexts are held by different architects, which calls for one cut per context joined by contracts, or when a context has no architect',
    when: 'Once, when the cut’s examples are approved and before its work is sliced or any agent is set to work on it',
    positional: null,
    flags: {
      ...CUT,
      branch: valueFlag('The branch the cut’s change is built on', {
        required: true,
      }),
      architect: valueFlag(
        'A context of the cut and the architect who holds it, as <context>=<architect>; repeat once per context of the cut',
        { repeats: true, required: true },
      ),
    },
  },
  freeze: {
    concept: 'freeze',
    effect: 'appends',
    purpose:
      'Freeze checks with the cut: checks that bind its examples, each seen failing before the work it checks was built, and with the first of them the cut’s judgment folder, its held-out checks, so that from then only the cut’s architect may change them until the cut is integrated; refused for a cut not opened or already integrated, and for a check that does not exist',
    when: 'Once a check that binds the cut’s examples has been seen failing, before any builder is set to work on what it checks',
    positional: null,
    flags: {
      ...CUT,
      check: valueFlag(
        'A check to freeze, from the top of the project: a file, or, ending in /, a folder whose every file is frozen; repeat once per check',
        { repeats: true, required: true },
      ),
    },
  },
  integrate: {
    concept: 'cut',
    effect: 'appends',
    purpose:
      'Record the cut integrated, which ends its freeze and nothing else: its examples, held-out example text, checks, judgment folder and concepts may change again by anyone with the right to change them, its history is kept, and another cut not integrated still freezes what the two share; refused unless the agent making the call is the architect the cut records for each of its contexts',
    when: 'When the cut’s architect takes its change into the design, and never before: no phase, verdict or report stands for it',
    positional: null,
    flags: CUT,
  },
  submit: {
    concept: 'work package',
    effect: 'appends',
    purpose:
      'Record a new work package of the cut: the outputs it alone writes, the concepts it serves, the packages it depends on and the outputs of theirs it needs',
    when: 'When slicing the cut’s work, once per work package, before any builder is set to work',
    positional: PACKAGE,
    flags: { ...CUT, ...fields(true) },
  },
  update: {
    concept: 'work package',
    effect: 'appends',
    purpose:
      'Change a recorded work package: each field given replaces that field, and the levels are worked out again',
    when: 'When the slicing of the cut changes, to correct a work package’s outputs, concepts, dependencies or needed outputs',
    positional: PACKAGE,
    flags: { ...CUT, ...fields(false) },
  },
  commit: {
    concept: 'work package',
    effect: 'appends',
    purpose:
      'Commit the named files as the builder of one work package that has been started, and keep the commit in its history; refused, with nothing kept, when any file it would commit is not one of that package’s outputs',
    when: 'Whenever a builder commits its work, so no builder ever changes another’s outputs',
    positional: PACKAGE,
    flags: {
      ...CUT,
      message: valueFlag('What the commit says', { required: true }),
      path: valueFlag(
        'A file, or a folder of files, to commit; repeat once per file or folder',
        { repeats: true, required: true },
      ),
    },
  },
  check: {
    concept: 'whole check',
    effect: 'appends',
    purpose:
      'Record one run of the whole check, every example of the cut checked at once, and the failures it found; it ends its own round, which is flagged when it resolves none of the previous run’s failures',
    when: 'Each time the whole check is run, never for a single fix',
    positional: null,
    flags: {
      ...CUT,
      failure: valueFlag(
        'A failure the run found; repeat once per failure, none when everything passed',
        { repeats: true },
      ),
    },
  },
  record: {
    concept: 'efficiency',
    effect: 'appends',
    purpose:
      'Record the cut’s current effort in the concept journal, once for each of its contexts, where reading back the design finds it',
    when: 'When the cut ends, or whenever its effort should outlast the session',
    positional: null,
    flags: CUT,
  },
} as const satisfies VerbFlags<string, ExplainedVerb>;

type WorkPackageVerb = keyof typeof VERBS;

/** The work package capability, as it explains itself. */
export const WORK_PACKAGE: CapabilityInterface = {
  name: 'work package',
  purpose: CAPABILITY_SUMMARIES.workPackage,
  when: 'Whenever a cut’s work is sliced and built: to record the cut and its work packages, see where it stands, keep each builder to its own outputs, and count its rounds and the agents’ work on it',
  verbs: VERBS,
};

/** Whether `output` covers `path`: the same path, or a directory holding it. */
const covers = (output: string, path: string): boolean =>
  output === path || (output.endsWith('/') && path.startsWith(output));

/** Whether `path` is a path from the top of the project: relative, POSIX,
 *  with no `..`. */
const isProjectPath = (path: string): boolean =>
  !path.startsWith('/') &&
  !path.includes('\\') &&
  path
    .replace(/\/$/, '')
    .split('/')
    .every((part) => part !== '' && part !== '.' && part !== '..');

/** Route `workPackage <verb> [args]` to the cut it names in the git
 *  repository holding `from`; returns what the verb prints as JSON, a reading
 *  with what it read past of the ledger. */
export function dispatchWorkPackage(
  argv: readonly string[],
  opts: { readonly from?: string } = {},
): unknown {
  const verb: WorkPackageVerb = verbOf(argv, 'workPackage', VERBS);
  const args = readArgv(argv.slice(1), 'workPackage', verb, VERBS[verb]);
  const refuse = (message: string) =>
    new Error(`workPackage ${verb}: ${message}`);
  const from = opts.from ?? process.cwd();
  const top = topOf(from);
  if (top === undefined)
    throw refuse(
      `${from} is not inside a git repository; the ledger is kept in one`,
    );

  const values = (flag: string): string[] => {
    const given = [...(args.flags.get(flag) ?? [])];
    if (given.some((v) => v.trim() === ''))
      throw refuse(`--${flag} is given empty; give it a value`);
    return given;
  };
  const required = (flag: string, what: string): string => {
    const given = values(flag);
    if (given.length > 1)
      throw refuse(`--${flag} is given ${given.length} times; give it once`);
    if (given[0] === undefined) throw refuse(`give ${what} with --${flag}`);
    return given[0];
  };

  const ledger = ledgerAt(top, refuse);
  if (verb === 'frozen')
    return withReadPast(
      verb,
      { cuts: frozenIn(top, ledger.entries(), refuse) },
      ledger,
    );
  const cut: Cut = cutAt(top, required('cut', 'the cut'), refuse);
  const state = foldCut(ledger.entries(), cut.cut);
  const packages = [...state.packages.values()];
  /** A fresh transition id for an entry a verb appends. */
  const transition = (kind: string) => `${kind}:${cut.cut}:${ulid()}`;

  const named = (): WorkPackage => {
    const name = args.positionals[0];
    if (name === undefined || name.trim() === '')
      throw refuse('name the work package it acts on');
    const found = state.packages.get(name);
    if (found === undefined)
      throw refuse(`the cut has no work package '${name}'`);
    return found;
  };

  /** The cut's record, while the cut is frozen: opened and not integrated. */
  const frozenRecord = (): CutRecord => {
    if (state.record === undefined)
      throw refuse(
        `the cut '${cut.cut}' is not opened; open it once its examples are approved`,
      );
    if (state.integrated)
      throw refuse(`the cut '${cut.cut}' is integrated; its freeze has ended`);
    return state.record;
  };

  /** The levels of `all`, each package with where it stands. */
  const levelsOf = (all: readonly WorkPackage[]) =>
    dependencyGraph(all).levels?.map((names, i) => ({
      level: i + 1,
      packages: names.map((name) => ({
        name,
        state: (all.find((p) => p.name === name) as WorkPackage).status,
      })),
    })) ?? [];

  /** Refuse `fields` for package `name` unless they are a package the cut can
   *  hold beside its others. */
  const admit = (name: string, fields: PackageFields): void => {
    for (const path of [...fields.outputs, ...fields.needs])
      if (!isProjectPath(path))
        throw refuse(
          `'${path}' is not a path from the top of the project: relative, with / between parts and no ..`,
        );
    const unexampled = fields.concepts.filter(
      (c) => conceptsNamed(cut, c).length === 0,
    );
    if (unexampled.length > 0)
      throw refuse(
        `the cut has no visible example of ${unexampled.map((c) => `'${c}'`).join(', ')}`,
      );
    for (const given of fields.concepts) {
      const shared = conceptsNamed(cut, given);
      if (shared.length > 1)
        throw refuse(
          `the concept '${given}' is named in the contexts ${shared.map((c) => `'${c.context}'`).join(', ')}; give it as <context>/${given}`,
        );
    }
    const missing = fields.dependsOn.filter(
      (d) => !state.packages.has(d) && d !== name,
    );
    if (missing.length > 0)
      throw refuse(
        `the cut has no work package ${missing.map((d) => `'${d}'`).join(', ')} to depend on`,
      );
    const others = packages.filter((p) => p.name !== name);
    for (const output of fields.outputs)
      for (const other of others)
        for (const theirs of other.outputs)
          if (covers(output, theirs) || covers(theirs, output))
            throw refuse(
              `the output '${output}' of '${name}' overlaps the output '${theirs}' of '${other.name}'`,
            );
    const below = dependencyGraph([
      ...others,
      { name, dependsOn: fields.dependsOn },
    ]).dependencies(name);
    for (const need of fields.needs) {
      const owner = others.find((p) => p.outputs.some((o) => covers(o, need)));
      if (owner === undefined)
        throw refuse(`the needed output '${need}' is owned by no work package`);
      if (!below.has(owner.name))
        throw refuse(
          `the needed output '${need}' is owned by '${owner.name}', which '${name}' does not depend on`,
        );
    }
  };

  /** The answer to a submission or an update of `name`. */
  const submitted = (name: string) => {
    const after = [...foldCut(ledger.entries(), cut.cut).packages.values()];
    const {
      name: _,
      status,
      ...own
    } = after.find((p) => p.name === name) as WorkPackage;
    return {
      cut: cut.cut,
      package: { name, ...own, state: status },
      levels: levelsOf(after),
      cycles: dependencyGraph(after).cycles,
    };
  };

  const answer = ((): unknown => {
    switch (verb) {
      case 'inventory': {
        const { concepts, examples, unserved, unowned } = readCut(
          cut,
          packages,
        );
        return {
          cut: cut.cut,
          concepts: concepts.map(({ name, context, servedBy }) => ({
            name,
            context,
            servedBy,
          })),
          unserved,
          examples: examples.map(
            ({ ref, context, number, concepts, package: owner }) => ({
              ref,
              context,
              number,
              concepts,
              package: owner,
            }),
          ),
          unowned,
        };
      }
      case 'assignment': {
        const own = named();
        return {
          cut: cut.cut,
          package: own.name,
          outputs: own.outputs,
          concepts: own.concepts,
          dependsOn: own.dependsOn,
          needs: own.needs,
          examples: readCut(cut, packages)
            .examples.filter((e) => e.package === own.name)
            .map(({ ref, context, number, concepts, text }) => ({
              ref,
              context,
              number,
              concepts,
              text,
            })),
        };
      }
      case 'levels': {
        const graph = dependencyGraph(packages);
        if (graph.levels === null)
          throw refuse(
            `the work packages depend on each other in a cycle: ${graph.cycles.map((c) => c.join(', ')).join('; and ')}; no levels until it is broken`,
          );
        return { cut: cut.cut, levels: levelsOf(packages) };
      }
      case 'history': {
        const own = named();
        return {
          cut: cut.cut,
          package: own.name,
          commits: state.histories.get(own.name) ?? [],
        };
      }
      case 'efficiency':
        return { cut: cut.cut, ...state.figures };
      case 'state':
        return {
          cut: cut.cut,
          branch: state.record?.branch ?? null,
          contexts: cut.contexts,
          architects: state.record?.architects ?? {},
          phase: state.phase,
          integrated: state.integrated,
          workPackages: packages.map(({ name, status, dependsOn }) => ({
            name,
            status,
            dependsOn,
          })),
          ready: state.ready,
          report: state.report,
        };
      case 'open': {
        if (state.record !== undefined)
          throw refuse(
            `the cut '${cut.cut}' is already recorded, on the branch '${state.record.branch}'`,
          );
        const branch = required('branch', 'the branch the cut is built on');
        if (/\s/.test(branch))
          throw refuse(
            `the branch '${branch}' holds whitespace; name a branch`,
          );
        const architects: Record<string, string> = {};
        for (const given of values('architect')) {
          const [context = '', architect = ''] = given.split(/=(.*)/s);
          if (context.trim() === '' || architect.trim() === '')
            throw refuse(`--architect '${given}' is not <context>=<architect>`);
          if (!cut.contexts.includes(context))
            throw refuse(
              `the cut '${cut.cut}' has no context '${context}'; its contexts are ${cut.contexts.map((c) => `'${c}'`).join(', ')}`,
            );
          if (architects[context] !== undefined)
            throw refuse(
              `the context '${context}' is given an architect twice`,
            );
          architects[context] = architect;
        }
        const without = cut.contexts.filter((c) => architects[c] === undefined);
        if (without.length > 0)
          throw refuse(
            `the contexts ${without.map((c) => `'${c}'`).join(', ')} of the cut '${cut.cut}' have no architect; give each with --architect <context>=<architect>, never assumed`,
          );
        if (new Set(Object.values(architects)).size > 1)
          throw refuse(
            `the contexts of the cut '${cut.cut}' are held by different architects (${cut.contexts
              .map((c) => `'${c}'=${architects[c]}`)
              .join(
                ', ',
              )}); such intent is one cut per context, joined by contracts, never one cut for convenience`,
          );
        return ledger.append({
          kind: 'cut',
          transition: `open:${cut.cut}`,
          cut: cut.cut,
          branch,
          contexts: cut.contexts,
          architects,
        });
      }
      case 'freeze': {
        const checks = [...new Set(values('check'))];
        if (checks.length === 0)
          throw refuse('give at least one check with --check');
        for (const check of checks) {
          if (!isProjectPath(check))
            throw refuse(
              `'${check}' is not a path from the top of the project: relative, with / between parts and no ..`,
            );
          const found = statSync(join(top, check), { throwIfNoEntry: false });
          const folder = check.endsWith('/');
          if (found === undefined || found.isDirectory() !== folder)
            throw refuse(
              folder
                ? `the check folder '${check}' does not exist`
                : `the check '${check}' is not a file; give a folder ending in /`,
            );
        }
        frozenRecord();
        return ledger.append({
          kind: 'freeze',
          transition: transition('freeze'),
          cut: cut.cut,
          checks,
        });
      }
      case 'integrate': {
        const record = frozenRecord();
        const agent = actingAgent();
        const holders = record.contexts.map(
          (c) =>
            `'${c}' by ${record.architects[c] === undefined ? 'no architect' : `'${record.architects[c]}'`}`,
        );
        if (
          agent === undefined ||
          record.contexts.some((c) => record.architects[c] !== agent)
        )
          throw refuse(
            `only the cut’s architect integrates it, and the call is made by ${agent === undefined ? 'an unknown agent' : `'${agent}'`}; the cut '${cut.cut}' is held ${holders.join(', ')}; nothing is recorded`,
          );
        return ledger.append({
          kind: 'integrate',
          transition: `integrate:${cut.cut}`,
          cut: cut.cut,
          agent,
        });
      }
      case 'submit': {
        const name = args.positionals[0];
        if (name === undefined || !/^[^\s/]+$/.test(name))
          throw refuse(
            'name the work package it records: a name with no whitespace and no /',
          );
        if (state.packages.has(name))
          throw refuse(
            `the cut already has the work package '${name}'; update it instead`,
          );
        const fields: PackageFields = {
          outputs: values('output'),
          concepts: values('concept'),
          dependsOn: values('depends-on'),
          needs: values('needs'),
        };
        if (fields.outputs.length === 0)
          throw refuse('give at least one output with --output');
        if (fields.concepts.length === 0)
          throw refuse('give at least one concept with --concept');
        admit(name, fields);
        ledger.append({
          kind: 'submit',
          transition: transition('submit'),
          cut: cut.cut,
          workPackage: name,
          ...fields,
        });
        return submitted(name);
      }
      case 'update': {
        const own = named();
        const changes: Partial<PackageFields> = {
          ...(args.flags.has('output') ? { outputs: values('output') } : {}),
          ...(args.flags.has('concept') ? { concepts: values('concept') } : {}),
          ...(args.flags.has('depends-on')
            ? { dependsOn: values('depends-on') }
            : {}),
          ...(args.flags.has('needs') ? { needs: values('needs') } : {}),
        };
        if (Object.keys(changes).length === 0)
          throw refuse(
            'give at least one of --output, --concept, --depends-on or --needs',
          );
        admit(own.name, { ...own, ...changes });
        ledger.append({
          kind: 'update',
          transition: transition('update'),
          cut: cut.cut,
          workPackage: own.name,
          changes,
        });
        return submitted(own.name);
      }
      case 'commit': {
        const own = named();
        if (own.status === 'submitted')
          throw refuse(
            `the work package '${own.name}' has no builder dispatched by the harness; dispatch its builder first`,
          );
        const message = required('message', 'what the commit says');
        const paths = values('path');
        if (paths.length === 0)
          throw refuse('give at least one path with --path');
        const malformed = paths.filter((p) => !isProjectPath(p));
        if (malformed.length > 0)
          throw refuse(
            `${malformed.map((p) => `'${p}'`).join(', ')} is not a path from the top of the project`,
          );
        const outside = [...new Set([...paths, ...filesOf(top, paths)])].filter(
          (path) => !own.outputs.some((o) => covers(o, path)),
        );
        if (outside.length > 0)
          throw refuse(
            `outside the outputs of '${own.name}': ${outside
              .map((path) => {
                const owner = packages.find((p) =>
                  p.outputs.some((o) => covers(o, path)),
                );
                return owner === undefined
                  ? `'${path}'`
                  : `'${path}' (an output of '${owner.name}')`;
              })
              .join(', ')}; nothing is committed`,
          );
        let sha: string;
        try {
          sha = commitPaths(top, message, paths);
        } catch (error) {
          throw refuse(
            `git refused the commit, and nothing is committed: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
        const commit = { sha, message, paths };
        ledger.append({
          kind: 'commit',
          transition: `commit:${cut.cut}:${sha}`,
          cut: cut.cut,
          workPackage: own.name,
          commit,
        });
        return {
          cut: cut.cut,
          package: own.name,
          commit,
          history: [...(state.histories.get(own.name) ?? []), commit],
        };
      }
      case 'check': {
        ledger.append({
          kind: 'check',
          transition: transition('check'),
          cut: cut.cut,
          failures: [...new Set(values('failure'))],
        });
        const { rounds } = foldCut(ledger.entries(), cut.cut);
        return {
          cut: cut.cut,
          round: rounds.length,
          rounds,
          wholeCheckRuns: rounds.length,
        };
      }
      case 'record': {
        const journal = journalAt(top, refuse);
        const known = new Journal(journal.entries()).contexts;
        const absent = cut.contexts.filter((c) => !known.has(c));
        if (absent.length > 0)
          throw refuse(
            `the journal has no bounded context ${absent.map((c) => `'${c}'`).join(', ')}; record it with concepts context first`,
          );
        const { agentRuns, rounds, wholeCheckRuns, tokens } = state.figures;
        const recorded = cut.contexts.map((context) =>
          journal.append({
            kind: 'efficiency',
            context,
            cut: cut.cut,
            agentRuns,
            rounds,
            wholeCheckRuns,
            tokens,
          }),
        );
        // One context: its entry; a cut across contexts: one entry for each.
        return recorded.length === 1 ? recorded[0] : recorded;
      }
    }
  })();
  return withReadPast(verb, answer, ledger);
}

/** `answer`, and, when `verb` reads, what `ledger` read past. */
function withReadPast(
  verb: WorkPackageVerb,
  answer: unknown,
  ledger: Ledger,
): unknown {
  const report =
    VERBS[verb].effect === 'reads' ? ledger.readPast().report() : undefined;
  return report === undefined
    ? answer
    : { ...(answer as object), uninterpreted: report };
}
