import type { Actions } from '../../manifest.js';

// The `vcs` factor carries what a commit IS, because nothing else an agent reads does:
// measured 2026-09-25 (docs/commit-gated-on-acceptance-hypothesis.md), a dispatcher with
// no commit rule in reach withheld every lane's commit until green in 18 of 18 dispatches,
// and one reading this durability definition let every lane commit in 6 of 6.
export const fileOps: Actions = `file-ops ⟨filesystem · vcs⟩ · commit ≜ durability ¬ acceptance ⟨acceptance ≜ unit state-move · ¬ gates commit⟩ · commit ∀ coherent-step ⟨isolated-branch ∨ worktree ⇒ red admitted ∧ NAMED ↦ message · main ⇒ green⟩ · commit ↾ own-paths ⟨pathspec · formatter(own-paths) ≺ commit⟩ · ∄ dispatch withholding commit(writer)`;
