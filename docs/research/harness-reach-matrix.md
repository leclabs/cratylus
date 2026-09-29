# Harness-reach matrix

_Which harnesses a canon agent reaches for free, and with what agent-support._

## The thesis

Because **projection IS the export adapter**, a canon agent authored ONCE reaches
**every** forge harness for free. "Project canon to harness X" _is_ "export through the
X adapter." The composed SOUL body is **harness-neutral** — the same dimension-section
content whichever harness carries it; only the FRAMING differs per adapter (claude's
`.md` SOUL, etc.).

- **T2.1** proved this for **claude** (`adapters/claude/anatomy.ts` — `agentToClaudeMd`).

## The matrix

Agent-support is each adapter's declared `capabilities.resources.agents`
(`full` / `partial` / `none`) — the same value the IR write path uses to decide whether
to host a subagent or to skip+warn via `WriteReport`. The **anatomy projection** (the
inversion) currently has a dedicated projector for the two `full`-agent harnesses; every
other harness either hosts agents lossily (`partial`) or honestly skips them (`none`).

| Harness    | agents    | skills    | Native agent surface                 | Anatomy projector           |
| ---------- | --------- | --------- | ------------------------------------ | --------------------------- |
| **claude** | `full`    | `full`    | `.claude/agents/<name>.md` (SOUL)    | ✅ `agentToClaudeMd` (T2.1) |
| copilot    | `partial` | `full`    | partial subagent surface             | IR write path (lossy-aware) |
| cursor     | `partial` | `partial` | partial subagent surface             | IR write path (lossy-aware) |
| gemini     | `partial` | `partial` | partial subagent surface             | IR write path (lossy-aware) |
| opencode   | `none`    | `partial` | no subagent system                   | skip + warn (`WriteReport`) |
| crush      | `none`    | `partial` | no subagent system                   | skip + warn (`WriteReport`) |
| cline      | `none`    | `none`    | rules only                           | skip + warn (`WriteReport`) |
| continue   | `none`    | `none`    | rules only                           | skip + warn (`WriteReport`) |
| aider      | `none`    | `none`    | `AGENTS.md` / `CONVENTIONS.md` rules | skip + warn (`WriteReport`) |

**Reached with a full agent projection today:** `claude`.
**Reach for free (skills / rules layer) with honest lossy reporting for agents:** all 8 others.

## Honest lossy reporting

A canon agent projected through an adapter that declares `agents: 'none'` is **skipped with a
warning**, never silently dropped or corrupted — the existing `WriteReport.{warnings,skipped}`
mechanism (`forge`'s first-class lossy-translation contract). The CLI surfaces these via `--explain`; `--strict` promotes
them to errors.

## Omit-to-inherit

Harness-inheritance is declared **at the agent source**: a dimension key set to `null` on the `Agent`
vector projects no section and inherits whatever the target harness provides
(`@cratylus/schema`, gated by `packages/canon/test/null-dimension.test.ts`). The
projection is therefore identical machinery per harness — no per-harness subtraction fixture.

## Reproduce

One command — a proxy through the shipped `cratylus project` reading the repository's own `cratylus.config.ts`:

```sh
pnpm canon:project        # claude → packages/canon/.cratylus/claude/
```
