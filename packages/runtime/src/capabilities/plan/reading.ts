// ─────────────────────────────────────────────────────────────────────────────
// THE READING — every domain the three domain capabilities compose, folded once
// per invocation, and the one way a verb reads or writes through them.
//
// THE COMPOSITION. A domain module knows its own records and laws and nothing
// else; what it needs from another domain it takes as a parameter. `Reading`
// supplies each: it folds the design, plan, unit and notebook records, wires the
// design's closure into the pin's port, feeds `unit` its plan's liveness, the
// plans that are closed and the owed rulings the notebook recognises, and maps
// every fold onto the view's shapes. It also holds the laws that span domains:
// a unit realizes one of its plan's concepts, and a closed plan's units are
// never written again.
//
// NAMES, NEVER IDENTITIES. Every input names an entity by name, and `Reading`
// resolves it through the record store's `names.ts`, the one home deciding
// which holder a name addresses. A refusal a domain module words with an
// entity's identity is spoken back by the entity's name, in the one printed
// form an input addresses it by.
//
// A WRITE WRITES ALL OR NOTHING. `act` stages every write a verb makes, reads
// the result back and renders its view, and only then puts the writes on disk;
// a refusal anywhere — a law, a later write, the view — leaves nothing written.
//
// THE LIFECYCLE is configuration: `configuration.plan` in the host runtime
// config, which the `plan` skill declares and deploy emits. The plan capability
// refuses without it and names the deploy; the design shows the lattice without
// the plans standing on it and says why.
// ─────────────────────────────────────────────────────────────────────────────

import { execFileSync } from 'node:child_process';
import { type Fold, fold } from '../../record-store/fold.js';
import {
  IDENTITY,
  type Name,
  addressed,
  bare,
  parsed,
  printed,
} from '../../record-store/names.js';
import type { Record } from '../../record-store/record.js';
import { introduced } from '../../record-store/repair.js';
import {
  RecordStore,
  StagedStore,
  StoreFault,
} from '../../record-store/store.js';
import { loadRuntimeConfig } from '../../runtime-config.js';
import type { DesignState, ShownConcept } from '../../view/design.js';
import type {
  Diverged,
  Holder,
  Incoherence,
  Written,
} from '../../view/layers.js';
import type { NotebookState, Note as ShownNote } from '../../view/notebook.js';
import type {
  DivergedUnit,
  LiveUnit,
  PlanState,
  Plan as ShownPlan,
  Unit as ShownUnit,
} from '../../view/plan.js';
import {
  type Payload as ConceptPayload,
  DOMAIN as DESIGN,
  Design,
  type Lattice,
} from '../design/design.js';
import {
  NOTEBOOK,
  type Note,
  type Notebook,
  notebook,
  owedRulings,
} from '../note/notebook.js';
import { type Pin, drift, suspicion, take } from './pin.js';
import * as planDomain from './plan.js';
import * as unitDomain from './unit.js';

// ── The lifecycle ───────────────────────────────────────────────────────────────

/** The plan and unit lifecycles, as the host received them. */
export interface Lifecycles {
  readonly plan: planDomain.PlanLifecycle;
  readonly unit: unitDomain.UnitLifecycle;
}

/** The lifecycles `configuration.plan` gives, or why it gives none. */
function configured(): Lifecycles | string {
  const block = loadRuntimeConfig()?.configuration?.plan;
  if (block === undefined) return 'absent';
  const { plan, unit } = (block ?? {}) as {
    plan?: { states?: unknown; exclusive?: unknown; final?: unknown };
    unit?: { states?: unknown; satisfies?: unknown };
  };
  const states = (value: unknown): string[] | undefined =>
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((s) => typeof s === 'string') &&
    new Set(value).size === value.length
      ? (value as string[])
      : undefined;
  const planStates = states(plan?.states);
  const unitStates = states(unit?.states);
  const { exclusive, final } = plan ?? {};
  const satisfies = unit?.satisfies;
  if (
    planStates === undefined ||
    typeof exclusive !== 'string' ||
    typeof final !== 'string' ||
    !planStates.includes(exclusive) ||
    !planStates.includes(final)
  )
    return 'malformed: `plan` must give distinct `states`, and an `exclusive` and a `final` state among them';
  if (
    unitStates === undefined ||
    typeof satisfies !== 'string' ||
    !unitStates.includes(satisfies)
  )
    return 'malformed: `unit` must give distinct `states`, and a `satisfies` state among them';
  return {
    plan: { states: planStates, exclusive, final },
    unit: { states: unitStates, satisfies },
  };
}

/** Where the lifecycle comes from, for a message saying it did not. */
const DEPLOY =
  'the `plan` skill declares the lifecycle states and `cratylus deploy` emits them into the host runtime config ($AGENT_RUNTIME_CONFIG, else ~/.cratylus.json) as `configuration.plan`';

/** The plan and unit lifecycles, read from `configuration.plan` in the host
 *  runtime config; refuses, naming the deploy, when it is absent or malformed. */
export function lifecycles(): Lifecycles {
  const found = configured();
  if (typeof found === 'string')
    throw new Error(
      `plan: this host's plan lifecycle is ${found} — ${DEPLOY}. Run a deploy; the runtime carries no lifecycle of its own.`,
    );
  return found;
}

// ── Helpers over folds ──────────────────────────────────────────────────────────

/** Each distinct version-head payload of `f`, in the fold's order. */
export function versions<P>(f: Fold<P>): P[] {
  return distinct(
    f.heads.flatMap((h) => (h.payload === null ? [] : [h.payload])),
  );
}

/** Each distinct version the retraction heads of `f` withdrew. */
function withdrew<P>(f: Fold<P>, byId: ReadonlyMap<string, Record<P>>): P[] {
  const found: P[] = [];
  const visit = (record: Record<P>): void => {
    if (record.payload !== null) found.push(record.payload);
    else
      for (const id of record.envelope.supersedes) {
        const named = byId.get(id);
        if (named) visit(named);
      }
  };
  for (const head of f.heads) if (head.payload === null) visit(head);
  return distinct(found);
}

function distinct<T>(items: readonly T[]): T[] {
  return [...new Map(items.map((i) => [JSON.stringify(i), i])).values()];
}

/** How an entity holds a name, for the view's holder list. */
function holding<P>(f: Fold<P> | undefined): Holder['as'] {
  return f?.diverged ? 'diverged' : f?.withdrawn ? 'withdrawn' : 'live';
}

function byId<P>(records: readonly Record<P>[]): Map<string, Record<P>> {
  return new Map(records.map((r) => [r.envelope.id, r]));
}

function unitKey(plan: string, name: string): string {
  return JSON.stringify([plan, name]);
}

/** The one value every version in `values` agrees on, or the refusal naming the
 *  flag that must settle it. */
export function agreed<T>(
  capability: string,
  values: readonly T[],
  flag: string,
): T {
  const [first, ...rest] = distinct(values);
  if (first === undefined || rest.length > 0)
    throw new Error(
      `${capability} reconcile: its versions disagree on ${flag}; give --${flag}`,
    );
  return first;
}

/** A unit realizing a concept its plan does not: the law `unit` and `plan`
 *  hold together, as the repair rule compares it. */
interface Unrealized {
  readonly kind: 'realizes';
  readonly entities: readonly [unit: string, plan: string];
  readonly concept: string;
}

/** What qualifies a unit by its plan where no plan is in view: `u of plan p`. */
const OF_PLAN = ' of plan ';

/** Stands for a unit not yet minted while its write is judged. */
export const UNWRITTEN = '(new)';

// ── The reading ─────────────────────────────────────────────────────────────────

/** Every domain's records folded once, from `store` (the records of the
 *  repository holding `from`), with the names and view shapes the three
 *  capabilities share. */
export class Reading {
  readonly from: string;
  readonly store: RecordStore;
  readonly design: Design;
  readonly concepts: ReadonlyMap<string, Fold<ConceptPayload>>;
  readonly plans: ReadonlyMap<string, Fold<planDomain.Plan>>;
  readonly units: ReadonlyMap<string, Fold<unitDomain.Unit>>;
  readonly notes: ReadonlyMap<string, Fold<Note>>;
  readonly book: Notebook;
  readonly #conceptRecords: ReadonlyMap<string, Record<ConceptPayload>>;
  readonly #unitRecords: ReadonlyMap<string, Record<unitDomain.Unit>>;
  readonly #noteRecords: ReadonlyMap<string, Record<Note>>;
  /** Each plan name with the plans holding it. */
  readonly #planHolders = new Map<string, string[]>();
  /** Each `[plan, unit name]` with the units of that plan holding it. */
  readonly #unitHolders = new Map<string, string[]>();
  /** Each note title with the notes holding it. */
  readonly #noteHolders = new Map<string, string[]>();
  readonly #conceptNames = new Map<string, Name>();
  readonly #closures = new Map<string, string[]>();
  #shared: ReadonlySet<string> | undefined;
  #lattice: Lattice | undefined;
  #lifecycle: Lifecycles | string | undefined;
  #live: LiveUnit[] | undefined;

  constructor(from: string, store: RecordStore = new RecordStore(from)) {
    this.from = from;
    this.store = store;
    this.design = new Design(store);
    const concepts = store.read<ConceptPayload>(DESIGN);
    this.concepts = fold(concepts);
    this.#conceptRecords = byId(concepts);
    this.plans = planDomain.plans(store);
    const units = store.read<unitDomain.Unit>(unitDomain.DOMAIN);
    this.units = fold(units);
    this.#unitRecords = byId(units);
    const notes = store.read<Note>(NOTEBOOK);
    this.notes = fold(notes);
    this.#noteRecords = byId(notes);
    this.book = notebook(store);

    const hold = (
      map: Map<string, string[]>,
      key: string,
      entity: string,
    ): void => {
      const holders = map.get(key) ?? [];
      if (!holders.includes(entity)) map.set(key, [...holders, entity]);
    };
    for (const f of this.plans.values())
      for (const p of versions(f)) hold(this.#planHolders, p.name, f.entity);
    for (const f of this.units.values())
      for (const u of versions(f))
        hold(this.#unitHolders, unitKey(u.plan, u.spec.name), f.entity);
    for (const f of this.notes.values())
      for (const n of versions(f)) hold(this.#noteHolders, n.title, f.entity);
  }

  /** The lifecycles; refuses, naming the deploy, when the host has none. */
  get lifecycle(): Lifecycles {
    this.#lifecycle ??= configured();
    if (typeof this.#lifecycle === 'string') return lifecycles();
    return this.#lifecycle;
  }

  /** Why the host has no lifecycle, `undefined` when it has one. */
  get unconfigured(): string | undefined {
    this.#lifecycle ??= configured();
    return typeof this.#lifecycle === 'string' ? this.#lifecycle : undefined;
  }

  #git(...args: string[]): string {
    return execFileSync('git', args, {
      cwd: this.from,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  }

  /** Where the reading was computed: the commit, and whether writes not yet
   *  committed are in it — on disk and uncommitted, or held by this act. */
  get computed(): { readonly commit: string; readonly uncommitted: boolean } {
    let commit: string;
    try {
      commit = this.#git('rev-parse', '--short', 'HEAD');
    } catch {
      commit = `${this.#git('symbolic-ref', '--short', 'HEAD')} (no commit yet)`;
    }
    const held = this.store instanceof StagedStore && this.store.holding;
    const onDisk =
      this.#git(
        'status',
        '--porcelain',
        '--untracked-files=all',
        '--',
        this.store.root,
      ) !== '';
    return { commit, uncommitted: held || onDisk };
  }

  get lattice(): Lattice {
    this.#lattice ??= this.design.lattice();
    return this.#lattice;
  }

  // ── naming ──

  /** The concept entity `entity` as the view names it. */
  concept(entity: string): Name {
    let name = this.#conceptNames.get(entity);
    if (name === undefined) {
      name = this.design.name(entity);
      this.#conceptNames.set(entity, name);
    }
    return name;
  }

  /** `anchor`, as `entity` carries it: with its identity when shared. */
  anchor(anchor: string, entity: string): Name {
    this.#shared ??= new Set(
      this.lattice.incoherence.flatMap((i) =>
        i.kind === 'anchor' ? [i.anchor] : [],
      ),
    );
    return this.#shared.has(anchor)
      ? { name: anchor, identity: entity }
      : anchor;
  }

  #label(holders: readonly string[] | undefined, name: string, entity: string) {
    return (holders?.length ?? 0) > 1 ? { name, identity: entity } : name;
  }

  /** The plan entity `entity` as the view names it. */
  planName(entity: string): Name {
    const name = versions(this.plans.get(entity) as Fold<planDomain.Plan>)[0]
      ?.name as string;
    return this.#label(this.#planHolders.get(name), name, entity);
  }

  /** The last version of unit `entity`: its payload, the first version head of
   *  a diverged one, or the version a withdrawn one's retraction withdrew. */
  unitVersion(entity: string): unitDomain.Unit | undefined {
    const f = this.units.get(entity);
    if (!f) return undefined;
    return versions(f)[0] ?? withdrew(f, this.#unitRecords)[0];
  }

  /** `name` as unit `entity` of plan `plan` carries it. */
  #unitLabel(plan: string, name: string, entity: string): Name {
    return this.#label(
      this.#unitHolders.get(unitKey(plan, name)),
      name,
      entity,
    );
  }

  /** The unit entity `entity` as the view names it. */
  unitName(entity: string): Name {
    const u = this.unitVersion(entity);
    return u === undefined
      ? 'the new unit'
      : this.#unitLabel(u.plan, u.spec.name, entity);
  }

  #noteName(entity: string): Name {
    const f = this.notes.get(entity) as Fold<Note>;
    const title =
      (versions(f)[0] ?? withdrew(f, this.#noteRecords)[0])?.title ?? '';
    return this.#label(this.#noteHolders.get(title), title, entity);
  }

  /** What a note blocks, a plan or a unit, as the view names it: a unit
   *  qualified by its plan, `u of plan p`, the form `resolveBlocked` takes. */
  blocked(ref: string): Name {
    if (this.plans.has(ref)) return this.planName(ref);
    const plan = this.unitVersion(ref)?.plan;
    return plan === undefined
      ? this.unitName(ref)
      : `${printed(this.unitName(ref))}${OF_PLAN}${printed(this.planName(plan))}`;
  }

  /** `message` with every identity it quotes bare spoken by its entity's name,
   *  in the printed form; an identity already beside its name stays. */
  speak(message: string): string {
    const bareIdentity = new RegExp(`(?<!\\(identity )${IDENTITY.source}`, 'g');
    return message.replace(bareIdentity, (id) => {
      const name = this.concepts.has(id)
        ? this.concept(id)
        : this.plans.has(id)
          ? this.planName(id)
          : this.units.has(id)
            ? this.unitName(id)
            : this.notes.has(id)
              ? this.#noteName(id)
              : undefined;
      return name === undefined ? id : printed(name);
    });
  }

  // ── resolving ──

  /** The concept `input` names; refuses a name no concept holds. */
  resolveConcept(input: string): string {
    return this.design.resolve(parsed(input));
  }

  /** The plan `input` names, `undefined` when no plan holds it. */
  findPlan(input: string): string | undefined {
    const name = parsed(input);
    return addressed('plan', name, this.#planHolders.get(bare(name)) ?? []);
  }

  /** The plan `input` names; refuses a name no plan holds. */
  resolvePlan(input: string): string {
    const entity = this.findPlan(input);
    if (entity === undefined)
      throw new Error(
        `no plan is named ${JSON.stringify(input)}; the first \`plan add\` naming it proposes it`,
      );
    return entity;
  }

  /** The units holding `name`'s bare name, in `plan` when given, else in
   *  every plan. */
  #unitsHolding(name: Name, plan?: string): string[] {
    return [...this.#unitHolders]
      .filter(([key]) => {
        const [of, held] = JSON.parse(key) as [string, string];
        return held === bare(name) && (plan === undefined || of === plan);
      })
      .flatMap(([, entities]) => entities);
  }

  /** The unit `input` names, looked up in the plan `plan` names when given;
   *  `undefined` when no unit holds it. A name held by units of several plans
   *  refuses, asking for the plan. */
  findUnit(input: string, plan?: string): string | undefined {
    const at = input.indexOf(OF_PLAN);
    if (plan === undefined && at !== -1) {
      const of = input.slice(at + OF_PLAN.length);
      if (this.findPlan(of) !== undefined)
        return this.findUnit(input.slice(0, at), of);
    }
    const name = parsed(input);
    const scope = plan === undefined ? undefined : this.resolvePlan(plan);
    const holders = this.#unitsHolding(name, scope);
    const of = [
      ...new Set(holders.map((e) => this.unitVersion(e)?.plan as string)),
    ];
    if (of.length > 1)
      throw new Error(
        `unit ${JSON.stringify(input)} is in plans ${of.map((p) => printed(this.planName(p))).join(', ')}; name it with its plan, as ${of.map((p) => JSON.stringify(`${input}${OF_PLAN}${printed(this.planName(p))}`)).join(' or ')}`,
      );
    return addressed('unit', name, holders);
  }

  /** The unit `input` names; refuses a name no unit holds. */
  resolveUnit(input: string, plan?: string): string {
    const entity = this.findUnit(input, plan);
    if (entity === undefined)
      throw new Error(
        `no unit is named ${JSON.stringify(input)}${plan === undefined ? '' : ` in plan ${JSON.stringify(plan)}`}; \`plan add\` adds one`,
      );
    return entity;
  }

  /** The dependency `input` names: a unit of `plan`. A unit of another plan
   *  refuses, since a dependency names a unit of its own plan. */
  resolveDep(input: string, plan: string): string {
    const name = parsed(input);
    const entity = addressed('unit', name, this.#unitsHolding(name, plan));
    if (entity !== undefined) return entity;
    const elsewhere = this.#unitsHolding(name);
    throw new Error(
      elsewhere.length > 0
        ? `dependency ${JSON.stringify(input)} is a unit of plan ${elsewhere.map((e) => printed(this.planName(this.unitVersion(e)?.plan as string))).join(', ')}, and a dependency names a unit of its own plan`
        : `dependency ${JSON.stringify(input)} names no unit of plan ${printed(this.planName(plan))}`,
    );
  }

  /** The note `input` titles, `undefined` when no note holds the title. */
  findNote(input: string): string | undefined {
    const name = parsed(input);
    return addressed('note', name, this.#noteHolders.get(bare(name)) ?? []);
  }

  /** What a note blocks: the plan `input` names, or the unit — written
   *  `u of plan p` as `blocked` prints it, or bare where its name is its own. */
  resolveBlocked(input: string): string {
    const name = parsed(input);
    const plans = this.#planHolders.get(bare(name)) ?? [];
    if (plans.length > 0 && this.#unitsHolding(name).length > 0)
      throw new Error(
        `${JSON.stringify(input)} names a plan and a unit; write the unit as ${JSON.stringify(`${input}${OF_PLAN}<plan>`)}`,
      );
    const entity =
      plans.length > 0 ? addressed('plan', name, plans) : this.findUnit(input);
    if (entity === undefined)
      throw new Error(
        `no plan or unit is named ${JSON.stringify(input)}; a note blocks a plan or a unit`,
      );
    return entity;
  }

  // ── the ports, and the laws spanning domains ──

  /** The pin's port: the closure of concept `entity`, over entities. */
  closure = (entity: string): string[] => {
    let found = this.#closures.get(entity);
    if (found === undefined) {
      found = this.design
        .closure(this.design.name(entity))
        .map((n) => this.design.denotes(n) as string);
      this.#closures.set(entity, found);
    }
    return found;
  };

  /** Whether plan `entity` is withdrawn, as `unit` takes it. */
  planWithdrawn = (entity: string): boolean =>
    this.plans.get(entity)?.withdrawn ?? false;

  /** Whether plan `entity` is closed: some version of it is in the final
   *  state, which it never leaves, so its units are never written again. */
  planClosed = (entity: string): boolean => {
    const f = this.plans.get(entity);
    const { final } = this.lifecycle.plan;
    return f !== undefined && versions(f).some((p) => p.state === final);
  };

  /** The entities the owed rulings name. */
  get owed(): ReadonlySet<string> {
    return new Set(owedRulings(this.book).keys());
  }

  /** A pin on concept `entity`, refusing a closure that is not settled and
   *  live. */
  pin(entity: string): Pin {
    return take(this.concepts, entity, this.closure);
  }

  /** Refuses a write to a unit of plan `plan` when that plan is closed or
   *  withdrawn, or, for `add`, diverged. */
  unitWritable(plan: string, verb: string): void {
    const f = this.plans.get(plan);
    const name = JSON.stringify(printed(this.planName(plan)));
    if (!f || f.withdrawn)
      throw new Error(`plan ${verb}: plan ${name} is withdrawn`);
    if (this.planClosed(plan))
      throw new Error(
        `plan ${verb}: plan ${name} is ${this.lifecycle.plan.final}, which is final, and its units are never written again`,
      );
    if (verb === 'add' && f.diverged)
      throw new Error(
        `plan add: plan ${name} has diverged; \`plan reconcile ${printed(this.planName(plan))}\` settles it first`,
      );
  }

  /** Every unit realizing a concept its plan does not, with `unit` written as
   *  the one version of that unit (`null`: withdrawn) and `plan` as the one
   *  version of that plan. Every version of a diverged unit or plan is read. */
  unrealized(
    unit?: readonly [string, unitDomain.Unit | null],
    plan?: readonly [string, planDomain.Plan],
  ): Unrealized[] {
    const unitVersions = new Map(
      [...this.units.values()].map((f) => [f.entity, versions(f)]),
    );
    if (unit) unitVersions.set(unit[0], unit[1] === null ? [] : [unit[1]]);
    const planVersions = (entity: string): planDomain.Plan[] =>
      plan && plan[0] === entity
        ? [plan[1]]
        : (() => {
            const f = this.plans.get(entity);
            return f ? versions(f) : [];
          })();
    const found: Unrealized[] = [];
    for (const [entity, vs] of unitVersions)
      for (const concept of new Set(
        vs.flatMap((u) =>
          planVersions(u.plan).some((p) => !p.realizes.includes(u.pin.concept))
            ? [JSON.stringify([u.plan, u.pin.concept])]
            : [],
        ),
      )) {
        const [of, realized] = JSON.parse(concept) as [string, string];
        found.push({
          kind: 'realizes',
          entities: [entity, of],
          concept: realized,
        });
      }
    return found;
  }

  /** Refuses a write that introduces a unit realizing a concept its plan does
   *  not: `unit` and `plan` are what the write leaves, as for `unrealized`. */
  keepRealizes(
    verb: string,
    unit?: readonly [string, unitDomain.Unit | null],
    plan?: readonly [string, planDomain.Plan],
  ): void {
    const [found] = introduced(this.unrealized(), this.unrealized(unit, plan));
    if (!found) return;
    const [who, of] = found.entities;
    const unitName =
      who === UNWRITTEN
        ? 'the new unit'
        : JSON.stringify(printed(this.unitName(who)));
    const planName = JSON.stringify(
      printed(plan && plan[0] === of ? plan[1].name : this.planName(of)),
    );
    throw new Error(
      `plan ${verb} refused — ${unitName} would realize ${JSON.stringify(printed(this.concept(found.concept)))}, which its plan ${planName} ${plan ? 'would not realize' : 'does not realize'}; a unit realizes one of its plan's concepts`,
    );
  }

  // ── view shapes ──

  shownConcept(payload: ConceptPayload, entity: string): ShownConcept {
    return {
      anchor: this.anchor(payload.anchor, entity),
      gloss: payload.gloss,
      factors: payload.factors.map((f) => this.concept(f)),
    };
  }

  /** One version of plan `entity` as the view shows it. */
  shownPlan(plan: planDomain.Plan, entity: string): ShownPlan {
    return {
      name: this.#label(this.#planHolders.get(plan.name), plan.name, entity),
      realizes: plan.realizes.map((c) => this.concept(c)),
      state: plan.state,
      diverged: false,
    };
  }

  /** The plan `entity` as the view names it wherever it is referenced: its one
   *  version, or, diverged, marked so and carrying no version's state or
   *  concepts. */
  planOf(entity: string): ShownPlan {
    const f = this.plans.get(entity) as Fold<planDomain.Plan>;
    const shown = this.shownPlan(versions(f)[0] as planDomain.Plan, entity);
    return f.diverged
      ? {
          name: this.planName(entity),
          realizes: [],
          state: '',
          diverged: true,
        }
      : shown;
  }

  shownUnit(unit: unitDomain.Unit, entity: string): ShownUnit {
    return {
      name: this.#unitLabel(unit.plan, unit.spec.name, entity),
      plan: this.planOf(unit.plan),
      realizes: this.concept(unit.pin.concept),
      state: unit.state,
      deps: unit.spec.deps.map((d) => this.unitName(d)),
      intent: unit.spec.intent,
      static: unit.spec.static,
      outputs: unit.spec.outputs,
      accept: unit.spec.accept,
    };
  }

  shownNote(note: Note, entity: string): ShownNote {
    return {
      title: this.#label(this.#noteHolders.get(note.title), note.title, entity),
      kind: note.kind,
      topic: note.topic,
      body: note.body,
      blocks: note.blocks.map((b) => this.blocked(b)),
    };
  }

  /** Each unit's wave: live and diverged units placed. */
  get #waves(): ReadonlyMap<string, number> {
    return new Map(
      unitDomain.waves(this.units).flatMap((w, i) => w.map((e) => [e, i])),
    );
  }

  /** How a pin moved, in words: what drifted it, and what beneath it moved. */
  #moved(pin: Pin): { drift: string | undefined; suspicion: string[] } {
    const how = drift(pin, this.concepts);
    return {
      drift:
        how === undefined
          ? undefined
          : `${printed(this.concept(pin.concept))} ${how}`,
      suspicion: suspicion(pin, this.concepts, this.closure).map(
        ({ entity, how }) =>
          `${printed(this.concept(entity))} ${how === 'joined' ? 'joined its closure' : how}`,
      ),
    };
  }

  /** Every live unit with what `unit` and `pin` compute on it, in wave order.
   *  Refuses, naming the deploy, when the host has no lifecycle. */
  get live(): readonly LiveUnit[] {
    if (this.#live !== undefined) return this.#live;
    const wave = this.#waves;
    const frontier = new Set(
      unitDomain.frontier(
        this.units,
        this.lifecycle.unit,
        this.owed,
        this.planClosed,
      ),
    );
    this.#live = [...this.units.values()]
      .filter((f) => f.payload)
      .map((f) => {
        const unit = f.payload as unitDomain.Unit;
        return {
          ...this.shownUnit(unit, f.entity),
          wave: wave.get(f.entity),
          frontier: frontier.has(f.entity),
          ...this.#moved(unit.pin),
          frozen: this.planClosed(unit.plan),
        };
      })
      .sort(
        (a, b) =>
          (a.wave ?? Number.POSITIVE_INFINITY) -
            (b.wave ?? Number.POSITIVE_INFINITY) ||
          printed(a.name).localeCompare(printed(b.name)),
      );
    return this.#live;
  }

  /** Every diverged entity of `folds`, as the view lists it. */
  #diverged<P, T>(
    folds: ReadonlyMap<string, Fold<P>>,
    records: ReadonlyMap<string, Record<P>>,
    name: (version: P, entity: string) => Name,
    shown: (version: P, entity: string) => T,
  ): (Diverged<T> & { readonly entity: string })[] {
    return [...folds.values()]
      .filter((f) => f.diverged)
      .map((f) => {
        const written = (version: P, head: Record<P>): Written<T> => ({
          value: shown(version, f.entity),
          by: head.envelope.author,
          at: head.envelope.time,
        });
        const seen = new Set<string>();
        const heads: Written<T>[] = [];
        const retracted: Written<T>[] = [];
        const named: P[] = [];
        for (const head of f.heads) {
          if (head.payload === null) {
            for (const version of withdrew({ ...f, heads: [head] }, records)) {
              named.push(version);
              retracted.push(written(version, head));
            }
            continue;
          }
          const key = JSON.stringify(head.payload);
          if (seen.has(key)) continue;
          seen.add(key);
          named.push(head.payload);
          heads.push(written(head.payload, head));
        }
        return {
          entity: f.entity,
          names: distinct(named.map((v) => name(v, f.entity))),
          versions: heads,
          retracted,
        };
      });
  }

  /** The design's view input; `plans` joins the plans standing on each
   *  concept, which a trace leaves out. Without a lifecycle the design is
   *  still shown, and says why the plans standing on it are not. */
  designState(plans: boolean): DesignState {
    const folds = [...this.concepts.values()];
    const records = this.#conceptRecords;
    const why = plans ? this.unconfigured : undefined;
    return {
      ...this.computed,
      concepts: folds.flatMap((f) =>
        f.payload ? [this.shownConcept(f.payload, f.entity)] : [],
      ),
      units: plans && why === undefined ? this.live : [],
      divergedUnits:
        plans && why === undefined ? this.#divergedUnits(() => true) : [],
      ...(why === undefined
        ? {}
        : {
            plansUnshown: `unavailable until \`cratylus deploy\` gives this host the plan lifecycle (it is ${why.split(':')[0]})`,
          }),
      diverged: this.#diverged(
        this.concepts,
        records,
        (v, e) => this.anchor(v.anchor, e),
        (v, e) => this.shownConcept(v, e),
      ),
      withdrawn: folds
        .filter((f) => f.withdrawn)
        .flatMap((f) =>
          withdrew(f, records)
            .slice(0, 1)
            .map((v) => this.shownConcept(v, f.entity)),
        ),
      incoherent: this.lattice.incoherence.map((i): Incoherence => {
        switch (i.kind) {
          case 'retracted':
            return {
              kind: 'retracted',
              name: i.concept,
              reference: i.factor,
              relation: 'factor',
            };
          case 'cycle':
            return { kind: 'cycle', names: i.concepts };
          case 'anchor':
            return {
              kind: 'name',
              name: i.anchor,
              holders: i.identities.map((identity) => ({
                identity,
                as: holding(this.concepts.get(identity)),
              })),
            };
        }
      }),
    };
  }

  /** The diverged units of the plans `own` admits, each with the wave it
   *  holds its place in and whether its plan is closed. */
  #divergedUnits(own: (plan: string | undefined) => boolean): DivergedUnit[] {
    const planOfUnit = (unit: string) => this.unitVersion(unit)?.plan;
    return this.#diverged(
      new Map([...this.units].filter(([entity]) => own(planOfUnit(entity)))),
      this.#unitRecords,
      (u, e) => this.#unitLabel(u.plan, u.spec.name, e),
      (u, e) => this.shownUnit(u, e),
    ).map(
      (d): DivergedUnit => ({
        ...d,
        wave: this.#waves.get(d.entity),
        frozen: this.planClosed(planOfUnit(d.entity) as string),
      }),
    );
  }

  /**
   * The plan view's input, showing the plans `shown`. What must be resolved
   * first is its own plans' — every one's when no plan is shown — and only
   * what can still be resolved: a closed plan's frozen units are shown in
   * place and never asked of.
   */
  planState(shown: readonly string[]): PlanState {
    const { exclusive } = this.lifecycle.plan;
    const bound = planDomain.holders(this.plans, this.lifecycle.plan);
    const own = (plan: string | undefined): boolean =>
      plan !== undefined && (shown.length === 0 || shown.includes(plan));
    const planOfUnit = (unit: string) => this.unitVersion(unit)?.plan;
    /** Some unit among `units` is of a plan shown, and not all are frozen. */
    const askable = (units: readonly string[]): boolean =>
      units.some((u) => own(planOfUnit(u))) &&
      !units.every((u) => {
        const plan = planOfUnit(u);
        return plan !== undefined && this.planClosed(plan);
      });
    const blocksOwn = (note: Note): boolean =>
      note.blocks.some((b) => own(this.plans.has(b) ? b : planOfUnit(b)));
    const shownNames = new Set(shown.map((p) => printed(this.planOf(p).name)));
    return {
      ...this.computed,
      plans: shown.map((p) => this.planOf(p)),
      units: this.live.filter((u) => shownNames.has(printed(u.plan.name))),
      owed: [
        ...this.book.live.filter((n) => n.blocks.length > 0 && blocksOwn(n)),
        ...this.book.diverged.flatMap((d) =>
          d.versions
            .filter((v) => v.blocks.length > 0 && blocksOwn(v))
            .map((v) => ({ ...v, entity: d.entity })),
        ),
      ].map((n) => this.shownNote(n, n.entity)),
      divergedPlans: this.#diverged(
        new Map([...this.plans].filter(([entity]) => own(entity))),
        new Map(),
        (p, e) => this.#label(this.#planHolders.get(p.name), p.name, e),
        (p, e) => this.shownPlan(p, e),
      ),
      divergedUnits: this.#divergedUnits(own),
      withdrawnPlans: [],
      withdrawnUnits: [...this.units.values()]
        .filter((f) => f.withdrawn)
        .map((f) =>
          this.shownUnit(
            this.unitVersion(f.entity) as unitDomain.Unit,
            f.entity,
          ),
        ),
      incoherent: [
        ...planDomain
          .namesakes(this.plans)
          .filter(({ entities }) => entities.some(own))
          .map(
            ({ name, entities }): Incoherence => ({
              kind: 'name',
              name,
              holders: entities.map((identity) => ({
                identity,
                as: holding(this.plans.get(identity)),
              })),
            }),
          ),
        ...(bound.length > 1 && bound.some(own)
          ? [
              {
                kind: 'exclusive' as const,
                state: exclusive,
                names: bound.map((p) => this.planName(p)),
              },
            ]
          : []),
        ...this.unrealized()
          .filter(({ entities: [unit] }) => askable([unit]))
          .map(
            ({ entities: [unit, plan], concept }): Incoherence => ({
              kind: 'unrealized',
              name: this.unitName(unit),
              concept: this.concept(concept),
              plan: this.planName(plan),
            }),
          ),
        ...unitDomain
          .incoherence(this.units, this.planWithdrawn)
          .filter((i) =>
            askable(i.kind === 'retracted' ? [i.entity] : i.entities),
          )
          .map((i): Incoherence => {
            switch (i.kind) {
              case 'retracted':
                return {
                  kind: 'retracted',
                  name: this.unitName(i.entity),
                  reference: this.unitName(i.reference),
                  relation: 'dependency',
                };
              case 'cycle':
                return {
                  kind: 'cycle',
                  names: i.entities.map((e) => this.unitName(e)),
                };
              case 'name':
                return {
                  kind: 'name',
                  name: i.name,
                  holders: i.entities.map((identity) => ({
                    identity,
                    as: holding(this.units.get(identity)),
                  })),
                };
            }
          }),
      ],
    };
  }

  /** The notebook view's input. */
  noteState(): NotebookState {
    const folds = this.notes;
    return {
      ...this.computed,
      notes: this.book.live.map((n) => this.shownNote(n, n.entity)),
      owed: this.book.live
        .filter((n) => n.blocks.length > 0)
        .map((n) => this.shownNote(n, n.entity)),
      diverged: this.#diverged(
        folds,
        this.#noteRecords,
        (n, e) => this.#label(this.#noteHolders.get(n.title), n.title, e),
        (n, e) => this.shownNote(n, e),
      ),
      withdrawn: [...folds.values()]
        .filter((f) => f.withdrawn)
        .flatMap((f) =>
          withdrew(f, this.#noteRecords)
            .slice(0, 1)
            .map((n) => this.shownNote(n, f.entity)),
        ),
      incoherent: this.book.incoherence.map(
        ({ title, entities }): Incoherence => ({
          kind: 'name',
          name: title,
          holders: entities.map((identity) => ({
            identity,
            as: holding(folds.get(identity)),
          })),
        }),
      ),
    };
  }
}

/** The message of a thrown value. */
function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** What each domain directory keeps, in its domain's words. */
const KEPT: { readonly [domain: string]: string } = {
  design: 'design',
  plan: 'plan',
  unit: 'unit',
  notebook: 'note',
};

/**
 * A refusal as `capability` speaks it. A fault of the store itself is said
 * plainly, naming what a person must repair — the one message that may carry a
 * path; any other refusal has each identity it quotes bare spoken by its
 * entity's name, when `read` can name it.
 */
function plainly(
  capability: string,
  error: unknown,
  read: () => Reading,
): Error {
  if (error instanceof StoreFault) {
    const what = KEPT[error.domain ?? ''] ?? 'stored';
    switch (error.kind) {
      case 'outside':
        return new Error(
          `${capability}: this directory is not inside a git repository; run it from inside the repository that keeps the design, plans and notes`,
        );
      case 'damaged':
        return new Error(
          `${capability}: a stored ${what} entry is damaged: ${error.path} — restore it from version control (\`git checkout -- ${error.path}\`); a stored entry is never edited`,
        );
      case 'moved':
        return new Error(
          `${capability}: the ${what}s changed while this write was being made, so nothing was written; show them again and repeat the write`,
        );
    }
  }
  try {
    return new Error(read().speak(message(error)));
  } catch {
    return new Error(message(error));
  }
}

/** Render a view over the records of the repository holding `from`, speaking
 *  any refusal as `capability`. Writes nothing. */
export function look(
  capability: string,
  from: string,
  render: (read: Reading) => string,
): string {
  let read: Reading | undefined;
  try {
    read = new Reading(from);
    return render(read);
  } catch (error) {
    throw plainly(capability, error, () => read ?? new Reading(from));
  }
}

/**
 * One write verb of `capability` over the records of the repository holding
 * `from`, all or nothing: `write` makes its writes, staged, over a reading of
 * what stands, and returns what the view drills into; `render` draws the view
 * over a reading of what the writes leave. Only when both have succeeded do
 * the writes reach disk, so a refusal anywhere leaves nothing written.
 */
export function act<T>(
  capability: string,
  from: string,
  write: (read: Reading) => T,
  render: (read: Reading, done: T) => string,
): string {
  let store: StagedStore | undefined;
  try {
    store = new StagedStore(from);
    const done = write(new Reading(from, store));
    const view = render(new Reading(from, store), done);
    store.flush();
    return view;
  } catch (error) {
    throw plainly(capability, error, () => new Reading(from, store));
  }
}
