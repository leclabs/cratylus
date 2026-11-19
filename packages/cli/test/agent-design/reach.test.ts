// Exercise the installed extension with omp's registration and event API.
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';
import { type Host, host, success } from '../capability-port/fixture.js';
import { owned } from '../delivery/fixture.js';

type Agent = { kind: 'main' | 'sub'; name: string };
type Event = { toolName: string; input: Record<string, unknown> };
type Refusal = { block: true; reason: string };
type Handler = (
  event: Event,
  ctx: { cwd: string; agent: Agent },
) => Refusal | undefined | Promise<Refusal | undefined>;

const fileReason =
  'design/model/ is the domain model, which only the business analyst writes. To change it, raise a meaning question to the business analyst.';
const modelPath = 'design/model/delivery/install.md';
let h: Host | undefined;
afterEach(() => {
  h?.dispose();
  h = undefined;
});

async function installedReach() {
  const installed = host();
  h = installed;
  success(installed.install);
  const root = owned(installed);
  const extension = join(root, 'extensions/cratylus-reach.ts');
  const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  expect(
    manifest.omp.extensions.map((path: string) => resolve(root, path)),
  ).toContain(extension);
  let agentFlag: string | undefined;
  const registerFlag = vi.fn();
  const on = vi.fn();
  // Load the runtime-installed artifact, whose temporary path cannot be statically imported.
  // Each installed host represents a separate omp process.
  vi.resetModules();
  const reach = (await import(extension)).default;
  expect(reach).toBeTypeOf('function');
  reach({
    registerFlag,
    getFlag: (name: string) => (name === 'agent' ? agentFlag : undefined),
    on,
  });
  expect(registerFlag).toHaveBeenCalledWith('agent', expect.anything());
  expect(on).toHaveBeenCalledTimes(1);
  expect(on).toHaveBeenCalledWith('tool_call', expect.any(Function));
  const handler = on.mock.calls[0]![1] as Handler;
  return {
    cwd: installed.cwd,
    call(event: Event, agent: Agent, flag?: string, cwd = installed.cwd) {
      agentFlag = flag;
      return handler(event, { cwd, agent });
    },
  };
}

it("agent-design/reach: the tech lead's write to the domain model is refused", async () => {
  const reach = await installedReach();
  const fileCalls: Event[] = [
    {
      toolName: 'write',
      input: { path: modelPath, content: 'changed meaning' },
    },
    {
      toolName: 'write',
      input: { path: join(reach.cwd, modelPath), content: 'changed meaning' },
    },
    {
      toolName: 'write',
      input: {
        path: './design/../design/model/new.md',
        content: 'changed meaning',
      },
    },
    {
      toolName: 'edit',
      input: { path: modelPath, oldText: 'old', newText: 'new' },
    },
    { toolName: 'edit', input: { path: 'notes.md', rename: modelPath } },
    {
      toolName: 'edit',
      input: { input: `[${modelPath}#1A2B]\nPUT 1.=1:\n+changed meaning` },
    },
    { toolName: 'edit', input: { input: `[${modelPath}#1A2B]\nREM` } },
    { toolName: 'ast_edit', input: { path: modelPath } },
    { toolName: 'ast_edit', input: { paths: ['notes.md', modelPath] } },
  ];
  for (const kind of ['sub', 'main'] as const) {
    const agent = { kind, name: kind === 'sub' ? 'tech-lead' : 'main' };
    const flag = kind === 'main' ? 'tech-lead' : undefined;
    for (const event of fileCalls) {
      expect(
        await reach.call(event, agent, flag),
        JSON.stringify({ kind, event }),
      ).toEqual({ block: true, reason: fileReason });
    }
  }
  // Subagents are judged by their own identity, even under an analyst main session.
  expect(
    await reach.call(
      fileCalls[0]!,
      { kind: 'sub', name: 'tech-lead' },
      'business-analyst',
    ),
  ).toEqual({ block: true, reason: fileReason });
  expect(
    await reach.call(fileCalls[0]!, { kind: 'sub', name: 'explore' }),
  ).toEqual({ block: true, reason: fileReason });
  expect(
    await reach.call(
      {
        toolName: 'write',
        input: { path: '../design/model/new.md', content: 'meaning' },
      },
      { kind: 'sub', name: 'tech-lead' },
      undefined,
      join(reach.cwd, 'src'),
    ),
  ).toEqual({ block: true, reason: fileReason });
});

it('agent-design/reach: the business analyst writes the domain model', async () => {
  const reach = await installedReach();
  for (const name of ['business-analyst', 'kino', 'mav', 'nico']) {
    for (const kind of ['sub', 'main'] as const) {
      expect(
        await reach.call(
          { toolName: 'write', input: { path: modelPath, content: 'meaning' } },
          { kind, name: kind === 'sub' ? name : 'main' },
          kind === 'main' ? name : undefined,
        ),
        `${kind}: ${name}`,
      ).toBeUndefined();
    }
  }
});

it('agent-design/reach: every agent reads the domain model', async () => {
  const reach = await installedReach();
  const reads: Event[] = [
    { toolName: 'read', input: { path: modelPath } },
    { toolName: 'grep', input: { path: 'design/model/', pattern: 'meaning' } },
    { toolName: 'glob', input: { path: 'design/model/**/*.md' } },
    {
      toolName: 'find',
      input: { path: 'design/model/', query: 'domain meaning' },
    },
    { toolName: 'bash', input: { command: `cat ${modelPath}` } },
    { toolName: 'bash', input: { command: 'ls', cwd: 'design/model' } },
    { toolName: 'eval', input: { code: `read('${modelPath}')` } },
  ];
  for (const name of [
    'tech-lead',
    'software-engineer',
    'test-engineer',
    'code-reviewer',
    'business-analyst',
  ]) {
    for (const kind of ['sub', 'main'] as const) {
      for (const event of reads) {
        expect(
          await reach.call(
            event,
            { kind, name: kind === 'sub' ? name : 'main' },
            kind === 'main' ? name : undefined,
          ),
          `${kind}: ${name}: ${event.toolName}`,
        ).toBeUndefined();
      }
    }
  }
});

it("agent-design/reach: the product owner's own session writes the domain model", async () => {
  const reach = await installedReach();
  for (const flag of [undefined, 'not-an-installed-cratylus-agent']) {
    expect(
      await reach.call(
        { toolName: 'write', input: { path: modelPath, content: 'meaning' } },
        { kind: 'main', name: 'main' },
        flag,
      ),
    ).toBeUndefined();
  }
});
