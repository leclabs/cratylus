# Workflow delivery — held-out workflow/1

Observed on 2026-10-13. These are judgment-only checks of the already-built work, not a claim that the unbuilt implementation was seen failing.

## Checks

`structural.test.ts` binds **held-out workflow/1** separately for `design` and `overview`.

An isolated host installs the packed existing build and receives a controlled delivered workflow document through the existing workflow-delivery fixture. Its project records its own workflow context through the installed CLI. The check requires a valid recorded context identity different from the delivered source identity, then independently records exactly the delivered subject, relation, live concept wording and built-from links. Content equality is asserted before either negative control is applied.

The unscoped view must contain exactly `workflow` and `cratylus:workflow`. The project's context has no delivered marker and is not read-only. The delivered context has exact release provenance and is read-only; overview's account identifies it as such. Selecting either qualified or plain name returns only the corresponding context. Readback changes neither the project journal nor the delivered document. Each host has its own HOME, and `CRATYLUS_INSTALLATION` is unset before host creation and removed from its command environment.

## Negative controls: seen red

```sh
env WORKFLOW_DELIVERY_NEGATIVE_CONTROL=same-name pnpm --filter cratylus exec vitest run --config ../../design/judgment/workflow/workflow-delivery/vitest.config.ts --reporter=verbose

env WORKFLOW_DELIVERY_NEGATIVE_CONTROL=same-content pnpm --filter cratylus exec vitest run --config ../../design/judgment/workflow/workflow-delivery/vitest.config.ts --reporter=verbose
```

Observed for **each** command: **2 failed, 0 passed; exit 1**. The first reader stand-in suppresses a delivered context on matching plain name; the second suppresses it on matching normalized design content. Both use the same final assertions as the real reader. Both `design` and `overview` reject each stand-in with:

```text
expected [ 'workflow' ] to deeply equal [ 'cratylus:workflow', 'workflow' ]
```

These red results demonstrate that neither names nor identical content can substitute for the recorded identity. They are not failures of the built implementation.

## Actual judgment: passed

```sh
env -u WORKFLOW_DELIVERY_NEGATIVE_CONTROL pnpm --filter cratylus exec vitest run --config ../../design/judgment/workflow/workflow-delivery/vitest.config.ts --reporter=verbose
```

Observed: **2 passed, 0 failed; exit 0**. The actual installed reader preserves both identities in both views and in the corresponding scoped reads.

Held-out **workflow/2** is deliberately not bound: reconstitution behaviour in cratylus's own repository remains judgment in use, not a deterministic assertion about agent behaviour.
