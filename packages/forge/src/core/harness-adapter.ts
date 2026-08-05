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

/** A single projected artifact: the harness-owned filename + its bytes. */
export interface HarnessProjection {
  /** The harness-owned filename (with extension), e.g. `mav.md` / `mav.toml` / `SKILL.md`. */
  readonly filename: string;
  readonly content: string;
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
   * The filename of this harness's hook-config artifact — `settings.json`,
   * `hooks.json`. Mirrors `HarnessHooksProjection.filename`; deploy needs it to
   * find the fragment in the render tree and to merge into the host's copy.
   */
  readonly hooksFile: string;
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
   */
  enforcingSurface?(bindings: readonly Binding[]): HarnessProjection | null;
}
