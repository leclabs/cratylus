# Acceptance tests name their examples

An acceptance test is a vitest `it(` or `test(` call whose title is exactly `'<context>/<concept>: <example name>'`: the context's directory and the concept's file stem under `design/model/`, and the example's `###` heading verbatim without its ` (judged in review)` marker. Only plain `it(` and `test(` count. One test binds one example, and it lives beside what realizes it.

`cratylus model check` finds acceptance tests in every file named `*.test.*` or `*.spec.*` under the repository root, outside `node_modules`, `dist` and dot-directories, and runs last in `pnpm check`, which fails when it fails. A test that writes fixture test sources composes the title pattern from parts, so the repository's own tests never name an example they do not bind.
