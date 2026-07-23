# AGENTS

## Conceptual Vision

**CRITICAL: Read upon session-start:**

- [`VISION.md`](./VISION.md) — **why**
- [`MODEL.md`](./MODEL.md) — **what** — conceptual objectives and acceptance criteria
- [`ENGINE.md`](./ENGINE.md) — **how**
- [`CANON.md`](./CANON.md) —

**These four are LOCKED, immutable grounding — the north-star that defined this architecture.** They are hand-authored source-of-truth, **never generated or projected from code**. Alignment is one-directional: the source is brought _up_ to them; they are never regenerated _from_ source. Deriving them from source is a category error and a destructive act. (Doc↔source reconciliation waits for a stable release aligned to this grounding, and even then flows source→doc.)

**Prime principle + apex confidence order — apply at decision time.** The ground axiom is **`cratylism`**: names are natural, discovered by cold verification, never coined — so **all naming (anchors, dimensions, skills, agents, files, dirs) is discovered, never decided**, and `cold-decode-oracle`/`llm-native`/`signify` derive from it. Apex triad `cratylism ≻ VISION ≻ MODEL` — _confidence_ (how firmly held), **not** importance. On conflict resolve **up** the order — revise **MODEL**, _surface_ a **VISION** conflict (never unilaterally edit it), reconcile toward **cratylism**. Everything derived (cells · skills · agents · plans · SOUL) must be consistent with the triad. (Human record + rationale: `CANON.md` §Relationship.)

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
