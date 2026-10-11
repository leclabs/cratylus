// The ONE behavioral PORT for manifest→harness projection. A `HarnessAdapter`
// captures the projection operations a consumer (canon's project CLIs)
// needs to render its typed `Agent`/`ResolvedSkill`/`Hook` vectors to a harness's
// on-disk ARTIFACTS — WITHOUT naming a concrete adapter module. A consumer selects
// an implementation strictly BY NAME (`adapterByName('omp')`), so no
// `adapters/<harness>` subpath import leaks into the consumer.
//
// Each projection op returns `{ filename, content }` — the harness owns its own
// file naming (`<name>.md`; `SKILL.md`), the consumer owns only
// the parent directory it writes under. Optional ops (`hooks`, `enforcingSurface`)
// are present when that artifact exists; OMP realizes hooks as extension modules.
//
// VOCABULARY — the GENUS is `artifact`: one projected file, `⟨filename, content⟩`,
// which is what every op below returns. `surface` is kept for the sense the rest
// of the corpus gives it — a module's exposed API extent (`resolve/`'s public
// surface, a port's INTERFACE surface). `enforcingSurface` below keeps the word in
// exactly that sense: the global config extent a harness offers, not a file.

import type {
  Agent,
  Binding,
  DimensionManifest,
  GuardCell,
} from '@cratylus/schema';
import type {
  EventName,
  HarnessMechanism,
  Hook,
  NativeBinding,
  Substrate,
} from '@cratylus/schema/hook';
import type { ResolvedSkill } from './body.js';

/**
 * The scope token a scope-activated artifact carries when it belongs to no single
 * agent — the SESSION itself.
 *
 * A harness whose enforcement is CODE has no global config file to register in, so
 * it realizes a session-scoped cell by placing a module in the scope every session
 * reads. Agent scopes are keyed by agent name (a harness that places artifacts per
 * agent); this token names the session's. It is not an agent name and cannot collide
 * with one — canon agent names are cold-derived words, never `_`-prefixed.
 */
export const SESSION_SCOPE = '_session';

/**
 * A guard cell and the agents that compose a value it holds: what a harness judges,
 * and for whom. A harness realizing it judges the guard's act only in a session
 * running as one of `agents`, so it binds the value observed drifting and nothing
 * else.
 */
export interface ComposedGuard {
  readonly guard: GuardCell;
  /** The agents whose composition holds the guarded value, sorted. */
  readonly agents: readonly string[];
}

/**
 * The render tree's staging dir for SCOPED mechanism artifacts —
 * `enforcing/<scope>/<filename>`.
 *
 * Forge's own staging layout, not any harness's destination: `project` writes
 * here, `deploy` reads here and asks the adapter where each scope's copy belongs
 * (`HarnessAdapter.scopedRel`). The same asymmetry as agents, and for the same
 * reason — a render tree is a thing a human diffs, and a destination is a thing a
 * harness reads. A scoped artifact staged at its DESTINATION path would have been
 * unattributable at deploy: there is no vector on disk to ask what scope a nested
 * path meant.
 */
export const ENFORCING_STAGE_DIR = 'enforcing';

/**
 * The harness-NEUTRAL agent root, relative to a scope's home (`~/.agents`), where
 * the EARLIER layout placed omp's skills, as `../.agents/skills/<name>` from the
 * harness home. Nothing is placed there now: everything an install places lives under
 * the owned root. It is named so an upgrade, uninstall or deploy prune can take back
 * what an earlier deploy recorded writing there, as a legitimate prune root
 * (`prune/applyPrune`'s `alsoRoots`).
 */
export const NEUTRAL_AGENT_ROOT = '.agents';

/** A single projected artifact: the harness-owned filename + its bytes. */
export interface HarnessProjection {
  /** The harness-owned filename (with extension), e.g. `mav.md` / `SKILL.md`. */
  readonly filename: string;
  readonly content: string;
  /**
   * WHICH scope this artifact governs — an agent name, or {@link SESSION_SCOPE}.
   *
   * Absent ⇒ the artifact is global to the harness home: one artifact, one place.
   * Present ⇒ its scope decides where deploy lands it (`HarnessAdapter.scopedRel`).
   */
  readonly scope?: string;
}

/** A hooks → settings-fragment projection, plus the per-hook losses. `settings`
 *  is the harness-native `hooks` block (a JSON-serializable fragment the consumer
 *  merges into the host's settings). */
export interface HarnessHooksProjection {
  /**
   * WHERE this harness keeps its scope-activated hook config — `settings.json`
   * for claude. The projector used to hardcode the claude name, which made a
   * second harness's artifact unnameable.
   */
  readonly filename: string;
  readonly settings: Record<string, unknown>;
  readonly warnings: readonly string[];
  readonly skipped: readonly {
    readonly path: string;
    readonly reason: string;
  }[];
}

/**
 * What an agent projection needs BESIDES the vector — the two facts that are
 * properties of the projected SET, not of the agent.
 *
 * `manifest` is REQUIRED and deliberately not defaulted here. Every reader below
 * this port already defaults to forge's resident manifest, so an adapter that
 * simply omitted it would keep projecting plausible bytes off the wrong manifest
 * — the dead-end this parameter exists to close. The set resolves it once
 * (`projectPluginSet`) and hands it down.
 */
export interface AgentDefContext {
  /** The plugin set's resolved dimension manifest — section order and field set. */
  readonly manifest: DimensionManifest;
  /**
   * The resolved `anchor → HarnessMechanism` map for this agent's enforcing
   * values — INJECTED, because MODEL makes `mechanism` a function of (fragment,
   * adapter) that deploy emits, not a field the source cell carries. A harness
   * that attaches per-agent (claude: front-matter hooks) renders them; one that
   * declares globally ignores it and uses `enforcingSurface` instead.
   */
  readonly mechanisms?: ReadonlyMap<string, HarnessMechanism>;
  /**
   * The composed skills this adapter must NOT print into a main session, because
   * what the hook would print exceeds `mainSessionSkillHook.cap`: projection
   * measures each composed skill and hands the ones over the cap down by name. The
   * adapter names each as required reading — in what reaches the MAIN session only,
   * never the definition's body, which a dispatched holder reads too — so the
   * harness's own skill tool loads it on demand. Absent or empty: every skill fits.
   */
  readonly oversizedSkills?: ReadonlySet<string>;
  /**
   * The model the operator chose for this agent at install, which the definition
   * names in place of the tier and effort the agent holds, after the role named for
   * the agent (decision 0111). Absent: the tier and effort stand.
   */
  readonly model?: string;
}

/** The projection port a harness adapter implements. */
export interface HarnessAdapter {
  /** The canonical harness name this adapter projects for (`claude`, `omp`). */
  readonly name: string;
  /**
   * The substrate this adapter realizes constraints on.
   *
   * REQUIRED, not optional: the refusal law is substrate-relative, and an adapter
   * that declined to say which substrate it serves would make every constraint
   * look like someone else's concern — a silent-allow reachable by omission.
   */
  readonly substrate: Substrate;
  /**
   * The dot-directory this harness reads its deployed artifacts from — `.claude`,
   * `.omp`. Relative to `$HOME` at user scope, to the project root at project
   * scope.
   *
   * REQUIRED, and the reason the whole deploy half once existed only for claude:
   * every scope, manifest and prune path spelled `.claude` directly, with no
   * adapter in scope to ask.
   */
  readonly home: string;
  /**
   * The environment variable, when the harness has one, that names the directory it
   * reads its deployed artifacts from, whole: set and non-empty, it IS the harness
   * directory, and `home` is not looked for under `$HOME`. Absent ⇒ the harness reads
   * `<$HOME>/<home>` whatever the environment.
   *
   * It decides where a run given NO home places and removes the harness's files. A
   * run given a home still means that home's `home` directory: naming a home is
   * naming where the files go, and the environment does not overrule it.
   */
  readonly homeEnv?: string;
  /**
   * The file EXTENSION this harness's agent definitions carry — `.md`.
   *
   * `agentDef` already returns a full filename, but DEPLOY reads a render tree
   * off disk and has no vector to ask, so it needs the extension on its own. It
   * once assumed `.md` outright, so a harness whose agents carry another extension
   * would have placed zero agents: it looked for `<name>.md`, found nothing, and
   * reported success.
   */
  readonly agentExt: string;
  /**
   * Where agent `<name>`'s definition lands ON THE HOST, relative to the harness
   * home — this adapter's DESTINATION layout, and its sole authority.
   *
   * NOT the render tree's layout. Those are two different facts and conflating them
   * is what made this method necessary. The render tree is forge's own STAGING
   * layout — uniformly `agents/<name><agentExt>`, one file per agent, because that
   * is convenient for a projector and a `--out` dir a human diffs. Where a HARNESS
   * reads its agents from is the harness's business, and deploy's job is the map
   * between them. It used to be the identity map, which silently assumed every
   * harness stages the way forge does.
   *
   * Claude does (`agents/<name>.md`), so the
   * assumption held for one harness and was invisible. **omp does not**: its
   * definition lands at `<home>/agent/agents/<name>.md` — inside omp's own
   * config root, two levels down, because that is the USER-level task-agent
   * root omp discovers from and forge's flat `agents/<name>.md` staging is not
   * it.
   *
   * REQUIRED for the same reason `agentExt` is: deploy reads a render tree off disk
   * with no vector to ask, so it must compute the destination from the name alone.
   */
  agentRel(name: string): string;
  /**
   * Where skill `<name>` lands ON THE HOST — every destination, harness-home
   * relative, given the agent set this corpus projects.
   *
   * PLURAL because how many destinations a skill needs depends on how the
   * harness scopes a reader, and that varies BY HARNESS, not by skill: claude
   * reads skills from one user-level dir, so `agents` goes unused for it.
   * **omp used to be the exception** — its native config root was
   * profile-scoped, so a skill reachable from every projected persona needed
   * N+1 copies (see `git blame` for the incident: `~/.omp/skills` is a
   * directory omp never scans, so a byte-perfect render once deployed 16
   * unloadable skills and reported success). It no longer is: identity moved to
   * a LAUNCH SPEC out of a harness-neutral `~/.agents` root that every launch —
   * personaed or bare — reads NATIVELY, so `agents` goes unused for omp too now.
   * The parameter stays because a FUTURE harness may still scope a reader per
   * agent, and the port cannot special-case one implementation's history.
   *
   * REQUIRED, like `agentRel`: deploy reads a render tree off disk with no
   * vector to ask, so it must compute every destination from the name alone,
   * and `skills/<name>` — forge's own staging layout — is not every harness's.
   */
  skillRel(name: string, agents: readonly string[]): readonly string[];
  /**
   * The filename of this harness's hook-config artifact — `settings.json`.
   * Mirrors `HarnessHooksProjection.filename`; deploy needs it to
   * find the fragment in the render tree and to merge into the host's copy.
   */
  readonly hooksFile: string;
  /**
  /**
   * Whether an agent definition on this harness can NAME skills the harness
   * preloads into that agent — omp's `autoloadSkills`, claude's subagent
   * `skills`. An answer about the harness, not about any agent.
   *
   * REQUIRED, because the answer decides what an agent's skills become here. Yes
   * ⇒ `agentDef` emits the native field from `Agent.skills`. No ⇒ it emits none
   * (a harness whose agent definition has no such field) and renders the skills
   * as a required-reading declaration instead, and
   * projection warns once per agent that has any: the fidelity ladder's floor is
   * a steer, never silence.
   *
   * Either way the list `agentDef` receives is the CLOSURE projection computed
   * (`skillClosure`), so an adapter renders it and computes nothing.
   */
  readonly preloadsSkills: boolean;
  /**
   * Whether an agent definition on this harness can START the agent in a git
   * worktree of its own — claude's subagent `isolation: worktree`. An answer about
   * the harness, not about any agent.
   *
   * REQUIRED, because the answer decides what `Agent.isolation` becomes here. Yes
   * ⇒ `agentDef` emits the native field for an agent declaring it, and nothing for
   * one that does not. No ⇒ it emits nothing, and projection warns once per
   * declaring agent: the agent still runs, in the checkout its dispatcher runs in
   * (or, where the adapter has a {@link HarnessAdapter.dispatchIsolation}, in the
   * isolated copy of it), and the rule it was meant to have by construction rests
   * on it alone.
   */
  readonly startsInWorktree: boolean;
  /**
   * How this harness carries a persona's composed skills into a MAIN session, where
   * its native preload (`preloadsSkills`) does not reach — by a hook that prints each
   * skill. Absent for a harness whose main session already has them.
   *
   * `cap` is a fact of the harness: the most characters one such hook's output may
   * hold before the harness replaces it with a preview the model does not have to
   * read. `size` is what that hook prints for a skill, given the skill's projected
   * `SKILL.md` text — the number projection weighs against `cap`, to decide which
   * skills the adapter cannot hook and to warn once per skill that it cannot.
   *
   * `hostHome` is the home the definitions will be installed under, when the caller
   * knows it (`install` does; `project` does not). The hook prints each skill's
   * directory, and that path is part of its output, so a longer directory is a longer
   * output. The adapter weighs the directory the hook will print, resolved from that
   * home as the hook resolves it. Absent, the size counts the path as the definition
   * spells it, which is a LOWER BOUND: a host whose directory is longer prints more.
   */
  readonly mainSessionSkillHook?: {
    readonly cap: number;
    size(skillName: string, skillMd: string, hostHome?: string): number;
  };
  /**
   * This harness's EVENT MAP: canonical event name → this harness's native name.
   *
   * The map `realizes`/`scopes` already answer FROM, declared on the port so a
   * consumer can READ it without knowing which harness it holds. Deploy is that
   * consumer: it emits the host's runtime configuration, and the runtime's own
   * capabilities need the native names to attach anything at all. They used to hold
   * a byte-identical private copy, which is the clone this field retires.
   *
   * An event ABSENT from the map is unrealizable here — the fidelity ladder's
   * `declare` rung, never a fabricated binding.
   */
  readonly nativeEvents: Readonly<Record<EventName, string>>;
  /**
   * This harness's ACT BINDINGS: canonical act → the native ⟨event, selector⟩ pair it
   * realizes as, for the acts that are not a plain name in {@link nativeEvents}.
   *
   * Declared on the port beside the 1:1 map for the reason that map is 1:1: the
   * runtime REVERSES it (native → canonical) to name what it observed, and several
   * acts share one native event (`PreToolUse`), so they cannot be rows of it. Deploy
   * emits both into the harness's stanza, and a runtime that attaches to the harness
   * reads the pair back to bind the act exactly as the projection does. Optional: a
   * harness that does not expose its acts to the runtime declares none, and its
   * stanza carries names only.
   */
  readonly nativeActs?: Readonly<Record<EventName, NativeBinding>>;
  /**
   * Whether this adapter can realize `event`.
   *
   * The predicate behind `¬realizable(e, adapter)`. It answers only for events on
   * THIS adapter's substrate; an event from another substrate is not this
   * adapter's to judge, and the caller routes it before asking.
   */
  realizes(event: EventName): boolean;
  /**
   * Whether this adapter can narrow `event` to a NAMED agent.
   *
   * The predicate behind `¬scopable(e, adapter)`, and a STRICTLY stronger demand
   * than `realizes`: firing is not scoping. An adapter may fire an event globally
   * and still be unable to say WHICH agent it fired for, because the harness gives
   * the hook no agent identifier to match on. Such an event is
   * realizable, unscopable.
   *
   * Only asked of a constraint some agent's `ir(a)` composes. A session-wide hook
   * that no agent composes has nothing to narrow to, so the question does not arise.
   *
   * MODEL: `scopable(e,h) ⇒ realizable(e,h)`. An adapter must never return true here
   * for an event it cannot realize.
   */
  scopes(event: EventName): boolean;
  /**
   * How THIS harness invokes a cell's deployed worker — the command string its
   * native hook config will carry.
   *
   * THE SEAM BETWEEN CANON AND FORGE, at its narrowest point. The canon owns what
   * a worker DOES (`content`, harness-agnostic behaviour); the harness owns WHERE
   * it lands and HOW it is invoked. `$HOME/.claude/hooks/<anchor>/<file>` is a
   * claude FACE, and a canon cell that spelled it out would have chosen a harness
   * — which is precisely what it did, and why a second harness's projection carried no
   * governance at all: every cell's command named a claude path, so that harness's whole
   * hooks dir was dropped rather than translated.
   *
   * MODEL: `mechanism : fragment × harness-adapter ⇀ harness-mechanism ⟨what
   * deploy EMITS⟩`. A function OF the adapter — so it is asked here, never read
   * off the cell.
   */
  hookCommand(anchor: string, workerFilename: string): string;
  /** Project an agent vector → its subagent def file, under the set's context. */
  agentDef(agent: Agent, ctx: AgentDefContext): HarnessProjection;
  /** Project a resolved skill → its `SKILL.md`. */
  skillDef(skill: ResolvedSkill): HarnessProjection;
  /** Hooks → a settings fragment + per-hook losses, when the harness supports
   *  hooks (claude → `settings.json` `hooks` block). */
  hooks?(hooks: readonly Hook[]): HarnessHooksProjection;
  /**
   * Realize the ENFORCING constraints on a harness that cannot attach a hook to
   * one agent — a global surface, filtered per agent by whatever selector the
   * harness does offer.
   *
   * THE ADAPTER'S JOB IS TO ADAPT. The canon authors the ideal shape: a constraint
   * composed into the agents it governs. What varies is how much of that a given
   * harness can express. Claude attaches hooks to a subagent directly, so it needs
   * nothing here and omits this. A harness that declares hooks globally must
   * map per-agent down onto a global surface plus a matcher — the mapping lives in
   * the adapter, never in the canon, and never in a hand-written filter inside the
   * mechanism.
   *
   * Absent ⇒ this adapter attaches per-agent already.
   *
   * `mechanisms` is the same injected `anchor → HarnessMechanism` map `agentDef`
   * takes, and it is what an implementation needs to know WHAT COMMAND to wire —
   * MODEL makes `mechanism` a function of (fragment, adapter) that deploy emits,
   * never a field the source cell carries.
   *
   * **IT WAS MISSING, AND ITS ABSENCE WAS SILENT.** An implementation took a
   * `mechanisms` parameter and defaulted it to an empty map, and the adapter never
   * passed one, so every binding hit `if (!m) continue` and the function returned
   * `null` for every input — measured, not inferred. Per-agent enforcing
   * constraints reached the host as nothing at all, while the unit tests stayed
   * green because they called the function DIRECTLY with a mechanism map the
   * production path never supplied. Threading it through the port is what makes
   * the two paths the same path.
   *
   * Returns one projection, MANY, or null. Plural because a harness may scope by
   * per-agent DIRECTORY rather than by a selector, which cannot be expressed as a
   * single artifact. A harness that can narrow no event to one agent (omp: its
   * {@link scopes} is false) omits this, and projection reports each such guard.
   */
  enforcingSurface?(
    bindings: readonly Binding[],
    mechanisms?: ReadonlyMap<string, HarnessMechanism>,
  ): HarnessProjection | readonly HarnessProjection[] | null;
  /**
   * Realize the SCOPE-ACTIVATED cells on a harness whose hook surface is a
   * PROGRAM rather than a config file — the `hooks` op's sibling, for the harness
   * that has no file to register in.
   *
   * `hooks` returns a settings fragment a host merges. omp keeps no hook config at
   * all: its extension loader scans the `extensions/` dir of each native config
   * root, so the DIRECTORY is the declaration and the artifact is a module. The
   * port already accepted arbitrary bytes for the ENFORCING (agent-composed) half
   * via `enforcingSurface`; this is the same accommodation for the half no agent
   * composes.
   *
   * **IT WAS MISSING, AND ITS ABSENCE WAS A SILENT DEGRADE.** `project` branched on
   * `hooks` alone, so on omp every scope-activated cell — the stance gate, the
   * deploy-drift notice, the memory-consolidation nudge, the resume notice — was
   * warned about and dropped, and the harness deployed no mechanism whatsoever
   * while the adapter's own header claimed scope⇔realize was closed. Measured on
   * `fire`: no `~/.omp/hooks` and no per-profile `agent/extensions` dir, against
   * all five anchors wired in the same host's `~/.claude/settings.json`.
   *
   * `agentNames` is the projected agent set, for a harness that scopes by
   * directory and must place a copy per agent scope beside the session's ({@link
   * SESSION_SCOPE}). omp does not: its one module sits at the session scope. That is
   * not the ambient form MODEL forbids — nothing here filters itself at runtime, and
   * no artifact governs an agent that did not compose it; these cells compose no
   * agent by construction.
   *
   * `guards` are the guard cells the projected agents compose ({@link
   * ComposedGuard}), carried in the same session module: each judges its act only
   * in a main session launched as one of the agents composing it. Absent or empty ⇒
   * no guard is composed. A harness without this op realizes no guard, and
   * `project` reports each as a declaration alone.
   *
   * Absent ⇒ this harness registers scope-activated cells in a config file, or
   * cannot carry them at all (the degrade `project` reports).
   */
  scopeActivatedSurface?(
    hooks: readonly Hook[],
    agentNames: readonly string[],
    guards?: readonly ComposedGuard[],
  ): readonly HarnessProjection[];
  /**
   * Where a SCOPED artifact lands ON THE HOST, harness-home relative — the
   * destination map for whatever `scopeActivatedSurface` / `enforcingSurface` /
   * `launchSurface` returned with a `scope`.
   *
   * NOT ONLY MECHANISM, and that is why this is named `scopedRel` rather than
   * `enforcingRel`: a harness whose scope is a directory may place more than a hook
   * module there, such as the artifacts {@link launchSurface} composes from the
   * agents themselves.
   *
   * The render tree stages those artifacts by scope (forge's own staging layout);
   * this is the harness's answer for where each scope's copy belongs, and it is
   * asked at DEPLOY, which reads the tree off disk and has no projection to
   * consult. Same asymmetry as `agentRel`, same reason.
   *
   * `agent` absent — or the {@link SESSION_SCOPE} token itself — ⇒ the session
   * copy: the scope a launch that named no agent reads from. Both spellings, so a
   * caller may pass a projection's `scope` field through unmapped.
   *
   * Absent ⇒ this adapter emits no scoped artifact, and deploy places none.
   */
  scopedRel?(filename: string, agent?: string): string;
  /**
   * Emit what this harness composes from the COMPOSED AGENTS themselves, beyond each
   * agent's own definition: omp's dispatch isolation module (the agents that declare a
   * worktree of their own). Staged the same way
   * `enforcingSurface`'s output is (`scope` = the agent name, or
   * {@link SESSION_SCOPE}).
   *
   * `agents` is the COMPOSED set, each projected agent once — not its names —
   * because what is emitted is written from the agent cells at projection.
   *
   * NO LAUNCHER. Starting a session as an agent goes through the harness itself
   * (omp's `--agent`, registered by its {@link capabilitySurface} module; claude's own
   * `--agent`), so nothing emitted here starts one.
   *
   * Absent ⇒ this harness composes nothing from the agents beyond their definitions.
   */
  launchSurface?(agents: readonly Agent[]): readonly HarnessProjection[];
  /**
   * Emit the CAPABILITY INTERFACE: what offers the runtime's capabilities to this
   * harness's agents as tools, staged like {@link launchSurface}'s output (`scope`
   * the {@link SESSION_SCOPE}, so a plain session is offered them).
   *
   * A PORT, NEVER A COPY. What is emitted carries no description, verb, parameter or
   * rule of a capability: at session load it asks the installed command to explain
   * the capability and composes the tool from that answer alone, and every call runs
   * that command. A newer installed runtime changes the tool in the next session,
   * the emitted bytes unchanged.
   *
   * Absent ⇒ this harness is offered no capability as a tool.
   */
  capabilitySurface?(): readonly HarnessProjection[];
  /**
   * The harness's OWN facilities that hold a runtime capability, by capability id
   * (`concepts`, `workPackage`) → the facility's name. Projection chooses, for each
   * capability, the native facility first (no extension tool and no prose for it),
   * then the {@link capabilitySurface} extension, then prose generated from the
   * capability's own explanation, and reports which form each took.
   *
   * Absent ⇒ the harness holds no capability natively.
   */
  readonly nativeCapabilities?: Readonly<Record<string, string>>;
  /**
   * Where an extension's status appears in this harness's status line, for a harness
   * whose status line is a LIST OF SEGMENTS a host lays out (omp's `statusLine`): the
   * status of the cratylus extension (the agent a session was started as) is an
   * extension status, and it renders INSIDE the line only where
   * the host's layout lists `segment` — otherwise beneath it. Where the host's own
   * layout hides it, install adds it there, recorded under the owned root.
   *
   * Four facts, all the harness's own. `configRels` is where the host keeps the
   * layout, harness-home relative in the order the harness READS them (the first that
   * exists, as {@link RoleRouting.configRels}). `segment` is the segment's id.
   * `defaultLayout` is what the harness lays out when the host names no preset — the
   * layout in effect on a host that never chose one, which has no `segment`, and
   * which the harness reads segment lists from ONLY under its `custom` preset: so a
   * host with no preset can show that status inline only by choosing `custom`, and install
   * then writes this layout under it so the line looks as it did. `customLeft` is
   * the left list the `custom` preset falls back to when the host lists none.
   *
   * Absent ⇒ this harness has no segment list to add to.
   */
  readonly statusSegment?: StatusSegmentHost;
  /**
   * How this harness binds an agent's MODEL through host-configured model roles —
   * a projected definition names the role named for the agent first, which the host
   * may bind, and then the tier and effort the agent holds (decision 0111). The
   * projection names no model id, save one the operator chose at install.
   *
   * Two facts, the harness's own: WHERE the host keeps its roles (`configRels`,
   * harness-home relative, in the order the harness READS them), which install only
   * reads, to ask no question about a role the host already binds; and the value an
   * agent's model falls back to for the tier and effort it holds (`agentRole`).
   *
   * Absent ⇒ this harness has no host-configured role → model table.
   */
  roleRouting?: RoleRouting;
  /**
   * Where this harness loads an EXTENSION PACKAGE by name for every project of one
   * user, relative to its home: the directory install links the owned root into, as
   * the harness's own package manager would (omp: `plugins`, as `omp plugin link`
   * does). Absent ⇒ the harness offers no such reference, and nothing installs to it.
   */
  readonly packageDir?: string;
  /**
   * The handoffs this harness supplies an agent for natively, by the handoff's
   * anchor → the harness's own agent name (omp: `researcher` → `scout`). A dispatch
   * to one names the harness's agent, and a practice whose agents hand off to one is
   * closed without an agent of the corpus holding it.
   *
   * Absent ⇒ the harness supplies none.
   */
  readonly nativeAgents?: Readonly<Record<string, string>>;
  /**
   * How this harness isolates a DISPATCHED agent without an agent-definition field —
   * omp's task isolation: a per-dispatch flag the dispatcher's extension sets, over
   * settings that make the flag exist and keep what the copy built out of the
   * dispatcher's checkout, which the extension holds as the session's own. It is the
   * floor under {@link startsInWorktree} `false`: the agent that declares a worktree
   * still does not get one off the plan's line, but it no longer builds in the
   * checkout that dispatches it.
   *
   * Absent ⇒ no such mechanism: an agent declaring a worktree on a harness that
   * cannot start one runs in the checkout its dispatcher runs in.
   */
  dispatchIsolation?: DispatchIsolation;
}

/** A harness's dispatch-time isolation. See {@link HarnessAdapter.dispatchIsolation}. */
export interface DispatchIsolation {
  /** The settings the isolation holds, by the harness's own dotted setting name. */
  readonly settings: Readonly<Record<string, string | number | boolean>>;
  /** What the isolation still lacks against a worktree off the plan's line, in words
   *  that complete "an agent that declares isolation runs in an isolated copy of its
   *  dispatcher's checkout, …": said by projection and by install. */
  readonly lacks: string;
}

/** A status-line layout: the segments each side lists, and the options they carry. */
export interface StatusLayout {
  readonly left: readonly string[];
  readonly right: readonly string[];
  /** Options per segment id, each a plain scalar. */
  readonly segmentOptions: Readonly<
    Record<string, Readonly<Record<string, string | number | boolean>>>
  >;
}

/** Where an extension's status appears in a harness's status line. See
 *  {@link HarnessAdapter.statusSegment}. */
export interface StatusSegmentHost {
  /** The host config files that hold the layout, harness-home relative, in read order. */
  readonly configRels: readonly string[];
  /** The segment an extension's status renders in. */
  readonly segment: string;
  /** The name of the preset in effect when the host names none — and the one it may
   *  write out. Its layout is `defaultLayout`. */
  readonly defaultPreset: string;
  /** The layout in effect when the host names no preset. */
  readonly defaultLayout: StatusLayout;
  /** The left segments the `custom` preset falls back to when the host lists none. */
  readonly customLeft: readonly string[];
}

/** A harness's model-role table. See {@link HarnessAdapter.roleRouting}. */
export interface RoleRouting {
  /** The host config files that hold the model roles, relative to the harness home,
   *  in the harness's read order: it reads the first that exists. */
  readonly configRels: readonly string[];
  /** The model an agent falls back to, for the tier and effort it holds. */
  agentRole(routing: {
    readonly tier: string;
    readonly effort: string;
  }): string;
}
