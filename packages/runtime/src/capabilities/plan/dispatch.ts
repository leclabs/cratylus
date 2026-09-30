// ─────────────────────────────────────────────────────────────────────────────
// The plan capability's VERB SURFACE — `plan <verb> [args]`.
//
//   show       the bound plan in wave order; any plan named, whole, with its
//              units; or one unit in full (`--plan <p>` says whose)
//   add        a unit; the first add naming a plan that does not exist proposes
//              it, realizing `--plan-realizes <concept>` (repeated)
//   advance    a unit one step forward, `--to <state>`
//   retract    a unit, unless another live unit depends on it
//   revise     a unit (its spec; `--repin` retakes its pin) or a plan (its
//              name, its concepts)
//   bind       a plan, returning whichever plan was bound
//   close      a plan, for good: it and its units are never written again
//   reconcile  a diverged unit or plan: one version over every version
//   land       the commit that holds a unit's work, in its ledger
//   assay      an assay's verdict on a commit, in a unit's ledger
//   whole      the line's commit holding a unit, in its ledger
//   broke      the check a unit broke the whole by, in its ledger
//
// What composes the domains, resolves names and writes all or nothing is
// `reading.ts`; this module maps each verb onto it. The laws spanning plan and
// unit hold here too: a unit realizes one of its plan's concepts; a closed
// plan's units are never written again; a unit is added to no diverged plan.
//
// A PIN is taken when a unit is added and retaken only by a revise or a
// reconcile that says so (`--repin`) with a reason, so editing a spec never
// clears a drift. Changing the concept a unit realizes retakes its pin, and so
// must say so.
//
// Every verb needs the plan lifecycle (`reading.ts`), and refuses without it.
// ─────────────────────────────────────────────────────────────────────────────

import type { Invocation } from '../../ports/design.js';
import type { Fields, PlanHost } from '../../ports/plan.js';
import type { Fold } from '../../record-store/fold.js';
import { type Name, bare, parsed, printed } from '../../record-store/names.js';
import { type Argv, type VerbFlags, readArgv } from '../../verb-flags.js';
import { planView } from '../../view/plan.js';
import { INVOCATION, invocation, many, one, subject, verbOf } from './argv.js';
import type { Pin } from './pin.js';
import * as planDomain from './plan.js';
import {
  type Reading,
  UNWRITTEN,
  act,
  agreed,
  look,
  versions,
} from './reading.js';
import * as unitDomain from './unit.js';

/** The fields of a unit that a plan does not have. */
const UNIT_ONLY = ['intent', 'static', 'deps', 'outputs', 'accept'] as const;

/** What a write leaves the view to show: the plans, and the name drilled. */
interface Shown {
  readonly plans: readonly string[];
  /** The name drilled, or how to name it over the reading the write leaves. */
  readonly name?: Name | ((after: Reading) => Name);
  /** The name drills to each unit's line and ledger, none of its spec. */
  readonly ledgerOnly?: boolean;
  /** The plan entity this write binds, whose line it cuts. */
  readonly cut?: string;
}

/** The plan capability over the records of the repository holding `from`. */
export function planHost(from: string = process.cwd()): PlanHost {
  /** A plan verb's write, all or nothing, and the view of what it leaves. */
  const write = (verb: (read: Reading) => Shown): string =>
    act(
      'plan',
      from,
      (read) => {
        read.lifecycle;
        return verb(read);
      },
      (read, shown) =>
        planView(
          read.planState(
            shown.plans.filter((p) => read.plans.has(p)).length
              ? shown.plans
              : planDomain.holders(read.plans, read.lifecycle.plan),
          ),
          typeof shown.name === 'function' ? shown.name(read) : shown.name,
          shown.ledgerOnly,
        ),
      (shown) => shown.cut,
    );

  /** A unit's spec: `fields` over `current`, its deps resolved in `plan`. */
  const spec = (
    read: Reading,
    plan: string,
    name: string,
    fields: Fields,
    current?: unitDomain.Spec,
  ): unitDomain.Spec => ({
    name,
    intent: fields.intent ?? current?.intent ?? '',
    static: fields.static ?? current?.static ?? [],
    deps:
      fields.deps?.map((d) => read.resolveDep(d, plan)) ?? current?.deps ?? [],
    outputs: fields.outputs ?? current?.outputs ?? [],
    accept: fields.accept ?? current?.accept ?? [],
  });

  /** The one concept a unit write realizes, when it names one. */
  const realized = (read: Reading, fields: Fields): string | undefined => {
    if (fields.realizes === undefined) return undefined;
    if (fields.realizes.length !== 1)
      throw new Error(
        'a unit realizes exactly one concept; give --realizes once',
      );
    return read.resolveConcept(fields.realizes[0] as string);
  };

  /** The pin a unit write carries: `kept` unless the write re-pins, which it
   *  must say with `--repin` and a reason; changing the concept re-pins. */
  const pinned = (
    read: Reading,
    verb: string,
    fields: Fields,
    by: Invocation,
    concept: string,
    kept: Pin | undefined,
  ): Pin => {
    if (!fields.repin) {
      if (kept !== undefined && kept.concept === concept) return kept;
      throw new Error(
        kept === undefined
          ? `plan ${verb}: its versions are pinned differently; give --repin, with a --reason, to pin it now`
          : `plan ${verb}: a unit realizing another concept is pinned anew; give --repin, with a --reason`,
      );
    }
    if (by.reason.trim() === '')
      throw new Error(`plan ${verb}: a re-pin says why; give a --reason`);
    return read.pin(concept);
  };

  /** The unit or plan `name` names: a unit of `plan` when it is given. */
  const target = (
    read: Reading,
    verb: string,
    name: string,
    plan: string | undefined,
  ): { unit: string } | { plan: string } => {
    if (plan !== undefined) return { unit: read.resolveUnit(name, plan) };
    const asPlan = read.findPlan(name);
    const asUnit = read.findUnit(name);
    if (asPlan !== undefined && asUnit !== undefined)
      throw new Error(
        `plan ${verb}: ${JSON.stringify(name)} names a plan and a unit; give --plan to ${verb} the unit`,
      );
    if (asPlan !== undefined) return { plan: asPlan };
    if (asUnit !== undefined) return { unit: asUnit };
    throw new Error(
      `plan ${verb}: no plan or unit is named ${JSON.stringify(name)}`,
    );
  };

  const planOnly = (verb: string, fields: Fields): void => {
    const given = [
      ...UNIT_ONLY.filter((f) => fields[f] !== undefined),
      ...(fields.repin ? ['pin'] : []),
    ];
    if (given.length > 0)
      throw new Error(
        `plan ${verb}: a plan has no ${given.join(', ')}; give a plan its --name and --realizes`,
      );
  };

  /** An event written to a unit's ledger, and the unit's line and ledger it
   *  leaves, none of its spec. */
  const event = (
    verb: string,
    unit: string,
    plan: string | undefined,
    fact: unitDomain.Fact,
    by: Invocation,
  ): string =>
    write((read) => {
      const entity = read.resolveUnit(unit, plan);
      const of = read.unitVersion(entity)?.plan as string;
      read.unitWritable(of, verb);
      unitDomain.record(read.store, read.lifecycle.unit, entity, fact, by);
      return {
        plans: [of],
        name: bare(read.unitName(entity)),
        ledgerOnly: true,
      };
    });

  return {
    show: (name, plan) =>
      look('plan', from, (read) => {
        const bound = planDomain.holders(read.plans, read.lifecycle.plan);
        const asPlan = name === undefined ? undefined : read.findPlan(name);
        if (plan === undefined && asPlan !== undefined)
          return planView(read.planState([asPlan]));
        // A marked name addresses a withdrawn unit through the one name home,
        // and drills by the name it prints under.
        const withdrawn =
          name === undefined ? undefined : read.findWithdrawnUnit(name, plan);
        if (withdrawn !== undefined)
          return planView(
            read.planState([read.unitVersion(withdrawn)?.plan as string]),
            read.withdrawnUnitName(withdrawn),
          );
        // `u of plan p`, the form a unit is printed in where no plan is in
        // view, is the unit `u` looked up in `p`.
        const qualified =
          plan === undefined && name !== undefined
            ? read.qualified(name)
            : undefined;
        const unit = qualified?.unit ?? name;
        const scope = qualified?.plan ?? plan;
        const query = unit === undefined ? undefined : parsed(unit);
        if (scope !== undefined)
          return planView(read.planState([read.resolvePlan(scope)]), query);
        if (query === undefined) return planView(read.planState(bound));
        const of = [...read.units.keys()].flatMap((e) => {
          const u = read.unitVersion(e);
          return u && u.spec.name === bare(query) ? [u.plan] : [];
        });
        return planView(read.planState([...new Set(of)]), query);
      }),

    add: (unit, plan, fields, proposal, by) =>
      write((read) => {
        const { lifecycle } = read;
        let entity = read.findPlan(plan);
        if (entity !== undefined) {
          if (proposal !== undefined)
            throw new Error(
              `plan add: plan ${JSON.stringify(plan)} exists, and only its first add proposes it; \`plan revise ${plan} --realizes\` changes its concepts`,
            );
          read.unitWritable(entity, 'add');
        } else if (proposal === undefined || proposal.length === 0)
          throw new Error(
            `plan add: no plan is named ${JSON.stringify(plan)}, and the first add naming a plan proposes it: give --plan-realizes <concept> for each concept it realizes`,
          );
        const concept = realized(read, fields);
        if (concept === undefined)
          throw new Error(
            'plan add: give --realizes <concept>, one of the concepts its plan realizes',
          );
        if (fields.state !== undefined || fields.repin)
          throw new Error(
            'plan add: a unit is pinned as it is added, in its lifecycle’s first state; `plan advance` moves it and `plan revise --repin` re-pins it',
          );
        const pin = read.pin(concept);
        let proposed: readonly [string, planDomain.Plan] | undefined;
        if (entity === undefined) {
          if (fields.deps?.length)
            throw new Error(
              `plan add: plan ${JSON.stringify(plan)} has no unit yet for a dependency to name`,
            );
          const record = planDomain.propose(
            read.store,
            lifecycle.plan,
            {
              name: plan,
              realizes: (proposal ?? []).map((c) => read.resolveConcept(c)),
            },
            by,
          );
          entity = record.envelope.entity;
          proposed = [entity, record.payload as planDomain.Plan];
        }
        const next = {
          plan: entity,
          spec: spec(read, entity, unit, fields),
          pin,
        };
        read.keepRealizes(
          'add',
          [UNWRITTEN, { ...next, state: lifecycle.unit.states[0] as string }],
          proposed,
        );
        unitDomain.add(
          read.store,
          lifecycle.unit,
          next,
          read.planWithdrawn,
          by,
        );
        return { plans: [entity], name: unit };
      }),

    advance: (unit, plan, to, by) =>
      write((read) => {
        const entity = read.resolveUnit(unit, plan);
        const of = read.unitVersion(entity)?.plan as string;
        read.unitWritable(of, 'advance');
        unitDomain.advance(read.store, read.lifecycle.unit, entity, to, by);
        return { plans: [of], name: bare(read.unitName(entity)) };
      }),

    retract: (unit, plan, by) =>
      write((read) => {
        const entity = read.resolveUnit(unit, plan);
        const of = read.unitVersion(entity)?.plan as string;
        read.unitWritable(of, 'retract');
        read.keepRealizes('retract', [entity, null]);
        unitDomain.retract(read.store, entity, read.planWithdrawn, by);
        return {
          plans: [of],
          name: (after: Reading) => after.withdrawnUnitName(entity),
        };
      }),

    revise: (name, plan, fields, by) =>
      write((read) => {
        const { lifecycle } = read;
        if (fields.state !== undefined)
          throw new Error(
            'plan revise: revise never sets a state — `plan bind` and `plan close` move a plan, and `plan advance` moves a unit',
          );
        const found = target(read, 'revise', name, plan);
        if ('plan' in found) {
          planOnly('revise', fields);
          const current = read.plans.get(found.plan)
            ?.payload as planDomain.Plan;
          const next = {
            name: fields.name ?? current?.name ?? '',
            realizes:
              fields.realizes?.map((c) => read.resolveConcept(c)) ??
              current?.realizes ??
              [],
          };
          planDomain.revise(read.store, lifecycle.plan, found.plan, next, by);
          if (current !== undefined)
            read.keepRealizes('revise', undefined, [
              found.plan,
              { ...current, ...next },
            ]);
          return { plans: [found.plan] };
        }
        const f = read.units.get(found.unit) as Fold<unitDomain.Unit>;
        if (f.diverged)
          throw new Error(
            `plan revise: unit ${JSON.stringify(printed(read.unitName(found.unit)))} has diverged; \`plan reconcile\` settles it`,
          );
        const current = f.payload as unitDomain.Unit;
        read.unitWritable(current.plan, 'revise');
        const concept = realized(read, fields) ?? current.pin.concept;
        const pin = pinned(read, 'revise', fields, by, concept, current.pin);
        const next = {
          spec: spec(
            read,
            current.plan,
            fields.name ?? current.spec.name,
            fields,
            current.spec,
          ),
          pin,
        };
        read.keepRealizes('revise', [found.unit, { ...current, ...next }]);
        unitDomain.revise(read.store, found.unit, next, read.planWithdrawn, by);
        return { plans: [current.plan], name: next.spec.name };
      }),

    land: (unit, plan, commit, by) =>
      event('land', unit, plan, { kind: 'land', commit }, by),

    assay: (unit, plan, commit, verdict, missing, by) =>
      event(
        'assay',
        unit,
        plan,
        {
          kind: 'assay',
          commit,
          verdict: verdict as unitDomain.Verdict,
          missing,
        },
        by,
      ),

    whole: (unit, plan, commit, by) =>
      event('whole', unit, plan, { kind: 'whole', commit }, by),

    broke: (unit, plan, check, by) =>
      event('broke', unit, plan, { kind: 'broke', check }, by),

    bind: (plan, by) =>
      write((read) => {
        const entity = read.resolvePlan(plan);
        planDomain.bind(read.store, read.lifecycle.plan, entity, read.owed, by);
        return { plans: [], cut: entity };
      }),

    close: (plan, by) =>
      write((read) => {
        const entity = read.resolvePlan(plan);
        planDomain.close(read.store, read.lifecycle.plan, entity, by);
        return { plans: [entity] };
      }),

    reconcile: (name, plan, fields, by) =>
      write((read) => {
        const { lifecycle } = read;
        const found = target(read, 'reconcile', name, plan);
        if ('plan' in found) {
          planOnly('reconcile', fields);
          const heads = versions(
            read.plans.get(found.plan) as Fold<planDomain.Plan>,
          );
          const settled = {
            name:
              fields.name ??
              agreed(
                'plan',
                heads.map((p) => p.name),
                'name',
              ),
            realizes:
              fields.realizes?.map((c) => read.resolveConcept(c)) ??
              agreed(
                'plan',
                heads.map((p) => p.realizes),
                'realizes',
              ),
            state:
              fields.state ??
              agreed(
                'plan',
                heads.map((p) => p.state),
                'state',
              ),
          };
          read.keepRealizes('reconcile', undefined, [found.plan, settled]);
          planDomain.reconcile(
            read.store,
            lifecycle.plan,
            found.plan,
            settled,
            read.owed,
            by,
          );
          return { plans: [found.plan] };
        }
        const heads = versions(
          read.units.get(found.unit) as Fold<unitDomain.Unit>,
        );
        const of = agreed(
          'plan',
          heads.map((u) => u.plan),
          'plan',
        );
        read.unitWritable(of, 'reconcile');
        const pick = <K extends keyof unitDomain.Spec>(key: K) =>
          agreed(
            'plan',
            heads.map((u) => u.spec[key]),
            key,
          );
        const pins = [
          ...new Map(heads.map((u) => [JSON.stringify(u.pin), u.pin])).values(),
        ];
        const concept =
          realized(read, fields) ??
          agreed(
            'plan',
            heads.map((u) => u.pin.concept),
            'realizes',
          );
        const unitName = fields.name ?? pick('name');
        const next = {
          spec: {
            name: unitName,
            intent: fields.intent ?? pick('intent'),
            static: fields.static ?? pick('static'),
            deps:
              fields.deps?.map((d) => read.resolveDep(d, of)) ?? pick('deps'),
            outputs: fields.outputs ?? pick('outputs'),
            accept: fields.accept ?? pick('accept'),
          },
          state:
            fields.state ??
            agreed(
              'plan',
              heads.map((u) => u.state),
              'state',
            ),
          pin: pinned(
            read,
            'reconcile',
            fields,
            by,
            concept,
            pins.length === 1 ? pins[0] : undefined,
          ),
        };
        read.keepRealizes('reconcile', [found.unit, { plan: of, ...next }]);
        unitDomain.reconcile(
          read.store,
          lifecycle.unit,
          found.unit,
          next,
          read.planWithdrawn,
          by,
        );
        return { plans: [of], name: unitName };
      }),
  };
}

/** The flags a unit write takes for its fields, each taking a value: the
 *  concept it realizes, and what a plan does not have. */
const UNIT_FIELDS = Object.fromEntries(
  ['realizes', ...UNIT_ONLY].map((field) => [field, 'value']),
) as { readonly [F in 'realizes' | (typeof UNIT_ONLY)[number]]: 'value' };

/** The plan's verbs, in the order its header lists them, and the flags each
 *  takes; `--repin` alone takes no value. */
export const VERBS = {
  show: { plan: 'value' },
  add: {
    plan: 'value',
    'plan-realizes': 'value',
    ...UNIT_FIELDS,
    ...INVOCATION,
  },
  advance: { plan: 'value', to: 'value', ...INVOCATION },
  retract: { plan: 'value', ...INVOCATION },
  revise: {
    plan: 'value',
    name: 'value',
    ...UNIT_FIELDS,
    repin: 'switch',
    ...INVOCATION,
  },
  bind: { ...INVOCATION },
  close: { ...INVOCATION },
  reconcile: {
    plan: 'value',
    name: 'value',
    ...UNIT_FIELDS,
    state: 'value',
    repin: 'switch',
    ...INVOCATION,
  },
  land: { plan: 'value', commit: 'value', ...INVOCATION },
  assay: {
    plan: 'value',
    commit: 'value',
    verdict: 'value',
    missing: 'value',
    ...INVOCATION,
  },
  whole: { plan: 'value', commit: 'value', ...INVOCATION },
  broke: { plan: 'value', check: 'value', ...INVOCATION },
} as const satisfies VerbFlags;

/** The value of the flag `verb` needs, refusing its absence and saying what it
 *  holds. */
function required(
  args: Argv,
  verb: string,
  flag: string,
  what: string,
): string {
  const value = one(args, flag);
  if (value === undefined)
    throw new Error(`plan ${verb}: give --${flag} <${what}>`);
  return value;
}

/** A plan or unit write's fields, as its flags give them. */
function fieldsOf(args: Argv): Fields {
  const fields: { -readonly [K in keyof Fields]: Fields[K] } = {};
  const name = one(args, 'name');
  if (name !== undefined) fields.name = name;
  const state = one(args, 'state');
  if (state !== undefined) fields.state = state;
  const intent = one(args, 'intent');
  if (intent !== undefined) fields.intent = intent;
  for (const key of [
    'realizes',
    'static',
    'deps',
    'outputs',
    'accept',
  ] as const) {
    const values = many(args, key);
    if (values !== undefined) fields[key] = values;
  }
  if (args.flags.has('repin')) fields.repin = true;
  return fields;
}

/** Route `plan <verb> [args]` to the plan capability over the repository
 *  holding `from`; returns the view the verb renders. */
export function dispatchPlan(
  argv: readonly string[],
  opts: { readonly from?: string } = {},
): string {
  const verb = verbOf(argv, 'plan', VERBS);
  const args = readArgv(argv.slice(1), 'plan', verb, VERBS[verb]);
  const host = planHost(opts.from);
  const plan = one(args, 'plan');
  const by = () => invocation(args, 'plan', verb);
  switch (verb) {
    case 'show':
      return host.show(args.positionals[0], plan);
    case 'add':
      if (plan === undefined)
        throw new Error(
          'plan add: give --plan <plan>, the plan the unit joins',
        );
      return host.add(
        subject(args, 'plan', verb, 'unit'),
        plan,
        fieldsOf(args),
        many(args, 'plan-realizes'),
        by(),
      );
    case 'advance': {
      const to = one(args, 'to');
      if (to === undefined)
        throw new Error(
          'plan advance: give --to <state>, the one step forward',
        );
      return host.advance(subject(args, 'plan', verb, 'unit'), plan, to, by());
    }
    case 'retract':
      return host.retract(subject(args, 'plan', verb, 'unit'), plan, by());
    case 'revise':
      return host.revise(
        subject(args, 'plan', verb, 'unit or plan'),
        plan,
        fieldsOf(args),
        by(),
      );
    case 'bind':
      return host.bind(subject(args, 'plan', verb, 'plan'), by());
    case 'close':
      return host.close(subject(args, 'plan', verb, 'plan'), by());
    case 'reconcile':
      return host.reconcile(
        subject(args, 'plan', verb, 'unit or plan'),
        plan,
        fieldsOf(args),
        by(),
      );
    case 'land':
      return host.land(
        subject(args, 'plan', verb, 'unit'),
        plan,
        required(args, verb, 'commit', 'the commit that holds its work'),
        by(),
      );
    case 'assay': {
      const verdict = required(
        args,
        verb,
        'verdict',
        `${unitDomain.VERDICTS.join(' or ')}`,
      );
      return host.assay(
        subject(args, 'plan', verb, 'unit'),
        plan,
        required(args, verb, 'commit', 'the commit assayed'),
        verdict,
        many(args, 'missing') ?? [],
        by(),
      );
    }
    case 'whole':
      return host.whole(
        subject(args, 'plan', verb, 'unit'),
        plan,
        required(args, verb, 'commit', 'the line’s commit holding the unit'),
        by(),
      );
    case 'broke':
      return host.broke(
        subject(args, 'plan', verb, 'unit'),
        plan,
        required(args, verb, 'check', 'the failing check'),
        by(),
      );
  }
}
