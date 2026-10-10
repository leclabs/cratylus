// ─────────────────────────────────────────────────────────────────────────────
// The work package capability's VERB SURFACE — `workPackage <verb> --cut
// <context>/<name> [args]`.
//
//   inventory   every visible example of the cut, the package owning it, and
//               every concept with the packages serving it
//   assignment  one builder's assignment: its package and the examples it owns
//   levels      the levels of the dependency graph
//   history     the commits made as one package's, in order
//   efficiency  the cut's figures: agent runs, rounds, whole-check runs, tokens
//   submit      record a new work package
//   update      replace fields of a recorded work package
//   dispatch    hand out the next level's packages
//   finish      record a dispatched package finished
//   commit      commit paths as one package's builder
//   check       record one whole-check run
//   run         record one agent run
//   record      record the cut's figures in the concept journal
//
// Every answer is JSON. An appending verb appends one event to the cut's log
// (`store.ts`), or, for `record`, one entry to the concept journal. Every
// refusal opens with `workPackage <verb>:` and is thrown before anything is
// appended, staged or committed.
//
// The capability EXPLAINS ITSELF from the declarations below, as the concept
// journal does: its name and when, and for each verb its concept, purpose, when,
// effect and every parameter it takes.
// ─────────────────────────────────────────────────────────────────────────────

import { CAPABILITY_SUMMARIES } from '../../capability.js';
import type { CapabilityInterface, ExplainedVerb } from '../../explanation.js';
import { type VerbFlags, readArgv, valueFlag } from '../../verb-flags.js';
import { journalAt } from '../concepts/journal.js';
import { Folded as Journal } from '../concepts/views.js';
import { verbOf } from '../plan/argv.js';
import { type Cut, cutAt } from './cut.js';
import { Folded, type WorkPackage } from './fold.js';
import { commitPaths, commonDirOf, filesOf, topOf } from './git.js';
import { type DependencyGraph, dependencyGraph } from './graph.js';
import { type PackageFields, storeAt } from './store.js';

/** The flag every verb takes: the cut it acts on. */
const CUT = {
  cut: valueFlag(
    'The cut, as its context and name, <context>/<name>, whose visible examples are written',
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
      'An output the package writes, a path from the top of the project, ending in / for a directory and all under it; repeat once per output',
      { repeats: true, ...(required ? { required: true } : {}) },
    ),
    concept: valueFlag(
      'A concept the package serves, one the cut’s visible examples name; repeat once per concept',
      { repeats: true, ...(required ? { required: true } : {}) },
    ),
    'depends-on': valueFlag(
      'A work package of the cut that must finish first; repeat once per package',
      { repeats: true },
    ),
    needs: valueFlag(
      'An output of a package it depends on that it uses; repeat once per output',
      { repeats: true },
    ),
  }) as const;

/** The work package capability's verbs, queries first. */
export const VERBS = {
  inventory: {
    concept: 'work package',
    effect: 'reads',
    purpose:
      'Account for every visible example of the cut: the concepts it names and the work package that owns it, or none; and for every concept of the cut, the work packages serving it, or none',
    when: 'After submitting or updating work packages, to see that every concept is served and every example has its one owner before anything is handed out',
    positional: null,
    flags: CUT,
  },
  assignment: {
    concept: 'work package',
    effect: 'reads',
    purpose:
      'Give one builder its assignment: its work package’s outputs, concepts, dependencies and needed outputs, and exactly the visible examples it owns, each with its text',
    when: 'When handing a work package to its builder, so the builder receives its own examples and nothing of another’s',
    positional: PACKAGE,
    flags: CUT,
  },
  levels: {
    concept: 'dependency graph',
    effect: 'reads',
    purpose:
      'Show the levels of the cut’s work packages, computed from which must finish before which, each package with where it stands; refused while the packages depend on each other in a cycle, naming them',
    when: 'To see the order and the parallel work the packages allow, before handing any out or after changing their dependencies',
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
      'Show the cut’s figures: its agent runs in total and by role, its rounds, its whole-check runs, its tokens, and the rounds that made no progress',
    when: 'To see how much effort the cut has taken and whether its rounds are converging',
    positional: null,
    flags: CUT,
  },
  submit: {
    concept: 'work package',
    effect: 'appends',
    purpose:
      'Record a new work package of the cut: the outputs it alone writes, the concepts it serves, the packages it depends on and the outputs of theirs it needs',
    when: 'When slicing the cut’s work, once per work package, before anything is handed out',
    positional: PACKAGE,
    flags: { ...CUT, ...fields(true) },
  },
  update: {
    concept: 'work package',
    effect: 'appends',
    purpose:
      'Change a recorded work package: each field given replaces that field, and the levels are computed again',
    when: 'When the slicing of the cut changes, to correct a work package’s outputs, concepts, dependencies or needed outputs',
    positional: PACKAGE,
    flags: { ...CUT, ...fields(false) },
  },
  dispatch: {
    concept: 'dependency graph',
    effect: 'appends',
    purpose:
      'Hand out the work packages of the lowest level not yet finished that are not yet handed out, each with its outputs, concepts and examples; refused when nothing is ready, when a concept is served by no package, or when an example has no owner',
    when: 'When the cut is sliced, and again each time a whole level has finished',
    positional: null,
    flags: CUT,
  },
  finish: {
    concept: 'dependency graph',
    effect: 'appends',
    purpose:
      'Record a handed-out work package as finished, so the next level can be handed out once its whole level has finished',
    when: 'When the builder of a handed-out work package has made its examples pass',
    positional: PACKAGE,
    flags: CUT,
  },
  commit: {
    concept: 'work package',
    effect: 'appends',
    purpose:
      'Commit the given paths, read literally, as one handed-out work package’s builder and keep the commit in its history; refused, with nothing kept, when a path or a file it would commit lies outside that package’s outputs',
    when: 'Whenever a builder commits its work, so no builder ever changes another’s outputs',
    positional: PACKAGE,
    flags: {
      ...CUT,
      message: valueFlag('What the commit says', { required: true }),
      path: valueFlag(
        'A path to commit, from the top of the project; repeat once per path',
        { repeats: true, required: true },
      ),
    },
  },
  check: {
    concept: 'whole check',
    effect: 'appends',
    purpose:
      'Record one whole-check run and the failures it revealed; it closes its own round, and the round is flagged when it resolves none of the previous run’s failures',
    when: 'Each time the whole check is run, never for a single fix',
    positional: null,
    flags: {
      ...CUT,
      failure: valueFlag(
        'A failure the run revealed; repeat once per failure, none when it passed',
        { repeats: true },
      ),
    },
  },
  run: {
    concept: 'efficiency',
    effect: 'appends',
    purpose:
      'Record one agent run of the cut, such as a builder’s fix, with its role and the tokens it took',
    when: 'Each time an agent has run for the cut',
    positional: null,
    flags: {
      ...CUT,
      role: valueFlag('The role the agent ran as', { required: true }),
      tokens: valueFlag('The tokens the run took, a whole number'),
    },
  },
  record: {
    concept: 'efficiency',
    effect: 'appends',
    purpose:
      'Record the cut’s current figures in the concept journal, where reading back the design finds them',
    when: 'When the cut ends, or whenever its figures should outlast the session',
    positional: null,
    flags: CUT,
  },
} as const satisfies VerbFlags<string, ExplainedVerb>;

type WorkPackageVerb = keyof typeof VERBS;

/** The work package capability, as it explains itself. */
export const WORK_PACKAGE: CapabilityInterface = {
  name: 'work package',
  purpose: CAPABILITY_SUMMARIES.workPackage,
  when: 'Whenever a cut’s work is sliced and built: to record its work packages, hand them out level by level, keep each builder to its own outputs, and count its whole-check runs and agent runs',
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
 *  repository holding `from`; returns what the verb prints as JSON. */
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
      `${from} is not inside a git repository; the work packages are kept in one`,
    );

  const values = (flag: string): string[] => {
    const given = [...(args.flags.get(flag) ?? [])];
    if (given.some((v) => v.trim() === ''))
      throw refuse(`--${flag} is given empty; give it a value`);
    return given;
  };
  const single = (flag: string): string | undefined => {
    const given = values(flag);
    if (given.length > 1)
      throw refuse(`--${flag} is given ${given.length} times; give it once`);
    return given[0];
  };
  const required = (flag: string, what: string): string => {
    const value = single(flag);
    if (value === undefined) throw refuse(`give ${what} with --${flag}`);
    return value;
  };

  const cut: Cut = cutAt(top, required('cut', 'the cut'), refuse);
  const store = storeAt(commonDirOf(top), cut.cut, refuse);
  const folded = new Folded(store.events());
  const packages = [...folded.packages.values()];

  const named = (): WorkPackage => {
    const name = args.positionals[0];
    if (name === undefined || name.trim() === '')
      throw refuse('name the work package it acts on');
    const found = folded.packages.get(name);
    if (found === undefined)
      throw refuse(`the cut has no work package '${name}'`);
    return found;
  };

  /** What the cut's packages make of it: the graph, who serves each concept,
   *  and who owns each example. */
  const reading = (all: readonly WorkPackage[]) => {
    const graph = dependencyGraph(all);
    const servedBy = (concept: string) =>
      all.filter((p) => p.concepts.includes(concept)).map((p) => p.name);
    const examples = cut.examples.map((e) => {
      const candidates = all
        .filter((p) => p.concepts.some((c) => e.concepts.includes(c)))
        .map((p) => p.name);
      const downstream = candidates.filter((c) => {
        const below = graph.dependencies(c);
        return candidates.every((o) => o === c || below.has(o));
      });
      const owner =
        candidates.length === 1
          ? candidates[0]
          : downstream.length === 1
            ? downstream[0]
            : undefined;
      return { ...e, candidates, package: owner ?? null };
    });
    const concepts = cut.concepts.map((name) => ({
      name,
      servedBy: servedBy(name),
    }));
    const levels =
      graph.levels?.map((names, i) => ({
        level: i + 1,
        packages: names.map((name) => ({
          name,
          state: (all.find((p) => p.name === name) as WorkPackage).state,
        })),
      })) ?? [];
    return { graph, examples, concepts, levels };
  };
  const cycles = (graph: DependencyGraph) =>
    graph.cycles.map((c) => c.join(', ')).join('; and ');

  /** Refuse `fields` for package `name` unless they are a package the cut can
   *  hold beside its others. */
  const admit = (name: string, fields: PackageFields): void => {
    for (const path of [...fields.outputs, ...fields.needs])
      if (!isProjectPath(path))
        throw refuse(
          `'${path}' is not a path from the top of the project: relative, with / between parts and no ..`,
        );
    const unexampled = fields.concepts.filter((c) => !cut.concepts.includes(c));
    if (unexampled.length > 0)
      throw refuse(
        `the cut has no visible example of ${unexampled.map((c) => `'${c}'`).join(', ')}`,
      );
    const missing = fields.dependsOn.filter(
      (d) => !folded.packages.has(d) && d !== name,
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
    const graph = dependencyGraph([
      ...others,
      { name, dependsOn: fields.dependsOn },
    ]);
    const below = graph.dependencies(name);
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
    const after = new Folded(store.events());
    const { graph, levels } = reading([...after.packages.values()]);
    return {
      cut: cut.cut,
      package: after.packages.get(name),
      levels,
      cycles: graph.cycles,
    };
  };

  switch (verb) {
    case 'inventory': {
      const { examples, concepts } = reading(packages);
      return {
        cut: cut.cut,
        concepts,
        unserved: concepts
          .filter((c) => c.servedBy.length === 0)
          .map((c) => c.name),
        examples: examples.map((e) => ({
          number: e.number,
          concepts: e.concepts,
          package: e.package,
        })),
        unowned: examples
          .filter((e) => e.package === null)
          .map((e) => e.number),
      };
    }
    case 'assignment': {
      const own = named();
      const { examples } = reading(packages);
      return {
        cut: cut.cut,
        package: own.name,
        outputs: own.outputs,
        concepts: own.concepts,
        dependsOn: own.dependsOn,
        needs: own.needs,
        examples: examples
          .filter((e) => e.package === own.name)
          .map(({ number, concepts, text }) => ({ number, concepts, text })),
      };
    }
    case 'levels': {
      const { graph, levels } = reading(packages);
      if (graph.levels === null)
        throw refuse(
          `the work packages depend on each other in a cycle: ${cycles(graph)}; no levels until it is broken`,
        );
      return { cut: cut.cut, levels };
    }
    case 'history': {
      const own = named();
      return {
        cut: cut.cut,
        package: own.name,
        commits: folded.histories.get(own.name) ?? [],
      };
    }
    case 'efficiency':
      return { cut: cut.cut, ...folded.figures() };
    case 'submit': {
      const name = args.positionals[0];
      if (name === undefined || !/^[^\s/]+$/.test(name))
        throw refuse(
          'name the work package it records: a name with no whitespace and no /',
        );
      if (folded.packages.has(name))
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
      store.append({ type: 'submit', name, ...fields });
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
      store.append({ type: 'update', name: own.name, changes });
      return submitted(own.name);
    }
    case 'dispatch': {
      const { graph, examples, concepts, levels } = reading(packages);
      if (graph.levels === null)
        throw refuse(
          `the work packages depend on each other in a cycle: ${cycles(graph)}; nothing is handed out`,
        );
      if (packages.length === 0)
        throw refuse('nothing is ready: the cut has no work packages');
      const unserved = concepts.filter((c) => c.servedBy.length === 0);
      if (unserved.length > 0)
        throw refuse(
          `no work package serves the concepts ${unserved.map((c) => `'${c.name}'`).join(', ')}; nothing is handed out`,
        );
      const unowned = examples.filter((e) => e.package === null);
      if (unowned.length > 0)
        throw refuse(
          `${unowned
            .map((e) =>
              e.candidates.length > 1
                ? `example ${e.number} spans ${e.candidates.map((c) => `'${c}'`).join(', ')} and none depends on the others`
                : `example ${e.number} has no owner`,
            )
            .join('; ')}; nothing is handed out`,
        );
      const current = levels.find((l) =>
        l.packages.some((p) => p.state !== 'finished'),
      );
      if (current === undefined)
        throw refuse('nothing is ready: every work package is finished');
      const ready = current.packages.filter((p) => p.state === 'submitted');
      if (ready.length === 0)
        throw refuse(
          `nothing is ready: every work package of level ${current.level} is handed out and not yet finished`,
        );
      store.append({
        type: 'dispatch',
        level: current.level,
        packages: ready.map((p) => p.name),
      });
      return {
        cut: cut.cut,
        level: current.level,
        packages: ready.map(({ name }) => {
          const own = folded.packages.get(name) as WorkPackage;
          return {
            name,
            outputs: own.outputs,
            concepts: own.concepts,
            examples: examples
              .filter((e) => e.package === name)
              .map((e) => e.number),
          };
        }),
        concepts,
      };
    }
    case 'finish': {
      const own = named();
      if (own.state !== 'dispatched')
        throw refuse(
          `the work package '${own.name}' is ${own.state}; only a handed-out one is finished`,
        );
      store.append({ type: 'finish', name: own.name });
      const after = new Folded(store.events());
      return {
        cut: cut.cut,
        package: own.name,
        levels: reading([...after.packages.values()]).levels,
      };
    }
    case 'commit': {
      const own = named();
      if (own.state === 'submitted')
        throw refuse(
          `the work package '${own.name}' was never handed out; dispatch it first`,
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
      store.append({ type: 'commit', name: own.name, commit });
      return {
        cut: cut.cut,
        package: own.name,
        commit,
        history: [...(folded.histories.get(own.name) ?? []), commit],
      };
    }
    case 'check': {
      const failures = [...new Set(values('failure'))];
      store.append({ type: 'check', failures });
      const after = new Folded(store.events());
      const rounds = after.rounds();
      return {
        cut: cut.cut,
        round: rounds.length,
        rounds,
        wholeCheckRuns: after.checks.length,
      };
    }
    case 'run': {
      const role = required('role', 'the role the agent ran as');
      const given = single('tokens');
      if (given !== undefined && !/^\d+$/.test(given))
        throw refuse(
          `the tokens are '${given}'; give a whole number, 0 or more`,
        );
      store.append({
        type: 'run',
        role,
        tokens: given === undefined ? null : Number(given),
      });
      return {
        cut: cut.cut,
        ...new Folded(store.events()).figures(),
      };
    }
    case 'record': {
      const journal = journalAt(top, refuse);
      if (!new Journal(journal.entries()).contexts.has(cut.context))
        throw refuse(
          `the journal has no bounded context '${cut.context}'; record it with concepts context first`,
        );
      const { agentRuns, rounds, wholeCheckRuns, tokens } = folded.figures();
      return journal.append({
        kind: 'efficiency',
        context: cut.context,
        cut: cut.name,
        agentRuns,
        rounds,
        wholeCheckRuns,
        tokens,
      });
    }
  }
}
