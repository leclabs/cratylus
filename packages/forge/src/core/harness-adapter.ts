// The ONE behavioral PORT for manifest→harness projection. A `HarnessAdapter`
// captures the projection operations a consumer (canon's project CLIs)
// needs to render its typed `Agent`/`ResolvedSkill`/`Hook` vectors to a harness's
// on-disk ARTIFACTS — WITHOUT naming a concrete adapter module. A consumer selects
// an implementation strictly BY NAME (`adapterByName('claude' | 'omp')`), so no
// `adapters/<harness>` subpath import leaks into the consumer.
//
// Each projection op returns `{ filename, content }` — the harness owns its own
// file naming (`<name>.md`; `SKILL.md`), the consumer owns only
// the parent directory it writes under. Optional ops (`hooks`, `enforcingSurface`)
// are present only on harnesses that have that artifact (claude serializes hooks →
// a `settings.json` fragment).
//
// VOCABULARY — the GENUS is `artifact`: one projected file, `⟨filename, content⟩`,
// which is what every op below returns. `surface` is kept for the sense the rest
// of the corpus gives it — a module's exposed API extent (`resolve/`'s public
// surface, a port's INTERFACE surface). `enforcingSurface` below keeps the word in
// exactly that sense: the global config extent a harness offers, not a file.

import type { Agent, Binding, DimensionManifest } from '@cratylus/schema';
import type {
  EventName,
  HarnessMechanism,
  Hook,
  Substrate,
} from '@cratylus/schema/hook';
import type { ResolvedSkill } from './body.js';

/**
 * The scope token a scope-activated artifact carries when it belongs to no single
 * agent — the SESSION itself.
 *
 * A harness whose enforcement is CODE has no global config file to register in, so
 * it realizes a session-scoped cell by placing a module in every scope that must
 * carry it: one per composing agent, plus the session root itself (a launch that
 * named no agent). The agent scopes are keyed by agent name; this token names the
 * remaining one. It is not an agent name and cannot collide with one — canon agent
 * names are cold-derived words, never `_`-prefixed.
 */
export const SESSION_SCOPE = '_session';

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
 * Staging dir for HARNESS-INVARIANT hook assets — the ones `HookWorker.shared`
 * marks, which deploy places under the vendor-neutral {@link NEUTRAL_AGENT_ROOT}
 * instead of inside a harness tree.
 *
 * A SEPARATE DIR RATHER THAN A FLAG ON DISK, for the reason `ENFORCING_STAGE_DIR`
 * gives one paragraph up: the tree is what deploy reads, and a property that
 * exists only in the cell is a property deploy cannot see. Staging by
 * DESTINATION KIND is how the render tree carries the answer.
 */
export const SHARED_STAGE_DIR = 'shared';

/**
 * The harness-NEUTRAL agent root, relative to a scope's home — the one directory
 * name shared across vendors.
 *
 * NOT this project's invention, which is exactly why it is worth targeting: omp
 * reads `~/.agent[s]/{skills,rules,prompts,commands,AGENTS.md,SYSTEM.md}` through a
 * vendor-neutral provider at discovery priority 70. A corpus that lands here is
 * loaded by omp with no flag, no copy and no per-profile fan-out.
 *
 * It is a SIBLING of every harness home (`.omp`, `.claude`, …), so an adapter
 * addresses it as `../<this>/…` from its own home and deploy must be told it is a
 * legitimate prune root — see `prune/applyPrune`'s `alsoRoots`, added because
 * every destination outside the harness home was silently skipped by the
 * containment guard.
 */
export const NEUTRAL_AGENT_ROOT = '.agents';

/**
 * The self-reference token a SCOPED artifact's content may embed to name its OWN
 * eventual absolute destination directory — substituted at DEPLOY TIME, never at
 * projection.
 *
 * WHY IT EXISTS: `hookCommand` gets to bake a literal `$HOME` because the
 * artifact it authors is a SHELL command, expanded by the shell that runs it at
 * RUN time on whatever host it lands on. A harness whose own config is a
 * structured document it parses itself has no such expansion — measured on
 * omp's `--config` overlay, whose `extensions:` entries are resolved with a
 * plain path join against the launch process's cwd (`resolveExtensionLoadPath`,
 * oh-my-pi's resource loader) and never against `$HOME`, a shell variable, or
 * this file's own directory (confirmed: a literal `$HOME` segment in a config
 * value loads as a directory NAMED `$HOME`, not the operator's home). A document
 * that must reference where IT ITSELF will live has no run-time seam to defer
 * to, so the only truthful moment left is DEPLOY, once `--home` has resolved a
 * real destination for this very artifact.
 *
 * A placer staging a scoped artifact already computes that destination
 * (`resolvePath(harnessDir, scopedRel(filename, scope))`) to know where to write
 * it, so substituting this token costs nothing further and needs no
 * harness-specific knowledge in the deploy layer — see `deploy/hooks.ts`.
 */
export const SCOPE_DIR_TOKEN = '{{scopeDir}}';

/** A single projected artifact: the harness-owned filename + its bytes. */
export interface HarnessProjection {
  /** The harness-owned filename (with extension), e.g. `mav.md` / `SKILL.md`. */
  readonly filename: string;
  readonly content: string;
  /**
   * WHICH scope this artifact governs — an agent name, or {@link SESSION_SCOPE}.
   *
   * Absent ⇒ the artifact is global to the harness home: one artifact, one place,
   * no scope to name (claude's `settings.json`). Present ⇒ the artifact is one of
   * MANY, and its scope decides where deploy lands it (`HarnessAdapter.scopedRel`).
   * omp's scope is a DIRECTORY, so the same registrations are emitted once per
   * scope and each copy is correct by placement rather than by a runtime filter;
   * claude's persona scope holds only the stance manifest its workers look for.
   */
  readonly scope?: string;
  /**
   * Land executable (0755) once placed — a launcher an operator invokes
   * directly, the way a hook worker already does (`ProjectedFile.executable`).
   * Absent ⇒ the ambient umask, correct for every module and config file this
   * port projects.
   */
  readonly executable?: boolean;
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
   * The composed skills this adapter must NOT hook into a main session, because
   * what the hook would print exceeds `mainSessionSkillHook.cap`: projection
   * measures each composed skill and hands the ones over the cap down by name. The
   * adapter names them as required reading in the definition instead, so the harness's
   * own skill tool loads them on demand. Absent or empty: every skill fits.
   */
  readonly oversizedSkills?: ReadonlySet<string>;
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
   * The CLI this harness answers a model question with — or the EMPTY string
   * where it judges in-process and needs no subprocess.
   *
   * Declared on the port because it is the fact that made every harness's guard
   * depend on one vendor: the judge backend hardcoded `claude`, so omp's stance
   * guard required a second CLI installed and separately
   * authenticated, and a lapsed session in that CLI failed every verdict open,
   * silently, everywhere at once. A harness answers with its OWN model or it says
   * it cannot, and neither answer belongs in a cell.
   */
  readonly judgeBin: string;
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
   * How this harness carries a persona's composed skills into a MAIN session, where
   * its native preload (`preloadsSkills`) does not reach — by a hook that prints each
   * skill. Absent for a harness whose main session already has them.
   *
   * `cap` is a fact of the harness: the most characters one such hook's output may
   * hold before the harness replaces it with a preview the model does not have to
   * read. `size` is what that hook prints for a skill, given the skill's projected
   * `SKILL.md` text — the number projection weighs against `cap`, to decide which
   * skills the adapter cannot hook and to warn once per skill that it cannot.
   */
  readonly mainSessionSkillHook?: {
    readonly cap: number;
    size(skillName: string, skillMd: string): number;
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
   * per-agent DIRECTORY rather than by a selector: omp writes one module per
   * composing agent into that agent's own `extensions/` dir, which needs no
   * filter to be correctly scoped and cannot be expressed as a single artifact.
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
   * `agentNames` is the projected agent set, because a session-scoped cell governs
   * whoever is running: on a harness that scopes by directory, "every session"
   * means one module per persona scope PLUS the session root ({@link
   * SESSION_SCOPE}). That is not the ambient form MODEL forbids — nothing here
   * filters itself at runtime, and no artifact governs an agent that did not
   * compose it; these cells compose no agent by construction.
   *
   * Absent ⇒ this harness registers scope-activated cells in a config file, or
   * cannot carry them at all (the degrade `project` reports).
   */
  scopeActivatedSurface?(
    hooks: readonly Hook[],
    agentNames: readonly string[],
  ): readonly HarnessProjection[];
  /**
   * Where a SCOPED artifact lands ON THE HOST, harness-home relative — the
   * destination map for whatever `scopeActivatedSurface` / `enforcingSurface` /
   * `launchSurface` returned with a `scope`.
   *
   * NOT ONLY MECHANISM, and that is why this is named `scopedRel` rather than
   * `enforcingRel`, its name until a launch spec needed the same map: a harness
   * whose scope is a directory may place MORE than a hook module there — omp's
   * `--config` overlay lands beside the modules it names, and its launcher in
   * the SESSION scope, because an operator who has to combine flags by hand to
   * start one persona has a launch spec whether or not this port generates it
   * for them.
   *
   * EVERY HARNESS THAT DECLARES IT PLACES THE STANCE MANIFEST, mechanism or
   * not: the projector stages one per persona (`core/enrollment.ts`) and this map
   * says where it lands. omp's scope carries modules beside it; claude's carries
   * nothing else, because claude registers in `settings.json` and its workers find
   * the persona by the `agent_type` the hook payload names. The map must place a
   * persona's manifest directly under `<root>/<persona>/`, keeping its
   * scope-relative path (`STANCE_MANIFEST`), because the workers derive that root
   * from it (`personaRootOf`).
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
   * Emit the LAUNCH SPEC — the artifacts an operator combines to start a
   * session AS one composed persona, on a harness with no native identity
   * field to put a persona in — and the IDENTITY that launch carries, which
   * includes what the operator sees of it: omp's persona badge, the mark emoji
   * and name in the status line. Staged the same way `enforcingSurface`'s output
   * is (`scope` = the agent name, or {@link SESSION_SCOPE}), because the spec
   * belongs beside the mechanism modules it wires, not in a directory of its
   * own.
   *
   * `agents` is the COMPOSED set, each projected agent once — not its names —
   * because the badge is written from the agent cell (its `provenance` mark) at
   * projection: a launched persona cannot name itself at run time.
   *
   * PER-AGENT AND SESSION-WIDE BOTH, and the split is the implementation's to
   * make. An artifact that NAMES one persona is scoped to it (omp's `--config`
   * overlay, which names that persona's own extensions dir); one that resolves
   * a persona at run time is session-scoped and emitted ONCE (omp's launcher,
   * which reads the agent out of `$1` or out of argv[0]). Returning one set per
   * agent unconditionally is how ten agents came to ship ten byte-identical
   * launchers.
   *
   * ORTHOGONAL TO A PROFILE. omp's `--profile` silos auth, MCP, models,
   * sessions and `agent.db` — an ENVIRONMENT choice, a property of the host.
   * The launch spec carries IDENTITY — a property of the agent this port
   * composes — and the two facts do not need to agree: an operator may still
   * pass `--profile work` on the launcher's own command line and get both.
   *
   * Absent ⇒ this harness carries identity in its own native field (claude's
   * front-matter `name`) and composes no launch spec.
   */
  launchSurface?(agents: readonly Agent[]): readonly HarnessProjection[];
  /**
   * The filename of this harness's GENERIC PERSONA LAUNCHER — the file
   * {@link launchSurface} emits at the {@link SESSION_SCOPE}, one for every persona,
   * which resolves the persona to launch from its own invoked name.
   *
   * Declared on the port because install's persona commands link to it: a command
   * named after a persona is a symlink to this file, and where it landed is the
   * adapter's own answer (`scopedRel(launcherFile, SESSION_SCOPE)`), never a path
   * install spells. Absent ⇒ this harness has no launcher, so no persona command
   * can be linked to it.
   */
  readonly launcherFile?: string;
  /**
   * The harness's ONE host-owned status-line command, and the worker this port
   * ships to fill it — declared by a harness whose status line is a single command
   * with no segments to add a badge to (claude's `settings.statusLine`), so the
   * persona badge cannot sit beside the host's own line and must BE the line, or
   * wrap it.
   *
   * `file` is the worker {@link launchSurface} emits at the {@link SESSION_SCOPE}:
   * one for every persona, which asks the harness's status-line input which persona
   * runs and prints that persona's baked badge file, or nothing where none was
   * placed. `command` is the shell command that runs the placed worker, written
   * against `$HOME` and not a resolved path, for the reason `hookCommand` is: it is
   * read at RUN time on whatever host it lands on. Install sets it as the host's
   * status line where the host has none, and appends the host's own command to it,
   * as one quoted argument, to wrap it.
   *
   * Absent ⇒ this harness's status line takes segments (omp's does: see
   * {@link statusSegment}) or has no status line install could set.
   */
  readonly statusLine?: StatusLineWorker;
  /**
   * Where an extension's status appears in this harness's status line, for a harness
   * whose status line is a LIST OF SEGMENTS a host lays out (omp's `statusLine`): the
   * persona badge is an extension status, and it renders INSIDE the line only where
   * the host's layout lists `segment` — otherwise beneath it. Install adds it, to the
   * host's own layout and never over it.
   *
   * Four facts, all the harness's own. `configRels` is where the host keeps the
   * layout, harness-home relative in the order the harness READS them (the first that
   * exists, as {@link RoleRouting.configRels}). `segment` is the segment's id.
   * `defaultLayout` is what the harness lays out when the host names no preset — the
   * layout in effect on a host that never chose one, which has no `segment`, and
   * which the harness reads segment lists from ONLY under its `custom` preset: so a
   * host with no preset can show the badge only by choosing `custom`, and install
   * then writes this layout under it so the line looks as it did. `customLeft` is
   * the left list the `custom` preset falls back to when the host lists none.
   *
   * Absent ⇒ this harness has no segment list to add to.
   */
  readonly statusSegment?: StatusSegmentHost;
  /**
   * How this harness routes a MODEL by the ROLE an agent holds — the table that
   * lets a projected definition name its position ({@link Agent.holds}) and leaves
   * the host to choose the model. The projection names no model, ever.
   *
   * Three facts, all the harness's own: the ROLE it falls back to when the host
   * never configured the held one (`defaultRole`, the role such an agent then runs
   * on), the built-in role each held role is NEAREST to (`nearest`, which seeds the
   * host entry install adds), and WHERE the host keeps the mapping (`configRels`,
   * harness-home relative, in the order the harness READS them — it reads the first
   * that exists, so install edits that one and creates the first only when none
   * does). Install reads this by harness name through the registry, so it never
   * imports an adapter.
   *
   * Absent ⇒ this harness has no role-keyed model routing: definitions carry no
   * route and install touches no host config.
   */
  roleRouting?: RoleRouting;
}

/** The status-line worker a harness ships. See {@link HarnessAdapter.statusLine}. */
export interface StatusLineWorker {
  /** The worker's filename, at the {@link SESSION_SCOPE}. */
  readonly file: string;
  /** The shell command that runs the placed worker, host command not yet appended. */
  readonly command: string;
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

/** A harness's role → model routing table. See {@link HarnessAdapter.roleRouting}. */
export interface RoleRouting {
  /** The role the host routes by when it has no entry for the held one. */
  readonly defaultRole: string;
  /** The harness's own built-in role nearest to a held role; `defaultRole` for a
   *  role it has no closer peer for. */
  nearest(heldRole: string): string;
  /** The host config files that map roles to models, relative to the harness home,
   *  in the harness's read order: it reads the first that exists and ignores the
   *  rest, so a file created beside an existing later one would shadow it. */
  readonly configRels: readonly string[];
}
