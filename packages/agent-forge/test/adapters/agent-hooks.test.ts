import type { HarnessMechanism } from '@leclabs/agent-schema/hook';
import { describe, expect, it } from 'vitest';
import { agentToClaudeMd } from '../../src/adapters/claude/anatomy.js';
import {
  FIXTURE_ANATOMY,
  type FixtureAgent,
  type FixtureValue,
} from '../fixture-anatomy.js';

type Agent = FixtureAgent;
type Guardrails = FixtureValue<'guardrails'>;

// A guardrail that enforces is emitted as a hook in THAT agent's own
// front-matter — Claude Code fires a subagent's front-matter hooks only while it
// runs, so composition IS the scope.
//
// The VALUE carries only ⟨body, substrate, events⟩. The MECHANISM is injected,
// because MODEL makes it a function of (fragment, adapter) that deploy emits:
// `mechanism : fragment × harness-adapter ⇀ harness-mechanism`. A cell holding a
// command would be a BEING carrying one FACE's bytes.

const stance: Guardrails = {
  body: 'stance ≜ hold the stance',
  substrate: 'harness',
  events: ['turn.end', 'subagent.end'],
};
const preStance: Guardrails = {
  body: 'stance-pre ≜ refuse the collapsing call',
  substrate: 'harness',
  events: ['tool.use.pre'],
};
const gitSide: Guardrails = {
  body: 'continuity ≜ advance the plan',
  substrate: 'git',
  events: ['vcs.commit.post'],
};
const bare: Guardrails = 'honesty ≜ assert from evidence';

const mech = (
  command: string,
  extra: Partial<HarnessMechanism> = {},
): HarnessMechanism => ({ command, workers: [], ...extra });

const MECHANISMS = new Map<string, HarnessMechanism>([
  ['stance', mech('sh stance.sh', { timeout: 60, order: 0 })],
  [
    'stance-pre',
    mech('sh stance-pre.sh', { matcher: 'AskUserQuestion|Agent', order: 1 }),
  ],
  ['continuity', mech('sh advance.sh')],
]);

const mk = (name: string, guardrails: readonly Guardrails[]): Agent =>
  ({ name, description: 'd', archetype: 'a', guardrails }) as unknown as Agent;

const fm = (a: Agent) =>
  agentToClaudeMd(a, {
    manifest: FIXTURE_ANATOMY,
    mechanisms: MECHANISMS,
  }).split('---')[1] ?? '';

describe('per-agent hooks — composition becomes attachment', () => {
  it('emits a hooks block for an agent composing an enforcing guardrail', () => {
    const out = fm(mk('nico', [stance]));
    expect(out).toContain('hooks:');
    expect(out).toContain('Stop:');
    expect(out).toContain('SubagentStop:');
    expect(out).toContain('stance.sh');
    expect(out).toContain('timeout: 60');
  });

  it('emits NO hooks block for an agent composing only bare guardrails', () => {
    // The negative half — the proof that scope is real rather than universal.
    expect(fm(mk('tester', [bare]))).not.toContain('hooks:');
  });

  it('carries `matcher` through as the residual DYNAMIC binding', () => {
    const out = fm(mk('nico', [preStance]));
    expect(out).toContain('PreToolUse:');
    expect(out).toContain('matcher: "AskUserQuestion|Agent"');
  });

  it('NEVER emits a git-substrate constraint as a harness hook', () => {
    // A git hook fires in git's own process; emitting it here would install a
    // mechanism that silently never runs.
    const out = fm(mk('nico', [gitSide]));
    expect(out).not.toContain('hooks:');
    expect(out).not.toContain('vcs.commit.post');
  });

  it('honours `order` from the MECHANISM — a blocking gate before a nudge', () => {
    // Order sorts WITHIN an event, so both must fire on the same one.
    const gate: Guardrails = {
      body: 'gate ≜ block',
      substrate: 'harness',
      events: ['tool.use.pre'],
    };
    const nudge: Guardrails = {
      body: 'nudge ≜ suggest',
      substrate: 'harness',
      events: ['tool.use.pre'],
    };
    const m = new Map<string, HarnessMechanism>([
      ['gate', mech('sh gate.sh', { order: 0 })],
      ['nudge', mech('sh nudge.sh', { order: 1 })],
    ]);
    // Composed nudge-first; `order` must still put the blocking gate first.
    const out = agentToClaudeMd(mk('nico', [nudge, gate]), {
      manifest: FIXTURE_ANATOMY,
      mechanisms: m,
    });
    expect(out.indexOf('gate.sh')).toBeLessThan(out.indexOf('nudge.sh'));
  });

  it('the SOUL body carries the DECLARATION, never the mechanism', () => {
    const md = agentToClaudeMd(mk('nico', [stance]), {
      manifest: FIXTURE_ANATOMY,
      mechanisms: MECHANISMS,
    });
    const body = md.split('---').slice(2).join('---');
    expect(body).toContain('stance ≜ hold the stance');
    expect(body).not.toContain('stance.sh');
  });
});

describe('an unresolved mechanism emits nothing — the source cell is innocent', () => {
  it('omits a value whose mechanism was not injected', () => {
    // The value still DECLARES its bound; this adapter simply has no realization
    // for it. That gap is what the ENFORCED leg convicts as `unprojected`, which
    // is the right home for it — silently emitting a hookless agent is not.
    const out = agentToClaudeMd(mk('nico', [stance]), {
      manifest: FIXTURE_ANATOMY,
      mechanisms: new Map(),
    }).split('---')[1];
    expect(out).not.toContain('hooks:');
  });
});
