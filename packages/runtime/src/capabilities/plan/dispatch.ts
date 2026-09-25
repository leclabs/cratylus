// ─────────────────────────────────────────────────────────────────────────────
// The plan capability's VERB SURFACE — `plan <verb> [args]`, and the reading of
// every domain the three domain capabilities compose.
//
//   show       the bound plan in wave order, `--plan <p>` that plan, or one item
//   add        a unit; the first add naming a plan that does not exist proposes
//              it, realizing `--plan-realizes <concept>` (repeated)
//   advance    a unit one step forward, `--to <state>`
//   retract    a unit, unless another live unit depends on it
//   revise     a unit (re-pinning it) or a plan (its name, its concepts)
//   bind       a plan, returning whichever plan was bound
//   close      a plan, for good
//   reconcile  a diverged unit or plan: one version over every version
//
// THE COMPOSITION. A domain module knows its own records and laws and nothing
// else; what it needs from another domain it takes as a parameter. `Reading`
// supplies each: it folds the design, plan, unit and notebook records once per
// invocation, wires the design's closure into the pin's port, feeds `unit` its
// plan's liveness and the owed rulings the notebook recognises, and maps every
// fold onto the view's shapes. The design and note capabilities read through the
// same `Reading`, so the three verb surfaces name every entity one way.
//
// NAMES, NEVER IDENTITIES. Every input names an entity by name, and `Reading`
// resolves it. A name is held by every live entity carrying it, by a withdrawn
// concept keeping its anchor, and by a diverged entity for every name its heads
// carry; where a merge left one name held by more than one entity, and only
// there, the view prints each holder's identity beside it and the printed form
// `name (identity <id>)` addresses one holder. An identity given for a name held
// once refuses. A domain refusal that quotes an entity is spoken back by name.
//
// THE LIFECYCLE is configuration: `configuration.plan` in the host runtime
// config, which the `plan` skill declares and deploy emits. Absent or malformed,
// every verb here refuses and names the deploy; nothing falls back to states of
// its own.
//
// ARGUMENTS. `--flag value` or `--flag=value`; a flag holding a set or a list
// (`--realizes`, `--deps`, `--static`, …) is repeated, one member each, and
// `--flag ''` gives the empty one. A field left out carries over. Every write
// takes `--author`, `--reason` and `--cause`, which its record's envelope keeps.
// ─────────────────────────────────────────────────────────────────────────────

import { execFileSync } from 'node:child_process';
import type { Invocation } from '../../ports/design.js';
import type { Fields, PlanHost } from '../../ports/plan.js';
import { type Fold, fold } from '../../record-store/fold.js';
import type { Record } from '../../record-store/record.js';
import { RecordStore } from '../../record-store/store.js';
import { loadRuntimeConfig } from '../../runtime-config.js';
import type { DesignState, ShownConcept } from '../../view/design.js';
import type { Diverged, Holder, Incoherence, Name } from '../../view/layers.js';
import { named } from '../../view/layers.js';
import type { NotebookState, Note as ShownNote } from '../../view/notebook.js';
import {
  type LiveUnit,
  type PlanState,
  type Plan as ShownPlan,
  type Unit as ShownUnit,
  planView,
} from '../../view/plan.js';
import {
  type Name as Anchor,
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
import { drifted, suspect, take } from './pin.js';
import * as planDomain from './plan.js';
import * as unitDomain from './unit.js';

// ── Arguments ───────────────────────────────────────────────────────────────────

/** An argv tail: its positionals, and each flag's values in the order given. */
export interface Argv {
  readonly positionals: readonly string[];
  readonly flags: ReadonlyMap<string, readonly string[]>;
}

/** `--flag value` and `--flag=value`, a flag repeated for each member of a
 *  list; a flag given bare holds `''`. */
export function parseArgv(argv: readonly string[]): Argv {
  const positionals: string[] = [];
  const flags = new Map<string, string[]>();
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i] as string;
    if (!token.startsWith('--')) {
      positionals.push(token);
      continue;
    }
    const body = token.slice(2);
    const eq = body.indexOf('=');
    let key = body;
    let value = '';
    if (eq !== -1) {
      key = body.slice(0, eq);
      value = body.slice(eq + 1);
    } else if (argv[i + 1] !== undefined && !argv[i + 1]?.startsWith('--')) {
      value = argv[++i] as string;
    }
    flags.set(key, [...(flags.get(key) ?? []), value]);
  }
  return { positionals, flags };
}

/** The last value of `flag`, `undefined` when it is not given. */
export function one(args: Argv, flag: string): string | undefined {
  return args.flags.get(flag)?.at(-1);
}

/** Every value of `flag` but the empty one, `undefined` when it is not given:
 *  `--flag ''` alone gives the empty list. */
export function many(args: Argv, flag: string): string[] | undefined {
  return args.flags.get(flag)?.filter((v) => v !== '');
}

/** The first positional, naming what `verb` acts on; refuses its absence. */
export function subject(
  args: Argv,
  capability: string,
  verb: string,
  what: string,
): string {
  const named = args.positionals[0];
  if (named === undefined || named.trim() === '')
    throw new Error(`${capability} ${verb}: name the ${what} it acts on`);
  return named;
}

/** The envelope fields a write's invocation gives; refuses one left out. */
export function invocation(
  args: Argv,
  capability: string,
  verb: string,
): Invocation {
  const [author, reason, cause] = ['author', 'reason', 'cause'].map((f) =>
    one(args, f),
  );
  if (author === undefined || reason === undefined || cause === undefined)
    throw new Error(
      `${capability} ${verb}: give --author, --reason and --cause — every record says who wrote it, why, and what caused it`,
    );
  return { author, reason, cause };
}

/** The verb `argv` opens with, refusing one `verbs` does not hold. */
export function verbOf<V extends string>(
  argv: readonly string[],
  capability: string,
  verbs: readonly V[],
): V {
  const verb = argv[0];
  if (verb === undefined || !(verbs as readonly string[]).includes(verb))
    throw new Error(
      `${capability}: unknown verb '${verb ?? ''}' (expected ${verbs.join('|')})`,
    );
  return verb as V;
}

// ── Names ───────────────────────────────────────────────────────────────────────

/** An identity as the view prints it: a ULID. */
const IDENTITY = /[0-9A-HJKMNP-TV-Z]{26}/g;
/** A name with its identity beside it, as the view prints one. */
const IDENTIFIED = /^(.*) \(identity ([0-9A-HJKMNP-TV-Z]{26})\)$/;

/** Read a name as given: bare, or in the printed form with its identity. */
export function parseName(input: string): Name {
  const match = IDENTIFIED.exec(input);
  return match
    ? { name: match[1] as string, identity: match[2] as string }
    : input;
}

/** A name of the design's boundary as the view names it. */
export function fromAnchor(name: Anchor): Name {
  return typeof name === 'string'
    ? name
    : { name: name.anchor, identity: name.identity };
}

/** A name as the design's boundary takes it. */
export function toAnchor(input: string): Anchor {
  const name = parseName(input);
  return typeof name === 'string'
    ? name
    : { anchor: name.name, identity: name.identity };
}

/**
 * The one entity among `holders`, the entities holding `input`'s name, that
 * `input` addresses; `undefined` when none holds it. A bare name held by more
 * than one refuses, listing each holder's identity; an identity is accepted
 * only beside a name held by more than one, and only for one of its holders.
 */
function choose(
  what: string,
  input: Name,
  holders: readonly string[],
): string | undefined {
  if (typeof input === 'string') {
    if (holders.length > 1)
      throw new Error(
        `${what} ${JSON.stringify(input)} is held by ${holders.length} items — ${holders
          .map((h) => named({ name: input, identity: h }))
          .join('; ')}; name one of them with its identity`,
      );
    return holders[0];
  }
  if (holders.length === 1 && holders[0] === input.identity)
    throw new Error(
      `${what} ${named(input)} refused — the name ${JSON.stringify(input.name)} alone names it; drop the identity`,
    );
  return holders.length > 1 && holders.includes(input.identity)
    ? input.identity
    : undefined;
}

/** Each distinct version-head payload of `f`, in the fold's order. */
function versions<P>(f: Fold<P>): P[] {
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

/** The commit the reading is computed at: `HEAD`, or the unborn branch. */
function commitOf(from: string): string {
  const git = (...args: string[]): string =>
    execFileSync('git', args, {
      cwd: from,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  try {
    return git('rev-parse', '--short', 'HEAD');
  } catch {
    return `${git('symbolic-ref', '--short', 'HEAD')} (no commit yet)`;
  }
}

// ── The lifecycle ───────────────────────────────────────────────────────────────

/** The plan and unit lifecycles, as the host received them. */
export interface Lifecycles {
  readonly plan: planDomain.PlanLifecycle;
  readonly unit: unitDomain.UnitLifecycle;
}

/** The plan and unit lifecycles, read from `configuration.plan` in the host
 *  runtime config; refuses, naming the deploy, when it is absent or malformed. */
export function lifecycles(): Lifecycles {
  const refuse = (why: string): never => {
    throw new Error(
      `plan: this host's plan lifecycle is ${why} — the \`plan\` skill declares the lifecycle states and \`cratylus deploy\` emits them into the host runtime config ($AGENT_RUNTIME_CONFIG, else ~/.cratylus.json) as \`configuration.plan\`. Run a deploy; the runtime carries no lifecycle of its own.`,
    );
  };
  const block = loadRuntimeConfig()?.configuration?.plan;
  if (block === undefined) return refuse('absent');
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
    return refuse(
      'malformed: `plan` must give distinct `states`, and an `exclusive` and a `final` state among them',
    );
  if (
    unitStates === undefined ||
    typeof satisfies !== 'string' ||
    !unitStates.includes(satisfies)
  )
    return refuse(
      'malformed: `unit` must give distinct `states`, and a `satisfies` state among them',
    );
  return {
    plan: { states: planStates, exclusive, final },
    unit: { states: unitStates, satisfies },
  };
}

// ── The reading ─────────────────────────────────────────────────────────────────

/** Every domain's records folded once for one invocation, from `from`, a
 *  directory inside the repository, with the names and view shapes the three
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
  #lifecycle: Lifecycles | undefined;
  #live: LiveUnit[] | undefined;

  constructor(from: string = process.cwd()) {
    this.from = from;
    this.store = new RecordStore(from);
    this.design = new Design(this.store);
    const concepts = this.store.read<ConceptPayload>(DESIGN);
    this.concepts = fold(concepts);
    this.#conceptRecords = byId(concepts);
    this.plans = planDomain.plans(this.store);
    const units = this.store.read<unitDomain.Unit>(unitDomain.DOMAIN);
    this.units = fold(units);
    this.#unitRecords = byId(units);
    const notes = this.store.read<Note>(NOTEBOOK);
    this.notes = fold(notes);
    this.#noteRecords = byId(notes);
    this.book = notebook(this.store);

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

  /** The lifecycles, read once, on first need. */
  get lifecycle(): Lifecycles {
    this.#lifecycle ??= lifecycles();
    return this.#lifecycle;
  }

  get commit(): string {
    return commitOf(this.from);
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
      name = fromAnchor(this.design.name(entity));
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
  #unit(entity: string): unitDomain.Unit | undefined {
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
    const u = this.#unit(entity);
    return u === undefined
      ? 'an unknown unit'
      : this.#unitLabel(u.plan, u.spec.name, entity);
  }

  /** What a note blocks, a plan or a unit, as the view names it. */
  blocked(ref: string): Name {
    return this.plans.has(ref) ? this.planName(ref) : this.unitName(ref);
  }

  /** `message` with every entity it quotes spoken by its name. */
  speak(message: string): string {
    return message.replace(IDENTITY, (id) => {
      const name = this.concepts.has(id)
        ? this.concept(id)
        : this.plans.has(id)
          ? this.planName(id)
          : this.units.has(id)
            ? this.unitName(id)
            : this.notes.has(id)
              ? this.#noteName(id)
              : undefined;
      return name === undefined ? id : named(name);
    });
  }

  #noteName(entity: string): Name {
    const f = this.notes.get(entity) as Fold<Note>;
    const title =
      (versions(f)[0] ?? withdrew(f, this.#noteRecords)[0])?.title ?? '';
    return this.#label(this.#noteHolders.get(title), title, entity);
  }

  // ── resolving ──

  /** The concept `input` names; refuses a name no concept holds. */
  resolveConcept(input: string): string {
    const entity = this.design.denotes(toAnchor(input));
    if (entity === undefined)
      throw new Error(
        `no concept is named ${JSON.stringify(input)}; \`design define\` defines one`,
      );
    return entity;
  }

  /** The plan `input` names, `undefined` when no plan holds it. */
  findPlan(input: string): string | undefined {
    const name = parseName(input);
    const bare = typeof name === 'string' ? name : name.name;
    return choose('plan', name, this.#planHolders.get(bare) ?? []);
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

  /** The units holding `input`'s name, in `plan` when given, else in every
   *  plan. */
  #unitsHolding(input: Name, plan?: string): string[] {
    const bare = typeof input === 'string' ? input : input.name;
    return [...this.#unitHolders]
      .filter(([key]) => {
        const [of, name] = JSON.parse(key) as [string, string];
        return name === bare && (plan === undefined || of === plan);
      })
      .flatMap(([, entities]) => entities);
  }

  /** The unit `input` names, looked up in the plan `plan` names when given;
   *  `undefined` when no unit holds it. A name held by units of several plans
   *  refuses, asking for the plan. */
  findUnit(input: string, plan?: string): string | undefined {
    const name = parseName(input);
    const scope = plan === undefined ? undefined : this.resolvePlan(plan);
    const holders = this.#unitsHolding(name, scope);
    const of = [...new Set(holders.map((e) => this.#unit(e)?.plan as string))];
    if (of.length > 1)
      throw new Error(
        `unit ${JSON.stringify(input)} is in plans ${of.map((p) => named(this.planName(p))).join(', ')}; give --plan to say which`,
      );
    return choose('unit', name, holders);
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
    const name = parseName(input);
    const entity = choose('unit', name, this.#unitsHolding(name, plan));
    if (entity !== undefined) return entity;
    const elsewhere = this.#unitsHolding(name);
    throw new Error(
      elsewhere.length > 0
        ? `dependency ${JSON.stringify(input)} is a unit of plan ${elsewhere.map((e) => named(this.planName(this.#unit(e)?.plan as string))).join(', ')}, and a dependency names a unit of its own plan`
        : `dependency ${JSON.stringify(input)} names no unit of plan ${named(this.planName(plan))}`,
    );
  }

  /** The note `input` titles, `undefined` when no note holds the title. */
  findNote(input: string): string | undefined {
    const name = parseName(input);
    const bare = typeof name === 'string' ? name : name.name;
    return choose('note', name, this.#noteHolders.get(bare) ?? []);
  }

  /** What a note blocks: the plan or unit `input` names, units looked up in
   *  `plan` when given. */
  resolveBlocked(input: string, plan?: string): string {
    const name = parseName(input);
    const bare = typeof name === 'string' ? name : name.name;
    const plans = this.#planHolders.get(bare) ?? [];
    const scope = plan === undefined ? undefined : this.resolvePlan(plan);
    const units = this.#unitsHolding(name, scope);
    if (plans.length > 0 && units.length > 0)
      throw new Error(
        `${JSON.stringify(input)} names a plan and a unit; give --plan to block the unit of that plan, or rename one`,
      );
    const entity =
      plans.length > 0
        ? choose('plan', name, plans)
        : this.findUnit(input, plan);
    if (entity === undefined)
      throw new Error(
        `no plan or unit is named ${JSON.stringify(input)}; a note blocks a plan or a unit`,
      );
    return entity;
  }

  // ── the port and the owed rulings ──

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

  /** The entities the owed rulings name. */
  get owed(): ReadonlySet<string> {
    return new Set(owedRulings(this.book).keys());
  }

  /** A pin on concept `entity`, refusing a closure that is not settled and
   *  live. */
  pin(entity: string) {
    return take(this.concepts, entity, this.closure);
  }

  // ── view shapes ──

  shownConcept(payload: ConceptPayload, entity: string): ShownConcept {
    return {
      anchor: this.anchor(payload.anchor, entity),
      gloss: payload.gloss,
      factors: payload.factors.map((f) => this.concept(f)),
    };
  }

  shownPlan(plan: planDomain.Plan, entity: string): ShownPlan {
    return {
      name: this.#label(this.#planHolders.get(plan.name), plan.name, entity),
      realizes: plan.realizes.map((c) => this.concept(c)),
      state: plan.state,
    };
  }

  /** The plan `entity` as the view shows it: its version, or a diverged one's
   *  first. */
  planOf(entity: string): ShownPlan {
    const f = this.plans.get(entity) as Fold<planDomain.Plan>;
    return this.shownPlan(versions(f)[0] as planDomain.Plan, entity);
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

  /** Every live unit with what `unit` and `pin` compute on it, in wave order.
   *  The lifecycle is read only when a live unit exists. */
  get live(): readonly LiveUnit[] {
    if (this.#live !== undefined) return this.#live;
    const live = [...this.units.values()].filter((f) => f.payload);
    if (live.length === 0) return [];
    const lifecycle = this.lifecycle.unit;
    const wave = new Map(
      unitDomain.waves(this.units).flatMap((w, i) => w.map((e) => [e, i])),
    );
    const frontier = new Set(
      unitDomain.frontier(this.units, lifecycle, this.owed),
    );
    this.#live = live
      .map((f) => {
        const unit = f.payload as unitDomain.Unit;
        return {
          ...this.shownUnit(unit, f.entity),
          wave: wave.get(f.entity),
          frontier: frontier.has(f.entity),
          drifted: drifted(unit.pin, this.concepts),
          suspect: suspect(unit.pin, this.concepts, this.closure),
        };
      })
      .sort(
        (a, b) =>
          (a.wave ?? Number.POSITIVE_INFINITY) -
            (b.wave ?? Number.POSITIVE_INFINITY) ||
          named(a.name).localeCompare(named(b.name)),
      );
    return this.#live;
  }

  /** The design's view input; `units` joins the plans standing on each concept,
   *  and a trace, which names no plan, leaves it out. */
  designState(units: boolean): DesignState {
    const folds = [...this.concepts.values()];
    const records = this.#conceptRecords;
    return {
      commit: this.commit,
      concepts: folds.flatMap((f) =>
        f.payload ? [this.shownConcept(f.payload, f.entity)] : [],
      ),
      units: units ? this.live : [],
      diverged: folds
        .filter((f) => f.diverged)
        .map((f) => {
          const retracted = withdrew(f, records);
          return {
            names: distinct(
              [...versions(f), ...retracted].map((v) =>
                this.anchor(v.anchor, f.entity),
              ),
            ),
            versions: versions(f).map((v) => this.shownConcept(v, f.entity)),
            retracted: retracted.map((v) => this.shownConcept(v, f.entity)),
          };
        }),
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
              name: fromAnchor(i.concept),
              reference: fromAnchor(i.factor),
              relation: 'factor',
            };
          case 'cycle':
            return { kind: 'cycle', names: i.concepts.map(fromAnchor) };
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

  /** Every diverged entity of `folds`, as the view lists it. */
  #diverged<P, T>(
    folds: ReadonlyMap<string, Fold<P>>,
    records: ReadonlyMap<string, Record<P>>,
    name: (version: P, entity: string) => Name,
    shown: (version: P, entity: string) => T,
  ): Diverged<T>[] {
    return [...folds.values()]
      .filter((f) => f.diverged)
      .map((f) => {
        const retracted = withdrew(f, records);
        return {
          names: distinct(
            [...versions(f), ...retracted].map((v) => name(v, f.entity)),
          ),
          versions: versions(f).map((v) => shown(v, f.entity)),
          retracted: retracted.map((v) => shown(v, f.entity)),
        };
      });
  }

  /** The plan view's input, showing the plans `shown`. */
  planState(shown: readonly string[]): PlanState {
    const { exclusive } = this.lifecycle.plan;
    const bound = planDomain.holders(this.plans, this.lifecycle.plan);
    return {
      commit: this.commit,
      plans: shown.map((p) => this.planOf(p)),
      units: this.live.filter((u) =>
        shown.some((p) => named(this.planOf(p).name) === named(u.plan.name)),
      ),
      owed: [
        ...this.book.live.filter((n) => n.blocks.length > 0),
        ...this.book.diverged.flatMap((d) =>
          d.versions
            .filter((v) => v.blocks.length > 0)
            .map((v) => ({ ...v, entity: d.entity })),
        ),
      ].map((n) => this.shownNote(n, n.entity)),
      divergedPlans: this.#diverged(
        this.plans,
        new Map(),
        (p, e) => this.#label(this.#planHolders.get(p.name), p.name, e),
        (p, e) => this.shownPlan(p, e),
      ),
      divergedUnits: this.#diverged(
        this.units,
        this.#unitRecords,
        (u, e) => this.#unitLabel(u.plan, u.spec.name, e),
        (u, e) => this.shownUnit(u, e),
      ),
      withdrawnPlans: [],
      withdrawnUnits: [...this.units.values()]
        .filter((f) => f.withdrawn)
        .map((f) =>
          this.shownUnit(this.#unit(f.entity) as unitDomain.Unit, f.entity),
        ),
      incoherent: [
        ...planDomain.namesakes(this.plans).map(
          ({ name, entities }): Incoherence => ({
            kind: 'name',
            name,
            holders: entities.map((identity) => ({
              identity,
              as: holding(this.plans.get(identity)),
            })),
          }),
        ),
        ...(bound.length > 1
          ? [
              {
                kind: 'exclusive' as const,
                state: exclusive,
                names: bound.map((p) => this.planName(p)),
              },
            ]
          : []),
        ...unitDomain
          .incoherence(this.units, this.planWithdrawn)
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
      commit: this.commit,
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

function unitKey(plan: string, name: string): string {
  return JSON.stringify([plan, name]);
}

/** Run `act` over a fresh reading from `from`, speaking any refusal it throws
 *  by name. */
export function over(from: string, act: (read: Reading) => string): string {
  const read = new Reading(from);
  try {
    return act(read);
  } catch (error) {
    throw new Error(
      read.speak(error instanceof Error ? error.message : String(error)),
    );
  }
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

// ── The plan's verbs ────────────────────────────────────────────────────────────

/** The fields of a unit that a plan does not have. */
const UNIT_ONLY = ['intent', 'static', 'deps', 'outputs', 'accept'] as const;

/** The plan capability over the records of the repository holding `from`. */
export function planHost(from: string = process.cwd()): PlanHost {
  /** Every verb reads the lifecycle first, so none runs without it. */
  const run = (act: (read: Reading, lifecycle: Lifecycles) => string): string =>
    over(from, (read) => act(read, read.lifecycle));

  /** The view after a write: the plans `shown`, drilled into `name`. */
  const after = (shown: (read: Reading) => string[], name?: Name): string => {
    const read = new Reading(from);
    return planView(read.planState(shown(read)), name);
  };

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

  /** The one concept a unit write realizes. */
  const realized = (read: Reading, fields: Fields): string | undefined => {
    if (fields.realizes === undefined) return undefined;
    if (fields.realizes.length !== 1)
      throw new Error(
        'a unit realizes exactly one concept; give --realizes once',
      );
    return read.resolveConcept(fields.realizes[0] as string);
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
    const given = UNIT_ONLY.filter((f) => fields[f] !== undefined);
    if (given.length > 0)
      throw new Error(
        `plan ${verb}: a plan has no ${given.join(', ')}; give a plan its --name and --realizes`,
      );
  };

  return {
    show: (name, plan) =>
      run((read, lifecycle) => {
        const bound = planDomain.holders(read.plans, lifecycle.plan);
        let shown = bound;
        if (plan !== undefined) shown = [read.resolvePlan(plan)];
        else if (name !== undefined) {
          const named = parseName(name);
          const bare = typeof named === 'string' ? named : named.name;
          const holding = [...read.plans.values()]
            .filter((f) => versions(f).some((p) => p.name === bare))
            .map((f) => f.entity);
          const ofUnits = [...read.units.values()].flatMap((f) =>
            versions(f).flatMap((u) => (u.spec.name === bare ? [u.plan] : [])),
          );
          shown = [...new Set([...bound, ...holding, ...ofUnits])];
        }
        return planView(
          read.planState(shown),
          name === undefined ? undefined : parseName(name),
        );
      }),

    add: (unit, plan, fields, proposal, by) =>
      run((read, lifecycle) => {
        let entity = read.findPlan(plan);
        if (entity !== undefined) {
          if (proposal !== undefined)
            throw new Error(
              `plan add: plan ${JSON.stringify(plan)} exists, and only its first add proposes it; \`plan revise ${plan} --realizes\` changes its concepts`,
            );
          const state = read.plans.get(entity)?.payload?.state;
          if (state === lifecycle.plan.final)
            throw new Error(
              `plan add: plan ${JSON.stringify(plan)} is ${state}, which is final, and a unit is never added to it`,
            );
        } else if (proposal === undefined || proposal.length === 0)
          throw new Error(
            `plan add: no plan is named ${JSON.stringify(plan)}, and the first add naming a plan proposes it: give --plan-realizes <concept> for each concept it realizes`,
          );
        const concept = realized(read, fields);
        if (concept === undefined)
          throw new Error(
            'plan add: give --realizes <concept>, the one concept the unit realizes',
          );
        if (fields.state !== undefined)
          throw new Error(
            'plan add: a unit starts in its lifecycle’s first state; `plan advance` moves it',
          );
        const pin = read.pin(concept);
        if (entity === undefined) {
          if (fields.deps?.length)
            throw new Error(
              `plan add: plan ${JSON.stringify(plan)} has no unit yet for a dependency to name`,
            );
          entity = planDomain.propose(
            read.store,
            lifecycle.plan,
            {
              name: plan,
              realizes: proposal?.map((c) => read.resolveConcept(c)) ?? [],
            },
            by,
          ).envelope.entity;
        }
        const planEntity = entity;
        unitDomain.add(
          read.store,
          lifecycle.unit,
          { plan: planEntity, spec: spec(read, planEntity, unit, fields), pin },
          read.planWithdrawn,
          by,
        );
        return after(() => [planEntity], unit);
      }),

    advance: (unit, plan, to, by) =>
      run((read, lifecycle) => {
        const entity = read.resolveUnit(unit, plan);
        unitDomain.advance(read.store, lifecycle.unit, entity, to, by);
        const of = read.units.get(entity)?.payload?.plan as string;
        return after(() => [of], parseName(unit));
      }),

    retract: (unit, plan, by) =>
      run((read, lifecycle) => {
        const entity = read.resolveUnit(unit, plan);
        const of = read.units.get(entity)?.payload?.plan as string;
        unitDomain.retract(read.store, entity, read.planWithdrawn, by);
        return after(() => [of], parseName(unit));
      }),

    revise: (name, plan, fields, by) =>
      run((read, lifecycle) => {
        if (fields.state !== undefined)
          throw new Error(
            'plan revise: revise never sets a state — `plan bind` and `plan close` move a plan, and `plan advance` moves a unit',
          );
        const found = target(read, 'revise', name, plan);
        if ('plan' in found) {
          planOnly('revise', fields);
          const current = read.plans.get(found.plan)?.payload;
          planDomain.revise(
            read.store,
            lifecycle.plan,
            found.plan,
            {
              name: fields.name ?? current?.name ?? '',
              realizes:
                fields.realizes?.map((c) => read.resolveConcept(c)) ??
                current?.realizes ??
                [],
            },
            by,
          );
          return after(() => [found.plan], fields.name ?? parseName(name));
        }
        const f = read.units.get(found.unit) as Fold<unitDomain.Unit>;
        if (f.diverged)
          throw new Error(
            `plan revise: unit ${named(read.unitName(found.unit))} has diverged; \`plan reconcile\` settles it`,
          );
        const current = f.payload as unitDomain.Unit;
        const concept = realized(read, fields) ?? current.pin.concept;
        unitDomain.revise(
          read.store,
          found.unit,
          {
            spec: spec(
              read,
              current.plan,
              fields.name ?? current.spec.name,
              fields,
              current.spec,
            ),
            pin: read.pin(concept),
          },
          read.planWithdrawn,
          by,
        );
        return after(() => [current.plan], fields.name ?? parseName(name));
      }),

    bind: (plan, by) =>
      run((read, lifecycle) => {
        const entity = read.resolvePlan(plan);
        planDomain.bind(read.store, lifecycle.plan, entity, read.owed, by);
        return after((r) => planDomain.holders(r.plans, r.lifecycle.plan));
      }),

    close: (plan, by) =>
      run((read, lifecycle) => {
        const entity = read.resolvePlan(plan);
        planDomain.close(read.store, lifecycle.plan, entity, by);
        return after(() => [entity], parseName(plan));
      }),

    reconcile: (name, plan, fields, by) =>
      run((read, lifecycle) => {
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
          planDomain.reconcile(
            read.store,
            lifecycle.plan,
            found.plan,
            settled,
            read.owed,
            by,
          );
          return after(() => [found.plan], settled.name);
        }
        const heads = versions(
          read.units.get(found.unit) as Fold<unitDomain.Unit>,
        );
        const of = agreed(
          'plan',
          heads.map((u) => u.plan),
          'plan',
        );
        const pick = <K extends keyof unitDomain.Spec>(key: K) =>
          agreed(
            'plan',
            heads.map((u) => u.spec[key]),
            key,
          );
        const concept =
          realized(read, fields) ??
          agreed(
            'plan',
            heads.map((u) => u.pin.concept),
            'realizes',
          );
        const unitName = fields.name ?? pick('name');
        unitDomain.reconcile(
          read.store,
          lifecycle.unit,
          found.unit,
          {
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
            pin: read.pin(concept),
          },
          read.planWithdrawn,
          by,
        );
        return after(() => [of], unitName);
      }),
  };
}

/** The plan's verbs, in the order its header lists them. */
const VERBS = [
  'show',
  'add',
  'advance',
  'retract',
  'revise',
  'bind',
  'close',
  'reconcile',
] as const;

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
  return fields;
}

/** Route `plan <verb> [args]` to the plan capability over the repository
 *  holding `from`; returns the view the verb renders. */
export function dispatchPlan(
  argv: readonly string[],
  opts: { readonly from?: string } = {},
): string {
  const verb = verbOf(argv, 'plan', VERBS);
  const args = parseArgv(argv.slice(1));
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
  }
}
