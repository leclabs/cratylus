/**
 * E6.S4 — ambiguous organ value ⇒ `ELICIT:` marker, never an invented answer.
 *
 * Documented truth: for an agent description silent on `autonomy`,
 * `satisficing`, and `memory`, the emitted vector carries machine-greppable
 * `ELICIT:` markers at exactly those organs (null-with-marker or sidecar
 * list) with ZERO enum values invented for them; a companion elicitation
 * script exists per marker (≥2 candidate values + the one bisecting question
 * per /elicit's information-gain law); a pipeline run emitting a concrete
 * value for a silent organ FAILS the story.
 *
 * TRACKED: no exemplify/optimize entrypoint ships in this package (probe
 * enumerates the search). The fixture is deliberately silent on the three
 * organs so the assertions bite verbatim on graduation day.
 */

import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, expect } from 'vitest';
import { makeTmpDir, story } from '../helpers.js';
import { probeMessage, probePipeline } from './pipeline-probe.js';

/** Silent on autonomy, satisficing, memory — says nothing about supervision
 * levels, stopping rules, or persistence. */
const SILENT_DESCRIPTION = `A code-review agent. Formal in tone, always
explains its reasoning step by step, works on TypeScript codebases, and
reports findings as fenced review blocks.`;

const SILENT_ORGANS = ['autonomy', 'satisficing', 'memory'] as const;

let cwd: string;
beforeEach(() => {
  cwd = makeTmpDir();
  writeFileSync(join(cwd, 'agent-description.md'), SILENT_DESCRIPTION, 'utf8');
});
afterEach(() => {
  rmSync(cwd, { recursive: true, force: true });
});

story.tracked(
  'E6.S4',
  'the emitted vector carries greppable ELICIT: markers at exactly the silent organs, each with a bisecting elicitation script',
  async () => {
    const probe = await probePipeline();
    expect(probe.found, probeMessage(probe)).not.toEqual([]);
    // Documented, once the pipeline lands:
    const vectorFile = join(cwd, 'agents', 'reviewer.ts');
    expect(existsSync(vectorFile)).toBe(true);
    const src = readFileSync(vectorFile, 'utf8');
    // The literal marker, machine-greppable, at exactly the silent organs.
    for (const organ of SILENT_ORGANS) {
      expect(src).toMatch(new RegExp(`${organ}[\\s\\S]{0,120}ELICIT:`));
    }
    expect(src.match(/ELICIT:/g) ?? []).toHaveLength(SILENT_ORGANS.length);
    // A companion elicitation script per marker: ≥2 candidates + 1 question.
    const scriptFile = join(cwd, 'agents', 'reviewer.elicit.json');
    expect(existsSync(scriptFile)).toBe(true);
    const script = JSON.parse(readFileSync(scriptFile, 'utf8')) as Record<
      string,
      { candidates?: string[]; question?: string }
    >;
    for (const organ of SILENT_ORGANS) {
      const entry = script[organ];
      expect(
        entry,
        `no elicitation entry for silent organ '${organ}'`,
      ).toBeDefined();
      expect(entry?.candidates?.length ?? 0).toBeGreaterThanOrEqual(2);
      expect(typeof entry?.question).toBe('string');
    }
  },
);

story.tracked(
  'E6.S4',
  'negative: a pipeline run that invents a concrete enum value for a silent organ fails',
  async () => {
    const probe = await probePipeline();
    expect(probe.found, probeMessage(probe)).not.toEqual([]);
    // Documented: silence becomes a question, never a guess — the vector
    // holds NO concrete enum value at any silent organ.
    const vectorFile = join(cwd, 'agents', 'reviewer.ts');
    expect(existsSync(vectorFile)).toBe(true);
    const src = readFileSync(vectorFile, 'utf8');
    for (const organ of SILENT_ORGANS) {
      // A concrete value would appear as `organ: { organ: '<organ>', slug: …`;
      // the only admissible forms are null-with-marker or the sidecar list.
      expect(src).not.toMatch(
        new RegExp(`organ:\\s*'${organ}'[\\s\\S]{0,80}slug:`),
      );
    }
  },
);
