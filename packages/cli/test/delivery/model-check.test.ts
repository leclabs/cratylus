// The model check, driven through the built command over a scratch repository whose
// domain model and tests each case writes. Every case also runs the check over the
// same repository with its one defect mended (or introduced), so a check that always
// passes or always fails regardless of the model cannot satisfy it.
//
// Fixture titles are composed from parts so the repository's own model check
// binds only the acceptance tests declared here.

import { mkdirSync, realpathSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { type Host, host } from '../capability-port/fixture.js';

interface Failure {
  concept: string;
  example?: string;
  test?: string;
  tests?: string[];
  message: string;
}
interface Report {
  model: string;
  passed: boolean;
  failures: Failure[];
}
interface Example {
  name: string;
  judged?: boolean;
}

let h: Host;
let root: string;

const adds = `shop/basket: ${'adds an item'}`;
const removes = `shop/basket: ${'removes an item'}`;
const empties = `shop/basket: ${'empties the basket'}`;
const takesPayment = `shop/till: ${'takes payment'}`;

beforeEach(() => {
  h = host();
  root = realpathSync(h.cwd);
  context('shop', 'what a shopper buys and pays for');
});
afterEach(() => h?.dispose());

function put(path: string, text: string) {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), text);
}

function context(name: string, subject: string) {
  put(
    `design/model/${name}/context.md`,
    `# ${name}\n\n**Subject:** ${subject}\n\n**Relation:** stands alone\n`,
  );
}

/** A concept record: its Cratylic name, its precising definition and its examples,
 *  each with a Given, a When and a Then. */
function concept(
  path: string,
  term: string,
  definition: string,
  examples: Example[],
) {
  const sections = examples.map((e) =>
    [
      `### ${e.name}${e.judged ? ' (judged in review)' : ''}`,
      '',
      'Given a shopper with a basket',
      'When the shopper acts on it',
      'Then the basket shows the result',
      '',
    ].join('\n'),
  );
  put(
    `design/model/${path}.md`,
    [
      `# ${term}\n\n${definition}\n`,
      ...(sections.length ? ['## Examples\n', ...sections] : []),
    ].join('\n'),
  );
}

/** A test call titled `title`, composed from parts. */
function titled(title: string) {
  const call = 'it';
  return `${call}('${title}', () => {});`;
}

/** A test file of `lines`, after its import (line 1) and a blank line (line 2). */
function testFile(path: string, lines: string[]) {
  put(path, `${["import { it } from 'vitest';", '', ...lines].join('\n')}\n`);
}

/** A test file whose acceptance tests carry `titles`; returns the line of each. */
function acceptanceTests(path: string, titles: string[]) {
  testFile(path, titles.map(titled));
  return Object.fromEntries(
    titles.map((title, i) => [title, `${path}:${i + 3}`]),
  );
}

/** `cratylus model check` at the repository's root: its exit code and report. */
function check(): { code: number | null; report: Report } {
  const r = h.command(['model', 'check']);
  let report: Report | undefined;
  try {
    report = JSON.parse(r.stdout) as Report;
  } catch {
    /* asserted below, with what the command said instead */
  }
  expect(
    report,
    `cratylus model check printed no report (exit ${r.code})\nstdout: ${r.stdout}\nstderr: ${r.stderr}`,
  ).toBeDefined();
  const given = report as Report;
  expect(Object.keys(given).sort()).toEqual(['failures', 'model', 'passed']);
  expect(realpathSync(given.model)).toBe(join(root, 'design/model'));
  expect(given.passed).toBe(given.failures.length === 0);
  expect(r.code, 'exit 0 exactly when nothing fails').toBe(
    given.passed ? 0 : 1,
  );
  return { code: r.code, report: given };
}

it('delivery/model-check: an example with no acceptance test fails', () => {
  concept('shop/basket', 'basket', 'The goods a shopper has chosen to buy', [
    { name: 'adds an item' },
    { name: 'removes an item' },
  ]);
  acceptanceTests('test/basket.test.ts', [adds]);

  const unbound = check();
  expect(unbound.code).toBe(1);
  expect(unbound.report.passed).toBe(false);
  expect(unbound.report.failures).toEqual([
    expect.objectContaining({
      concept: 'shop/basket',
      example: 'removes an item',
      message: expect.any(String),
    }),
  ]);

  // Nor does a title only in a comment name it, nor one that only starts with
  // its name or differs from it in case.
  for (const unnamed of [
    `// ${titled(removes)}`,
    `/* ${titled(removes)} */`,
    `/*\n${titled(removes)}\n*/`,
    titled(`${removes} twice`),
    titled(`shop/basket: ${'Removes an item'}`),
  ]) {
    testFile('test/basket.test.ts', [titled(adds), unnamed]);
    const still = check();
    expect(still.code, unnamed).toBe(1);
    expect(
      still.report.failures.filter((f) => f.test === undefined),
      unnamed,
    ).toEqual([
      expect.objectContaining({
        concept: 'shop/basket',
        example: 'removes an item',
      }),
    ]);
  }

  // Mended: once a test names it, the same model passes.
  acceptanceTests('test/basket.test.ts', [adds, removes]);
  const bound = check();
  expect(bound.code).toBe(0);
  expect(bound.report.failures).toEqual([]);
});

it('delivery/model-check: a test naming a missing example fails', () => {
  concept('shop/basket', 'basket', 'The goods a shopper has chosen to buy', [
    { name: 'adds an item' },
  ]);
  const at = acceptanceTests('test/basket.test.ts', [
    adds,
    empties,
    takesPayment,
  ]);

  const missing = check();
  expect(missing.code).toBe(1);
  expect(missing.report.passed).toBe(false);
  expect(missing.report.failures).toHaveLength(2);
  expect(missing.report.failures).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        concept: 'shop/basket',
        example: 'empties the basket',
        test: at[empties],
        message: expect.any(String),
      }),
      expect.objectContaining({
        concept: 'shop/till',
        example: 'takes payment',
        test: at[takesPayment],
        message: expect.any(String),
      }),
    ]),
  );

  // A title only in a comment names nothing, so nothing missing.
  for (const commented of [
    `// ${titled(empties)}`,
    `/* ${titled(empties)} */`,
  ]) {
    testFile('test/basket.test.ts', [titled(adds), commented]);
    const quiet = check();
    expect(quiet.code, commented).toBe(0);
    expect(quiet.report.failures, commented).toEqual([]);
  }

  // The example's name under another concept, or a title that only starts with
  // it or differs from it in case, names an example the model lacks and leaves
  // shop/basket's unbound.
  for (const [title, named, example] of [
    [`shop/till: ${'adds an item'}`, 'shop/till', 'adds an item'],
    [`${adds} twice`, 'shop/basket', 'adds an item twice'],
    [`shop/basket: ${'Adds an item'}`, 'shop/basket', 'Adds an item'],
  ] as const) {
    testFile('test/basket.test.ts', [titled(title)]);
    const wrong = check();
    expect(wrong.code, title).toBe(1);
    expect(wrong.report.failures, title).toHaveLength(2);
    expect(wrong.report.failures, title).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          concept: 'shop/basket',
          example: 'adds an item',
        }),
        expect.objectContaining({
          concept: named,
          example,
          test: 'test/basket.test.ts:3',
        }),
      ]),
    );
    expect(
      wrong.report.failures.filter((f) => f.test === undefined),
      `${title} binds nothing`,
    ).toEqual([
      expect.objectContaining({
        concept: 'shop/basket',
        example: 'adds an item',
      }),
    ]);
  }

  // Mended: the tests naming what the model has pass.
  acceptanceTests('test/basket.test.ts', [adds]);
  const named = check();
  expect(named.code).toBe(0);
  expect(named.report.failures).toEqual([]);
});

it('delivery/model-check: an example two tests name fails', () => {
  concept('shop/basket', 'basket', 'The goods a shopper has chosen to buy', [
    { name: 'adds an item' },
    { name: 'removes an item' },
  ]);
  const first = acceptanceTests('test/basket.test.ts', [adds, removes]);
  const second = acceptanceTests('test/basket-again.test.ts', [adds]);

  const twice = check();
  expect(twice.code).toBe(1);
  expect(twice.report.passed).toBe(false);
  expect(twice.report.failures).toEqual([
    expect.objectContaining({
      concept: 'shop/basket',
      example: 'adds an item',
      message: expect.any(String),
    }),
  ]);
  expect([...(twice.report.failures[0]!.tests ?? [])].sort()).toEqual(
    [first[adds], second[adds]].sort(),
  );

  // Two tests in one file name it as surely as two in two files.
  testFile('test/basket.test.ts', [
    titled(adds),
    titled(removes),
    titled(adds),
  ]);
  testFile('test/basket-again.test.ts', []);
  const inOneFile = check();
  expect(inOneFile.code).toBe(1);
  expect(inOneFile.report.failures).toEqual([
    expect.objectContaining({
      concept: 'shop/basket',
      example: 'adds an item',
      tests: ['test/basket.test.ts:3', 'test/basket.test.ts:5'],
    }),
  ]);

  // Mended: once one test names it, the same model passes.
  acceptanceTests('test/basket.test.ts', [adds, removes]);
  const once = check();
  expect(once.code).toBe(0);
  expect(once.report.failures).toEqual([]);
});

it('delivery/model-check: an example judged in review needs no test', () => {
  concept(
    'shop/returns',
    'return',
    'Goods a shopper brings back for a refund',
    [{ name: 'refunds a return', judged: true }],
  );

  const judged = check();
  expect(judged.code).toBe(0);
  expect(judged.report.passed).toBe(true);
  expect(judged.report.failures).toEqual([]);

  // The marker is what spares it: unmarked, the same example fails for want of a test.
  concept(
    'shop/returns',
    'return',
    'Goods a shopper brings back for a refund',
    [{ name: 'refunds a return' }],
  );
  const unmarked = check();
  expect(unmarked.code).toBe(1);
  expect(unmarked.report.failures).toEqual([
    expect.objectContaining({
      concept: 'shop/returns',
      example: 'refunds a return',
    }),
  ]);
});

it('delivery/model-check: binds tests in any language, and only tests', () => {
  const name = 'adds an item';
  const title = `shop/basket: ${name}`;
  concept('shop/basket', 'basket', 'The goods a shopper has chosen to buy', [
    { name },
  ]);

  const quoted = `\`\`\`ts\n${titled(title)}\n\`\`\`\n`;
  const subTest = `${'self.subTest'}("${title}")`;
  put('CHANGELOG.md', `# Changelog\n\n${quoted}`);
  put('docs/basket-spec.md', `# Basket specification\n\n${quoted}`);
  put('test/test_notes.py', `# with ${subTest}:\n`);

  // Each fixture is the sole test naming the example when the check runs.
  for (const [path, source] of [
    [
      'test/test_basket.py',
      `import unittest

class BasketTest(unittest.TestCase):
    def test_basket(self):
        with ${subTest}:
            pass
`,
    ],
    [
      'test/test_basket_wrapper.py',
      `def check_basket(title):
    basket = []
    basket.append("apple")
    assert basket == ["apple"], title


def test_basket():
    ${'check_basket'}("${title}")
`,
    ],
    [
      'test/basket_test.rs',
      `#[test]
fn adds_an_item() {
    let title = "${title}";
    let mut basket = Vec::new();
    basket.push("apple");
    assert_eq!(basket, vec!["apple"], "{}", title);
}
`,
    ],
    [
      'test/basket_test.go',
      `package basket

import "testing"

func TestBasket(t *testing.T) {
    ${'t.Run'}("${title}", func(t *testing.T) {})
}
`,
    ],
    [
      'test/basket_spec.rb',
      `RSpec.describe "Basket" do
  ${'it'} "${title}" do
  end
end
`,
    ],
    [
      'test/basket.feature',
      `Feature: Basket
  ${'Scenario'}: ${title}
    Given an empty basket
    When a shopper adds an item
    Then the basket contains the item
`,
    ],
  ] as const) {
    put(path, source);
    const bound = check();
    expect(bound.report.failures, path).toEqual([]);
    expect(bound.code, path).toBe(0);
    unlinkSync(join(root, path));
  }

  const unbound = check();
  expect(unbound.code).toBe(1);
  expect(unbound.report.failures).toEqual([
    { concept: 'shop/basket', example: name, message: expect.any(String) },
  ]);
});
