// The OMP (Oh My Pi) projection of the agent anatomy — the third harness, and
// the only one whose persona is a NATIVE artifact of the harness rather than a
// launch-time argument.
//
// THE AGENT DEFINITION IS THE SINGLE SOURCE OF TRUTH. omp discovers USER-level
// task agents from `~/.omp/agent/agents/*.md` (`omp://task-agent-discovery.md`):
// YAML front-matter carrying a required `name` and `description`, and a BODY
// that IS the system prompt. That one file is this adapter's whole projection of
// an agent, and BOTH of omp's readers read it — dispatched as a subagent, omp
// parses it itself; launched as a MAIN session, the generic launcher below
// parses the same bytes and hands the body to `--append-system-prompt`. One
// definition, two readers, nothing to drift.
//
// WHY A MAIN SESSION NEEDS A LAUNCHER AT ALL. omp has no `--agent <name>` flag
// for a main session: a definition is reachable natively only by DISPATCH, and
// the one channel into a main session's prompt is `--append-system-prompt`. The
// launcher is the bridge between those two facts, and it is exactly that — a
// READER of the definition, never a second copy of it.
//
// ONE LAUNCHER, NOT ONE PER AGENT. The agent's name is resolved at RUN time and
// never baked in at projection: from `$1`, or — when the script is reached
// through a symlink named after the agent — from `$0` itself, busybox-style. The
// per-agent scripts this replaces were N byte-identical copies of one file
// differing only in where they happened to sit, so N−1 of them were duplication
// that every deploy had to keep converging.
//
// IDENTITY IS NOT THE PROFILE. omp's own `--profile <name>` silos AUTH, MCP,
// MODELS, SESSIONS and `agent.db` — an ENVIRONMENT, and a property of the HOST
// an operator is running on, not of the agent this module composes. An earlier
// design conflated the two: it projected each persona INTO a profile
// (`profiles/<name>/agent/APPEND_SYSTEM.md`), so composing a persona silently
// forked the operator's whole session state along with it. A profile and a
// persona are ORTHOGONAL facts about one launch; an operator who wants both
// still can (`--profile work` on the launcher's own command line), and forge
// asserts neither for them.
//
// omp's native surfaces, read off `@oh-my-pi/pi-coding-agent`'s own source and,
// where noted, re-measured against an installed `omp` binary:
//
//   - an AGENT is `agent/agents/<name>.md` under `~/.omp` — the USER-level
//     task-agent root, merged first-wins by exact name with a project
//     `.omp/agents` (which wins) and the bundled defs (which lose).
//   - a SKILL is `skills/<name>/SKILL.md` under `~/.agents` (the AgentSkills
//     spec, shared with claude and codex) — omp's vendor-neutral `.agent[s]`
//     provider reads that root NATIVELY, at priority 70, no flag and no
//     profile (confirmed in the installed package's resource loader:
//     `join(getHomeDir(), ".agents", "skills")` is scanned unconditionally,
//     the same call for every launch).
//   - ENFORCEMENT is a TypeScript module omp's extension loader binds either by
//     SCANNING a directory (`discoverExtensionPaths`, a native config root) or
//     by an explicit `--config … extensions:` entry naming a file OR a
//     directory (`collectFilesFromPaths`/`collectAutoExtensionEntries` in the
//     installed package sweep a directory entry exactly like a native root's
//     auto-discovery — verified empirically: a directory named in `extensions:`
//     loaded every loose `.ts` file inside it). No hook CONFIG exists at all:
//     the directory, or the overlay entry naming it, IS the declaration.
//
// THE SCOPE IS STILL A DIRECTORY — `agent/personas/<name>/extensions/` under
// `~/.omp` — and that is still the whole reason this adapter exists. Claude
// attaches a hook inside a subagent's own front-matter, so attachment is the
// scope. Codex declares hooks globally and must re-express per-agent intent as a
// generated `matcher` regex. omp needs neither: a module sitting where only the
// composing persona's OWN `--config` overlay names it loads under that persona
// and no other.
//
// WHY THAT DIRECTORY MOVED IN WITH THE HARNESS. It was `~/.agents/<name>/`,
// beside the persona file that used to live there. The persona is now omp's own
// `agent/agents/<name>.md`, so all that remained in the neutral root was an
// `omp.yml` and a TypeScript module omp alone loads — harness-specific bytes in
// a harness-NEUTRAL root, and a directory the ONE launcher could only reach by
// hard-coding the harness home's own depth (`$dir/../../.agents/<name>`) into a
// shell script, duplicating a fact `scopedRel` already owns. Under
// `agent/personas/<name>/` the launcher hops DOWNWARD from its own resolved
// directory, which is true under any `--home`, and the neutral root goes back to
// holding only what every harness reads.
//
// COMPOSITION STAYS STRUCTURAL. `MODEL.md`'s `ENFORCED` clause ("¬ ambient :
// COMPOSITION is the scope, ¬ a runtime self-filter") held under the profile
// carrier because a module in `profiles/mav/agent/extensions/` loaded only
// under `--profile mav`; it holds here for the identical reason, one step
// removed — the overlay names EXACTLY the extensions that persona's launch
// loads, so nothing in the module itself asks who is running. Emitting one
// global module that branched on an env var would still have been the ambient
// form this clause forbids; naming a scope's own directory in that scope's own
// overlay is composition by placement, same as it always was.
//
// The composed Target BODY is HARNESS-NEUTRAL — the agent's dimension sections,
// identical whichever harness carries them. So this module REUSES `agentBody` /
// `skillBody` from core and adds only the omp-specific FRAMING.

// The bin's ONE authored home. This artifact is named after the TOOL that emits
// it, so a rename must carry it — the same reason a cell carries `{{fact:runtime-bin}}`
// rather than the literal. `forge → runtime` is a permitted edge (ARCHITECTURE's
// north star); spelling the name here instead would be a second home for it, which
// `bin-name-single-home` catches and rightly refused.
import { CLI_BIN } from '@cratylus/runtime/bin-name';
import type { Agent, Binding } from '@cratylus/schema';
import type { HarnessMechanism, Hook } from '@cratylus/schema/hook';
import { type ResolvedSkill, agentBody, skillBody } from '../../core/body.js';
import {
  type AgentDefContext,
  type HarnessAdapter,
  type HarnessProjection,
  NEUTRAL_AGENT_ROOT,
  SCOPE_DIR_TOKEN,
  SESSION_SCOPE,
} from '../../core/harness-adapter.js';
import {
  OMP_ENVELOPE_KIND,
  OMP_REFUSAL_SHAPE,
  OMP_WORKER_TOOL,
  canonicalToOmp,
  ompBindingOf,
} from './events.js';

export type { ResolvedSkill };

/**
 * The SESSION root — omp's native USER config dir, relative to the harness
 * home, and the root EVERY artifact this adapter deploys is carried from.
 *
 * omp's native user config is `~/.omp/agent` (`getAgentDir()`,
 * `discovery/builtin.ts`) when no `--profile` names another. Three things hang
 * off it: the task-agent definitions omp discovers ({@link OMP_AGENT_DEF_DIR}),
 * the SESSION-scoped mechanism module — the copy every launch, personaed or
 * bare, reads automatically because it sits on omp's own scan path — and the
 * per-persona scopes ({@link OMP_PERSONA_DIR}) omp scans for nothing and only a
 * launch spec reaches.
 */
export const OMP_SESSION_DIR = 'agent';

/**
 * omp's USER-level task-agent discovery dir, relative to {@link
 * OMP_SESSION_DIR} — `~/.omp/agent/agents/`.
 *
 * Its own constant because the LAUNCHER has to hop into it from its own
 * resolved directory at RUN time. A launcher naming a directory this module
 * spelled differently is a persona unlaunchable by its own name, and the shell
 * would report that as a missing file rather than as a disagreement.
 */
export const OMP_AGENT_DEF_DIR = 'agents';

/** Where agent `<name>`'s definition lands, relative to the harness home
 *  (`.omp`) — omp's OWN user-level task-agent root, read NATIVELY on every
 *  discovery pass.
 *
 *  `<name>.md` and not `<name>/APPEND_SYSTEM.md`, which is where this used to
 *  land. That filename was omp's vocabulary for what `--append-system-prompt`
 *  reads, and it made the persona a LAUNCH ARGUMENT — invisible to omp's own
 *  agent discovery, so a composed agent could be started as a session and could
 *  not be DISPATCHED as a subagent by the same name. One artifact answers both
 *  now, and the launcher reads it rather than owning a second copy. */
export function ompAgentRel(name: string): string {
  return `${OMP_SESSION_DIR}/${OMP_AGENT_DEF_DIR}/${name}.md`;
}

/**
 * Where skill `<name>` lands, relative to the harness home — ONE path, at the
 * harness-neutral root omp reads NATIVELY on every launch.
 *
 * `agents` goes UNUSED: the fan-out this signature still carries for claude and
 * codex existed here only because a persona WAS a profile, and a profile's
 * native config root is isolated from every other — so a skill reachable from
 * every persona needed N+1 copies. It no longer is: omp reads `~/.agents/skills`
 * NATIVELY, at provider priority 70, for every launch — personaed, bare, or
 * profiled — so one copy now serves every reader and the fan-out bought
 * nothing once the persona stopped being a profile.
 */
export function ompSkillRel(
  name: string,
  _agents: readonly string[],
): readonly string[] {
  return [`../${NEUTRAL_AGENT_ROOT}/skills/${name}`];
}

/** The emitted enforcement module's filename — derived, never spelled. */
export const OMP_GUARDRAIL_MODULE = `${CLI_BIN}-guardrails.ts`;

/** The emitted SCOPE-ACTIVATED module's filename. A second file rather than more
 *  registrations in the first, because the two halves retire independently: the
 *  guardrails follow the agents that compose them, these follow the cells. */
export const OMP_SESSION_MODULE = `${CLI_BIN}-session.ts`;

/** The `--config` overlay filename — the launcher's one argument for reaching a
 *  persona's own extensions. */
export const OMP_OVERLAY_FILE = 'omp.yml';

/** The generic launcher's filename — no extension, because it is invoked
 *  directly (`omp-agent mav`), never sourced or required.
 *
 *  It is also the DISPATCH SENTINEL: the script compares `basename $0` against
 *  this exact name to decide whether the agent arrives as `$1` or as argv[0]
 *  itself, so a rename carries INTO the script instead of silently disabling
 *  the symlink form. */
export const OMP_LAUNCHER_FILE = 'omp-agent';

/** Where one persona's SCOPED artifacts land, relative to {@link
 *  OMP_SESSION_DIR} — `~/.omp/agent/personas/<name>/`.
 *
 *  A directory omp scans for NOTHING, which is the entire point: what lands
 *  here (`omp.yml`, and the mechanism modules it names) must be reachable only
 *  from that persona's own launch and never from a bare `omp`. It sits UNDER
 *  the session root rather than beside it so the launcher — which resolves its
 *  own directory and knows nothing else — reaches it by hopping down, with no
 *  knowledge of where the harness home is or how deep.
 *
 *  RELOCATING THIS BREAKS EVERY LIVE SESSION, and the failure is delayed. A
 *  running session holds its `--config <persona>/omp.yml` in a launch spec it
 *  re-resolves on EVERY subagent spawn, so a deploy that moves the scope out
 *  from under it leaves the parent apparently healthy and every spawn dying on
 *  `Config overlay not found`. That is the silent removal of delegation from an
 *  agent whose whole design delegates. Measured twice: once for `kino` on
 *  2026-09-22 against a path the deploy had never written, and again the next
 *  day for `mav` when this constant moved the scope here from `.agents/<name>/`.
 *  So a future move of this constant is a BREAKING change for sessions already
 *  running, and it wants the old path left resolvable until they drain — the
 *  deploy cannot know they exist. */
export const OMP_PERSONA_DIR = 'personas';

// The two filenames that must resolve inside a scope's `extensions/`
// subdirectory rather than at the scope's own top level — the overlay and the
// launcher are the operator's entry points and are never themselves scanned as
// extensions, so they stay one level up from what they name.
const OMP_EXTENSION_FILES: Readonly<Record<string, true>> = {
  [OMP_GUARDRAIL_MODULE]: true,
  [OMP_SESSION_MODULE]: true,
};

// ── Agent projection → agent/agents/<name>.md ────────────────────────────────

/**
 * The omp agent definition: the front-matter omp reads, then the composed Target
 * body, which IS the system prompt.
 *
 * **FRONT-MATTER: the two fields omp REQUIRES, plus the one the CELL declares.**
 * `parseAgentFields` treats a missing `name` or `description` as a parse failure
 * and SKIPS the file — a persona that silently does not exist. The rest of what
 * omp accepts here (`model`, `tools`, `spawns`, `thinking-level`, …) is a
 * property of a HOST's routing rather than of the composed agent, so forge
 * asserts none of it: an operator who adds one is editing their own dispatch
 * policy.
 *
 * **`autoloadSkills` IS THE EXCEPTION, because it is not routing.** Which skills
 * an agent operates through is a fact about the COMPOSED AGENT, and the cell
 * declares it (`Agent.skills`). Emitted only when that declaration is non-empty,
 * so an agent that declares none still projects exactly the two required keys.
 * omp honours the field for a DISPATCHED subagent — the skills are injected
 * before the child's first prompt — and {@link OMP_LAUNCHER_SCRIPT} reads the
 * same key back OUT of this file for a MAIN session, which has no native path
 * for it. One declaration, both ways of reaching the agent, nothing declared
 * twice.
 *
 * **THE DESCRIPTION IS QUOTED, AND THAT IS NOT COSMETIC.** A plain YAML scalar
 * may not contain `: ` — `nico`'s description does ("its conceptual architecture
 * and canon: dimension catalogs"), which makes the document a scanner error.
 * omp survives that by falling back to a naive `key: value` line parser and
 * logging a warning on every discovery pass, so the defect is invisible right up
 * until a description grows a `#` or a newline and the fallback loses it too.
 * Double-quoted with `"` and `\` escaped, every description this corpus can
 * produce is a legal one-line YAML scalar. Each skill name is quoted by the same
 * rule, which makes the emitted flow sequence identical in shape to the one omp's
 * own agent-definition template writes.
 *
 * **NO IDENTITY LINE.** The persona body used to open with "You are `<name>`…",
 * because this file WAS the appended prompt and omp's base prompt asserts its
 * own identity underneath it. It is not that file any more: for a DISPATCHED
 * subagent the body is the entire system prompt and the sentence is redundant,
 * and for a MAIN session the launcher prepends it — see {@link
 * OMP_LAUNCHER_SCRIPT}, which carries the measurement that earned it.
 */
export function agentToOmpMd(a: Agent, ctx: AgentDefContext): string {
  const fm = [`name: ${a.name}`, `description: ${yamlString(a.description)}`];
  // omp-SPECIFIC, and emitted by this adapter alone: neither claude nor codex
  // has a field that loads a skill from an agent definition.
  if (a.skills?.length) {
    fm.push(`autoloadSkills: [${a.skills.map(yamlString).join(', ')}]`);
  }
  return `---\n${fm.join('\n')}\n---\n\n${agentBody(a, ctx.manifest).replace(/\n+$/, '')}\n`;
}

/** One line of YAML in its double-quoted form — the two characters that form
 *  requires escaped (`\` then `"`, in that order, or the escapes escape each
 *  other), and any newline folded to a space so the value cannot outrun the
 *  line-based fallback parser omp reaches for when the real one fails. */
function yamlString(s: string): string {
  return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, ' ')}"`;
}

// ── Skill projection → skills/<name>/SKILL.md ────────────────────────────────

/**
 * The omp SKILL.md for a resolved skill — the AgentSkills front-matter pair plus
 * the harness-neutral body, identical in shape to the codex projection because
 * both consume the same spec.
 */
export function skillToOmpMd(s: ResolvedSkill): string {
  const fm = [
    `name: ${s.name}`,
    `description: ${s.skillDescription ?? s.description}`,
  ];
  return `---\n${fm.join('\n')}\n---\n\n${skillBody(s).replace(/\n+$/, '')}\n`;
}

// ── Enforcement → <scope>/extensions/<bin>-guardrails.ts ─────────────────────

/** One `pi.on(...)` registration, already narrowed to its act where it has one. */
interface OmpRegistration {
  readonly anchor: string;
  readonly native: string;
  readonly tool: string | undefined;
  /** The tool name this act wears in the WORKER's wire contract, when it is an
   *  act at all — `OMP_WORKER_TOOL`. omp's own spelling (`tool`) narrows the
   *  handler; this one is what the synthesized envelope must carry, and the two
   *  differ because only one of them is a fact about omp. */
  readonly workerTool: string | undefined;
  readonly command: string;
}

/**
 * Realize the canon's per-agent constraints as one TypeScript extension module PER
 * AGENT, written where only that agent's own scope directory can load it.
 *
 * Returns one projection per composing agent — plural, unlike its siblings, because
 * omp's scope is a directory and a directory is per-agent by construction. A single
 * global module would have had to filter itself at runtime, which `MODEL.md`
 * forbids.
 *
 * The emitted module shells out to the same worker bytes every other harness
 * invokes (`hookCommand`), so the canon's behaviour has one home and this adapter
 * carries only the wiring.
 */
export function ompGuardrailExtensions(
  bindings: readonly Binding[],
  mechanisms: ReadonlyMap<string, HarnessMechanism> = new Map(),
): HarnessProjection[] {
  // agent → the registrations that agent composes.
  const byAgent = new Map<string, OmpRegistration[]>();
  for (const b of bindings) {
    const f = b.fragment as { substrate?: string; events?: readonly string[] };
    if (f.substrate !== 'harness') continue;
    const anchor =
      (b.fragment as { realizedBy?: string }).realizedBy ?? b.anchor;
    const m = mechanisms.get(anchor);
    if (!m) continue;
    for (const event of f.events ?? []) {
      const binding = ompBindingOf(event);
      // An unrealizable event never reaches here: the seam decided mode first and
      // withholds a degraded binding. This is an EMISSION guard, not a second
      // decision site — skipping is the only safe default, because emitting an
      // unmapped event would register a handler omp never fires.
      if (!binding) continue;
      for (const agent of b.agents) {
        const list = byAgent.get(agent) ?? [];
        list.push({
          anchor: b.anchor,
          native: binding.event,
          tool: binding.matcher,
          workerTool: OMP_WORKER_TOOL[event],
          command: m.command,
        });
        byAgent.set(agent, list);
      }
    }
  }

  const out: HarnessProjection[] = [];
  for (const [agent, regs] of [...byAgent].sort()) {
    // ⟨native event, tool, command⟩ already registered for this agent. Two acts can
    // land on one native event (`operator.consult.pre` and `subagent.dispatch.pre`
    // are both `tool_call`), and registering the same command twice would run the
    // worker twice per call.
    const seen = new Set<string>();
    const lines: string[] = [];
    for (const r of regs) {
      const key = JSON.stringify([r.native, r.tool ?? '', r.command]);
      if (seen.has(key)) continue;
      seen.add(key);
      lines.push(renderRegistration(r));
    }
    if (lines.length === 0) continue;
    out.push({
      filename: OMP_GUARDRAIL_MODULE,
      scope: agent,
      content: ompExtensionModule(`the agent \`${agent}\``, agent, lines),
    });
  }
  return out;
}

/**
 * Realize the SCOPE-ACTIVATED cells — the ones no agent composes — as one module
 * per scope that must carry them.
 *
 * WHY THIS OP EXISTS AT ALL. `project` asked only for `hooks()`, a settings
 * fragment, and omp keeps no hook config: its loader scans each native config
 * root's `extensions/` dir, so the artifact is a module and the directory is the
 * registration. With nothing to answer, all five of canon's session-scoped cells
 * were warned about and dropped, and this harness deployed no mechanism at all —
 * no stance gate, no drift notice, no memory nudge, no resume notice.
 *
 * ONE MODULE PER SCOPE, and the scopes are the projected agents' own `.agents/
 * <name>/` dirs plus the SESSION root, because a scope's module loads only where
 * that scope's own launch reaches it: the session root is what a bare `omp`
 * scans natively, and an agent's own copy is what that agent's launch spec
 * names in its overlay. Claude registers these once in a user-level
 * `settings.json` that every session reads; the same reach on this harness is
 * N+1 placements.
 *
 * NOT the ambient form `MODEL.md` forbids. That prohibition is on an agent-composed
 * constraint filtering itself at runtime; these cells compose no agent — they bind
 * the session — and nothing emitted here asks who is running.
 */
export function ompScopeActivatedExtensions(
  hooks: readonly Hook[],
  agentNames: readonly string[],
): HarnessProjection[] {
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const hook of hooks) {
    for (const event of hook.events) {
      const binding = ompBindingOf(event);
      // Unrealizable here ⇒ no registration. The cell's loss is reported by the
      // projection seam; registering a handler for an event omp never fires would
      // read as coverage and deliver none.
      if (!binding) continue;
      const reg: OmpRegistration = {
        anchor: hook.id ?? event,
        native: binding.event,
        tool: binding.matcher,
        workerTool: OMP_WORKER_TOOL[event],
        command: hook.command,
      };
      const key = JSON.stringify([reg.native, reg.tool ?? '', reg.command]);
      if (seen.has(key)) continue;
      seen.add(key);
      lines.push(renderRegistration(reg));
    }
  }
  if (lines.length === 0) return [];
  const scopes = [SESSION_SCOPE, ...[...agentNames].sort()];
  return scopes.map((scope) => ({
    filename: OMP_SESSION_MODULE,
    scope,
    content: ompExtensionModule(
      scope === SESSION_SCOPE
        ? 'the SESSION — a launch that named no persona'
        : `every session of the persona \`${scope}\``,
      scope === SESSION_SCOPE ? undefined : scope,
      lines,
    ),
  }));
}

/** One `pi.on(...)` block — narrowed by an `if` when the act names a tool. */
function renderRegistration(r: OmpRegistration): string {
  const refusal = OMP_REFUSAL_SHAPE[r.native];
  const guard = r.tool
    ? `\n    if (event.toolName !== ${JSON.stringify(r.tool)}) return;`
    : '';
  const kind = OMP_ENVELOPE_KIND[r.native];
  // THE VERDICT IS ON STDOUT, NEVER IN THE EXIT CODE, and reading it from the
  // wrong place is how this gate came to refuse work it had never judged. The
  // workers speak the Claude hook contract: a JSON verdict on stdout and `exit 0`
  // UNCONDITIONALLY — `allow`, `deny` and every fail-open path alike. So a
  // nonzero code means the worker MALFUNCTIONED or was not there, which is not a
  // refusal (`fail-open ∀error`), and a zero code means nothing on its own.
  //
  // WHAT THIS REPLACES, because the failure is instructive. The old form read
  // `r.exitCode`, and `ExecResult` is `{stdout, stderr, code, killed}` — there is
  // no `exitCode` on it. `undefined === 127` is false and `undefined !== 0` is
  // TRUE, so the two guards inverted into `{block: true, reason: ""}` on EVERY
  // fire: every `ask` and every `task` call refused, with an empty reason, for
  // reasons the worker never supplied. The `127` line was written to prevent
  // exactly that — "a governance mechanism bricking the session it was supposed to
  // govern" — and it was reading the same absent field, so the guard against the
  // catastrophe was the catastrophe. Measured against the installed binary:
  // `pi.exec("sh", ["-c", "exit 3"])` → `{"stdout":"","stderr":"","code":3,
  // "killed":false}`.
  const cmd = JSON.stringify(r.command);
  const call =
    kind === 'turn'
      ? `judged(${cmd}, ctx, { stop_hook_active: event.stop_hook_active === true }, event.messages ?? [])`
      : kind === 'dispatch'
        ? `judged(${cmd}, ctx, {}, dispatchTurn(event))`
        : kind === 'tool'
          ? (() => {
              const wt = JSON.stringify(r.workerTool ?? r.tool ?? '');
              return `judged(${cmd}, ctx, { tool_name: ${wt}, tool_input: workerInput(${wt}, event.input ?? {}) })`;
            })()
          : `exec(${cmd})`;
  // A BLOCKING EVENT REFUSES, IN THE SHAPE ITS OWN CALLER READS. `tool_call` is
  // answered by the tool wrapper (`{block, reason}`); `session_stop` is answered
  // by the stop pass (`{decision: "block", reason}`, its own type calling itself
  // "Claude/Codex-compatible"). The shapes are not interchangeable and neither
  // site complains about the other's — it returns and refuses nothing.
  //
  // EVERYTHING ELSE HAS TO SPEAK INSTEAD. `tool_result` takes no verdict, so a
  // subagent whose turn collapsed is reported by queueing a continuation, which is
  // the nearest thing to refusing a stop that omp offers there. Delivered once per
  // DISTINCT reason, because delivery re-opens the turn and a worker repeating
  // itself would otherwise re-open it forever; a block's reason carries a
  // per-session count and the worker's no-progress detector turns a genuine repeat
  // into different text, so a real block is never suppressed.
  //
  // `turn.end` USED TO LIVE ON THIS BRANCH, and that was the whole degradation:
  // `agent_end` is notification-only, so the corpus's one turn-end BOUND could
  // only ever steer here. `session_stop` refuses for real, and carries the
  // `stop_hook_active` re-entry flag the worker's own loop-safety needs.
  const act =
    refusal === 'stop'
      ? `
    const reason = await ${call};
    if (reason) return { decision: "block", reason };`
      : refusal
        ? `
    const reason = await ${call};
    if (reason) return { block: true, reason };`
        : kind
          ? `
    const reason = await ${call};
    if (reason && reason !== lastVerdict) {
      lastVerdict = reason;
      pi.sendUserMessage(reason, { deliverAs: "followUp" });
    }`
          : `
    await ${call};`;
  // The handler takes `ctx` only where it judges: that is where the model and the
  // registry come from, and an unused parameter in a generated file reads as a
  // leftover rather than a contract.
  const args = kind ? '(event, ctx: JudgeContext)' : '(event)';
  return `  pi.on(${JSON.stringify(r.native)}, async ${args} => {${guard}${act}
  });
  // ${r.anchor}`;
}

/**
 * Module-level half of the payload bridge — the lines emitted above
 * `export default`, verbatim, when a registration reads an envelope.
 *
 * `OMP_ENVELOPE_KIND` says why this exists at all. What lives HERE is only the
 * two shape translations, in and out: omp's `AgentMessage` blocks (`text` ·
 * `toolCall` · dropped `thinking`) written out as the transcript lines the
 * workers' `jq` already reads, and the workers' stdout verdict read back as a
 * reason string. Translating the SHAPE keeps the extraction semantics — whole
 * turn since the last real user message, tool activity marked, text-only
 * projection for the evidence check — in their one home inside the worker,
 * rather than re-deriving them here in a second language.
 */
const TURN_BRIDGE: readonly string[] = [
  '// THE IDENTITY IS READ FROM PLACEMENT, never asked at runtime: this module sits',
  '// at `<scope>/extensions/`, so its grandparent directory names the scope. A',
  '// persona copy reports that persona; the session root reports its own dir name,',
  '// which is no persona and matches no allowlist — the bare-launch case falls out',
  '// of the placement instead of out of a branch.',
  'const scopeName = basename(dirname(dirname(new URL(import.meta.url).pathname)));',
  '',
  '// The reason last delivered, so an unchanging one is not re-delivered — see the',
  '// `agent_end` registration for why delivery is bounded.',
  'let lastVerdict = "";',
  '',
  "// The judge's own deadline, set well inside omp's 30 s extension-handler kill",
  '// so an unreachable endpoint fails OPEN and quietly instead of costing every',
  '// turn the full budget and then surfacing as `Extension error: handler timed',
  '// out`. A healthy local judge answers this rubric in about two seconds, so the',
  '// margin is wide enough that a slow answer is still heard.',
  'const JUDGE_TIMEOUT_MS = 12_000;',
  '',
  '// Set once the judge misses its deadline, and read on every later turn: an',
  '// endpoint that is away stays away, and re-proving it each turn end taxes the',
  "// whole session. Module scope, so its lifetime is the session's.",
  'let judgeAway = false;',
  '',
  '// One value per module LOAD, and a module is loaded once per session — which is',
  "// exactly the lifetime the workers' per-session state files want.",
  'const sessionId = `omp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;',
  '',
  'type TurnBlock = { type?: string; text?: string; name?: string };',
  'type TurnMessage = { role?: string; content?: string | TurnBlock[] };',
  '',
  '// WHAT THE JUDGE NEEDS OFF THE HANDLER CONTEXT, declared rather than imported.',
  '// `model` and `modelRegistry` are non-enumerable getters on the context omp',
  '// hands every handler — present on every event, invisible to `Object.keys`, and',
  '// not surfaced on the exported `ExtensionContext` type. Naming the two members',
  '// this module actually reads keeps the dependency honest and narrow.',
  'type JudgeContext = {',
  '  model?: Model<Api>;',
  '  modelRegistry?: {',
  '    find(provider: string, modelId: string): Model<Api> | undefined;',
  '    getApiKeyAndHeaders(',
  '      model: Model<Api>,',
  '    ): Promise<{ ok: boolean; apiKey?: string }>;',
  '  };',
  '};',
  '',
  '/** omp messages as the JSONL transcript lines the workers parse. */',
  'function transcriptOf(messages: readonly TurnMessage[]): string {',
  '  const lines: string[] = [];',
  '  for (const m of messages) {',
  '    if (m.role === "user") {',
  '      const content =',
  '        typeof m.content === "string"',
  '          ? m.content',
  '          : (m.content ?? []).flatMap((c) =>',
  '              c.type === "text" ? [{ type: "text", text: c.text }] : [],',
  '            );',
  '      lines.push(JSON.stringify({ type: "user", message: { content } }));',
  '      continue;',
  '    }',
  '    // A tool result carries no text the agent wrote, and the worker skips such',
  '    // lines anyway; emitting them would only pad the file.',
  '    if (m.role !== "assistant" || typeof m.content === "string") continue;',
  '    const content = (m.content ?? []).flatMap((c) =>',
  '      c.type === "text"',
  '        ? [{ type: "text", text: c.text }]',
  '        : c.type === "toolCall"',
  '          ? [{ type: "tool_use", name: c.name }]',
  '          : [],',
  '    );',
  '    lines.push(JSON.stringify({ type: "assistant", message: { content } }));',
  '  }',
  '  return lines.join("\\n");',
  '}',
  '',
  "// omp's TOOL ARGUMENTS, as the shapes the workers' `jq` reads. The other half of",
  '// `OMP_WORKER_TOOL`: naming the tool correctly gets the worker into the right',
  "// branch, and that branch then reads named FIELDS out of `tool_input`. omp's",
  '// `ask` already carries `questions[].question` and `questions[].options[].label`,',
  '// so it passes through untouched; its `task` carries `{context, tasks[]}` and the',
  '// worker reads `.prompt`, so a dispatch would arrive with nothing judgeable and',
  '// be allowed on the worker\'s own "nothing judgeable" guard — a pass that looks',
  '// exactly like a considered verdict.',
  'function workerInput(',
  '  tool: string,',
  '  input: Record<string, unknown>,',
  '): Record<string, unknown> {',
  '  if (tool !== "Agent") return input;',
  '  const tasks = Array.isArray(input.tasks) ? input.tasks : [];',
  '  const prompt = [',
  '    typeof input.context === "string" ? input.context : "",',
  '    ...tasks.map((t) => {',
  '      const one = (t ?? {}) as { task?: unknown };',
  '      return typeof one.task === "string" ? one.task : "";',
  '    }),',
  '  ]',
  '    .filter((s) => s.trim() !== "")',
  '    .join("\\n\\n");',
  '  return prompt ? { ...input, prompt } : input;',
  '}',
  '',
  '// A FINISHED DELEGATION IS A JUDGEABLE TURN, and this is the translation that',
  "// makes it one. `subagent.end` lands on the `task` tool's `tool_result`, whose",
  '// event carries no message list — which was read as "not a turn" and left the',
  '// worker firing on empty stdin. It is a turn: the prompt that launched the',
  "// delegate is the instruction, and the text it returned is the delegate's last",
  '// assistant turn, which is exactly the pair the rubric judges.',
  'function dispatchTurn(event: {',
  '  input?: Record<string, unknown>;',
  '  content?: readonly { type?: string; text?: string }[];',
  '}): TurnMessage[] {',
  '  const i = event.input ?? {};',
  '  const ask = [i.prompt, i.task, i.message, i.description].find(',
  '    (v): v is string => typeof v === "string" && v.trim() !== "",',
  '  );',
  '  const said = (event.content ?? [])',
  '    .filter((c) => c.type === "text" && typeof c.text === "string")',
  '    .map((c) => c.text as string)',
  '    .join("\\n")',
  '    .trim();',
  '  const out: TurnMessage[] = [];',
  '  if (ask) out.push({ role: "user", content: [{ type: "text", text: ask }] });',
  '  if (said)',
  '    out.push({ role: "assistant", content: [{ type: "text", text: said }] });',
  '  return out;',
  '}',
  '',
  "// THE WORKER'S VERDICT, read from where the worker actually writes it. The",
  '// workers speak the Claude hook contract: the verdict is JSON on STDOUT and the',
  '// exit status is 0 on every path — allow, deny, and each fail-open alike. So a',
  '// nonzero `code` is a malfunction rather than a refusal, and anything that does',
  '// not parse into one of the two verdict shapes is silence.',
  '//',
  "// FAILS OPEN AT EVERY STEP, which is the property the canon's hook cells are",
  '// written to (`fail-open ∀error`): a gate that could not run has refused',
  '// nothing, and one that answered unintelligibly has not refused either.',
  'function verdictOf(r: {',
  '  stdout?: string;',
  '  code?: number;',
  '  killed?: boolean;',
  '}): string | undefined {',
  '  if (r.killed || r.code !== 0) return undefined;',
  '  const text = (r.stdout ?? "").trim();',
  '  if (!text.startsWith("{")) return undefined;',
  '  let v: unknown;',
  '  try {',
  '    v = JSON.parse(text);',
  '  } catch {',
  '    return undefined;',
  '  }',
  '  const o = v as {',
  '    decision?: string;',
  '    reason?: string;',
  '    hookSpecificOutput?: {',
  '      permissionDecision?: string;',
  '      permissionDecisionReason?: string;',
  '    };',
  '  };',
  '  // PreToolUse shape (the pre-guard) …',
  '  const pre = o.hookSpecificOutput;',
  '  if (pre?.permissionDecision === "deny") {',
  '    return (pre.permissionDecisionReason ?? "").trim() || undefined;',
  '  }',
  '  // … and the Stop shape (the turn-end guard).',
  '  if (o.decision === "block") return (o.reason ?? "").trim() || undefined;',
  '  return undefined;',
  '}',
  '',
];

/**
 * Function-level half of the bridge — emitted inside `export default`, where `pi`
 * is in scope.
 *
 * The envelope goes to a FILE and arrives by redirect because `ExecOptions` has
 * no stdin slot (signal · timeout · cwd) and the workers read stdin. A temp dir
 * per fire, removed in `finally`, keeps a turn's transcript off any shared path.
 *
 * THE JUDGE RUNS IN THIS PROCESS, and that is the point of `judged()`. The
 * workers' default judge backend spawns `claude -p`: a cross-harness dependency
 * on a foreign vendor's CLI, separately installed and separately authenticated,
 * which on this host had a lapsed OAuth session and therefore failed every
 * verdict open, in silence, on every harness at once. omp holds a model already.
 *
 * So the worker is run TWICE around a model call this module makes itself: once
 * with `STANCE_EMIT_PAYLOAD` to collect the gated, layer-1-annotated payload and
 * the rubric that scores it, then again with `STANCE_VERDICT_FILE` naming the
 * answer. The PROCEDURE — opt-in, agent scope, extraction, the deterministic
 * pre-filter, evidence verification, the block counters — stays in its one home
 * inside the worker, and everything either pass touches before the judge seam is
 * read-only, so the counters see exactly one pass.
 */
const TURN_EXEC: readonly string[] = [
  '  /** Fire the worker once, with `extra` merged into the envelope on stdin. */',
  '  const fire = async (',
  '    cmd: string,',
  '    dir: string,',
  '    extra: Record<string, unknown>,',
  '    env: Record<string, string> = {},',
  '  ) => {',
  '    const envelope = join(dir, "envelope.json");',
  '    writeFileSync(',
  '      envelope,',
  '      JSON.stringify({',
  '        session_id: sessionId,',
  '        cwd: pi.cwd,',
  '        agent_type: scopeName,',
  '        ...extra,',
  '      }),',
  '    );',
  '    // `ExecOptions` carries no env slot either, so it is spelled into the',
  "    // command. Every value here is one of this module's own literals or a temp",
  '    // path it just made — never model output — so the quoting is total.',
  '    const prefix = Object.entries(env)',
  "      .map(([k, v]) => `${k}='${v}' `)",
  '      .join("");',
  '    return await pi.exec("sh", ["-c", `${prefix}${cmd} < ${envelope}`]);',
  '  };',
  '',
  "  /** One judgment, on this session's own provider. `undefined` ⇒ no verdict. */",
  '  const askJudge = async (',
  '    ctx: JudgeContext,',
  '    rubric: string,',
  '    payload: string,',
  '  ): Promise<string | undefined> => {',
  '    // ONE TIMEOUT PER SESSION, NOT ONE PER TURN. A judge that did not answer',
  '    // inside its deadline is away, not slow, and the next turn will find it',
  '    // away too — so paying the full deadline again on every turn end buys',
  '    // nothing and taxes the whole session for an endpoint that is down.',
  '    if (judgeAway) return undefined;',
  '    try {',
  '      // The `advisor` role first: judging on the primary model is an expensive',
  '      // way to ask a small classification question, and omp already has a role',
  '      // whose entire purpose is reviewing this session.',
  '      const roles =',
  '        (pi.pi?.Settings?.instance?.get?.("modelRoles") as',
  '          | Record<string, string>',
  '          | undefined) ?? {};',
  '      const spec = roles.advisor ?? roles.smol ?? roles.tiny ?? "";',
  '      const bare = spec.replace(/:[a-z]+$/, "");',
  '      const cut = bare.indexOf("/");',
  '      const model =',
  '        (cut > 0',
  '          ? ctx.modelRegistry?.find(bare.slice(0, cut), bare.slice(cut + 1))',
  '          : undefined) ?? ctx.model;',
  '      if (!model) return undefined;',
  '      const auth = await ctx.modelRegistry?.getApiKeyAndHeaders(model);',
  "      // BOUNDED BY ITS OWN DEADLINE, well inside the host's. omp kills an",
  '      // extension handler at 30 s, and an unreachable judge does not fail — it',
  '      // HANGS. Without this race a dead endpoint costs every turn the full 30 s',
  '      // and then surfaces as `Extension error: handler timed out`, which reads',
  '      // as the guard being broken rather than the judge being away. Measured on',
  '      // an operator host whose configured `advisor` role pointed at a local',
  '      // server that had stopped answering: a one-word prompt did not return in',
  '      // 20 s, and every turn end paid 30 s.',
  '      //',
  '      // A JUDGE THAT DID NOT ANSWER IN TIME HAS REFUSED NOTHING, so the timeout',
  '      // lands on the same fail-open path as every other error here.',
  '      const answer = await Promise.race([',
  '        completeSimple(',
  '          model,',
  '          {',
  '            systemPrompt: [rubric],',
  '            messages: [',
  '              {',
  '                role: "user",',
  '                content: `=== BEGIN TRANSCRIPT EXCERPT (operator instruction + agent turn) ===\\n${payload}\\n=== END TRANSCRIPT EXCERPT ===\\n\\nApply the rubric. Output ONLY the verdict block.`,',
  '                timestamp: Date.now(),',
  '              },',
  '            ],',
  '          },',
  '          {',
  '            maxTokens: 4096,',
  '            temperature: 0,',
  '            disableReasoning: true,',
  '            sessionId,',
  '            ...(auth?.ok ? { apiKey: auth.apiKey } : {}),',
  '          },',
  '        ),',
  '        new Promise<never>((_, reject) =>',
  '          setTimeout(() => {',
  '            judgeAway = true;',
  '            reject(new Error("stance judge timed out"));',
  '          }, JUDGE_TIMEOUT_MS).unref?.(),',
  '        ),',
  '      ]);',
  '      const text = (answer.content ?? [])',
  '        .filter((c) => c.type === "text" && typeof c.text === "string")',
  '        .map((c) => c.text as string)',
  '        .join("")',
  '        .trim();',
  '      return text || undefined;',
  '    } catch {',
  '      // A judge that could not run has refused nothing.',
  '      return undefined;',
  '    }',
  '  };',
  '',
  '  /** Worker → in-process judge → worker. `undefined` ⇒ no refusal. */',
  '  const judged = async (',
  '    cmd: string,',
  '    ctx: JudgeContext,',
  '    extra: Record<string, unknown>,',
  '    messages?: readonly TurnMessage[],',
  '  ): Promise<string | undefined> => {',
  '    const dir = mkdtempSync(join(tmpdir(), "cratylus-hook-"));',
  '    try {',
  '      let full = extra;',
  '      if (messages) {',
  '        const transcript = join(dir, "transcript.jsonl");',
  '        writeFileSync(transcript, `${transcriptOf(messages)}\\n`);',
  '        full = { transcript_path: transcript, ...extra };',
  '      }',
  '      const asked = await fire(cmd, dir, full, { STANCE_EMIT_PAYLOAD: "1" });',
  '      if (asked.code !== 0) return undefined;',
  '      const head = asked.stdout.trim();',
  '      if (!head.startsWith("{")) return undefined;',
  '      let ask: { rubric?: string; payload?: string };',
  '      try {',
  '        ask = JSON.parse(head);',
  '      } catch {',
  '        return undefined;',
  '      }',
  '      // Nothing emitted ⇒ the worker gated this fire out (opted out, off the',
  '      // allowlist, no judgeable text). Nothing to judge and nothing to report.',
  '      if (!ask.rubric || !ask.payload) return undefined;',
  '      let rubric: string;',
  '      try {',
  '        rubric = readFileSync(ask.rubric, "utf8");',
  '      } catch {',
  '        return undefined;',
  '      }',
  '      const verdict = await askJudge(ctx, rubric, ask.payload);',
  '      if (!verdict) return undefined;',
  '      const file = join(dir, "verdict.txt");',
  '      writeFileSync(file, verdict);',
  '      return verdictOf(',
  '        await fire(cmd, dir, full, { STANCE_VERDICT_FILE: file }),',
  '      );',
  '    } finally {',
  '      rmSync(dir, { recursive: true, force: true });',
  '    }',
  '  };',
];

/**
 * The extension module's text.
 *
 * It names what it governs in a comment and nowhere in its LOGIC, because the
 * logic needs no such name: the file's own location is what limits it. If this
 * module ever grows a check against an env var naming the running persona, that
 * is the tell that the placement was lost and the ambient form crept back.
 *
 * `agent` is the persona whose scope this copy lands in, or `undefined` for the
 * session root — it decides only what the placement note can truthfully say.
 */
function ompExtensionModule(
  governs: string,
  agent: string | undefined,
  registrations: string[],
): string {
  const placement =
    agent === undefined
      ? [
          '// SCOPED BY LOCATION. This module sits in the SESSION config root',
          `// (\`${OMP_SESSION_DIR}/extensions/\`), which a bare \`omp\` — one launched`,
          "// with no persona's launch spec — scans NATIVELY, with no `--config` entry",
          '// required. A persona launch reads its own copy instead and never this one.',
        ]
      : [
          '// SCOPED BY LOCATION, NAMED BY THE LAUNCH SPEC. This module sits in this',
          `// persona's own \`${OMP_SESSION_DIR}/${OMP_PERSONA_DIR}/${agent}/extensions/\` dir, which`,
          `// omp never scans on its own — the \`${OMP_LAUNCHER_FILE}\` launcher is what passes`,
          `// \`--config ${OMP_OVERLAY_FILE}\` once it has resolved this persona by name, and that`,
          '// overlay is what names this directory. A launch that never resolves this',
          "// persona's overlay — including a bare `omp` — never loads this copy.",
        ];
  // The payload bridge is emitted only where a registration reads one, so a module
  // of pure fire-and-forget hooks stays as small as it was. BOTH entries count:
  // `execWithTurn` delegates to `execWithEnvelope`, so a module that only ever
  // calls the latter still needs every line of the bridge.
  const needsTurn = registrations.some((r) => r.includes('judged('));
  return [
    // The regenerate instruction NAMES THE COMMAND, so it interpolates the bin
    // rather than spelling it: a banner telling a host to run a command that no
    // longer exists is worse than no banner, and only derivation survives a rename.
    `// GENERATED by @cratylus/forge — do not hand-edit; regenerate with \`${CLI_BIN} project\`.`,
    `// The constraints in force for ${governs}.`,
    '//',
    ...placement,
    '// There is no identity check below and there must not be one: composition is',
    '// realized by WHERE this file is, not by what it asks at runtime.',
    '',
    ...(needsTurn
      ? [
          "import { readFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';",
          "import { tmpdir } from 'node:os';",
          "import { basename, dirname, join } from 'node:path';",
          // STATIC, and it resolves: omp's extension loader aliases
          // `@oh-my-pi/pi-ai` to its own bundled build, so this is the harness
          // handing the module its own model client rather than a dependency the
          // host has to install. `completeSimple` is the whole of what the judge
          // needs; the richer `judgment` module (`TextJudge`, `chatTextBackend`)
          // exists in omp's source but is NOT in the bundled compat entrypoint the
          // shipped binary carries — importing it silently kills the module load,
          // measured against v18.1.19.
          "import { completeSimple } from '@oh-my-pi/pi-ai';",
          "import type { Api, Model } from '@oh-my-pi/pi-ai';",
        ]
      : []),
    // `ExtensionAPI`, NOT `HookAPI`. omp's own `docs/hooks.md` closes with the
    // fact this module got wrong: "The package root does not re-export `HookAPI`;
    // import legacy hook types from the hooks subpath." A default export is an
    // `ExtensionFactory = (pi: ExtensionAPI) => void | Promise<void>`, and that is
    // the type the root does export. Type-only, so the bad name was erased before
    // it could throw — it broke nobody's session and would fail the first person
    // who typechecked an emitted module.
    "import type { ExtensionAPI } from '@oh-my-pi/pi-coding-agent';",
    '',
    ...(needsTurn ? TURN_BRIDGE : []),
    'export default function (pi: ExtensionAPI) {',
    // `HookAPI.exec(command, args, options?)` — `args` is REQUIRED and the impl
    // does `ptree.exec([command, ...args])`. Passing an options object in its slot
    // made omp spread a non-iterable and every registration in this module died at
    // load with "Spread syntax requires ...iterable[Symbol.iterator] to be a
    // function" — measured against the installed binary, invisible to a stubbed
    // `pi`. There is no `shell` option either (`ExecOptions` is signal · timeout ·
    // cwd), and the commands are shell text carrying `$HOME`, so the shell is
    // named explicitly.
    '  const exec = (cmd: string) => pi.exec("sh", ["-c", cmd]);',
    ...(needsTurn ? TURN_EXEC : []),
    ...registrations,
    '}',
    '',
  ].join('\n');
}

// ── Launch spec → <persona>/omp.yml, <session>/omp-agent ─────────────────────

/**
 * The `--config` overlay's text — identical for every persona; only the
 * DESTINATION (and so the token substituted into it) differs by scope.
 *
 * `{{SCOPE_DIR_TOKEN}}` names this file's OWN eventual directory and is resolved
 * at DEPLOY, never here: omp's `extensions:` entries are resolved with a plain
 * path join against the LAUNCH process's cwd (`resolveExtensionLoadPath` in the
 * installed package's resource loader), never against this file's own directory
 * and never against a shell variable — a literal `$HOME` segment in a config
 * value was measured loading as a directory literally NAMED `$HOME`, not
 * expanded. A relative entry here would therefore point wherever the operator
 * happened to `cd` before running the launcher, and `$HOME` (`export`ed by the
 * launcher, the way `hookCommand` bakes it into a shell command) is exactly the
 * option that fails, because this file is not read by a shell that could expand
 * it. So the path is resolved once, at deploy, from the same `--home` the
 * artifact itself lands under — see `SCOPE_DIR_TOKEN`'s own doc and
 * `deploy/hooks.ts`, which performs the substitution.
 *
 * NAMES THE DIRECTORY, not one file inside it. This persona's own guardrail
 * module and its session module both land in `extensions/`, and a directory
 * entry in `extensions:` sweeps every loose `.ts`/`.js` file inside it — the
 * same routine a native config root's own auto-discovery uses, confirmed
 * against the installed package's `collectAutoExtensionEntries` and reproduced
 * empirically (a directory entry loaded both files; a literal `$HOME` entry
 * failed to resolve at all). Naming one file here by name would silently stop
 * loading the other the day it is added, which is exactly the silent
 * enforcement loss a `--profile`-scanned directory never had.
 */
export function ompOverlayYaml(): string {
  return [
    `# GENERATED by @cratylus/forge — do not hand-edit; regenerate with \`${CLI_BIN} project\`.`,
    '#',
    "# This persona's --config overlay (see ompOverlayYaml in forge's omp adapter",
    '# for why the path below is a directory, and why it is a deploy-time token',
    '# rather than a literal path).',
    'extensions:',
    `  - ${SCOPE_DIR_TOKEN}/extensions`,
    '',
    "# THE CELL IS THE ONLY VOICE. omp's default prompt renders a personality block",
    '# chosen by this setting, and a persona already states its register completely —',
    '# `formality` carries the prose contract, `audience-adaptation` sets density,',
    '# `transparency` and `handoff` fix what a reply discloses and how it ends. A preset',
    '# beside those is a second, uncoordinated statement of the same thing.',
    '#',
    '# `none` and not a preset, because omp runs every SUBAGENT with `none` regardless.',
    '# Left at a preset, one definition means two different voices depending on whether',
    '# it was launched or dispatched — the exact defect the single definition and the',
    "# launcher's `autoloadSkills` rendering close on the other two axes.",
    'personality: none',
    '',
  ].join('\n');
}

/**
 * The launcher's text — ONE script for every persona on the host, which is the
 * whole shape change: the agent is resolved at RUN time out of the definitions
 * omp already discovers, so nothing here is per-agent and nothing has to be
 * regenerated when an agent is added, renamed or retired.
 *
 * TWO WAYS TO NAME THE AGENT, and the second is the one operators actually use.
 * `omp-agent mav` reads `$1`. `mav` — a symlink in a `PATH` dir — reads argv[0]
 * itself, busybox-style, and does NOT consume `$1`, so every remaining word on
 * that command line is omp's own. The dispatch is decided BEFORE the symlink
 * walk, because the walk resolves away the very name argv[0] is carrying.
 *
 * AND IT FOLLOWS SYMLINKS, because `dirname "$0"` alone does not. Linking this
 * script into a `PATH` directory is the normal way to run a persona by name, and
 * `$0` is then the LINK: the launcher computed the link's directory, passed
 * `--config <that dir>/omp.yml`, and omp died with `Config overlay not found:
 * ~/.local/bin/omp.yml` — measured, on an operator's host. Every path below
 * names a descendant of the REAL file's directory, so the real file is what has
 * to be found. Hops are capped the way a kernel caps them, so a link cycle fails
 * the launch instead of hanging it, and `readlink` is used without `-f` (a GNU
 * extension absent from the BSD `readlink` on a stock macOS).
 *
 * IT RESOLVES ITS OWN DIRECTORY rather than a baked-in absolute path, so the
 * SAME bytes are correct whether deploy wrote them under a real `$HOME` or the
 * sandboxed `--home` a test used. `omp.yml`'s abs path has no such option (see
 * `ompOverlayYaml`), but a shell script has a shell, and its own location is a
 * fact true at every site this file can land — unlike `--home`, which the script
 * never sees and does not need to.
 *
 * THE PROMPT IS AN ARGUMENT, NOT A FILE. `--append-system-prompt` takes either,
 * and a temp file is the shape that leaks: this script EXECs, so there would be
 * no process left to remove one. The composed text is a few kilobytes against a
 * multi-megabyte `ARG_MAX`.
 *
 * THE IDENTITY LINE IS THE HARNESS FRAMING, AND IT IS NOT DECORATION. Every
 * adapter must carry the cell's `name` into whatever surface its harness reads
 * an identity from: claude has a front-matter `name:` field, codex has a TOML
 * `name`. A MAIN omp session has neither — `--append-system-prompt` is a TRUE
 * augment, so omp's base prompt survives underneath and asserts its OWN identity
 * ("Oh My Pi coding assistant"). Appending a body headed `# ✈️ mav` therefore
 * leaves TWO identities in one prompt, and which one answers depends on the
 * question. Asked "what is your name and your Prime Principle?" the session
 * answered `mav` and recited cratylism; asked the bare "what is your name?" the
 * SAME session answered "I'm ChatGPT, an AI assistant running in the Oh My Pi
 * harness." Both measured, on `omp/17.2.9`, blank cwd, `--no-skills`. With this
 * line prepended the bare question answers `mav`. It lives HERE rather than in
 * the definition because a DISPATCHED subagent does not need it: there the body
 * IS the entire system prompt, with no rival identity under it.
 *
 * `autoloadSkills` IS HONOURED HERE BECAUSE OMP HONOURS IT ONLY FOR A SPAWN.
 * The field injects skills before a SUBAGENT's first prompt and has no
 * main-session path at all, so one definition would otherwise mean two different
 * things depending on how it was reached. Naming the skills as required reading
 * is the nearest main-session equivalent that exists: the skills are already on
 * disk at `~/.agents/skills/` and already read natively, so the only thing
 * missing was the instruction to read them.
 *
 * BOTH SPELLINGS REACH THIS AWK, and they must. {@link agentToOmpMd} writes the
 * FLOW sequence from a cell's own `Agent.skills`; an operator hand-editing a
 * definition writes YAML's BLOCK sequence. Reading only one of them would drop
 * the declaration in silence, which is the same session as one that never made
 * it.
 */
export const OMP_LAUNCHER_SCRIPT = [
  '#!/bin/sh',
  `# GENERATED by @cratylus/forge — do not hand-edit; regenerate with \`${CLI_BIN} project\`.`,
  '#',
  `# ONE launcher for every persona: \`${OMP_LAUNCHER_FILE} <agent> [omp flags]\`, or a`,
  '# symlink named after the agent (`ln -s … ~/.local/bin/mav`), which is then a',
  "# command taking omp's own flags and nothing else.",
  '',
  '# WHICH AGENT — decided before the symlink walk below, because that walk',
  '# resolves away the very name argv[0] is carrying.',
  'invoked=${0##*/}',
  `if [ "$invoked" = "${OMP_LAUNCHER_FILE}" ]; then`,
  '  if [ "$#" -eq 0 ]; then',
  `    printf 'usage: ${OMP_LAUNCHER_FILE} <agent> [omp flags ...]\\n' >&2`,
  '    exit 2',
  '  fi',
  '  name=$1',
  '  shift',
  'else',
  '  name=$invoked',
  'fi',
  '',
  '# Resolves its own directory rather than a baked-in path: this exact file is',
  '# deployed once, but has to run from wherever it landed - including through a',
  '# symlink in a PATH dir, which holds none of the files named below.',
  'self=$0',
  'hops=0',
  'while [ -L "$self" ] && [ "$hops" -lt 40 ]; do',
  '  hops=$((hops + 1))',
  '  target=$(readlink "$self") || exit 1',
  '  case $target in',
  '    /*) self=$target ;;',
  '    *) self=$(dirname -- "$self")/$target ;;',
  '  esac',
  'done',
  'dir=$(CDPATH= cd -- "$(dirname -- "$self")" && pwd) || exit 1',
  '',
  '# THE DEFINITION IS THE SOURCE OF TRUTH, and it is the same file a DISPATCHED',
  `# subagent of this name reads: omp's own \`${OMP_AGENT_DEF_DIR}/\` dir, one hop below this`,
  '# script, is the user-level task-agent root it discovers from.',
  `def=$dir/${OMP_AGENT_DEF_DIR}/$name.md`,
  'if [ ! -f "$def" ]; then',
  `  printf '${OMP_LAUNCHER_FILE}: no definition for agent %s\\n' "$name" >&2`,
  `  printf '${OMP_LAUNCHER_FILE}: expected it at %s\\n' "$def" >&2`,
  '  exit 1',
  'fi',
  '',
  "# THE BODY IS THE SYSTEM PROMPT. The front-matter is omp's dispatch metadata",
  '# and must never reach the model as literal text, so it is split off here and',
  '# read for one field only. `\\047` spells the apostrophe the surrounding quotes',
  '# cannot; awk unescapes it before the string is used as a regex.',
  `composed=$(awk '`,
  '  function clean(s) { gsub(strip, "", s); return s }',
  '  BEGIN { strip = "^[ \\t\\"\\047]+|[ \\t\\"\\047,]+$" }',
  '  NR == 1 { if ($0 == "---") { fm = 1; next } }',
  '  fm && $0 == "---" { fm = 0; next }',
  '  !fm { if (!started && $0 ~ /^[ \\t]*$/) next; started = 1; print; next }',
  '  list && $0 ~ /^[ \\t]*-[ \\t]*/ {',
  '    s = $0; sub(/^[ \\t]*-[ \\t]*/, "", s); s = clean(s)',
  '    if (s != "") skill[++n] = s',
  '    next',
  '  }',
  '  { list = 0 }',
  '  /^autoloadSkills:/ {',
  '    rest = $0',
  '    sub(/^autoloadSkills:[ \\t]*/, "", rest)',
  '    gsub(/^\\[|\\]$/, "", rest)',
  '    if (rest == "") { list = 1; next }',
  '    m = split(rest, part, ",")',
  '    for (i = 1; i <= m; i++) { s = clean(part[i]); if (s != "") skill[++n] = s }',
  '  }',
  '  END {',
  '    if (n == 0) exit',
  '    printf "\\n## Required reading\\n\\n"',
  '    printf "These skills are REQUIRED reading for this session, not background:\\n"',
  '    printf "read each one in full before you act.\\n\\n"',
  '    for (i = 1; i <= n; i++) printf "- `skill://%s`\\n", skill[i]',
  '  }',
  `' "$def")`,
  'if [ -z "$composed" ]; then',
  `  printf '${OMP_LAUNCHER_FILE}: %s carries no system prompt\\n' "$def" >&2`,
  '  exit 1',
  'fi',
  '',
  "# THE IDENTITY ASSERTION — see this script's own doc for the measurement that",
  '# earned it. Held in a variable so the backticks sit inside single quotes and',
  '# stay literal rather than becoming a command substitution.',
  "id='You are `%s`. That is your name and the identity you answer as in this session, superseding any other name this system prompt gave you.'",
  'append=$(printf "$id\\n\\n%s\\n" "$name" "$composed")',
  '',
  "# The persona's OWN extensions, named by its OWN overlay: the placement that",
  '# makes a mechanism module load under this persona and under no other. Absent',
  '# for a definition forge did not project, which is not an error — that agent is',
  '# launchable, just ungoverned — and passing a `--config` that is not there',
  '# would be a refusal omp prints instead of starting.',
  `overlay=$dir/${OMP_PERSONA_DIR}/$name/${OMP_OVERLAY_FILE}`,
  'if [ -f "$overlay" ]; then',
  '  exec omp --append-system-prompt "$append" --config "$overlay" "$@"',
  'fi',
  'exec omp --append-system-prompt "$append" "$@"',
  '',
].join('\n');

/**
 * The launch spec: ONE generic launcher, plus one `--config` overlay per
 * projected agent.
 *
 * ASYMMETRIC ON PURPOSE. The launcher is SESSION-scoped because it names no
 * agent — it reads one at run time out of the definitions deploy already placed
 * — so a corpus of ten agents ships one script instead of ten identical ones.
 * The overlay is PER-AGENT because it names that persona's own `extensions/`
 * directory, and that naming is exactly what keeps a mechanism module from
 * loading under anybody else.
 *
 * The SESSION scope gets the launcher and never an overlay: a bare `omp` reads
 * the session root's own `extensions/` natively and has no persona to name.
 *
 * AN EMPTY AGENT SET EMITS NOTHING AT ALL, launcher included. A launcher with no
 * definition it could ever resolve is a file that reads as an affordance and
 * delivers a usage error.
 */
export function ompLaunchSurface(
  agentNames: readonly string[],
): HarnessProjection[] {
  if (agentNames.length === 0) return [];
  const out: HarnessProjection[] = [
    {
      filename: OMP_LAUNCHER_FILE,
      scope: SESSION_SCOPE,
      content: OMP_LAUNCHER_SCRIPT,
      executable: true,
    },
  ];
  for (const agent of [...agentNames].sort()) {
    out.push({
      filename: OMP_OVERLAY_FILE,
      scope: agent,
      content: ompOverlayYaml(),
    });
  }
  return out;
}

// ── HarnessAdapter port ──────────────────────────────────────────────────────

/**
 * The omp realization of the `HarnessAdapter` port.
 *
 * No `hooks()`: that op returns a JSON settings fragment for a harness that keeps
 * hook config in a file, and omp keeps none. BOTH halves of the mechanism go
 * through code instead — `enforcingSurface` for the agent-composed constraints and
 * `scopeActivatedSurface` for the cells no agent composes — and each returns
 * `{filename, scope, content}`, which is a `.ts` module and its destination scope.
 *
 * The second half was missing, and `project` reads the ABSENCE of `hooks()` as "no
 * session-scoped surface", so every scope-activated cell degraded here while this
 * header claimed the harness could scope anything it could fire. It can — the
 * claim was true of `enforcingSurface` and there was nothing to answer for the
 * rest.
 */
export const ompHarnessAdapter: HarnessAdapter = {
  name: 'omp',
  substrate: 'harness',
  home: '.omp',
  agentExt: '.md',
  // Declared because the port requires it, and truthful: it is the artifact omp's
  // enforcement lands in. It is never merged into a host config the way claude's
  // `settings.json` and codex's `hooks.json` are, because `hooks()` is absent and
  // deploy therefore has no fragment to merge.
  hooksFile: `extensions/${OMP_GUARDRAIL_MODULE}`,
  // EMPTY ON PURPOSE: omp judges IN-PROCESS. Its emitted extension module holds
  // the session's own model and runs the worker around a judgment it makes
  // itself, so there is no CLI to name and no second process to spawn.
  judgeBin: '',
  agentRel: ompAgentRel,
  nativeEvents: canonicalToOmp,
  realizes: (event) => ompBindingOf(event) !== undefined,
  // SCOPABLE ⇔ REALIZABLE, and for a reason neither sibling has: the mechanism is a
  // file in the agent's own scope dir, so an event omp can fire at all is an event
  // this adapter can narrow to one agent. That is what closes the bootstrap's
  // central finding — that every enforcing fragment degraded to `steer` on omp
  // because there was no identity to scope to. The identity is the agent
  // DEFINITION, and the scope is the directory its overlay names.
  scopes: (event) => ompBindingOf(event) !== undefined,
  // `$HOME` and not a resolved path: the emitted module is read at RUN time on
  // whatever host it lands on, so it must not bake in the projecting machine's home.
  hookCommand: (anchor, workerFilename) =>
    `sh "$HOME/.omp/hooks/${anchor}/${workerFilename}"`,
  agentDef: (a, ctx) => ({
    filename: `${a.name}.md`,
    content: agentToOmpMd(a, ctx),
  }),
  skillDef: (s) => ({ filename: 'SKILL.md', content: skillToOmpMd(s) }),
  skillRel: ompSkillRel,
  // NONE. omp exposes no session id to a child process: no `*_SESSION_ID` variable
  // is set anywhere in `packages/coding-agent/src` (`oh-my-pi@5964a0f`), and the
  // bash tool's env comes from settings alone. Its extensions DO receive
  // `event.sessionId`, but a skill's shim is spawned by the agent, not by a hook.
  // So there is nothing to bridge, and the projected shim says so instead of
  // running sessionless — see `project/runtime-shim.ts`.
  sessionEnvVars: [],
  enforcingSurface: (bindings, mechanisms) =>
    ompGuardrailExtensions(bindings, mechanisms),
  scopeActivatedSurface: (hooks, agentNames) =>
    ompScopeActivatedExtensions(hooks, agentNames),
  launchSurface: (agentNames) => ompLaunchSurface(agentNames),
  // The SESSION scope reads as itself OR as omission, so a caller may pass a
  // projection's `scope` field straight through. Requiring the translation put the
  // same `=== SESSION_SCOPE` conditional at every call site, and a call site that
  // forgot it asked for a persona named `_session`.
  //
  // The overlay and the launcher sit at the scope's OWN top level; the guardrail
  // and session modules sit one level down, in `extensions/`, because that is the
  // subdirectory omp's loader (native scan, or a directory named in `--config`)
  // actually reads — see `OMP_EXTENSION_FILES`.
  //
  // EVERY scope now lives under omp's OWN session root: the SESSION copy at
  // `agent/`, which omp scans natively, and each persona at
  // `agent/personas/<name>/`, which nothing scans and only that persona's own
  // overlay reaches. The two used to straddle two roots — the persona half sat
  // in the harness-NEUTRAL `.agents/`, beside a persona file that no longer
  // lives there — which left the ONE launcher no way to reach an overlay except
  // by hard-coding this module's own layout into shell.
  scopedRel: (filename, agent) => {
    const dir =
      agent === undefined || agent === SESSION_SCOPE
        ? OMP_SESSION_DIR
        : `${OMP_SESSION_DIR}/${OMP_PERSONA_DIR}/${agent}`;
    return OMP_EXTENSION_FILES[filename]
      ? `${dir}/extensions/${filename}`
      : `${dir}/${filename}`;
  },
};
