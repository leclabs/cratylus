// ─────────────────────────────────────────────────────────────────────────────
// PROJECTION over a RESOLVED PLUGIN SET — the render tree `install` places.
//
// The canon's projection is one call over the plugin set's dirs: the plugins in the
// set are all that tells one projection from another.
//
// RENDERING IS NOT WRITING. Projection returns the artifact tree; `install` places
// it. This module opens no file descriptor — that is a LOAD-BEARING property, not
// tidiness: it is what makes "what does this plugin set project?" an answerable
// question instead of a tmpdir excavation.
// ─────────────────────────────────────────────────────────────────────────────

import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { CLI_BIN } from '@cratylus/runtime/bin-name';
import {
  type Agent,
  type Binding,
  type Enforcing,
  type FactorManifest,
  type HookDeclaration,
  type ProjectionFacts,
  type Rule,
  type Ruleset,
  type Skill,
  hookIrOf,
  mergeManifest,
  resolveWorker,
  termOf,
} from '@cratylus/schema';
import type { HarnessMechanism } from '@cratylus/schema/hook';
import {
  type PluginValueCatalogs,
  enumeratePluginValueCatalogs,
} from '../catalog/index.js';
import type { ResolvedSkill } from '../core/body.js';
import { enforcingValuesOf } from '../core/exemplify/factor-fields.js';
import {
  ENFORCING_STAGE_DIR,
  type HarnessAdapter,
  SESSION_SCOPE,
} from '../core/harness-adapter.js';
import { resolveModulePath, scanModuleNames } from '../core/module-scan.js';
import { realizationOf } from './realization.js';
import { resolveSkills, skillClosure } from './resolve-skills.js';
import { runtimeShimContent } from './runtime-shim.js';

/**
 * THE PROJECTOR'S FACT TABLE — every value a worker template may ask for by name.
 *
 * This is the seam that removed a canon hook's import of the runtime. A canon hook
 * needed the runtime bin's name and could only get it by importing
 * `@cratylus/runtime` — meaning reaching into mechanism. FORGE already depends on
 * runtime (a permitted edge: projection
 * knows both sides), so the value belongs here and the hook asks for it by NAME.
 *
 * The schema declares WHICH facts exist (`ProjectionFact`) and never a value; a value
 * in the shapes package would restore the `schema → runtime` edge that was repaired
 * on the same day. Names travel down, values live here.
 *
 * IT TAKES THE ADAPTER, and that is what closes the second blindness. A hook worker
 * runs in a session on SOME harness and is told nothing about which; one that has to
 * LOOK at the deployed tree (rather than merely run in it) therefore matched the
 * claude adapter's shape by hand and reported on a sibling deployment. The pair it
 * needed — ⟨name, hooksFile⟩ — is declared on `HarnessAdapter` and reachable from
 * nowhere else, so a shell-side copy of the adapter table was the only alternative:
 * a second, uncompilable home for the harness registry. Projection is the one stage
 * that knows which adapter it is rendering for, so it is the one place the answer
 * can be bound — and binding it here makes the same hook declaration resolve to per-harness
 * bytes with no per-harness authoring.
 */
export function projectionFacts(adapter: HarnessAdapter): ProjectionFacts {
  return {
    'runtime-bin': CLI_BIN,
    'harness-name': adapter.name,
    'harness-hooks-file': adapter.hooksFile,
  };
}

/** The plugin fields projection consumes — the dirs a plugin contributes its agents, skills, values and hooks from. */
export interface ProjectablePlugin {
  readonly name: string;
  readonly agents?: string;
  readonly skills?: string;
  /** Factors dir, holding each factor's values — scanned `<dir>/<factor>/*.ts` by `discoverValues`. */
  readonly factors?: string;
  /** Dir of hook declaration modules this plugin contributes. */
  readonly hooks?: string;
  /** WHICH factors this plugin declares — the manifest instance (`AgentPlugin.manifest`). */
  readonly manifest?: FactorManifest;
  /** WHICH rulesets this plugin offers (`AgentPlugin.rulesets`). */
  readonly rulesets?: readonly Ruleset[];
}

export interface ProjectOpts {
  /** The resolved plugin set, in `extends` order. */
  readonly plugins: readonly ProjectablePlugin[];
  /** The harness adapter that renders each agent, skill and hook. */
  readonly adapter: HarnessAdapter;
  /**
   * `term → HarnessMechanism` — the realization payloads for this canon's
   * enforcing values, INJECTED.
   *
   * deploy emits `mechanism` per (value, adapter), so it cannot live on the
   * authored value. It is supplied here by the canon — the
   * DATA lives in canon, the ALGORITHM stays doctrine-free.
   */
  readonly mechanisms?: ReadonlyMap<string, HarnessMechanism>;
  readonly log?: (line: string) => void;
  /**
   * Where a DEGRADATION is reported — a constraint this harness could not carry
   * as a mechanism, now realized as a declaration alone.
   *
   * Separate from `log`, and deliberately NOT sharing its default. `log`
   * defaults to a no-op because progress chatter is optional; a warning that
   * inherited that default would be silent in every consumer that did not opt
   * in, which is precisely the silent-allow this seam exists to prevent. The
   * default here is therefore LOUD: silence must be chosen, never inherited.
   */
  readonly warn?: (line: string) => void;
  /**
   * The home directory these definitions will be installed under, when the caller
   * knows it, as `install` does. A harness whose main-session
   * hook prints each skill's directory (`mainSessionSkillHook`) weighs a skill
   * against its cap with this path, since a longer home is a longer output. Absent,
   * the weighing is a lower bound.
   */
  readonly hostHome?: string;
  /**
   * The rules to render, by name, each to `rules/<file>` as the adapter writes it
   * (`HarnessAdapter.ruleDef`). ABSENT or EMPTY ⇒ none: a rule is placed only where
   * it is chosen. A name that is no rule of the plugin set's offered rulesets is
   * refused before anything is rendered.
   */
  readonly rules?: readonly string[];
}

/** One agent of the plugin set, as its module declares it: the agent is identified by
 *  its declared `name`, never by the file that carries it. */
interface AgentSrc {
  readonly agent: Agent;
  readonly plugin: string;
}

export interface ProjectReport {
  readonly agents: number;
  readonly skills: number;
  readonly shims: number;
  readonly hooks: number;
}

/**
 * ONE projected artifact: its path RELATIVE to the render-tree root, plus its bytes.
 * `HarnessAdapter` already hands back `{ filename, content }` per agent, skill or hook; this is that
 * pair once the projection has decided which subtree it belongs under.
 */
export interface ProjectedFile {
  /** Path relative to the render-tree root, e.g. `skills/praxis/SKILL.md`. */
  readonly path: string;
  readonly content: string;
  /** 0755 on write (shims, hook workers). Absent ⇒ ambient umask. */
  readonly executable?: boolean;
}

/**
 * What a plugin set projects to: every artifact as bytes, plus the counts.
 *
 * DELIBERATELY a local structural type, and deliberately unnamed beyond that. This
 * is NOT an agent's `IR`, which is AGENT-scoped and is already realized by the
 * `Agent` interface. A whole-plugin-set aggregate is a different thing, and
 * minting a Cratylic name for it is a naming act
 * this seam is not entitled to perform.
 */
export interface ProjectedTree extends ProjectReport {
  readonly files: readonly ProjectedFile[];
  /** The sorted names of the rendered agents: what an install placed. */
  readonly agentNames: readonly string[];
  /** Each rendered agent that states a model routing ({@link Agent.routing}) → its
   *  tier and effort, by agent name in sorted order: what an install binds as the
   *  agent's own model role without re-reading a definition. */
  readonly agentModels: Readonly<
    Record<string, { readonly tier: string; readonly effort: string }>
  >;
  /** The sorted names of the rendered agents that state a model routing and hold a
   *  role not named for them (a persona over its role): the agents, besides the tiers,
   *  whose model role an install asks the product owner to bind. */
  readonly personas: readonly string[];
  /** The sorted names of the rendered agents that declare a worktree of their own
   *  which the adapter cannot start ({@link HarnessAdapter.startsInWorktree} false):
   *  the loss an install tells the product owner of, beside the projection's warning. */
  readonly unisolated: readonly string[];
  /** The rulesets the plugin set offers, in declaration order, each with its
   *  rules: what an install offers, whole or rule by rule. Empty when the set
   *  declares none. Reported whether or not a render named any rule. */
  readonly rulesets: readonly OfferedRuleset[];
}

/** A declared ruleset as an install offers it: whole, rule by rule, or not at all. */
export interface OfferedRuleset {
  readonly name: string;
  readonly description: string;
  readonly rules: readonly {
    readonly name: string;
    readonly description: string;
  }[];
}

/** The Agent an agent module exports: its one non-default export carrying a string
 *  `name`. A module exporting none is refused, naming the module. */
async function agentOf(modPath: string): Promise<Agent> {
  const mod = (await import(pathToFileURL(modPath).href)) as Record<
    string,
    unknown
  >;
  const agent = Object.entries(mod).find(
    ([k, v]) =>
      k !== 'default' &&
      typeof v === 'object' &&
      v !== null &&
      'name' in v &&
      typeof v.name === 'string',
  )?.[1];
  if (agent === undefined) {
    throw new Error(`agent module ${modPath} exports no Agent`);
  }
  // The guard above proved the one field identity needs; the vector is the module's.
  const declared = agent as Agent;
  return declared;
}

/**
 * Every agent of the plugin set, by its declared `name`. Every agent module is loaded,
 * because only the module knows the name it declares. A later plugin's agent of the
 * same name REPLACES an earlier one's (and is logged); two modules of ONE plugin
 * declaring the same name are refused, naming both.
 */
async function declaredAgents(
  plugins: readonly ProjectablePlugin[],
  log: (line: string) => void,
): Promise<Map<string, AgentSrc>> {
  const byName = new Map<string, AgentSrc>();
  for (const p of plugins) {
    if (!p.agents) continue;
    const own = new Map<string, string>();
    for (const n of await scanModuleNames(p.agents, ['base'])) {
      const modPath = await resolveModulePath(p.agents, n);
      if (!modPath) throw new Error(`agent module not found: ${n}`);
      const agent = await agentOf(modPath);
      const twin = own.get(agent.name);
      if (twin !== undefined) {
        throw new Error(
          `plugin '${p.name}' declares the agent '${agent.name}' twice: in ${twin} and in ${modPath}`,
        );
      }
      own.set(agent.name, modPath);
      const prev = byName.get(agent.name);
      if (prev)
        log(`  override agent ${agent.name}: ${prev.plugin} → ${p.name}`);
      byName.set(agent.name, { agent, plugin: p.name });
    }
  }
  return byName;
}

/** The `HookDeclaration` export of a hook module (the object carrying `substrate`). */
async function hookOf(modPath: string): Promise<HookDeclaration | null> {
  const mod = (await import(pathToFileURL(modPath).href)) as Record<
    string,
    unknown
  >;
  const declaration = Object.values(mod).find(
    (v): v is HookDeclaration =>
      typeof v === 'object' && v !== null && 'substrate' in v && 'workers' in v,
  );
  return declaration ?? null;
}

/**
 * The BINDINGS a projected agent set implies: for each enforcing value, exactly
 * the agents that compose it.
 *
 * This is the whole mediation fix in one function. Scope is COMPUTED from
 * composition, never authored beside the mechanism, so it cannot disagree with
 * what the agents actually declare. Agents are sorted so the emitted artifact is
 * byte-stable — an unsorted set would churn the deploy diff and hide real changes
 * among reorderings.
 *
 * `manifest` is what the vector is READ against — REQUIRED. A factor the
 * set declares and the reader does not know is invisible here, so its enforcing
 * values would bind nothing while its Target section still printed.
 */
export function bindingsOf(
  agents: readonly { readonly name: string; readonly agent: Agent }[],
  manifest: FactorManifest,
): Binding[] {
  const byTerm = new Map<
    string,
    { value: Enforcing<string>; agents: Set<string> }
  >();
  for (const { name, agent } of agents) {
    for (const value of enforcingValuesOf(agent, manifest)) {
      const term = termOf(value);
      const seen = byTerm.get(term);
      if (seen) seen.agents.add(name);
      else byTerm.set(term, { value, agents: new Set([name]) });
    }
  }
  return [...byTerm]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([term, { value, agents: names }]) => ({
      term,
      value,
      agents: [...names].sort(),
    }));
}

/**
 * DISCOVER the plugin set's value nodes (`catalog/enumeratePluginValueCatalogs`).
 * Discovery refuses a namespace two plugins share and a reference graph that dangles
 * or cycles, each with its named error.
 */
export async function discoverValues(
  plugins: readonly ProjectablePlugin[],
): Promise<PluginValueCatalogs> {
  const roots = plugins
    .filter((p): p is ProjectablePlugin & { factors: string } =>
      Boolean(p.factors),
    )
    .map((p) => ({ name: p.name, factorsDir: p.factors }));
  return roots.length === 0
    ? new Map()
    : enumeratePluginValueCatalogs(roots, mergeManifest(plugins));
}

/** A skill as the adapters render it. */
function resolvedSkillOf(skill: Skill): ResolvedSkill {
  return {
    name: skill.name,
    trigger: `/${skill.name}`,
    description: skill.description,
    formalBlock: skill.formalBlock,
    composedFrom: skill.composition().map((c) => `/${c.name}`),
    ...(skill.preamble ? { preamble: skill.preamble } : {}),
    runtime: skill.runtime,
  };
}

/**
 * The rulesets a plugin set offers, in declaration order. A later plugin's ruleset
 * of the same name REPLACES an earlier one's (and is logged), as an agent does. A
 * rule name two rulesets both carry is refused, naming both: a rule is loaded by its
 * name, so the second would replace the first on the harness.
 */
function declaredRulesets(
  plugins: readonly ProjectablePlugin[],
  log: (line: string) => void,
): Ruleset[] {
  const byName = new Map<string, { ruleset: Ruleset; plugin: string }>();
  for (const p of plugins) {
    for (const ruleset of p.rulesets ?? []) {
      const prev = byName.get(ruleset.name);
      if (prev) {
        log(`  override ruleset ${ruleset.name}: ${prev.plugin} → ${p.name}`);
      }
      byName.set(ruleset.name, { ruleset, plugin: p.name });
    }
  }
  const rulesets = [...byName.values()].map((e) => e.ruleset);
  const carriedBy = new Map<string, string>();
  for (const ruleset of rulesets) {
    for (const rule of ruleset.rules) {
      const other = carriedBy.get(rule.name);
      if (other !== undefined) {
        throw new Error(
          `the rule '${rule.name}' is in both the '${other}' and the '${ruleset.name}' rulesets; a rule's name is unique across the plugin set`,
        );
      }
      carriedBy.set(rule.name, ruleset.name);
    }
  }
  return rulesets;
}

/**
 * The rules NAMED, in the order the rulesets declare them, each once. A name that is
 * no declared rule is refused. Runs before anything is rendered.
 */
function selectRules(
  names: readonly string[],
  declared: readonly Ruleset[],
): Rule[] {
  const all = declared.flatMap((r) => r.rules);
  const unknown = names.filter((n) => !all.some((rule) => rule.name === n));
  if (unknown.length > 0) {
    throw new Error(
      `${unknown.map((n) => `'${n}'`).join(', ')} ${unknown.length === 1 ? 'is' : 'are'} no rule of the plugin set (rules: ${all.length === 0 ? 'none' : all.map((r) => r.name).join(', ')})`,
    );
  }
  return all.filter((rule) => names.includes(rule.name));
}

/**
 * Project every agent, skill and hook contributed by the plugin set into an artifact
 * tree. Writes nothing.
 *
 * Later plugins in `extends` order win on a name collision, so a consumer can
 * override a canon AGENT or SKILL by shipping one of the same name. The winner is
 * reported, never silently applied.
 *
 * Agents and skills on one side and values on the other override ASYMMETRICALLY,
 * deliberately:
 *
 *   agent, skill — collides BY NAME, later plugin wins (here)
 *   value        — does NOT collide. `enumeratePluginValueCatalogs` mints a distinct node
 *                  per plugin (`catalog/index.ts`, id `<plugin>:<factor>/<export>`),
 *                  so two plugins naming `parsimony` yield two nodes, not a contest.
 *
 * The asymmetry is right and worth keeping. An agent or skill is a COMPOSITION — a
 * local assembly choice, and overriding one changes only it. A value is
 * canonical VOCABULARY: overriding it by name would silently redefine a concept
 * everywhere any agent selects it, across the whole plugin set, with no site
 * naming the change. Per-plugin value identity makes that impossible by
 * construction rather than by discipline.
 *
 * So a later plugin can override canon's `nico`, and cannot override canon's
 * `objective/insight`.
 */
export async function projectPluginSet(
  opts: ProjectOpts,
): Promise<ProjectedTree> {
  const log = opts.log ?? (() => {});
  const warn =
    opts.warn ?? ((line: string) => console.warn(`WARNING: ${line}`));
  const files: ProjectedFile[] = [];

  // WHICH factors exist is settled before any vector is read: it decides the
  // fields an agent carries, its section order, and what counts as an enforcing
  // value — so every reader below is told, none left to guess at forge's own.
  const manifest = mergeManifest(opts.plugins, log);

  // Collect by DECLARED name across plugins first, so an override is resolved BEFORE
  // any agent or skill is rendered and can be logged rather than discovered as a clobbered file.
  const agentSrc = await declaredAgents(opts.plugins, log);
  const allSkills = await resolveSkills(opts.plugins, log);
  // The roster an agent's skill closure is read against: the skills that DEPLOY,
  // so a later plugin's same-name override changes the closure too.
  const roster = new Map(allSkills.map((s) => [s.name, s.skill]));

  // RULES. None is the default: a rule is rendered only where it is named, and a
  // name that is no offered rule is refused here, before a byte is rendered.
  const rulesets = declaredRulesets(opts.plugins, log);
  const chosenRules = selectRules(opts.rules ?? [], rulesets);

  let agents = 0;
  const agentNames: string[] = [];
  // Each RENDERED agent, once — what the agent surface composes from.
  const rendered: Agent[] = [];
  // Composed vectors, kept so the BINDINGS can be derived from what the agents
  // actually compose.
  const composed: { name: string; agent: Agent }[] = [];
  // COMPOSE BEFORE RENDER. The mechanism a harness may emit depends on what the
  // agents compose (scope is derived from composition), so every vector must exist
  // before any is rendered. Rendering inside this loop would emit each agent's
  // hooks before the seam had decided whether this harness can carry them.
  const pending: string[] = [];
  for (const [name, { agent: bodied }] of [...agentSrc].sort(([a], [b]) =>
    a < b ? -1 : a > b ? 1 : 0,
  )) {
    // THE CLOSURE, computed once and here: an agent is GIVEN its skills together
    // with everything they compose, and every adapter renders the list it is
    // handed rather than computing its own.
    const skills = skillClosure(bodied.skills ?? [], roster);
    const agent = skills.length > 0 ? { ...bodied, skills } : bodied;
    composed.push({ name, agent });
    pending.push(name);
  }

  // A HARNESS THAT CANNOT PRELOAD A SKILL still gets the agent's skills, as a
  // declaration its adapter renders into the definition: the floor is a steer,
  // never silence. The shortfall is reported once per agent it costs.
  if (!opts.adapter.preloadsSkills) {
    for (const { name, agent } of composed) {
      if (!agent.skills?.length) continue;
      warn(
        `agent '${name}' is given skills ${agent.skills.join(', ')}, but the '${opts.adapter.name}' adapter has no agent-definition field that preloads a skill. No native field is emitted; the skills reach the agent as a required-reading declaration in its definition — a steer, not a preload.`,
      );
    }
  }

  // A HARNESS THAT CANNOT START AN AGENT IN A WORKTREE OF ITS OWN runs the agent
  // where its dispatcher runs — or, where it can isolate a dispatched agent by other
  // means (`dispatchIsolation`), in the copy that isolation makes. The declaration is
  // not carried as a worktree, and the shortfall is reported once per agent it
  // costs, beside the skill-preload shortfall above, and named in the tree for a
  // consumer that tells the product owner what the harness lacks.
  const unisolated: string[] = [];
  if (!opts.adapter.startsInWorktree) {
    const { dispatchIsolation } = opts.adapter;
    for (const { name, agent } of composed) {
      if (agent.isolation === undefined) continue;
      unisolated.push(name);
      warn(
        dispatchIsolation === undefined
          ? `agent '${name}' runs in a git worktree of its own, but the '${opts.adapter.name}' adapter has no agent-definition field that starts an agent in one. No native field is emitted; the agent runs in the checkout its dispatcher runs in.`
          : `agent '${name}' runs in a git worktree of its own, but the '${opts.adapter.name}' adapter has no agent-definition field that starts an agent in one. No native field is emitted; a dispatch of it is made an isolated task, so it runs in an isolated copy of its dispatcher's checkout, ${dispatchIsolation.lacks}.`,
      );
    }
  }

  // A SKILL THE MAIN-SESSION HOOK CANNOT CARRY. Where a harness carries a persona's
  // skills into its main session by a hook that prints each one, the harness caps
  // what one hook may print — and a body over the cap arrives as a preview the
  // model is not asked to read, in silence. So each skill an agent is given is
  // weighed here against the cap, once, and one over it is handed to the adapter to
  // name as required reading instead of hooking. It is never trimmed to fit.
  const oversizedSkills = new Set<string>();
  const mainSessionHook = opts.adapter.mainSessionSkillHook;
  if (mainSessionHook) {
    const given = new Set(composed.flatMap((c) => c.agent.skills ?? []));
    for (const { name, skill } of allSkills) {
      if (!given.has(name)) continue;
      const size = mainSessionHook.size(
        name,
        opts.adapter.skillDef(resolvedSkillOf(skill)).content,
        opts.hostHome,
      );
      if (size <= mainSessionHook.cap) continue;
      oversizedSkills.add(name);
      warn(
        `skill '${name}' prints ${size} characters into a '${opts.adapter.name}' main session, over the harness's per-hook output cap of ${mainSessionHook.cap}. ${opts.hostHome === undefined ? '' : `Measured with the host home '${opts.hostHome}'. `}The hook names it as required reading in place of printing it, for each agent composing it, so the Skill tool loads it on demand.`,
      );
    }
  }

  // THE SEAM. Decide the enforcement mode of every binding before a byte is
  // written, and withhold the mechanism of any that degraded. The DECLARATION
  // face needs no decision — `agentBody` publishes it for every composed value on
  // every harness, which is why a shortfall here is a warning and not a refusal.
  const bindings = bindingsOf(composed, manifest);

  const degraded = new Set<string>();
  for (const b of bindings) {
    const { mode, losses } = realizationOf(
      {
        term: b.term,
        substrate: b.value.substrate,
        events: b.value.events,
        agents: b.agents,
      },
      opts.adapter,
    );
    if (mode !== 'steer') continue;
    degraded.add(b.value.realizedBy ?? b.term);
    for (const loss of losses) warn(loss.warning);
  }
  // The mechanisms this harness will actually carry. A degraded term is absent,
  // so every emission path that asks `mechanisms.get(term)` withholds it —
  // adapters need no knowledge of the decision, only of their own capability.
  const mechanisms = opts.mechanisms
    ? new Map([...opts.mechanisms].filter(([term]) => !degraded.has(term)))
    : opts.mechanisms;

  for (const name of pending) {
    const agent = composed.find((c) => c.name === name)?.agent as Agent;
    const { filename, content } = opts.adapter.agentDef(agent, {
      manifest,
      ...(mechanisms ? { mechanisms } : {}),
      ...(oversizedSkills.size > 0 ? { oversizedSkills } : {}),
    });
    files.push({ path: join('agents', filename), content });
    log(`EMIT agent ${name}`);
    agentNames.push(name);
    rendered.push(agent);
    agents++;
  }

  // ENFORCING VALUES. The MECHANISM is emitted by the adapter into each
  // agent's OWN front-matter (`agentHooksFrontMatter`), because Claude Code fires
  // a subagent's front-matter hooks only while that subagent runs. Attachment IS
  // the scope, so there is no separate scope artifact that could drift from the
  // agents it claims to govern.
  //
  // What projection still owes: the WORKER BYTES the emitted commands invoke.
  // Mode was decided above; a degraded term emits no workers, because worker
  // bytes with no mechanism to invoke them are dead files that read as coverage.
  for (const b of bindings) {
    const realizedBy = b.value.realizedBy ?? b.term;
    if (degraded.has(realizedBy)) {
      log(
        `STEER enforcing ${b.term} → ${b.agents.join(' ')} (declaration only)`,
      );
      continue;
    }
    const mech = mechanisms?.get(realizedBy);
    for (const worker of mech?.workers ?? []) {
      // RESOLVED, exactly as at the hook declaration's emission site below. An enforcing
      // mechanism ships the same worker-template shape, so a fact added to one of
      // its workers and resolved at only ONE of the two sites would leak a literal
      // `{{fact:…}}` into a deployed artifact — the failure mode that fails on a
      // host, not at build. Both sites, or neither.
      const resolved = resolveWorker(worker, projectionFacts(opts.adapter));
      files.push({
        path: join('hooks', b.term, resolved.filename),
        content: resolved.content,
        executable: resolved.executable,
      });
    }
    log(`EMIT enforcing ${b.term} → ${b.agents.join(' ')}`);
  }

  // A harness that cannot attach a hook to one agent gets its global surface here,
  // filtered per agent by whatever selector it does offer. Claude omits this — it
  // attached them to each agent's own front-matter already. Degraded bindings are
  // withheld: this surface is exactly where an unscopable hook would WIDEN.
  const boundBindings = bindings.filter(
    (b) => !degraded.has(b.value.realizedBy ?? b.term),
  );
  if (boundBindings.length > 0 && opts.adapter.enforcingSurface) {
    // `mechanisms` THREADED. Passing only the bindings left every implementation
    // with an empty map, so an implementation returned `null` for every input and
    // its per-agent enforcing constraints reached the host as nothing — green the whole
    // time, because the unit tests call the function directly with a map the
    // production path never supplied.
    const surface = opts.adapter.enforcingSurface(boundBindings, mechanisms);
    // One projection or MANY: a harness scoping by per-agent directory emits one
    // artifact per composing agent (omp), and one scoping by selector emits a
    // single global artifact.
    for (const s of surface
      ? Array.isArray(surface)
        ? surface
        : [surface]
      : []) {
      // A SCOPED artifact is staged by scope and mapped at deploy; an unscoped one
      // is the harness's single global artifact and stays at the tree root, as a
      // hook-config file does.
      const path =
        s.scope === undefined
          ? s.filename
          : join(ENFORCING_STAGE_DIR, s.scope, s.filename);
      files.push({ path, content: s.content });
      log(`EMIT enforcing surface ${path}`);
    }
  }

  // WHAT THE ADAPTER COMPOSES FROM THE AGENTS THEMSELVES beyond their definitions
  // (omp's dispatch isolation module), staged the same way `enforcingSurface`'s
  // output is, by whatever scope the adapter named. Optional: an adapter that
  // composes nothing from the agents emits nothing here.
  const renderLaunchSurface = opts.adapter.launchSurface;
  if (renderLaunchSurface) {
    for (const s of renderLaunchSurface(rendered)) {
      const path = join(
        ENFORCING_STAGE_DIR,
        s.scope ?? SESSION_SCOPE,
        s.filename,
      );
      files.push({ path, content: s.content });
      log(`EMIT agent surface ${path}`);
    }
  }

  // THE CAPABILITY INTERFACE: what offers the runtime's capabilities as tools,
  // staged by scope as the agent surface is.
  for (const s of opts.adapter.capabilitySurface?.() ?? []) {
    const path = join(
      ENFORCING_STAGE_DIR,
      s.scope ?? SESSION_SCOPE,
      s.filename,
    );
    files.push({ path, content: s.content });
    log(`EMIT tool definition ${path}`);
  }

  for (const rule of chosenRules) {
    const { filename, content } = opts.adapter.ruleDef(rule);
    files.push({ path: join('rules', filename), content });
    log(`EMIT rule ${rule.name}`);
  }

  let skills = 0;
  let shims = 0;
  for (const { name, skill } of allSkills) {
    const resolved = resolvedSkillOf(skill);
    const skillOut = join('skills', name);
    const { filename, content } = opts.adapter.skillDef(resolved);
    files.push({ path: join(skillOut, filename), content });
    if (skill.runtime) {
      files.push({
        path: join(skillOut, 'scripts', `${skill.runtime.capability}.mjs`),
        content: runtimeShimContent(skill.runtime.capability),
        executable: true,
      });
      log(
        `EMIT skill ${name} (+runtime shim scripts/${skill.runtime.capability}.mjs)`,
      );
      shims++;
    } else {
      log(`EMIT skill ${name}`);
    }
    skills++;
  }

  // Hooks. Only `harness`-substrate hooks register in settings.json; a
  // `git`-substrate hook fires in git's own process and must never be serialized
  // here, so it is filtered BEFORE the lift (which refuses it loudly anyway).
  const discoveredHooks: HookDeclaration[] = [];
  for (const p of opts.plugins) {
    if (!p.hooks) continue;
    for (const n of await scanModuleNames(p.hooks)) {
      const modPath = await resolveModulePath(p.hooks, n);
      if (!modPath) continue;
      const declaration = await hookOf(modPath);
      if (declaration && declaration.substrate === 'harness')
        discoveredHooks.push(declaration);
    }
  }

  discoveredHooks.sort(
    (a, b) =>
      (a.order ?? Number.MAX_SAFE_INTEGER) -
        (b.order ?? Number.MAX_SAFE_INTEGER) || a.id.localeCompare(b.id),
  );

  // A MOMENT THE HARNESS DOES NOT FIRE is a registration it cannot make. A hook bound
  // to such a moment alone is carried as a declaration only: its worker is not staged,
  // since bytes beside no registration read as coverage and deliver none, and the
  // product owner is told once per moment. A hook with a moment the harness does fire keeps
  // the registrations it can make and is told of the ones it cannot.
  const unfired = new Set<string>();
  for (const hook of discoveredHooks) {
    const lost = hook.events.filter((event) => !opts.adapter.realizes(event));
    if (lost.length === hook.events.length) unfired.add(hook.id);
    for (const event of lost) {
      warn(
        `hook '${hook.id}' is bound to '${event}', a moment the '${opts.adapter.name}' harness does not fire. ${lost.length === hook.events.length ? 'The hook is not deployed here' : 'It is not registered for that moment'}.`,
      );
    }
  }
  const carried = discoveredHooks.filter((hook) => !unfired.has(hook.id));

  let hooks = 0;
  if (carried.length > 0) {
    const renderHooks = opts.adapter.hooks;
    // A HOOK SURFACE IS EITHER A CONFIG OR A PROGRAM, and this branch used to know
    // only the first. `hooks` returns a settings fragment (claude);
    // `scopeActivatedSurface` returns modules placed per scope (omp, whose loader
    // scans a dir and whose config root is profile-scoped). Reading the absence of
    // the FORMER as "no surface at all" is what dropped all five of canon's
    // session-scoped hooks on omp while that adapter could realize and narrow every
    // event they name.
    const renderScopeActivated = opts.adapter.scopeActivatedSurface;
    if (!renderHooks && !renderScopeActivated) {
      // DEGRADE, as everywhere else on this seam. A harness with no scope-activated
      // surface loses these hooks' MECHANISM, not the build — and the product owner is
      // told, because an absent guardrail that announced nothing is the failure this
      // whole design removes. Refusing here would delete canon's hooks dir from a
      // plugin set, so agents ran ungoverned and silent.
      for (const hook of carried) {
        warn(
          `scope-activated hook '${hook.id}' has no mechanism on '${opts.adapter.name}': this harness projects no session-scoped hook surface. The hook is not deployed here.`,
        );
      }
    } else {
      // RESOLVE HERE, at the emission boundary. `declaration.workers` are TEMPLATES; the
      // deployed bytes are `resolveWorker(w, facts, declaration.speech)`, and an unknown
      // placeholder throws rather than shipping `{{…}}` to a host.
      const sources = carried.map((declaration) => ({
        hook: hookIrOf(declaration, opts.adapter.hookCommand),
        workers: declaration.workers.map((w) =>
          resolveWorker(w, projectionFacts(opts.adapter), declaration.speech),
        ),
      }));
      let registered = true;
      if (renderHooks) {
        const {
          filename: hooksFile,
          settings,
          warnings,
          skipped,
        } = renderHooks(sources.map((s) => s.hook));
        for (const w of warnings) log(`WARN hook: ${w}`);
        for (const sk of skipped) log(`SKIP hook ${sk.path}: ${sk.reason}`);
        files.push({
          path: hooksFile,
          content: `${JSON.stringify({ hooks: settings }, null, 2)}\n`,
        });
        log(`EMIT ${hooksFile} (hooks: ${Object.keys(settings).join(', ')})`);
      } else if (renderScopeActivated) {
        // SCOPED BY PLACEMENT, so one artifact per scope: the projected agents'
        // profiles plus the session root. `agentNames` is what makes "every session"
        // expressible on a harness whose config root is per-profile.
        const surface = renderScopeActivated(
          sources.map((s) => s.hook),
          agentNames,
        );
        // EMPTY IS A DEGRADE, not a quiet success: an adapter that realized none of
        // these hooks' events registers nothing, and worker bytes beside no
        // registration are dead files that read as coverage.
        registered = surface.length > 0;
        for (const s of surface) {
          const path = join(
            ENFORCING_STAGE_DIR,
            s.scope ?? SESSION_SCOPE,
            s.filename,
          );
          files.push({ path, content: s.content });
          log(`EMIT scope-activated surface ${path}`);
        }
        if (!registered) {
          for (const hook of carried) {
            warn(
              `scope-activated hook '${hook.id}' has no mechanism on '${opts.adapter.name}': none of its events are realizable here. The hook is not deployed here.`,
            );
          }
        }
      }
      // THE WORKERS ARE THE SAME BYTES ON EVERY HARNESS — only the registration
      // differs — so they are emitted once, past the branch that chose it. They
      // used to sit inside the settings-fragment arm, which is why a harness with a
      // code surface would have shipped registrations pointing at workers that were
      // never staged.
      if (registered) {
        for (const src of sources) {
          const id = src.hook.id ?? 'unnamed';
          for (const worker of src.workers) {
            files.push({
              path: join('hooks', id, worker.filename),
              content: worker.content,
              ...(worker.executable ? { executable: true } : {}),
            });
          }
          log(
            `EMIT hook ${src.hook.id} (+${src.workers.length} worker${src.workers.length === 1 ? '' : 's'})`,
          );
          hooks++;
        }
      }
    }
  }

  const agentModels: Record<string, { tier: string; effort: string }> = {};
  const routed = rendered.flatMap((a, i) =>
    a.routing === undefined
      ? []
      : [[agentNames[i] as string, a.routing] as const],
  );
  for (const [name, { tier, effort }] of routed.sort(([a], [b]) =>
    a < b ? -1 : a > b ? 1 : 0,
  )) {
    agentModels[name] = { tier, effort };
  }
  const personas = rendered.flatMap((a, i) =>
    a.routing !== undefined &&
    a.holds !== undefined &&
    a.holds !== agentNames[i]
      ? [agentNames[i] as string]
      : [],
  );

  return {
    files,
    agents,
    skills,
    shims,
    hooks,
    agentNames: [...agentNames].sort(),
    agentModels,
    personas: [...personas].sort(),
    unisolated: [...unisolated].sort(),
    rulesets: rulesets.map((r) => ({
      name: r.name,
      description: r.description,
      rules: r.rules.map((rule) => ({
        name: rule.name,
        description: rule.description,
      })),
    })),
  };
}

export { emitRuntimeShim } from './runtime-shim.js';
