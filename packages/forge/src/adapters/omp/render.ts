// The OMP (Oh My Pi) projection of the agent anatomy — the third harness, and the
// first whose per-agent scope is a DIRECTORY rather than a file or a selector.
//
// omp's native surfaces differ from both siblings, and every difference below was
// read off `@oh-my-pi/pi-coding-agent@17.2.9`'s own source, not inferred:
//
//   - a PERSONA is `profiles/<name>/agent/APPEND_SYSTEM.md`. There is no `--agent`
//     flag and no session-level identity field; `--profile <name>` is the only NAME
//     an omp launch carries, and the profile's agent dir is auto-discovered
//     (`main.ts:827-838, 881`) and applied "without bypassing system prompt
//     templates" (`main.ts:840-841`) — a TRUE augment of the base prompt.
//   - a SKILL is `skills/<name>/SKILL.md` (the AgentSkills spec, shared with claude
//     and codex).
//   - ENFORCEMENT is a TypeScript module in `profiles/<name>/agent/extensions/`.
//     omp has no hook CONFIG at all: `discoverExtensionPaths`
//     (`extensions/loader.ts:580-615`) scans the `extensions/` dir of each native
//     config root and binds loose `.ts`/`.js` factories through the extension
//     runner. Nothing declares a hook — the directory IS the declaration.
//
// THE SCOPE IS THE DIRECTORY, and that is the whole reason this adapter exists.
// Claude attaches a hook inside a subagent's own front-matter, so attachment is the
// scope. Codex declares hooks globally and must re-express per-agent intent as a
// generated `matcher` regex. omp does neither: because the native config root is
// PROFILE-SCOPED (`discovery/builtin.ts:65-70` — "Native user config is
// profile-scoped"), a module written into `profiles/mav/agent/extensions/` loads
// under `--profile mav` and under nothing else.
//
// So composition is realized STRUCTURALLY here, with no selector and no runtime
// self-filter — which matters, because `MODEL.md`'s `ENFORCED` forbids the ambient
// form outright ("¬ ambient : COMPOSITION is the scope, ¬ a runtime self-filter").
// Emitting one global module that branched on `process.env.OMP_PROFILE` would have
// been the easy read of this harness and would have written exactly the runtime
// self-filter MODEL names. Placing the file where only the composing agent can load
// it needs no filter to be correct.
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
  SESSION_SCOPE,
} from '../../core/harness-adapter.js';
import { OMP_BLOCKING_EVENTS, canonicalToOmp, ompBindingOf } from './events.js';

export type { ResolvedSkill };

/**
 * The profile-relative home of one agent, and THE ONE PLACE the layout is spelled.
 *
 * Every other path in this module is built from it, so the render tree and the
 * deploy target cannot disagree about where an omp agent lives — the divergence
 * that would show up only on a host, and only after a deploy.
 */
export function ompProfileDir(name: string): string {
  return `profiles/${name}/agent`;
}

/** Where agent `<name>`'s persona lands, relative to the harness home (`.omp`). */
export function ompAgentRel(name: string): string {
  return `${ompProfileDir(name)}/APPEND_SYSTEM.md`;
}

/**
 * The SESSION root — the native user config dir of a launch that named no
 * profile, relative to the harness home.
 *
 * omp's native user config is profile-scoped: `getAgentDir()` is
 * `~/.omp/profiles/<name>/agent` under `--profile <name>` and `~/.omp/agent`
 * otherwise (`discovery/builtin.ts`, "Native user config is profile-scoped"). So
 * this is a peer of `ompProfileDir`, not its parent: the scope a plain `omp`
 * session reads, and the one every persona profile does NOT see.
 */
export const OMP_SESSION_DIR = 'agent';

/**
 * Where skill `<name>` lands, relative to the harness home — one path per scope
 * that must be able to load it.
 *
 * **`skills/<name>` IS NOT ONE OF THEM, AND THAT WAS THE BUG.** The deploy layer
 * used the render tree's own staging layout as every harness's destination, so an
 * omp deploy wrote `~/.omp/skills/`, a directory omp never scans: the native
 * provider scans `getAgentDir()/skills` (`discovery/builtin.ts`, the user-level
 * `scanSkillsFromDir` call). Measured on `fire`, whose `~/.omp/skills` held a
 * byte-perfect projection that no session could load; it looked like it worked
 * only because that host's `~/.claude/skills` carried the same corpus and omp's
 * claude provider reads that base under every profile.
 *
 * PROFILE SCOPE IS WHY THIS IS PLURAL. A skill in the session root is invisible
 * to `--profile mav`, and one in mav's profile is invisible to every other launch,
 * so a corpus whose skills are shared by all its agents lands once per scope.
 * That is the cost of the harness's isolation model, paid honestly here rather
 * than by hand on each host — which is what the operator had to do on `upmav`.
 */
export function ompSkillRel(
  name: string,
  agents: readonly string[],
): readonly string[] {
  return [
    `${OMP_SESSION_DIR}/skills/${name}`,
    ...agents.map((a) => `${ompProfileDir(a)}/skills/${name}`),
  ];
}

/** Where a mechanism module lands for agent `<name>`, relative to the harness
 *  home. */
export function ompExtensionRel(name: string): string {
  return `${ompProfileDir(name)}/extensions/${OMP_GUARDRAIL_MODULE}`;
}

/** The emitted enforcement module's filename — derived, never spelled. */
export const OMP_GUARDRAIL_MODULE = `${CLI_BIN}-guardrails.ts`;

/** The emitted SCOPE-ACTIVATED module's filename. A second file rather than more
 *  registrations in the first, because the two halves retire independently: the
 *  guardrails follow the agents that compose them, these follow the cells. */
export const OMP_SESSION_MODULE = `${CLI_BIN}-session.ts`;

// ── Agent projection → profiles/<name>/agent/APPEND_SYSTEM.md ────────────────

/**
 * The omp persona file: an identity assertion, then the composed Target body.
 *
 * **No front-matter**, because omp reads this file as raw prose to append to the
 * system prompt — claude's `---` block is that harness's selection syntax and
 * codex's TOML fields are its own, and either would arrive here as literal text in
 * the agent's own context.
 *
 * **THE FIRST LINE IS THE HARNESS FRAMING, AND IT IS NOT DECORATION.** Every
 * adapter must carry the cell's `name` into whatever surface its harness reads an
 * identity from: claude has a front-matter `name:` field, codex has a TOML `name`.
 * omp has NO field at all — a profile is a directory, and the only channel into the
 * session is the prompt text itself. So the name is carried in prose, which is the
 * one surface available, and that is the same act the siblings perform, not a
 * different one.
 *
 * It earns its place by measurement. `--append-system-prompt` is a TRUE augment:
 * omp's base prompt survives underneath, and that base asserts its OWN identity
 * ("Oh My Pi coding assistant"). Appending a body headed `# ✈️ mav` therefore leaves
 * TWO identities in one prompt, and which one answers depends on the question. Asked
 * "what is your name and your Prime Principle?" the session answered `mav` and
 * recited cratylism; asked the bare "what is your name?" the SAME session answered
 * "I'm ChatGPT, an AI assistant running in the Oh My Pi harness." Both measured, on
 * `omp/17.2.9`, blank cwd, `--no-skills`. With this line prepended the bare question
 * answers `mav.`
 *
 * That asymmetry is the cost of augmenting rather than replacing, and it is worth
 * paying: `--system-prompt` would win the identity outright and drop the context
 * files, the tool documentation and the `xd://` catalog with it
 * (`system-prompt.ts:899-919`). Asserting the name is the cheap half of what
 * replacement would have bought, without the expensive half.
 */
export function agentToOmpAppendSystem(a: Agent, ctx: AgentDefContext): string {
  const identity = `You are \`${a.name}\`. That is your name and the identity you answer as in this session, superseding any other name this system prompt gave you.`;
  return `${identity}\n\n${agentBody(a, ctx.manifest).replace(/\n+$/, '')}\n`;
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

// ── Enforcement → profiles/<name>/agent/extensions/<bin>-guardrails.ts ──────

/** One `pi.on(...)` registration, already narrowed to its act where it has one. */
interface OmpRegistration {
  readonly anchor: string;
  readonly native: string;
  readonly tool: string | undefined;
  readonly command: string;
}

/**
 * Realize the canon's per-agent constraints as one TypeScript extension module PER
 * AGENT, written where only that agent's profile can load it.
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
 * ONE MODULE PER SCOPE, and the scopes are the projected agents' profiles plus the
 * SESSION root, because omp's native user config is profile-scoped: a module in
 * the session root does not load under `--profile mav`, and mav's does not load
 * anywhere else. Claude registers these once in a user-level `settings.json` that
 * every session reads; the same reach on this harness is N+1 placements.
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
        ? 'the SESSION — a launch that named no profile'
        : `every session of the profile \`${scope}\``,
      scope === SESSION_SCOPE ? undefined : scope,
      lines,
    ),
  }));
}

/** One `pi.on(...)` block — narrowed by an `if` when the act names a tool. */
function renderRegistration(r: OmpRegistration): string {
  const blocking = OMP_BLOCKING_EVENTS.has(r.native);
  const guard = r.tool
    ? `\n    if (event.toolName !== ${JSON.stringify(r.tool)}) return;`
    : '';
  // A blocking event's worker exit code is the verdict; a non-blocking one's is
  // advisory. Only `tool_call` takes a result omp acts on, so only it reads one.
  const act = blocking
    ? `
    const r = await exec(${JSON.stringify(r.command)});
    if (r.exitCode !== 0) {
      return { block: true, reason: r.stderr.trim() || r.stdout.trim() };
    }`
    : `
    await exec(${JSON.stringify(r.command)});`;
  return `  pi.on(${JSON.stringify(r.native)}, async (event) => {${guard}${act}
  });
  // ${r.anchor}`;
}

/**
 * The extension module's text.
 *
 * It names what it governs in a comment and nowhere in its LOGIC, because the
 * logic needs no such name: the file's own location is what limits it. If this
 * module ever grows a `process.env.OMP_PROFILE` check, that is the tell that the
 * placement was lost and the ambient form crept back.
 *
 * `profile` is the profile whose dir this copy lands in, or `undefined` for the
 * session root — it decides only what the placement note can truthfully say.
 */
function ompExtensionModule(
  governs: string,
  profile: string | undefined,
  registrations: string[],
): string {
  const placement =
    profile === undefined
      ? [
          '// SCOPED BY LOCATION. This module sits in the SESSION config root, which omp',
          '// discovers when no profile is named (native config roots are profile-scoped,',
          '// so a profile launch reads its own copy of this file and never this one).',
        ]
      : [
          '// SCOPED BY LOCATION. This module sits in that profile’s own dir, which',
          `// omp discovers only under \`--profile ${profile}\` (native config roots are`,
          '// profile-scoped).',
        ];
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
    "import type { HookAPI } from '@oh-my-pi/pi-coding-agent';",
    '',
    'export default function (pi: HookAPI) {',
    '  const exec = (cmd: string) => pi.exec(cmd, { shell: true });',
    ...registrations,
    '}',
    '',
  ].join('\n');
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
  agentRel: ompAgentRel,
  nativeEvents: canonicalToOmp,
  realizes: (event) => ompBindingOf(event) !== undefined,
  // SCOPABLE ⇔ REALIZABLE, and for a reason neither sibling has: the mechanism is a
  // file in the agent's own profile dir, so an event omp can fire at all is an event
  // this adapter can narrow to one agent. That is what closes the bootstrap's
  // central finding — that every enforcing fragment degraded to `steer` on omp
  // because there was no identity to scope to. The identity is the profile, and the
  // scope is its directory.
  scopes: (event) => ompBindingOf(event) !== undefined,
  // `$HOME` and not a resolved path: the emitted module is read at RUN time on
  // whatever host it lands on, so it must not bake in the projecting machine's home.
  hookCommand: (anchor, workerFilename) =>
    `sh "$HOME/.omp/hooks/${anchor}/${workerFilename}"`,
  agentDef: (a, ctx) => ({
    filename: `${a.name}.md`,
    content: agentToOmpAppendSystem(a, ctx),
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
  // The SESSION scope reads as itself OR as omission, so a caller may pass a
  // projection's `scope` field straight through. Requiring the translation put the
  // same `=== SESSION_SCOPE` conditional at every call site, and a call site that
  // forgot it asked for a profile named `_session`.
  enforcingRel: (filename, agent) =>
    agent === undefined || agent === SESSION_SCOPE
      ? `${OMP_SESSION_DIR}/extensions/${filename}`
      : `${ompProfileDir(agent)}/extensions/${filename}`,
};
