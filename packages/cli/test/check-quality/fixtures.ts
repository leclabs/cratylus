import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { ProofRecordings } from '@cratylus/runtime';

export function exampleWords(file: string, number: number): string {
  const lines = readFileSync(file, 'utf8').split('\n');
  const start = lines.findIndex((line) => line.startsWith(`${number}. `));
  if (start < 0) throw new Error(`Missing example ${number}: ${file}`);
  const next = lines
    .slice(start + 1)
    .findIndex((line) => /^\d+\. |^#/.test(line));
  return lines
    .slice(start, next < 0 ? undefined : start + 1 + next)
    .join('\n')
    .trim();
}

export function proofRecordings<
  R extends { name: string; target?: string | string[] },
>(
  directory: string,
  parse: (raw: unknown) => R,
  excluded: readonly string[] = [],
): ProofRecordings<R> {
  const read = (kind: string) =>
    readdirSync(join(directory, kind))
      .filter((file) => /\.(?:json|recording)$/.test(file))
      .sort()
      .map((file) => ({
        file,
        recording: parse(
          JSON.parse(readFileSync(join(directory, kind, file), 'utf8')),
        ),
      }));
  const golden = read('golden').map(({ file, recording }) => ({
    name: file,
    recording,
  }));
  const negatives = read('negative');
  // Every excluded multi-target case must be named at its declaration. A new
  // array target cannot quietly disappear from the sweep.
  const actualExcluded = negatives
    .filter(({ recording }) => Array.isArray(recording.target))
    .map(({ file }) => file);
  if (
    JSON.stringify(actualExcluded.sort()) !==
    JSON.stringify([...excluded].sort())
  ) {
    throw new Error(
      `Unreported multi-target recordings: ${actualExcluded.join(', ')}`,
    );
  }
  const negative = negatives
    .filter(({ file }) => !excluded.includes(file))
    .map(({ file, recording }) => {
      if (typeof recording.target !== 'string')
        throw new Error(`Missing single target: ${file}`);
      return { name: file, recording, breaks: recording.target };
    });
  return { golden, negative };
}
