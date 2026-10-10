import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  fixture,
  inspect,
  status,
} from '../../../../packages/cli/test/agent-launch/fixture.js';
import { provider } from '../../../../packages/cli/test/agent-launch/provider.js';

describe('agent launch — judgment', () => {
  it('1: keeps the agent body and status across actual compaction', async () => {
    const f = fixture();
    const d = {
      name: 'harbor-master',
      body: 'Keep the shoal survey separate from the dredging plan.',
      mark: '⚓',
    };
    // Every request, including the native compactor's summary request, reaches
    // a deterministic loopback provider, never a live model.
    const server = await provider(() => ({
      text: 'The shoal survey is recorded. Continue the dredging plan separately.',
    }));
    try {
      f.models(server.baseUrl);
      f.declaration(d);
      const config = join(f.root, 'runtime.json');
      writeFileSync(
        config,
        JSON.stringify({
          memory: { backend: 'off' },
          compaction: {
            methodOrder: ['soft'],
            keepRecentTokens: 1,
            reserveTokens: 2048,
          },
        }),
      );
      const session = f.launch({
        agent: d.name,
        inspect: false,
        extra: ['--config', config],
      });
      try {
        const before = await session.command({
          type: 'prompt',
          message: 'Record the shoal survey. '.repeat(100),
        });
        await session.waitFor(
          (frame) => frame.type === 'prompt_result' && frame.id === before.id,
        );
        // “Given a session started as an agent”.
        expect(f.observed().at(-1)!.prompt.join('\n')).toContain(d.body);
        expect(status(session.frames)).toContain(d.name);
        // “when it is compacted”: use omp's compact operation, not a forged
        // user summary. The recorded native compaction entry is the witness.
        await session.command({ type: 'compact' });
        const after = await session.command({
          type: 'prompt',
          message: 'Continue after compaction.',
        });
        await session.waitFor(
          (frame) => frame.type === 'prompt_result' && frame.id === after.id,
        );
        const observed = f
          .observed()
          .filter((observation) => observation.phase === 'turn');
        expect(observed.at(-1)!.entries).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ type: 'compaction' }),
          ]),
        );
        expect(server.errors).toEqual([]);
        // “system prompt still carries ... body afterwards”; “status line
        // still shows the agent”. Status is the last value per RPC status key,
        // so clearing/replacing the initial badge cannot masquerade as kept.
        expect(observed.at(-1)!.prompt.join('\n')).toContain(d.body);
        expect(status(session.frames)).toContain(d.name);
      } finally {
        session.stop();
        await session.done;
      }
    } finally {
      server.close();
      f.dispose();
    }
  });
  it('2: the next session carries the declaration changed after the first started', async () => {
    const f = fixture();
    try {
      const d = {
        name: 'tidal-analyst',
        body: 'Use the morning tide table for the survey.',
      };
      f.declaration(d);
      const first = await inspect(f, { agent: d.name });
      // Establishes “a session was started as it”, before the change.
      expect(first.observation.prompt.join('\n')).toContain(d.body);
      const changed = {
        ...d,
        body: 'Use the corrected evening tide table for the survey.',
      };
      f.declaration(changed);
      const next = await inspect(f, { agent: d.name });
      // “the next session ... carries the changed body”; no assertion about
      // hot reload in the first session, which the example does not fix.
      expect(next.observation.prompt.join('\n')).toContain(changed.body);
    } finally {
      f.dispose();
    }
  });
  it('3: discovers and starts the agent in the project own agent directory', async () => {
    const f = fixture();
    try {
      const d = {
        name: 'project-pilot',
        body: 'Apply this harbor project navigation charter.',
      };
      f.declaration(d, join(f.cwd, '.omp/agents'));
      const launched = await inspect(f, { agent: d.name, cwd: f.cwd });
      // “started as that project's agent”: the project-only declaration's
      // body reaches the session. No unstated home/project collision case.
      expect(launched.observation.prompt.join('\n')).toContain(d.body);
    } finally {
      f.dispose();
    }
  });
});
