// The OMP (Oh My Pi) projection of the agent anatomy — the third harness, and the
// first whose per-agent scope is a DIRECTORY rather than a file or a selector.
//
// IDENTITY IS THE LAUNCH SPEC, NOT THE PROFILE. omp's own `--profile <name>`
// silos AUTH, MCP, MODELS, SESSIONS and `agent.db` — an ENVIRONMENT, and a
// property of the HOST an operator is running on, not of the agent this module
// composes. An earlier design conflated the two: it projected each persona INTO
// a profile (`profiles/<name>/agent/APPEND_SYSTEM.md`), so composing a persona
// silently forked the operator's whole session state along with it. This
// adapter now projects a LAUNCH SPEC instead — `--append-system-prompt` plus
// `--config`, combined by a generated launcher — carried out of a
// harness-neutral `~/.agents/` root. A profile and a persona are ORTHOGONAL
// facts about one launch; an operator who wants both still can
// (`--profile work ~/.agents/mav/omp-launch`), and forge asserts neither for
// them.
//
// omp's native surfaces, read off `@oh-my-pi/pi-coding-agent`'s own source and,
// where noted, re-measured against an installed `omp` binary while building
// this launch spec:
//
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
// THE SCOPE IS STILL THE DIRECTORY — `~/.agents/<name>/extensions/` — and that
// is still the whole reason this adapter exists. Claude attaches a hook inside a
// subagent's own front-matter, so attachment is the scope. Codex declares hooks
// globally and must re-express per-agent intent as a generated `matcher` regex.
// omp needs neither: a module sitting where only the composing persona's OWN
// `--config` overlay names it loads under that persona and no other.
//
// COMPOSITION STAYS STRUCTURAL. `MODEL.md`'s `ENFORCED` clause ("¬ ambient :
// COMPOSITION is the scope, ¬ a runtime self-filter") held under the profile
// carrier because a module in `profiles/mav/agent/extensions/` loaded only
// under `--profile mav`; it holds under the launch spec for the identical
// reason, one step removed — the overlay names EXACTLY the extensions that
// persona's launch loads, so nothing in the module itself asks who is running.
// Emitting one global module that branched on an env var would still have been
// the ambient form this clause forbids; naming a scope's own directory in that
// scope's own overlay is composition by placement, same as it always was.
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
  SCOPE_DIR_TOKEN,
  SESSION_SCOPE,
} from '../../core/harness-adapter.js';
import { OMP_BLOCKING_EVENTS, canonicalToOmp, ompBindingOf } from './events.js';

export type { ResolvedSkill };

/** Where agent `<name>`'s persona lands, relative to the harness home (`.omp`) —
 *  one directory OUT, at the harness-neutral `.agents` root a launch spec is
 *  carried from.
 *
 *  `APPEND_SYSTEM.md` is omp's OWN vocabulary for what `--append-system-prompt`
 *  reads, not this repo's — kept as the filename (rather than, say, `mav.md`)
 *  so an operator who still wants a `--profile` carrier can symlink
 *  `profiles/<name>/agent/APPEND_SYSTEM.md` to this file by hand. Forge itself
 *  never writes that symlink or that directory — see the module header. */
export function ompAgentRel(name: string): string {
  return `../.agents/${name}/APPEND_SYSTEM.md`;
}

/**
 * The SESSION root — the native user config dir of a launch that carries no
 * launch spec at all (a bare `omp`), relative to the harness home.
 *
 * omp's native user config is `~/.omp/agent` (`getAgentDir()`,
 * `discovery/builtin.ts`) when no `--profile` names another. This is where
 * the SESSION-scoped mechanism module lands — the copy every launch, personaed
 * or bare, that never overrides `--profile` reads automatically, with no
 * `--config` entry required, because it sits on omp's own scan path.
 */
export const OMP_SESSION_DIR = 'agent';

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
  return [`../.agents/skills/${name}`];
}

/** The emitted enforcement module's filename — derived, never spelled. */
export const OMP_GUARDRAIL_MODULE = `${CLI_BIN}-guardrails.ts`;

/** The emitted SCOPE-ACTIVATED module's filename. A second file rather than more
 *  registrations in the first, because the two halves retire independently: the
 *  guardrails follow the agents that compose them, these follow the cells. */
export const OMP_SESSION_MODULE = `${CLI_BIN}-session.ts`;

/** The launch spec's `--config` overlay filename. */
export const OMP_OVERLAY_FILE = 'omp.yml';

/** The launch spec's launcher filename — no extension, because it is invoked
 *  directly (`./omp-launch`), never sourced or required. */
export const OMP_LAUNCHER_FILE = 'omp-launch';

// The two filenames that must resolve inside a scope's `extensions/`
// subdirectory rather than at the scope's own top level — the launch spec's
// overlay and launcher are the operator's entry points and are never
// themselves scanned as extensions, so they stay one level up from what they
// name.
const OMP_EXTENSION_FILES: Readonly<Record<string, true>> = {
  [OMP_GUARDRAIL_MODULE]: true,
  [OMP_SESSION_MODULE]: true,
};

// ── Agent projection → ../.agents/<name>/APPEND_SYSTEM.md ────────────────────

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
 * omp has NO field at all — a launch spec is combined flags, and the only channel
 * into the session is the prompt text itself. So the name is carried in prose,
 * which is the one surface available, and that is the same act the siblings
 * perform, not a different one.
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

// ── Enforcement → <scope>/extensions/<bin>-guardrails.ts ─────────────────────

/** One `pi.on(...)` registration, already narrowed to its act where it has one. */
interface OmpRegistration {
  readonly anchor: string;
  readonly native: string;
  readonly tool: string | undefined;
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
  const blocking = OMP_BLOCKING_EVENTS.has(r.native);
  const guard = r.tool
    ? `\n    if (event.toolName !== ${JSON.stringify(r.tool)}) return;`
    : '';
  // A blocking event's worker exit code is the verdict; a non-blocking one's is
  // advisory. Only `tool_call` takes a result omp acts on, so only it reads one.
  //
  // 127 IS NOT A VERDICT. `sh -c` returns it when the worker is not there at all,
  // and reading that as "the gate refused" turns every missing worker into a host
  // that blocks `ask` and `task` with `No such file` as its reason — a governance
  // mechanism bricking the session it was supposed to govern. The canon's own hook
  // cells are written fail-open (`fail-open ∀error`), and a gate that cannot RUN
  // has not refused anything.
  const act = blocking
    ? `
    const r = await exec(${JSON.stringify(r.command)});
    if (r.exitCode === 127) return;
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
          `// persona's own \`.agents/${agent}/extensions/\` dir, which omp never scans on`,
          "// its own — that persona's `omp-launch` script is what passes `--config",
          '// omp.yml`, and that overlay is what names this directory. A launch that',
          "// never resolves this persona's overlay — including a bare `omp` — never",
          '// loads this copy.',
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
    // `HookAPI.exec(command, args, options?)` — `args` is REQUIRED and the impl
    // does `ptree.exec([command, ...args])`. Passing an options object in its slot
    // made omp spread a non-iterable and every registration in this module died at
    // load with "Spread syntax requires ...iterable[Symbol.iterator] to be a
    // function" — measured against the installed binary, invisible to a stubbed
    // `pi`. There is no `shell` option either (`ExecOptions` is signal · timeout ·
    // cwd), and the commands are shell text carrying `$HOME`, so the shell is
    // named explicitly.
    '  const exec = (cmd: string) => pi.exec("sh", ["-c", cmd]);',
    ...registrations,
    '}',
    '',
  ].join('\n');
}

// ── Launch spec → <scope>/omp.yml, <scope>/omp-launch ────────────────────────

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
  ].join('\n');
}

/**
 * The launcher's text — identical for every persona: it resolves ITS OWN
 * directory rather than a baked-in absolute path, so the SAME script is correct
 * whether deploy wrote it under a real `$HOME` or a sandboxed
 * `--home` a test used. `omp.yml`'s abs path has no such option (see
 * `ompOverlayYaml`), but a shell script has a shell, and `$(dirname "$0")` is a
 * fact true at every site this file can land — unlike `--home`, which the
 * script never sees and does not need to.
 */
export const OMP_LAUNCHER_SCRIPT = [
  '#!/bin/sh',
  `# GENERATED by @cratylus/forge — do not hand-edit; regenerate with \`${CLI_BIN} project\`.`,
  '#',
  '# Resolves its own directory rather than a baked-in path: this exact file is',
  '# deployed once, but has to run from wherever it landed.',
  'dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd) || exit 1',
  'exec omp --append-system-prompt "$dir/APPEND_SYSTEM.md" --config "$dir/omp.yml" "$@"',
  '',
].join('\n');

/**
 * The launch spec, one set per projected agent — the overlay and the launcher
 * that combine `--append-system-prompt` and `--config` into a single command,
 * scoped like `ompGuardrailExtensions`'s output so both land beside the
 * mechanism modules they wire.
 *
 * NEVER emitted for {@link SESSION_SCOPE}: the session root has no persona to
 * launch AS, and a bare `omp` needs neither flag.
 */
export function ompLaunchSurface(
  agentNames: readonly string[],
): HarnessProjection[] {
  const out: HarnessProjection[] = [];
  for (const agent of [...agentNames].sort()) {
    out.push({
      filename: OMP_OVERLAY_FILE,
      scope: agent,
      content: ompOverlayYaml(),
    });
    out.push({
      filename: OMP_LAUNCHER_FILE,
      scope: agent,
      content: OMP_LAUNCHER_SCRIPT,
      executable: true,
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
  agentRel: ompAgentRel,
  nativeEvents: canonicalToOmp,
  realizes: (event) => ompBindingOf(event) !== undefined,
  // SCOPABLE ⇔ REALIZABLE, and for a reason neither sibling has: the mechanism is a
  // file in the agent's own scope dir, so an event omp can fire at all is an event
  // this adapter can narrow to one agent. That is what closes the bootstrap's
  // central finding — that every enforcing fragment degraded to `steer` on omp
  // because there was no identity to scope to. The identity is the launch spec's
  // own directory, and the scope is that directory.
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
  scopedRel: (filename, agent) => {
    const dir =
      agent === undefined || agent === SESSION_SCOPE
        ? OMP_SESSION_DIR
        : `../.agents/${agent}`;
    return OMP_EXTENSION_FILES[filename]
      ? `${dir}/extensions/${filename}`
      : `${dir}/${filename}`;
  },
};
