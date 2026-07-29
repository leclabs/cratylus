import { describe, expect, it } from 'vitest';
import { agentToClaudeMd } from '../../src/adapters/claude/anatomy.js';
import type { Agent, Guardrails } from '../../src/anatomy/index.js';

// The adapter change: a guardrail that enforces is emitted as a hook in THAT
// agent's own front-matter. Claude Code fires a subagent's front-matter hooks
// only while that subagent runs, so composition IS the scope — replacing a global
// hook plus a runtime `agent_type` allowlist, i.e. scope living in the
// enforcement code where the agent it governs could not see it.

const stance: Guardrails = {
  body: 'stance ≜ hold the stance',
  substrate: 'harness',
  events: ['turn.end', 'subagent.end'],
  order: 0,
  command: 'sh "$HOME/.claude/hooks/stance/stance.sh"',
  timeout: 60,
  workers: [],
};
const preStance: Guardrails = {
  body: 'stance-pre ≜ refuse the collapsing call',
  substrate: 'harness',
  events: ['tool.use.pre'],
  order: 1,
  matcher: 'AskUserQuestion|Agent',
  command: 'sh "$HOME/.claude/hooks/stance-pre/stance-pre.sh"',
  workers: [],
};
const gitSide: Guardrails = {
  body: 'continuity ≜ advance the plan',
  substrate: 'git',
  events: ['vcs.commit.post'],
  command: 'sh advance.sh',
  workers: [],
};
const bare: Guardrails = 'honesty ≜ assert from evidence';

const mk = (name: string, guardrails: readonly Guardrails[]): Agent =>
  ({ name, description: 'd', archetype: 'a', guardrails }) as unknown as Agent;

const frontMatter = (md: string) => md.split('---')[1] ?? '';

describe('per-agent hooks — composition becomes attachment', () => {
  it('emits a hooks block for an agent that composes an enforcing guardrail', () => {
    const fm = frontMatter(agentToClaudeMd(mk('nico', [stance])));
    expect(fm).toContain('hooks:');
    expect(fm).toContain('Stop:');
    expect(fm).toContain('SubagentStop:');
    expect(fm).toContain('type: command');
    expect(fm).toContain('stance.sh');
    expect(fm).toContain('timeout: 60');
  });

  it('emits NO hooks block for an agent that composes only bare guardrails', () => {
    // The negative half — the proof that scope is real rather than universal.
    const fm = frontMatter(agentToClaudeMd(mk('tester', [bare])));
    expect(fm).not.toContain('hooks:');
  });

  it('carries `matcher` through as the residual DYNAMIC binding', () => {
    // Attachment fixes WHICH AGENT; a static mark cannot express a
    // runtime-conditional policy, so the matcher survives for that part.
    const fm = frontMatter(agentToClaudeMd(mk('nico', [preStance])));
    expect(fm).toContain('PreToolUse:');
    expect(fm).toContain('matcher: "AskUserQuestion|Agent"');
  });

  it('NEVER emits a git-substrate constraint as a harness hook', () => {
    // A git hook is not a harness hook. It fires in git's own process and has no
    // business in settings/front-matter; emitting it here would be a mechanism
    // that silently never runs.
    const fm = frontMatter(agentToClaudeMd(mk('nico', [gitSide])));
    expect(fm).not.toContain('hooks:');
    expect(fm).not.toContain('vcs.commit.post');
  });

  it('honours `order` — a blocking gate before a non-blocking one', () => {
    // Both fire on tool.use.pre so they share an event key; order decides which
    // entry is written first. Alphabetical would put the wrong one first.
    const first: Guardrails = {
      ...preStance,
      order: 0,
      command: 'sh first.sh',
    };
    const second: Guardrails = {
      ...preStance,
      order: 1,
      command: 'sh second.sh',
    };
    const fm = frontMatter(agentToClaudeMd(mk('nico', [second, first])));
    expect(fm.indexOf('first.sh')).toBeLessThan(fm.indexOf('second.sh'));
  });

  it('the SOUL body still carries the DECLARATION, not the mechanism', () => {
    const md = agentToClaudeMd(mk('nico', [stance]));
    const body = md.split('---').slice(2).join('---');
    expect(body).toContain('stance ≜ hold the stance');
    expect(body).not.toContain('stance.sh');
  });
});
