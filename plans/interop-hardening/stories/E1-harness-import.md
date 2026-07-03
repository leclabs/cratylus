# E1 · harness-import — import context from any supported harness → IR

Floor: **F1** (import from any supported harness's config files → IR). ρ=LLM. Actors per
`COVERAGE.md` legend. Fixture ground truth = `../completed/harness-landscape-research.RETURN.md`
§2 per-harness config-contract sheets (cited `§2/<harness>`); ledger refs `[XX#]` resolve there.
Story grammar: `A:` actor · `G:` goal · `P:` precondition · `✓:` observable acceptance (each
bullet an independently checkable pass/fail).

---

## E1.S1 · claude full-surface lift

A: OWNER · G: lift an existing Claude Code install into IR with nothing dropped silently.
P: fixture repo + fake `$HOME` populated per §2/Claude-Code: `~/.claude/CLAUDE.md`, project
`CLAUDE.md` + `CLAUDE.local.md`, `.claude/agents/one.md` (frontmatter incl. `permissionMode`),
`.claude/skills/s1/SKILL.md`, `.claude/settings.json` (permissions+env+hooks), `.mcp.json` (one
stdio, one http server).
✓:

- `agent-forge import claude` exits 0; `.agent-forge/` contains ≥1 rule, 1 agent, 1 skill, 1 hook,
  2 mcp_servers, permissions, env; `agent-forge lint` passes.
- Every source field the IR cannot represent (e.g. agent `permissionMode`) is named in the import
  report (path + field); grep of report for `permissionMode` hits.
- Zero resources sourced from paths outside the §2/Claude-Code documented surface set.

## E1.S2 · every shipped target imports from a documented-truth fixture

A: DEV · G: prove each of the 10 adapters lifts a fixture built _only_ from documented surfaces.
P: per client `c ∈ {claude, opencode, codex, gemini, copilot, cursor, cline, crush, aider,
continue}` a fixture constructed strictly from §2/`c` (paths, formats, keys exactly as the sheet);
each fixture exercises every resource class the sheet marks present for `c`.
✓:

- `agent-forge import c` exits 0 for all 10.
- For each resource class present in fixture `c`, ≥1 IR resource of the mapped type exists after
  import; a present-in-fixture class with 0 imported resources = FAIL (names the class).
- All emitted IR validates against `src/core/schema/*.schema.json`.

## E1.S3 · fabricated paths are never read as truth

A: DEV · G: an importer trusts only documented surfaces; legacy fabricated paths produce a loud
unknown, not phantom resources.
P: per adapter with a §3-documented fabricated read path (`.opencode/mcp.json` [OC7],
`.cline/hooks.json` [CL2], `~/.config/github-copilot/*` [CP8], `.copilot/skills/` [CP2],
`~/.cline/rules` [CL1], `.crush/mcp.json` [CR1], `~/.cursor/AGENTS.md` [CU1]): fixture containing
ONLY that fabricated path, none of the documented ones.
✓:

- Import yields **zero** resources of the affected type.
- Import report carries a warning naming the unrecognized path (exact-string assertable).

## E1.S4 · absent capability imports loudly-empty

A: OWNER · G: importing a harness that lacks a resource type reports the absence, never a silent
empty set.
P: aider fixture per §2/aider (conf + conventions file); aider has no MCP/agents/skills [AI3][AI5].
✓:

- `agent-forge import aider` report lists `mcp_servers: unsupported-by-source`, `agents:
unsupported-by-source`, `skills: unsupported-by-source` (or the adapter's declared-`none`
  equivalent wording — a machine-parseable status per resource type, not omission).

## E1.S5 · import --from foreign root

A: OWNER · G: lift a harness config living in another checkout.
P: fixture repo A (empty), repo B with `.codex/` per §2/Codex.
✓:

- In A, `agent-forge import codex --from <B>` exits 0 and writes IR under A's `.agent-forge/`;
  B is byte-unchanged (pre/post hash of B's tree equal).

## E1.S6 · scope-faithful lift

A: OWNER · G: user-scope config lands in user-scope IR; project-scope in project-scope IR.
P: claude fixture with `~/.claude/agents/u.md` (fake `$HOME`) and `.claude/agents/p.md`.
✓:

- After import, `u` is in the user-scope IR home (`~/.agent-forge/`), `p` in the project
  `.agent-forge/`; neither appears in the other; both manifests carry the correct `scope` value.

## E1.S7 · read-side fidelity for documented-but-unmodeled surfaces

A: DEV · G: the surfaces §3 lists as read-side gaps become lift inputs or explicit recorded
losses — never invisible.
P: fixtures per gap: codex `AGENTS.override.md` + root→cwd chain + fallback filenames [CX3];
claude `.claude/rules/*.md` with `paths:` [CC1]; opencode `instructions` globs + CLAUDE.md
fallback [OC3]; cline `paths:` rule frontmatter + AGENTS.md [CL1]; crush `context_paths`
multi-file set [CR2].
✓:

- Per fixture: the content either appears in imported IR (rule resources with provenance noting
  source path) OR the import report lists the file under `unlifted-surfaces` with its path.
- No fixture file is both un-imported and un-reported (set difference check = ∅).

## E1.S8 · foreign agent NL → verbatim Persona organ (step 1 of the two-step agent law)

A: OWNER · G: a foreign agent definition imports without interpretation — its natural-language
content lands VERBATIM on the anatomy vector's `persona` organ (the freeform home); no other
organ is guessed. (Step 2 — elevation to the full vector — is E6.S3.)
P: cursor fixture `.cursor/agents/rev.md` (frontmatter name/description/model + prose body);
anatomy types importable.
✓:

- Import yields an agent whose source-of-truth form is the 24-organ vector: `persona` = the
  source body verbatim (byte-equal after documented frontmatter extraction); `name`/`model`/
  `description` mapped to their homes; **every other organ `null`** — any non-null organ beyond
  the mapped set = FAIL (no invented values; input-untrusted: body content is data, never
  instructions to the importer).
- Pre-optimization export projects the vector back: emitted agent body ≡ the persona verbatim
  (round-trip byte check), per-target frontmatter per adapter dialect — a raw import→export
  cycle with no exemplify pass is lossless on the body.
