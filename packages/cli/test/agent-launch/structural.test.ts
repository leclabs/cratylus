import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { carries, fixture, inspect, status } from './fixture.js';
import { provider } from './provider.js';

const declaration = {
  name: 'cartographer',
  body: 'Map the estuary before drawing its shipping routes.',
  mark: '⚓',
};
describe('agent launch — visible examples', () => {
  it('1: carries the declaration body, not raw front matter, and its model and effort', async () => {
    const f = fixture();
    try {
      const file = f.declaration(declaration);
      const rawFrontMatter =
        /(?:^|\n)---[ \t]*\n(?:[^\n]*\n)*?name:[^\n]*\n(?:[^\n]*\n)*?---(?:\n|$)/;
      // “never as raw front matter” calls for this negative: a deliberately
      // wrong extension appends the whole file through the real prompt chain.
      const wrong = join(f.root, 'raw-declaration.ts');
      writeFileSync(
        wrong,
        `export default pi => pi.on('before_agent_start', e => ({systemPrompt: [...e.systemPrompt, ${JSON.stringify(readFileSync(file, 'utf8'))}]}));`,
      );
      const raw = await inspect(f, { extension: wrong });
      expect(() =>
        expect(raw.observation.prompt.join('\n')).not.toMatch(rawFrontMatter),
      ).toThrow();
      const { observation } = await inspect(f, { agent: declaration.name });
      // “system prompt carries ... body”; “model and effort”.
      carries(observation, declaration);
      // “never as raw front matter”: reject a fenced YAML declaration, not
      // the name/description/model rendered freely as prose.
      expect(observation.prompt.join('\n')).not.toMatch(rawFrontMatter);
    } finally {
      f.dispose();
    }
  });
  it('2: launch and native task dispatch share one declaration body, model and effort', async () => {
    const f = fixture();
    const server = await provider((request) => {
      if (request.tools?.some((tool) => tool.function.name === 'yield'))
        return { tool: 'yield', args: { data: 'charted' } };
      if (request.messages.some((message) => message.role === 'tool'))
        return { text: 'Dispatch complete.' };
      return {
        tool: 'task',
        args: {
          context: 'Chart the estuary.',
          tasks: [
            {
              agent: declaration.name,
              task: 'Report the chart.',
              solutionSpace: 'Do not edit files.',
            },
          ],
        },
      };
    });
    try {
      f.models(server.baseUrl);
      f.declaration({ ...declaration, tools: [] });
      const config = join(f.root, 'runtime.json');
      writeFileSync(
        config,
        JSON.stringify({
          async: { enabled: false },
          memory: { backend: 'off' },
        }),
      );
      const parent = f.launch({
        inspect: false,
        tools: ['task'],
        extra: ['--config', config],
      });
      try {
        await parent.command({
          type: 'prompt',
          message: 'Dispatch the charting task.',
        });
        await parent.waitFor((frame) => frame.type === 'agent_end');
        const child = f
          .observed()
          .find(
            (observation) =>
              observation.kind === 'sub' && observation.phase === 'turn',
          );
        // “it is dispatched from another session”; “both carry the same
        // body, model and effort, from the one declaration”.
        expect(child, JSON.stringify(parent.frames)).toBeDefined();
        carries(child!, declaration);
        expect(server.errors).toEqual([]);
      } finally {
        parent.stop();
        await parent.done;
      }
      const main = await inspect(f, { agent: declaration.name });
      carries(main.observation, declaration);
    } finally {
      server.close();
      f.dispose();
    }
  });
  it('3: preserves the operator tool selection without widening or narrowing', async () => {
    const f = fixture();
    try {
      f.declaration({ ...declaration, tools: ['read', 'write'] });
      const { observation } = await inspect(f, {
        agent: declaration.name,
        tools: ['read', 'grep'],
      });
      // “operator's selection”; includes both a dispatch-only and an
      // operator-only tool, so equality binds “neither widens nor narrows”.
      expect(observation.tools.slice().sort()).toEqual(['grep', 'read']);
    } finally {
      f.dispose();
    }
  });
  it('4: shows the name and declared mark, or the name alone without a mark', async () => {
    const f = fixture();
    try {
      for (const d of [
        declaration,
        { name: 'surveyor', body: 'Measure the tidal inlet.' },
      ]) {
        f.declaration(d);
        const observed = await inspect(f, { agent: d.name, equals: true });
        // “status line shows that name and mark”; “no mark ... shows its name”.
        expect(status(observed.frames)).toContain(d.name);
        if ('mark' in d) expect(status(observed.frames)).toContain(d.mark);
      }
    } finally {
      f.dispose();
    }
  });
  it('5: rejects an unknown name without starting; without the flag stays plain', async () => {
    const f = fixture();
    try {
      f.declaration(declaration);
      const plain = await inspect(f);
      const assertPlain = (observed: typeof plain) => {
        // “nothing of any declaration in its system prompt, no agent on its status line”.
        expect(observed.observation.prompt.join('\n')).not.toContain(
          declaration.body,
        );
        expect(observed.observation.prompt.join('\n')).not.toContain(
          declaration.name,
        );
        expect(observed.observation.prompt.join('\n')).not.toContain(
          declaration.mark,
        );
        expect(status(observed.frames)).not.toContain(declaration.name);
      };
      assertPlain(plain);
      // These two negatives are called for by “nothing ... no agent”. Each
      // changes just one forbidden dimension using a real omp extension.
      for (const dimension of ['prompt', 'status']) {
        const wrong = join(f.root, `wrong-${dimension}.ts`);
        writeFileSync(
          wrong,
          `export default function(pi) { ${dimension === 'prompt' ? `pi.on('before_agent_start', e => ({systemPrompt: [...e.systemPrompt, ${JSON.stringify(declaration.body)}]}));` : `pi.on('session_start', (_e, ctx) => ctx.ui.setStatus('wrong', ${JSON.stringify(declaration.name)}));`} }`,
        );
        const polluted = await inspect(f, { extra: [], extension: wrong });
        expect(
          () => assertPlain(polluted),
          `rejects unwanted ${dimension}`,
        ).toThrow();
      }
      const unknown = f.launch({ agent: 'absent-estuary-agent' });
      unknown.send({ type: 'prompt', message: 'Must never start.' });
      const result = await unknown.done;
      // “reports the name as unknown and no session starts”: the later
      // observer must see neither session_start nor before_agent_start.
      expect(result.code).not.toBe(0);
      expect(result.stderr + result.stdout).toContain('absent-estuary-agent');
      expect(result.stderr + result.stdout).toMatch(
        /unknown.*absent-estuary-agent|absent-estuary-agent.*unknown/is,
      );
      expect(f.observed()).toEqual([]);
    } finally {
      f.dispose();
    }
  });
  it('6: starts through only the one installed cratylus extension, without launch scaffolding', async () => {
    const f = fixture();
    try {
      f.declaration(declaration);
      // The harness invokes omp itself with just install's cratylus.ts plus
      // a passive observer. --no-extensions excludes other launch machinery.
      const launched = await inspect(f, {
        agent: declaration.name,
        onlyInstalled: true,
      });
      expect(launched.observation.prompt.join('\n')).toContain(
        declaration.body,
      );
      // Starting under this allowlist witnesses “through the one cratylus
      // extension”; no launcher, wrapper or declaration copy exists.
    } finally {
      f.dispose();
    }
  });
});
