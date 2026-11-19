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

  describe('in any language', () => {
    const read = () => acceptanceTests(root).map((t) => t.test);

    it('reads the titled declaration of each test file, by the convention of its language', () => {
      const python = `import unittest\nwith self.${'sub'}Test("${title}"):\n    pass\n`;
      write('test_basket.py', python);
      write(
        'basket_test.go',
        `package basket\nt.${'R'}un("${title}", func(t *testing.T) {})\n`,
      );
      write(
        'basket_spec.rb',
        `describe Basket do\n  ${call} "${title}" do\n  end\nend\n`,
      );
      write(
        'BasketTest.java',
        `class BasketTest {\n  @${'Display'}Name("${title}")\n  void adds() {}\n}\n`,
      );
      write(
        'BasketTests.cs',
        `public class BasketTests {\n  [Fact(${'Display'}Name = "${title}")]\n  public void Adds() {}\n}\n`,
      );
      write(
        'basket.feature',
        `Feature: Basket\n\n  ${'Scen'}ario: ${title}\n    Given an empty basket\n`,
      );
      write(
        'BasketSpec.hs',
        `main = hspec $ do\n  ${call} "${title}" $ do\n    pure ()\n`,
      );
      write(
        'basket_test.zig',
        `const std = @import("std");\n${other} "${title}" {\n}\n`,
      );
      expect(acceptanceTests(root)).toEqual(
        [
          'BasketSpec.hs:2',
          'BasketTest.java:2',
          'BasketTests.cs:2',
          'basket.feature:3',
          'basket_spec.rb:2',
          'basket_test.go:2',
          'basket_test.zig:2',
          'test_basket.py:2',
        ].map((test) => ({
          test,
          context: 'shop',
          concept: 'basket',
          example: 'adds an item',
        })),
      );
    });

    it('reads a Gherkin scenario, outline, template and example, outside comments and doc strings', () => {
      const doc = '"'.repeat(3);
      write(
        'basket.feature',
        [
          'Feature: Basket',
          `  # ${'Scen'}ario: shop/basket: in a comment`,
          `  ${'Scen'}ario Outline: shop/basket: an outline `,
          '    Given a doc string',
          `      ${doc}`,
          `      ${'Scen'}ario: shop/basket: in a doc string`,
          `      ${doc}`,
          `  ${'Scen'}ario Template: shop/basket: a template`,
          `  ${'Ex'}ample: shop/basket: an example`,
          `  ${'Ex'}amples:`,
          '    | a |',
          `  ${'Scen'}ario: plain title`,
          '',
        ].join('\n'),
      );
      expect(acceptanceTests(root)).toEqual(
        [
          [3, 'an outline'],
          [8, 'a template'],
          [9, 'an example'],
        ].map(([line, example]) => ({
          test: `basket.feature:${line}`,
          context: 'shop',
          concept: 'basket',
          example,
        })),
      );
    });

    it('binds a prose file and a source not named a test to nothing', () => {
      for (const file of [
        'CHANGELOG.md',
        'docs/x.md',
        'test-plan.md',
        'tests.txt',
        'spec.rst',
        'basket.ts',
        'basket.py',
        'attest.ts',
        'Contest.java',
      ]) {
        write(file, source(title));
      }
      expect(read()).toEqual([]);
    });

    it('reads no title in a comment of the file’s language, a nested block comment included', () => {
      const declared = `${call}("${title}")`;
      write('test_basket.py', `# ${declared}\n${declared}\n`);
      write('basket_spec.lua', `-- ${declared}\n${declared}\n`);
      write('basket_test.clj', `; ${declared}\n${declared}\n`);
      write('basket_test.erl', `% ${declared}\n${declared}\n`);
      write(
        'BasketSpec.hs',
        `{- ${declared} {- ${declared} -} ${declared} -}\n${declared}\n`,
      );
      write(
        'basket_test.xyz',
        `# ${declared}\n// ${declared}\n/* ${declared} */\n${declared}\n`,
      );
      expect(read()).toEqual([
        'BasketSpec.hs:2',
        'basket_spec.lua:2',
        'basket_test.clj:2',
        'basket_test.erl:2',
        'basket_test.xyz:4',
        'test_basket.py:2',
      ]);
    });

    it('reads no title joined to another by an operator, in a command or a named argument', () => {
      write(
        'basket_spec.rb',
        [
          `${call} "shop/basket: adds" + " an item" do`,
          `${call} "shop/basket: adds an item" "more" do`,
          `${call} "shop/basket: adds an item".strip do`,
          '',
        ].join('\n'),
      );
      write(
        'BasketTests.cs',
        `[Fact(${'Display'}Name = "shop/basket: adds" + " an item")]\n`,
      );
      expect(read()).toEqual([]);
    });

    it('reads a title joined across any run of spaces to nothing', () => {
      write(
        'basket_spec.rb',
        `${call} "shop/basket: adds an item"${' '.repeat(100)}+ "more" do\n`,
      );
      expect(read()).toEqual([]);
    });

    it('reads a title joined to another across a line break to nothing', () => {
      write(
        'BasketTests.cs',
        `[Fact(${'Display'}Name = "${title}"\n    + " more")]\n`,
      );
      expect(read()).toEqual([]);
    });

    it('reads every declaration of a one-line file at its line', () => {
      write(
        'a.test.ts',
        `${call}("${title}"); ${other}("${title}");\n${call}("${title}")\n`,
      );
      expect(read()).toEqual(['a.test.ts:1', 'a.test.ts:1', 'a.test.ts:2']);
    });

    it('reads DisplayName = and TestName = only as a C# or F# test attribute’s named argument ending it', () => {
      const display = `${'Display'}Name = "${title}"`;
      write(
        'BasketTests.cs',
        [
          `const ${display};`,
          `const helper = 1, ${display};`,
          `Console.WriteLine(${display});`,
          `var values = new[] { String(${display}) };`,
          `[String(${display})]`,
          `[Fact(${display} != "" ? "actual" : "fallback")]`,
          `Record(0, Fact(${display}));`,
          '[Trait("a", "b"), TestCase(1,',
          `    ${'Test'}Name = "${title}")]`,
          `[Xunit.Fact${' '.repeat(201)}(${display})]`,
          `var item = items[Fact(${display})];`,
          `[Trait("group", "[smoke]"), Fact(${display})]`,
          '',
        ].join('\n'),
      );
      write('BasketTests.fs', `[<Fact(${display})>]\n`);
      write(
        'basket.test.ts',
        `let ${'Display'}Name;\nconst values = [String(${display})];\n`,
      );
      expect(read()).toEqual([
        'BasketTests.cs:9',
        'BasketTests.cs:10',
        'BasketTests.cs:12',
        'BasketTests.fs:1',
      ]);
    });

    it('reads no title in a Visual Basic apostrophe or REM comment', () => {
      const method = `<${'Test'}Method("${title}")>`;
      write(
        'BasketTests.vb',
        `' ${method}\nREM ${method}\nDim s = "it's" ' ${method}\n${method}\n`,
      );
      expect(read()).toEqual(['BasketTests.vb:4']);
    });

    it('reads no title in a Ruby =begin block or a Lua long comment of any level', () => {
      write(
        'basket_spec.rb',
        `=begin\n=endpoint\n${call} "${title}" do\n=end\n`,
      );
      write('basket_spec.lua', `--[==[\n${call}("${title}")\n]]\n]==]\n`);
      write('other_spec.lua', `--[=[ ]] ${call}("${title}") ]=]\n`);
      expect(read()).toEqual([]);
      write('again_spec.rb', `=begin\nnote\n=end\n${call} "${title}" do\n`);
      write('again_spec.lua', `--[=[ a ]=] ${call}("${title}")\n`);
      expect(read()).toEqual(['again_spec.lua:1', 'again_spec.rb:4']);
    });

    it('keeps the backslashes of a Go raw string title', () => {
      write(
        'basket_test.go',
        [
          `${'t.R'}un(\`shop/basket: matches \\d\`, func(t *testing.T) {})`,
          `${'t.R'}un(\`shop/basket: ends with \\\`, func(t *testing.T) {})`,
          `${'t.R'}un(\`shop/basket: \${x}\`, func(t *testing.T) {})`,
          '',
        ].join('\n'),
      );
      expect(acceptanceTests(root).map((t) => [t.test, t.example])).toEqual([
        ['basket_test.go:1', 'matches \\d'],
        ['basket_test.go:2', 'ends with \\'],
      ]);
    });
  });
});

describe('blanking comments', () => {
  it('blanks a line comment and a block comment, keeping lines and columns', () => {
    const code = 'a; // b\n/* c\nd */ e;\n';
    expect(uncommented(code, 'ts')).toBe('a;     \n    \n     e;\n');
    expect(uncommented('a /* b', 'ts')).toBe('a'.padEnd(6));
  });

  it('keeps a comment marker in a string', () => {
    const code = `f('http://x', "/* y */", 'a\\' // b'); // c`;
    expect(uncommented(code, 'ts')).toBe(
      `f('http://x', "/* y */", 'a\\' // b');     `,
    );
  });

  it('keeps a template’s text and blanks the comments in its substitutions', () => {
    const code = 'f(`a // b ${g(/* c */ `d // e ${h}`)} /* f */`); // g';
    expect(uncommented(code, 'ts')).toBe(
      'f(`a // b ${g(        `d // e ${h}`)} /* f */`);     ',
    );
    expect(uncommented('`${{ a: 1 }.a} // x` // y', 'ts')).toBe(
      '`${{ a: 1 }.a} // x`     ',
    );
  });

  it('keeps a regular expression whole, and a division a division', () => {
    expect(uncommented("x.replace(/\\/\\/'[/]/g, ''); // c", 'ts')).toBe(
      "x.replace(/\\/\\/'[/]/g, '');     ",
    );
    const division = 'a = b / c; // d / e';
    expect(uncommented(division, 'ts')).toBe(
      'a = b / c;'.padEnd(division.length),
    );
    expect(uncommented("return /'/.test(s); // q", 'ts')).toBe(
      "return /'/.test(s);     ",
    );
  });

  it('blanks the comments of the language an extension names', () => {
    expect(uncommented('x = "# a" # b', 'py')).toBe('x = "# a" '.padEnd(13));
    expect(uncommented('a -- b\nc', 'sql')).toBe('a     \nc');
    expect(uncommented('a ; b', 'clj')).toBe('a    ');
    expect(uncommented('a % b', 'erl')).toBe('a    ');
    expect(uncommented('a (* b *) c', 'ml')).toBe(`a${' '.repeat(9)}c`);
    expect(uncommented('a --[[ b\nc ]] d', 'lua')).toBe(
      `a${' '.repeat(7)}\n${' '.repeat(5)}d`,
    );
    expect(uncommented('a # b // c /* d */', 'xyz')).toBe('a'.padEnd(18));
  });

  it('closes a block comment where its language does: nested, or at the first closer', () => {
    const code = '/* a /* b */ c */ d';
    expect(uncommented(code, 'rs')).toBe(`${' '.repeat(18)}d`);
    expect(uncommented(code, 'c')).toBe(`${' '.repeat(12)} c */ d`);
    expect(uncommented('{- a {- b -} c -} d', 'hs')).toBe(`${' '.repeat(18)}d`);
  });

  it('keeps a lifetime, a prime and a character literal from hiding a comment', () => {
    expect(uncommented("fn f<'a>(x: &'a str) {} // c", 'rs')).toBe(
      "fn f<'a>(x: &'a str) {}     ",
    );
    expect(uncommented(`let c = '"'; // c`, 'rs')).toBe(`let c = '"';     `);
    expect(uncommented("f' x' = y -- c", 'hs')).toBe("f' x' = y     ");
    expect(uncommented('a --> b', 'hs')).toBe('a --> b');
  });

  it('keeps a PHP attribute and a shell argument count, which only look like comments', () => {
    expect(uncommented('#[Test] # c', 'php')).toBe('#[Test]    ');
    expect(uncommented('echo $# # c', 'sh')).toBe('echo $#    ');
  });

  it('blanks a Ruby =begin block at line starts, and a Lua long comment of any level', () => {
    expect(uncommented('a\n=begin\nb\n=end\nc', 'rb')).toBe(
      `a\n${' '.repeat(6)}\n \n${' '.repeat(4)}\nc`,
    );
    expect(uncommented('x =begin\n', 'rb')).toBe('x =begin\n');
    expect(uncommented('=begin\n=endpoint\nb\n=end\nc', 'rb')).toBe(
      `${' '.repeat(6)}\n${' '.repeat(9)}\n \n${' '.repeat(4)}\nc`,
    );
    expect(uncommented('--[==[ a ]] b ]==] c', 'lua')).toBe(
      `${' '.repeat(18)} c`,
    );
    expect(uncommented('--[ a\nb', 'lua')).toBe(`${' '.repeat(5)}\nb`);
  });
});

describe('malformed records and contexts', () => {
  const messages = () => check().failures.map((f) => f.message);

  it('fails a record with no Cratylic name or no precising definition', () => {
    write('design/model/shop/a.md', 'A precising definition with no name\n');
    write('design/model/shop/b.md', '# b\n\n## Examples\n');
    expect(messages()).toEqual([
      'shop/a: has no # Cratylic name',
      'shop/b: has no precising definition',
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
