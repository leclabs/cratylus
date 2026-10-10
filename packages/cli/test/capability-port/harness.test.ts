// Independent harness controls. Journal-named stand-ins below exercise only the
// registration check, never journal behavior or any product example.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
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

function registrationHost(names: string[]) {
  const h = host();
  // Isolate these controls from whatever the current build installs.
  rmSync(h.home, { recursive: true, force: true });
  const directory = join(h.home, '.omp/agent/extensions');
  mkdirSync(directory, { recursive: true });
  if (names.length) {
    writeFileSync(
      join(directory, 'registration-control.ts'),
      `export default function registrationControl(pi) {
        for (const name of ${JSON.stringify(names)}) {
          pi.registerTool({
            name, label: name, description: 'Registration control, not journal behavior.',
            parameters: pi.typebox.Type.Object({ verb: pi.typebox.Type.String() }),
            approval: 'read',
            async execute() { throw new Error('Registration controls must not execute'); }
          });
        }
      }`,
    );
  }
  return h;
}

it('registration provenance control: omp-owned tools do not count as adapter tools', () => {
  const h = registrationHost(['concept_journal']);
  try {
    const wiring = h.inspect();
    const tool = h.offered(wiring);
    expect(
      wiring.registered
        .filter((registration) => registration.path === tool.sourceInfo.path)
        .map((registration) => registration.name),
    ).toEqual(['concept_journal']);
    expect(
      wiring.registered.some(
        (registration) => registration.path !== tool.sourceInfo.path,
      ),
    ).toBe(true);
  } finally {
    h.dispose();
  }
});

it('registration provenance negative: a second adapter tool is refused', () => {
  const h = registrationHost(['concept_journal', 'cut6_extra_tool']);
  try {
    expect(() => h.inspect()).toThrow(
      'the adapter registers one capability tool',
    );
  } finally {
    h.dispose();
  }
});

it('registration provenance negative: no installed adapter is refused', () => {
  const h = registrationHost([]);
  try {
    const wiring = h.inspect();
    expect(wiring.tools.some((tool) => tool.name === 'concept_journal')).toBe(
      false,
    );
    expect(() => h.offered(wiring)).toThrow(
      'installed omp must offer concept_journal',
    );
  } finally {
    h.dispose();
  }
});
