// What the model check reads as a test, in any language and test framework, by
// the rule of design/decisions/acceptance-tests-name-their-examples.md: which
// files are test files, and which whole string literals in one, or scenario
// lines of a feature file, are candidate titles.

import { lex } from './comments.js';

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

/** The candidate titles in the test file `name` holding `text`, by line: each
 *  whole string literal outside comments, or each scenario of a feature file. */
export function testTitles(name: string, text: string): TestTitle[] {
  const extension = extensionOf(name);
  if (extension === 'feature') return scenarios(text);
  let line = 1;
  let at = 0;
  return lex(text, extension).literals.map(({ index, text: title }) => {
    for (; at < index; at++) if (text.charCodeAt(at) === 10) line++;
    return { line, title };
  });
}
