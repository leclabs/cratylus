# AGENTS

## Conceptual Vision

**CRITICAL: Read upon session-start:**

- [`VISION.md`](./VISION.md) — **why**
- [`MODEL.md`](./MODEL.md) — **what** — conceptual objectives and acceptance criteria
- [`ENGINE.md`](./ENGINE.md) — **how**
- [`CANON.md`](./CANON.md) —

**Apex confidence order — apply at decision time.** `llm-native ≻ VISION ≻ MODEL` — _confidence_ (how
firmly held), **not** importance. These three are the apex source-of-truth and must be mutually
consistent; on conflict resolve **up** the order — revise **MODEL**, _surface_ a **VISION** conflict
(never unilaterally edit it), reconcile toward **llm-native**. Everything derived (cells · skills · agents
· plans · SOUL) must be consistent with the three. (Human record + rationale: `CANON.md` §Relationship.)

## Working conventions

- Conventional Commits, header ≤100 chars (commitlint, `commit-msg` hook).

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
