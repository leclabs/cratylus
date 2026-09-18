// The ONE behavioral PORT for manifest→harness projection. A `HarnessAdapter`
// captures the projection operations a consumer (canon's project CLIs)
// needs to render its typed `Agent`/`ResolvedSkill`/`Hook` vectors to a harness's
// on-disk ARTIFACTS — WITHOUT naming a concrete adapter module. A consumer selects
// an implementation strictly BY NAME (`adapterByName('claude' | 'codex')`), so no
// `adapters/<harness>` subpath import leaks into the consumer.
//
// Each projection op returns `{ filename, content }` — the harness owns its own
// file naming (`<name>.md` vs `<name>.toml`; `SKILL.md`), the consumer owns only
// the parent directory it writes under. Optional ops (`scopeOrientation`, `hooks`)
// are present only on harnesses that have that artifact (codex has an `AGENTS.md`
// index; claude serializes hooks → a `settings.json` fragment).
//
// VOCABULARY — the GENUS is `artifact`: one projected file, `⟨filename, content⟩`,
// which is what every op below returns. This file used to spell the genus `surface`
// in its prose while binding `surface?()` to ONE species (codex's `AGENTS.md`), so
// the field and the prose disagreed about the extension of the same sign and a
// reader who trusted either was wrong about the other. The species is now
// `scopeOrientation`, and `surface` is left to the sense the rest of the corpus
// already gives it — a module's exposed API extent (`resolve/`'s public surface, a
// port's INTERFACE surface). `enforcingSurface` below keeps the word in exactly
// that sense: the global config extent a harness offers, not a file.

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
 * vendor-neutral provider at discovery priority 70, and Cursor reads
 * `~/.agents/skills/` and `.agents/skills/`. A corpus that lands here is loaded by
 * two harnesses with no flag, no copy and no per-profile fan-out.
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
  /** The harness-owned filename (with extension), e.g. `mav.md` / `mav.toml` / `SKILL.md`. */
  readonly filename: string;
  readonly content: string;
  /**
   * WHICH scope this artifact governs — an agent name, or {@link SESSION_SCOPE}.
   *
   * Absent ⇒ the artifact is global to the harness home, which is every harness
   * whose enforcement is a config FILE (claude's `settings.json`, codex's
   * `hooks.json`): one artifact, one place, no scope to name. Present ⇒ the
   * artifact is one of MANY, and its scope decides where deploy lands it
   * (`HarnessAdapter.scopedRel`). omp is the harness that needs this: its
   * scope is a DIRECTORY, so the same registrations are emitted once per scope
   * and each copy is correct by placement rather than by a runtime filter.
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
   * for claude, `hooks.json` for codex. The projector used to hardcode the claude
   * name, which made a second harness's artifact unnameable and is why codex's was
   * assumed not to exist.
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
   * declares globally (codex) ignores it and uses `enforcingSurface` instead.
   */
  readonly mechanisms?: ReadonlyMap<string, HarnessMechanism>;
}

/** The projection port a harness adapter implements. */
export interface HarnessAdapter {
  /** The canonical harness name this adapter projects for (`claude`, `codex`, …). */
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
   * `.codex`. Relative to `$HOME` at user scope, to the project root at project
   * scope.
   *
   * REQUIRED, and the reason the whole deploy half existed only for claude: every
   * scope, manifest and prune path spelled `.claude` directly, with no adapter in
   * scope to ask. `deploy --harness codex` could be typed and could not be
   * honoured, so a correct codex render had nowhere to land.
   */
  readonly home: string;
  /**
   * The file EXTENSION this harness's agent definitions carry — `.md`, `.toml`.
   *
   * `agentDef` already returns a full filename, but DEPLOY reads a render tree
   * off disk and has no vector to ask, so it needs the extension on its own. It
   * assumed `.md`, which is why a codex deploy placed zero agents: it looked for
   * `<name>.md` in a directory of `<name>.toml`, found nothing, and reported
   * success.
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
   * Claude and codex do (`agents/<name>.md`, `agents/<name>.toml`), so the
   * assumption held for two harnesses and was invisible. **omp does not**: its
   * persona lands at `<home>/../.agents/<name>/APPEND_SYSTEM.md` — one directory
   * OUT of omp's own `.omp` home, at the harness-neutral root a LAUNCH SPEC
   * carries identity from, because omp has no native identity field of its own
   * (no `--agent` flag, no per-session name) to put it in.
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
   * and codex read skills from one user-level dir, so `agents` goes unused for
   * either. **omp used to be the exception** — its native config root was
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
   * The vendor environment variables this harness sets a session id in, most
   * specific first — what the projected runtime shim bridges into the runtime's
   * own `$AGENT_SESSION_ID` contract.
   *
   * A FACT OF THE HARNESS, so it is declared by the adapter rather than baked into
   * the shim emitter. The emitter used to carry claude's two names for every
   * harness, which made the omp-projected shim assert a bridge that harness has
   * no end for.
   *
   * EMPTY IS A REAL ANSWER, not a missing one: omp exposes no session id to a
   * child process (measured across `packages/coding-agent/src` on
   * `oh-my-pi@5964a0f`), so its shim has nothing to read and must say so instead
   * of proceeding sessionless. See `project/runtime-shim.ts` for the refusal that
   * an empty list emits.
   */
  readonly sessionEnvVars: readonly string[];
  /**
   * The filename of this harness's hook-config artifact — `settings.json`,
   * `hooks.json`. Mirrors `HarnessHooksProjection.filename`; deploy needs it to
   * find the fragment in the render tree and to merge into the host's copy.
   */
  readonly hooksFile: string;
  /**
   * The CLI this harness answers a model question with — or the EMPTY string
   * where it judges in-process and needs no subprocess.
   *
   * Declared on the port because it is the fact that made every harness's guard
   * depend on one vendor: the judge backend hardcoded `claude`, so codex's stance
   * guard and omp's both required a third CLI installed and separately
   * authenticated, and a lapsed session in that CLI failed every verdict open,
   * silently, everywhere at once. A harness answers with its OWN model or it says
   * it cannot, and neither answer belongs in a cell.
   */
  readonly judgeBin: string;
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
   * the hook no agent identifier to match on. Codex's `Stop` is exactly that —
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
   * — which is precisely what it did, and why the codex projection carried no
   * governance at all: every cell's command named a claude path, so codex's whole
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
  /**
   * The one artifact this harness loads because the reader is IN THIS SCOPE rather
   * than because anything was selected — codex's `AGENTS.md`; claude projects none.
   * It orients whoever reads it: what this workspace is, and an index of the agents
   * and skills available here.
   *
   * SCOPE-ACTIVATED, and that is the whole differentia. `agentDef` and `skillDef`
   * are selection-activated — their bytes are read only once a reader picks that
   * agent or invokes that skill. This one is read first and unconditionally, which
   * is why it takes the WHOLE agent-name set and no single vector.
   *
   * It was called `surface`, a sign this file's own prose simultaneously used for
   * the genus (any projected artifact). Same sign, two extensions, one file — see
   * the VOCABULARY note at the top.
   */
  scopeOrientation?(agentNames: readonly string[]): HarnessProjection;
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
   * nothing here and omits this. Codex declares hooks globally, so its adapter must
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
   * **IT WAS MISSING, AND ITS ABSENCE WAS SILENT.** Codex's implementation already
   * took a `mechanisms` parameter and defaulted it to an empty map; the adapter
   * wired `(bindings) => codexHooksJson(bindings)` and never passed one, so every
   * binding hit `if (!m) continue` and the function returned `null` for every input
   * — measured, not inferred. Codex's per-agent enforcing constraints reached the
   * host as nothing at all, while the unit tests stayed green because they call the
   * function DIRECTLY with a mechanism map the production path never supplies.
   * Threading it through the port is what makes the two paths the same path.
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
   * launcher and `--config` overlay land beside it, because an operator who has
   * to combine three flags by hand to start one persona has a launch spec
   * whether or not this port generates it for them.
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
   * field to put a persona in. One SET per projected agent, staged the same
   * way `enforcingSurface`'s output is (`scope` = the agent name), because the
   * spec belongs beside the mechanism modules it wires, not in a directory of
   * its own.
   *
   * ORTHOGONAL TO A PROFILE. omp's `--profile` silos auth, MCP, models,
   * sessions and `agent.db` — an ENVIRONMENT choice, a property of the host.
   * The launch spec carries IDENTITY — a property of the agent this port
   * composes — and the two facts do not need to agree: an operator may still
   * pass `--profile work path/to/omp-launch` and get both.
   *
   * Absent ⇒ this harness carries identity in its own native field (claude's
   * front-matter `name`, codex's TOML `name`) and composes no launch spec.
   */
  launchSurface?(agentNames: readonly string[]): readonly HarnessProjection[];
}
