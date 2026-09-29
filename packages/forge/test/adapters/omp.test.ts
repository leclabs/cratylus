// The omp adapter's gates.
//
// Each leg pins a fact that was MEASURED — against `@oh-my-pi/pi-coding-agent`'s
// own source, or empirically against an installed `omp` binary — and would
// otherwise be held by prose alone. Where a leg exists because something went
// wrong, the wrong thing is named — a fixture pinned to a law outlives the
// incident that produced it, and one pinned to the incident is a museum piece.

import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, posix } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  OMP_AGENT_DEF_DIR,
  OMP_GUARDRAIL_MODULE,
  OMP_LAUNCHER_FILE,
  OMP_OVERLAY_FILE,
  OMP_PERSONA_BADGE_MODULE,
  OMP_PERSONA_DIR,
  OMP_REFUSAL_SHAPE,
  OMP_SESSION_DIR,
  OMP_SESSION_MODULE,
  OMP_STANCE_MANIFEST,
  agentToOmpMd,
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
import { adapterByName } from '../../src/adapters/registry/index.js';
import {
  SCOPE_DIR_TOKEN,
  SESSION_SCOPE,
} from '../../src/core/harness-adapter.js';
import { runtimeShimContent } from '../../src/project/runtime-shim.js';
import { FIXTURE_MANIFEST } from '../fixture-manifest.js';

/** Temp dirs the legs below that touch disk create — they RUN the launcher,
 *  which is the only way its resolution is observable. */
const tmp: string[] = [];
afterEach(() => {
  for (const d of tmp) rmSync(d, { recursive: true, force: true });
  tmp.length = 0;
});

const AGENT = {
  name: 'mav',
  // A colon-space, because that is the character sequence a plain YAML scalar
  // may not carry and a real corpus description does ("…and canon: dimension
  // catalogs"). Unquoted, the emitted document is a scanner error and omp falls
  // back to a naive line parser, warning once per discovery pass.
  description: 'the builder: ships things',
  archetype: 'Hero archetype of end-to-end delivery',
  objective: 'delivery ⟨end-to-end integrated green⟩',
} as never;

const CTX = { manifest: FIXTURE_MANIFEST } as never;

/**
 * The emitted front-matter, read back as `key → value` — and REFUSING what
 * YAML refuses, which is the whole reason it is not a three-line split.
 *
 * NO YAML LIBRARY, and none is wanted: forge depends on no parser, and the
 * escaping this projection uses — YAML's DOUBLE-QUOTED style — is the JSON
 * string family for the two characters it escapes (`\` and `"`), so
 * `JSON.parse` on a delimited value is a real round trip through a reader this
 * repo already has. A reader that merely split on the first `: ` would accept
 * the exact document YAML rejects, which is to say it would BE the lenient
 * fallback this projection exists to stay out of.
 */
function frontMatter(md: string): Record<string, string> {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(md);
  if (!m) throw new Error('no front-matter fence');
  const out: Record<string, string> = {};
  for (const line of (m[1] as string).split('\n')) {
    const at = line.indexOf(': ');
    const key = line.slice(0, at);
    const raw = line.slice(at + 2);
    if (raw.startsWith('"')) {
      out[key] = JSON.parse(raw) as string;
      continue;
    }
    // A PLAIN scalar, held to YAML's own two rules for one: it may carry
    // neither `: ` (that opens a mapping) nor ` #` (that opens a comment).
    // Either makes the document a scanner error omp survives only by falling
    // back to a line parser, warning once per discovery pass.
    if (raw.includes(': ') || raw.includes(' #')) {
      throw new Error(`plain scalar is not legal YAML: ${key}`);
    }
    out[key] = raw;
  }
  return out;
}

describe('omp agent definition', () => {
  it('carries the two fields omp REQUIRES, and nothing else for an agent holding no role', () => {
    // `parseAgentFields` treats a missing `name` or `description` as a parse
    // failure and SKIPS the file — a persona that silently does not exist. The
    // REST of what omp accepts here (`tools`, `spawns`, `thinking-level`, …) is
    // the host's own dispatch policy, so forge asserts none of it. `model` names
    // the ROLE the host routes by and is emitted only for an agent that holds
    // one, and `autoloadSkills` only for one given skills; this agent has
    // neither, so neither key is here.
    expect(frontMatter(agentToOmpMd(AGENT, CTX))).toEqual({
      name: 'mav',
      description: 'the builder: ships things',
    });
  });

  it('names the held role as its model route — the role, then the default, never a model', () => {
    // The definition names the ROLE the host routes by; which MODEL fills that
    // role is the host's `modelRoles` entry. Both aliases start with `@`, which
    // YAML forbids unquoted, so they ride as double-quoted strings, and the
    // position matters to whoever reads the file: after `description`, before
    // `autoloadSkills`. Read off the RENDERED STRING for that reason.
    const md = agentToOmpMd(
      {
        ...(AGENT as object),
        holds: 'implementer',
        skills: ['design'],
      } as never,
      CTX,
    );
    const fence = (/^---\n([\s\S]*?)\n---\n/.exec(md)?.[1] as string).split(
      '\n',
    );
    expect(fence.map((l) => l.split(':')[0])).toEqual([
      'name',
      'description',
      'model',
      'autoloadSkills',
    ]);
    expect(fence[2]).toBe('model: ["@implementer", "@default"]');
    // No concrete model id: two `@` aliases and nothing else survives a JSON read.
    const route = JSON.parse((fence[2] as string).slice('model: '.length));
    expect(route).toEqual(['@implementer', '@default']);
  });

  it('escapes a held role the way it escapes any other YAML string', () => {
    const md = agentToOmpMd(
      { ...(AGENT as object), holds: 'a "b" \\c' } as never,
      CTX,
    );
    const line = md.split('\n').find((l) => l.startsWith('model: ')) as string;
    expect(JSON.parse(line.slice('model: '.length))).toEqual([
      '@a "b" \\c',
      '@default',
    ]);
  });

  it('emits `autoloadSkills` for an agent given skills, and only then', () => {
    // The front-matter key that describes the COMPOSED AGENT rather than the
    // host's dispatch policy — with `model`, which names its role. The list is the closure
    // projection hands the adapter, rendered in the order it arrives. omp
    // honours it for a DISPATCHED subagent; `OMP_LAUNCHER_SCRIPT` reads the same
    // key back out for a MAIN session, which has no native path for it — so the
    // list reaching these bytes is what makes one definition mean one thing.
    //
    // Read off the RENDERED STRING rather than through `frontMatter`: the claim
    // is about the bytes omp's own YAML reader will see, including the quoting
    // and the position of the key inside the fence.
    const declared = agentToOmpMd(
      { ...(AGENT as object), skills: ['design', 'deliver'] } as never,
      CTX,
    );
    expect(declared).toContain(
      '\nautoloadSkills: ["design", "deliver"]\n---\n',
    );

    // The negative half, and it has teeth: a third key emitted unconditionally
    // would put `autoloadSkills: []` into every definition that declares none —
    // a list omp parses to empty and a launcher renders as nothing, which is
    // noise that reads like a declaration. An EMPTY list is treated as absent
    // for the same reason.
    for (const bare of [AGENT, { ...(AGENT as object), skills: [] } as never]) {
      const fence = /^---\n([\s\S]*?)\n---\n/.exec(
        agentToOmpMd(bare, CTX),
      )?.[1] as string;
      expect(fence.split('\n')).toHaveLength(2);
      expect(fence).not.toContain('autoloadSkills');
    }
  });

  it('survives a description carrying the characters YAML reserves', () => {
    // A plain scalar may not contain `: `, and a real corpus description does
    // ("…and canon: dimension catalogs") — unquoted, the document is a scanner
    // error that omp survives only by falling back to a naive `key: value` line
    // parser, invisible until a description grows something the fallback loses
    // too. The round trip is the claim: whatever goes in comes back out.
    const gnarly = 'a "quote", a \\ and a colon: here';
    const out = agentToOmpMd(
      { ...(AGENT as object), description: gnarly } as never,
      CTX,
    );
    expect(frontMatter(out).description).toBe(gnarly);
  });

  it('asserts NO identity line — the launcher owns that sentence now', () => {
    // It used to open the body, because this file WAS the appended prompt and
    // omp's base prompt asserts its own identity underneath. A DISPATCHED
    // subagent reads this body as its ENTIRE system prompt, with no rival
    // identity under it, so the sentence would be redundant there.
    const body = agentToOmpMd(AGENT, CTX).split('\n---\n')[1] ?? '';
    expect(body).not.toContain('You are `mav`');
  });

  it('still carries the composed body, not merely the front-matter', () => {
    // The legs above pass trivially if the body were dropped: a file of two
    // front-matter fields and nothing else would satisfy every one of them and
    // carry no dimensions at all.
    const out = agentToOmpMd(AGENT, CTX);
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
    // to. There is: the persona's own `agent/personas/<name>/extensions/` dir. A
    // module written there loads under that persona's launch and no other.
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

  it('lands the persona DEFINITION where omp discovers agents natively', () => {
    // The whole point of the shape: `~/.omp/agent/agents/<name>.md` is the
    // user-level task-agent root, so the same composed agent is DISPATCHABLE as
    // a subagent and launchable as a session. Its predecessor
    // (`../.agents/<name>/APPEND_SYSTEM.md`) was a launch ARGUMENT omp's own
    // discovery could not see, so only one of those two was ever possible.
    expect(ompAgentRel('mav')).toBe(
      `${OMP_SESSION_DIR}/${OMP_AGENT_DEF_DIR}/mav.md`,
    );
  });

  it("lands a persona's guardrails in a dir NOTHING scans but its own overlay", () => {
    // The negative half of the scoping claim, and the one that has teeth: if a
    // mechanism module landed anywhere omp scans natively, it would govern every
    // session on the host, which is the widening MODEL forbids outright. The
    // session root (`agent/extensions/`) is the ONLY natively-scanned directory
    // here, and a persona's copy must not be under it.
    const guardrailRel = ompHarnessAdapter.scopedRel?.(
      OMP_GUARDRAIL_MODULE,
      'mav',
    ) as string;
    expect(guardrailRel).toBe(
      `${OMP_SESSION_DIR}/${OMP_PERSONA_DIR}/mav/extensions/${OMP_GUARDRAIL_MODULE}`,
    );
    expect(posix.dirname(guardrailRel)).not.toBe(
      `${OMP_SESSION_DIR}/extensions`,
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
      `${OMP_SESSION_DIR}/${OMP_PERSONA_DIR}/mav/extensions/${OMP_GUARDRAIL_MODULE}`,
      `${OMP_SESSION_DIR}/${OMP_PERSONA_DIR}/nico/extensions/${OMP_GUARDRAIL_MODULE}`,
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
    expect(turn?.content).toContain('judged(');
    expect(turn?.content).toContain('transcript_path');
    // A continuation is how a NON-blocking event speaks its VERDICT. `turn.end`
    // no longer needs one — `session_stop` refuses outright — but `subagent.end`
    // lands on `tool_result`, which takes no verdict, so there it stays the only
    // channel, bounded to a CHANGED reason or an unreachable judge re-opens
    // forever. The assertion names the verdict channel specifically: the shared
    // bridge also announces DARKNESS that way, and an announcement that the gate
    // did not run is not a refusal travelling by the wrong road.
    const [sub] = ompGuardrailExtensions(
      [binding(['mav'], ['subagent.end'])] as never,
      MECH,
    );
    expect(sub?.content).toContain('sendUserMessage(reason');
    expect(sub?.content).toContain('!== lastVerdict');
    expect(turn?.content).not.toContain('sendUserMessage(reason');

    // An event that carries no turn stays a bare fire: handing one a transcript
    // would assert it is a turn, which it is not.
    const [bare] = ompGuardrailExtensions(
      [binding(['mav'], ['session.start'])] as never,
      MECH,
    );
    expect(bare?.content).not.toContain('judged(');
  });

  it('announces a judge that did not answer, instead of returning silently', () => {
    // THE DEFECT THIS PINS RAN FOR FIVE HOURS AND NOBODY SAW IT. The bridge used
    // to `return undefined` the moment the judge produced nothing, so the worker
    // was never fired a second time and its own `dark` line — "this turn was NOT
    // judged; the absence of a block is an absence of a verdict, not a clean one"
    // — was unreachable in this harness. A latched-away endpoint then read as an
    // unbroken run of clean turns. Failing OPEN is the correct enforcement
    // posture; failing open SILENTLY is the bypass.
    const [turn] = ompGuardrailExtensions(
      [binding(['mav'], ['turn.end'])] as never,
      MECH,
    );
    // The empty file is what reaches the worker's own announcement: it re-fires
    // rather than short-circuiting on a missing verdict.
    expect(turn?.content).toContain('writeFileSync(file, verdict ?? "")');
    expect(turn?.content).not.toContain('if (!verdict) return undefined');
    // Announced ONCE — the miss latch holds, so an unbounded notice would repeat
    // one unchanging line at every later turn end.
    expect(turn?.content).toContain('lastDark');
    expect(turn?.content).toContain('sendUserMessage(out');
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

  it('bounds the judge with its own deadline, latched by a run of misses', () => {
    // AN UNREACHABLE JUDGE DOES NOT FAIL — IT HANGS, and omp kills an extension
    // handler at 30 s. Without a deadline of its own the guard costs every turn
    // the full budget and then surfaces as `Extension error: handler timed out`,
    // which reads as the guard being broken rather than the judge being away.
    // Measured on an operator host whose configured `advisor` role pointed at a
    // local server that had stopped answering: a ONE-WORD prompt did not return
    // in 20 s, and every turn end paid 30 s.
    //
    // LATCHED BY A RUN, NOT BY ONE MISS. It was a boolean set by the first
    // timeout, on the reasoning that an endpoint which was away stays away —
    // true of the dead LAN box it was written for, false of a healthy provider
    // having one slow call. Measured on a live session: the advisor answered a
    // real turn, then missed once, and every later turn went unjudged for an
    // outage that had already passed. The latch still earns its place; it just
    // has to be earned more than once, and any answer clears the run.
    const [turn] = ompGuardrailExtensions(
      [binding(['mav'], ['turn.end'])] as never,
      MECH,
    );
    expect(turn?.content).toContain('Promise.race');
    expect(turn?.content).toContain('JUDGE_TIMEOUT_MS');
    expect(turn?.content).toContain('if (judgeMisses >= JUDGE_MISS_LIMIT)');
    expect(turn?.content).toContain('judgeMisses += 1;');
    expect(turn?.content).toContain('if (text) judgeMisses = 0;');
    expect(turn?.content).not.toContain('judgeAway = true');
    // Inside omp's 30 s handler kill, or the deadline never fires — and with real
    // margin above a measured judge call: 9.3 s for a 9 KB payload against the
    // 29 KB rubric, which the previous 12 s budget brushed on a short turn.
    const ms = /const JUDGE_TIMEOUT_MS = ([\d_]+);/.exec(turn?.content ?? '');
    expect(ms).not.toBeNull();
    const budget = Number(ms?.[1]?.replaceAll('_', ''));
    expect(budget).toBeLessThan(30_000);
    expect(budget).toBeGreaterThan(15_000);
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
    const mods = out.filter((f) => f.filename === OMP_SESSION_MODULE);
    expect(mods.map((f) => f.scope)).toEqual(['_session', 'mav', 'nico']);
    // The session copy is what a bare `omp` launch loads natively; a persona
    // launch reads its own copy — named by ITS OWN `--config` overlay — and
    // never this one.
    expect(
      mods.map((f) => ompHarnessAdapter.scopedRel?.(f.filename, f.scope)),
    ).toEqual([
      `${OMP_SESSION_DIR}/extensions/${OMP_SESSION_MODULE}`,
      `${OMP_SESSION_DIR}/${OMP_PERSONA_DIR}/mav/extensions/${OMP_SESSION_MODULE}`,
      `${OMP_SESSION_DIR}/${OMP_PERSONA_DIR}/nico/extensions/${OMP_SESSION_MODULE}`,
    ]);
  });

  it('enrolls a persona by PLACING its manifest, and the session by omitting one', () => {
    // PRESENCE IS ENROLLMENT. The worker asks whether this scope carries a
    // manifest, never whether a list names the agent, so composing a cell
    // enrolls every persona carrying it and nothing central is edited. The
    // allowlist this replaces was a runtime self-filter over an enrollment the
    // corpus already derived, and it had drifted exactly as such a list does:
    // every projected persona carried the guard while the shell default named
    // `nico mav`, leaving `architect` and `kino` holding principal authority and
    // never once judged.
    const out = ompScopeActivatedExtensions([HOOK], ['mav', 'nico']);
    const manifests = out.filter((f) => f.filename === OMP_STANCE_MANIFEST);
    // A bare launch still loads the dispatcher and still finds nothing to judge:
    // the silence falls out of PLACEMENT, not out of an `agent_type` branch that
    // had to be remembered identically in two separate workers.
    expect(manifests.map((f) => f.scope)).toEqual(['mav', 'nico']);
    expect(ompHarnessAdapter.scopedRel?.(OMP_STANCE_MANIFEST, 'mav')).toBe(
      `${OMP_SESSION_DIR}/${OMP_PERSONA_DIR}/mav/${OMP_STANCE_MANIFEST}`,
    );
    // Keyed by the CELL that owns the gate and carrying that cell's own moments,
    // so a second gated dimension is a second ENTRY rather than a new field, a
    // new file, or a line in any caller.
    const parsed = JSON.parse(manifests[0]?.content ?? '{}');
    expect(parsed.agent).toBe('mav');
    expect(parsed.gates['stance-guardrail'].moments).toEqual(['turn.end']);
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

/**
 * A DEPLOYED omp home, laid out by the adapter's OWN destination map: the
 * generic launcher in the session root, the definition omp discovers beside it,
 * and one persona scope carrying its overlay. Plus a fake `omp` on `PATH` that
 * records the argv it was exec'd with, because what the launcher composes is
 * observable nowhere else.
 *
 * Built from `scopedRel`/`agentRel` rather than from written-out paths: a
 * layout change moves this fixture with it instead of leaving it pinned to a
 * directory nobody writes any more.
 *
 * THE FAKE `omp` IS ALSO THE SKILL RESOLVER, as the real one is for the
 * launcher: `omp read skill://<name>` answers with `skills[name].md`,
 * `skill://<name>/scripts` lists its `scripts`, `skill://<name>/scripts/<f>`
 * prints one, and an unknown name exits 1 as omp does. Every `read` appends the directory it ran in to
 * `reads`, so a test can see WHERE the launcher asked from.
 */
interface DeployedHome {
  sandbox: string;
  harness: string;
  bin: string;
  argv: string;
  reads: string;
  launcher: string;
}

/** A skill as the fake `omp` resolves it: its SKILL.md, and its `scripts/`
 *  files by name. */
interface ResolvedFixture {
  md: string;
  scripts?: Readonly<Record<string, string>>;
}

function deployedHome(
  defs: Record<string, string>,
  skills: Record<string, ResolvedFixture> = {},
): DeployedHome {
  const sandbox = mkdtempSync(join(tmpdir(), 'omp-home-'));
  tmp.push(sandbox);
  const harness = join(sandbox, '.omp');
  const place = (at: string, content: string, mode?: number): void => {
    mkdirSync(dirname(at), { recursive: true });
    writeFileSync(at, content, mode === undefined ? undefined : { mode });
  };
  for (const [name, def] of Object.entries(defs)) {
    place(join(harness, ompAgentRel(name)), def);
  }
  const resolved = join(sandbox, 'resolved');
  for (const [name, { md, scripts }] of Object.entries(skills)) {
    place(join(resolved, name, 'SKILL.md'), md);
    for (const [file, content] of Object.entries(scripts ?? {})) {
      place(join(resolved, name, 'scripts', file), content);
    }
  }
  for (const f of ompLaunchSurface(Object.keys(defs))) {
    place(
      join(
        harness,
        ompHarnessAdapter.scopedRel?.(f.filename, f.scope) as string,
      ),
      f.content,
      f.executable ? 0o755 : undefined,
    );
  }
  const bin = join(sandbox, 'bin');
  mkdirSync(bin, { recursive: true });
  const argv = join(sandbox, 'argv');
  const reads = join(sandbox, 'reads');
  // NUL-DELIMITED, because one of these arguments is the composed system
  // prompt and it is MULTI-LINE. A newline-separated sink read the prompt back
  // as a dozen unrelated arguments, which is the shape that would let a
  // truncated prompt pass every assertion here.
  writeFileSync(
    join(bin, 'omp'),
    [
      '#!/bin/sh',
      'if [ "$1" = read ]; then',
      `  printf '%s\\n' "$PWD" >> ${reads}`,
      '  case $2 in',
      `    skill://*/scripts) d=${resolved}/\${2#skill://}; [ -d "$d" ] || exit 1; ls "$d"; exit 0 ;;`,
      `    skill://*/*) f=${resolved}/\${2#skill://} ;;`,
      `    skill://*) f=${resolved}/\${2#skill://}/SKILL.md ;;`,
      '  esac',
      '  [ -f "$f" ] || { echo "Unknown skill" >&2; exit 1; }',
      '  cat "$f"; exit 0',
      'fi',
      `printf '%s\\0' "$@" > ${argv}`,
      '',
    ].join('\n'),
    { mode: 0o755 },
  );
  return {
    sandbox,
    harness,
    bin,
    argv,
    reads,
    launcher: join(
      harness,
      ompHarnessAdapter.scopedRel?.(OMP_LAUNCHER_FILE, SESSION_SCOPE) as string,
    ),
  };
}

/** The arguments the fake `omp` was exec'd with, whole. */
function recordedArgv(at: string): string[] {
  return readFileSync(at, 'utf-8').split('\0').slice(0, -1);
}

/** Run the deployed launcher through `entry` and report what a shell saw —
 *  stderr included on success, where a degraded skill is reported. */
function launch(
  bin: string,
  entry: string,
  args: readonly string[] = [],
  cwd?: string,
): { status: number; stderr: string } {
  const r = spawnSync(entry, [...args], {
    env: { ...process.env, PATH: `${bin}:${process.env.PATH ?? ''}` },
    stdio: ['ignore', 'ignore', 'pipe'],
    encoding: 'utf-8',
    ...(cwd ? { cwd } : {}),
  });
  return { status: r.status ?? -1, stderr: r.stderr };
}

describe('omp launch spec', () => {
  it('emits ONE launcher for the session and ONE overlay per agent, sorted', () => {
    // The shape change, in one assertion. Ten agents used to mean ten
    // byte-identical launchers differing only in where they sat.
    expect(
      ompLaunchSurface(['nico', 'mav']).map((f) => [f.scope, f.filename]),
    ).toEqual([
      [SESSION_SCOPE, OMP_LAUNCHER_FILE],
      ['mav', OMP_OVERLAY_FILE],
      ['nico', OMP_OVERLAY_FILE],
    ]);
  });

  it('lands the launcher executable — an unexecutable one is dead on the host', () => {
    const [launcher] = ompLaunchSurface(['mav']);
    expect(launcher?.executable).toBe(true);
    expect(launcher?.content).toContain('#!/bin/sh');
    // And no absolute path was baked in at projection: the script is identical
    // for every persona and every `--home`.
    expect(launcher?.content).not.toMatch(/\/home\/|\/Users\//);
  });

  it('emits NOTHING for an empty agent set, launcher included', () => {
    // A launcher with no definition it could ever resolve reads as an
    // affordance and delivers a usage error.
    expect(ompLaunchSurface([])).toEqual([]);
  });

  it('composes identity + body + that persona’s OWN overlay, through a symlink', () => {
    // HOW A LAUNCHER IS ACTUALLY RUN: linked into a `PATH` dir under the
    // persona's name. That directory holds none of the files the launcher
    // reads, and a script that trusted `dirname "$0"` handed omp the LINK's
    // directory — measured on an operator's host as `Config overlay not found:
    // ~/.local/bin/omp.yml`, a persona unlaunchable by its own name.
    //
    // Asserted by RUNNING it against an `omp` that records its argv, because
    // every claim here is only observable in what gets exec'd. A
    // `toContain('dirname')` assertion passed throughout that defect.
    //
    // FED THE PROJECTOR'S OWN BYTES, so the split the launcher performs is
    // pinned against the front-matter this adapter actually emits rather than
    // against a convenient hand-written sample.
    const { harness, bin, argv, launcher } = deployedHome({
      mav: agentToOmpMd(AGENT, CTX),
    });
    symlinkSync(launcher, join(bin, 'mav'));

    expect(launch(bin, join(bin, 'mav'))).toEqual({ status: 0, stderr: '' });

    const args = recordedArgv(argv);
    const prompt = args[args.indexOf('--append-system-prompt') + 1] as string;
    // The identity omp's own base prompt would otherwise win…
    expect(prompt.split('\n')[0]).toContain('You are `mav`');
    // …the composed body under it…
    expect(prompt).toContain('Hero archetype of end-to-end delivery');
    // …and NOT the front-matter, which would arrive as literal text.
    expect(prompt).not.toContain('description:');
    // …and this persona's own overlay, which is the whole of its governance.
    expect(args).toContain(
      join(
        harness,
        ompHarnessAdapter.scopedRel?.(OMP_OVERLAY_FILE, 'mav') as string,
      ),
    );
  });

  it('argv[0] dispatch does not eat the operator’s own first flag', () => {
    // The busybox contract: invoked under its OWN name the agent is `$1`;
    // invoked as `mav` the agent is argv[0] and every remaining word is omp's.
    // Get this backwards and `mav --model x` silently launches an agent named
    // `--model`, or drops the flag.
    const { bin, argv, launcher } = deployedHome({
      mav: agentToOmpMd(AGENT, CTX),
    });
    symlinkSync(launcher, join(bin, 'mav'));

    launch(bin, join(bin, 'mav'), ['--model', 'x']);
    expect(recordedArgv(argv)).toContain('--model');

    launch(bin, launcher, ['mav', '--model', 'x']);
    const explicit = recordedArgv(argv);
    expect(explicit).toContain('--model');
    expect(explicit).not.toContain('mav');
  });

  it('REFUSES, naming the path, when the definition is not there', () => {
    // A launcher that fell through to a bare `omp` would start an UNGOVERNED
    // session wearing the persona's name — the failure this whole shape exists
    // to make impossible, and one an operator would not notice for a whole
    // session.
    const { harness, bin, launcher } = deployedHome({
      mav: agentToOmpMd(AGENT, CTX),
    });
    const { status, stderr } = launch(bin, launcher, ['ghost']);
    expect(status).toBeGreaterThan(0);
    expect(stderr).toContain('ghost');
    expect(stderr).toContain(join(harness, ompAgentRel('ghost')));
  });

  describe('a MAIN session starts with the skills omp resolves, as a spawn does', () => {
    // omp honours `autoloadSkills` ONLY for a spawned subagent, which starts
    // with each skill's body injected. The launcher gives a main session the
    // same start, asking omp itself which body each name resolves to.

    /** A SKILL.md as projection writes one: front matter, then the body. */
    const skillMd = (name: string, body: string) =>
      `---\nname: ${name}\ndescription: the ${name} skill\n---\n\n${body}\n`;
    const SKILLS: Record<string, ResolvedFixture> = {
      design: {
        md: skillMd('design', '# Design\n\nDESIGN_BODY'),
        scripts: { 'design.mjs': runtimeShimContent('design') },
      },
      deliver: { md: skillMd('deliver', '# Deliver\n\nDELIVER_BODY') },
      probe: { md: skillMd('probe', '# Probe\n\nPROBE_BODY') },
      signify: { md: skillMd('signify', '# Signify\n\nSIGNIFY_BODY') },
    };
    const SCRIBE = [
      '---',
      'name: scribe',
      'description: "writes"',
      'autoloadSkills:',
      '  - signify',
      '  - probe',
      '---',
      '',
      'BODY',
      '',
    ].join('\n');
    const MAV = agentToOmpMd(
      { ...(AGENT as object), skills: ['deliver', 'design'] } as never,
      CTX,
    );

    /** Launch `agent` in `home`; its exit, stderr and appended prompt. */
    const run = (home: DeployedHome, agent: string, cwd?: string) => {
      const { status, stderr } = launch(home.bin, home.launcher, [agent], cwd);
      const args = recordedArgv(home.argv);
      const prompt = args[args.indexOf('--append-system-prompt') + 1] as string;
      return { status, stderr, prompt };
    };

    it('inlines what omp resolves, in listed order, for BOTH spellings', () => {
      // BOTH SPELLINGS, because both arrive here. An operator hand-editing a
      // definition writes YAML's BLOCK sequence; `agentToOmpMd` emits the FLOW
      // sequence from the `skills` projection hands it.
      const home = deployedHome({ scribe: SCRIBE, mav: MAV }, SKILLS);

      const block = run(home, 'scribe');
      expect(block).toMatchObject({ status: 0, stderr: '' });
      expect(
        block.prompt.endsWith(
          'BODY\n\n# Skill: signify\n\n# Signify\n\nSIGNIFY_BODY\n\n# Skill: probe\n\n# Probe\n\nPROBE_BODY',
        ),
      ).toBe(true);

      // THE PROJECTOR'S OWN BYTES: what forge wrote out of an agent's `skills`
      // is what the launcher must read back in. A skill carrying a shim opens
      // with the CLI command its route runs as — no location needed.
      const flow = run(home, 'mav');
      expect(flow).toMatchObject({ status: 0, stderr: '' });
      expect(
        flow.prompt.endsWith(
          '# Skill: deliver\n\n# Deliver\n\nDELIVER_BODY\n\n# Skill: design\n\n`scripts/design.mjs <verb>` runs as `cratylus design <verb>`.\n\n# Design\n\nDESIGN_BODY',
        ),
      ).toBe(true);
      expect(flow.prompt).toContain('Hero archetype of end-to-end delivery');
      // Neither the definition's front matter nor any skill's reaches the model.
      for (const { prompt } of [block, flow]) {
        expect(prompt).not.toContain('autoloadSkills');
        expect(prompt).not.toMatch(/^(name|description):/m);
        expect(prompt).not.toContain('skill://');
        expect(prompt).not.toContain('Base directory');
      }
    });

    it('states a route only for a shim forge generated, from its signature', () => {
      // The file name says nothing about what a script is: a generated shim is
      // named by its signature line, whatever its file is called, and a script
      // the skill's author wrote gets no line at all.
      const home = deployedHome(
        { scribe: SCRIBE },
        {
          ...SKILLS,
          probe: {
            ...(SKILLS.probe as ResolvedFixture),
            scripts: {
              'design.mjs':
                '#!/usr/bin/env node\nconsole.log("hand-written")\n',
              'tool.mjs': runtimeShimContent('note'),
            },
          },
        },
      );
      const { prompt } = run(home, 'scribe');
      expect(prompt).toContain(
        '# Skill: probe\n\n`scripts/tool.mjs <verb>` runs as `cratylus note <verb>`.\n\n# Probe',
      );
      expect(prompt).not.toContain('scripts/design.mjs');
    });

    it('inlines none under `--no-skills`, and warns once under `--skills`', () => {
      // `--no-skills` is omp's own "load none", so the session starts with none
      // — not with bodies it would never have loaded, nor with references to them.
      const none = deployedHome({ scribe: SCRIBE }, SKILLS);
      const off = launch(none.bin, none.launcher, ['scribe', '--no-skills']);
      expect(off).toEqual({ status: 0, stderr: '' });
      const offArgs = recordedArgv(none.argv);
      const offPrompt = offArgs[offArgs.indexOf('--append-system-prompt') + 1];
      expect(offPrompt).not.toContain('# Skill:');
      expect(offPrompt).not.toContain('## Required reading');
      expect(offArgs).toContain('--no-skills');
      expect(() => readFileSync(none.reads)).toThrow();

      // A `--skills` filter is not mirrored; the launcher says so once, and the
      // flag still reaches omp.
      const filtered = deployedHome({ scribe: SCRIBE }, SKILLS);
      const { status, stderr } = launch(filtered.bin, filtered.launcher, [
        'scribe',
        '--skills=sig*',
      ]);
      expect(status).toBe(0);
      const lines = stderr.split('\n').filter(Boolean);
      expect(lines).toHaveLength(1);
      expect(lines[0]).toMatch(/^omp-agent: agent scribe: --skills/);
      expect(recordedArgv(filtered.argv)).toContain('--skills=sig*');
    });

    it('asks omp from the launch directory, where project skills resolve', () => {
      const home = deployedHome({ scribe: SCRIBE }, SKILLS);
      const project = join(home.sandbox, 'project');
      mkdirSync(project);
      run(home, 'scribe', project);
      const reads = readFileSync(home.reads, 'utf-8')
        .split('\n')
        .filter(Boolean);
      expect(reads.length).toBeGreaterThan(0);
      expect(new Set(reads)).toEqual(new Set([project]));
    });

    it('degrades a skill omp cannot resolve to its reference, and says so', () => {
      // Never dropped in silence: the name still reaches the model, and the
      // operator is told which skill, for which agent, before omp starts.
      const { probe: _, ...withoutProbe } = SKILLS;
      const home = deployedHome({ scribe: SCRIBE }, withoutProbe);
      const { status, stderr, prompt } = run(home, 'scribe');
      expect(status).toBe(0);
      const lines = stderr.split('\n').filter(Boolean);
      expect(lines).toHaveLength(1);
      expect(lines[0]).toMatch(/^omp-agent:/);
      expect(lines[0]).toContain('scribe');
      expect(lines[0]).toContain('probe');
      expect(prompt).toContain('# Skill: signify');
      expect(prompt).not.toContain('# Skill: probe');
      expect(prompt).toMatch(
        /\n## Required reading\n[\s\S]*\n- `skill:\/\/probe`$/,
      );
    });

    it('adds nothing, and asks omp nothing, for a definition without `autoloadSkills`', () => {
      const home = deployedHome({ mav: agentToOmpMd(AGENT, CTX) }, SKILLS);
      const { status, stderr, prompt } = run(home, 'mav');
      expect({ status, stderr }).toEqual({ status: 0, stderr: '' });
      expect(prompt).not.toContain('# Skill:');
      expect(prompt).not.toContain('## Required reading');
      expect(() => readFileSync(home.reads)).toThrow();
    });
  });

  it('the overlay names the DIRECTORY, so it covers the guardrail module too', () => {
    // A single named file here would silently stop loading whichever module was
    // NOT named the day a second one is added — the exact enforcement loss the
    // profile carrier never had (its directory scan swept both unconditionally).
    const overlay = ompLaunchSurface(['mav']).find(
      (f) => f.filename === OMP_OVERLAY_FILE,
    );
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
    const overlayRel = ompHarnessAdapter.scopedRel?.(
      OMP_OVERLAY_FILE,
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

describe('omp persona badge', () => {
  const NICO = {
    name: 'nico',
    provenance: { mark: { emoji: '📐', hue: 'blue' } },
  } as never;
  const MAV = {
    name: 'mav',
    provenance: { mark: { emoji: '🔧', hue: 'green' } },
  } as never;

  const badges = (agents: never[]) =>
    (ompHarnessAdapter.launchSurface?.(agents) ?? []).filter(
      (f) => f.filename === OMP_PERSONA_BADGE_MODULE,
    );

  /**
   * Load an emitted badge module and fire its `session_start` under `ctx`,
   * returning the text of every status it set. RUN, not read: the guard and
   * the baked text are observed the way omp would observe them.
   */
  async function statusesSet(
    content: string,
    ctx: { hasUI: boolean; kind: string },
  ): Promise<string[]> {
    const dir = mkdtempSync(join(tmpdir(), 'omp-badge-'));
    tmp.push(dir);
    const file = join(dir, OMP_PERSONA_BADGE_MODULE);
    writeFileSync(file, content);
    type Handler = (event: unknown, ctx: unknown) => void;
    // Dynamic by necessity: the module is the projection's OUTPUT, written above.
    const mod = (await import(file)) as {
      default: (pi: { on: (event: string, h: Handler) => void }) => void;
    };
    const handlers = new Map<string, Handler>();
    mod.default({ on: (event, h) => handlers.set(event, h) });
    const set: string[] = [];
    handlers.get('session_start')?.(
      {},
      {
        hasUI: ctx.hasUI,
        // omp names a LAUNCHED persona `main` — which is why the module cannot
        // read its own name and must carry it baked in.
        agent: { kind: ctx.kind, name: 'main' },
        ui: { setStatus: (_key: string, text: string) => set.push(text) },
      },
    );
    return set;
  }

  it('lands ONE badge per persona in its own extensions dir, none in the session', () => {
    const out = badges([NICO, MAV]);
    expect(out.map((f) => f.scope)).toEqual(['mav', 'nico']);
    expect(
      ompHarnessAdapter.scopedRel?.(OMP_PERSONA_BADGE_MODULE, 'nico'),
    ).toBe(
      `${OMP_SESSION_DIR}/${OMP_PERSONA_DIR}/nico/extensions/${OMP_PERSONA_BADGE_MODULE}`,
    );
  });

  it('shows the mark emoji and the name — and never the hue', async () => {
    const [nico] = badges([NICO]);
    expect(
      await statusesSet(nico?.content as string, { hasUI: true, kind: 'main' }),
    ).toEqual(['📐 nico']);
  });

  it('shows the name ALONE for an agent with no provenance', async () => {
    const out = badges([{ name: 'x', provenance: null } as never]);
    expect(out.map((f) => [f.filename, f.scope])).toEqual([
      [OMP_PERSONA_BADGE_MODULE, 'x'],
    ]);
    expect(
      await statusesSet(out[0]?.content as string, {
        hasUI: true,
        kind: 'main',
      }),
    ).toEqual(['x']);
  });

  it("shows only in a top-level interactive session, never a subagent's", async () => {
    const [nico] = badges([NICO]);
    const content = nico?.content as string;
    expect(await statusesSet(content, { hasUI: false, kind: 'main' })).toEqual(
      [],
    );
    expect(
      await statusesSet(content, { hasUI: true, kind: 'subagent' }),
    ).toEqual([]);
  });
});

describe('omp shim', () => {
  it('forwards a shipped capability with no session variable set', () => {
    // RUN, against a `cratylus` on PATH that records what it was handed, in an
    // environment that carries PATH alone.
    const dir = mkdtempSync(join(tmpdir(), 'omp-shim-'));
    tmp.push(dir);
    const bin = join(dir, 'bin');
    mkdirSync(bin);
    writeFileSync(
      join(bin, 'cratylus'),
      `#!/bin/sh\nprintf '%s\\n' "$@" > ${join(dir, 'called')}\n`,
      { mode: 0o755 },
    );
    const shim = join(dir, 'plan.mjs');
    writeFileSync(shim, runtimeShimContent('plan'));
    const r = spawnSync(process.execPath, [shim, 'show', 'x'], {
      env: { PATH: `${bin}:${process.env.PATH ?? ''}` },
      encoding: 'utf-8',
    });
    expect(r.status).toBe(0);
    expect(readFileSync(join(dir, 'called'), 'utf-8')).toBe('plan\nshow\nx\n');
  });
});

describe('omp role routing', () => {
  const routing = ompHarnessAdapter.roleRouting;

  it('routes each held role to its nearest built-in role, and everything else to `default`', () => {
    if (routing === undefined) throw new Error('omp declares no roleRouting');
    expect(routing.defaultRole).toBe('default');
    expect(
      Object.fromEntries(
        ['implementer', 'planner', 'assayer', 'architect', 'unheard-of'].map(
          (r) => [r, routing.nearest(r)],
        ),
      ),
    ).toEqual({
      implementer: 'task',
      planner: 'plan',
      assayer: 'default',
      architect: 'default',
      'unheard-of': 'default',
    });
  });

  it('keeps the host mapping in agent/config.yml under the harness home', () => {
    expect(routing?.configRel).toBe('agent/config.yml');
  });

  it('is omp alone — claude and codex leave the member absent', () => {
    expect(adapterByName('claude').roleRouting).toBeUndefined();
    expect(adapterByName('codex').roleRouting).toBeUndefined();
  });
});
