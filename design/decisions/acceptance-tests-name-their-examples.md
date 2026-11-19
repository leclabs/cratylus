# Acceptance tests name their examples

An acceptance test is a test, in any language and test framework, whose title is exactly `<context>/<concept>: <example name>`: the context's directory and the concept's file stem under `design/model/`, and the example's `###` heading verbatim, case included, without its ` (judged in review)` marker. One test binds one example, and it lives beside what realizes it.

`cratylus model check` reads source text and runs nothing, so it binds without a test run, a report format or a configured runner, and names each test by `<path>:<line>`. It knows no test framework: a list of the frameworks' declarations is never any language, so whatever call, attribute or wrapper holds the title, the title alone binds. JUnit XML reports lost for the same reach and more cost: they need a prior test run, and frameworks rewrite titles in them (Go's `t.Run` turns spaces into underscores, vitest prefixes `describe` titles).

What the check reads as a test:

- A test file is a file outside `node_modules`, `dist` and dot-directories whose name marks it a test by the convention of its language: one of the words of its name, split at `.`, `_`, `-` and at a lower-to-upper case change, is `test`, `tests`, `spec` or `specs` (`basket.test.ts`, `test_basket.py`, `basket_test.go`, `basket_spec.rb`, `BasketTest.java`, `BasketTests.cs`, `BasketSpec.hs`), or a Gherkin feature file, `*.feature`. Prose (`.md`, `.markdown`, `.mdx`, `.txt`, `.rst`, `.adoc`) is never a test file, so a title quoted in a changelog or the docs binds nothing.
- In a test file, outside comments, a test is a whole string literal equal to a title: `'…'`, `"…"`, or a backtick literal with no `${`, its escapes read as what they escape (a raw literal, as Go's backtick, read as written). A literal joined to another by an operator is two literals, neither the title.
- In a feature file, a test is a `Scenario:`, `Scenario Outline:`, `Scenario Template:` or `Example:` line, its title the rest of the line, outside `#` comment lines and doc strings. Gherkin is how a framework whose tests carry no title of their own (a plain pytest function, Rust's `#[test]`) binds when its project would rather not quote the title in the test.
- Comments are blanked before reading, by the comment syntax of the file's language, known by its extension; a file of an extension the check does not know is read with `//`, `/* */` and `#` comments. A title in a comment binds nothing.

Each literal equal to a title counts, so a test file quoting its title twice, as the test's name and again in an assertion, holds two tests of one example, and the check fails naming both lines. A test that writes fixture sources or asserts on titles composes each title from parts (`` `shop/basket: ${name}` ``), so the repository's own tests never name an example they do not bind.

The check runs last in `pnpm check`, which fails when it fails. It reads the model's records strictly: a `.md` file anywhere in `design/model/` but `purpose.md`, `<context>/context.md` and `<context>/<concept>.md` is a failure, and an example's body is its Given, When and Then lines in that order, each optionally continued by `And` lines.
