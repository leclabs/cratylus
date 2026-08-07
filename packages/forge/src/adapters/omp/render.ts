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
import type { HarnessMechanism } from '@cratylus/schema/hook';
import { type ResolvedSkill, agentBody, skillBody } from '../../core/body.js';
import type {
  AgentDefContext,
  HarnessAdapter,
  HarnessProjection,
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

/** Where agent `<name>`'s enforcement module lands, relative to the harness home. */
export function ompExtensionRel(name: string): string {
  return `${ompProfileDir(name)}/extensions/${OMP_GUARDRAIL_MODULE}`;
}

/** The emitted enforcement module's filename — derived, never spelled. */
export const OMP_GUARDRAIL_MODULE = `${CLI_BIN}-guardrails.ts`;

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
      filename: ompExtensionRel(agent),
      content: ompExtensionModule(agent, lines),
    });
  }
  return out;
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
 * It names the agent it governs in a comment and nowhere in its LOGIC, because the
 * logic needs no such name: the file's own location under `profiles/<agent>/` is
 * what limits it. If this module ever grows a `process.env.OMP_PROFILE` check, that
 * is the tell that the placement was lost and the ambient form crept back.
 */
function ompExtensionModule(agent: string, registrations: string[]): string {
  return [
    // The regenerate instruction NAMES THE COMMAND, so it interpolates the bin
    // rather than spelling it: a banner telling a host to run a command that no
    // longer exists is worse than no banner, and only derivation survives a rename.
    `// GENERATED by @cratylus/forge — do not hand-edit; regenerate with \`${CLI_BIN} project\`.`,
    `// The enforcing constraints composed into the agent \`${agent}\`.`,
    '//',
    '// SCOPED BY LOCATION. This module sits in that agent’s own profile dir, which',
    `// omp discovers only under \`--profile ${agent}\` (native config roots are`,
    '// profile-scoped). There is no identity check below and there must not be one:',
    '// composition is realized by WHERE this file is, not by what it asks at runtime.',
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
 * hook config in a file, and omp keeps none. Enforcement goes through
 * `enforcingSurface`, whose `{filename, content}` return is arbitrary bytes — which
 * is exactly a `.ts` module. The port needed no change to accept a harness whose
 * hook surface is a program rather than a config.
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
  enforcingSurface: (bindings, mechanisms) =>
    ompGuardrailExtensions(bindings, mechanisms),
};
