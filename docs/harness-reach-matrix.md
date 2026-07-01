# Harness-reach matrix

_Which harnesses a agent-anatomy agent reaches for free, and with what agent-support._

## The thesis

Because **projection IS the export adapter**, a agent-anatomy agent authored ONCE reaches
**every** agent-forge harness for free. "Project agent-anatomy to harness X" _is_ "export through the
X adapter." The composed SOUL body is **harness-neutral** — the same organ-section
content whichever harness carries it; only the FRAMING differs per adapter (claude's
`.md` SOUL vs codex's `.toml` `system_prompt`, etc.).

- **T2.1** proved this for **claude** (`adapters/claude/anatomy.ts` — `agentToClaudeMd`).
- **T2.4** proves it for a **second** harness, **codex** (`adapters/codex/anatomy.ts` —
  `agentToCodexToml`), reusing the shared, harness-neutral `agentBody` / `subtractReset` /
  `skillBody` / `ResolvedAgent` / `ResolvedSkill` machinery. The only NEW code is the codex
  framing (the `.toml` shape + the `AGENTS.md` surface) and the codex harness reset.

## The matrix

Agent-support is each adapter's declared `capabilities.resources.agents`
(`full` / `partial` / `none`) — the same value the IR write path uses to decide whether
to host a subagent or to skip+warn via `WriteReport`. The **anatomy projection** (the
inversion) currently has a dedicated projector for the two `full`-agent harnesses; every
other harness either hosts agents lossily (`partial`) or honestly skips them (`none`).

| Harness    | agents    | skills    | Native agent surface                 | Anatomy projector            |
| ---------- | --------- | --------- | ------------------------------------ | ---------------------------- |
| **claude** | `full`    | `full`    | `.claude/agents/<name>.md` (SOUL)    | ✅ `agentToClaudeMd` (T2.1)  |
| **codex**  | `full`    | `full`    | `agents/<name>.toml` + `AGENTS.md`   | ✅ `agentToCodexToml` (T2.4) |
| copilot    | `partial` | `full`    | partial subagent surface             | IR write path (lossy-aware)  |
| cursor     | `partial` | `partial` | partial subagent surface             | IR write path (lossy-aware)  |
| gemini     | `partial` | `partial` | partial subagent surface             | IR write path (lossy-aware)  |
| opencode   | `none`    | `partial` | no subagent system                   | skip + warn (`WriteReport`)  |
| crush      | `none`    | `partial` | no subagent system                   | skip + warn (`WriteReport`)  |
| cline      | `none`    | `none`    | rules only                           | skip + warn (`WriteReport`)  |
| continue   | `none`    | `none`    | rules only                           | skip + warn (`WriteReport`)  |
| aider      | `none`    | `none`    | `AGENTS.md` / `CONVENTIONS.md` rules | skip + warn (`WriteReport`)  |

**Reached with a full agent projection today:** `claude`, `codex`.
**Reach for free (skills / rules layer) with honest lossy reporting for agents:** all 8 others.

## Honest lossy reporting

A agent-anatomy agent projected through an adapter that declares `agents: 'none'` is **skipped with a
warning**, never silently dropped or corrupted — the existing `WriteReport.{warnings,skipped}`
mechanism (`agent-forge`'s first-class lossy-translation contract). Demonstrated in
`test/adapters/codex/anatomy.test.ts` against **opencode** and **aider** (both `agents: 'none'`):
each emits a `warnings` entry naming the unsupported `agents` resource and a `skipped` entry per
agent, and writes no agent artifact. The CLI surfaces these via `--explain`; `--strict` promotes
them to errors.

## Per-harness reset accuracy (out of scope, incremental)

Each harness owns its **harness reset** (the omit-to-inherit basis — what the harness provides
natively, subtracted at export so the projected agent carries only its delta). `claudeHarnessReset`
is a **ratified fixture** (measured by a blind bare `/introspect`). `codexHarnessReset` is a
**reasonable FIRST PASS** (T2.4 scope): it mirrors claude's organ set and subtraction kinds, with
the one deliberate divergence that `substrate = codex` (so a `claude`-substrate agent stays a real
delta under codex). Promoting it to a measured fixture is a later, incremental task — when Codex is
blind-introspected, replace the slugs and add the conformance assertion (as claude already has).

## Reproduce

```sh
cd packages/agent-anatomy
pnpm project         # claude   → .render-ts/      (byte-identical to Python .render/)
pnpm project:codex   # codex    → .render-ts-codex/ (agents/*.toml + skills + AGENTS.md)
pnpm project:codex -- --delta   # codex with the harness reset subtracted (omit-to-inherit)
```
