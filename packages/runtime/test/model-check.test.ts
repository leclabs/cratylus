// The model check: how it reads a concept record and a context, how an
// acceptance test binds an example, what fails and what only warns, where it
// finds the repository, and how the command prints and exits.
//
// A fixture test source is composed from parts (`${call}(…)`), so this file never
// holds a call titled the way an acceptance test is, which the model check over
// this repository would read as a test naming an example the model lacks.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { Command } from 'commander';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CLI_BIN } from '../src/bin-name.js';
import { uncommented } from '../src/capabilities/model/comments.js';
import {
  acceptanceTests,
  checkModel,
  dispatchModel,
  repositoryRoot,
} from '../src/capabilities/model/index.js';
import { capabilityCommands } from '../src/main.js';

const call = 'it';
const other = 'test';

/** A test source with one test titled `title`, through `fn` quoted by `q`. */
const source = (title: string, fn = call, q = "'") =>
  `${fn}(${q}${title}${q}, () => {});\n`;

const BASKET = [
  '# basket',
  '',
  'What a shopper means to buy, kept until checkout',
  '',
  '## Examples',
  '',
  '### adds an item',
  '',
  'Given an empty basket',
  'When the shopper adds a book',
  'Then the basket holds the book',
  '',
].join('\n');

const CONTEXT = '# shop\n\n**Subject:** selling books\n\n**Relation:** none\n';

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'model-check-'));
  mkdirSync(join(root, '.git'));
  write('design/model/purpose.md', '# Purpose\n\nTo sell books.\n');
  write('design/model/shop/context.md', CONTEXT);
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

function write(path: string, text: string): void {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), text);
}

const check = () => checkModel(root, join(root, 'design/model'));

describe('binding examples to acceptance tests', () => {
  it('passes where every example has a test naming it', () => {
    write('design/model/shop/basket.md', BASKET);
    write('test/basket.test.ts', source('shop/basket: adds an item'));
    expect(check()).toEqual({
      model: join(root, 'design/model'),
      passed: true,
      failures: [],
      warnings: [],
    });
  });

  it('fails for an example no test names, naming the concept and the example', () => {
    write('design/model/shop/basket.md', BASKET);
    const report = check();
    expect(report.passed).toBe(false);
    expect(report.failures).toEqual([
      {
        concept: 'shop/basket',
        example: 'adds an item',
        message: expect.stringContaining('adds an item'),
      },
    ]);
  });

  it('fails for a test naming an example the model lacks, naming the test', () => {
    write('design/model/shop/basket.md', BASKET);
    write(
      'packages/a/test/basket.spec.ts',
      [
        source('shop/basket: adds an item'),
        source('shop/basket: removes an item'),
        source('shop/till: rings up', other),
        source('stock/shelf: fills', call, '"'),
      ].join(''),
    );
    const report = check();
    expect(report.passed).toBe(false);
    expect(report.failures).toEqual([
      {
        concept: 'shop/basket',
        example: 'removes an item',
        test: 'packages/a/test/basket.spec.ts:2',
        message: expect.stringContaining('no example "removes an item"'),
      },
      {
        concept: 'shop/till',
        example: 'rings up',
        test: 'packages/a/test/basket.spec.ts:3',
        message: expect.stringContaining('no concept "shop/till"'),
      },
      {
        concept: 'stock/shelf',
        example: 'fills',
        test: 'packages/a/test/basket.spec.ts:4',
        message: expect.stringContaining('no context "stock"'),
      },
    ]);
  });

  it('needs no test for an example judged in review', () => {
    write(
      'design/model/shop/basket.md',
      BASKET.replace('### adds an item', '### adds an item (judged in review)'),
    );
    expect(check()).toMatchObject({ passed: true, failures: [] });
  });

  it('binds a test to an example judged in review by its name without the marker', () => {
    write(
      'design/model/shop/basket.md',
      BASKET.replace('### adds an item', '### adds an item (judged in review)'),
    );
    write('test/basket.test.ts', source('shop/basket: adds an item'));
    expect(check()).toMatchObject({ passed: true, failures: [] });
  });
});

describe('finding acceptance tests', () => {
  const title = 'shop/basket: adds an item';

  it('reads it( and test( titled in any quote, by file and line', () => {
    write(
      'a.test.ts',
      `// one\n${source(title)}${source(title, other, '"')}${source(title, call, '`')}`,
    );
    write('b.spec.mjs', source(title));
    expect(acceptanceTests(root).map((t) => t.test)).toEqual([
      'a.test.ts:2',
      'a.test.ts:3',
      'a.test.ts:4',
      'b.spec.mjs:1',
    ]);
  });

  it('reads no skipped, todo or table test, nor one in an unsearched place', () => {
    write(
      'a.test.ts',
      [
        source(title, `${call}.skip`),
        source(title, `${call}.todo`),
        source(title, `${call}.each([])`),
        source(title, `x${call}`),
        `${call}('shop/' + 'basket: adds an item', () => {});\n`,
        `${call}(\`shop/basket: \${name}\`, () => {});\n`,
        source('plain title'),
      ].join(''),
    );
    write('node_modules/x/a.test.ts', source(title));
    write('dist/a.test.js', source(title));
    write('.hidden/a.test.ts', source(title));
    write('notes.ts', source(title));
    expect(acceptanceTests(root)).toEqual([]);
  });

  it('reads an escaped quote in a title as the quote', () => {
    write('a.test.ts', source("shop/basket: the shopper\\'s book"));
    expect(acceptanceTests(root)).toEqual([
      {
        test: 'a.test.ts:1',
        context: 'shop',
        concept: 'basket',
        example: "the shopper's book",
      },
    ]);
  });

  it('reads no test in a line or a block comment, keeping the lines after them', () => {
    write(
      'a.test.ts',
      [
        `// ${source(title)}`,
        `/* ${source(title)} */`,
        `/*\n * ${source(title)} */`,
        `const u = 'http://x'; ${source(title)}`,
      ].join(''),
    );
    expect(acceptanceTests(root).map((t) => t.test)).toEqual(['a.test.ts:5']);
  });
});

describe('blanking comments', () => {
  it('blanks a line comment and a block comment, keeping lines and columns', () => {
    const code = 'a; // b\n/* c\nd */ e;\n';
    expect(uncommented(code)).toBe('a;     \n    \n     e;\n');
    expect(uncommented('a /* b')).toBe('a'.padEnd(6));
  });

  it('keeps a comment marker in a string', () => {
    const code = `f('http://x', "/* y */", 'a\\' // b'); // c`;
    expect(uncommented(code)).toBe(
      `f('http://x', "/* y */", 'a\\' // b');     `,
    );
  });

  it('keeps a template’s text and blanks the comments in its substitutions', () => {
    const code = 'f(`a // b ${g(/* c */ `d // e ${h}`)} /* f */`); // g';
    expect(uncommented(code)).toBe(
      'f(`a // b ${g(        `d // e ${h}`)} /* f */`);     ',
    );
    expect(uncommented('`${{ a: 1 }.a} // x` // y')).toBe(
      '`${{ a: 1 }.a} // x`     ',
    );
  });

  it('keeps a regular expression whole, and a division a division', () => {
    expect(uncommented("x.replace(/\\/\\/'[/]/g, ''); // c")).toBe(
      "x.replace(/\\/\\/'[/]/g, '');     ",
    );
    const division = 'a = b / c; // d / e';
    expect(uncommented(division)).toBe('a = b / c;'.padEnd(division.length));
    expect(uncommented("return /'/.test(s); // q")).toBe(
      "return /'/.test(s);     ",
    );
  });
});

describe('malformed records and contexts', () => {
  const messages = () => check().failures.map((f) => f.message);

  it('fails a record with no term or no correction', () => {
    write('design/model/shop/a.md', 'A correction with no term\n');
    write('design/model/shop/b.md', '# b\n\n## Examples\n');
    expect(messages()).toEqual([
      'shop/a: has no # term',
      'shop/b: has no correction',
    ]);
  });

  it('fails a section other than Examples', () => {
    write('design/model/shop/basket.md', `${BASKET}\n## Notes\n\nmore\n`);
    write('test/basket.test.ts', source('shop/basket: adds an item'));
    expect(messages()).toEqual([
      'shop/basket: has a section other than ## Examples: ## Notes',
    ]);
  });

  it('fails an example missing a Given, When or Then line, and two of one name', () => {
    write(
      'design/model/shop/basket.md',
      [
        '# basket',
        'Kept until checkout',
        '## Examples',
        '### empties',
        'Given a basket',
        'And a book in it',
        'When the shopper empties it',
        '### empties (judged in review)',
        'Given a basket',
        'When it is emptied',
        'Then it is empty',
      ].join('\n'),
    );
    expect(check().failures).toEqual([
      {
        concept: 'shop/basket',
        example: 'empties',
        message: 'shop/basket: example "empties" has no Then line',
      },
      {
        concept: 'shop/basket',
        example: 'empties',
        message: 'shop/basket: has two examples named "empties"',
      },
      {
        concept: 'shop/basket',
        example: 'empties',
        message: expect.stringContaining('has no acceptance test'),
      },
    ]);
  });

  it('fails a context with no context.md, or one with no name or no subject', () => {
    write('design/model/stock/shelf.md', '# shelf\n\nWhere books wait\n');
    write('design/model/shop/context.md', '**Relation:** none\n');
    expect(check().failures).toEqual([
      { concept: 'shop/context', message: 'shop/context: has no # name' },
      {
        concept: 'shop/context',
        message: 'shop/context: has no **Subject:**',
      },
      { concept: 'stock/context', message: 'stock: has no context.md' },
    ]);
  });

  it('fails an example whose lines are not Given, then When, then Then, each going on in And', () => {
    const examples: Record<string, string[]> = {
      'in order': [
        'Given a basket',
        'And a book in it',
        'When the shopper pays',
        'And leaves',
        'Then the basket is empty',
        'And the book is sold',
      ],
      'and first': ['And a basket', 'Given a book', 'When paid', 'Then sold'],
      'when first': ['When paid', 'Given a book', 'Then sold'],
      'then before when': ['Given a book', 'Then sold', 'When paid'],
      'given again': ['Given a book', 'When paid', 'Then sold', 'Given more'],
      'a stray line': ['Given a book', 'When paid', 'But slowly', 'Then sold'],
    };
    write(
      'design/model/shop/basket.md',
      [
        '# basket',
        'Kept until checkout',
        '## Examples',
        ...Object.entries(examples).flatMap(([name, lines]) => [
          `### ${name} (judged in review)`,
          '',
          ...lines,
          '',
        ]),
      ].join('\n'),
    );
    const order = (name: string, line: string) => ({
      concept: 'shop/basket',
      example: name,
      message: `shop/basket: example "${name}" is out of order at: ${line}; its lines are Given, then When, then Then, each continued by And`,
    });
    expect(check().failures).toEqual([
      order('and first', 'And a basket'),
      order('when first', 'When paid'),
      order('then before when', 'Then sold'),
      order('given again', 'Given more'),
      {
        concept: 'shop/basket',
        example: 'a stray line',
        message:
          'shop/basket: example "a stray line" has a line that is no Given, When, Then or And: But slowly',
      },
    ]);
  });

  it('fails a record anywhere but purpose.md, a context.md or a concept’s file', () => {
    write('design/model/shop/basket.md', BASKET);
    write('test/basket.test.ts', source('shop/basket: adds an item'));
    write('design/model/notes.md', '# notes\n\nLoose\n');
    write('design/model/Purpose.MD', '# Purpose\n\nTwice\n');
    write('design/model/shop/till.MD', '# till\n\nWhere a shopper pays\n');
    write('design/model/shop/drafts/old.md', '# old\n\nGone\n');
    write('design/model/shop/drafts/deep/older.Md', '# older\n\nGone\n');
    write('design/model/shop/drafts/image.png', 'not a record');
    write('design/model/shop/cover.txt', 'not a record');
    const placed =
      'a misplaced record; a record is purpose.md, <context>/context.md or <context>/<concept>.md';
    expect(check().failures).toEqual(
      [
        'Purpose.MD',
        'notes.md',
        'shop/drafts/deep/older.Md',
        'shop/drafts/old.md',
        'shop/till.MD',
      ].map((path) => ({ concept: path, message: `${path}: ${placed}` })),
    );
  });
});

describe('warnings', () => {
  it('warns of history in a correction, naming the concept and the words, and does not fail', () => {
    write(
      'design/model/shop/basket.md',
      '# basket\n\nWhat a shopper buys; it used to mean a wish list\n',
    );
    expect(check()).toEqual({
      model: join(root, 'design/model'),
      passed: true,
      failures: [],
      warnings: [
        {
          concept: 'shop/basket',
          words: 'used to mean',
          rule: 'recounts history',
          message:
            'shop/basket: its correction recounts history: "used to mean"',
        },
      ],
    });
  });

  it('warns of leakage in a correction and an example, the context’s own words aside', () => {
    write(
      'design/model/shop/basket.md',
      [
        '# basket',
        'Kept in redis until checkout, as the shop sells books',
        '## Examples',
        '### adds an item (judged in review)',
        'Given an empty basket',
        'When addItem() is called',
        'Then the basket holds the book',
      ].join('\n'),
    );
    expect(check().warnings).toEqual([
      {
        concept: 'shop/basket',
        words: 'redis',
        rule: 'names a tool or library',
        message: 'shop/basket: its correction names a tool or library: "redis"',
      },
      {
        concept: 'shop/basket',
        words: 'addItem',
        rule: 'names a code identifier',
        message:
          'shop/basket: example "adds an item" names a code identifier: "addItem"',
      },
    ]);
  });
});

describe('where the check runs', () => {
  it('finds the root by .git, a file or a directory, from below it', () => {
    mkdirSync(join(root, 'packages/a'), { recursive: true });
    expect(repositoryRoot(join(root, 'packages/a'))).toBe(root);
    rmSync(join(root, '.git'), { recursive: true });
    writeFileSync(join(root, '.git'), 'gitdir: elsewhere\n');
    expect(repositoryRoot(join(root, 'packages/a'))).toBe(root);
  });

  it('checks the model of the repository the working directory is in', () => {
    write('design/model/shop/basket.md', BASKET);
    write('test/basket.test.ts', source('shop/basket: adds an item'));
    mkdirSync(join(root, 'packages/a'), { recursive: true });
    expect(dispatchModel(['check'], join(root, 'packages/a'))).toMatchObject({
      model: join(root, 'design/model'),
      passed: true,
    });
  });

  it('refuses where there is no domain model, and takes no argument', () => {
    rmSync(join(root, 'design'), { recursive: true });
    expect(() => dispatchModel(['check'], root)).toThrow(
      `model check: no domain model at ${join(root, 'design/model')}`,
    );
    expect(() => dispatchModel(['check', 'extra'], root)).toThrow(
      /^model check:/,
    );
    expect(() => dispatchModel(['verify'], root)).toThrow(
      /^model: unknown verb 'verify'/,
    );
  });
});

describe('the command', () => {
  async function run(
    argv: readonly string[],
  ): Promise<{ code: number | undefined; out: string; err: string }> {
    const out: string[] = [];
    const err: string[] = [];
    const capture = (into: string[]) => (s: string | Uint8Array) => {
      into.push(String(s));
      return true;
    };
    vi.spyOn(process.stdout, 'write').mockImplementation(capture(out));
    vi.spyOn(process.stderr, 'write').mockImplementation(capture(err));
    const exitCode = process.exitCode;
    const cwd = process.cwd();
    let code: number | undefined;
    try {
      process.chdir(root);
      const host = new Command(CLI_BIN).enablePositionalOptions();
      for (const command of capabilityCommands()) host.addCommand(command);
      await host.parseAsync(argv, { from: 'user' });
      code = process.exitCode as number | undefined;
    } finally {
      process.chdir(cwd);
      process.exitCode = exitCode;
      vi.restoreAllMocks();
    }
    return { code, out: out.join(''), err: err.join('') };
  }

  it('prints a passing report and exits 0', async () => {
    write('design/model/shop/basket.md', BASKET);
    write('test/basket.test.ts', source('shop/basket: adds an item'));
    const { code, out, err } = await run(['model', 'check']);
    expect({ code, err }).toEqual({ code: 0, err: '' });
    expect(out).toBe(`${JSON.stringify(check(), null, 2)}\n`);
  });

  it('prints a failing report on stdout and exits 1', async () => {
    write('design/model/shop/basket.md', BASKET);
    const { code, out, err } = await run(['model', 'check']);
    expect({ code, err }).toEqual({ code: 1, err: '' });
    expect(JSON.parse(out)).toMatchObject({ passed: false });
  });

  it('refuses on stderr with exit 1 where there is no domain model', async () => {
    rmSync(join(root, 'design'), { recursive: true });
    const { code, out, err } = await run(['model', 'check']);
    expect({ code, out }).toEqual({ code: 1, out: '' });
    expect(err).toBe(
      `${CLI_BIN} model check: no domain model at ${join(root, 'design/model')}\n`,
    );
  });

  it('explains itself as the model check, its one verb reading', async () => {
    const whole = JSON.parse((await run(['model', '--explain'])).out);
    expect(whole).toMatchObject({ name: 'model check' });
    expect(whole.verbs.map((v: { name: string }) => v.name)).toEqual(['check']);
    const verb = JSON.parse((await run(['model', 'check', '--explain'])).out);
    expect(verb).toMatchObject({ name: 'check', effect: 'reads' });
  });
});
