import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { type Fixture, fixture } from './fixture.js';
import { provider } from './provider.js';

const text = (content: unknown): string =>
  typeof content === 'string'
    ? content
    : Array.isArray(content)
      ? content.map((part) => part.text ?? '').join('\n')
      : '';

// Real omp dispatches `name`, the child reads the journal tool as omp offers it to
// the model (`read xd://concept_journal`), then closes; only transport is scripted.
// The session runs on `fixture/base` and the declarations on `fixture/declared`, so
// the child's requests are those on model `declared`. omp 18.10.2 offers task
// subagents no `yield` tool: the child yields when offered one, else replies in text.
// Returns the verbs of the schema the child's model was shown.
async function offered(f: Fixture, name: string, config: string) {
  const server = await provider((request) => {
    const answered = request.messages.some((m) => m.role === 'tool');
    if (request.model === 'declared')
      return !answered
        ? { tool: 'read', args: { path: 'xd://concept_journal' } }
        : request.tools?.some((t) => t.function.name === 'yield')
          ? { tool: 'yield', args: { data: { summary: 'Read.' } } }
          : { text: 'Read.' };
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
      .filter((r) => r.model === 'declared')
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

// Decision 0068, rebound under 0085: tool selection never withholds journal verbs.
it('offers every dispatched declaration, a tools-narrowed one included, every concept_journal verb', async () => {
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
    f.declaration({
      name: 'narrowed-journal-reader',
      body: 'Read the journal tool.',
      tools: ['read'],
    });
    f.declaration({
      name: 'default-journal-reader',
      body: 'Read the journal tool.',
    });
    const everyVerb = explained.verbs.map((v) => v.name).sort();
    expect(
      (await offered(f, 'narrowed-journal-reader', config)).sort(),
    ).toEqual(everyVerb);
    expect((await offered(f, 'default-journal-reader', config)).sort()).toEqual(
      everyVerb,
    );
  } finally {
    f.dispose();
  }
});
