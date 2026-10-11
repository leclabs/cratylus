import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import {
  bottomLine,
  handBack,
  ownedQuestionJudgment,
  unrecorded,
} from '@cratylus/canon';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Fixture } from './agent-launch/fixture.js';
import type { LoadedExtension } from './reconstitution/binding/fixture.js';
import { bindingFixture, load } from './reconstitution/binding/fixture.js';

// 0101 over the installed architect: a model-free run of the generated session module, whose
// judge answers by the system prompt it is asked with.
const judge = vi.hoisted(() => ({
  answers: {} as Record<string, string>,
  calls: [] as { prompt: string; payload: string }[],
}));
vi.mock('@oh-my-pi/pi-ai', () => ({
  completeSimple: async (_model: unknown, input: unknown) => {
    const fields =
      input !== null && typeof input === 'object' ? { ...input } : {};
    const prompts = 'systemPrompt' in fields ? fields.systemPrompt : undefined;
    const prompt: unknown = Array.isArray(prompts) ? prompts[0] : undefined;
    const messages = 'messages' in fields ? fields.messages : undefined;
    const first: unknown = Array.isArray(messages) ? messages[0] : undefined;
    const payload =
      first !== null &&
      typeof first === 'object' &&
      'content' in first &&
      typeof first.content === 'string'
        ? first.content
        : '';
    const asked = typeof prompt === 'string' ? prompt : '';
    judge.calls.push({ prompt: asked, payload });
    return {
      role: 'assistant',
      content: [{ type: 'text', text: judge.answers[asked] ?? '' }],
    };
  },
}));

let f: Fixture;
let extension: LoadedExtension | undefined;
beforeEach(() => {
  f = bindingFixture();
  judge.calls.length = 0;
  judge.answers = {};
});
afterEach(() => {
  extension?.restore();
  extension = undefined;
  f?.dispose();
});

async function architect() {
  extension = await load(f, { role: 'architect' });
  // The generated installed session module, whose path is created at runtime.
  const factory = (
    await import(join(f.home, '.omp/agent/extensions/cratylus-session.ts'))
  ).default;
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
  return extension;
}

const reply =
  'Should approval and release be distinct? Please choose the meaning for me.';
const stop = {
  type: 'session_stop',
  session_id: 'judgment-session',
  stop_hook_active: false,
  last_assistant_message: reply,
  messages: [
    {
      role: 'user',
      content:
        'The creative accepts the finished film. Separate approval from release.',
    },
    { role: 'assistant', content: [{ type: 'text', text: reply }] },
  ],
};
const held = {
  questions: [
    {
      question: 'Are approval and release distinct?',
      holds: true,
      reason: 'The design gives them different authorities.',
    },
  ],
};
const readers = [handBack, bottomLine, unrecorded];
const askedUnder = (prompt: string) =>
  judge.calls.filter((c) => c.prompt === prompt).map((c) => c.payload);

describe('0101 — whether the architect holds what an owned question needs is judged once, and every guard reads that one judgment', () => {
  it('makes the judgment once for a stop, by its one rule, and gives that one answer to each guard that reads it', async () => {
    const ext = await architect();
    judge.answers = {
      [ownedQuestionJudgment.prompt]: JSON.stringify(held),
      [handBack.judge.prompt]: JSON.stringify({
        handsBack: true,
        reason: 'It returns an owned meaning decision it holds.',
      }),
      [bottomLine.judge.prompt]: JSON.stringify({
        buries: false,
        reason: 'In shape.',
      }),
      [unrecorded.judge.prompt]: JSON.stringify({
        unrecorded: false,
        reason: 'It reports nothing settled.',
      }),
    };
    const result = await ext.fire('session_stop', stop);
    expect(askedUnder(ownedQuestionJudgment.prompt)).toHaveLength(1);
    const given = `Judgment owned-question, made once for this act:\n${JSON.stringify(held)}`;
    for (const guard of readers) {
      const asked = askedUnder(guard.judge.prompt);
      expect(asked, guard.id).toHaveLength(1);
      expect(asked[0], guard.id).toContain(`${given}\n\n`);
      expect(asked[0], guard.id).toContain(reply);
    }
    // The rule's grounds reach the judge of the one judgment, and no other.
    const ruled = judge.calls.filter(
      (c) =>
        c.prompt.includes("known practice of the product's industry") ||
        c.payload.includes("known practice of the product's industry"),
    );
    expect(ruled.map((c) => c.prompt)).toEqual([ownedQuestionJudgment.prompt]);
    expect(result?.decision).toBe('block');
    expect(result?.reason).toContain(
      'hand-back: this reply returns a decision you own to the operator.',
    );
  });

  it('fails open when the judgment cannot be made: each guard reading it is told so, judges the act, and refuses nothing on it', async () => {
    const ext = await architect();
    judge.answers = {
      [ownedQuestionJudgment.prompt]: 'It seems held.',
      [handBack.judge.prompt]: JSON.stringify({
        handsBack: false,
        reason: 'No judgment was made to refuse on.',
      }),
      [bottomLine.judge.prompt]: JSON.stringify({
        buries: false,
        reason: 'In shape.',
      }),
      [unrecorded.judge.prompt]: JSON.stringify({
        unrecorded: false,
        reason: 'It reports nothing settled.',
      }),
    };
    const result = await ext.fire('session_stop', stop);
    expect(askedUnder(ownedQuestionJudgment.prompt)).toHaveLength(1);
    for (const guard of readers) {
      const asked = askedUnder(guard.judge.prompt);
      expect(asked, guard.id).toHaveLength(1);
      expect(asked[0], guard.id).toContain(
        'Judgment owned-question: none could be made for this act.\n\n',
      );
    }
    expect(result?.decision).not.toBe('block');
  });
});
