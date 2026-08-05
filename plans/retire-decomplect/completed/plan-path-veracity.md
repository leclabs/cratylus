# plan-path-veracity — a cited plan path must resolve

> Filed as a STUB (symptom + locus + provenance, no census, no acceptance) on 2026-08-05 from
> `96fde8e8`, while executing `retire-decomplect`. Specified and executed 2026-08-05; the spec below
> is the one the stub was owed, authored on promotion.

**Symptom (as filed).** live sources cite paths inside long-retired plans and nothing gates it

**Locus (as filed).** At least eight citations across five plans retired before `decomplect`, none of
which resolve. The filed count was a floor measured without an exhaustive sweep; the census below
found **thirteen** across **six** plans, and the stub's own locus missed seven of them.

## Intent

`retire` MEANS DELETE, so every retirement mints a class of false assertions: a live source that
cited `plans/<plan>/…` as the warrant for a claim now points at nothing. The class is worse than a
dead `pnpm <script>`, which fails loudly the first time a reader tries it — a dead path is found only
by the reader who went looking for the evidence, the one doing the right thing. Nothing in the corpus
read a path citation and asked whether it resolves.

Land the gate, repair every standing citation, and settle the scope question the stub deferred.

## Census

Thirteen live citations, six retired plans. The seven the stub's locus missed are marked ✱.

| site                                             | cited                                                   |
| ------------------------------------------------ | ------------------------------------------------------- |
| `README.md:15`                                   | `plans/discipline-anchor/PLAN.md`                       |
| `docs/research/candidates.md:7`                  | `plans/discipline-anchor/PLAN.md`                       |
| `docs/claude-agents-md-assumption.md:15`         | `plans/interop-hardening/completed/standards-compat-…`  |
| `docs/release-audit-checklist.md:4`              | `plans/interop-hardening/completed/harness-landscape-…` |
| `packages/memory/README.md:51`                   | `plans/scoped-memory-v2/SPEC.md`                        |
| `packages/runtime/src/ports/provisional-v9.ts:5` | `plans/close-out/pending/V9-heartbeat-mechanism.md`     |
| ✱ `packages/memory/src/audit.ts:11`              | `plans/scoped-memory-v2` (SPEC D1/D5)                   |
| ✱ `packages/memory/src/fold.ts:5`                | `plans/scoped-memory-v2` (SPEC D4)                      |
| ✱ `packages/memory/src/lock.ts:15`               | `plans/scoped-memory-v2` (SPEC D5)                      |
| ✱ `packages/memory/src/node.ts:12`               | `plans/scoped-memory-v2` (SPEC D3)                      |
| ✱ `packages/memory/src/record.ts:5`              | `plans/scoped-memory-v2` (SPEC D2)                      |
| ✱ `packages/memory/src/migrate.ts:12`            | `plans/memory-model-redesign`                           |
| ✱ `packages/memory/src/session.ts:16`            | `plans/run-the-business`                                |

The miss has one cause: the stub looked for `plans/<plan>/<file>`, and the seven it dropped are bare
plan DIRECTORIES with no file. Over half the class has that shape, which is why the gate's reach leg
now asserts BOTH shapes are matched.

## Constraints

- **Repair ≠ re-point.** A retired plan's bytes are in git, which is precisely WHY deletion is legal
  — but a live source that leans on git history has moved its dangle one indirection out, not closed
  it. Repair means the claim stands on its own: the citation's cargo inlined, or the claim withdrawn.
  Deleting the path and leaving a dangling sentence is not repair either.
- **One walk.** `command-veracity` already walks every tracked file a reader could act on today. The
  second law rides that walk; a second walk lets one scope ruling come apart into two.
- **The two guardrail fixtures are OUT, and not by an allowlist.** They are recorded turns — verbatim
  transcriptions. A closed record's citations are HISTORY: the turn really did say that, at a time
  when the path really did resolve, and rewriting one falsifies the record. (This corpus has already
  paid for that: a sweep earlier the same day rewrote a held-out fixture explicitly labelled as the
  verbatim deleted source, turning evidence into a restatement of the present.) A path allowlist rots
  the moment a third fixture directory lands, so the discriminator must come from what the files ARE.

## Rulings taken

1. **The closed-record discriminator is the CAPTURE BANNER.** `stance-guardrail.sh` writes every turn
   payload it hands the judge under a fixed banner, and the tracked fixtures are those payloads
   byte-identical. A file that OPENS with that banner is a verbatim transcription. The exemption
   therefore keys on a fact the PRODUCER controls, not on a directory the next author controls: a
   third fixture dir is spared automatically, a `.txt` that is prose is gated automatically, and a
   rename from `.txt` to `.md` changes nothing. The banner literal is held to `stance-guardrail.sh`'s
   own text by a leg, so the discriminator cannot rot silently — if the producer stops writing it the
   gate says so, instead of quietly recognising nothing.
2. **The `plans/` subtree is out of the plan-path law, for the property.** It is the record system
   whose own lifecycle DELETES plan directories. A retirement plan must be able to name the directory
   it retires; a gate that forbids naming a path in order to delete it forbids the mechanism from
   documenting itself. The class this law names is a citation that ESCAPED that system into a source
   with no other warrant. `command-veracity`'s scope is unchanged — `plans/` stays gated for command
   citations, where no such argument applies.
3. **REACH is measured on MENTIONS, not citations.** The corpus's honest steady state is zero live
   citations, so a reach leg counting citations would read green for having looked at nothing the day
   the corpus went clean. `planPathMentions()` scans every tracked text file with no exclusion at all.
   That is what separates "found nothing" from "clean".
4. **A metavariable, a glob and a foreign-tree path are not paths.** `plans/<plan>/<state>/`, a
   `plans` glob segment, `plans/[^/]+` inside a sed program, and `<target>/plans/founding/` (what
   `deploy` writes into someone else's repo) name nothing this tree can resolve. The matcher takes
   only fully LITERAL, repo-relative segments. `plans/.retired/` falls out of the same rule — a dot
   segment is not a plan directory, and the corpus names it precisely to say it no longer exists.

## Inputs

`packages/canon/test/command-veracity.test.ts` ·
`packages/canon/src/toolkit/guardrail/stance-guardrail.sh` ·
`packages/canon/src/toolkit/guardrail/fixtures/` · `packages/canon/src/toolkit/plan-set.ts` ·
`packages/canon/src/toolkit/plan-states.ts`

## Outputs

`packages/canon/test/command-veracity.test.ts` · `README.md` · `docs/research/candidates.md` ·
`docs/claude-agents-md-assumption.md` · `docs/release-audit-checklist.md` ·
`packages/memory/README.md` ·
`packages/memory/src/audit.ts` · `packages/memory/src/fold.ts` · `packages/memory/src/lock.ts` ·
`packages/memory/src/migrate.ts` · `packages/memory/src/node.ts` · `packages/memory/src/record.ts` ·
`packages/memory/src/session.ts` · `packages/runtime/src/ports/provisional-v9.ts` ·
`plans/retire-decomplect/PLAN.md` · `plans/retire-decomplect/completed/plan-path-veracity.md`

## Acceptance

1. `planPathCitations()` is empty over the live tree, and the leg reporting it names file, line and
   path on failure.
2. The reach leg finds more than eight plan-path MENTIONS across `md`, `ts` and `txt`, and across
   BOTH shapes (a path to a file, and a bare plan directory). It must RED under a narrowed matcher.
3. A convicting fixture plants a citation to a non-existent plan path, asserts the defect is present
   before reading the result, and convicts that one and ONLY it — the shape, the foreign-tree path,
   the dot-directory and a real plan all pass. Its positive case is DERIVED from the plan set, never
   pinned to a plan name: a pinned name goes stale at that plan's retirement, which is the very event
   this law exists to survive.
4. The closed-record discriminator is proven in BOTH directions on the real fixture's real bytes —
   the recorded turn passes while carrying a citation asserted dead, and the SAME bytes with the
   banner stripped are convicted on that same path.
5. The banner literal is held to `stance-guardrail.sh`'s own text.
6. `pnpm verify` and `pnpm typecheck:test` green.

---

# RETURN

**Accepted.** `pnpm verify` (build · lint · oracle · test) and `pnpm typecheck:test` green. The
render oracle did NOT move.

**The gate.** Two laws, one walk. `authoredLines()` is now the single traversal — every in-scope,
non-transcript tracked file, line by line, carrying the fence and whole-file-is-code facts a matcher
needs about voice. `citations()` (commands) and `planPathCitations()` (plan paths) both read it;
neither walks the tree again. `inScope` gained `.txt`, which is what puts the recorded turns IN scope
by path so the content discriminator has a live subject instead of hiding behind an extension filter.

**Proven RED before green.** Before repair the live leg convicted exactly the thirteen sites above,
by name, while the reach, discriminator and control legs were already passing — so the failure was
the corpus, not the gate. Two mutations were then run against the finished gate:

- narrowing the walked text set back to its old extensions (dropping `.txt`) reds three legs — the
  reach leg loses `txt`, the discriminator leg loses its subject, and the banner-coupling leg finds
  no records at all;
- narrowing the matcher to require a file extension on the path — the narrowing that would have
  reproduced the stub's own miss — reds the bare-directory shape assertion.

**The six filed repairs, and what each now says.**

- `README.md` — the ⊥ record's substance is inlined: an isolated cold oracle (tool-less,
  project-blind, cwd outside the repo, harness env block stripped), a positive control that passed,
  a candidate-free negative control returning six distinct strings across eight runs at mode 3/8 on
  one model, and both existence-question runs answering "no established term".
- `docs/research/candidates.md` — the stale half is fixed as well as the dangle. The file claimed the
  discipline had "no discovered anchor", which stopped being true on 2026-08-05. It now dates that
  state, records `latent lexicography` and the standard that admitted it, and states the
  contents-title as the standing rule rather than a stopgap.
- `docs/claude-agents-md-assumption.md` — the three ledger keys are replaced by the primary URLs they
  resolved to, with the audit date. The record needs nothing but itself.
- `docs/release-audit-checklist.md` — each row IS the contract sheet now, and the bracketed marks are
  defined on the page as audit marks, not links: re-verification re-fetches the harness's own docs,
  never an intermediate ledger.
- `packages/memory/README.md` — the claim was doubly false (the SPEC is deleted AND its route set was
  superseded; there is no `packages/memory/AGENTS.md` either). It now names the one live home per
  half: `src/node.ts`, `src/route.ts`, and the `dream` / `wake` cells.
- `packages/runtime/src/ports/provisional-v9.ts` — the capability is STATED in the header instead of
  cited: an endogenous pulse on a cadence that SAMPLES a pressure gate to decide whether a cognitive
  cycle runs, never CLOCKS one. The dead `heartbeat-organ O4` reference went with it; `⊥` remains a
  legal answer, and the header now says what a ⊥ implies — the provisional path stands, no coinage
  licensed.

**The seven the stub missed** are all `memory` docstrings whose prose already carried the substance,
so each repair removes a provenance parenthetical and, where the deleted section id was load-bearing,
points at the live in-tree home instead (`route.ts` for the store set, `node.ts` for the resolver's
totality).

**Left standing, deliberately.**

- `plans/i-m-putting-you-into-pure-nova.md` — an unexecuted plan-mode document at the `plans/` root
  (not a plan directory: it bears no `PLAN.md`) carrying five dead citations to `discipline-anchor`
  and `decomplect`. Out of scope by ruling 2, and its §5 is a self-declared rot report whose own
  content is now partly stale — the ⊥ it describes is closed, and `discipline-anchor` was never
  restored. It is the operator's artifact and wants a ruling, not a sweep.
- `memiso-0…3` — eighteen sites across `packages/memory` cite shard ids from the retired
  `run-the-business`. Not a path, so not this law's subject, and by now a coherent local vocabulary.
  It is a separate class: a dead SHARD-ID citation, with no gate.
