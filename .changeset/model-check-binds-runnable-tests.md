---
'cratylus': minor
'@cratylus/runtime': minor
---

The model check binds an example only to a test that can run, and refuses records it used to pass over. A test title only in a `//` or `/* */` comment binds nothing and names nothing missing (comments are blanked by a small scanner that keeps string, template and regular-expression literals whole, so `'http://x'` survives). A `.md` file in `design/model` other than `purpose.md`, a `<context>/context.md` or a `<context>/<concept>.md` — another file at the root, any file in a nested directory, an extension not in lower case — fails as a misplaced record, naming the file. An example's lines must be Given lines, then When lines, then Then lines, each run optionally going on in `And` lines, and nothing else; otherwise it fails, naming the concept and the example.
