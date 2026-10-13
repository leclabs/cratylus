# Examples · checks

Context: development. Concepts: check, history. Decisions in force: 0153, 0154 and 0156.

## Structural

1. (history) **Given** a pull request that corrects an existing design record without appending a
   replacement record, **when** the change is committed using the repository's ordinary hooks,
   **then** no hook refuses the commit because an existing record changed; no bypass or special
   permission is needed to leave the correction for pull-request review.

2. (history) **Given** a pull request that replaces earlier design records with a snapshot and
   deletes the earlier records, with the code otherwise passing its check, **when** CI checks the
   change, **then** it does not fail because records were replaced or deleted; no separate history
   check prevents the change from reaching review.

3. (history) **Given** the commands, hooks and runtime that cratylus delivers to a project,
   **when** their available operations are inspected, **then** none offers or invokes a gate that
   refuses rewriting that project's history; the gate is absent, not disabled by default, renamed,
   or retained behind a bypass. The journal's own operations still append records rather than
   offering an operation to edit or delete an earlier entry.

4. (check) **Given** the documented local check and CI's checking steps, **when** their invocations
   are compared after checkout and ordinary dependency installation, **then** CI invokes exactly
   the local check, with no additional validation before or after it and no CI-only mode that
   selects different checks. Setup and dependency installation are not additional validations.

5. (check) **Given** a checkout whose build, lint, type checks and deterministic tests all pass,
   **when** the local check runs, **then** it succeeds and includes all four kinds of check;
   its tests cover composition, projection and the runtime's capabilities, not just one of them.

6. (check) **Given**, in turn, a build failure, a lint failure, a type error or a failing
   deterministic test, with the other kinds of check passing, **when** the local check runs,
   **then** it fails in each case; no failing kind of check is omitted or converted into success.

7. (check) **Given** a clean checkout with the repository's documented toolchain and only the
   dependencies installed by its ordinary package management, **when** the local check runs,
   **then** it needs no separately installed program or undeclared dependency. Every dependency
   the check uses is declared for that installation rather than supplied by the developer's
   machine or a CI runner's extra software.

8. (check) **Given** the local check and CI's checking steps, **when** their operations are
   inspected, **then** neither contains a software-presence preflight, a probe for optional
   programs, or a conditional skip based on which extra programs are installed; ordinary package
   management supplies the dependencies rather than a second mechanism policing the machine.

9. (check) **Given** every test included in the check, **when** its execution is followed,
   **then** it tests cratylus's own deterministic code or produced files and starts no harness,
   agent or model; there is no end-to-end test or judgment of how an agent behaves in a harness,
   including under another test's name.

10. (check) **Given** the repository's working conventions, **when** a developer reads how to
    work with the supported harness, **then** a supported harness version is stated; the version
    statement does not make installing or starting that harness a prerequisite of the check.
