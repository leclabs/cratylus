> **STATUS — a superseded proposal, retained for the part that still stands.**
> Authored in plan mode 2026-08-05; never executed. It sat loose at `plans/` root, which is
> not a place a plan can live: `plan-set.ts` enforces folder-as-state, so a plan is a
> DIRECTORY bearing `PLAN.md`. A bare file there is invisible to `list` and unreachable by
> `retire`. Moved here, which also subjects it to `command-veracity` — `plans/` is exempt
> from the plan-path gate so a retirement plan can name what it retires, and this is not one.
>
> **CLOSED since it was written.** Its §5 ("the evidence base has rotted") is discharged:
> `README.md` and `docs/research/candidates.md` no longer cite a deleted plan, and
> `candidates.md` no longer claims "no discovered anchor" — `latent lexicography` is recorded
> with its admitting standard.
>
> **SUPERSEDED.** Its step 2 prescribes recovering a deleted plan file from git and restoring
> it. The corpus has since ruled twice that `retire` MEANS DELETE, precisely because git
> holds the bytes — a restored record is a second home for something history already has.
> Read that step as evidence of what was wanted, not as an instruction.
>
> **STANDS.** §3 — the isolation condition is re-authored in prose across five cells and
> linked to the instrument by none of them — and the thesis that cold-decode wants a skill
> rather than a hand-built probe per use. Both are unaddressed.

# cold-decode — one instrument, one meaning, one record

> Plan mode. mav holds ~235 uncommitted files in this tree (`anatomy` → `manifest`). Nothing here
> executes until that lands.

## Context

The operator asked for a cold-decode **skill** — encapsulating prompt construction and shell
invocation — after watching four consecutive hand-built probes produce three inadmissible results in
one session. The diagnosis was correct and more general than the local one: every failure was in
**prompt construction**; the isolation worked every time.

Auditing to build it surfaced that the problem is larger than a missing skill.

### 1. The instrument is realized, wired, and dead

A canonical realization exists — `packages/forge/src/validate/oracle.ts` (`decodeCold` L42,
`nonceControl` L76), bound in `packages/canon/src/toolkit/cold-oracle/oracle.ts`, with
`policy.ts` — plus the well-reasoned `cold-oracle.sh` (repo-path guard, keychain-seeded
credentials-only config dir, tool-less, stdin delivery, a debugged prompt).

**`decodeCold` has zero call sites.** The only live invocation is `nonceControl` in
`reader-density.test.ts:705`, gated behind `COLD_ORACLE_LIVE=1` — and it decodes a _nonce_, testing
the isolation, never a corpus fragment.

The `COLD-BLIND` acceptance leg that `MODEL` and `ENGINE` both hang on it is a **regex**:
`packages/forge/src/validate/accept.ts:256`, `coldBlindStatic()`. Its own docstring concedes _"The
AUTHORITY is the live oracle (`oracle.ts`)"_ — which `accept()` never calls.

### 2. `MODEL.md` and its only implementation disagree about what `decode_cold` means

```
MODEL.md:45      decode_cold(f) ≜ decode(f, LLM-priors ∪ Corpus, ∅)    ⟨Corpus ADMITTED⟩
cold-oracle.sh   context_loaded: ∅ (no agents/skills/CLAUDE.md/repo)   ⟨Corpus EXCLUDED⟩
exemplify:13     R_cold ≜ … ⟨zero project-K⟩                            ⟨Corpus EXCLUDED⟩
probe:36         probe(w | ∅) ⟨does w circumscribe carrying ZERO corpus?⟩ ⟨Corpus EXCLUDED⟩
```

`MODEL.md` is internally consistent — `self-sufficient(f)` also grounds in `… ∪ Corpus ∪ LLM-priors`,
and the warm≡cold law quantifies over `K≠∅`, i.e. **session** context. The instrument implements
something strictly stronger than the ground declares, and nobody noticed **because the instrument is
never called.**

These are two different measurements sharing one name — a palimpsest, which `CANONICAL` forbids:

|                | admits          | answers                                                                               | used by                                          |
| -------------- | --------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------ |
| **acceptance** | priors ∪ Corpus | "does this fragment mean the same to a reader who has the corpus but not my session?" | `MODEL`'s `decode_cold`, `verify`, `accept`      |
| **discovery**  | priors only     | "does this sign fire this concept independent of anything we wrote?"                  | `probe`, `signify`, σ\* validation — **unnamed** |

The discovery measurement — the one the entire naming discipline rests on — is the unnamed one.

### 3. The isolation condition is re-authored in prose five times, never linked to the instrument

`cold-oracle.sh:8–18` · `probe/skill.ts:34–41` · `exemplify/skill.ts:13` · `introspect/skill.ts:15` ·
`dimensions/engineering-principles/cold-decode-oracle.ts:3` · plus a sixth wording in the
`enforcing-fragment` findings (a plan record, since retired). Each worded differently, **none
citing the script.** `signify`'s formal block contains no cold-decode term at all — its `fired` is an
undischarged oracle the agent must supply.

That is the duplication: not of code, of **procedure, in prose, at every call site** — the exact
failure mode this project exists to eliminate, occurring in its own instrument.

### 4. Two incompatible rigs, and a second dead LLM-invocation convention

`guardrail/fixtures/turn-600.txt:11` records a rig with **zero flag overlap** with the canonical
script (`--safe-mode --tools="" --setting-sources "" --strict-mcp-config --no-session-persistence
--system-prompt <replaced>`). It produced the discipline-anchor ⊥ ruling that rewrote `README.md`.
The operator's sketch descends from _this_ lineage.

Separately, `packages/canon/src/hooks/stance-guardrail.ts:496` spawns `claude -p` via
`$STANCE_JUDGE_CMD`/`_BIN`/`_MODEL`, defaulting to `haiku`, and calls itself _"intentionally the only
LLM-coupled, non-deterministic part of the system."_ It is not — the oracle is the second, and
neither knows about the other.

**Do not unify their failure policy.** stance-judge is a **gate**: fail-open is correct. cold-decode
is a **measurement**: fail-open is catastrophic — a failed decode that "passes" admits an unverified
name into the canon. Shared factor is the **transport** only.

### 5. The evidence base has rotted, including for the project's own name

- `README.md:14` and `docs/research/candidates.md:7` cited a deleted plan's §Derivation record
  as the warrant for retiring `semantic engineering`. **Both repaired 2026-08-05**: each now
  carries the derivation inline — isolated cold oracle, positive control passed, six distinct
  strings across eight candidate-free runs.
- `VISION.md:157` asserts the project's strongest claim — _"the strongest reverse decode this project
  has recorded"_ — with no record, date, model, or rig cited.
- The sole attestation lives in `.scratchpad/ideation/`, cites `packages/agent-canon/…` (gone), and
  claims an enforcement `accept.ts` does not implement.
- `reader-density.test.ts:45,732` cite `toolkit/cold-oracle/accept.ts` and `residue.ts` — neither exists.

`VISION.md` supplies the standard the corpus is failing: **"an entry without attestation is not an entry."**

## Rulings taken (in-remit, noted for review)

1. **Reconcile the split before encapsulating it.** `MODEL` is apex; `CANON.md` says reconcile **up**.
   So `decode_cold` keeps its corpus-admitted meaning, and the **priors-only discovery measurement
   gets its own sign** — a signify job, run under the very instrument this plan builds (bootstrapped
   with the existing script).
2. ~~**Recover the retired plan file from git** rather than re-deriving.~~ SUPERSEDED — see the
   status header. The contemporaneous record is inlined at each citing site instead, which is what
   `drained(yield(P))` requires and what makes the deletion safe. `VISION.md:157` is **surfaced, not edited** — `CANON.md` forbids unilateral VISION edits.
3. **Pin a reader-population, not a model id**, with a trivial local resolver until the gateway
   exists. Raw model ids are exactly how the current evidence rotted.
4. **Typed probes only — no free-form question.** The interface exposes probe _types_ with fixed
   templates. The four bad rounds this session were all free-form questions; removing the flag makes
   that failure class unrepresentable rather than merely discouraged.

## Design

### Placement is dictated by ARCHITECTURE, not chosen

| concern    | package   | rule (verbatim)                                                           |
| ---------- | --------- | ------------------------------------------------------------------------- |
| meaning    | `canon`   | "Harness-agnostic **and** runtime-agnostic … never how either is carried" |
| mechanism  | `runtime` | "It knows no harness and no corpus"                                       |
| projection | `forge`   | "the only home for harness-specific knowledge"                            |

`decode_cold : fragment → Intent` takes **no harness parameter**, where
`deploy : cell × harness-adapter → Target` does. MODEL already rules cold decode harness-neutral **by
type**. The harness is only the transport that reaches a model — an accident, exactly parallel to
`claude ⟨deploy-accident ⇒ substance-over-accident⟩`.

### Components

**`packages/canon/src/skills/cold-decode/skill.ts`** — new cell. Declares the _meaning_: the probe-type
taxonomy, the answerability precondition, the admissibility law, the attestation schema. Names no
binary; reaches the runner via `runtime: { capability: 'coldDecode' }`, which emits
`scripts/coldDecode.mjs` → `cratylus-run coldDecode` (existing mechanism,
`forge/src/project/runtime-shim.ts`).

**`packages/runtime/src/ports/cold-decode.ts` + `capabilities/cold-decode/claude.ts`** — port and
strategy, mirroring `EventTapHost` / `CarryOnHost`. The harness fact arrives as emitted config via
`emitRuntimeConfig` (`forge/src/deploy/runtime-config.ts`), refusing loudly when unconfigured —
the existing precedent at `event-tap/dispatch.ts:84`.

**`HarnessAdapter` gains one optional member** in `packages/forge/src/core/harness-adapter.ts`,
mirroring the documented narrowest-seam precedent `hookCommand(anchor, workerFilename) → string`.
Optional-member-absent = "this harness cannot" (as `hooks?` / `enforcingSurface?`). **Never a throw** —
named as a past defect in `realization.ts`.

**The decision site** — one function beside `realizationOf` in
`packages/forge/src/project/realization.ts`, returning `{mode, losses}`.

### Isolation maps onto the existing fidelity ladder

`ARCHITECTURE.md` L41–59 already defines the rungs; no new negotiation mechanism is needed:

| rung        | here                                                                                          |
| ----------- | --------------------------------------------------------------------------------------------- |
| **proxy**   | harness isolates natively                                                                     |
| **provide** | it cannot; we isolate — scratch cwd + blanked config dir. **The claude case today.**          |
| **declare** | neither possible ⇒ the read is **warm**: emit the decode, **withhold the cold warrant**, warn |

The reading survives; the _claim_ degrades. That is `face_decl SURVIVES ; face_mech withheld` applied
unchanged.

### Corrections to the sketch

```bash
tmp=$(mktemp -d); cd $tmp; claude -p "`$ARGUMENTS`" --safe-mode
```

1. **The backticks execute the argument.** Probe fragments are full of backticks. **stdin only** —
   which `cold-oracle.sh:74` already does, and for a second reason: `--disallowedTools` is variadic
   and swallows a positional prompt.
2. **`mktemp -d` alone is lukewarm, and lukewarm is indistinguishable from cold.** cwd isolation
   defeats `CLAUDE.md`/`AGENTS.md`; it does **not** defeat the global registry (user CLAUDE.md,
   deployed agents/skills). `principal-ic` would decode to its registry gloss. `cold-oracle.sh` solves
   this with `CLAUDE_CONFIG_DIR` seeded from the keychain.
3. **No population pin** ⇒ non-reproducible; an attestation that cannot be re-run is not evidence.
4. **No attestation emitted.** The deliverable is a _record_, not terminal output.

## Files

| path                                                                              | change                                                                           |
| --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `MODEL.md`                                                                        | reconcile the two measurements; name the discovery one                           |
| `packages/canon/src/skills/cold-decode/skill.ts`                                  | **new cell**                                                                     |
| `packages/canon/src/skills/{probe,signify,exemplify,introspect}/skill.ts`         | **delegate**, boundary-bound `@ cold-decode`, instead of re-describing isolation |
| `packages/canon/src/manifest.ts`                                                  | `RUNTIME_CAPABILITIES` += `'coldDecode'`                                         |
| `packages/runtime/src/ports/cold-decode.ts`, `capabilities/cold-decode/claude.ts` | port + strategy                                                                  |
| `packages/forge/src/core/harness-adapter.ts`, `adapters/{claude,codex}/render.ts` | optional member + declaration                                                    |
| `packages/forge/src/project/realization.ts`                                       | degrade/warn decision                                                            |
| `packages/forge/src/validate/accept.ts:256`                                       | `coldBlindStatic()` → real oracle call                                           |
| `README.md:14`, `docs/research/candidates.md:7`                                   | repoint at the restored record                                                   |
| the retired derivation record                                                     | SUPERSEDED — inline at each citing site (done 2026-08-05)                        |

**Test literals to bump 16 → 17:** `skill-shape.test.ts`, `formal-block-self-sufficiency.test.ts`
(×2), `symbols.test.ts`, `projection-stability.test.ts`.

## Verification

1. **Convicting fixture first** (`gate-convicts.test.ts` law — every corpus-scanning gate owes one):
   a fragment that is _not_ self-sufficient must FAIL the revived `accept()` cold leg. Assert the
   defect is present before asserting the fix.
2. **Isolation control, both directions.** `nonceControl` proves cold (a coined nonce must decode as
   unknown). The **missing** control is the inverse: plant a corpus-only token and assert a _cold_ run
   does NOT recover it, while a _warm_ run does. Without that, lukewarm passes as cold — and _"a
   control that cannot fail is not a control."_
3. **Degrade path**: a stub adapter declaring no isolation must emit the decode, withhold the cold
   warrant, and warn naming harness + what was lost. Exonerating fixture alongside.
4. **Delegation is live**: `grep` that no skill block re-describes the isolation recipe; each
   boundary-binds `@ cold-decode` and resolves under `boundary-binding.test.ts`.
5. `pnpm test --force` (turbo caches; a first green run is not evidence), then `pnpm canon:deploy` and
   `cmp` rendered vs deployed.

## Surfaced for the operator — not mine to take

`VISION.md:157` asserts _"Read blind, with no access to this repository, it returns…"_ and _"the
strongest reverse decode this project has recorded"_, with no record cited, in a **public** repo.
`CANON.md` forbids me editing VISION unilaterally. The inlined derivation record
may or may not be the record it means — if it is not, the strongest claim in the project is
unattested by its own standard.
