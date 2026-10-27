# Acceptance tests name their examples

An acceptance test is a vitest `it(` or `test(` call whose title is exactly `'<context>/<concept>: <example name>'`: the context's directory and the concept's file stem under `design/model/`, and the example's `###` heading verbatim, case included, without its ` (judged in review)` marker. Only plain `it(` and `test(` count, and a title inside a comment does not. One test binds one example, and it lives beside what realizes it.

`cratylus model check` finds acceptance tests in every file named `*.test.*` or `*.spec.*` under the repository root, outside `node_modules`, `dist` and dot-directories, and runs last in `pnpm check`, which fails when it fails. It reads the model's records strictly: a `.md` file anywhere in `design/model/` but `purpose.md`, `<context>/context.md` and `<context>/<concept>.md` is a failure, and an example's body is its Given, When and Then lines in that order, each optionally continued by `And` lines.

The check matches text, so a title nested in a skipped block or written inside a string is not told from a test that runs; code review judges those. A test that writes fixture test sources composes the title pattern from parts, so the repository's own tests never name an example they do not bind.
