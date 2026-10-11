import { isDeepStrictEqual } from 'node:util';
import type {
  Design,
  History,
} from '../../../../packages/cli/test/concept-journal/fixture.js';

export type View = {
  bytes: Record<string, string>;
  design: Design;
  history: History;
};
export type Attempt = {
  code: number | null;
  stdout: string;
  stderr: string;
  before: View;
  after: View;
};

export function failures(
  attempt: Attempt,
  verb: string,
  concept: string,
  cut: string,
): string[] {
  const message = (attempt.stderr || attempt.stdout).trim();
  return [
    ...(attempt.code === 1 ? [] : ['refused-before-append']),
    ...(isDeepStrictEqual(attempt.before.bytes, attempt.after.bytes)
      ? []
      : ['unchanged-journal']),
    ...(isDeepStrictEqual(attempt.before.design, attempt.after.design)
      ? []
      : ['unchanged-current-meaning']),
    ...(isDeepStrictEqual(attempt.before.history, attempt.after.history)
      ? []
      : ['unchanged-history']),
    ...(new RegExp(`^concepts ${verb}: [^\\n]+$`).test(message) &&
    [concept, cut, 'architect'].every((name) => message.includes(name))
      ? []
      : ['named-refusal']),
  ];
}
