// The omp adapter's gates.
//
// Each leg pins a fact that was MEASURED — against `@oh-my-pi/pi-coding-agent`'s
// own source, or empirically against an installed `omp` binary — and would
// otherwise be held by prose alone. Where a leg exists because something went
// wrong, the wrong thing is named — a fixture pinned to a law outlives the
// incident that produced it, and one pinned to the incident is a museum piece.

import { execFileSync } from 'node:child_process';
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, posix } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  OMP_GUARDRAIL_MODULE,
  OMP_LAUNCHER_FILE,
  OMP_OVERLAY_FILE,
  OMP_REFUSAL_SHAPE,
  OMP_SESSION_DIR,
  OMP_SESSION_MODULE,
  agentToOmpAppendSystem,
  canonicalActToOmp,
  canonicalToOmp,
  ompAgentRel,
  ompBindingOf,
  ompGuardrailExtensions,
  ompHarnessAdapter,
  ompLaunchSurface,
  ompScopeActivatedExtensions,
  ompSkillRel,
} from '../../src/adapters/omp/index.js';
import { SCOPE_DIR_TOKEN } from '../../src/core/harness-adapter.js';
import { runtimeShimContent } from '../../src/project/runtime-shim.js';
import { FIXTURE_MANIFEST } from '../fixture-manifest.js';

/** Temp dirs the one leg below that touches disk creates — it RUNS the launcher,
 *  which is the only way its path resolution is observable. */
const tmp: string[] = [];
afterEach(() => {
  for (const d of tmp) rmSync(d, { recursive: true, force: true });
  tmp.length = 0;
});

const AGENT = {
  name: 'mav',
  description: 'the builder',
  archetype: 'Hero archetype of end-to-end delivery',
  objective: 'delivery ⟨end-to-end integrated green⟩',
} as never;

const CTX = { manifest: FIXTURE_MANIFEST } as never;

describe('omp persona projection', () => {
  it('asserts the agent NAME before anything else', () => {
    const out = agentToOmpAppendSystem(AGENT, CTX);
    // The identity line is the harness framing: omp has no `name` FIELD — not in
    // front-matter, not in a config, not on the session — so prose is the only
    // surface that carries it. Claude and codex both have a field and neither had
    // to solve this.
    expect(out.split('\n')[0]).toContain('You are `mav`');
  });

  it('emits NO front-matter — omp appends this file as raw prose', () => {
    const out = agentToOmpAppendSystem(AGENT, CTX);
    // A `---` fence here would reach the agent as literal text in its own context,
    // because `--append-system-prompt` does not parse what it appends. This is the
    // exact defect the bootstrap's `awk`-strip of the claude face was working
    // around, and the reason that strip is retired.
    expect(out.startsWith('---')).toBe(false);
    expect(out).not.toContain('\n---\n');
  });

  it('still carries the composed body, not merely the name', () => {
    // The assertion above passes trivially if the body were dropped. Both legs, or
    // the first one is measuring nothing — a persona file containing only "You are
    // `mav`" would satisfy it and carry no dimensions at all.
    const out = agentToOmpAppendSystem(AGENT, CTX);
    expect(out).toContain('## Archetype');
    expect(out).toContain('Hero archetype of end-to-end delivery');
    expect(out).toContain('delivery ⟨end-to-end integrated green⟩');
  });
});

describe('omp event map', () => {
  it('binds turn.end to session_stop — not turn_end, and not agent_end', () => {
    // omp's "turn" is a MODEL turn — `turnIndex` increments within one user
    // exchange — so `turn_end` fires several times per exchange. Binding the
    // memory nudge there would have produced a nudge storm that reads as the CELL
    // misbehaving rather than the mapping.
    //
    // `agent_end` was the first replacement and it is notification-only: it takes
    // no result, so a turn-end BOUND degraded to a queued continuation there.
    // `session_stop` is awaited before settle and takes the Claude-compatible
    // `{decision: "block", reason}`, so the bound is a bound on this harness too.
    expect(canonicalToOmp['turn.end']).toBe('session_stop');
    expect(Object.values(canonicalToOmp)).not.toContain('turn_end');
    expect(Object.values(canonicalToOmp)).not.toContain('agent_end');
  });

  it('binds prompt.submit to an event that actually carries the prompt', () => {
    // `TurnStartEvent` is `{type, turnIndex, timestamp}` — the moment, not the
    // content. A cell binding `prompt.submit` needs the text.
    expect(canonicalToOmp['prompt.submit']).toBe('before_agent_start');
  });

  it('declares NO unnarrowed loss on any act, because a hook here is CODE', () => {
    // Codex must report every act unnarrowed: its only selector is a regex over
    // `agent_type`. omp's hook is a TypeScript module that receives `toolName`, so
    // narrowing is an `if`. If this ever gains an `unnarrowed`, the adapter has
    // silently lost the ability to filter and the report must say so.
    for (const [act, binding] of Object.entries(canonicalActToOmp)) {
      expect(binding.matcher, `${act} must name its tool`).toBeTruthy();
      expect(binding.unnarrowed, `${act} claims a loss omp does not have`).toBe(
        undefined,
      );
    }
  });

  it('answers an ACT and a plain event through ONE question', () => {
    expect(ompBindingOf('subagent.dispatch.pre')).toEqual({
      event: 'tool_call',
      matcher: 'task',
    });
    expect(ompBindingOf('session.start')).toEqual({ event: 'session_start' });
    expect(ompBindingOf('vcs.commit.post')).toBeUndefined();
  });
});

describe('omp scoping', () => {
  it("scopes every event it realizes — the persona's own dir IS the scope", () => {
    // This is the shard's whole finding. The bootstrap concluded every enforcing
    // fragment degrades to `steer` on omp because there was no identity to scope
    // to. There is: the persona's own `.agents/<name>/extensions/` dir. A module
    // written there loads under that persona's launch spec and no other.
    for (const canonical of Object.keys(canonicalToOmp)) {
      expect(ompHarnessAdapter.realizes(canonical)).toBe(true);
      expect(
        ompHarnessAdapter.scopes(canonical),
        `${canonical} realizable but unscopable`,
      ).toBe(true);
    }
  });

  it('never claims to scope what it cannot realize (MODEL: scopable ⇒ realizable)', () => {
    expect(ompHarnessAdapter.realizes('vcs.commit.post')).toBe(false);
    expect(ompHarnessAdapter.scopes('vcs.commit.post')).toBe(false);
  });

  it('lands the persona and its guardrails under the SAME scope directory', () => {
    // If these ever disagree, the persona loads for one directory and its
    // guardrails for another — enforcement silently governing the wrong agent,
    // which is the widening MODEL forbids outright. NOT a profile any more: both
    // now live one level out of `.omp`, at the harness-neutral `.agents` root.
    expect(ompAgentRel('mav')).toBe('../.agents/mav/APPEND_SYSTEM.md');
    const guardrailRel = ompHarnessAdapter.scopedRel?.(
      OMP_GUARDRAIL_MODULE,
      'mav',
    );
    expect(guardrailRel).toBe(
      `../.agents/mav/extensions/${OMP_GUARDRAIL_MODULE}`,
    );
    expect(posix.dirname(ompAgentRel('mav'))).toBe(
      posix.dirname(posix.dirname(guardrailRel as string)),
    );
  });

  it('does NOT scope through any `profiles/` dir — that carrier is retired', () => {
    expect(ompAgentRel('mav')).not.toMatch(/profiles\//);
    expect(
      ompHarnessAdapter.scopedRel?.(OMP_GUARDRAIL_MODULE, 'mav'),
    ).not.toMatch(/profiles\//);
    expect(ompSkillRel('wake', ['mav'])[0]).not.toMatch(/profiles\//);
  });
});

describe('omp skill destination', () => {
  it('returns exactly ONE destination — the harness-neutral root, no fan-out', () => {
    // The old fan-out (session root + one copy per profile) existed only because
    // a persona WAS a profile, isolated from every other. Identity moved to a
    // launch spec; every launch, personaed or bare, now reads the SAME
    // `~/.agents/skills` natively, so one copy serves every reader.
    expect(ompSkillRel('wake', ['mav', 'nico'])).toEqual([
      '../.agents/skills/wake',
    ]);
  });

  it('ignores the agent set — it is unused now, not merely unread', () => {
    expect(ompSkillRel('wake', [])).toEqual(
      ompSkillRel('wake', ['mav', 'nico']),
    );
  });
});

describe('omp enforcing surface', () => {
  const MECH = new Map([
    ['stance', { command: 'sh "$HOME/.omp/hooks/stance/w.sh"' }],
  ]) as never;
  const binding = (agents: string[], events: string[]) => ({
    anchor: 'stance',
    fragment: { substrate: 'harness', events, realizedBy: 'stance' },
    agents,
  });

  it('emits ONE module per composing agent, each in that agent’s own scope dir', () => {
    const out = ompGuardrailExtensions(
      [binding(['mav', 'nico'], ['turn.end'])] as never,
      MECH,
    );
    // A scoped artifact carries its SCOPE, and the destination is the adapter's to
    // compute — the render tree stages by scope so deploy can ask. Asserting both
    // halves keeps the pair that has to agree in one place.
    expect(out.map((f) => [f.scope, f.filename]).sort()).toEqual([
      ['mav', OMP_GUARDRAIL_MODULE],
      ['nico', OMP_GUARDRAIL_MODULE],
    ]);
    expect(
      out.map((f) => ompHarnessAdapter.scopedRel?.(f.filename, f.scope)),
    ).toEqual([
      `../.agents/mav/extensions/${OMP_GUARDRAIL_MODULE}`,
      `../.agents/nico/extensions/${OMP_GUARDRAIL_MODULE}`,
    ]);
  });

  it('writes NO runtime identity check — the location is the scope', () => {
    // The easy read of this harness is one global module branching on an env var
    // naming the running persona. That is precisely the "runtime self-filter"
    // `MODEL.md`'s ENFORCED clause forbids, and it is invisible once written —
    // the file still looks scoped. Placement needs no filter to be correct.
    const [mod] = ompGuardrailExtensions(
      [binding(['mav'], ['turn.end'])] as never,
      MECH,
    );
    expect(mod?.content).not.toMatch(/OMP_PROFILE|getActiveProfile/);
  });

  it('narrows an act to its tool, and does not narrow a plain event', () => {
    const [act] = ompGuardrailExtensions(
      [binding(['mav'], ['subagent.dispatch.pre'])] as never,
      MECH,
    );
    expect(act?.content).toContain('event.toolName !== "task"');
    const [plain] = ompGuardrailExtensions(
      [binding(['mav'], ['session.start'])] as never,
      MECH,
    );
    expect(plain?.content).not.toContain('toolName');
  });

  it('registers a blocking handler ONLY where omp can actually block', () => {
    expect(OMP_REFUSAL_SHAPE.tool_call).toBe('tool');
    const [blocking] = ompGuardrailExtensions(
      [binding(['mav'], ['tool.use.pre'])] as never,
      MECH,
    );
    expect(blocking?.content).toContain('block: true');
    const [nonBlocking] = ompGuardrailExtensions(
      [binding(['mav'], ['session.start'])] as never,
      MECH,
    );
    // A `block` on an event omp does not read one from is a guardrail that reports
    // enforcement it never performs.
    expect(nonBlocking?.content).not.toContain('block: true');
  });

  it('refuses a turn on `session_stop`, in that event own result shape', () => {
    // `turn.end` sat on `agent_end`, which omp documents as notification-only and
    // which takes no result — so the corpus's one turn-end BOUND could only queue
    // a `sendUserMessage` continuation. `session_stop` is the real analogue of
    // claude's `Stop`: its result type's own doc-comment says "Claude/Codex-
    // compatible block decision", and the two shapes are not interchangeable —
    // `{block: true}` at the stop pass returns and refuses nothing.
    const [stop] = ompGuardrailExtensions(
      [binding(['mav'], ['turn.end'])] as never,
      MECH,
    );
    expect(stop?.content).toContain('pi.on("session_stop"');
    expect(stop?.content).toContain('return { decision: "block", reason }');
    expect(stop?.content).not.toContain('pi.on("agent_end"');
    // The re-entry flag the worker's own loop-safety reads, which `agent_end` had
    // no field for — so the guard could have blocked its own unblocking forever.
    expect(stop?.content).toContain('stop_hook_active: event.stop_hook_active');
  });

  it('hands a turn event its PAYLOAD, because omp gives the worker no stdin', () => {
    // THE DEFECT THIS PINS SHIPPED, AND IT WAS SILENT. The workers are written to
    // the Claude hook contract — a JSON envelope on stdin naming a JSONL transcript
    // — and the shim used to fire them with no stdin at all. `input="$(cat)"` read
    // empty, the worker exited at its first guard, and `agent_end` reported nothing
    // for every turn of every omp session. A gate that is deployed, opted in, and
    // judging NOTHING looks exactly like a gate finding no fault.
    const [turn] = ompGuardrailExtensions(
      [binding(['mav'], ['turn.end'])] as never,
      MECH,
    );
    expect(turn?.content).toContain('execWithTurn(');
    expect(turn?.content).toContain('transcript_path');
    // A continuation is how a NON-blocking event speaks. `turn.end` no longer
    // needs one — `session_stop` refuses outright — but `subagent.end` lands on
    // `tool_result`, which takes no verdict, so there it stays the only channel,
    // bounded to a CHANGED reason or an unreachable judge re-opens forever.
    const [sub] = ompGuardrailExtensions(
      [binding(['mav'], ['subagent.end'])] as never,
      MECH,
    );
    expect(sub?.content).toContain('sendUserMessage');
    expect(sub?.content).toContain('!== lastVerdict');
    expect(turn?.content).not.toContain('sendUserMessage');

    // An event that carries no turn stays a bare fire: handing one a transcript
    // would assert it is a turn, which it is not.
    const [bare] = ompGuardrailExtensions(
      [binding(['mav'], ['session.start'])] as never,
      MECH,
    );
    expect(bare?.content).not.toContain('execWithTurn(');
  });

  it('reads the verdict off STDOUT and a nonzero `code`, never `exitCode`', () => {
    // THE WORST DEFECT THIS ADAPTER HAS SHIPPED, and it is one misspelled field.
    // `ExecResult` is `{stdout, stderr, code, killed}` — measured against the
    // installed binary, `pi.exec("sh", ["-c", "exit 3"])` answers
    // `{"stdout":"","stderr":"","code":3,"killed":false}`. The emitted module read
    // `r.exitCode`, so `undefined === 127` was false and `undefined !== 0` was
    // TRUE: every `ask` and every `task` call came back `{block: true, reason: ""}`
    // whatever the worker decided. The gate did not fail open — it refused
    // everything, with no reason, having judged nothing. A persona whose `ask` and
    // `task` are both bricked is unusable, which is how the deployed modules came
    // to be deleted from `.agents/<name>/extensions/` by hand.
    const emitted = ompGuardrailExtensions(
      [binding(['mav'], ['tool.use.pre', 'turn.end'])] as never,
      MECH,
    )
      .map((p) => p.content)
      .join('\n');
    expect(emitted).not.toContain('exitCode');
    // The workers exit 0 on EVERY path — allow, deny, and each fail-open alike —
    // and write their verdict as JSON on stdout. So a nonzero code is a
    // malfunction, and the two verdict shapes are what a refusal looks like.
    expect(emitted).toContain('r.code !== 0');
    expect(emitted).toContain('permissionDecision === "deny"');
    expect(emitted).toContain('o.decision === "block"');
  });

  it('hands a tool_call its envelope, under the name the WORKER matches on', () => {
    // Naming it `ask` reaches the worker's `case` and falls through to its `*)`
    // allow branch, so the pre-guard permitted every call it was installed to
    // judge. The worker's wire contract is the Claude hook contract; on omp the
    // shim writes the envelope, so the shim owes it that spelling.
    const [pre] = ompGuardrailExtensions(
      [binding(['mav'], ['operator.consult.pre'])] as never,
      MECH,
    );
    expect(pre?.content).toContain('if (event.toolName !== "ask") return;');
    expect(pre?.content).toContain('tool_name: "AskUserQuestion"');
    expect(pre?.content).toContain('tool_input: workerInput(');
  });

  it('judges a finished dispatch, which IS a turn', () => {
    // `subagent.end` lands on the `task` tool's `tool_result`, which carries no
    // message list — read as "not a turn" and left firing on empty stdin, so the
    // subagent leg judged nothing. The prompt that launched the delegate plus the
    // text it returned is exactly the pair the rubric judges.
    const [res] = ompGuardrailExtensions(
      [binding(['mav'], ['subagent.end'])] as never,
      MECH,
    );
    expect(res?.content).toContain('dispatchTurn(event)');
    expect(res?.content).toContain('transcript_path');
  });

  it('emits nothing when the mechanism is absent — and that is the codex bug', () => {
    // EXONERATING FIXTURE. Without a mechanism there is no command to wire, so
    // emitting nothing is correct. What was NOT correct was reaching this state
    // because the port dropped `mechanisms` on the floor: codex's adapter wired
    // `enforcingSurface` at arity 1, so every call took this branch and its
    // per-agent guardrails reached the host as nothing at all — green throughout,
    // because the unit tests call the function DIRECTLY with a mechanism map the
    // production path never supplies.
    expect(
      ompGuardrailExtensions([binding(['mav'], ['turn.end'])] as never),
    ).toEqual([]);
  });
});

describe('omp scope-activated surface', () => {
  // The cells no agent composes — canon's stance gate, drift notice, memory nudge.
  // On claude they land in ONE user-level `settings.json` that every session reads;
  // omp has no such file and each scope is its own directory, so the same reach is
  // one module per scope. Before this op existed the projector read the absence of
  // `hooks()` as "no session-scoped surface" and dropped all five.
  const hook = (events: string[]) =>
    ({
      id: 'stance-guardrail',
      events,
      command: 'sh "$HOME/.omp/hooks/stance-guardrail/w.sh"',
    }) as never;
  const HOOK = hook(['turn.end']);

  it('carries the SESSION scope and one scope per projected agent', () => {
    const out = ompScopeActivatedExtensions([HOOK], ['mav', 'nico']);
    expect(out.map((f) => f.scope)).toEqual(['_session', 'mav', 'nico']);
    // The session copy is what a bare `omp` launch loads natively; a persona
    // launch reads its own copy — named by ITS OWN `--config` overlay — and
    // never this one.
    expect(
      out.map((f) => ompHarnessAdapter.scopedRel?.(f.filename, f.scope)),
    ).toEqual([
      `${OMP_SESSION_DIR}/extensions/${OMP_SESSION_MODULE}`,
      `../.agents/mav/extensions/${OMP_SESSION_MODULE}`,
      `../.agents/nico/extensions/${OMP_SESSION_MODULE}`,
    ]);
  });

  it('registers the cell’s native event and its worker command', () => {
    const [mod] = ompScopeActivatedExtensions([HOOK], []);
    expect(mod?.content).toContain('pi.on("session_stop"');
    expect(mod?.content).toContain('hooks/stance-guardrail/w.sh');
  });

  it('emits nothing for an event omp cannot fire', () => {
    // A registration for an unmapped event is a handler the harness never calls —
    // coverage on paper. The projector reports the loss; this returns nothing.
    expect(
      ompScopeActivatedExtensions([hook(['git.commit.post'])], ['mav']),
    ).toEqual([]);
  });
});

describe('omp launch spec', () => {
  it('emits an overlay and an executable launcher, per projected agent, sorted', () => {
    const out = ompLaunchSurface(['nico', 'mav']);
    expect(out.map((f) => [f.scope, f.filename])).toEqual([
      ['mav', OMP_OVERLAY_FILE],
      ['mav', OMP_LAUNCHER_FILE],
      ['nico', OMP_OVERLAY_FILE],
      ['nico', OMP_LAUNCHER_FILE],
    ]);
  });

  it('lands the launcher executable — an unexecutable one is dead on the host', () => {
    const [, launcher] = ompLaunchSurface(['mav']);
    expect(launcher?.executable).toBe(true);
    expect(launcher?.content).toContain('#!/bin/sh');
  });

  it('never emits for the SESSION scope — a bare `omp` needs no launch spec', () => {
    expect(ompLaunchSurface([]).map((f) => f.scope)).not.toContain('_session');
  });

  it('resolves its own directory when run through a symlink, not the link’s', () => {
    // HOW A LAUNCHER IS ACTUALLY RUN: linked into a `PATH` dir under the
    // persona's name. That directory holds neither file the launcher names, and
    // a script that read only `dirname "$0"` handed omp the LINK's directory -
    // measured on an operator's host as `Config overlay not found:
    // ~/.local/bin/omp.yml`, a persona unlaunchable by its own name.
    //
    // Asserted by RUNNING it against an `omp` that records its argv, because the
    // resolution is only observable in what gets exec'd. A `toContain('dirname')`
    // assertion passed throughout the defect.
    const [, launcher] = ompLaunchSurface(['mav']);
    const scopeDir = mkdtempSync(join(tmpdir(), 'omp-scope-'));
    const binDir = mkdtempSync(join(tmpdir(), 'omp-bin-'));
    tmp.push(scopeDir, binDir);
    const argvLog = join(binDir, 'argv');
    writeFileSync(join(scopeDir, OMP_LAUNCHER_FILE), launcher?.content ?? '', {
      mode: 0o755,
    });
    writeFileSync(
      join(binDir, 'omp'),
      `#!/bin/sh\nprintf '%s\\n' "$@" > ${argvLog}\n`,
      { mode: 0o755 },
    );
    symlinkSync(join(scopeDir, OMP_LAUNCHER_FILE), join(binDir, 'mav'));

    execFileSync(join(binDir, 'mav'), [], {
      env: { ...process.env, PATH: `${binDir}:${process.env.PATH ?? ''}` },
    });

    const argv = readFileSync(argvLog, 'utf-8').split('\n');
    expect(argv).toContain(join(scopeDir, OMP_OVERLAY_FILE));
    expect(argv).toContain(join(scopeDir, 'APPEND_SYSTEM.md'));
    // And no absolute path was baked in at projection: the script is identical
    // for every persona and every `--home`.
    expect(launcher?.content).not.toMatch(/\/home\/|\/Users\//);
  });

  it('the overlay names the DIRECTORY, so it covers the guardrail module too', () => {
    // A single named file here would silently stop loading whichever module was
    // NOT named the day a second one is added — the exact enforcement loss the
    // profile carrier never had (its directory scan swept both unconditionally).
    const [overlay] = ompLaunchSurface(['mav']);
    expect(overlay?.content).toContain(`${SCOPE_DIR_TOKEN}/extensions`);
    expect(overlay?.content).not.toContain(OMP_SESSION_MODULE);
    expect(overlay?.content).not.toContain(OMP_GUARDRAIL_MODULE);
  });

  it('names exactly the directory the deployed modules actually land in', () => {
    // THE FAILURE MODE THIS GUARDS. A launcher (or its overlay) naming a
    // directory nobody placed anything into is a persona that starts with none
    // of its own governance loaded, silently. `scopedRel` is deploy's own
    // destination map — the same one that places `OMP_SESSION_MODULE` — so this
    // pins the overlay's implicit directory against the ONE place the module is
    // ever actually written.
    const [overlay] = ompLaunchSurface(['mav']);
    const overlayRel = ompHarnessAdapter.scopedRel?.(
      overlay?.filename as string,
      'mav',
    ) as string;
    const moduleRel = ompHarnessAdapter.scopedRel?.(
      OMP_SESSION_MODULE,
      'mav',
    ) as string;
    expect(`${posix.dirname(overlayRel)}/extensions`).toBe(
      posix.dirname(moduleRel),
    );
  });
});

describe('omp names no session, and the projected shim says so', () => {
  it('declares an EMPTY session-var list', () => {
    // Measured, not assumed: no `*_SESSION_ID` variable is set for a child process
    // anywhere in omp's coding-agent source. The emitter used to stamp claude's two
    // names into this harness's shims, asserting a bridge with no far end.
    expect(ompHarnessAdapter.sessionEnvVars).toEqual([]);
  });

  it('REFUSES instead of running sessionless, and names the way out', () => {
    const shim = runtimeShimContent('memory', ompHarnessAdapter.sessionEnvVars);
    expect(shim).not.toMatch(/CLAUDE/);
    expect(shim).toContain('process.exit(3)');
    // The refusal has to be actionable: a sessionless invocation mints a fresh id
    // per call, and the lock it takes is held against a pid that already exited.
    expect(shim).toContain('AGENT_SESSION_ID_FROM');
  });
});
