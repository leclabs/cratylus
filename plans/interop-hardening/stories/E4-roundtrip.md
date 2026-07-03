# E4 · roundtrip — accurate re-export; losses loud, never silent

Floor: **F4** (import → IR → export preserves semantics; losses surface loudly per the
lossy-translation contract). ρ=LLM. The contract surfaces: `WriteReport.warnings` + `.skipped`,
CLI `--explain`, `--strict`, manifest `options.strict`.

---

## E4.S1 · per-resource semantic round-trip on declared-full support

A: DEV · G: `full` means full — a resource compiled to a full-support target and lifted back is
semantically the resource.
P: for every (adapter, resourceType) pair the adapter declares `full`: a fixture resource
exercising every schema field of that type.
✓:

- `import(compile(r)) ≡ r` field-for-field (schema-defined fields; array order per schema).
- Test matrix is generated from the adapters' own capability declarations — adding a `full`
  declaration without a passing round-trip fixture fails CI (the declaration is the test oracle).

## E4.S2 · lossy field drops are named, per loss

A: FLEET · G: every dropped field/resource is enumerated; no aggregate hand-wave.
P: IR skill with `allowed_tools` + files; compile to a target declaring `partial` skill support
that drops `allowed_tools`.
✓:

- `WriteReport.warnings` contains an entry naming {resource id, field `allowed_tools`, target};
  `compile --dry-run --explain` prints it; `compile --strict` exits non-zero citing the same
  entry.
- Zero-warning compiles print nothing loss-related (no noise floor that trains users to ignore).

## E4.S3 · capability declarations equal documented reality

A: DEV · G: the support matrix (`full`/`partial`/`none`) is honest against RETURN §1/§2 ground
truth. (Research-driven: §3 shows several stale `none`s — cursor/opencode/cline/copilot commands,
opencode agents, cline skills, crush hooks.)
P: a ground-truth table transcribed from RETURN §1 (per adapter × resource: present/absent).
✓:

- For every adapter: declared `none` ⇒ ground-truth absent; ground-truth present ⇒ declared
  `full|partial`. Any mismatch fails naming (adapter, resource, declared, truth).
- Specifically green after fix: opencode agents+commands [OC2][OC4], cline skills+workflows
  [CL4][CL5], cursor commands+agents [CU3][CU6], copilot prompts+agents [CP1][CP5], crush hooks
  [CR3], continue prompts [CT3].

## E4.S4 · canonical event taxonomy round-trips

A: DEV · G: hook events map target-ward and back to the same canonical event; unmappables are
skipped by name.
P: per adapter: one IR hook per canonical event (28).
✓:

- For every adapter-supported event: `toNative(toCanonical(e)) = e` and the emitted native name is
  the documented dialect name (case/format exact: camelCase for copilot [CP4], snake_case for
  windsurf-class, PascalCase for claude/codex).
- Every unsupported event appears in `.skipped` with the canonical name; count(supported) +
  count(skipped) = 28.
- Fabricated events are gone: cline `TaskComplete`/`PreCompact` [CL2], copilot PascalCase set
  [CP4], codex `PermissionRequest` [CX4].

## E4.S5 · matcher semantics translate or warn — never silently reinterpret

A: OWNER · G: a hook matcher keeps its meaning across dialects.
P: IR hook with regex matcher `^Bash$`; targets: claude (regex [CC6]), gemini (regex [GM4]),
crush (regex [CR3]), cursor (regex-class [CU2]), cline (no matchers [CL2]).
✓:

- Regex-dialect targets receive the pattern verbatim; capability metadata declares `regex` (the
  shipped `glob` declarations are corrected — §3 claude d3, cross-cutting).
- cline emission warns `matcher-unsupported` and emits the hook unconditionally-or-skipped per
  its declared behavior — the choice is declared, tested, and reported, not implicit.

## E4.S6 · cross-harness relay conserves semantics minus enumerated losses

A: FLEET · G: A→IR→B→IR→A ends where it started, and the loss ledger explains any delta.
P: claude fixture (E1.S1) → import claude → compile opencode → import opencode → compile claude.
✓:

- Final `.claude/` output ≡ a direct compile of the original IR, except fields listed in the
  accumulated warnings/skips of the two legs; the symmetric diff of outputs is a subset of the
  reported-loss field set (machine check: diff fields ⊆ reported fields).

## E4.S7 · shared-core IR compiles everywhere warning-free

A: AUTHOR · G: an author who stays inside the portable core gets 10/10 clean targets.
P: IR using only: plain rules (no activation metadata), spec-core SKILL.md fields
(name/description/body per [S3]), stdio mcp `{command,args,env}`, no hooks.
✓:

- `agent-forge compile` (all 10 targets) exits 0 with zero warnings and zero skips.
- The "portable core" field set is documented and the fixture is generated from that
  documentation (doc drift breaks the test).
