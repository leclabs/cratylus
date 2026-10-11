import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { type Attempt, failures } from './check.js';

type Control = {
  example: number;
  verb: string;
  concept: string;
  cut: string;
  golden: Attempt;
  negative: Attempt;
};
const controls: Control[] = JSON.parse(
  readFileSync(new URL('./recordings.json', import.meta.url), 'utf8'),
);
for (const c of controls) {
  describe(`Output proof workflow/${c.example} ${c.verb}`, () => {
    it('accepts refusal and rejects an unauthorized append without changing the checker', () => {
      expect(failures(c.golden, c.verb, c.concept, c.cut)).toEqual([]);
      expect(failures(c.negative, c.verb, c.concept, c.cut)).toEqual([
        'refused-before-append',
        'unchanged-journal',
        'unchanged-current-meaning',
        'unchanged-history',
        'named-refusal',
      ]);
    });
    for (const [field, clause] of [
      ['bytes', 'unchanged-journal'],
      ['design', 'unchanged-current-meaning'],
      ['history', 'unchanged-history'],
    ] as const) {
      it(`refusal alone cannot hide a changed ${field}`, () => {
        const attempt = structuredClone(c.golden);
        Object.assign(attempt.after, { [field]: c.negative.after[field] });
        expect(failures(attempt, c.verb, c.concept, c.cut)).toEqual([clause]);
      });
    }
    it.runIf(process.env.EXECUTION_RED === '1')(
      'red demonstration: unauthorized change cannot satisfy the frozen meaning',
      () => {
        expect(failures(c.negative, c.verb, c.concept, c.cut)).toEqual([]);
      },
    );
  });
}
