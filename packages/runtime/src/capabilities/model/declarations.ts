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

/** The quoted literals a title is: `'…'` and `"…"`, in groups 2 and 3. */
const QUOTED = String.raw`'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"`;

/** A backtick literal with no `${`, escapes in it, as group 4. */
const ESCAPED_BACKTICKS = String.raw`\x60((?:[^\x60\\$]|\\.|\$(?!\{))*)\x60`;

/** A backtick literal with no escape, as group 4. */
const RAW_BACKTICKS = String.raw`\x60([^\x60]*)\x60`;

/** The expressions finding the three forms of test declaration, for a language
 *  whose backtick literal is as `backticks` says. A title is one whole string
 *  literal; the callee is group 1 of a call or a command. */
function patternsFor(backticks: string) {
  const literal = `(?:${QUOTED}|${backticks})`;
  return {
    /** A call, `name(…` or `@name(…`, its first argument a literal ending it. */
    call: new RegExp(
      String.raw`(?<![\w$])@?([\w$]+)\s*\(\s*${literal}(?=\s*[,)])`,
      'g',
    ),
    /** A command, `name "…"`. */
    command: new RegExp(String.raw`(?<![\w$])@?([\w$]+)[ \t]+${literal}`, 'g'),
    /** A named argument, `DisplayName = "…"` or `TestName = "…"`, after `(` or `,`. */
    argument: new RegExp(
      String.raw`(?<=[(,]\s*)(DisplayName|TestName)\s*=\s*${literal}`,
      'g',
    ),
  };
}

const ESCAPING = patternsFor(ESCAPED_BACKTICKS);
const RAW = patternsFor(RAW_BACKTICKS);

/** Extensions of the languages whose backtick literal is raw, escapes and `${`
 *  being text. */
const RAW_BACKTICKS_IN = new Set(['go']);

/** What follows a literal that joins it to another: a concatenation or
 *  formatting operator after any run of spaces, a second literal beside it, or
 *  a word on it. */
const JOINED = /(?:[ \t]*(?:[+.^&*%/\\]|-(?!>)|<>|['"`])|[\w$])/y;

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
function declarations(text: string, extension: string): TestTitle[] {
  const raw = RAW_BACKTICKS_IN.has(extension);
  const patterns = raw ? RAW : ESCAPING;
  const found: { index: number; title: string }[] = [];
  const unescaped = (quoted: string) => quoted.replace(/\\(.)/gs, '$1');
  const read = (
    pattern: RegExp,
    declares: (match: RegExpMatchArray) => boolean,
    joinable: boolean,
  ) => {
    for (const match of text.matchAll(pattern)) {
      if (!declares(match)) continue;
      JOINED.lastIndex = (match.index as number) + match[0].length;
      if (joinable && JOINED.test(text)) continue;
      const quoted = match[2] ?? match[3];
      const backticked = match[4] ?? '';
      found.push({
        index: match.index as number,
        title:
          quoted !== undefined
            ? unescaped(quoted)
            : raw
              ? backticked
              : unescaped(backticked),
      });
    }
  };
  const declarer = (match: RegExpMatchArray) =>
    DECLARERS.has((match[1] as string).toLowerCase().replaceAll('_', ''));
  read(patterns.call, declarer, false);
  read(patterns.command, declarer, true);
  read(patterns.argument, () => true, true);
  let line = 1;
  let from = 0;
  return found
    .sort((a, b) => a.index - b.index)
    .map(({ index, title }) => {
      for (
        let k = text.indexOf('\n', from);
        k >= 0 && k < index;
        k = text.indexOf('\n', from)
      ) {
        line++;
        from = k + 1;
      }
      return { line, title };
    });
}

/** The tests in the test file `name` holding `text`: each title it gives, by
 *  line. */
export function testTitles(name: string, text: string): TestTitle[] {
  const extension = extensionOf(name);
  return extension === 'feature'
    ? scenarios(text)
    : declarations(uncommented(text, extension), extension);
}
