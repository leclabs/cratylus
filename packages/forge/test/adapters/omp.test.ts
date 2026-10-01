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
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  OMP_AGENT_DEF_DIR,
  OMP_GUARDRAIL_MODULE,
  OMP_ISOLATION_MODULE,
  OMP_LAUNCHER_FILE,
  OMP_OVERLAY_FILE,
  OMP_PERSONA_BADGE_MODULE,
  OMP_PERSONA_DIR,
  OMP_REFUSAL_SHAPE,
  OMP_SESSION_DIR,
  OMP_SESSION_MODULE,
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
import { STANCE_MANIFEST, personaRootOf } from '../../src/core/enrollment.js';
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

  it('emits nothing for an agent declaring worktree isolation — omp has no field that starts one', () => {
    // omp's agent definition reader takes no key that isolates an agent, so the
    // declaration is dropped from the bytes and projection warns instead.
    const md = agentToOmpMd(
      { ...(AGENT as object), isolation: 'worktree' } as never,
      CTX,
    );
    expect(md).not.toMatch(/^isolation:/m);
    expect(frontMatter(md)).toEqual(frontMatter(agentToOmpMd(AGENT, CTX)));
    expect(ompHarnessAdapter.startsInWorktree).toBe(false);
  });

  it('has no peer for the moment a worktree is created, so a cell bound to it is not realized here', () => {
    expect(ompHarnessAdapter.realizes('worktree.create')).toBe(false);
    expect(ompHarnessAdapter.nativeEvents).not.toHaveProperty(
      'worktree.create',
    );
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
    // A harness whose only selector is a regex over `agent_type` must report every
    // act unnarrowed. omp's hook is a TypeScript module that receives `toolName`, so
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
    expect(turn?.content).toContain('JUDGE_COOLDOWN_MS');
    expect(turn?.content).not.toContain('judgeAway = true');
    // Inside omp's 30 s handler kill, or the deadline never fires — and with real
    // margin above a measured judge call. The margin was set at 9.3 s for a 9 KB payload
    // against a 29 KB rubric; the rubrics are about 2 KB now and the payload is capped at
    // 12 KB, and a call measured 1.7-3.2 s on the advisor role, so the same deadline now
    // leaves several times the margin. Nothing here was raised to make a judgement fit.
    const ms = /const JUDGE_TIMEOUT_MS = ([\d_]+);/.exec(turn?.content ?? '');
    expect(ms).not.toBeNull();
    const budget = Number(ms?.[1]?.replaceAll('_', ''));
    expect(budget).toBeLessThan(30_000);
    expect(budget).toBeGreaterThan(15_000);
  });

  it('emits nothing when the mechanism is absent — and that is the arity bug', () => {
    // EXONERATING FIXTURE. Without a mechanism there is no command to wire, so
    // emitting nothing is correct. What was NOT correct was reaching this state
    // because a port dropped `mechanisms` on the floor: an adapter that wires
    // `enforcingSurface` at arity 1 takes this branch on every call, and its
    // per-agent guardrails reach the host as nothing at all — green throughout,
    // because the unit tests call the function DIRECTLY with a mechanism map the
    // production path never supplies.
    expect(
      ompGuardrailExtensions([binding(['mav'], ['turn.end'])] as never),
    ).toEqual([]);
  });
});

describe('omp bridge — a guard that lets a fire through says so', () => {
  // The generated module is RUN, on worker stubs that print what the real workers
  // print, because whether a notice reaches the operator is a fact about the
  // bridge's two passes and not about any string in its source. The workers speak
  // in one of three ways: a notice INSTEAD of the payload envelope (nothing could
  // be judged), the envelope and then a notice (the verdict pass let it through),
  // or the envelope and then a verdict or nothing (judged).
  const STUB = `#!/bin/sh
cat > "\${RECORD:-/dev/null}"
echo fire >> "$(dirname "$RUBRIC")/fires"
if [ "$MODE" = gated ]; then exit 0; fi
if [ -n "$STANCE_EMIT_PAYLOAD" ]; then
  if [ "$MODE" = early ]; then
    echo "PURVIEW GUARDRAIL — DARK: jq is not installed. This call was NOT judged."
  else
    printf '{"rubric":"%s","payload":"%s"}\\n' "$RUBRIC" 'contract: x\\nact: say \\"hi\\"'
  fi
  exit 0
fi
case "$MODE" in
  discarded) echo "STANCE GUARDRAIL — BLOCK DISCARDED: no span. This turn was NOT judged clean." ;;
  deny) printf '{"decision":"block","reason":"collapsed"}\\n' ;;
  judge)
    if grep -q BLOCK "$STANCE_VERDICT_FILE"; then
      printf '{"decision":"block","reason":"collapsed"}\\n'
    elif [ ! -s "$STANCE_VERDICT_FILE" ]; then
      echo "PURVIEW GUARDRAIL — DARK: the judge did not answer. This call was NOT judged."
    fi ;;
  pass) ;;
esac
`;

  const MAIN = { agent: { kind: 'main', id: '0-main', depth: 0 } };
  // The payload the stub worker emits, decoded: a newline and a quote in it, so a
  // wrapper or a re-encoding shows.
  const PAYLOAD = 'contract: x\nact: say "hi"';

  type Handler = (event: unknown, ctx: unknown) => Promise<unknown>;

  type Stub = (...args: unknown[]) => Promise<unknown>;
  const stubs: string[] = [];
  afterEach(() => {
    for (const key of stubs)
      delete (globalThis as Record<string, unknown>)[key];
    stubs.length = 0;
  });

  /** Load the generated module for `event` on a worker in `mode`. `judge`
   *  stands in for omp's completeSimple; without one no case reaches a model. */
  async function load(
    mode: string,
    event: string | string[],
    judge?: Stub,
    sendUserMessage: (m: string, o: unknown) => unknown = () => undefined,
  ): Promise<{
    sent: string[];
    content: string;
    dir: string;
    run: (fire: Record<string, unknown>, ctx?: unknown) => Promise<unknown>;
    /** Fire every handler registered on the first native event, in order. */
    runAll: (
      fire: Record<string, unknown>,
      ctx?: unknown,
    ) => Promise<unknown[]>;
  }> {
    const dir = mkdtempSync(join(tmpdir(), 'omp-bridge-'));
    tmp.push(dir);
    const stub = join(dir, 'worker.sh');
    writeFileSync(stub, STUB);
    const rubric = join(dir, 'rubric.md');
    writeFileSync(rubric, 'the rubric');
    const mech = new Map([
      ['stance', { command: `MODE=${mode} RUBRIC=${rubric} sh ${stub}` }],
    ]) as never;
    const [mod] = ompGuardrailExtensions(
      [
        {
          anchor: 'stance',
          fragment: {
            substrate: 'harness',
            events: Array.isArray(event) ? event : [event],
            realizedBy: 'stance',
          },
          agents: ['mav'],
        },
      ] as never,
      mech,
    );
    // The module's one runtime import is omp's own model client, which the host
    // supplies and a test does not have.
    const key = `__ompJudge${stubs.length}`;
    if (judge) {
      stubs.push(key);
      (globalThis as Record<string, unknown>)[key] = judge;
    }
    const content = (mod?.content as string).replace(
      "import { completeSimple } from '@oh-my-pi/pi-ai';",
      judge
        ? `const completeSimple = (...a: unknown[]) => (globalThis as unknown as Record<string, (...b: unknown[]) => Promise<never>>)['${key}'](...a);`
        : 'const completeSimple = async () => ({ content: [] });',
    );
    const file = join(dir, 'scope', 'extensions', OMP_GUARDRAIL_MODULE);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, content);
    const handlers = new Map<string, Handler>();
    const every = new Map<string, Handler[]>();
    const sent: string[] = [];
    const pi = {
      cwd: dir,
      on: (name: string, h: Handler) => {
        handlers.set(name, h);
        every.set(name, [...(every.get(name) ?? []), h]);
      },
      sendUserMessage: (m: string, o: unknown) => {
        sent.push(m);
        return sendUserMessage(m, o);
      },
      exec: async (command: string, args: string[]) => {
        const r = spawnSync(command, args, { encoding: 'utf8', cwd: dir });
        return {
          stdout: r.stdout,
          stderr: r.stderr,
          code: r.status,
          killed: false,
        };
      },
    };
    // Dynamic by necessity: the module is the projection's OUTPUT, written above.
    const mod2 = (await import(file)) as {
      default: (pi: unknown) => void;
    };
    mod2.default(pi);
    const native = [...handlers.keys()][0] as string;
    return {
      sent,
      content,
      dir,
      run: async (fire, ctx = MAIN) => handlers.get(native)?.(fire, ctx),
      runAll: async (fire, ctx = MAIN) => {
        const out: unknown[] = [];
        for (const h of every.get(native) ?? []) out.push(await h(fire, ctx));
        return out;
      },
    };
  }

  /** Load the generated module for `event`, fire its handler, and report what
   *  omp would have been told: the messages sent and the handler's result. */
  async function fired(
    mode: string,
    cell: { event: string; fire: Record<string, unknown> },
    sendUserMessage: (m: string, o: unknown) => unknown = () => undefined,
  ): Promise<{ sent: string[]; result: unknown }> {
    const b = await load(mode, cell.event, undefined, sendUserMessage);
    const result = await b.run(cell.fire);
    return { sent: b.sent, result };
  }

  const CELLS = [
    { event: 'turn.end', fire: { messages: [] } },
    { event: 'tool.use.pre', fire: { toolName: 'write', input: {} } },
  ];

  it.each(CELLS)(
    'relays a notice printed before the judge is asked — $event',
    async (cell) => {
      const { sent, result } = await fired('early', cell);
      expect(sent).toHaveLength(1);
      expect(sent[0]).toMatch(/PURVIEW GUARDRAIL.*NOT judged/);
      // The notice is never a refusal: the fire is let through.
      expect(result).toBeUndefined();
    },
  );

  it.each(CELLS)(
    'relays a notice printed after the judge was asked, whatever it opens with — $event',
    async (cell) => {
      const { sent, result } = await fired('discarded', cell);
      expect(sent).toHaveLength(1);
      expect(sent[0]).toMatch(/BLOCK DISCARDED/);
      expect(result).toBeUndefined();
    },
  );

  it.each(CELLS)('stays SILENT on a judged pass — $event', async (cell) => {
    const { sent, result } = await fired('pass', cell);
    expect(sent).toEqual([]);
    expect(result).toBeUndefined();
  });

  it('judges ONLY a main session: a subagent, and a session that cannot say which it is, run no worker', async () => {
    // `ctx.agent` is how omp says which session is running (`kind: "main"` for the
    // top-level session, `kind: "sub"` with a `parentId` for a subagent), and a
    // context without it cannot be placed. A subagent is judged by nothing and says
    // nothing; a session that cannot be placed is judged by nothing too, but the
    // operator is told so, because a guard that is not in force is not silent.
    const b = await load('gated', 'tool.use.pre');
    const fires = () =>
      readFileSync(join(b.dir, 'fires'), 'utf8').split('\n').length - 1;
    const fire = { toolName: 'write', input: {} };

    await b.run(fire, { agent: { kind: 'main', id: '0-main', depth: 0 } });
    expect(fires()).toBe(1);
    expect(b.sent).toEqual([]);

    await b.run(fire, {
      agent: { kind: 'sub', id: '0-Child', parentId: '0-main', depth: 1 },
    });
    expect(fires()).toBe(1);
    expect(b.sent).toEqual([]);

    expect(await b.run(fire, {})).toBeUndefined();
    expect(fires()).toBe(1);
    expect(b.sent).toHaveLength(1);
    expect(b.sent[0]).toMatch(
      /stance.*could not tell which session is running/,
    );
  });

  it('hands the judge the worker’s payload ALONE as the user message', async () => {
    let request: { messages?: { content?: unknown }[] } | undefined;
    const b = await load('judge', 'tool.use.pre', async (_model, req) => {
      request = req as typeof request;
      return { content: [{ type: 'text', text: 'PASS' }] };
    });
    await b.run({ toolName: 'write', input: {} }, { model: {}, ...MAIN });
    expect(request?.messages).toHaveLength(1);
    expect(request?.messages?.[0]?.content).toBe(PAYLOAD);
  });

  it('judges a main session and judges NOTHING in a subagent session', async () => {
    // omp hands a spawned subagent its parent's extensions, so the module loads
    // there too. The session says which it is on `ctx.agent`: `kind: "main"` for the
    // top-level session, `kind: "sub"` with a `parentId` for a subagent (omp 18.4.4).
    // A dispatch is a subagent's own call too, so both bound acts are covered.
    const judge = { calls: 0 };
    const b = await load(
      'judge',
      ['tool.use.pre', 'subagent.dispatch.pre'],
      async () => {
        judge.calls += 1;
        return { content: [{ type: 'text', text: 'PASS' }] };
      },
    );
    const main = { model: {}, agent: { kind: 'main', id: '0-main', depth: 0 } };
    const sub = {
      model: {},
      agent: { kind: 'sub', id: '0-Child', parentId: '0-main', depth: 1 },
    };
    const fires = [
      { toolName: 'write', input: {} },
      { toolName: 'task', input: { tasks: [] } },
    ];

    for (const fire of fires) {
      judge.calls = 0;
      expect(await b.runAll(fire, sub)).toEqual([undefined, undefined]);
      expect(judge.calls).toBe(0);
      expect(b.sent).toEqual([]);

      await b.runAll(fire, main);
      expect(judge.calls).toBe(1);
    }
  });

  it('hands the worker a message to an agent as the dispatch it is, and any other write as a write', async () => {
    // omp messages a running agent through `write` to `agent://<id>`. The worker
    // reads a `Write` as an act on the substrate and judges its path alone; the
    // message is only judged where the envelope spells it as the contract does.
    const b = await load(
      'pass',
      ['tool.use.pre', 'subagent.dispatch.pre'],
      async () => ({ content: [{ type: 'text', text: 'PASS' }] }),
    );
    const main = { model: {}, agent: { kind: 'main', id: '0-main', depth: 0 } };
    const record = join(mkdtempSync(join(tmpdir(), 'omp-envelope-')), 'seen');
    tmp.push(dirname(record));
    vi.stubEnv('RECORD', record);
    const envelopeOf = async (input: Record<string, unknown>) => {
      rmSync(record, { force: true });
      await b.runAll({ toolName: 'write', input }, main);
      return JSON.parse(readFileSync(record, 'utf8')) as Record<
        string,
        unknown
      >;
    };
    try {
      expect(
        await envelopeOf({
          path: 'agent://AssayInstall3',
          content: 'install of guided-install at 1a2b3c4',
        }),
      ).toMatchObject({
        tool_name: 'SendMessage',
        tool_input: {
          agent: 'AssayInstall3',
          message: 'install of guided-install at 1a2b3c4',
        },
      });
      expect(
        await envelopeOf({ path: 'packages/forge/src/x.ts', content: 'x' }),
      ).toMatchObject({
        tool_name: 'Write',
        tool_input: { path: 'packages/forge/src/x.ts' },
      });
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('still refuses on a verdict, and sends no notice for it', async () => {
    const { sent, result } = await fired('deny', CELLS[0] as never);
    expect(sent).toEqual([]);
    expect(result).toEqual({ decision: 'block', reason: 'collapsed' });
  });

  it('never fails the fire because the notice could not be delivered', async () => {
    const throws = () => {
      throw new Error('Agent is already processing');
    };
    const rejects = () => Promise.reject(new Error('busy'));
    for (const send of [throws, rejects]) {
      const { sent, result } = await fired('early', CELLS[0] as never, send);
      expect(sent).toHaveLength(1);
      expect(result).toBeUndefined();
    }
  });

  describe('a judge that stopped answering is asked again', () => {
    // The latch a run of misses sets must EXPIRE. A judge that is never asked can
    // never answer, so a latch cleared only by an answer blacked out every guard
    // for the rest of a session on one burst of slow calls. This runs the emitted
    // module against a completeSimple that counts its calls, with a clock the test
    // owns: the deadline and the cooldown are advanced, never waited for.
    type Script = 'hang' | 'PASS' | 'BLOCK';
    const TURN = CELLS[0] as (typeof CELLS)[number];

    async function bridge() {
      const judge = { calls: 0, script: [] as Script[], asked: () => {} };
      const b = await load('judge', 'turn.end', async () => {
        judge.calls += 1;
        judge.asked();
        const step = judge.script.shift();
        return step === undefined || step === 'hang'
          ? new Promise<never>(() => {})
          : { content: [{ type: 'text', text: step }] };
      });
      const constant = (name: string): number =>
        Number(
          new RegExp(`const ${name} = ([\\d_]+);`)
            .exec(b.content)?.[1]
            ?.replaceAll('_', ''),
        );
      const deadline = constant('JUDGE_TIMEOUT_MS');
      const ctx = { model: {}, ...MAIN };
      return {
        judge,
        sent: b.sent,
        deadline,
        cooldown: constant('JUDGE_COOLDOWN_MS'),
        /** A fire that reaches the judge, which then does `step`. */
        async ask(step: Script): Promise<unknown> {
          judge.script.push(step);
          const reached = new Promise<void>((r) => {
            judge.asked = r;
          });
          const fire = b.run(TURN.fire, ctx);
          await reached;
          if (step === 'hang') await vi.advanceTimersByTimeAsync(deadline);
          return fire;
        },
        /** A fire that must not reach the judge. */
        skip: (): Promise<unknown> => b.run(TURN.fire, ctx),
        wait: (ms: number) => vi.advanceTimersByTimeAsync(ms),
      };
    }

    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('declares a cooldown between 30 s and 5 min, and probes once after it', async () => {
      const b = await bridge();
      expect(b.cooldown).toBeGreaterThanOrEqual(30_000);
      expect(b.cooldown).toBeLessThanOrEqual(300_000);

      for (let i = 0; i < 3; i++) expect(await b.ask('hang')).toBeUndefined();
      expect(b.judge.calls).toBe(3);

      // Inside the cooldown the judge is not asked, and the fire goes through
      // with the worker's dark notice relayed.
      await b.wait(b.cooldown / 2);
      expect(await b.skip()).toBeUndefined();
      expect(b.judge.calls).toBe(3);
      expect(b.sent).toHaveLength(1);
      expect(b.sent[0]).toMatch(/DARK.*NOT judged/);

      // The first fire after it asks exactly once, and the answer is the result.
      await b.wait(b.cooldown);
      expect(await b.ask('BLOCK')).toEqual({
        decision: 'block',
        reason: 'collapsed',
      });
      expect(b.judge.calls).toBe(4);

      // The answer cleared the run: the next fire asks again with no cooldown.
      expect(await b.ask('PASS')).toBeUndefined();
      expect(b.judge.calls).toBe(5);
    });

    it('starts a new cooldown when the probe misses too', async () => {
      const b = await bridge();
      for (let i = 0; i < 3; i++) await b.ask('hang');
      await b.wait(b.cooldown);
      await b.ask('hang');
      expect(b.judge.calls).toBe(4);

      await b.skip();
      expect(b.judge.calls).toBe(4);
      await b.wait(b.cooldown / 2);
      await b.skip();
      expect(b.judge.calls).toBe(4);

      await b.wait(b.cooldown);
      await b.ask('PASS');
      expect(b.judge.calls).toBe(5);
    });

    it('does not count a miss for a call that was answered', async () => {
      // The deadline timer outlived an answered call and counted a miss when it
      // fired, so a run of ANSWERED calls latched the judge away.
      const b = await bridge();
      for (let i = 0; i < 3; i++) await b.ask('PASS');
      await b.wait(b.deadline * 2);
      await b.ask('PASS');
      expect(b.judge.calls).toBe(4);
    });

    it('says an outage again when a judged fire came between two', async () => {
      const b = await bridge();
      await b.ask('hang');
      expect(b.sent).toHaveLength(1);
      // Judged: the remembered notice is cleared.
      await b.ask('PASS');
      expect(b.sent).toHaveLength(1);
      await b.ask('hang');
      expect(b.sent).toHaveLength(2);
      expect(b.sent[1]).toBe(b.sent[0]);
    });
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

  it('stages no manifest itself — enrollment is the projector’s, one builder for every harness', () => {
    // The persona's manifest used to be built here, so a second harness needing
    // one would have spelled it a second time. It is now `core/enrollment.ts`'s,
    // emitted by the projector for every adapter that declares `scopedRel`; this
    // surface is the modules alone, one per scope, the session included.
    const out = ompScopeActivatedExtensions([HOOK], ['mav', 'nico']);
    expect(out.map((f) => f.filename)).toEqual([
      OMP_SESSION_MODULE,
      OMP_SESSION_MODULE,
      OMP_SESSION_MODULE,
    ]);
    expect(ompHarnessAdapter.scopedRel?.(STANCE_MANIFEST, 'mav')).toBe(
      `${OMP_SESSION_DIR}/${OMP_PERSONA_DIR}/mav/${STANCE_MANIFEST}`,
    );
    expect(personaRootOf(ompHarnessAdapter)).toBe(
      `${OMP_SESSION_DIR}/${OMP_PERSONA_DIR}`,
    );
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
  modelRoles: Record<string, string> | null = {},
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
  const roles = join(sandbox, 'roles');
  if (modelRoles !== null) place(roles, JSON.stringify(modelRoles));
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
      'if [ "$1" = config ]; then',
      `  [ -f ${roles} ] || exit 1`,
      `  cat ${roles}; exit 0`,
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

  describe('a MAIN session starts on the model route its role gives a spawn', () => {
    // A dispatched architect runs on the host's `modelRoles.architect`; the
    // launcher used to pass no model, so the same persona launched by name ran
    // on whatever omp defaults to. The definition is the one source: the
    // projector's own `model:` line is what the launcher routes by.
    const ARCHITECT = agentToOmpMd(
      { ...(AGENT as object), holds: 'architect' } as never,
      CTX,
    );
    const HOST = {
      default: 'anthropic/claude-opus-5-5:high',
      architect: 'anthropic/claude-sonnet-5-5:high',
    };

    /** The `--model` values omp was started with. */
    const models = (argv: string): string[] => {
      const args = recordedArgv(argv);
      return args.flatMap((a, i) =>
        a === '--model' ? [args[i + 1] as string] : [],
      );
    };

    it('routes by the held role, then the default role, as the definition does', () => {
      const home = deployedHome({ mav: ARCHITECT }, {}, HOST);
      expect(launch(home.bin, home.launcher, ['mav'])).toEqual({
        status: 0,
        stderr: '',
      });
      expect(models(home.argv)).toEqual(['@architect,@default']);
    });

    it('keeps only the roles the host maps: omp refuses an unmapped one a spawn would fall through', () => {
      const noArchitect = deployedHome(
        { mav: ARCHITECT },
        {},
        { default: HOST.default },
      );
      launch(noArchitect.bin, noArchitect.launcher, ['mav']);
      expect(models(noArchitect.argv)).toEqual(['@default']);

      const noDefault = deployedHome(
        { mav: ARCHITECT },
        {},
        { architect: HOST.architect },
      );
      launch(noDefault.bin, noDefault.launcher, ['mav']);
      expect(models(noDefault.argv)).toEqual(['@architect']);
    });

    it('passes no model where the host maps neither, or the definition routes none', () => {
      const unmapped = deployedHome({ mav: ARCHITECT }, {}, { slow: 'x/y' });
      launch(unmapped.bin, unmapped.launcher, ['mav']);
      expect(recordedArgv(unmapped.argv)).not.toContain('--model');

      const holdsNothing = deployedHome(
        { mav: agentToOmpMd(AGENT, CTX) },
        {},
        HOST,
      );
      launch(holdsNothing.bin, holdsNothing.launcher, ['mav']);
      expect(recordedArgv(holdsNothing.argv)).not.toContain('--model');
    });

    it('lets a model the operator names win, in either spelling', () => {
      const home = deployedHome({ mav: ARCHITECT }, {}, HOST);
      launch(home.bin, home.launcher, ['mav', '--model', 'openai/gpt-5.2']);
      expect(models(home.argv)).toEqual(['openai/gpt-5.2']);

      launch(home.bin, home.launcher, ['mav', '--model=opus']);
      const args = recordedArgv(home.argv);
      expect(args).toContain('--model=opus');
      expect(models(home.argv)).toEqual([]);
    });

    it('reads a hand-edited definition in YAML’s other spellings, models as written', () => {
      const BLOCK = [
        '---',
        'name: scribe',
        'description: "writes"',
        'model:',
        '  - "@architect:high"',
        '  - "@missing"',
        '  - openai/gpt-5.2',
        '---',
        '',
        'BODY',
        '',
      ].join('\n');
      const SCALAR = BLOCK.replace(
        /model:\n(?: {2}- .*\n)+/,
        'model: "@architect, @default"\n',
      );
      const home = deployedHome({ block: BLOCK, scalar: SCALAR }, {}, HOST);
      launch(home.bin, home.launcher, ['block']);
      expect(models(home.argv)).toEqual(['@architect:high,openai/gpt-5.2']);
      launch(home.bin, home.launcher, ['scalar']);
      expect(models(home.argv)).toEqual(['@architect,@default']);
    });

    it('says so, and passes no model, when omp will not report the host’s roles', () => {
      const home = deployedHome({ mav: ARCHITECT }, {}, null);
      const { status, stderr } = launch(home.bin, home.launcher, ['mav']);
      expect(status).toBe(0);
      expect(stderr.split('\n').filter(Boolean)).toHaveLength(1);
      expect(stderr).toMatch(/^omp-agent: agent mav: .*modelRoles/);
      expect(recordedArgv(home.argv)).not.toContain('--model');
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

  type Surfaces = {
    status: string[];
    widgets: string[];
    notices: string[];
  };

  /**
   * Load an emitted badge module once and return a function that fires its
   * `session_start` under a `ctx`, returning what it put on every UI surface.
   * RUN, not read: the guard and the baked text are observed the way omp would
   * observe them. The host's agent dir is a temp dir holding `config` as its
   * `config.yml` (none when undefined), so no test reads the machine's own.
   */
  async function load(content: string) {
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
    return (
      ctx: { hasUI: boolean; agent?: { kind: string }; mode?: string },
      config?: string,
      ui?: object,
    ): Surfaces => {
      const agentDir = join(dir, 'agent');
      rmSync(agentDir, { recursive: true, force: true });
      mkdirSync(agentDir);
      if (config !== undefined)
        writeFileSync(join(agentDir, 'config.yml'), config);
      const seen: Surfaces = { status: [], widgets: [], notices: [] };
      vi.stubEnv('PI_CODING_AGENT_DIR', agentDir);
      try {
        handlers.get('session_start')?.(
          {},
          {
            hasUI: ctx.hasUI,
            // omp names a LAUNCHED persona `main` — which is why the module cannot
            // read its own name and must carry it baked in. An omp before 18.3.2
            // has no `agent` at all.
            ...(ctx.agent ? { agent: { ...ctx.agent, name: 'main' } } : {}),
            ...(ctx.mode ? { mode: ctx.mode } : {}),
            ui: ui ?? {
              setStatus: (_key: string, text: string) => seen.status.push(text),
              setWidget: (_key: string, lines: string[]) =>
                seen.widgets.push(...lines),
              notify: (message: string) => seen.notices.push(message),
            },
          },
        );
      } finally {
        vi.unstubAllEnvs();
      }
      return seen;
    };
  }

  /** One module, one session. */
  async function run(
    content: string,
    ctx: { hasUI: boolean; agent?: { kind: string }; mode?: string },
    config?: string,
  ): Promise<Surfaces> {
    return (await load(content))(ctx, config);
  }

  const MAIN = { hasUI: true, agent: { kind: 'main' } };

  /** A `statusLine` that is an alias to a mapping written elsewhere in the file,
   *  which hides the row — the one shape install cannot reach. */
  const ALIASED_HIDDEN_ROW = [
    'defaults: &line',
    '  preset: default',
    '  showHookStatus: false',
    'statusLine: *line',
    '',
  ].join('\n');
  /** What install writes where it can: the segment inline, the row off. */
  const INLINE_SEGMENT = [
    'statusLine:',
    '  preset: custom',
    '  leftSegments:',
    '    - model',
    '    - status',
    '  showHookStatus: false',
    '',
  ].join('\n');

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
    expect((await run(nico?.content as string, MAIN)).status).toEqual([
      '📐 nico',
    ]);
  });

  it('shows the name ALONE for an agent with no provenance', async () => {
    const out = badges([{ name: 'x', provenance: null } as never]);
    expect(out.map((f) => [f.filename, f.scope])).toEqual([
      [OMP_PERSONA_BADGE_MODULE, 'x'],
    ]);
    expect((await run(out[0]?.content as string, MAIN)).status).toEqual(['x']);
  });

  it("shows only in a top-level interactive session, never a subagent's — on any surface", async () => {
    const [nico] = badges([NICO]);
    const content = nico?.content as string;
    const none = { status: [], widgets: [], notices: [] };
    expect(
      await run(content, { hasUI: false, agent: { kind: 'main' } }),
    ).toEqual(none);
    // The hidden-row config is the case that adds the widget: a subagent gets
    // neither it nor the status.
    expect(
      await run(
        content,
        { hasUI: true, agent: { kind: 'sub' } },
        ALIASED_HIDDEN_ROW,
      ),
    ).toEqual(none);
    // And with no `ctx.agent` to say so, a session omp runs headless (`print`).
    expect(await run(content, { hasUI: true, mode: 'print' })).toEqual(none);
  });

  it('puts the badge on a second surface where the status row is hidden by an alias', async () => {
    const [nico] = badges([NICO]);
    const seen = await run(nico?.content as string, MAIN, ALIASED_HIDDEN_ROW);
    expect(seen.status).toEqual(['📐 nico']);
    expect(seen.widgets).toEqual(['📐 nico']);
  });

  it('sets the status alone where the row is shown or the segment draws it inline', async () => {
    const [nico] = badges([NICO]);
    const content = nico?.content as string;
    for (const config of [
      undefined,
      'statusLine:\n  preset: custom\n',
      'statusLine:\n  showHookStatus: true\n',
      '# showHookStatus: false\nmodelRoles: {}\n',
      INLINE_SEGMENT,
    ]) {
      const seen = await run(content, MAIN, config);
      expect(seen.status).toEqual(['📐 nico']);
      expect(seen.widgets).toEqual([]);
    }
  });

  describe('on an omp without ctx.agent (before 18.3.2)', () => {
    it('throws nothing and shows the badge where ctx.mode still says it is the terminal host', async () => {
      const [nico] = badges([NICO]);
      const seen = await run(nico?.content as string, {
        hasUI: true,
        mode: 'tui',
      });
      expect(seen.status).toEqual(['📐 nico']);
      expect(seen.notices).toEqual([]);
    });

    it('says once, in one line, why it shows none where nothing can tell', async () => {
      const [nico] = badges([NICO]);
      // ONE module instance, two sessions: the second says nothing.
      const session = await load(nico?.content as string);
      const first = session({ hasUI: true });
      expect(first.status).toEqual([]);
      expect(first.widgets).toEqual([]);
      expect(first.notices).toHaveLength(1);
      expect(first.notices[0]).toMatch(/18\.3\.2/);
      expect(first.notices[0]).not.toMatch(/\n/);
      expect(session({ hasUI: true }).notices).toEqual([]);
    });

    it('throws nothing against a context whose ui carries only setStatus', async () => {
      const [nico] = badges([NICO]);
      const session = await load(nico?.content as string);
      expect(() =>
        session({ hasUI: true }, undefined, { setStatus: () => {} }),
      ).not.toThrow();
    });
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
        [
          'implementer',
          'integrator',
          'planner',
          'assayer',
          'architect',
          'unheard-of',
        ].map((r) => [r, routing.nearest(r)]),
      ),
    ).toEqual({
      implementer: 'task',
      integrator: 'task',
      planner: 'plan',
      assayer: 'default',
      architect: 'default',
      'unheard-of': 'default',
    });
  });

  it('names the host config files in the order omp reads them: config.yml, then config.yaml', () => {
    expect(routing?.configRels).toEqual([
      'agent/config.yml',
      'agent/config.yaml',
    ]);
  });

  it('is omp alone — claude leaves the member absent', () => {
    expect(adapterByName('claude').roleRouting).toBeUndefined();
    expect(adapterByName('omp').roleRouting).toBeDefined();
  });
});

// ── Dispatch isolation ───────────────────────────────────────────────────────
//
// omp starts no agent in a worktree of its own, but an isolated task runs in a copy of
// the dispatcher's checkout, and a `tool_call` handler may revise a call's input. So a
// dispatch of an agent declaring a worktree becomes an isolated task, and these legs RUN
// the emitted handler the way omp calls it.
describe('omp dispatch isolation', () => {
  const agent = (name: string, isolation?: 'worktree') =>
    ({
      ...(AGENT as object),
      name,
      ...(isolation ? { isolation } : {}),
    }) as never;
  const implementer = agent('implementer', 'worktree');
  const planner = agent('planner');

  const modules = (agents: never[]) =>
    (ompHarnessAdapter.launchSurface?.(agents) ?? []).filter(
      (f) => f.filename === OMP_ISOLATION_MODULE,
    );

  type Revision = { input: Record<string, unknown> } | undefined;
  type Handler = (event: {
    toolName: string;
    input: Record<string, unknown>;
  }) => Promise<Revision>;

  /** The handler an emitted module registers on `tool_call`, loaded as omp loads it. */
  async function handlerOf(content: string): Promise<Handler> {
    const dir = mkdtempSync(join(tmpdir(), 'omp-isolation-'));
    tmp.push(dir);
    const file = join(dir, OMP_ISOLATION_MODULE);
    writeFileSync(file, content);
    const registered: Record<string, Handler> = {};
    // Dynamic by necessity: the module is the projection's OUTPUT, written above.
    const mod = (await import(file)) as {
      default: (pi: { on: (event: string, h: Handler) => void }) => void;
    };
    mod.default({
      on: (event, h) => Object.assign(registered, { [event]: h }),
    });
    expect(Object.keys(registered)).toEqual(['tool_call']);
    return registered.tool_call as Handler;
  }

  it('places one module in the session scope and one in each persona, and none where no agent declares a worktree', () => {
    expect(modules([implementer, planner]).map((m) => m.scope)).toEqual([
      SESSION_SCOPE,
      'implementer',
      'planner',
    ]);
    expect(modules([planner])).toEqual([]);
  });

  it('sets isolated on the spawns of an agent declaring a worktree, in a batch, and on no other spawn', async () => {
    const [session] = modules([implementer, planner]);
    const handle = await handlerOf(session?.content as string);
    const batch = {
      context: 'c',
      tasks: [
        { agent: 'implementer', task: 'build' },
        { agent: 'planner', task: 'plan' },
        { task: 'default agent' },
      ],
    };
    const revised = await handle({ toolName: 'task', input: batch });
    expect(revised?.input).toEqual({
      context: 'c',
      tasks: [
        { agent: 'implementer', task: 'build', isolated: true },
        { agent: 'planner', task: 'plan' },
        { task: 'default agent' },
      ],
    });
    // The call's own object is not the one revised.
    expect(batch.tasks[0]).toEqual({ agent: 'implementer', task: 'build' });
  });

  it('sets isolated on a flat call, overrides an explicit false, and leaves what needs no revision', async () => {
    const [session] = modules([implementer, planner]);
    const handle = await handlerOf(session?.content as string);
    expect(
      (
        await handle({
          toolName: 'task',
          input: { agent: 'implementer', task: 't', isolated: false },
        })
      )?.input,
    ).toEqual({ agent: 'implementer', task: 't', isolated: true });
    for (const input of [
      { agent: 'implementer', task: 't', isolated: true },
      { agent: 'planner', task: 't' },
      { task: 't' },
    ]) {
      expect(await handle({ toolName: 'task', input })).toBeUndefined();
    }
    expect(
      await handle({
        toolName: 'bash',
        input: { agent: 'implementer', command: 'ls' },
      }),
    ).toBeUndefined();
  });

  it('names what the host must hold for the flag to exist and keep the copy out of the dispatcher’s checkout', () => {
    expect(ompHarnessAdapter.startsInWorktree).toBe(false);
    expect(ompHarnessAdapter.dispatchIsolation?.settings).toEqual({
      parent: ['task', 'isolation'],
      entries: { enabled: 'true', apply: 'false', merge: 'branch' },
    });
    expect(adapterByName('claude').dispatchIsolation).toBeUndefined();
  });
});
