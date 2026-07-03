# E2 · ir-emission — output the IR format to conventional `.{namespace}/` folders, across scopes

Floor: **F2** (output the agent-factory IR format to a conventional `.{namespace}/` folder across
user · project · local — the `.claude/`-, `.agents/`-, `.cursor/`-class layouts). ρ=LLM. Two
readings of F2 are both covered: (a) the IR's own home `.agent-forge/` as a well-formed namespace
dir (S1, S2, S7) — **`.agent-forge/` is the canonical IR home** (Operator ruling); (b)
compilation into each harness's `.{namespace}/` layout per scope (S3–S6). `.agents/` is an
**export surface**, never the IR home — the export story is E7.S3. Fixture ground truth =
RETURN §2 sheets.

---

## E2.S1 · init bootstraps a valid IR home

A: AUTHOR · G: start a fresh IR dir that tools can trust immediately.
P: empty git repo.
✓:

- `agent-forge init` creates `.agent-forge/` with a manifest validating against
  `manifest.schema.json` (`agentForge: 1`, `scope: project`, `targets: []`-or-stub) and the
  per-resource folders; `agent-forge lint` passes on the fresh tree.
- `agent-forge init --scope user` targets `~/.agent-forge/`; `--scope local` targets
  `<root>/.agent-forge/local/`; each emits the matching manifest `scope`.

## E2.S2 · IR write is canonical and idempotent

A: AUTHOR · G: the IR-on-disk layout is a stable, documented format (our own reimportable
`.{namespace}/`).
P: in-memory IR obtained from any import (E1.S1 fixture).
✓:

- writeIR → readIR → writeIR produces byte-identical trees (second write = no diff).
- Every emitted file's location is derivable from the documented layout rule (resource type →
  folder, one file per resource, name = resource id/name); a blind reader can predict each path.

## E2.S3 · project-scope compile lands in each harness's project namespace dir

A: FLEET · G: one compile populates each target's project-level `.{namespace}/` layout.
P: project IR with 1 rule, 1 skill, 1 agent, 1 mcp server; manifest targets = all 10 adapters.
✓:

- `agent-forge compile` writes only under each adapter's documented project surface (per §2:
  `.claude/`+`CLAUDE.md`+`.mcp.json`, `.codex/`+`.agents/skills/`+root `AGENTS.md`, `.cursor/`,
  `.github/`+`.vscode/`, `.gemini/`, `.opencode/`+`opencode.json`, `.clinerules/`+`.cline/`,
  `crush.json`+`.crush/`, `.continue/`, `.aider.conf.yml`+conventions).
- Touched-path set (repo tree diff) ⊆ the union of declared per-adapter output paths; any stray
  write = FAIL naming the path.

## E2.S4 · user-scope compile lands in each harness's user-level home

A: FLEET · G: user-scope IR reaches `~`-anchored layouts.
P: user-scope IR (fake `$HOME`), same resources as S3.
✓:

- Compile writes each target's documented user home (per §2: `~/.claude/`, `~/.codex/`,
  `~/.cursor/`, `~/.copilot/` [CP8] — NOT `~/.config/github-copilot/`, `~/.gemini/`,
  `~/.config/opencode/`, `~/Documents/Cline/Rules` [CL1] — NOT `~/.cline/rules`,
  `~/.config/crush/`, `~/.continue/`, `~/.aider.conf.yml`).
- Zero writes under the project root.

## E2.S5 · local-scope compile uses each harness's local tier or refuses loudly

A: OWNER · G: local (not-committed) config lands on a real local surface; a harness without one
never gets a fabricated file.
P: local-scope IR with 1 rule + 1 env var; targets = all 10.
✓:

- claude: rule → `CLAUDE.local.md`, settings → `.claude/settings.local.json` [CC1][CC8] (the
  adapter's current "local has no rules" warning is gone).
- Each target lacking a documented local tier produces a per-resource `skipped` entry naming
  target + reason `no-local-tier`, a loud warning, AND an emitted Operator elicitation (the
  report carries an `elicit` entry: target · resource · resolution question). Emulation is never
  invented; the elicit is the resolution path — the skip cannot be suppressed without a recorded
  resolution.

## E2.S6 · scope isolation — no cross-scope bleed

A: FLEET · G: a resource compiles only into the scope its manifest declares.
P: same-named rule `r` in user-scope IR (body U) and project-scope IR (body P); compile both.
✓:

- User output files contain body U only; project output files body P only; diff of each output
  against the other scope's body is non-empty (no merge, no clobber across scopes).

## E2.S7 · the IR home is itself discoverable by walk-up

A: AUTHOR · G: commands run from any subdir resolve the nearest project `.agent-forge/`.
P: project IR at repo root; cwd = `packages/deep/nested/`.
✓:

- `agent-forge compile --dry-run` from the nested cwd resolves the root IR (report names the
  resolved IR path = `<root>/.agent-forge`); exit 0.
