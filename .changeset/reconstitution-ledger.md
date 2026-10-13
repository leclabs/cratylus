---
'@cratylus/runtime': minor
'cratylus': minor
---

The work package capability keeps a tracked, branch-versioned **ledger** in `design/ledger/` in place of the untracked log under the git common directory: one exclusively created JSON file per entry, named by a ULID, each carrying a transition id, and an entry whose transition is already recorded is refused with nothing written. The pre-commit immutability gate covers `design/ledger/` as it covers `design/journal/`.

A cut is identified by its name alone, across contexts: `--cut <name>` reads every `design/examples/<context>/<name>.md`, examples are referenced as `<context>/<n>`, and a concept the cut's contexts share is given as `<context>/<name>`. `inventory` lists each example with its `ref` and context and each concept with its context; `assignment` gives the owned examples by `ref`.

New verbs: `open --cut <name> --branch <branch> --architect <context>=<architect>` records the cut, refusing contexts held by different architects (one cut per context, joined by contracts) or a context left without an architect; `state` computes the cut's branch, contexts, architects, phase (`open`, `in flight`, `complete`), each work package's status (`submitted`, `dispatched`, `returned`, `approved` on two distinct assayers' passing verdicts, `failing`, `disputed`), the packages ready to dispatch and the lead's latest report. The agent-called `dispatch`, `finish` and `run` are removed: dispatches, returns, verdicts and reports reach the ledger only from the harness's own events, through the harness-facing command `cratylus lifecycle '<event-json>'`. `record` writes one `efficiency` entry per context of the cut.

`cratylus completion-check`, run by this repository's `.husky/post-commit`, warns when a commit's subject opens `feat(cut:<name>): ` and the ledger does not show that cut complete, naming its phase and every work package not approved; it never refuses and never writes the ledger. `lifecycle` and `completion-check` are no capability and no agent tool, and no help lists them.

`@cratylus/runtime` exports the ledger API (`cutView`, `cutsInLedger`, `foldCut`, `readCut`, `appendLifecycle`, `completionCheck`) for harness bindings and other packages.
