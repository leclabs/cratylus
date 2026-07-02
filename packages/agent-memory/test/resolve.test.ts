import { describe, expect, it } from 'vitest';
import {
  type HostEnv,
  assertScope,
  createHostEnv,
  parseScope,
  resolveFile,
} from '../src/resolve.js';

/** Two simulated hosts differing only in home root — the portability scenario. */
function hostFor(homeRoot: string): HostEnv {
  return createHostEnv(`${homeRoot}/.claude/agents/mav`, {
    polis: `${homeRoot}/workspaces/polis`,
  });
}

const LEX = hostFor('/Users/lex');
const LCAR = hostFor('/Users/lcaraccioli');

describe('parseScope', () => {
  it('parses user and project scopes', () => {
    expect(parseScope('user')).toEqual({ tier: 'user' });
    expect(parseScope('project:polis')).toEqual({
      tier: 'project',
      key: 'polis',
    });
  });

  it('parses plan scopes (tag grammar: plan:<key>/<plan>)', () => {
    expect(parseScope('plan:polis/scoped-memory')).toEqual({
      tier: 'plan',
      key: 'polis',
      plan: 'scoped-memory',
    });
  });

  it('rejects unknown or malformed scopes', () => {
    expect(() => parseScope('global')).toThrow();
    expect(() => parseScope('project:')).toThrow();
    expect(() => assertScope('nope')).toThrow();
    expect(() => assertScope('bogus:x')).toThrow(/Unknown scope/);
  });

  it('rejects malformed plan scopes loudly (shape is exactly plan:<key>/<plan>)', () => {
    expect(() => parseScope('plan:')).toThrow(/plan:<key>\/<plan>/);
    expect(() => parseScope('plan:polis')).toThrow(/plan:<key>\/<plan>/);
    expect(() => parseScope('plan:polis/')).toThrow(/plan:<key>\/<plan>/);
    expect(() => parseScope('plan:/scoped-memory')).toThrow(
      /plan:<key>\/<plan>/,
    );
    expect(() => parseScope('plan:polis/a/b')).toThrow(/plan:<key>\/<plan>/);
    expect(() => parseScope('plan:polis/sco ped')).toThrow(
      /plan:<key>\/<plan>/,
    );
  });
});

describe('resolveFile', () => {
  it('resolves user scope to agentHome()/path', () => {
    expect(resolveFile(LEX, 'user', 'EPISODIC.jsonl')).toBe(
      '/Users/lex/.claude/agents/mav/EPISODIC.jsonl',
    );
  });

  it('resolves project scope to projectRoot(key)/path', () => {
    expect(resolveFile(LEX, 'project:polis', 'notes/EPISODIC.jsonl')).toBe(
      '/Users/lex/workspaces/polis/notes/EPISODIC.jsonl',
    );
  });

  it('PORTABILITY GATE: same (scope, path) → same logical store on two home roots', () => {
    // The stored identity is (scope, path); each host derives its own absolute
    // path. Strip the host-specific home prefix and the logical store is identical.
    const rel = (
      host: HostEnv,
      scope: 'user' | `project:${string}`,
      p: string,
    ) => resolveFile(host, scope, p);

    const lexUser = rel(LEX, 'user', 'EPISODIC.jsonl');
    const lcarUser = rel(LCAR, 'user', 'EPISODIC.jsonl');
    expect(lexUser).toBe('/Users/lex/.claude/agents/mav/EPISODIC.jsonl');
    expect(lcarUser).toBe(
      '/Users/lcaraccioli/.claude/agents/mav/EPISODIC.jsonl',
    );
    // Same logical suffix beneath each host's agent home.
    expect(lexUser.replace('/Users/lex', '')).toBe(
      lcarUser.replace('/Users/lcaraccioli', ''),
    );

    const lexProj = rel(LEX, 'project:polis', 'sub/EPISODIC.jsonl');
    const lcarProj = rel(LCAR, 'project:polis', 'sub/EPISODIC.jsonl');
    expect(lexProj.replace('/Users/lex', '')).toBe(
      lcarProj.replace('/Users/lcaraccioli', ''),
    );
  });

  it('resolves plan scope to projectRoot(key)/plans/<plan>/path (routed-target base)', () => {
    // The SPEC §2 plan home: a plan-scoped dream target with path AGENTS.md
    // lands in plans/<plan>/AGENTS.md under the project key's tree.
    expect(resolveFile(LEX, 'plan:polis/scoped-memory', 'AGENTS.md')).toBe(
      '/Users/lex/workspaces/polis/plans/scoped-memory/AGENTS.md',
    );
    // Portability holds for the plan tier too.
    expect(
      resolveFile(LCAR, 'plan:polis/scoped-memory', 'AGENTS.md').replace(
        '/Users/lcaraccioli',
        '',
      ),
    ).toBe(
      resolveFile(LEX, 'plan:polis/scoped-memory', 'AGENTS.md').replace(
        '/Users/lex',
        '',
      ),
    );
  });

  it('plan scope with an unknown project key still fails loudly', () => {
    expect(() =>
      resolveFile(LEX, 'plan:unknown/some-plan', 'AGENTS.md'),
    ).toThrow(/Unknown project/);
  });

  it('rejects absolute paths (no absolute-path storage)', () => {
    expect(() => resolveFile(LEX, 'user', '/etc/passwd')).toThrow(/absolute/);
  });

  it('rejects paths that escape the scope base', () => {
    expect(() => resolveFile(LEX, 'user', '../../../etc/passwd')).toThrow(
      /escape/,
    );
    expect(() => resolveFile(LEX, 'user', '..')).toThrow(/escape/);
  });

  it('normalizes interior . and intermediate .. that stay within base', () => {
    expect(resolveFile(LEX, 'user', './a/b/../EPISODIC.jsonl')).toBe(
      '/Users/lex/.claude/agents/mav/a/EPISODIC.jsonl',
    );
  });

  it('rejects empty path and unknown project key', () => {
    expect(() => resolveFile(LEX, 'user', '')).toThrow();
    expect(() => resolveFile(LEX, 'project:unknown', 'x')).toThrow(
      /Unknown project/,
    );
  });

  it('createHostEnv requires absolute roots', () => {
    expect(() => createHostEnv('relative/home')).toThrow(/absolute/);
  });
});
