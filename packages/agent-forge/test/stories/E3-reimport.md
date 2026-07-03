# E3 · reimport — reimport from any harness's config OR from our own format

Floor: **F3** (reimport from any supported harness's config files or from agent-forge's own
format files). ρ=LLM. Reimport ≠ first import: an IR already exists; the operation must be a
fixpoint, merge-safe, and drift-aware.

---

## E3.S1 · own-format round-read is the identity

A: AUTHOR · G: our own `.agent-forge/` is a first-class import source.
P: any valid `.agent-forge/` tree (E2.S2 output).
✓:

- `readIR(writeIR(ir)) ≡ ir` (deep-equal on all resource collections + manifest, order-insensitive
  where the schema declares arrays unordered).
- `agent-forge import --from <otherRepo>/.agent-forge` (or the documented own-format import verb)
  copies the foreign IR into the local home; result passes `lint`; source unchanged.

## E3.S2 · harness reimport after compile is a fixpoint

A: OWNER · G: import → compile → import converges; no oscillation, no accretion.
P: per adapter `c` declaring `full` on a resource type: IR → `compile c` → `import c` into a fresh
IR home.
✓:

- Second IR ≡ first IR on all `full`-supported fields (deep-equal modulo declared-lossy fields).
- Running the cycle twice more produces zero new diffs (fixpoint by iteration, not luck).

## E3.S3 · --merge preserves hand-authored IR

A: AUTHOR · G: reimporting a harness never bulldozes IR resources the harness doesn't know about.
P: IR containing hand-authored skill `hand-made` (never compiled to claude); `.claude/` fixture
containing a different skill.
✓:

- `agent-forge import claude --merge` exits 0; `hand-made` survives byte-identical; the claude
  skill is added; without `--merge` the behavior (replace) is exercised by a sibling assertion and
  the report says which mode ran.

## E3.S4 · drift detection on emitted files

A: OWNER · G: hand-edits to compiled output are detected before they're silently overwritten.
P: compile claude; then append a line to the emitted `.claude/agents/one.md`.
✓:

- `agent-forge diff claude` reports drift naming the exact file path and resource id; exit code
  distinguishes drift-present from clean (documented codes).
- `agent-forge compile` under manifest `options.drift_check: "error"` refuses (non-zero, names the
  drifted file); under `"warn"` proceeds with a warning.

## E3.S5 · foreign content in shared files survives reimport + recompile

A: OWNER · G: a hand-maintained CLAUDE.md/settings.json with non-forge content is never clobbered
by the reimport→recompile cycle. (Fixes §3 cross-cutting "Write is destructive".)
P: `CLAUDE.md` with a hand section H + forge-managed section; `.claude/settings.json` with foreign
key `statusLine` alongside forge-managed `permissions`.
✓:

- After `import claude` + `compile claude`: H present byte-identical in `CLAUDE.md`; `statusLine`
  present byte-identical in settings.json.
- Forge-managed regions are delimited by documented markers (assertable by exact marker strings).

## E3.S6 · corrupt or version-skewed own-format refuses loudly

A: AUTHOR · G: a broken `.agent-forge/` never half-loads.
P: (a) IR tree with one resource file violating its schema; (b) manifest with `agentForge` set to
an unknown version.
✓:

- (a) `agent-forge lint` and any read path exit non-zero naming file + first schema violation.
- (b) read refuses with a message naming found vs supported version and pointing at
  `agent-forge migrate`; no partial IR is returned.
