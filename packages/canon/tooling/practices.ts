// THE PRACTICES, rendered from the domain model — run by `build` before `tsc`.
//
// The practices cratylus's agents work by are bounded contexts of cratylus's own
// domain model (`design/model/<context>/`). Their concepts are never restated in
// this package: this step reads each practice's records and writes
// `generated/practices.json`, which `src/practice.ts` reads when a practice skill
// loads. `generated/` is a sibling of `src/` and `dist/`, so it is found the same
// way from either, ships in the package's `files`, and is never committed.
//
// A record is read as the model check reads it: the context's name from
// `context.md`'s `# heading` and its subject from `**Subject:**`; a concept's term
// from its first `# heading` and its correction as everything after it up to the
// next heading, trimmed. Examples are not rendered.

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** The bounded contexts rendered as practice skills, each skill named for its context. */
const PRACTICES = ['cratylic-context-design', 'behaviour-driven-development'];

const model = new URL('../../../design/model/', import.meta.url);
const out = new URL('../generated/', import.meta.url);

function fail(message: string): never {
  throw new Error(`practices: ${message}`);
}

/** The `# heading` opening `text`, or a failure naming `where`. */
function heading(text: string, where: string): string {
  const first = text.split(/\r?\n/).find((l) => l.trim() !== '');
  const title = first === undefined ? undefined : /^# (.+)$/.exec(first)?.[1];
  return title?.trim() || fail(`${where} has no # heading`);
}

/** A concept's correction: the text after its term up to the next heading, trimmed. */
function correction(text: string, where: string): string {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((l) => /^# /.test(l)) + 1;
  const end = lines.findIndex((l, i) => i >= start && /^#{1,6}\s/.test(l));
  const body = lines
    .slice(start, end === -1 ? undefined : end)
    .join('\n')
    .trim();
  return body || fail(`${where} has no correction`);
}

function practice(context: string) {
  const dir = new URL(`${context}/`, model);
  const read = (file: string) => readFileSync(new URL(file, dir), 'utf8');
  const contextText = read('context.md');
  const subject = /^\*\*Subject:\*\*\s*(.*)$/m.exec(contextText)?.[1]?.trim();
  return {
    name: heading(contextText, `${context}/context.md`),
    subject: subject || fail(`${context}/context.md has no **Subject:**`),
    concepts: readdirSync(dir)
      .filter((f) => f.endsWith('.md') && f !== 'context.md')
      .sort()
      .map((f) => {
        const text = read(f);
        const where = `${context}/${f}`;
        return {
          term: heading(text, where),
          correction: correction(text, where),
        };
      }),
  };
}

mkdirSync(out, { recursive: true });
writeFileSync(
  new URL('practices.json', out),
  `${JSON.stringify(
    Object.fromEntries(PRACTICES.map((c) => [c, practice(c)])),
    null,
    2,
  )}\n`,
);
console.log(
  `practices: rendered ${PRACTICES.join(', ')} to ${fileURLToPath(out)}practices.json`,
);
