// What the model check reads as a test, in any language and test framework, by
// the rule of design/decisions/acceptance-tests-name-their-examples.md: which
// files are test files, and which titled declarations in one are tests.

import { uncommented } from './comments.js';

/** The extension of the file `name`, lowercase and without its dot; none for a
 *  name without one. */
function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot < 0 ? '' : name.slice(dot + 1).toLowerCase();
}

/** Extensions of prose, which is never a test file. */
const PROSE = new Set(['md', 'markdown', 'mdx', 'txt', 'rst', 'adoc']);

/** The words of a file name that mark it a test file. */
const TEST_WORDS = new Set(['test', 'tests', 'spec', 'specs']);

/** Where a file name splits into words: at `.`, `_`, `-`, and at a lower-to-upper
 *  case change. */
const WORD_BOUNDARY = /[._-]|(?<=\p{Ll})(?=\p{Lu})/u;

/** Whether the file `name` is a test file: a Gherkin feature file, or a file
 *  none of prose whose name holds one of the test words. */
export function isTestFile(name: string): boolean {
  const extension = extensionOf(name);
  if (extension === 'feature') return true;
  if (PROSE.has(extension)) return false;
  return name
    .split(WORD_BOUNDARY)
    .some((word) => TEST_WORDS.has(word.toLowerCase()));
}

/** The names a test declaration is called by, compared in lowercase and without `_`. */
const DECLARERS = new Set([
  'it',
  'test',
  'specify',
  'example',
  'scenario',
  'run',
  'subtest',
  'testing',
  'testset',
  'testthat',
  'testcase',
  'testmethod',
  'displayname',
  'testdox',
]);

/** A title as one whole string literal, in `'…'`, `"…"` or a backtick literal
 *  with no `${`: three groups, of which the one that matched holds the text. */
const LITERAL = String.raw`(?:'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|\x60((?:[^\x60\\$]|\\.|\$(?!\{))*)\x60)`;

/** A call, `name(…` or `@name(…`, its first argument a literal ending it. */
const CALL = new RegExp(
  String.raw`(?<![\w$])@?([\w$]+)\s*\(\s*${LITERAL}(?=\s*[,)])`,
  'g',
);

/** A command, `name "…"`, its literal not joined to another by an operator. */
const COMMAND = new RegExp(
  String.raw`(?<![\w$])@?([\w$]+)[ \t]+${LITERAL}`,
  'g',
);

/** A named argument, `DisplayName = "…"` or `TestName = "…"`. */
const ARGUMENT = new RegExp(
  String.raw`(?<![\w$])(DisplayName|TestName)\s*=\s*${LITERAL}`,
  'g',
);

/** What follows a literal that joins it to another: a concatenation or
 *  formatting operator, a second literal beside it, or a word on it. */
const JOINED = /^(?:[ \t]*(?:[+.^&*%/\\]|-(?!>)|<>|['"`])|[\w$])/;

/** The scenario lines of a Gherkin feature file. */
const SCENARIO =
  /^(?:Scenario Outline|Scenario Template|Scenario|Example):\s*(.*)$/;

/** One test: the line of the file it is on, 1-based, and its title. */
export interface TestTitle {
  readonly line: number;
  readonly title: string;
}

/** The scenarios of the feature file `text`, outside `#` comment lines and
 *  doc strings. */
function scenarios(text: string): TestTitle[] {
  const found: TestTitle[] = [];
  let docString: string | null = null;
  text.split('\n').forEach((raw, k) => {
    const line = raw.trim();
    if (docString !== null) {
      if (line.startsWith(docString)) docString = null;
      return;
    }
    if (line.startsWith('"""') || line.startsWith('```')) {
      docString = line.slice(0, 3);
      return;
    }
    if (line.startsWith('#')) return;
    const scenario = SCENARIO.exec(line);
    if (scenario !== null) {
      found.push({ line: k + 1, title: (scenario[1] as string).trim() });
    }
  });
  return found;
}

/** The test declarations in `text`, comments already blanked, by position. */
function declarations(text: string): TestTitle[] {
  const found: { index: number; title: string }[] = [];
  const read = (
    pattern: RegExp,
    declares: (match: RegExpMatchArray) => boolean,
    joinable: boolean,
  ) => {
    for (const match of text.matchAll(pattern)) {
      if (!declares(match)) continue;
      const end = (match.index as number) + match[0].length;
      if (joinable && JOINED.test(text.slice(end, end + 64))) continue;
      const quoted = match[2] ?? match[3] ?? match[4] ?? '';
      found.push({
        index: match.index as number,
        title: quoted.replace(/\\(.)/gs, '$1'),
      });
    }
  };
  const declarer = (match: RegExpMatchArray) =>
    DECLARERS.has((match[1] as string).toLowerCase().replaceAll('_', ''));
  read(CALL, declarer, false);
  read(COMMAND, declarer, true);
  read(ARGUMENT, () => true, true);
  return found
    .sort((a, b) => a.index - b.index)
    .map(({ index, title }) => ({
      line: text.slice(0, index).split('\n').length,
      title,
    }));
}

/** The tests in the test file `name` holding `text`: each title it gives, by
 *  line. */
export function testTitles(name: string, text: string): TestTitle[] {
  const extension = extensionOf(name);
  return extension === 'feature'
    ? scenarios(text)
    : declarations(uncommented(text, extension));
}
