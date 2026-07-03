/**
 * E5.S4 — hooks via plugin events: opencode + kilo (nice-to-have).
 *
 * Documented truth: IR hooks reach harnesses whose only hook surface is the
 * plugin event system. opencode: compile emits
 * `.opencode/plugins/agent-forge-hooks.ts` exporting a `tool.execute.before`
 * handler that shells the IR command; ONLY the event names verified in [OC5]
 * (`tool.execute.before/after`, `session.created`, `file.edited`) are mapped
 * — unverified names are excluded until re-verified. kilo: an equivalent
 * artifact against `@kilocode/plugin` lifecycle hooks [KL6]. Canonical events
 * with no verified plugin equivalent land in `.skipped` by name.
 *
 * Fate split:
 * - opencode plugin shim emission + loud skip of unmappable events: GREEN;
 * - only-[OC5]-verified-names mapping: GREEN as of the opencode-adapter-truth
 *   fix — the event map was pruned to exactly the 4 verified names;
 * - kilo: GRADUATED with kilo-adapter — the `.kilo/plugins/` artifact ships
 *   against a canonicalToKilo map that reuses opencode's [OC5]-verified names
 *   as a disclosed INFERENCE (shared runtime lineage, not independently
 *   re-verified for Kilo's own plugin docs — see src/adapters/kilo/events.ts).
 */

import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, expect } from 'vitest';
import { canonicalToOpencode } from '../../../src/adapters/opencode/events.js';
import { opencodeAdapter } from '../../../src/adapters/opencode/index.js';
import type { Adapter, IR } from '../../../src/core/index.js';
import { makeTmpDir, story } from '../helpers.js';

/** The [OC5]-verified opencode plugin event names (story E5.S4 bullet 1). */
const VERIFIED_OC5 = [
  'tool.execute.before',
  'tool.execute.after',
  'session.created',
  'file.edited',
];

const hookIR = (events: IR['hooks']): IR => ({
  manifest: { agentForge: 1, scope: 'project', targets: ['opencode'] },
  hooks: events,
});

let cwd: string;
beforeEach(() => {
  cwd = makeTmpDir();
});
afterEach(() => {
  rmSync(cwd, { recursive: true, force: true });
});

story(
  'E5.S4',
  'opencode: a canonical PreToolUse hook compiles to a .opencode/plugins shim with a tool.execute.before handler shelling the IR command',
  async () => {
    const ir = hookIR([
      {
        id: 'guard',
        events: ['tool.use.pre'],
        matcher: '*',
        command: 'echo agent-forge-guard',
      },
    ]);
    const report = await opencodeAdapter.write(ir, 'project', cwd, {});
    const shim = report.written.find((p) =>
      p.endsWith(join('.opencode', 'plugins', 'agent-forge-hooks.ts')),
    );
    expect(
      shim,
      `plugin shim not among written: ${report.written.join(', ')}`,
    ).toBeDefined();
    const src = readFileSync(shim as string, 'utf8');
    // The [OC5]-verified event name is the handler key…
    expect(src).toContain("'tool.execute.before'");
    // …and the handler shells out the IR command.
    expect(src).toContain('echo agent-forge-guard');
    expect(src).toContain('spawnSync');
  },
);

story(
  'E5.S4',
  'opencode: a canonical event with no plugin equivalent lands in .skipped by name, never silently dropped',
  async () => {
    const ir = hookIR([
      {
        id: 'unmappable',
        events: ['file.read.pre'],
        command: 'echo never',
      },
    ]);
    const report = await opencodeAdapter.write(ir, 'project', cwd, {});
    expect(report.written).toEqual([]);
    expect(report.skipped).toHaveLength(1);
    expect(report.skipped[0]?.reason).toContain('file.read.pre');
    expect(report.warnings.some((w) => w.includes('file.read.pre'))).toBe(true);
  },
);

story(
  'E5.S4',
  'opencode: only the [OC5]-verified plugin event names are mapped; unverified names are excluded until re-verified',
  () => {
    const mapped = Object.entries(canonicalToOpencode);
    expect(mapped.length).toBeGreaterThan(0);
    const unverified = mapped.filter(
      ([, native]) => !VERIFIED_OC5.includes(native as string),
    );
    expect(
      unverified,
      `canonical→opencode map carries native event names not verified in [OC5]: ${unverified
        .map(([c, n]) => `${c}→${n}`)
        .join(', ')} (verified set: ${VERIFIED_OC5.join(', ')})`,
    ).toEqual([]);
  },
);

story(
  'E5.S4',
  'kilo: an equivalent hook-plugin artifact is emitted against @kilocode/plugin lifecycle hooks [KL6]',
  async () => {
    const home: string = '../../../src/adapters/kilo/index.js';
    const mod = (await import(home)) as {
      kiloAdapter?: Adapter;
      default?: Adapter;
    };
    const kilo = mod.kiloAdapter ?? mod.default;
    expect(kilo, 'kilo adapter module exports no adapter').toBeDefined();
    const report = await (kilo as Adapter).write(
      {
        manifest: { agentForge: 1, scope: 'project', targets: ['kilo'] },
        hooks: [
          {
            id: 'guard',
            events: ['tool.use.pre'],
            command: 'echo agent-forge-guard',
          },
        ],
      },
      'project',
      cwd,
      {},
    );
    expect(
      report.written.some((p) => /\.kilo[/\\]plugins[/\\]/.test(p)),
      `documented .kilo/plugins/ artifact not among written: ${report.written.join(', ')}`,
    ).toBe(true);
  },
);
