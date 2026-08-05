# Harness-reach matrix

_Which harnesses a agent-canon agent reaches for free, and with what agent-support._

## The thesis

Because **projection IS the export adapter**, a agent-canon agent authored ONCE reaches
**every** agent-forge harness for free. "Project agent-canon to harness X" _is_ "export through the
X adapter." The composed SOUL body is **harness-neutral** — the same dimension-section
content whichever harness carries it; only the FRAMING differs per adapter (claude's
`.md` SOUL vs codex's `.toml` `system_prompt`, etc.).

- **T2.1** proved this for **claude** (`adapters/claude/anatomy.ts` — `agentToClaudeMd`).
- **T2.4** proves it for a **second** harness, **codex** (`adapters/codex/anatomy.ts` —
  `agentToCodexToml`), reusing the shared, harness-neutral `agentBody` /
  `skillBody` / `ResolvedAgent` / `ResolvedSkill` machinery. The only NEW code is the codex
  framing (the `.toml` shape + the `AGENTS.md` surface).

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

A agent-canon agent projected through an adapter that declares `agents: 'none'` is **skipped with a
warning**, never silently dropped or corrupted — the existing `WriteReport.{warnings,skipped}`
mechanism (`agent-forge`'s first-class lossy-translation contract). Demonstrated in
`test/adapters/codex/anatomy.test.ts` against **opencode** and **aider** (both `agents: 'none'`):
each emits a `warnings` entry naming the unsupported `agents` resource and a `skipped` entry per
agent, and writes no agent artifact. The CLI surfaces these via `--explain`; `--strict` promotes
them to errors.

## Omit-to-inherit

Harness-inheritance is declared **at the agent source**: a dimension key set to `null` on the `Agent`
vector projects no section and inherits whatever the target harness provides
(`@leclabs/agent-schema`, gated by `packages/agent-canon/test/null-dimension.test.ts`). The
projection is therefore identical machinery per harness — no per-harness subtraction fixture.

## Reproduce

One command, one `--harness` flag — the harness is the only thing that differs, and both legs are
proxies through the shipped `agent-forge project` reading the repository's own `agents.config.ts`:

```sh
pnpm canon:project        # claude → packages/agent-canon/.render-ts/
pnpm canon:project:codex  # codex  → packages/agent-canon/.render-ts-codex/ (agents/*.toml + skills + AGENTS.md)
```
