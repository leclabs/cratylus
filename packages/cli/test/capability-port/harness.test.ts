// Independent harness control: never a stand-in for concept_journal. This
// proves the observer reaches omp's actual registered definition and real cwd.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { host, shellTools, toolJSON } from './fixture.js';
import { replaceRuntime } from './replacement.js';

it('observer control: real omp registers and executes a non-journal witness', () => {
  const h = host();
  try {
    const directory = join(h.home, '.omp/agent/extensions');
    mkdirSync(directory, { recursive: true });
    writeFileSync(
      join(directory, 'registry-witness.ts'),
      `export default function witness(pi) {
      pi.on('session_start', async () => { pi.registerTool({ name: 'cut6_registry_witness', label: 'Registry witness', description: 'Echo the real session directory and arguments.',
        parameters: pi.typebox.Type.Object({ value: pi.typebox.Type.String() }), approval: 'read',
        async execute(_id, args, _signal, _update, ctx) { return { content: [{ type: 'text', text: JSON.stringify({ cwd: ctx.cwd, value: args.value }) }] }; }
      }); });
    }`,
    );
    const wiring = h.inspect(
      [{ value: 'registered-call' }],
      ['cut6_registry_witness', ...shellTools],
    );
    for (const name of ['cut6_registry_witness', ...shellTools]) {
      const tool = wiring.tools.find((t) => t.name === name);
      expect(tool, name).toBeDefined();
      expect(tool!.parameters.type).toBe('object');
      expect(Object.keys(tool!.parameters.properties).length).toBeGreaterThan(
        0,
      );
    }
    expect(wiring.results).toHaveLength(1);
    expect(wiring.results[0]!.approval).toBe('read');
    expect(toolJSON(wiring.results[0]!.result)).toEqual({
      cwd: h.cwd,
      value: 'registered-call',
    });
  } finally {
    h.dispose();
  }
});

it('package control: npm replaces the runtime package without a workspace link', () => {
  const h = host();
  try {
    h.seed();
    const before = h.concepts('state');
    replaceRuntime(h);
    expect(h.concepts('state')).toEqual({
      ...before,
      cut6Runtime: 'newer-installed-package',
    });
  } finally {
    h.dispose();
  }
});
