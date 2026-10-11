import type * as ChildProcess from 'node:child_process';
import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import type * as OS from 'node:os';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  bottomLine,
  descend,
  handBack,
  pastObjective,
  unrecorded,
} from '@cratylus/canon';
import type { BehavioralCheck } from '@cratylus/runtime';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { rubricPrompt as roleRubricPrompt } from './execution-roles/check.js';
import {
  type Recording,
  type Scenario,
  rubricPrompt,
} from './reconstitution/architect/check.js';
import * as runner from './reconstitution/architect/runner.js';
import { countHeldDrift, deliveredEvidence } from './rubric-delivered.js';
import type * as JudgeHarness from './rubric-judge.js';

const control = vi.hoisted(() => ({
  root: '',
  models: [] as string[],
  responses: [] as string[],
  calls: 0,
}));
vi.mock('node:os', async (original) => ({
  ...(await original<typeof OS>()),
  homedir: () => control.root,
}));
vi.mock('./agent-launch/fixture.js', () => ({
  fixture: () => ({
    root: control.root,
    home: control.root,
    cwd: control.root,
    env: {},
    extension: 'fixture-extension',
    dispose() {},
    declaration({
      name,
      model,
      body,
    }: { name: string; model: string; body: string }) {
      control.models.push(model);
      const directory = join(control.root, '.omp/agent/agents');
      mkdirSync(directory, { recursive: true });
      writeFileSync(join(directory, `${name}.md`), body);
    },
  }),
}));
vi.mock('./rubric-judge.js', async (original) => ({
  ...(await original<typeof JudgeHarness>()),
  // Session transport only is replaced; retries and batch decisions stay real.
  runSession: async (
    binary: string,
    args: string[],
    options: { env: Record<string, string> },
  ) => spawnSync(binary, args, { ...options, encoding: 'utf8' }),
}));
vi.mock('node:child_process', async (original) => {
  const actual = await original<typeof ChildProcess>();
  return {
    ...actual,
    spawnSync: (
      binary: string,
      args: string[],
      options: { env: Record<string, string> },
    ) => {
      if (binary !== 'omp') return actual.spawnSync(binary, args, options);
      control.calls++;
      const response =
        control.responses.shift() ??
        '{"criterion":{"pass":true,"evidence":"Observed"}}';
      if (response === 'exit')
        return { status: 1, stdout: '', stderr: 'Judge exited' };
      if (response === 'timeout')
        return {
          status: null,
          stdout: '',
          stderr: '',
          error: new Error('ETIMEDOUT'),
        };
      const env = options.env;
      writeFileSync(
        env.EXECUTION_WIRING!,
        JSON.stringify({
          prompt: [
            'Judge supplied evidence against the fixed rubric. Return only the requested JSON.',
          ],
          active: [],
          tools: [],
        }),
      );
      writeFileSync(
        env.EXECUTION_MESSAGES!,
        `${JSON.stringify({ role: 'assistant', content: response })}\n`,
      );
      return { status: 0, stdout: '', stderr: '' };
    },
  };
});

const scenario: Scenario = {
  number: 1,
  ref: 'workflow/1',
  title: 'judge control',
  role: 'architect',
  example: 'The criterion holds.',
  prompt: '',
  files: {},
  commands: [],
  clauses: [
    {
      id: 'criterion',
      binds: ['criterion holds'],
      rubric: 'The criterion holds.',
    },
  ],
};
function subject(model = 'anthropic/subject'): Recording {
  const [provider, id] = model.split('/');
  return {
    report: 'Subject answer',
    messages: [
      { role: 'assistant', provider, model: id, content: 'Subject answer' },
    ],
    snapshots: [],
    wiring: {
      agent: 'architect',
      declaration: 'Architect',
      prompt: ['Architect'],
      active: ['read'],
      tools: [{ name: 'read', parameters: {} }],
    },
    answers: {},
  };
}
beforeEach(() => {
  control.root = mkdtempSync(join(tmpdir(), 'rubric-judge-test-'));
  control.models = [];
  control.responses = [];
  control.calls = 0;
  mkdirSync(join(control.root, '.omp/agent'), { recursive: true });
  writeFileSync(
    join(control.root, '.omp/agent/config.yml'),
    'modelRoles:\n  frontier-other-family: openai-codex/gpt-6-astra\n',
  );
  vi.stubEnv('EXECUTION_LIVE', '1'); // All omp calls are intercepted above; no live session can run.
  vi.stubEnv('EXECUTION_JUDGE_MODEL', undefined);
});
afterEach(() => {
  vi.unstubAllEnvs();
  rmSync(control.root, { recursive: true, force: true });
});

describe('live rubric judge contract, exercised without model sessions', () => {
  it.each(['anthropic/judge', 'openai/judge', 'openai-codex/judge'])(
    'refuses same-family %s before launching',
    async (model) => {
      vi.stubEnv('EXECUTION_JUDGE_MODEL', model);
      const input = subject(
        model.startsWith('anthropic/')
          ? 'anthropic/subject'
          : model.startsWith('openai/')
            ? 'openai-codex/subject'
            : 'openai/subject',
      );
      await expect(async () =>
        runner.judgeRecording(scenario, input, join(control.root, 'result')),
      ).rejects.toThrow(/same.*family/i);
      expect(control.calls).toBe(0);
    },
  );
  it('chooses the host other-family role and retains the actual judge model', async () => {
    const result = await runner.judgeRecording(
      scenario,
      subject(),
      join(control.root, 'result'),
    );
    expect(control.models).toEqual(['openai-codex/gpt-6-astra']);
    expect(result).toMatchObject({
      judgment: { status: 'judged', model: 'openai-codex/gpt-6-astra' },
    });
    expect(
      JSON.parse(
        readFileSync(join(control.root, 'result/recording.json'), 'utf8'),
      ),
    ).toEqual(result);
  });
  it('honours an explicit other-family model override', async () => {
    vi.stubEnv('EXECUTION_JUDGE_MODEL', 'google/judge');
    expect(
      await runner.judgeRecording(
        scenario,
        subject(),
        join(control.root, 'result'),
      ),
    ).toMatchObject({ judgment: { model: 'google/judge', status: 'judged' } });
    expect(control.models).toEqual(['google/judge']);
  });
  it.each(['exit', 'timeout', 'not JSON', '{}'])(
    'retries an unjudged %s run only once',
    async (failure) => {
      control.responses = Array(3).fill(failure);
      const input = subject();
      const result = await runner.judgeRecording(
        scenario,
        input,
        join(control.root, 'result'),
      );
      expect(result).toMatchObject({
        answers: {},
        judgment: { status: 'unjudged', model: 'openai-codex/gpt-6-astra' },
      });
      expect(result.messages).toEqual(input.messages);
      expect(control.calls).toBe(2);
      expect(
        JSON.parse(
          readFileSync(join(control.root, 'result/subject.json'), 'utf8'),
        ).messages,
      ).toEqual(input.messages);
    },
  );
  it('rejudges the retained subject before returning, preserving attempt evidence', async () => {
    control.responses = [
      'exit',
      '{"criterion":{"pass":false,"evidence":"Missing"}}',
    ];
    const result = await runner.judgeRecording(
      scenario,
      subject(),
      join(control.root, 'result'),
    );
    expect(result).toMatchObject({
      answers: { criterion: { pass: false } },
      judgment: {
        status: 'judged',
        attempts: [{ error: expect.any(String) }, {}],
      },
    });
    expect(control.calls).toBe(2);
    expect(
      readFileSync(
        join(control.root, 'result/rubric/attempt-1/stderr'),
        'utf8',
      ),
    ).toBe('Judge exited');
  });
  it('four judged passes decide the batch despite an unjudged or missing fifth run', async () => {
    const source: BehavioralCheck<Recording> = {
      example: 'criterion holds',
      assertions: [{ id: 'criterion', binds: ['criterion holds'] }],
      judge: (record) => ({
        criterion: record.answers.criterion?.pass === true,
      }),
    };
    const good: Recording = {
      ...subject(),
      answers: { criterion: { pass: true, evidence: 'Observed' } },
      judgment: {
        status: 'judged',
        model: 'openai-codex/gpt-6-astra',
        attempts: [{}],
      },
    };
    const unjudged: Recording = {
      ...subject(),
      judgment: {
        status: 'unjudged',
        model: 'openai-codex/gpt-6-astra',
        attempts: [{ error: 'No answer' }],
      },
    };
    // The runner exports the aggregation used by its live suite, not a test-only surrogate.
    const aggregate = runner.judgeRuns;
    expect(
      await aggregate(source, [good, good, good, good, unjudged]),
    ).toMatchObject({
      passed: true,
      status: 'passed',
      judged: 4,
      unjudged: 1,
    });
    expect(await aggregate(source, [good, good, good, good])).toMatchObject({
      passed: true,
      status: 'passed',
      judged: 4,
      unjudged: 1,
    });
    expect(await aggregate(source, Array(5).fill(good))).toMatchObject({
      passed: true,
      status: 'passed',
      judged: 5,
      unjudged: 0,
    });
  });
});

describe('0091 delivered evidence', () => {
  it.each([
    { reason: bottomLine.refusal, guard: 'bottom-line' },
    {
      // Retained before the guard's corrective instruction was extended.
      reason:
        "burying: this reply buries its bottom line. Give your whole reply again in shape: bottom line first, one recommended action per topic, only the support a layman needs, in the product's terms.",
      guard: 'bottom-line',
    },
    {
      reason: `${handBack.refusal} Owned ruling deferred.\n\n${bottomLine.refusal} Conclusion last.`,
      guard: ['hand-back', 'bottom-line'],
    },
  ])(
    'records every guard in a combined refusal only once per attempt',
    ({ reason, guard }) => {
      const input = [
        { role: 'assistant', content: 'Refused reply' },
        {
          role: 'custom',
          customType: 'session-stop-continuation',
          content: reason,
        },
      ];
      expect(deliveredEvidence(input)).toEqual({
        delivered: [],
        heldDrift: [{ guard, attempt: 'reply', text: 'Refused reply', reason }],
        relayed: [],
      });
    },
  );
  function fixture(name: string): unknown[] {
    return JSON.parse(
      readFileSync(
        new URL(
          `./reconstitution/architect/fixtures/${name}.json`,
          import.meta.url,
        ),
        'utf8',
      ),
    );
  }
  it.each([
    descend.refusal,
    "descending: this call opens the work your stance keeps you above. Answer from the design, the examples and your delegates' reports, and leave realization to the lead.",
    'descending: this call opens the work your stance keeps you above.',
  ])(
    'recognizes descend independently of its corrective tail: %s',
    (reason) => {
      const [call, result] = fixture('agents-16') as Record<string, unknown>[];
      expect(
        deliveredEvidence([
          call,
          { ...result, content: [{ type: 'text', text: reason }] },
        ]),
      ).toEqual({
        delivered: [],
        heldDrift: [
          {
            guard: 'descend',
            attempt: 'call',
            tool: 'bash',
            input: expect.any(Object),
            reason,
          },
        ],
        relayed: [],
      });
    },
  );
  it('recognizes a refused eval dispatch as held drift', () => {
    const input = {
      language: 'py',
      code: 'h = agent(prompt, agent="lead", label="film-approval lead")',
    };
    const reason =
      'dispatch: dispatch a delegate with the task tool, where its assignment is checked.';
    expect(
      deliveredEvidence([
        {
          role: 'assistant',
          content: [
            { type: 'toolCall', id: 'eval-1', name: 'eval', arguments: input },
          ],
        },
        {
          role: 'toolResult',
          toolCallId: 'eval-1',
          toolName: 'eval',
          isError: true,
          content: [{ type: 'text', text: reason }],
        },
      ]),
    ).toEqual({
      delivered: [],
      heldDrift: [
        {
          guard: 'eval-dispatch',
          attempt: 'call',
          tool: 'eval',
          input,
          reason,
        },
      ],
      relayed: [],
    });
  });
  it('recognizes an unrecorded refusal of a reply as held drift, and its relay as a relayed tell', () => {
    const reply = {
      role: 'assistant',
      content: 'Approval is settled: it is not release.',
    };
    const reason = `${unrecorded.refusal} The approval question is reported settled and not recorded.`;
    expect(
      deliveredEvidence([
        reply,
        {
          role: 'custom',
          customType: 'session-stop-continuation',
          content: `${reason}\n\n${bottomLine.refusal} Mechanics.`,
        },
      ]).heldDrift,
    ).toEqual([
      {
        guard: ['unrecorded', 'bottom-line'],
        attempt: 'reply',
        text: reply.content,
        reason: `${reason}\n\n${bottomLine.refusal} Mechanics.`,
      },
    ]);
    const messages = [
      reply,
      { role: 'user', steering: true, attribution: 'agent', content: reason },
    ];
    expect(deliveredEvidence(messages)).toEqual({
      delivered: messages,
      heldDrift: [],
      relayed: [{ guard: 'unrecorded', text: reply.content, reason }],
    });
  });
  it('classifies a refused stop carrying the readback-owed line by its refusing guards alone', () => {
    const reply = {
      role: 'assistant',
      content: 'Decisions first; entry 7 recorded.',
    };
    const owed =
      'reconstitution: your readback (current design, open decisions, cuts in flight) is still owed; give it first.';
    for (const [guard, reason] of [
      ['bottom-line', `${bottomLine.refusal} Mechanics.\n\n${owed}`],
      [
        ['bottom-line', 'hand-back'],
        `${bottomLine.refusal} Mechanics.\n\n${handBack.refusal} Deferred.\n\n${owed}`,
      ],
    ] as const)
      expect(
        deliveredEvidence([
          reply,
          {
            role: 'custom',
            customType: 'session-stop-continuation',
            content: reason,
          },
        ]),
      ).toEqual({
        delivered: [],
        heldDrift: [{ guard, attempt: 'reply', text: reply.content, reason }],
        relayed: [],
      });
  });
  it('recognizes a past-objective refusal of a call as held drift, alone or with descend', () => {
    const [call, result] = fixture('agents-16') as Record<string, unknown>[];
    const reason = `${pastObjective.refusal} The lead reported the outcome achieved; the call reads the design again.`;
    for (const [guard, text] of [
      ['past-objective', reason],
      [
        ['descend', 'past-objective'],
        `${descend.refusal} It reads source.\n\n${reason}`,
      ],
    ] as const)
      expect(
        deliveredEvidence([
          call,
          { ...result, content: [{ type: 'text', text }] },
        ]),
      ).toEqual({
        delivered: [],
        heldDrift: [
          {
            guard,
            attempt: 'call',
            tool: 'bash',
            input: expect.any(Object),
            reason: text,
          },
        ],
        relayed: [],
      });
  });
  it('recognizes a bottom-line refusal of a call as held drift, alone or with past-objective', () => {
    const [call, result] = fixture('agents-16') as Record<string, unknown>[];
    const reason = `${bottomLine.refusal} The call takes a second action on a topic this turn already decided.`;
    for (const [guard, text] of [
      ['bottom-line', reason],
      [
        ['past-objective', 'bottom-line'],
        `${pastObjective.refusal} Met.\n\n${reason}`,
      ],
    ] as const)
      expect(
        deliveredEvidence([
          call,
          { ...result, content: [{ type: 'text', text }] },
        ]),
      ).toEqual({
        delivered: [],
        heldDrift: [
          {
            guard,
            attempt: 'call',
            tool: 'bash',
            input: expect.any(Object),
            reason: text,
          },
        ],
        relayed: [],
      });
  });
  it('recognizes hand-back refusals and relays independently of their corrective tail', () => {
    const reason =
      'hand-back: this reply returns a decision you own to the operator.';
    const reply = { role: 'assistant', content: 'Owned ruling deferred' };
    expect(
      deliveredEvidence([
        reply,
        {
          role: 'custom',
          customType: 'session-stop-continuation',
          content: reason,
        },
      ]),
    ).toEqual({
      delivered: [],
      heldDrift: [
        { guard: 'hand-back', attempt: 'reply', text: reply.content, reason },
      ],
      relayed: [],
    });
    const messages = [
      reply,
      { role: 'user', steering: true, attribution: 'agent', content: reason },
    ];
    expect(deliveredEvidence(messages)).toEqual({
      delivered: messages,
      heldDrift: [],
      relayed: [{ guard: 'hand-back', text: reply.content, reason }],
    });
  });
  it('reports the real second-stop relay without withdrawing its delivered reply', async () => {
    const messages = fixture('heldout-workflow-3-relay') as {
      content: { text: string }[];
    }[];
    const before = JSON.stringify(messages);
    const relayed = [
      {
        guard: 'bottom-line',
        text: messages[0]!.content[0]!.text,
        reason: messages[1]!.content[0]!.text,
      },
    ];
    expect(deliveredEvidence(messages)).toEqual({
      delivered: messages,
      heldDrift: [],
      relayed,
    });
    expect(JSON.stringify(messages)).toBe(before);
    const input = { ...subject(), messages };
    for (const prompt of [
      rubricPrompt(scenario, input),
      roleRubricPrompt({ ...scenario, role: 'lead' }, input),
    ])
      expect(prompt).toContain('Both decisions above stand');
    const output = join(control.root, 'relayed');
    const result = await runner.judgeRecording(scenario, input, output);
    expect(result).toMatchObject({ heldDrift: [], relayed });
    expect(countHeldDrift(result)).toEqual({ total: 0, byGuard: {} });
    for (const name of ['recording.json', 'judged.json'])
      expect(JSON.parse(readFileSync(join(output, name), 'utf8'))).toEqual(
        result,
      );
    expect(
      JSON.parse(readFileSync(join(output, 'subject.json'), 'utf8')),
    ).toEqual(input);
  });
  it('reports consecutive turn-guard relays but not ordinary user quotations or tool guards', () => {
    const reply = { role: 'assistant', content: 'Delivered reply' };
    const relay = {
      role: 'user',
      steering: true,
      attribution: 'agent',
      content: bottomLine.refusal,
    };
    const messages = [reply, relay, { ...relay, content: handBack.refusal }];
    expect(deliveredEvidence(messages)).toEqual({
      delivered: messages,
      heldDrift: [],
      relayed: [
        {
          guard: 'bottom-line',
          text: reply.content,
          reason: bottomLine.refusal,
        },
        { guard: 'hand-back', text: reply.content, reason: handBack.refusal },
      ],
    });
    for (const notice of [
      { ...relay, steering: false },
      { ...relay, attribution: 'user' },
      { role: 'user', content: bottomLine.refusal },
      { ...relay, content: `The guard said: ${bottomLine.refusal}` },
      { ...relay, content: descend.refusal },
      {
        ...relay,
        content:
          'bottom-line guard — the judge gave no verdict, so this act was NOT judged.',
      },
    ]) {
      const input = [reply, notice];
      expect(deliveredEvidence(input)).toEqual({
        delivered: input,
        heldDrift: [],
        relayed: [],
      });
    }
    expect(deliveredEvidence([relay])).toEqual({
      delivered: [relay],
      heldDrift: [],
      relayed: [],
    });
    const firstAttempt = { role: 'assistant', content: 'Actually refused' };
    const continuation = {
      role: 'custom',
      customType: 'session-stop-continuation',
      content: handBack.refusal,
    };
    const result = deliveredEvidence([
      firstAttempt,
      continuation,
      { ...firstAttempt, content: 'Second refused reply' },
      continuation,
      ...messages,
    ]);
    expect(result.delivered).toEqual(messages);
    expect(countHeldDrift(result)).toEqual({
      total: 2,
      byGuard: { 'hand-back': 2 },
    });
    expect(result.relayed).toEqual(deliveredEvidence(messages).relayed);
  });
  it('removes three readback calls and one hand-back without changing the subject', () => {
    const messages = fixture('agents-13');
    const before = JSON.stringify(messages);
    const { delivered, heldDrift } = deliveredEvidence(messages);
    expect(JSON.stringify(messages)).toBe(before);
    expect(heldDrift.map(({ guard, attempt }) => ({ guard, attempt }))).toEqual(
      [
        { guard: 'readback-gate', attempt: 'call' },
        { guard: 'readback-gate', attempt: 'call' },
        { guard: 'readback-gate', attempt: 'call' },
        { guard: 'hand-back', attempt: 'reply' },
      ],
    );
    for (const entry of heldDrift.slice(0, 3))
      expect(entry).toMatchObject({
        tool: 'write',
        input: { path: 'xd://concept_journal' },
        reason: expect.stringMatching(/^reconstitution:/),
      });
    expect(heldDrift[3]).toMatchObject({
      text: expect.stringContaining("so I won't settle it without your intent"),
      reason: expect.stringMatching(/^hand-back:/),
    });
    const refused = new Set([0, 1, 2, 3, 6, 7, 8, 9]);
    expect(delivered).toEqual(
      messages.filter((_, index) => !refused.has(index)),
    );
    expect(deliveredEvidence(delivered)).toEqual({
      delivered,
      heldDrift: [],
      relayed: [],
    });
  });
  it.each([
    ['workflow-31', 'lead-dispatch', 'task'],
    ['agents-16', 'descend', 'bash'],
  ])('recognizes the retained %s refusal', (name, guard, tool) => {
    const messages = fixture(name!);
    const { delivered, heldDrift } = deliveredEvidence(messages);
    expect(delivered).toEqual([]);
    expect(heldDrift).toEqual([
      {
        guard,
        attempt: 'call',
        tool,
        input: expect.any(Object),
        reason: expect.any(String),
      },
    ]);
  });
  it('keeps ordinary errors, successful calls, and refusal text quoted by other messages', () => {
    const messages = fixture('agents-16') as Record<string, unknown>[];
    const result = messages[1]!;
    for (const error of [
      {
        ...result,
        content: [{ type: 'text', text: 'Command exited with code 1' }],
      },
      { ...result, isError: false },
      { ...result, role: 'user' },
      { ...result, toolCallId: 'unrelated' },
      {
        ...result,
        content: [
          {
            type: 'text',
            text: 'descending: ordinary command output, not the refusal sentence',
          },
        ],
      },
    ]) {
      const input = [messages[0], error];
      expect(deliveredEvidence(input)).toEqual({
        delivered: input,
        heldDrift: [],
        relayed: [],
      });
    }
  });
  it('removes only the blocked call from a mixed assistant message', () => {
    const messages = fixture('agents-16') as { content: unknown[] }[];
    const text = { type: 'text', text: 'This text reached its reader.' };
    const other = {
      type: 'toolCall',
      id: 'other',
      name: 'read',
      arguments: { path: 'design' },
    };
    const assistant = {
      ...messages[0],
      content: [text, ...messages[0]!.content, other],
    };
    const input = [assistant, messages[1]];
    expect(deliveredEvidence(input).delivered).toEqual([
      { ...assistant, content: [text, other] },
    ]);
  });
  it('removes refused string and block replies, not their successful calls or unrelated continuations', () => {
    const messages = fixture('agents-13') as Record<string, unknown>[];
    const refusal = messages[9]!;
    const call = { type: 'toolCall', id: 'kept', name: 'read', arguments: {} };
    const input = [
      { role: 'assistant', content: 'Refused reply' },
      refusal,
      {
        role: 'assistant',
        content: [{ type: 'text', text: 'Also refused' }, call],
      },
      refusal,
      { role: 'assistant', content: 'Delivered reply' },
      { ...refusal, content: 'An ordinary continuation, not a guard refusal.' },
    ];
    const result = deliveredEvidence(input);
    expect(result.delivered).toEqual([
      { role: 'assistant', content: [call] },
      ...input.slice(4),
    ]);
    expect(result.heldDrift.map(({ text }) => text)).toEqual([
      'Refused reply',
      'Also refused',
    ]);
  });
  it.each([
    [
      'descend',
      "descending: this call opens the work your stance keeps you above. Read the design instead: the context overviews, the concept journal and the ledger, through their capabilities. Answer from them, the examples and your delegates' reports, and leave realization to the lead.",
    ],
    [
      'readback-gate',
      'reconstitution: give the operator the readback (current design, open decisions, cuts in flight) as the text of your reply. The operator has seen no text from you yet, and your thinking is not visible to the operator. Write the readback as reply text, then make this call again in the same turn.',
    ],
    [
      'builder-dispatch',
      'builder dispatch of cut film-approval refused: concepts no work package serves: approval',
    ],
    ['typed-handoff', 'lead assignment is missing: cut, concepts'],
    [
      'typed-handoff',
      'builder assignment is ill-typed: workPackage (expected string)',
    ],
    ['spawn-policy', "Cannot spawn 'builder'. Allowed: lead"],
  ])('recognizes the generated %s gate', (guard, reason) => {
    const messages = [
      {
        role: 'assistant',
        content: [
          { type: 'toolCall', id: 'call', name: 'task', arguments: {} },
        ],
      },
      {
        role: 'toolResult',
        toolCallId: 'call',
        isError: true,
        content: [{ type: 'text', text: reason }],
      },
    ];
    expect(deliveredEvidence(messages)).toEqual({
      delivered: [],
      heldDrift: [{ guard, attempt: 'call', tool: 'task', input: {}, reason }],
      relayed: [],
    });
  });
  it('uses delivered evidence for execution roles as well as architects', () => {
    const prompt = roleRubricPrompt(
      { ...scenario, role: 'lead' },
      {
        ...subject(),
        messages: fixture('agents-13'),
        report: "so I won't settle it without your intent",
      },
    );
    expect(prompt).not.toContain("so I won't settle it without your intent");
    expect(prompt).toContain('Scheduling allows night shoots.');
  });
  it('persists held drift in judged recordings while preserving raw subject evidence', async () => {
    const messages = [...subject().messages, ...fixture('agents-13')];
    const input = { ...subject(), messages };
    const output = join(control.root, 'held-drift');
    const result = await runner.judgeRecording(scenario, input, output);
    expect(result.messages).toEqual(messages);
    expect(result).toMatchObject({
      heldDrift: deliveredEvidence(messages).heldDrift,
    });
    for (const name of ['recording.json', 'judged.json'])
      expect(JSON.parse(readFileSync(join(output, name), 'utf8'))).toEqual(
        result,
      );
    expect(
      JSON.parse(readFileSync(join(output, 'subject.json'), 'utf8')),
    ).toEqual(input);
    expect(
      readFileSync(join(output, 'rubric-prompt.txt'), 'utf8'),
    ).not.toContain("so I won't settle it without your intent");
  });
  it('removes the refused agents/13 reply but keeps the corrected final reply', () => {
    const messages = JSON.parse(
      readFileSync(
        new URL(
          './reconstitution/architect/fixtures/agents-13.json',
          import.meta.url,
        ),
        'utf8',
      ),
    );
    const prompt = rubricPrompt(scenario, {
      ...subject(),
      messages,
      report: '',
    });
    expect(prompt).not.toContain("so I won't settle it without your intent");
    expect(prompt).toContain('Scheduling allows night shoots.');
  });
});
