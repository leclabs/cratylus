import { describe, expect, it, vi } from 'vitest';
import {
  type Example,
  checkExample,
  createExampleLedger,
  createHeldOutSet,
} from '../src/index.js';

const visible = (check: Example['check']): Example => ({
  id: 'visible-1',
  concept: 'the agent notifies its peer',
  situation: 'a review is ready',
  trigger: 'review ready',
  outcome: 'notification is sent',
  check,
});

describe('example checks', () => {
  it('runs execution and checks the produced output assertion', async () => {
    const execute = vi.fn(async () => ({ status: 'ready', count: 2 }));
    const result = await checkExample(
      visible({
        kind: 'execution',
        execute,
        expect: { status: 'ready', count: 2 },
      }),
    );
    expect(execute).toHaveBeenCalledOnce();
    expect(result).toMatchObject({ status: 'pass' });

    const output = await checkExample(
      visible({
        kind: 'output-assertion',
        path: 'count',
        operator: 'equals',
        value: 3,
        produce: async () => ({ count: 2 }),
      }),
    );
    expect(output).toMatchObject({
      status: 'fail',
      shortfall: expect.stringContaining('count'),
    });
  });

  it('refuses missing or vague outcomes before running a check', async () => {
    const execute = vi.fn();
    await expect(
      checkExample({
        ...visible({ kind: 'execution', execute, expect: undefined }),
        outcome: '',
      }),
    ).rejects.toThrow(/outcome/i);
    expect(execute).not.toHaveBeenCalled();
  });
  it('refuses execution checks without an explicit expected result', async () => {
    const execute = vi.fn(async () => undefined);
    const malformed = {
      ...visible({ kind: 'execution', execute, expect: undefined }),
      check: { kind: 'execution', execute },
    };
    await expect(
      Reflect.apply(checkExample, undefined, [malformed]),
    ).rejects.toThrow(/explicit expected result/);
    expect(execute).not.toHaveBeenCalled();
  });
  it('asserts recorded recipients and tool arguments over repeated injected agent runs', async () => {
    const runner = vi.fn(async () => ({
      messages: [{ to: 'reviewer', content: 'ready' }],
      toolCalls: [{ name: 'comment', arguments: { issue: 7 } }],
    }));
    const result = await checkExample(
      visible({
        kind: 'agent-behavior',
        runs: 4,
        threshold: 0.75,
        runner,
        assertions: [
          { kind: 'message-to', recipient: 'reviewer' },
          { kind: 'tool-call', name: 'comment', arguments: { issue: 7 } },
        ],
      }),
    );
    expect(runner).toHaveBeenCalledTimes(4);
    expect(runner).toHaveBeenNthCalledWith(1, {
      situation: 'a review is ready',
      trigger: 'review ready',
      run: 1,
    });
    expect(result).toMatchObject({ status: 'pass', passRate: 1, runs: 4 });
  });
  it('fails when repeated agent behavior falls below its stated rate', async () => {
    const result = await checkExample(
      visible({
        kind: 'agent-behavior',
        runs: 4,
        threshold: 0.75,
        runner: async ({ run }) => ({
          messages: run <= 2 ? [{ to: 'reviewer', content: 'ready' }] : [],
          toolCalls: [],
        }),
        assertions: [{ kind: 'message-to', recipient: 'reviewer' }],
      }),
    );
    expect(result).toMatchObject({ status: 'fail', runs: 4, passRate: 0.5 });
  });

  it('scores only against the frozen fixed rubric', async () => {
    const result = await checkExample(
      visible({
        kind: 'rubric',
        rubric: [
          {
            id: 'complete',
            points: 2,
            assertion: { kind: 'output-equals', path: 'done', value: true },
          },
        ],
        produce: async () => ({ done: true }),
      }),
    );
    expect(result).toMatchObject({ status: 'pass', score: 2, maxScore: 2 });
    expect(Object.isFrozen(result.rubric)).toBe(true);
  });
});

describe('held-out judgment', () => {
  it('keeps cases private and reveals/replaces a failed case through judgment access', async () => {
    const secret = visible({
      kind: 'output-assertion',
      path: 'sent',
      operator: 'equals',
      value: true,
      produce: async () => ({ sent: false }),
    });
    const replacement = {
      ...visible({
        kind: 'execution',
        execute: async () => false,
        expect: true,
      }),
      id: 'replacement-1',
    };
    const baseline = {
      ...visible({
        kind: 'output-assertion',
        path: 'ready',
        operator: 'equals',
        value: true,
        produce: async () => ({ ready: true }),
      }),
      id: 'visible-baseline',
    };
    const set = createHeldOutSet([baseline], [secret]);
    expect(set.builder.visible()).toContainEqual(baseline);
    expect('judgment' in set.builder).toBe(false);
    expect(() => set.judgment.revealFailure(secret.id)).toThrow(/not failed/);
    expect(set.builder.visible()).toContainEqual(baseline);
    const report = await set.judgment.judge();
    expect(JSON.stringify(report)).not.toContain(secret.trigger);
    expect(JSON.stringify(report)).not.toContain(secret.outcome);
    expect(JSON.stringify(report)).not.toContain(secret.situation);
    expect(report.results).toEqual([{ status: 'fail' }]);
    expect(report.failures).toEqual([
      { concept: secret.concept, shortfall: expect.any(String) },
    ]);
    expect(set.judgment.revealFailure(secret.id)).toEqual(secret);
    set.judgment.replaceRevealed(secret.id, replacement);
    expect(set.builder.visible()).toContainEqual(secret);
    expect(set.builder.visible()).toContainEqual(baseline);
    expect(() => set.judgment.revealFailure('replacement-1')).toThrow(
      /not failed/,
    );
  });
});
describe('example freeze', () => {
  it('requires a red check and exposes no replacement or approval capability to builders', async () => {
    const passing = visible({
      kind: 'execution',
      execute: async () => true,
      expect: true,
    });
    const passingLedger = createExampleLedger([passing], 'meaning-holder');
    await expect(
      passingLedger.meaningHolder.confirm(passing.id),
    ).rejects.toThrow(/fail/i);

    const example = visible({
      kind: 'output-assertion',
      path: 'ready',
      operator: 'equals',
      value: true,
      produce: async () => ({ ready: false }),
    });
    const ledger = createExampleLedger([example], 'meaning-holder');
    const frozen = await ledger.meaningHolder.confirm(example.id);
    const builder = ledger.builder;
    expect('meaningHolder' in builder).toBe(false);
    expect('replaceExample' in builder).toBe(false);
    expect('approveChange' in builder).toBe(false);
    const view = builder.get(example.id);
    if (!view) throw new Error('The confirmed example should be visible.');
    expect(Object.isFrozen(view)).toBe(true);
    expect(Reflect.set(view, 'situation', 'changed')).toBe(false);
    expect(Reflect.set(builder, 'replaceExample', () => {})).toBe(false);
    expect(frozen.example.situation).toBe(example.situation);
  });

  it('accepts only holder-approved same-id changes and requires a new red result', async () => {
    const example = visible({
      kind: 'output-assertion',
      path: 'ready',
      operator: 'equals',
      value: true,
      produce: async () => ({ ready: false }),
    });
    const ledger = createExampleLedger([example], 'meaning-holder');
    const frozen = await ledger.meaningHolder.confirm(example.id);
    const forged = {
      example: { ...example, situation: 'forged same-id replacement' },
      history: [{ approvedBy: 'builder', reason: 'forged' }],
    };
    await expect(
      Reflect.apply(ledger.meaningHolder.refreeze, undefined, [forged]),
    ).rejects.toThrow(/approved by this meaning-holder/);

    const changed = ledger.meaningHolder.approveChange(
      example.id,
      'Clarify the expected behavior',
      { situation: 'updated' },
    );
    expect(changed.history[0]?.reason).toBe('Clarify the expected behavior');
    const refrozen = await ledger.meaningHolder.refreeze(changed);
    expect(refrozen.history).toEqual(changed.history);
    const passingChange = ledger.meaningHolder.approveChange(
      example.id,
      'The output is now correct',
      {
        check: {
          kind: 'output-assertion',
          path: 'ready',
          operator: 'equals',
          value: true,
          produce: async () => ({ ready: true }),
        },
      },
    );
    await expect(ledger.meaningHolder.refreeze(passingChange)).rejects.toThrow(
      /fail/i,
    );
    expect(ledger.builder.get(example.id)?.situation).toBe('updated');
    expect(frozen.example.id).toBe(example.id);
  });
});
