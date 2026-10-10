import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { type Scenario, aggregate, failures, parseRecording } from './check.js';

export function offline(scenario: Scenario, directory: string) {
  const records = ['golden', 'negative'].flatMap((kind) =>
    readdirSync(join(directory, kind)).map((file) => ({
      kind,
      file,
      record: parseRecording(
        JSON.parse(readFileSync(join(directory, kind, file), 'utf8')),
      ),
    })),
  );
  describe(`${scenario.name}: offline proof`, () => {
    for (const { kind, file, record } of records)
      it(`${kind}/${file}`, () => {
        expect(failures(scenario.assess(record))).toEqual(
          kind === 'golden' ? [] : [record.target],
        );
        for (const event of record.events)
          if (event.kind === 'tool')
            expect(scenario.tools).toContain(event.name);
      });
    it('has an independent negative for every assertion, and all never assertions require five of five', () => {
      const good = scenario.assess(
        records.find((r) => r.kind === 'golden')!.record,
      );
      expect(
        records
          .filter((r) => r.kind === 'negative')
          .map((r) => r.record.target),
      ).toEqual(expect.arrayContaining(Object.keys(good)));
      for (const key of Object.keys(good)) {
        const bad = { ...good, [key]: false };
        expect(aggregate([good, good, good, good, bad])[key]).toBe(
          !key.startsWith('never-'),
        );
        expect(aggregate([good, good, good, bad, bad])[key]).toBe(false);
      }
      expect(() => aggregate([good])).toThrow('Exactly five');
    });
  });
}
