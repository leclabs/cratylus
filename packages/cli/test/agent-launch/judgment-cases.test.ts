import { expect, it } from 'vitest';
import { fixture, inspect, status } from './fixture.js';
import { dispatch } from './provider.js';

const defaults = {
  modelRoles: { default: 'fixture/base', smol: 'fixture/declared' },
  defaultThinkingLevel: 'low',
  async: { enabled: false },
  memory: { backend: 'off' },
};

it('judgment case 1: launches a bundled declaration with its own body and name', async () => {
  const f = fixture();
  try {
    f.configure(defaults);
    // No fixture declaration named scout: only omp supplies this declaration.
    const { child, requests } = await dispatch(f, 'scout', {
      modelFlags: false,
    });
    // omp's native subagent prompt delimits the declaration with Role/Context.
    // Extract the runtime body, never a test copy of the bundled source.
    const body = child.prompt
      .findLast((block) => block.startsWith('§ Role\n'))
      ?.match(/^§ Role\n([\s\S]*?)\n§ Context\n/)?.[1]
      .trim();
    expect(
      body,
      'native dispatch supplies the bundled declaration body',
    ).toBeTruthy();
    expect(
      requests.some((request) =>
        request.messages.some((message) => {
          const text =
            typeof message.content === 'string'
              ? message.content
              : Array.isArray(message.content)
                ? message.content.map((part) => part.text ?? '').join('\n')
                : '';
          return text.includes(body!);
        }),
      ),
      'the scripted provider receives the native declaration body',
    ).toBe(true);
    const launched = await inspect(f, { agent: 'scout', modelFlags: false });
    // “any agent declaration the harness discovers”; “started as that declaration”.
    expect
      .soft(
        launched.observation.prompt.join('\n'),
        'bundled declaration body reaches the launched turn',
      )
      .toContain(body!);
    // “status line shows its name”.
    expect
      .soft(status(launched.frames), 'bundled declaration name reaches status')
      .toContain('scout');
  } finally {
    f.dispose();
  }
});

it('judgment case 2: keeps the effort on a model selector, directly and through a role alias', async () => {
  const f = fixture();
  try {
    f.configure({
      ...defaults,
      modelRoles: { ...defaults.modelRoles, survey: 'fixture/declared:high' },
    });
    for (const [name, model] of [
      ['selector-surveyor', 'fixture/declared:high'],
      ['role-surveyor', '@survey'],
    ]) {
      const declaration = {
        name,
        model,
        effort: null,
        body: `Survey the inlet as ${name}.`,
        tools: [],
      };
      f.declaration(declaration);
      const { child } = await dispatch(f, name, { modelFlags: false });
      // “a model with an effort”: native dispatch witnesses the selector's high.
      expect(child.model).toMatchObject({
        provider: 'fixture',
        id: 'declared',
      });
      expect(child.effort, `${name}: native selector effort`).toBe('high');
      expect(child.prompt.join('\n')).toContain(declaration.body);
      const launched = await inspect(f, { agent: name, modelFlags: false });
      // “both carry the same body, model and effort, from the one declaration”.
      expect
        .soft(
          launched.observation.prompt.join('\n'),
          `${name}: declaration body`,
        )
        .toContain(declaration.body);
      expect
        .soft(launched.observation.model, `${name}: dispatched model`)
        .toMatchObject({ provider: child.model.provider, id: child.model.id });
      expect
        .soft(
          launched.observation.effort,
          `${name}: selector effort must match native dispatch`,
        )
        .toBe(child.effort);
    }
  } finally {
    f.dispose();
  }
});

it('judgment case 3: shows name and mark when the host had hidden extension status', async () => {
  const f = fixture({
    config:
      'statusLine:\n  preset: custom\n  leftSegments: [model]\n  rightSegments: []\n  showHookStatus: false\n',
  });
  try {
    const declaration = {
      name: 'channel-pilot',
      mark: '⚓',
      body: 'Navigate the marked channel.',
    };
    f.declaration(declaration);
    const launched = await inspect(f, { agent: declaration.name });
    // “status line shows that name and mark”: the status text AND a visible place.
    expect(status(launched.frames)).toContain(declaration.name);
    expect(status(launched.frames)).toContain(declaration.mark);
    const { statusLine = {} } = f.configuration() as {
      statusLine?: {
        preset?: string;
        leftSegments?: string[];
        rightSegments?: string[];
        showHookStatus?: boolean;
      };
    };
    // omp packages/tui/src/status-line/component.ts:3715-3755 renders the
    // configured segments and, unless showHookStatus is false, the hook row.
    // Custom layouts use the listed left/right segments; no pixel/ANSI fixture.
    const segmentShown =
      statusLine.preset === 'custom' &&
      [
        ...(statusLine.leftSegments ?? []),
        ...(statusLine.rightSegments ?? []),
      ].includes('status');
    expect(
      segmentShown || statusLine.showHookStatus !== false,
      `status text must render in omp's status segment or hook row: ${JSON.stringify(statusLine)}`,
    ).toBe(true);
  } finally {
    f.dispose();
  }
});
