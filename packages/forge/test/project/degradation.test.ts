// THE WIRING, END TO END — that a shortfall DEGRADES rather than fails, and that
// what survives the degradation is the thing that makes it safe.
//
// `realization.test.ts` pins the DECISION in isolation. That is not enough: the
// decision is only worth its argument if the projection actually withholds the
// mechanism and actually keeps the declaration, and those are two different
// statements about two different code paths. A seam that decided correctly and
// then emitted the mechanism anyway would pass every test in that file.
//
// One fixture drives both sides. `warden` composes an enforcing guardrail on
// `turn.end` — realizable on both harnesses, narrowable only by claude — so the
// SAME vector must project as a bound on claude and a steer on codex.

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { HarnessMechanism } from '@cratylus/schema/hook';
import { describe, expect, it } from 'vitest';
import { adapterByName } from '../../src/adapters/registry/index.js';
import {
  type ProjectablePlugin,
  projectPluginSet,
} from '../../src/project/index.js';
import { FIXTURE_ANATOMY } from '../fixture-anatomy.js';

const here = fileURLToPath(new URL('.', import.meta.url));

const plugin: ProjectablePlugin = {
  name: 'fixture-enforcing',
  manifest: FIXTURE_ANATOMY,
  agents: join(here, 'fixtures-enforcing', 'agents'),
};

const MECHANISMS = new Map<string, HarnessMechanism>([
  [
    'fixture-warden',
    {
      command: 'sh fixture-warden.sh',
      workers: [
        {
          filename: 'worker.sh',
          targetPath: 'hooks/fixture-warden/worker.sh',
          content: '#!/bin/sh\nexit 0\n',
          executable: true,
        },
      ],
    },
  ],
]);

async function project(harness: string) {
  const warnings: string[] = [];
  const tree = await projectPluginSet({
    plugins: [plugin],
    adapter: adapterByName(harness),
    mechanisms: MECHANISMS,
    warn: (line) => warnings.push(line),
  });
  const agentFile = tree.files.find((f) => f.path.startsWith('agents/'));
  return { tree, warnings, agentFile };
}

describe('claude — the harness CAN narrow it, so it stays a bound', () => {
  it('emits the mechanism into the agent definition', async () => {
    const { agentFile } = await project('claude');
    expect(agentFile?.content).toContain('Stop');
    expect(agentFile?.content).toContain('sh fixture-warden.sh');
  });

  it('emits the worker bytes the command invokes', async () => {
    const { tree } = await project('claude');
    expect(tree.files.map((f) => f.path)).toContain(
      'hooks/fixture-warden/worker.sh',
    );
  });

  it('warns about nothing — there was no shortfall', async () => {
    expect((await project('claude')).warnings).toEqual([]);
  });
});

describe('codex — cannot narrow it, so it degrades to a steer', () => {
  it('COMPLETES the projection rather than throwing', async () => {
    // The operator asked for an agent projection and must receive one. A build
    // that cannot finish because the target harness is weaker forces exactly the
    // harness knowledge the canon exists to spare them.
    const { tree } = await project('codex');
    expect(tree.agents).toBe(1);
    expect(tree.files.length).toBeGreaterThan(0);
  });

  it('KEEPS the declaration — the rule still reaches the agent', async () => {
    // The whole justification for warning instead of refusing. If this ever
    // fails, the warning becomes a receipt for silent non-enforcement and the
    // refusal must come back.
    const { agentFile } = await project('codex');
    expect(agentFile?.content).toContain(
      'fixture-warden ≜ the rule the agent can read',
    );
  });

  it('WITHHOLDS the mechanism — no global hook, no widening', async () => {
    // Codex could only have emitted this hook for EVERY agent on the host. The
    // absence asserted here is the difference between degrading and widening.
    const { tree } = await project('codex');
    const all = tree.files.map((f) => f.content).join('\n');
    expect(all).not.toContain('sh fixture-warden.sh');
    expect(tree.files.map((f) => f.path)).not.toContain('hooks.json');
  });

  it('WITHHOLDS the worker bytes — dead files read as coverage', async () => {
    const { tree } = await project('codex');
    expect(tree.files.map((f) => f.path)).not.toContain(
      'hooks/fixture-warden/worker.sh',
    );
  });

  it('WARNS, naming the constraint, the event, the harness and the agent', async () => {
    const { warnings } = await project('codex');
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('fixture-warden');
    expect(warnings[0]).toContain('turn.end');
    expect(warnings[0]).toContain('codex');
    expect(warnings[0]).toContain('warden');
  });

  it('says the rule SURVIVES, so the operator can judge the risk', async () => {
    const { warnings } = await project('codex');
    expect(warnings[0]).toMatch(/steer, not a bound/i);
  });
});

describe('the SEAM withholds — observed at the seam, not downstream of it', () => {
  // WHY SPIES AND NOT OUTPUT. The assertions above were checked by mutation and
  // did NOT convict: defeating the seam's withholding left every one of them
  // green, because codex's agent TOML carries no hook field and `codexHooksJson`
  // skips an unscopable event on its own. Three guards, and the output could not
  // tell them apart — so the law could migrate back into the adapter, which is
  // exactly the drift this design removed.
  //
  // These observe what the seam HANDS the adapter. They fail the moment the
  // decision stops being the seam's, whatever the adapter then does about it.
  function spy(harness: string) {
    const base = adapterByName(harness);
    const sawBindings: string[][] = [];
    const sawMechanisms: string[][] = [];
    return {
      sawBindings,
      sawMechanisms,
      adapter: {
        ...base,
        agentDef: (
          a: Parameters<typeof base.agentDef>[0],
          ctx: Parameters<typeof base.agentDef>[1],
        ) => {
          sawMechanisms.push([...(ctx.mechanisms?.keys() ?? [])]);
          return base.agentDef(a, ctx);
        },
        ...(base.enforcingSurface
          ? {
              enforcingSurface: (
                bs: Parameters<NonNullable<typeof base.enforcingSurface>>[0],
              ) => {
                sawBindings.push(bs.map((b) => b.anchor));
                return base.enforcingSurface?.(bs) ?? null;
              },
            }
          : {}),
      },
    };
  }

  it('never offers a degraded binding to the global surface', async () => {
    const s = spy('codex');
    await projectPluginSet({
      plugins: [plugin],
      adapter: s.adapter,
      mechanisms: MECHANISMS,
      warn: () => {},
    });
    // Either the surface was not called at all, or it was called with the
    // degraded binding absent. Both are correct; offering it is not.
    expect(s.sawBindings.flat()).not.toContain('fixture-warden');
  });

  it('never offers a degraded mechanism to agentDef', async () => {
    const s = spy('codex');
    await projectPluginSet({
      plugins: [plugin],
      adapter: s.adapter,
      mechanisms: MECHANISMS,
      warn: () => {},
    });
    expect(s.sawMechanisms.flat()).not.toContain('fixture-warden');
  });

  it('DOES offer it when the harness can carry it — else this proves nothing', async () => {
    // The control. Without it, a seam that withheld everything unconditionally
    // would satisfy both assertions above.
    const s = spy('claude');
    await projectPluginSet({
      plugins: [plugin],
      adapter: s.adapter,
      mechanisms: MECHANISMS,
      warn: () => {},
    });
    expect(s.sawMechanisms.flat()).toContain('fixture-warden');
  });
});

describe('the two harnesses genuinely diverge on this fixture', () => {
  // Without this, every assertion above could be passing for the wrong reason —
  // a fixture that degraded on BOTH harnesses would satisfy the codex block and
  // silently gut the claude one.
  it('same vector, different mode — bound on claude, steer on codex', async () => {
    const claude = await project('claude');
    const codex = await project('codex');
    expect(claude.warnings).toEqual([]);
    expect(codex.warnings).toHaveLength(1);
    expect(claude.agentFile?.content).toContain('sh fixture-warden.sh');
    expect(codex.agentFile?.content).not.toContain('sh fixture-warden.sh');
  });

  it('and BOTH publish the declaration regardless of mode', async () => {
    const declaration = 'fixture-warden ≜ the rule the agent can read';
    expect((await project('claude')).agentFile?.content).toContain(declaration);
    expect((await project('codex')).agentFile?.content).toContain(declaration);
  });
});
