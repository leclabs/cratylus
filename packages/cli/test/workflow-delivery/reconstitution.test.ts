// 0154: instructions are deterministic; actual agent reading and readback are judged in use.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { type Host, installed, owned } from './fixture.js';

let h: Host;
beforeEach(() => {
  h = installed();
});
afterEach(() => {
  h.dispose();
});

it('workflow/7, workflow/8 — every composed holder reads the design from the concept journal, then the recent work in version control, at every start', () => {
  const agents = join(owned(h), 'agents');
  const holders = readdirSync(agents)
    .filter((name) => name.endsWith('.md'))
    .flatMap((name) => {
      const text = readFileSync(join(agents, name), 'utf8');
      const procedure =
        /^### procedure\s*\n([\s\S]*?)(?=^#{1,3} |(?![\s\S]))/m.exec(
          text,
        )?.[1] ?? '';
      const instruction = /^- \*\*reconstitution\*\*.*$/m.exec(procedure)?.[0];
      return instruction ? [{ name, instruction }] : [];
    });
  expect(holders.map((holder) => holder.name)).toContain('architect.md');
  for (const holder of holders) {
    const lower = holder.instruction.toLowerCase();
    expect.soft(lower, holder.name).toMatch(/every start/);
    const journal = lower.indexOf('concept journal');
    expect.soft(journal, holder.name).toBeGreaterThanOrEqual(0);
    expect
      .soft(lower.indexOf('version control'), holder.name)
      .toBeGreaterThan(journal);
    expect.soft(lower, holder.name).toMatch(/where things stand/);
  }
});
