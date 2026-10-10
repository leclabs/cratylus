// Only the non-mechanical reading of example 4 calls a fixed-prompt judge.
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { checkExplanation, rubricPrompt } from './explanation.js';
import { host } from './fixture.js';
import { launch } from './omp.js';

it.runIf(process.env.CAPABILITY_PORT_RUBRIC === '1')(
  'example 4 rubric: domain names, informative descriptions, different supersession and retirement',
  () => {
    const h = host();
    try {
      const explanation = checkExplanation(h); // Missing work fails before a model.
      const output = join(
        process.env.CAPABILITY_PORT_RECORDINGS ??
          mkdtempSync(join(tmpdir(), 'capability-rubric-')),
        'rubric',
      );
      mkdirSync(output, { recursive: true });
      const record = launch(
        h,
        rubricPrompt + JSON.stringify(explanation),
        [],
        output,
      );
      const text = record.events
        .filter((e) => e.kind === 'text')
        .map((e) => e.text)
        .join('\n')
        .trim()
        .replace(/^```(?:json)?\s*|\s*```$/g, '');
      const verdict = JSON.parse(text);
      writeFileSync(
        join(output, 'assessment.json'),
        JSON.stringify({ prompt: rubricPrompt, explanation, verdict }, null, 2),
      );
      expect(Object.keys(verdict).sort()).toEqual([
        'distinctSupersedeRetire',
        'noMachineryNames',
        'nonTautologicalDescriptions',
      ]);
      for (const item of Object.values(verdict) as {
        pass: boolean;
        evidence: string;
      }[]) {
        expect(item.pass, item.evidence).toBe(true);
        expect(item.evidence.trim().length).toBeGreaterThan(0);
      }
    } finally {
      h.dispose();
    }
  },
  360_000,
);
