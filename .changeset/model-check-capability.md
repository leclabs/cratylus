---
'cratylus': minor
'@cratylus/runtime': minor
'@cratylus/canon': minor
'@cratylus/forge': minor
---

The model check: `cratylus model check` checks the domain model, plain files in `design/model` of the repository holding the working directory, and binds each of its examples to the acceptance test that names it. A concept record is `<context>/<concept>.md`, its `# term`, its correction and optionally `## Examples` of `### <name>` (or `### <name> (judged in review)`) over Given, When and Then lines; an acceptance test is an `it(`/`test(` whose title is exactly `<context>/<concept>: <example name>`. It prints its report as JSON on stdout, `{model, passed, failures, warnings}`, and exits 1 when anything fails: a malformed record or context, an example no acceptance test names and not judged in review, or an acceptance test naming an example the model does not have. Implementation leakage in a record and history recounted in its correction are warnings, never failures. With no `design/model` it refuses on stderr. `cratylus model --explain` explains it, and the omp extension offers it as the tool `model_check`.

`@cratylus/runtime`: `CAPABILITIES` and canon's `RUNTIME_CAPABILITIES` gain `model`; `@cratylus/runtime` exports `MODEL_CHECK`. The orientation starts with the business analyst (`omp --agent business-analyst`), and its theory points at the domain model of cratylic context design. The repository's `pnpm check` ends with the model check.
