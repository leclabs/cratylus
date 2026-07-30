// The ONE behavioral PORT for anatomy→harness projection. A `HarnessAdapter`
// captures the projection operations a consumer (agent-canon's project CLIs)
// needs to render its typed `Agent`/`ResolvedSkill`/`Hook` vectors to a harness's
// on-disk surface — WITHOUT naming a concrete adapter module. A consumer selects
// an implementation strictly BY NAME (`adapterByName('claude' | 'codex')`), so no
// `adapters/<harness>` subpath import leaks into the consumer.
//
// Each projection op returns `{ filename, content }` — the harness owns its own
// file naming (`<name>.md` vs `<name>.toml`; `SKILL.md`), the consumer owns only
// the parent directory it writes under. Optional ops (`surface`, `hooks`) are
// present only on harnesses that have that surface (codex has an `AGENTS.md`
// index; claude serializes hooks → a `settings.json` fragment).

import type { Agent, Binding } from '../anatomy/index.js';
import type { ResolvedSkill } from './anatomy-body.js';
import type {
  HarnessMechanism,
  Hook,
  Substrate,
  SubstrateEvent,
} from './hook/index.js';

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
   * name, which made a second harness's surface unnameable and is why codex's was
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
   * Whether this adapter can realize `event`.
   *
   * The predicate behind `¬realizable(e, adapter)`. It answers only for events on
   * THIS adapter's substrate; an event from another substrate is not this
   * adapter's to judge, and the caller routes it before asking.
   */
  realizes(event: SubstrateEvent): boolean;
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
  scopes(event: SubstrateEvent): boolean;
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
  /**
   * Project an agent vector → its subagent def file.
   *
   * `mechanisms` is the resolved `anchor → HarnessMechanism` map for THIS agent's
   * enforcing values — INJECTED, because MODEL makes `mechanism` a function of
   * (fragment, adapter) that deploy emits, not a field the source cell carries.
   * A harness that attaches per-agent (claude: front-matter hooks) renders them
   * here; one that declares globally (codex) ignores it and uses
   * `enforcingSurface` instead.
   */
  agentDef(
    agent: Agent,
    mechanisms?: ReadonlyMap<string, HarnessMechanism>,
  ): HarnessProjection;
  /** Project a resolved skill → its `SKILL.md`. */
  skillDef(skill: ResolvedSkill): HarnessProjection;
  /** The always-loaded instruction/index surface, when the harness has one
   *  (codex `AGENTS.md`; claude has none). */
  surface?(agentNames: readonly string[]): HarnessProjection;
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
