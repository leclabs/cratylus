import type { RuleCell } from '../toolkit/rule-cell.js';

// repo-preamble — the FIRST `rule` corpus instance (MODEL `Kind ∋ rule`,
// `activation: rule↦scope`). The workspace-root standing instruction (`AGENTS.md`):
// the always-loaded orientation every session binds on entry. Retiring the
// `AGENTS.md@node` dream memory-sink (see `src/skills/dream.ts`) removed the sole
// blocker to treating the repo-root `AGENTS.md` as a byte-locked rule TARGET — it is
// no longer SelfAuthored memory (`SelfAuthored ∉ Target` no longer applies), so it is
// a curated source-of-truth cell whose `body` projects + byte-locks to `/AGENTS.md`.
//
//   definiens — the σ*-signified canonical identity (`accept()`/REFLEXIVE target).
//   body      — the VERBATIM directive payload, regenerated to `targetPath` by
//               `project-targets` and byte-locked by `test/hook-rule-boundary.test.ts`.

export const repoPreamble: RuleCell = {
  kind: 'rule',
  id: 'repo-preamble',
  slug: 'repo-preamble',
  definiens:
    'scope-rule ↾ workspace-root · loaded ∀ session on entry — the standing orientation: doctrine-pointers ⟨why · what · how · corpus-index⟩ · working-convention ⟨conventional-commits ; header ≤100⟩ · tooling-prerequisite ⟨graph-indexer⟩ ; activation=scope ⟨¬dream-sink : curated source, projected + byte-locked⟩',
  scope: '',
  targetPath: 'AGENTS.md',
  refs: [],
  body: `# AGENTS

## Conceptual Vision

**CRITICAL: Read upon session-start:**

- [\`VISION.md\`](./VISION.md) — **why**
- [\`MODEL.md\`](./MODEL.md) — **what** — conceptual objectives and acceptance criteria
- [\`ENGINE.md\`](./ENGINE.md) — **how**
- [\`CANON.md\`](./CANON.md) —

## Working conventions

- Conventional Commits, header ≤100 chars (commitlint, \`commit-msg\` hook).

# Prerequisite

[Graphify](https://github.com/safishamsi/graphify)

confirm installed dependencies - mise => python3 => uv => graphifyy

\`\`\`zsh
mise install python uv
uv --system-certs tool install graphifyy   # PyPI package is graphifyy; the CLI it installs is \`graphify\`
# user scope, claude code  (see --help for more options)
graphify install
cd {repo}
graphify hook install
\`\`\`
`,
};
