# E5 — R5: adapters by-name registry + neutral core/anatomy-body

**static:** `packages/agent-anatomy/src/toolkit/{project-cli.ts:29, project-cli-codex.ts:24}` ·
`packages/agent-forge/src/adapters/{claude/anatomy.ts:50-68, codex/anatomy.ts:23}` · `../NORTH-STAR.md §2 R5`.
**scope:** anatomy's projection CLIs SELECT an adapter by NAME from a registry (the `HarnessAdapter` port) —
stop importing concrete adapter modules. Move `agentBody`+`organTitle`+`organField` from `adapters/claude/anatomy.ts`
into a neutral `core/anatomy-body`; both adapters import it down; kill the sideways `codex/anatomy.ts:23` import.
(Subsumes the `organTitle` dedup, R8.)
**accept:** `git grep -E "adapters/(claude|codex)" packages/agent-anatomy/src` = empty (selection by name);
`core/anatomy-body` exists; `codex/anatomy.ts` no longer imports `../claude/anatomy`; both claude+codex project
correctly (`project --check` both); typecheck green.
**dep:** E1.
