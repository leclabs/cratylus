// The model check, driven through the built command over a scratch repository whose
// domain model and tests each case writes. Every case also runs the check over the
// same repository with its one defect mended (or introduced), so a check that passes,
// fails or warns regardless of the model cannot satisfy it.
//
// The scratch tests are composed from parts (`${call}(…)`), never written out: the
// model check over this repository would otherwise read them as acceptance tests.

import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, expect, it } from 'vitest';

const bin = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../dist/cratylus.js',
);

interface Failure {
  concept: string;
  example?: string;
  test?: string;
  message: string;
}
interface Warning {
  concept: string;
  words: string;
  rule: string;
  message: string;
}
interface Report {
  model: string;
  passed: boolean;
  failures: Failure[];
  warnings: Warning[];
}
interface Example {
  name: string;
  judged?: boolean;
}

let root: string;
const env = {
  ...process.env,
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_TERMINAL_PROMPT: '0',
};

beforeEach(() => {
  expect(existsSync(bin), `${bin} is built`).toBe(true);
  root = realpathSync(mkdtempSync(join(tmpdir(), 'model-check-')));
  const init = spawnSync('git', ['init', '--quiet'], {
    cwd: root,
    env,
    encoding: 'utf8',
  });
  expect(init.status, init.stderr).toBe(0);
  context('shop', 'what a shopper buys and pays for');
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

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

/** A concept record: its term, its correction and its examples, each with a
 *  Given, a When and a Then. */
function concept(
  path: string,
  term: string,
  correction: string,
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
      `# ${term}\n\n${correction}\n`,
      ...(sections.length ? ['## Examples\n', ...sections] : []),
    ].join('\n'),
  );
}

/** A test file whose acceptance tests carry `titles`; returns the line of each. */
function acceptanceTests(path: string, titles: string[]) {
  const call = 'it';
  const lines = [
    "import { it } from 'vitest';",
    '',
    ...titles.map((title) => `${call}('${title}', () => {});`),
  ];
  put(path, `${lines.join('\n')}\n`);
  return Object.fromEntries(
    titles.map((title, i) => [title, `${path}:${i + 3}`]),
  );
}

/** `cratylus model check` at the repository's root: its exit code and report. */
function check(): { code: number | null; report: Report } {
  const r = spawnSync(process.execPath, [bin, 'model', 'check'], {
    cwd: root,
    env,
    encoding: 'utf8',
    timeout: 60_000,
  });
  if (r.error) throw r.error;
  let report: Report | undefined;
  try {
    report = JSON.parse(r.stdout) as Report;
  } catch {
    /* asserted below, with what the command said instead */
  }
  expect(
    report,
    `cratylus model check printed no report (exit ${r.status})\nstdout: ${r.stdout}\nstderr: ${r.stderr}`,
  ).toBeDefined();
  const given = report as Report;
  expect(realpathSync(given.model)).toBe(join(root, 'design/model'));
  expect(given.passed).toBe(given.failures.length === 0);
  expect(r.status, 'exit 0 exactly when nothing fails').toBe(
    given.passed ? 0 : 1,
  );
  return { code: r.status, report: given };
}

it('delivery/model-check: an example with no acceptance test fails', () => {
  concept('shop/basket', 'basket', 'The goods a shopper has chosen to buy', [
    { name: 'adds an item' },
    { name: 'removes an item' },
  ]);
  acceptanceTests('test/basket.test.ts', ['shop/basket: adds an item']);

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

  // Mended: once a test names it, the same model passes.
  acceptanceTests('test/basket.test.ts', [
    'shop/basket: adds an item',
    'shop/basket: removes an item',
  ]);
  const bound = check();
  expect(bound.code).toBe(0);
  expect(bound.report.failures).toEqual([]);
});

it('delivery/model-check: a test naming a missing example fails', () => {
  concept('shop/basket', 'basket', 'The goods a shopper has chosen to buy', [
    { name: 'adds an item' },
  ]);
  const at = acceptanceTests('test/basket.test.ts', [
    'shop/basket: adds an item',
    'shop/basket: empties the basket',
    'shop/till: takes payment',
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
        test: at['shop/basket: empties the basket'],
        message: expect.any(String),
      }),
      expect.objectContaining({
        concept: 'shop/till',
        example: 'takes payment',
        test: at['shop/till: takes payment'],
        message: expect.any(String),
      }),
    ]),
  );

  // Mended: the tests naming what the model has pass.
  acceptanceTests('test/basket.test.ts', ['shop/basket: adds an item']);
  const named = check();
  expect(named.code).toBe(0);
  expect(named.report.failures).toEqual([]);
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

it('delivery/model-check: history in a record is warned of', () => {
  concept(
    'shop/basket',
    'basket',
    "The goods a shopper has chosen to buy; it used to mean the shopper's whole order and no longer holds the address",
    [{ name: 'adds an item' }],
  );
  concept('shop/till', 'till', 'Where a shopper pays for a basket', [
    { name: 'takes payment' },
  ]);
  acceptanceTests('test/shop.test.ts', [
    'shop/basket: adds an item',
    'shop/till: takes payment',
  ]);

  const { code, report } = check();
  expect(code, 'history is warned of, never failed').toBe(0);
  expect(report.passed).toBe(true);
  expect(report.failures).toEqual([]);
  const basket = report.warnings.filter((w) => w.concept === 'shop/basket');
  expect(basket.map((w) => w.words.toLowerCase())).toEqual(
    expect.arrayContaining(['used to mean', 'no longer']),
  );
  for (const w of basket) {
    expect(w.rule).toEqual(expect.any(String));
    expect(w.message).toEqual(expect.any(String));
  }
  expect(
    report.warnings.filter((w) => w.concept === 'shop/till'),
    'a record recounting no history is not warned of',
  ).toEqual([]);
});
