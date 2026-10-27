// THE PRACTICE SKILLS — each practice the agents work by, as a skill holding its
// bounded context's concepts exactly as cratylus's domain model records them.
//
// Nothing here states a concept. `tooling/practices.ts` reads each practice's records
// from `design/model/<context>/` at build and writes `generated/practices.json`, a
// sibling of `src/` and `dist/`, so this module finds it the same way from either.
// A practice skill is named for its context, and its formal block is the context's
// name and subject, then one `<term> ≜ <correction>` line per concept.

import { readFileSync } from 'node:fs';
import type { Skill } from './manifest.js';

interface PracticeRecords {
  readonly name: string;
  readonly subject: string;
  readonly concepts: readonly {
    readonly term: string;
    readonly correction: string;
  }[];
}

const RENDERED = new URL('../generated/practices.json', import.meta.url);

const RECORDS = JSON.parse(readFileSync(RENDERED, 'utf8')) as Readonly<
  Record<string, PracticeRecords>
>;

/** The practices rendered as skills, each by its context's directory name. */
export const PRACTICES: readonly string[] = Object.keys(RECORDS);

/** The skill of the practice `context`, with its hand-written selection line. */
export function practiceSkill(context: string, description: string): Skill {
  const records = RECORDS[context];
  if (records === undefined)
    throw new Error(
      `no practice ${context} in ${RENDERED.pathname}: build @cratylus/canon to render it`,
    );
  return {
    name: context,
    description,
    formalBlock: [
      `${records.name} ≜ ${records.subject}`,
      '',
      ...records.concepts.map((c) => `${c.term} ≜ ${c.correction}`),
    ].join('\n'),
    composition: () => [],
  };
}
