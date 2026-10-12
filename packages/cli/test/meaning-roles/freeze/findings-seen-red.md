# Seen Red Record

- `F-timing`: `test/meaning-roles/freeze/findings.test.ts > F-timing: held-out check frozen only once seen red, examples frozen from open`
  - Asserted: The `check-writer` should be allowed to write to the cut's judgment folder BEFORE the cut's checks are frozen (since the check is only frozen once seen red).
  - Seen red: `AssertionError: freeze: design/judgment/library/renewal/ is frozen by the cut 'renewal' (architect 'architect'); only its architect may change it until the cut is integrated, and the call is made by 'check-writer': expected true not to be true` (The check folder was incorrectly frozen from cut opening).
- `F-route`: `test/meaning-roles/freeze/findings.test.ts > F-route: structural edit and all tool routes refuse frozen path edits`
  - Asserted: A structural edit `xd://ast_edit` to a frozen path by a non-architect should be blocked by the agent-launch hook gate, before the host executes the tool.
  - Seen red: `AssertionError: must refuse before the host executes the tool: expected undefined to be true` (The extension hook did not block the structural-edit tool execution).

## Completed by the lead

The lead added the cases the check-writer was asked for and left out: an `xd://ast_edit` call whose
`paths` name a folder holding a frozen example or a glob matching one, and the lead's refusals in
a main session as well as a sub session. Re-run against the current work, both cases are still
red for their findings' reasons. F-timing: the check-writer is refused on the judgment folder
before any check is frozen. F-route: the first `xd://ast_edit` staging call naming a frozen
example is not refused.
