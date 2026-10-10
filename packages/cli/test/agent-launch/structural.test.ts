import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
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
      f.configure({
        modelRoles: { default: 'fixture/base' },
        defaultThinkingLevel: 'low',
      });
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
      const { observation } = await inspect(f, {
        agent: declaration.name,
        modelFlags: false,
      });
      // “system prompt carries ... body”; “model and effort”.
      carries(observation, declaration);
      // “never as raw front matter”: reject a fenced YAML declaration, not
      // the name/description/model rendered freely as prose.
      expect(observation.prompt.join('\n')).not.toMatch(rawFrontMatter);
    } finally {
      f.dispose();
    }
  });
  it('1b: explicit operator model and thinking flags win while the declaration body stays', async () => {
    const f = fixture();
    try {
      f.declaration(declaration);
      const { observation } = await inspect(f, {
        agent: declaration.name,
        modelFlags: false,
        extra: ['--model', 'fixture/base', '--thinking', 'low'],
      });
      // “explicit operator flags win”; the declaration still supplies its body.
      expect(observation.prompt.join('\n')).toContain(declaration.body);
      expect.soft(observation.model).toMatchObject({
        provider: 'fixture',
        id: 'base',
      });
      expect.soft(observation.effort).toBe('low');
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
      f.configure({
        modelRoles: { default: 'fixture/base' },
        defaultThinkingLevel: 'low',
      });
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
        modelFlags: false,
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
      const main = await inspect(f, {
        agent: declaration.name,
        modelFlags: false,
      });
      carries(main.observation, declaration);
    } finally {
      server.close();
      f.dispose();
    }
  });
  it('3: preserves the operator tool selection without widening or narrowing', async () => {
    const f = fixture();
    try {
      const tools = ['read', 'grep'];
      const plain = await inspect(f, { tools });
      // “neither widens”: task is declaration-only, not granted by these flags.
      expect(plain.observation.tools).not.toContain('task');
      f.declaration({ ...declaration, tools: ['read', 'task'] });
      const { observation } = await inspect(f, {
        agent: declaration.name,
        tools,
      });
      // “operator's selection” is what omp grants, extension tools included,
      // not the literal --tools list. Equality binds “neither widens nor narrows”.
      expect
        .soft(observation.tools.slice().sort())
        .toEqual(plain.observation.tools.slice().sort());
      expect.soft(observation.tools).toContain('concept_journal');
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
  it('7: install retires agent launchers, persona overlays, badges and linked commands', () => {
    const name = 'corpus-pilot';
    const body = 'Guide the survey vessel through the inlet.';
    const f = fixture({
      prepare: ({ cwd }) => {
        const agents = join(cwd, 'corpus/agents');
        mkdirSync(agents, { recursive: true });
        // A fixture corpus consumed by the real install loader, not a hand-
        // placed omp declaration or a dependency on the bundled canon's agents.
        writeFileSync(
          join(agents, `${name}.ts`),
          `export const pilot = ${JSON.stringify({
            name,
            description: 'A fixture corpus agent.',
            mark: null,
            key: null,
            objective: [{ value: `survey ≜ ${body}`, level: 'fixed' }],
          })};\n`,
        );
        writeFileSync(
          join(cwd, 'cratylus.config.ts'),
          `export default { extends: [${JSON.stringify({
            name: 'launch-fixture',
            agents,
            manifest: {
              objective: {
                group: 'Constitution',
                repertoire: 'open',
                arity: 'scalar',
                level: 'fixed',
                projection: 'text',
              },
            },
          })}] };\n`,
        );
      },
    });
    try {
      // “installed with a corpus that delivers agents”: install really places it.
      expect(
        readFileSync(join(f.home, '.omp/agent/agents', `${name}.md`), 'utf8'),
      ).toContain(body);
      // Inspect only what install places in this fixture HOME. Directory entries
      // include symlinks, so a broken linked command cannot pass as absent.
      const placed = readdirSync(f.home, { recursive: true }).map(String);
      // “no launcher, persona overlay or badge for any agent”.
      expect
        .soft(
          placed.filter((path) => /(^|\/)omp-agent$/.test(path)),
          'install places no omp-agent launcher',
        )
        .toEqual([]);
      expect
        .soft(
          placed.filter((path) => /\/personas\/[^/]+\/omp\.yml$/.test(path)),
          'install places no persona omp.yml overlay',
        )
        .toEqual([]);
      expect
        .soft(
          placed.filter((path) =>
            /(^|\/)cratylus-persona-badge\.ts$/.test(path),
          ),
          'install places no persona badge extension',
        )
        .toEqual([]);
      // “starting as an agent goes only through omp --agent”: no linked command.
      // The actual --agent path is already witnessed by examples 1 and 6.
      expect
        .soft(placed, 'install links no persona command')
        .not.toContain(`.local/bin/${name}`);
    } finally {
      f.dispose();
    }
  });
});
