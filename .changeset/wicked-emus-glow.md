---
'@cratylus/runtime': minor
'cratylus': minor
---

`cratylus model check` binds an example to its acceptance test in any language and test framework, and only to a test. A test file is one its language's convention names a test (`basket.test.ts`, `test_basket.py`, `basket_test.go`, `basket_spec.rb`, `BasketTest.java`, …) or a Gherkin `*.feature` file; a test is a titled test declaration in it (`it`, `test`, `t.Run`, `subTest`, `@DisplayName`, `@Test`, `TEST_CASE`, `test_that`, a Gherkin `Scenario:` and the others `design/decisions/acceptance-tests-name-their-examples.md` lists) whose title is `<context>/<concept>: <example name>`. Comments are read out by the comment syntax of the file's language. A title quoted in prose (a changelog, the docs) or in a comment binds nothing.
