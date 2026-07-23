# S10 · integrate-smoke

**Objective.** Prove the whole runtime-plugin loop end-to-end on a clean fixture: **project → deploy (with per-host runtime install) → a deployed thin-shim skill invokes `agent-runtime memory <verb>` and `agent-runtime tap <verb>` on the host → verify the capability runs**. This is the acceptance gate for the architecture; it confirms projected artifacts integrate with the runtime once deployed.

**Static inputs (pinned):**

- All prior slice outputs (dep-fed): agent-runtime kernel (S3), memory + event-tap capabilities (S4, S5), forge thin-shim projection (S6), deploy runtime-install (S7), rewired skills (S8), branded bin (S9).
- `packages/agent-forge/test/deploy/` + `test/stories/` — the existing deploy/story harness to add the e2e smoke into.
- The clean-worktree gate discipline (gate a clean fixture of the commit, hermetic config layers isolated) from prior canon work.

**Constraints.**

- Hermetic + clean-worktree: gate a fixture of the committed state, isolate every config layer the SUT reads (`GIT_CONFIG_GLOBAL=/dev/null`, scoped home); no reliance on the operator's real `~/.agents`.
- LOCAL scope in-remit; FLEET deploy + any push RESERVED (operator). The smoke runs against a local/temp target, not the live fleet.
- Non-vacuous: prove the capability ACTUALLY ran (a record encoded + read back; a tap installed + observed + removed) — not merely that the shim spawned.
- Full-suite gate: agent-runtime + agent-memory + agent-forge + agent-canon all green; the 2 pre-existing baseline reds (E7/S10, E10/S7) remain the ONLY tolerated reds (or are separately resolved).

**Dependencies.** S7, S8, S9.

**Outputs.** An e2e smoke test (project→deploy→invoke→verify) in the harness; a green full-suite tally; a short acceptance report (what the loop proves); the plan ready to retire.

**Completion criteria (falsifier).** On a clean local fixture: projecting a `runtime`-declaring skill emits a thin shim; deploying installs the runtime + capabilities; running the deployed shim executes `agent-runtime memory encode`→`read` round-trip AND `agent-runtime tap install`→`status`→`remove` with zero residue; all four package suites green (only the 2 known baseline reds tolerated). REJECTED if any leg is faked/stubbed rather than executed, if the smoke depends on the operator's real fleet/home, if it pushed to the fleet without gate, or if the capability didn't provably run end-to-end.
