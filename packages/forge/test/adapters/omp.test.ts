// The omp adapter's gates.
//
// Each leg pins a fact that was MEASURED against `@oh-my-pi/pi-coding-agent@17.2.9`
// and would otherwise be held by prose alone. Where a leg exists because something
// went wrong, the wrong thing is named — a fixture pinned to a law outlives the
// incident that produced it, and one pinned to the incident is a museum piece.

import { describe, expect, it } from 'vitest';
import {
  OMP_BLOCKING_EVENTS,
  agentToOmpAppendSystem,
  canonicalActToOmp,
  canonicalToOmp,
  ompAgentRel,
  ompBindingOf,
  ompExtensionRel,
  ompGuardrailExtensions,
  ompHarnessAdapter,
} from '../../src/adapters/omp/index.js';
import { FIXTURE_MANIFEST } from '../fixture-manifest.js';

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
  it('binds turn.end to agent_end, NOT to turn_end', () => {
    // omp's "turn" is a MODEL turn — `turnIndex` increments within one user
    // exchange — so `turn_end` fires several times per exchange. Binding the
    // memory nudge there would have produced a nudge storm that reads as the CELL
    // misbehaving rather than the mapping.
    expect(canonicalToOmp['turn.end']).toBe('agent_end');
    expect(Object.values(canonicalToOmp)).not.toContain('turn_end');
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
  it('scopes every event it realizes — the profile dir IS the scope', () => {
    // This is the shard's whole finding. The bootstrap concluded every enforcing
    // fragment degrades to `steer` on omp because there was no identity to scope
    // to. There is: the profile. A module in `profiles/<agent>/agent/extensions/`
    // loads under that profile and no other.
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

  it('lands the persona and the guardrails under the SAME profile dir', () => {
    // If these ever disagree, the persona loads for one profile and its guardrails
    // for another — enforcement silently governing the wrong agent, which is the
    // widening MODEL forbids outright.
    expect(ompAgentRel('mav')).toBe('profiles/mav/agent/APPEND_SYSTEM.md');
    expect(ompExtensionRel('mav')).toMatch(
      /^profiles\/mav\/agent\/extensions\//,
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

  it('emits ONE module per composing agent, each in that agent’s own profile', () => {
    const out = ompGuardrailExtensions(
      [binding(['mav', 'nico'], ['turn.end'])] as never,
      MECH,
    );
    expect(out.map((f) => f.filename).sort()).toEqual([
      ompExtensionRel('mav'),
      ompExtensionRel('nico'),
    ]);
  });

  it('writes NO runtime identity check — the location is the scope', () => {
    // The easy read of this harness is one global module branching on
    // `process.env.OMP_PROFILE`. That is precisely the "runtime self-filter"
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
    expect(OMP_BLOCKING_EVENTS.has('tool_call')).toBe(true);
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

  it('emits nothing when the mechanism is absent — and that is the codex bug', () => {
    // EXONERATING FIXTURE. Without a mechanism there is no command to wire, so
    // emitting nothing is correct. What was NOT correct was reaching this state
    // because the port dropped `mechanisms` on the floor: codex's adapter wired
    // `enforcingSurface` at arity 1, so every call took this branch and its
    // per-agent guardrails reached the host as nothing at all — green throughout,
    // because the unit tests call the function directly with a map the production
    // path never supplied.
    expect(
      ompGuardrailExtensions([binding(['mav'], ['turn.end'])] as never),
    ).toEqual([]);
  });
});
