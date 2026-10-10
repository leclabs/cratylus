import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { type Fixture, fixture } from './fixture.js';
import { type Request, provider } from './provider.js';

const text = (content: unknown): string =>
  typeof content === 'string'
    ? content
    : Array.isArray(content)
      ? content.map((part) => part.text ?? '').join('\n')
      : '';

// Real omp dispatches `name`, the child reads the journal tool as omp offers it to
// the model (`read xd://concept_journal`), then yields; only transport is scripted.
// Returns the verbs of the schema the child's model was shown.
async function offered(f: Fixture, name: string, config: string) {
  const child = (r: Request) =>
    r.tools?.some((t) => t.function.name === 'yield');
  const server = await provider((request) => {
    const answered = request.messages.some((m) => m.role === 'tool');
    if (child(request))
      return answered
        ? { tool: 'yield', args: { data: { summary: 'Read.' } } }
        : { tool: 'read', args: { path: 'xd://concept_journal' } };
    if (answered) return { text: 'Dispatch complete.' };
    return {
      tool: 'task',
      args: {
        context: 'Read the journal tool.',
        tasks: [
          { agent: name, task: 'Read it.', solutionSpace: 'Edit nothing.' },
        ],
      },
    };
  });
  f.models(server.baseUrl);
  const session = f.launch({
    inspect: false,
    tools: ['task'],
    extra: ['--config', config],
  });
  try {
    await session.command({ type: 'prompt', message: 'Dispatch the task.' });
    await session.waitFor((frame) => frame.type === 'agent_end');
    expect(server.errors).toEqual([]);
    const read = server.requests
      .filter(child)
      .flatMap((r) => r.messages)
      .find((m) => m.role === 'tool');
    expect(read, JSON.stringify(session.frames)).toBeDefined();
    const shown = text(read!.content);
    const verb = /^\s*verb: ((?:"[^"]+"(?: \| )?)+);$/m.exec(shown);
    expect(verb, shown).not.toBeNull();
    return [...verb![1]!.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  } finally {
    session.stop();
    await session.done;
    server.close();
  }
}

// Decision 0051, at the capability rung, over the declarations install projects.
it('offers a dispatched read-only declaration no append verb of concept_journal, a default one every verb', async () => {
  const f = fixture();
  try {
    // Install seeds no `frontier` role from the fixture's empty host; the
    // installed agents' own roles resolve through this one.
    const config = join(f.root, 'runtime.json');
    writeFileSync(
      config,
      JSON.stringify({
        modelRoles: { frontier: 'fixture/declared' },
        async: { enabled: false },
        memory: { backend: 'off' },
      }),
    );
    const explained = JSON.parse(
      execFileSync('cratylus', ['concepts', '--explain'], {
        cwd: f.cwd,
        env: f.env,
        encoding: 'utf8',
      }),
    ) as { verbs: { name: string; effect: 'reads' | 'appends' }[] };
    const reads = explained.verbs
      .filter((v) => v.effect === 'reads')
      .map((v) => v.name);
    expect(reads.length).toBeGreaterThan(0);
    expect(reads.length).toBeLessThan(explained.verbs.length);
    // The assayer: read-only, by the `tools:` list install writes for it.
    expect(await offered(f, 'assayer', config)).toEqual(reads);
    // The builder: omp's default tools.
    expect(await offered(f, 'builder', config)).toEqual(
      explained.verbs.map((v) => v.name),
    );
  } finally {
    f.dispose();
  }
});
