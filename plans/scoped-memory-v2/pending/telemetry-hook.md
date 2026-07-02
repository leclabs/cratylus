# telemetry-hook — harness path-journal (PostToolUse)

**Lane** Mav · **wave(0)** · deps: none (SPEC static) · HELD until Operator approves `../SPEC.md`.

## Static

`../SPEC.md` D2a. Pattern exemplar: the stance-guardrail hook — source
`packages/agent-anatomy/src/toolkit/hooks.ts` (agent-forge `Hook`), workers
`packages/agent-anatomy/src/toolkit/guardrail/`, projected via `pnpm anatomy:project` →
`.render-ts/{settings.json,hooks/}`, shipped via `deploy --kind hooks` (merge, non-destructive).

## Scope

New hook `path-telemetry`: PostToolUse on Write·Edit·NotebookEdit (tool_input file_path) + Bash
(parse only unambiguous mutating targets; skip on doubt — precision over recall), appending
`{ts, tool, paths[]}` to `${AGENT_HOME}/.telemetry/<sid>.jsonl` for the invoking agent's home
(resolve agent from harness env; unknown agent → no-op). Constraints: fails open · zero blocking ·
no stdout chatter · bounded journal (size-capped rotation) · off-repo writes only (agent home).
Files: `hooks.ts` entry + `src/toolkit/telemetry/` worker + projection wiring. NO runtime
(agent-memory) changes — the journal format is the D2a contract, pinned in SPEC.

## Accept (falsifiers)

- Fired against a scratch home: an Edit tool event lands one journal line with the exact path; a
  read-only Bash (`ls`) lands nothing; an ambiguous Bash lands nothing (precision rule provable by a
  seeded ambiguous command); rotation caps the journal.
- Hook absent/failing ⇒ encode still succeeds (degrade proven with the wave-sibling's runtime once
  both land — cross-checked at cutover, not here).
- `anatomy:project` emits the hook (settings fragment + worker); projection-stability green; repo
  gates 4×0.
