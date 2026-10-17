import type { RuleCell } from '@cratylus/schema';

// repo-preamble — the FIRST `rule` corpus instance (MODEL `Kind ∋ rule`,
// `activation: rule↦scope`). The workspace-root standing instruction (`AGENTS.md`):
// the always-loaded orientation every session binds on entry. Retiring the
// `AGENTS.md@node` memory-sink route (no cell routes a record to a node/plan
// `AGENTS.md`) removed the sole blocker to treating the repo-root `AGENTS.md` as a
// byte-locked rule TARGET — it is no longer SelfAuthored memory (`SelfAuthored ∉
// Target` no longer applies), so it is a curated source-of-truth cell whose
// `content` projects + byte-locks to `/AGENTS.md`.
//
//   residue — the σ*-signified canonical identity (`body = ⟨α, residue⟩`), the
//             `accept()`/REFLEXIVE target. It is `residue`, NOT `definiens`: it has
//             already paid the `∖ fired(α)` subtraction (`schema/src/rule-cell.ts`).
//   content — the VERBATIM directive payload, regenerated to `targetPath` by
//             `project-targets` and byte-locked by `test/hook-rule-boundary.test.ts`.
//             `content`, NOT `body`: `body(c) = ⟨α, residue⟩` is the whole cell, and
//             this is the sibling of `HookWorker.content` (`schema/src/rule-cell.ts`).

export const repoPreamble: RuleCell = {
  kind: 'rule',
  id: 'repo-preamble',
  slug: 'repo-preamble',
  residue:
    'scope-rule ↾ workspace-root · loaded ∀ session on entry — the standing orientation: doctrine-pointers ⟨why · what · how · corpus-index ; LOCKED-immutable-grounding : source-aligns-up · ¬regenerated-from-source⟩ · working-convention ⟨conventional-commits ; header ≤100 ; commit-autonomous@natural-boundaries ; push ⟨¬say-so⟩ ; green-field ⟨constrains-only-where-declared ; ¬compatibility-goal⟩ ; library-first ⟨maintained · small-API · ¬workflow-engine ; wrapped behind a cratylus capability⟩ ; branching=git-flow dev/main ⟨¬release · ¬hotfix branches ; change-branch ← dev ; local merge → dev once the check passes on the merged result ; dev → main by PR = release ↦ operator ; ¬direct-commit@main⟩ ; the-check ⟨pnpm check = pre-push = CI ; build · lint · typecheck · deterministic tests ; deps declared ; omp version stated, ¬prerequisite⟩ ; version-history ⟨review ; ¬refusal⟩ ; commit-own-paths ⟨by name ; ¬amend · ¬rewrite-shared⟩⟩ ; activation=scope ⟨curated source, projected + byte-locked⟩',
  scope: '',
  targetPath: 'AGENTS.md',
  refs: [],
  content: `# AGENTS

**CRITICAL INVARIANT:** You **MUST Read** these documents upon session-start:

- [\`CANON.md\`](./CANON.md) — **overview and primer**
- [\`CRATYLISM\`](./packages/canon/src/genus/prime-principle.ts) — The First Principle (**LOCKED**)
- [\`VISION.md\`](./VISION.md) — **why** the canon exists
- [\`MODEL.md\`](./MODEL.md) — **what** exists: conceptual objectives and acceptance criteria
- [\`ENGINE.md\`](./ENGINE.md) — **how** primitives are discovered, validated, and projected
- [\`ARCHITECTURE\`](./ARCHITECTURE.md) — purpose and relationship of the packages, and the seams that separate their concerns.

## Working conventions

- Conventional Commits, header ≤100 chars (commitlint, \`commit-msg\` hook).
- **Commit autonomously at natural boundaries,** without asking; this overrides the generic agent harness default of committing only when the user asks. Pushing a branch needs no say-so.
- **Green-field register:** existing code, records, and docs constrain work only where explicitly declared; compatibility is never a goal.
- **Reach for an established library before writing or adopting machinery.** Where a well-known problem has an actively maintained, widely used library with a small API, use it; never adopt a workflow or orchestration engine. Wrap it behind cratylus's own capability, so agents learn one small cratylus API, not the library's.
- **Branching: Git flow's \`dev\`/\`main\` split, without release or hotfix branches.** Each change is made on a short-lived branch from \`dev\` and merged locally into \`dev\` once \`pnpm check\` passes on the merged result. Release is a pull request from \`dev\` into \`main\`, and it is the operator's. Never commit to \`main\` directly.
- **One check:** \`pnpm check\` builds, lints, typechecks and runs the deterministic tests, and fails when any of them fails. The \`pre-push\` hook runs it, and CI runs exactly it after checkout and \`pnpm install\`, with nothing before or after. Every dependency it needs is declared in the workspace's manifests; nothing checks what else is installed.
- **Tests cover cratylus's own deterministic code only:** the check tests cratylus's code and the files it produces, never by starting omp, an agent or a model. Agent behaviour is judged in real use. The supported omp version is 18.10.2; the check neither needs nor starts omp, and after an omp upgrade the operator or the architect tries one real session by hand.
- **Version history is controlled by review, not by refusal:** no hook, CI step or command refuses a change to existing records; the concept journal stays append-only because its verbs only append.
- **Commit only what you changed:** stage and commit your own paths by name, never everything in the tree, and never amend or rewrite the shared version history.
`,
};
