# 31 live sources cite a dead DOCUMENT plus section — NORTH-STAR §2, DESIGN.md §7, decisions/0003-shard-layout — a shape neither the plan-path law nor the sigil prohibition can see

> FILED, not specified. A stub: symptom + locus + provenance, no census, no
> acceptance. It exists so the defect was not chased when it was found. Whoever
> promotes it to `ready` owes it a real spec (`/praxis upsert`).

**Symptom.** 31 live sources cite a dead DOCUMENT plus section — NORTH-STAR §2, DESIGN.md §7, decisions/0003-shard-layout — a shape neither the plan-path law nor the sigil prohibition can see

**Locus.** _(unfilled — the filer may not have known)_

**Provenance.** Filed 2026-08-06 from `df3aad73`, while executing `t-dead-designator-citations`.

## VERDICT — RECTIFIED 2026-08-06

**Class real. Count wrong. The defect is worse than filed.**

Measured over `packages/*/src`, `packages/*/README.md`, `ARCHITECTURE.md`: **26 citations, not
31** — and 24 of them name a single document (`NORTH-STAR §N`), plus 1 `DESIGN.md §N` and 1
`decisions/0003-shard-layout`.

The sharper finding: `NORTH-STAR.md` is **not deleted**. It exists at
`.scratchpad/architecture/NORTH-STAR.md`, which is **untracked** — `git ls-files .scratchpad`
returns 0 files. So the citation resolves for whoever authored it and for nobody else: a fresh
clone, CI, and every other agent see a dangling reference, while the author sees a live one.
An `existsSync`-style oracle run on THIS host would call it live and pass.

That makes the class distinct from the dead-designator class in kind, not just in shape: the
failure is **untracked-but-present**, which no path-existence check on a developer host can
detect. Whoever specs this owes the tracked-vs-present distinction, not just a matcher.
