# Workflow delivery — held-out delivery/1

Observed on 2026-10-13. These are judgment-only checks of the already-built work, not a claim that the unbuilt implementation was seen failing.

## Check

`structural.test.ts`: **held-out delivery/1 — a release remains complete when its source checkout no longer exists**.

The shared capability-port setup packs the existing build without lifecycle scripts and installs those packages outside the workspace. The check creates a separate source repository, records an earlier and current context description, a superseded concept, a built-from relation and a retired concept, and invokes `deliverContext` exported by that packed `@cratylus/runtime`. Its expected release is independently specified, including the first context identity and installed package version. The fixture places that projection at the installed owned root's `delivered/cratylus/workflow.json`; it does not rebuild the CLI package with the fixture journal.

The source checkout is then deleted. An unrelated empty project reads `design`, `state` and `overview` through the installed command. Every view must return the complete release content, `cratylus:workflow`, exact origin/version/context/identity and read-only marking. The installed bytes remain unchanged; no project journal is created. Each host has its own HOME, and `CRATYLUS_INSTALLATION` is unset before host creation and removed from the command environment.

## Negative control: seen red

```sh
env WORKFLOW_DELIVERY_NEGATIVE_CONTROL=source-required pnpm --filter cratylus exec vitest run --config ../../design/judgment/delivery/workflow-delivery/vitest.config.ts --reporter=verbose
```

Observed: **1 failed, 0 passed; exit 1**. The opt-in reader stand-in requires projecting the source again at read time. After deletion of the checkout, its projection process exits 1 and the success assertion rejects it:

```text
Error: deliverContext: /tmp/capability-host-DCL2CP/release-source is not inside a git repository; the journal is design/journal at the top of one
expected 1 to be +0
```

The earlier release-projection equality assertion passed before this failure. This red result demonstrates rejection of source-at-read-time dependence, not a defect in the built reader.

## Actual judgment: passed

```sh
env -u WORKFLOW_DELIVERY_NEGATIVE_CONTROL pnpm --filter cratylus exec vitest run --config ../../design/judgment/delivery/workflow-delivery/vitest.config.ts --reporter=verbose
```

Observed: **1 passed, 0 failed; exit 0**. All three installed read views satisfy the release assertions after the fixture source checkout has ceased to exist. No build, implementation change or operator installation change was performed.
