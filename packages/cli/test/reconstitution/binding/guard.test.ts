import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Fixture } from '../../agent-launch/fixture.js';
import type { LoadedExtension } from './fixture.js';
import { bindingFixture, load } from './fixture.js';

const judge = vi.hoisted(() => ({ verdict: '', calls: [] as unknown[] }));
vi.mock('@oh-my-pi/pi-ai', () => ({
  completeSimple: async (_model: unknown, input: unknown) => {
    judge.calls.push(input);
    return {
      role: 'assistant',
      content: [{ type: 'text', text: judge.verdict }],
    };
  },
}));

let f: Fixture;
let extension: LoadedExtension | undefined;
beforeEach(() => {
  f = bindingFixture();
  judge.calls.length = 0;
});
afterEach(() => {
  extension?.restore();
  extension = undefined;
  f?.dispose();
});

async function guarded(role: string) {
  const module = join(f.home, '.omp/agent/extensions/cratylus-session.ts');
  expect(
    existsSync(module),
    'agents/11: a delivered executable guard checks the affected act; prose alone never counts',
  ).toBe(true);
  extension = await load(f, { role });
  // This is the generated installed session module, whose path is created at runtime.
  const factory = (await import(module)).default;
  extension.pi.cwd = f.cwd;
  extension.pi.sendUserMessage = () => {};
  extension.pi.exec = async (binary: string, args: string[]) => {
    const result = spawnSync(binary, args, {
      cwd: f.cwd,
      env: f.env,
      encoding: 'utf8',
      timeout: 30_000,
    });
    if (result.error) throw result.error;
    return {
      code: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
      killed: false,
    };
  };
  extension.ctx.modelRegistry = {
    getApiKeyAndHeaders: async () => ({ ok: true, apiKey: 'fixture-only' }),
  };
  await factory(extension.pi);
  await extension.fire('session_start');
  expect(
    extension.handlers.has('session_stop'),
    'guard is bound to the act, not another prose reminder',
  ).toBe(true);
  return extension;
}
const turn = (reply: string) => ({
  type: 'session_stop',
  session_id: 'guard-session',
  stop_hook_active: false,
  last_assistant_message: reply,
  messages: [
    {
      role: 'user',
      content:
        'The creative accepts the finished film. You own the meaning decision separating approval from release. Resolve it.',
    },
    { role: 'assistant', content: [{ type: 'text', text: reply }] },
  ],
});

describe('agents/11 — executable guard holds the observed owned-decision drift', () => {
  it('blocks hand-back after judging the affected reply, naming the tell', async () => {
    const ext = await guarded('architect');
    const reply =
      'Should approval and release be distinct? Please choose the meaning for me.';
    judge.verdict = JSON.stringify({
      handsBack: true,
      reason:
        'The architect returns its owned meaning decision to the operator.',
    });
    const result = await ext.fire('session_stop', turn(reply));
    expect(
      judge.calls.length,
      'a guard checks the affected act',
    ).toBeGreaterThan(0);
    expect(
      JSON.stringify(judge.calls),
      'the actual reply, not only the profile, is judged',
    ).toContain(reply);
    expect(result?.decision, 'observed hand-back is held by the guard').toBe(
      'block',
    );
    expect(result?.reason, 'refusal names the tell').toContain('hand-back');
    expect(result?.reason).toContain('owned meaning decision');
  });
  it('allows a reply that decides, so the guard does not punish the fixed stance', async () => {
    const ext = await guarded('architect');
    const reply =
      'Approval is the creative accepting the finished film. Release admits a change to the project; I keep them distinct because their authorities and outcomes differ.';
    judge.verdict = JSON.stringify({
      handsBack: false,
      reason: 'The architect decides the owned meaning.',
    });
    const result = await ext.fire('session_stop', turn(reply));
    expect(
      judge.calls.length,
      'guard still checks the affected act',
    ).toBeGreaterThan(0);
    expect(result?.decision, 'a reply that decides passes').not.toBe('block');
  });
  it('does not judge another role for the architect-only observed drift', async () => {
    const ext = await guarded('illustrator');
    judge.verdict = JSON.stringify({
      handsBack: true,
      reason: 'This result must never be asked of another role.',
    });
    const result = await ext.fire(
      'session_stop',
      turn(
        'Does the creative mean approval here? This term needs the meaning-holder.',
      ),
    );
    expect(
      judge.calls,
      'guard composes for the architect, not every agent',
    ).toEqual([]);
    expect(result?.decision).not.toBe('block');
  });
});
