# AGENTS

**CRITICAL INVARIENT:** You **MUST Read** these documents upon session-start:\*\*

- [`CANON.md`](./CANON.md) — **overview and primer**
- [`CRATYLISM`](./packages/agent-canon/src/dimensions/engineering-principles/cratylism.ts) — The First Principle (**LOCKED**)
- [`VISION.md`](./VISION.md) — **why** the canon exists
- [`MODEL.md`](./MODEL.md) — **what** exists: conceptual objectives and acceptance criteria
- [`ENGINE.md`](./ENGINE.md) — **how** primitives are discovered, validated, and projected
- [`ARCHITECTURE`](./ARCHITECTURE.md) — purpose and relationship of the packages, and the seams that separate their concerns.

## Working conventions

- Conventional Commits, header ≤100 chars (commitlint, `commit-msg` hook).
- **Commit autonomously at natural boundaries — no operator approval needed.** This overrides the generic harness default ("commit only when the user asks"); do not gate commits on approval. Only `git push` is gated: push only when the operator asks.

# Prerequisite

[Graphify](https://github.com/safishamsi/graphify)

confirm installed dependencies - mise => python3 => uv => graphifyy

```zsh
mise install python uv
uv --system-certs tool install graphifyy   # PyPI package is graphifyy; the CLI it installs is `graphify`
# user scope, claude code  (see --help for more options)
graphify install
cd {repo}
graphify hook install
```
