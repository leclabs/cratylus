// ─────────────────────────────────────────────────────────────────────────────
// THE MODEL CHECK — the domain model, plain files in `design/model`, checked
// deterministically against the acceptance tests that bind its examples.
//
// The model is one directory per bounded context, `<context>/context.md` holding
// its name and subject, and one file per concept, `<context>/<concept>.md`: its
// term as the first line's `# heading`, its correction up to any `##` section,
// and optionally `## Examples`, each example a `### name` (or `### name (judged in
// review)`) over Given lines, then When lines, then Then lines, each run going on
// in `And` lines. A concept is `<context>/<concept>`, the directory and the file
// stem. Beside them is `purpose.md`, and no other record.
//
// An acceptance test is a plain `it(`/`test(` call, outside comments, whose title
// is exactly `<context>/<concept>: <example name>`, in any test file under the
// repository, outside `node_modules`, `dist` and hidden directories.
//
// The check FAILS for a malformed record or context, a misplaced record, an
// example no acceptance test names and not judged in review, and an acceptance
// test naming an example the model does not have. It WARNS, never fails, of
// implementation leakage in a record's correction and examples and of history
// recounted in its correction.
//
// Pure: it reads files and nothing else — no network, no subprocess.
// ─────────────────────────────────────────────────────────────────────────────

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { CLI_BIN } from '../../bin-name.js';
import { CAPABILITY_SUMMARIES } from '../../capability.js';
import type { CapabilityInterface, ExplainedVerb } from '../../explanation.js';
import type { Verbs } from '../../verbs.js';
import { verbOf } from '../plan/argv.js';
import { uncommented } from './comments.js';
import { type Leak, leaks, recounts, vocabulary } from './leakage.js';

export const VERBS = {
  check: {
    concept: 'model check',
    effect: 'reads',
    purpose:
      'Check every concept record in the domain model and bind each example to the acceptance test that names it; print the failures and warnings as JSON, exiting 1 on any failure',
    when: 'In the project’s one check, and after changing a concept record or an acceptance test',
  },
} as const satisfies Verbs<string, ExplainedVerb>;

export type ModelVerb = keyof typeof VERBS;

export const MODEL_CHECK: CapabilityInterface = {
  name: 'model check',
  purpose: CAPABILITY_SUMMARIES.model,
  when: `Whenever the domain model or its acceptance tests change; ${CLI_BIN} model check runs in the project's one check`,
  verbs: VERBS,
};

/** Where the domain model is, relative to the repository's root. */
export const MODEL_DIR = 'design/model';

/** The marker an example's heading ends with when it is judged in review. */
const JUDGED = ' (judged in review)';

/** The steps of an example, in their order; each run of one may go on in `And` lines. */
const STEPS = ['Given', 'When', 'Then'] as const;

/** The step a line of an example opens. */
const STEP = /^(Given|When|Then|And)\b/;

/** A test file: any `.test` or `.spec` script. */
const TEST_FILE = /\.(test|spec)\.[cm]?[jt]sx?$/;

/** Directories never searched for tests. */
const UNSEARCHED = new Set(['node_modules', 'dist']);

/** A plain `it(`/`test(` call whose title is one whole string literal: the
 *  title is the quoted text, its escapes still in it. */
const TEST_CALL =
  /(?<![\w.$])(?:it|test)\(\s*(?:'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\$]|\\.|\$(?!\{))*)`)\s*[,)]/g;

/** The title an acceptance test gives: the concept and the example name. */
const ACCEPTANCE_TITLE = /^([\w.-]+)\/([\w.-]+): (.+)$/s;

/** What fails the check: a concept (or a context, as `<context>/context`), and
 *  where it applies, the example and the test. */
export interface ModelFailure {
  readonly concept: string;
  readonly example?: string;
  readonly test?: string;
  readonly message: string;
}

/** What the check warns of: the words in a concept record, and the rule they break. */
export interface ModelWarning extends Leak {
  readonly concept: string;
  readonly message: string;
}

/** What `model check` prints. */
export interface ModelReport {
  readonly model: string;
  readonly passed: boolean;
  readonly failures: readonly ModelFailure[];
  readonly warnings: readonly ModelWarning[];
}

/** One example of a concept record. */
interface Example {
  readonly name: string;
  readonly judged: boolean;
  readonly lines: string[];
}

/** One concept record, as read. */
interface ConceptRecord {
  readonly id: string;
  readonly term: string | undefined;
  readonly correction: string;
  readonly examples: Example[];
}

/** The root of the repository holding `cwd`: the nearest ancestor, itself
 *  included, holding `.git`, else `cwd`. */
export function repositoryRoot(cwd: string): string {
  for (let dir = resolve(cwd); ; dir = dirname(dir)) {
    if (existsSync(join(dir, '.git'))) return dir;
    if (dirname(dir) === dir) return resolve(cwd);
  }
}

/** The entries of `dir`, sorted by name, hidden ones left out. */
function entries(dir: string): { name: string; directory: boolean }[] {
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => !e.name.startsWith('.'))
    .map((e) => ({
      name: e.name,
      directory: e.isDirectory(),
    }))
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
}

/** The concept record `text` of `id`, and each way it is malformed. */
function readRecord(
  id: string,
  text: string,
): { record: ConceptRecord; failures: ModelFailure[] } {
  const failures: ModelFailure[] = [];
  const fail = (message: string, example?: string) =>
    failures.push(
      example === undefined
        ? { concept: id, message: `${id}: ${message}` }
        : { concept: id, example, message: `${id}: ${message}` },
    );
  let term: string | undefined;
  let state: 'start' | 'correction' | 'examples' | 'other' = 'start';
  let examplesSeen = false;
  const correction: string[] = [];
  const examples: Example[] = [];
  let example: Example | undefined;
  for (const line of text.split(/\r?\n/)) {
    const heading = /^(#{1,6})\s+(.*?)\s*$/.exec(line);
    if (heading !== null) {
      const level = (heading[1] as string).length;
      const title = heading[2] as string;
      if (level === 1 && state === 'start') {
        term = title;
        state = 'correction';
      } else if (level === 2 && title === 'Examples' && !examplesSeen) {
        examplesSeen = true;
        state = 'examples';
        example = undefined;
      } else if (level === 3 && state === 'examples') {
        const judged = title.endsWith(JUDGED);
        example = {
          name: judged ? title.slice(0, -JUDGED.length).trim() : title,
          judged,
          lines: [],
        };
        examples.push(example);
      } else {
        fail(`has a section other than ## Examples: ${line.trim()}`);
        state = 'other';
        example = undefined;
      }
      continue;
    }
    if (state === 'start') {
      if (line.trim() === '') continue;
      state = 'correction';
    }
    if (state === 'correction') correction.push(line);
    else if (
      state === 'examples' &&
      example !== undefined &&
      line.trim() !== ''
    )
      example.lines.push(line.trim());
  }
  if (term === undefined || term === '') fail('has no # term');
  const corrected = correction.join('\n').trim();
  if (corrected === '') fail('has no correction');
  const named = new Set<string>();
  for (const { name, lines } of examples) {
    if (named.has(name)) fail(`has two examples named "${name}"`, name);
    named.add(name);
    const steps = lines.map((l) => STEP.exec(l)?.[1]);
    const other = steps.indexOf(undefined);
    if (other >= 0) {
      fail(
        `example "${name}" has a line that is no Given, When, Then or And: ${lines[other]}`,
        name,
      );
      continue;
    }
    const missing = STEPS.filter((step) => !steps.includes(step));
    for (const step of missing)
      fail(`example "${name}" has no ${step} line`, name);
    if (missing.length > 0) continue;
    let at = -1;
    const astray = steps.findIndex((step) => {
      const next = STEPS.indexOf(step as (typeof STEPS)[number]);
      if (step === 'And') return at < 0;
      if (next !== at && next !== at + 1) return true;
      at = next;
      return false;
    });
    if (astray >= 0)
      fail(
        `example "${name}" is out of order at: ${lines[astray]}; its lines are Given, then When, then Then, each continued by And`,
        name,
      );
  }
  return {
    record: { id, term, correction: corrected, examples },
    failures,
  };
}

/** The name and subject of the context file `text`, and each way it is malformed. */
function readContext(
  context: string,
  text: string,
): { subject: string | undefined; failures: ModelFailure[] } {
  const id = `${context}/context`;
  const failures: ModelFailure[] = [];
  const first = text.split(/\r?\n/).find((l) => l.trim() !== '');
  if (first === undefined || !/^# \S/.test(first))
    failures.push({ concept: id, message: `${id}: has no # name` });
  const subject = /^\*\*Subject:\*\*\s*(.*)$/m.exec(text)?.[1]?.trim();
  if (subject === undefined || subject === '')
    failures.push({ concept: id, message: `${id}: has no **Subject:**` });
  return { subject, failures };
}

/** One acceptance test: where it is, and the concept and example it names. */
interface AcceptanceTest {
  readonly test: string;
  readonly context: string;
  readonly concept: string;
  readonly example: string;
}

/** The acceptance tests in the test files under `root`, by file, then line:
 *  calls in comments are none. */
export function acceptanceTests(root: string): AcceptanceTest[] {
  const found: AcceptanceTest[] = [];
  const walk = (dir: string) => {
    for (const { name, directory } of entries(dir)) {
      const path = join(dir, name);
      if (directory) {
        if (!UNSEARCHED.has(name)) walk(path);
        continue;
      }
      if (!TEST_FILE.test(name)) continue;
      const text = uncommented(readFileSync(path, 'utf8'));
      const file = relative(root, path).split(sep).join('/');
      for (const match of text.matchAll(TEST_CALL)) {
        const quoted = match[1] ?? match[2] ?? match[3] ?? '';
        const title = quoted.replace(/\\(.)/gs, '$1');
        const named = ACCEPTANCE_TITLE.exec(title);
        if (named === null) continue;
        const line = text.slice(0, match.index).split('\n').length;
        found.push({
          test: `${file}:${line}`,
          context: named[1] as string,
          concept: named[2] as string,
          example: named[3] as string,
        });
      }
    }
  };
  walk(root);
  return found;
}

/** The warnings on `record` of a context whose concepts' terms are `terms`
 *  and whose subject is `subject`, each once. */
function warningsOf(
  record: ConceptRecord,
  terms: readonly string[],
  subject: string | undefined,
): ModelWarning[] {
  const own = vocabulary(terms, subject === undefined ? [] : [subject]);
  const passages: { where: string; found: Leak[] }[] = [
    {
      where: 'its correction',
      found: [...leaks(record.correction, own), ...recounts(record.correction)],
    },
    ...record.examples.map((e) => ({
      where: `example "${e.name}"`,
      found: leaks([e.name, ...e.lines].join('\n'), own),
    })),
  ];
  const seen = new Set<string>();
  const warnings: ModelWarning[] = [];
  for (const { where, found } of passages)
    for (const { words, rule } of found) {
      const message = `${record.id}: ${where} ${rule}: "${words}"`;
      if (seen.has(message)) continue;
      seen.add(message);
      warnings.push({ concept: record.id, words, rule, message });
    }
  return warnings;
}

/** A file named as a record, whatever the case of its extension. */
const RECORD_FILE = /\.md$/i;

/** The failure of the record at `path`, in the model, placed where no record goes. */
function misplaced(path: string): ModelFailure {
  return {
    concept: path,
    message: `${path}: a misplaced record; a record is purpose.md, <context>/context.md or <context>/<concept>.md`,
  };
}

/** The records at any depth under `dir`, each as its path under `prefix`. */
function recordsIn(dir: string, prefix: string): string[] {
  return entries(dir).flatMap(({ name, directory }) =>
    directory
      ? recordsIn(join(dir, name), `${prefix}/${name}`)
      : RECORD_FILE.test(name)
        ? [`${prefix}/${name}`]
        : [],
  );
}

/** The model check of the domain model at `model`, against the acceptance
 *  tests under `root`. */
export function checkModel(root: string, model: string): ModelReport {
  const failures: ModelFailure[] = [];
  const warnings: ModelWarning[] = [];
  /** Each context's concepts, each with its examples. */
  const records = new Map<string, Map<string, readonly Example[]>>();
  for (const { name: context, directory } of entries(model)) {
    if (!directory) {
      if (RECORD_FILE.test(context) && context !== 'purpose.md')
        failures.push(misplaced(context));
      continue;
    }
    const dir = join(model, context);
    const contents = entries(dir);
    const files: typeof contents = [];
    for (const entry of contents) {
      const path = `${context}/${entry.name}`;
      if (entry.directory)
        failures.push(...recordsIn(join(dir, entry.name), path).map(misplaced));
      else if (entry.name.endsWith('.md')) files.push(entry);
      else if (RECORD_FILE.test(entry.name)) failures.push(misplaced(path));
    }
    let subject: string | undefined;
    if (files.some((f) => f.name === 'context.md')) {
      const read = readContext(
        context,
        readFileSync(join(dir, 'context.md'), 'utf8'),
      );
      subject = read.subject;
      failures.push(...read.failures);
    } else
      failures.push({
        concept: `${context}/context`,
        message: `${context}: has no context.md`,
      });
    const read = files
      .filter((f) => f.name !== 'context.md')
      .map((f) => {
        const id = `${context}/${f.name.slice(0, -'.md'.length)}`;
        return readRecord(id, readFileSync(join(dir, f.name), 'utf8'));
      });
    const terms = [
      context,
      ...read.flatMap(({ record }) =>
        record.term === undefined ? [] : [record.term],
      ),
    ];
    const concepts = new Map<string, readonly Example[]>();
    for (const { record, failures: malformed } of read) {
      failures.push(...malformed);
      warnings.push(...warningsOf(record, terms, subject));
      concepts.set(record.id.slice(context.length + 1), record.examples);
    }
    records.set(context, concepts);
  }

  const bound = new Set<Example>();
  const unknown: ModelFailure[] = [];
  for (const test of acceptanceTests(root)) {
    const concept = `${test.context}/${test.concept}`;
    const concepts = records.get(test.context);
    const examples = concepts?.get(test.concept);
    const example = examples?.find((e) => e.name === test.example);
    if (example !== undefined) {
      bound.add(example);
      continue;
    }
    const missing =
      concepts === undefined
        ? `no context "${test.context}"`
        : examples === undefined
          ? `no concept "${concept}"`
          : `no example "${test.example}" of ${concept}`;
    unknown.push({
      concept,
      example: test.example,
      test: test.test,
      message: `${test.test}: the acceptance test names an example the domain model does not have: ${missing}`,
    });
  }
  for (const [context, concepts] of records)
    for (const [concept, examples] of concepts)
      for (const example of examples)
        if (!example.judged && !bound.has(example))
          failures.push({
            concept: `${context}/${concept}`,
            example: example.name,
            message: `${context}/${concept}: example "${example.name}" has no acceptance test naming it and is not judged in review`,
          });
  failures.push(...unknown);
  return { model, passed: failures.length === 0, failures, warnings };
}

/** Route `model <verb>` from the working directory `cwd`. */
export function dispatchModel(
  argv: readonly string[],
  cwd: string = process.cwd(),
): ModelReport {
  const verb: ModelVerb = verbOf(argv, 'model', VERBS);
  const root = repositoryRoot(cwd);
  const model = join(root, MODEL_DIR);
  if (!existsSync(model) || !statSync(model).isDirectory())
    throw new Error(`model ${verb}: no domain model at ${model}`);
  return checkModel(root, model);
}
