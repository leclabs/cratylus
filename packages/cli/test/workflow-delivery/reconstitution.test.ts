// 0154: instructions are deterministic; actual agent reading and readback are judged in use.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, it } from 'vitest';
import {
  type LoadedExtension,
  load,
} from '../reconstitution/binding/fixture.js';
import { type Host, installed, owned } from './fixture.js';

let h: Host;
let running: LoadedExtension | undefined;
beforeEach(() => {
  h = installed();
});
afterEach(() => {
  running?.restore();
  running = undefined;
  h.dispose();
});

function wholeBeforeDetail(text: string): void {
  const lower = text.toLowerCase();
  const delivered = /(?:delivered[^.\n]*workflow|cratylus:workflow)/i.exec(
    text,
  );
  expect(
    delivered,
    'directs reading the delivered workflow, not remembered instructions alone',
  ).not.toBeNull();
  const detail = lower.indexOf('detail');
  expect(detail, 'both overviews precede detail').toBeGreaterThan(
    delivered!.index,
  );
  expect(lower.slice(0, detail)).toMatch(/overview/);
  expect(lower.slice(0, detail)).toMatch(/(?:touch|project|each context)/);
  expect(lower.slice(detail)).toMatch(
    /(?:read[^.\n]*back|readback|tell the operator)/,
  );
  expect(lower).toMatch(/current design/);
  expect(lower).toMatch(/open decisions?/);
  expect(lower).toMatch(/cuts? in flight/);
  expect(lower).toMatch(/before (?:any act|acting)/);
}

it('workflow/7, workflow/8 — every composed holder reads delivered and touched context overviews before detail and readback', () => {
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
    expect
      .soft(() => wholeBeforeDetail(holder.instruction), holder.name)
      .not.toThrow();
    expect
      .soft(holder.instruction)
      .toMatch(/every start|each start|start.*compact/i);
  }
});

it.each([
  ['workflow/7', false],
  ['workflow/8', true],
] as const)(
  '%s — omp session-start note requires both overviews before detail and current readback',
  async (_example, compacted) => {
    running = await load(
      { ...h, extension: join(owned(h), 'extensions/cratylus.ts') },
      { role: 'architect', kind: 'main' },
    );
    if (compacted) {
      await running.fire('before_agent_start', {
        systemPrompt: ['Harness instructions.'],
        prompt: 'Earlier work.',
      });
      await running.fire('session_compact');
    }
    const answer = await running.fire('before_agent_start', {
      systemPrompt: ['Harness instructions.'],
      prompt: 'Recover the current design.',
    });
    const parts = answer?.systemPrompt as string[] | undefined;
    const note = parts?.find((part) =>
      part.startsWith('# Session start: reconstitution'),
    );
    expect(
      note,
      'the actual session-start note, not the agent declaration',
    ).toBeDefined();
    wholeBeforeDetail(note!);
    expect(note).toMatch(/journal/);
    expect(note).toMatch(/ledger/);
    expect(note).toMatch(/(?:stand now|current branch|afresh|current design)/);
  },
);
