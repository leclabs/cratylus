# B1 — koine-deep-rename

**State:** ready · **Lead:** Mav · **Phase:** B (machinery) · **Source:** Mav's founding flag #1

## Intent

Close the rename the founding import stopped short of, so koine is a coherent whole — not a
buildable-but-incoherent intermediate that invites `agentir` to be cargo-culted into new code.

## Done at founding (already shipped in e28f69b)

- npm scope `@leclabs/agentir*` → `@leclabs/koine*` (names, deps, import specifiers — uniform).
- CLI bin `agentir` → `koine`.

## Remaining (this task)

- The CLI **command literal** and help/usage strings still say `agentir`.
- The **`.agentir/` directory convention** (the IR home a project scaffolds) → `.koine/` (or the
  polis-decided convention — settle with the culture→IR bridge, B4).
- **DESIGN.md / README / CONTRIBUTING** prose under `packages/koine/**` still says agentir.
- Any internal identifiers, env vars, or doc references.

## Sequencing

**First in koine's queue.** No feature work on koine (B3/B4) until this lands — the rename must be a
closed set. Mav leads; this is mechanical-but-pervasive, suited to a careful global pass + test gate.

## Done-when

- `grep -ri agentir packages/koine` returns nothing load-bearing (only historical changelog entries, if any).
- koine build + tests green; `koine --help` is self-consistent.
