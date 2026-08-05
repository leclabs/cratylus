# N1 · derivation record — CLI brand anchor · event-tap verb pair

**Status.** Complete. Two derivations run to terminal verdicts under one uniform criterion.
No code written, no name changed. `packages/` untouched.

**Verdicts up front.**

| derivation                | verdict                                                                                              |
| ------------------------- | ---------------------------------------------------------------------------------------------------- |
| **D1 · CLI brand anchor** | **⊥** — no σ\*. Not "not yet"; the concept does not circumscribe a name.                             |
| **D2 · event-tap verbs**  | **`install` · `uninstall` · `read` · `status`** — converged. `remove` refuted 14/14; `inspect` 0/14. |

D1's ⊥ is a finished result. It is **not** a deferral and must not be rescued by preference. The
diagnostic (§D1.6) says _why_ the priors do not converge there, and it changes what should be asked
next — the question as posed is mis-formed, not merely under-answered.

---

## 0. The instrument

`cold-decode-oracle` requires `decode_cold(f)` at **zero project-K**. The previous D1 run did not
have that, and this is measurable.

**Contamination found and eliminated.** A `claude -p` invocation launched from any cwd on this host
loads `~/.claude/CLAUDE.md`, which names `cratylus`, **`forge`** (twice, as
`cratylus deploy`), `@leclabs/invoke`, `agent-toolchain-bootstrap`, `leclabs`. Verified by
direct probe — the oracle enumerated all of them verbatim. Any trial run through the ordinary
subagent path or an ordinary headless call is therefore **warm**, and warm on exactly the token that
dominated the failed run. **`forge`×2 in the prior six trials is fully explained by prompt-borne
priming.** That result should be treated as void, not as evidence.

**The cold rig actually used** (`/tmp/cold-oracle/run.sh`):

```zsh
P="$(cat "$1")"
TOK="$(security find-generic-password -s 'Claude Code-credentials' -w | …accessToken)"
cd /tmp/cold-oracle/cwd
CLAUDE_CODE_OAUTH_TOKEN="$TOK" HOME=/tmp/cold-oracle/home \
  claude -p "$P" --model opus --tools "" < /dev/null
```

- `HOME` → an empty tree holding only `.claude/settings.json = {}` ⇒ **no user CLAUDE.md, no hooks,
  no skills, no agents, no memory, no project config**.
- cwd → an empty neutral dir ⇒ no project `CLAUDE.md` / `AGENTS.md`.
- Token passed by env (read from Keychain) because HOME-relocation otherwise deauthenticates. Never
  written to disk.
- `--tools ""` ⇒ the oracle cannot read a file, grep, or search. It answers from priors alone.
- Each trial is a **separate process with a fresh context**. Independence is structural.

**Coldness verified, not assumed.** The same probe re-run under the rig returned only
harness-intrinsic nouns (model ids, built-in skill/agent names, `gh`, `/tmp/cold-oracle/cwd`).
**Zero occurrences of `cratylus`, `forge`, `leclabs`, `@leclabs/*`.**

**Candidate-free throughout.** No trial prompt contains a candidate, a shortlist, or a hint of one.
Every prompt asks for recall from a differentia and forbids alternatives.

**API 529 handling.** `Overloaded` responses are **not** results. Each was discarded and the trial
re-run to completion. Discarded: D1-A ×1, D1-B ×3, D1-C ×3, D1-D ×1, D2-A ×1, D2-B ×1. Only trials
that returned a token are tallied.

### 0.1 The convergence criterion — declared, and applied identically to both

`σ*(c) ≜ argmin_{n : circ(n,c)} ⟨|n|, n⟩`. Convergence is claimed **iff all three hold**:

- **C1 · paraphrase-invariance.** The modal sign stays modal under _every_ independent framing of
  the same referent. This is the load-bearing test: `circ(n,c)` is a relation to the **concept**, so
  a sign that tracks the _description_ is measuring the prompt, not `c`.
- **C2 · plurality.** Modal share ≥ 50 % pooled across framings.
- **C3 · neighbourhood.** Non-modal answers are near-synonyms of the mode, not a scatter of genera.

Strict unanimity is rejected as a criterion: it is unreachable for any minting task by construction,
so it would make σ* underivable and contradict the axiom that σ* exists. C1 replaces it, and C1 is
strictly harder to game — a framing-echo passes unanimity within one framing but fails C1 flatly.

**Both derivations were scored against this before either result was known.** D2 passes; D1 fails on
C1 and C2 both.

---

## 1. Positive controls — the instrument works

Same rig, same prompt shape (recall a sign from a differentia, candidate-free), on concepts with
known uncontested signs.

**PC1 · a short bin sign from a differentia.** Definiendum: a self-contained pipeline filter reading
a common text interchange format on stdin, applying a small purpose-built expression language,
writing the same format to stdout; short name marking it as that format's member of the terse
`sed`/`awk` family. Answer expected: `jq`.

| trial | answer |
| ----- | ------ |
| PC1-1 | `jq`   |
| PC1-2 | `jq`   |
| PC1-3 | `jq`   |

**3/3.** The instrument produces a converged short executable-shaped sign from a differentia alone.

**PC2 · a symmetric verb quartet from a differentia.** Definiendum: a Linux service manager's four
operations — run now / exact undo / run at every boot via persistent config / exact undo. Answer
expected: `start` `stop` `enable` `disable`.

| trial | answer                            |
| ----- | --------------------------------- |
| PC2-1 | `start` `stop` `enable` `disable` |
| PC2-2 | `start` `stop` `enable` `disable` |
| PC2-3 | `start` `stop` `enable` `disable` |

**3/3, both pairs, correct order.** The instrument resolves verb sets _and_ pair symmetry.

**Controls pass. The run is valid.** Whatever D1 returns, it is not an instrument failure — the same
rig recovered `jq` and `start/stop/enable/disable` at 100 %.

---

## 2. D1 — the CLI brand anchor

### 2.1 The referent, read from source (not paraphrased from the dispatch prompt)

- `packages/invoke/src/bin.ts` — the installable bin. Exists because capability resolution was
  ambient; it declares both the runtime and the capability packages and wires them by static import.
  `BIN = 'runtime'` (line 22).
- `packages/runtime/src/main.ts:16-17` — the bin name is **self-documented as a placeholder**;
  `BIN` at line 30. `cac` owns branding + `--help`/`--version`; the `<capability> <verb>` stream is
  explicitly **not** a fixed cac command table.
- `packages/runtime/src/loader.ts:33` — `CAPABILITIES = ['memory','eventTap']`, an open
  install-discovered keyspace; `RuntimeHost.register` folds plugins into a capability→binding index
  and fails loud on re-claim.
- `packages/runtime/src/plugin.ts` — `RuntimePlugin` is standalone, deliberately decomplected
  from the build host's `AgentPlugin`; addressing is by imported binding, never a string id.
- `packages/forge/src/project/runtime-shim.ts` — the shim is `spawnSync('runtime',
[capability, ...argv])`, pure `f(capability)`, zero cross-package imports. **The bin name is a
  permanent per-machine address**: change it and every deployed shim breaks.

Confirmed: this is the **runtime host bin**, a dispatcher over an open plugin-contributed capability
space, explicitly not the build host.

### 2.2 The four definienda

The single correction demanded by the prior failure was _full differentia_. That was supplied — and
then, because a differentia can only be stated in _some_ words, it was supplied **four times in four
independent framings of the same referent**, so C1 could be tested at all. Full texts:
`/tmp/cold-oracle/d1.txt`, `d1b.txt`, `d1c.txt`, `d1d.txt`.

| framing | stance                                                              | how the routing act is described                                                                                                                                                         |
| ------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A**   | full differentia, forwarding-framed                                 | "_hands the typed capability word and the rest of the line to whichever installed package claims that word_"; shims are "forwarder scripts" that "pass their arguments straight through" |
| **B**   | paraphrase of A, forwarding vocabulary removed                      | "_resolves the typed capability word against them, invoking whichever package provides that capability with the remainder of the line_"                                                  |
| **C**   | reach-framed; the shim is **explicitly excluded** as a wrong answer | "_the single named point at which every capability on that machine is reached_"; "holds the machine's live register … looks the typed word up in that register and runs it there"        |
| **D**   | flat fact list, metaphor stripped                                   | bullet facts only: "given a capability word, it locates the installed package that provides that capability and gives it the remainder of the argument line"                             |

Every framing carries the same load-bearing negatives verbatim in substance: never builds/compiles/
packages/generates/deploys; a separate program with a separate name does the authoring on a
developer workstation; defines zero verbs of its own; open capability set; permanent per-machine
address; the two current capabilities described without their project names.

### 2.3 Raw trials — 31 valid

**Framing A** (forwarding-framed), 8 valid:

| #   | sign          | oracle's stated reason                                                                                                  |
| --- | ------------- | ----------------------------------------------------------------------------------------------------------------------- |
| A1  | `relay`       | "receives a capability word and passes the line on untouched — a fixed hand-off station, not a dispatcher owning verbs" |
| A2  | `dispatch`    | "resolves a capability word to an installed handler and hands off, owning no verbs — unlike build-flavored rivals"      |
| A3  | `relay`       | "purely passes the line onward to whichever package claims the word"                                                    |
| A4  | `relay`       | "forwards a typed capability word to whichever package claims it, owning nothing"                                       |
| A5  | `relay`       | "a fixed station that receives a name and passes the line on unchanged; unlike hub, it originates nothing"              |
| A6  | `relay`       | "owns no message, only forwards it to whoever claims it; 'dispatch' implies issuing commands, 'forge' implies building" |
| A7  | `switchboard` | "a fixed local address that owns no verbs, only connects each capability word to whichever installed line claims it"    |
| A8  | `relay`       | "passes the capability word onward untouched"                                                                           |

→ `relay` 6 · `dispatch` 1 · `switchboard` 1

**Framing B** (paraphrase), 9 valid:

| #   | sign       | reason                                                                                               |
| --- | ---------- | ---------------------------------------------------------------------------------------------------- |
| B1  | `relay`    | "only passes the invocation through to whichever capability answers"                                 |
| B2  | `relay`    | "hands the line to whichever capability package answers; implies no authority, no work, no building" |
| B3  | `relay`    | "a fixed station that hands the line onward to whoever runs next"                                    |
| B4  | `relay`    | "forwards the line to whichever capability package owns it"                                          |
| B5  | `steward`  | "the machine's resident delegate that answers by capability and hands off"                           |
| B6  | `relay`    | "a fixed station that forwards traffic onward, owning none of it"                                    |
| B7  | `usher`    | "a fixed doorman that only shows requests to the right installed capability"                         |
| B8  | `dispatch` | "exactly resolving a capability word to its installed provider"                                      |
| B9  | `relay`    | "a fixed hand-off station that forwards lines to installed capabilities"                             |

→ `relay` 6 · `dispatch` 1 · `steward` 1 · `usher` 1

**Framing C** (reach-framed, shim excluded), 8 valid:

| #   | sign     | reason                                                                                                              |
| --- | -------- | ------------------------------------------------------------------------------------------------------------------- |
| C1  | `invoke` | "names the one act it performs — reaching a capability by name"                                                     |
| C2  | `via`    | "names pure passage — capabilities are reached through it"                                                          |
| C3  | `use`    | "`use memory get` reads naturally"                                                                                  |
| C4  | `wield`  | "an existing English verb for exercising a capability … implies use, not construction"                              |
| C5  | `invoke` | "names reaching a registered capability by name and running it"                                                     |
| C6  | `invoke` | "names the single act of reaching a capability, defines no verbs itself"                                            |
| C7  | `invoke` | "names the act of reaching a registered capability by name, owning no verbs itself"                                 |
| C8  | `invoke` | "plain English for calling a named capability; `run`/`exec` imply you supply the executable, not a registry lookup" |

→ `invoke` 5 · `via` 1 · `use` 1 · `wield` 1 · **`relay` 0**

**Framing D** (flat facts), 6 valid:

| #   | sign    | reason                                                                                                                    |
| --- | ------- | ------------------------------------------------------------------------------------------------------------------------- |
| D1  | `cap`   | "names the only thing it knows — capabilities; rival `agent` overclaims, since it runs nothing itself"                    |
| D2  | `cap`   | "`cap <capability> <verb>` names its only concept"                                                                        |
| D3  | `agent` | "names the constant (agent runtime host), not the shifting capability set"                                                |
| D4  | `agent` | "grammar reads `agent memory get`; it serves agents rather than controlling a daemon"                                     |
| D5  | `agent` | "names the runtime front door agents call … this owns no verbs — pure delegation"                                         |
| D6  | `agent` | "names the runtime dispatcher every agent machine hosts; `forge`/`build` is already the separate artifact-producing tool" |

→ `agent` 4 · `cap` 2 · **`relay` 0**

**Pooled (n = 31):** `relay` 12 (39 %) · `invoke` 5 · `agent` 4 · `cap` 2 · `dispatch` 2 ·
`switchboard` 1 · `steward` 1 · `usher` 1 · `wield` 1 · `use` 1 · `via` 1.

### 2.4 Verdict — ⊥

| criterion                    | result                                                                                                                                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **C1 paraphrase-invariance** | **FAIL, decisively.** Modal sign by framing: A `relay` 75 % · B `relay` 67 % · C `invoke` 63 % · D `agent` 67 %. The A/B mode scores **0/14** under C and D. Four faithful descriptions of one referent yield four modes. |
| **C2 plurality**             | **FAIL.** 12/31 = 39 % < 50 %.                                                                                                                                                                                            |
| **C3 neighbourhood**         | **FAIL.** Three disjoint neighbourhoods: _conduit-of-traffic_ (relay · dispatch · switchboard · usher · via) · _act-of-reaching_ (invoke · use · wield) · _the-domain-noun_ (agent · cap).                                |

**σ\*(c) is undefined. D1 = ⊥.**

This is a **stronger** ⊥ than the prior run's. The prior run scattered because the definiendum was
thin and warm. This one carried the full differentia, ran cold, and still scattered — and scattered
in a _legible_ pattern that identifies the cause.

Note also the trap that was avoided: framings A and B, taken alone, look like convergence (`relay`
6/8 and 6/9, rivals in one neighbourhood, C2 and C3 both satisfied). Had the protocol stopped at six
trials in one phrasing — as the prior run did — this record would be reporting `relay` as the anchor.
It would have been wrong. **The paraphrase test is what separated a discovered sign from an echo of
the author's own prose.**

### 2.5 Collision checks (carried out for the record; ⊥ means none is load-bearing)

PATH probe on this host — `relay · invoke · cap · via · use · agent · rig · forge · dispatch ·
switchboard · usher · steward · wield · tap`: **none resolves.** Note this **contradicts the carried-
forward datum that `forge` is on PATH twice including Foundry** — not reproducible here. That datum
is unverified as recorded; irrelevant to this verdict, flagged so it is not re-cited as measured.
`rig`'s recorded non-collision is consistent with this probe.

Real-CLI collisions on the top candidates, verified:

- **`invoke` — hard collision.** [pyinvoke](https://www.pyinvoke.org/) ships `invoke` (and `inv`) as
  console scripts; widely installed on any Python dev box.
- **`cap` — hard collision.** [Capistrano](https://github.com/capistrano/capistrano) ships `cap` as
  its command-line client.
- **`agent` — genus, not a sign.** The oracle's own D3/D5 rationales gloss it as "the agent runtime
  host" — it names the _domain_, not this program, and is unusable beside an `@leclabs/agent-*`
  scope where everything is an agent-something.
- **`relay` · `dispatch` · `via` · `use`** — no bin collision measured; npm names all occupied as
  unscoped packages (irrelevant: our packages are `@leclabs/*` scoped, so the constraint is the PATH
  word, not the registry name).

Every framing's modal answer either collides with a shipped CLI (`invoke`, `cap`) or is the genus
(`agent`) or is a framing echo (`relay`). No survivor.

### 2.6 Diagnostic — why the priors do not converge here

The scatter is not noise and not under-specification. It has a mechanism.

**The referent has no positive content.** Enumerate its differentia and every item is one of three
kinds:

1. **negative** — not the build host; not the shim; builds nothing, compiles nothing, deploys
   nothing; defines zero verbs; defines zero capabilities;
2. **positional** — one stable name per machine; the point other things are reached through;
3. **borrowed** — its only substance (`memory`, `eventTap`) belongs to the packages it routes to and
   changes as they are installed and removed.

Nothing is left that is _its own_. `main.ts` is 92 lines of which the operative part is: read argv,
look up a binding, hand over the rest, mirror the exit code.

Under `signify`, `circ(n,c) ⇔ fired(n) = D(c)`. Here `D(c)` is not a set of identity-criterion atoms
— it is a **slot in a structure**. So `fired(n)` cannot match it, and what the oracle matches instead
is whichever _aspect of the slot_ the description happened to foreground:

- foreground the passage of the line → the conduit family (`relay`, `switchboard`, `via`)
- foreground the arrival at a capability → the reaching family (`invoke`, `use`, `wield`)
- foreground nothing at all, just the facts → the domain noun (`agent`, `cap`)

The sign is a function of the description. That is the signature of a concept that is not there.
Cratylism's precondition — _a real, stable concept in the latent space_ — **is not met**. `mint(c)`
here would not be composition, it would be fiat with a rationale attached.

**Therefore ⊥ is the correct terminal answer, and re-running D1 with a fifth framing is not owed.**
A fifth framing will return a fifth mode. The failure is not in the wording.

### 2.7 What this changes (not a name; a question)

The instrument's testimony is that **the dispatcher is not the thing to name.** Three consequences,
all reversible, none coining:

- **The placeholder is doing its job and should keep doing it.** `runtime` is _descriptive of
  the slot_ — which is exactly what a slot admits. It is the honest form of an ⊥, and the plan
  already routes the name-free work through V5 without it.
- **The gate should probably move.** If the concept is a slot, the naming question that _is_ well
  formed is not "what is this dispatcher called" but one of: (a) the **product/org brand**, which is
  legitimately conventional rather than natural and therefore _outside_ cratylism's remit — a brand
  is chosen, not discovered, and the axiom does not bind it; or (b) the **capability words**, which
  do have positive content (`memory`, `eventTap`) and would derive normally, as D2 just did.
- **Framing D's answers are the useful residue.** Stripped of metaphor the oracle twice reached for
  `agent` and once glossed it "the agent runtime host" — unprompted, cold, with zero project-K. The
  priors do sit in the `agent-*` family. That is not a licence to name; it is evidence that the
  current placeholder is not _wrong_, merely not _derived_, and a brand decision (not a derivation)
  is what would settle it.

**Recommendation:** keep the gate closed on a _derived_ anchor, and surface to the operator that the
item as filed is mis-posed — a brand is owed a decision, not an oracle. Publishing stays blocked
either way (§PLAN `publish flags`), because publishing under any name burns the PATH word.

---

## 3. D2 — the event-tap verb pair

### 3.1 The referent, read from source

- `packages/runtime/src/capabilities/event-tap/dispatch.ts:21` —
  `TapVerb = 'install' | 'remove' | 'read' | 'status'`, `VERBS` set at :30, routed at :96-113.
- `packages/runtime/src/ports/event-tap.ts:51-56` — `EventTapHost` methods `installTap`,
  `removeTap`, `readCapture`, `status`. The verbs mirror these 1:1. **Never derived.**
- The port is passive by contract (:15-18, :80-84): observes, cannot block/deny/mutate.
- `main.ts:79` routes both `tap` and `eventTap` here — the typed word is public surface.
- House convention: `packages/canon/src/toolkit/continuity/continuity-hook.sh:8-12,19,24,34`
  — `{install|uninstall|status}`, with `install|on|true` / `uninstall|off|false`. The `install`/
  `uninstall` pair is already the house form.

### 3.2 The two definienda

Candidate-free and **word-free**: neither prompt contains `install`, `remove`, `uninstall`, `read`,
`inspect`, or `status`. The four operations are described by effect only. Two independent framings,
per C1. Full texts: `/tmp/cold-oracle/d2.txt`, `d2b.txt`.

| framing | stance                                                                                                                                                  |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A**   | narrative — "put the observer in place … edits the persistent configuration file … the exact undo of 1 … leaving zero residue"                          |
| **B**   | flat facts, metaphor stripped — "writes the entry into the configuration file" / "deletes that entry … returns to exactly its state before operation 1" |

Both state the constraint: _the four words are permanent public surface; operations 1 and 2 are
exact inverses and the two words must make that visible without documentation._ This states the
**requirement** (visible inversion), never a candidate that satisfies it.

### 3.3 Raw trials — 14 valid

**Framing A**, 9 valid:

| #   | 1       | 2         | 3    | 4      | pair rationale                                                                                                                               |
| --- | ------- | --------- | ---- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | install | uninstall | read | status | "shared stem plus 'un-' makes the exact inversion literal; add/remove lacks that visible symmetry and 'remove' could imply partial deletion" |
| A2  | install | uninstall | read | status | "visibly symmetric add/remove of persistent config; enable/disable only toggles an already-present thing, implying residue"                  |
| A3  | attach  | detach    | dump | status | "shared stem, de-/at- reads as inverse instantly"                                                                                            |
| A4  | install | uninstall | read | status | "read as exact inverses that add then fully remove a config entry"                                                                           |
| A5  | install | uninstall | read | status | "share a stem via `un-`, so the inverse is self-evident"                                                                                     |
| A6  | install | uninstall | read | status | "share the un- prefix, so the inverse reads off both words"                                                                                  |
| A7  | install | uninstall | read | status | "the shared root plus `un-` makes them visibly exact inverses"                                                                               |
| A8  | install | uninstall | logs | status | "the un- prefix shows exact inversion and implies editing persistent config"                                                                 |
| A9  | install | uninstall | read | status | "share one root with a visible un- prefix, so the inverse is self-evident"                                                                   |

**Framing B**, 5 valid:

| #   | 1         | 2           | 3    | 4      | pair rationale                                                                                                                               |
| --- | --------- | ----------- | ---- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| B1  | register  | unregister  | read | status | "share one root with a negating prefix, so the inversion is self-evident"                                                                    |
| B3  | install   | uninstall   | read | status | "the `un-` prefix names the exact reversal morphologically, promising residue-free undo; `add`/`remove` are inverses but not visibly paired" |
| B4  | subscribe | unsubscribe | read | status | "un- prefix makes inversion visible"                                                                                                         |
| B5  | install   | uninstall   | show | status | "the un- prefix makes exact inversion literal"                                                                                               |
| B6  | attach    | detach      | read | status | "shared root, `de-` reads as literal undo"                                                                                                   |

**Tallies (n = 14).**

| slot                  | result                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------- |
| ops 1/2 pair          | **`install`/`uninstall` 10 (71 %)** · attach/detach 2 · register/unregister 1 · subscribe/unsubscribe 1 |
| op 3                  | **`read` 11 (79 %)** · logs 1 · dump 1 · show 1                                                         |
| op 4                  | **`status` 14 (100 %)**                                                                                 |
| morphology            | **shared root + negating prefix (`un-`/`de-`): 14/14**                                                  |
| **`remove` as op 2**  | **0/14**                                                                                                |
| **`inspect` as op 3** | **0/14**                                                                                                |

### 3.4 Verdict — converged

| criterion | pair                                                                          | op 3                                                          | op 4                       |
| --------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------- | -------------------------- |
| **C1**    | modal in A (8/9) **and** B (2/5) — modal in every framing                     | modal in A (7/9) and B (4/5)                                  | modal in both, unanimously |
| **C2**    | 71 % ≥ 50 %                                                                   | 79 % ≥ 50 %                                                   | 100 %                      |
| **C3**    | every rival is a shared-root prefix-negated pair — one neighbourhood, one law | rivals `logs`/`dump`/`show` are all "yield the recorded data" | no rivals                  |

**σ\* = `install` · `uninstall` · `read` · `status`.**

Two findings are stronger than the modal counts, and both are unanimous:

- **`remove` is refuted, 14/14.** Not one cold trial produced it. Six trials volunteered, unprompted,
  the reason: an asymmetric second word does not read as an _exact_ inverse — A1 says `remove`
  "could imply partial deletion", B3 says `add`/`remove` "are inverses but not visibly paired". The
  port contract requires **zero residue** (`event-tap.ts:48` "detach it cleanly (zero residue)"), and
  the oracle repeatedly rejected candidates precisely on residue grounds. `remove` is not merely
  off-convention — it **mis-signifies the contract**.
- **`inspect` is refuted, 0/14.** The op-3 neighbourhood is uniformly "yield the recorded data"
  (`read` · `logs` · `dump` · `show`); `inspect` — which connotes examining a thing's structure, not
  emitting its contents — was never reached for.

The derivation was run to answer the question, not to confirm the operator's reading. It converged
on the house pair independently, which is corroboration rather than assumption: the house convention
(`continuity-hook.sh`) was **not** shown to the oracle, and the oracle reproduced it cold.

### 3.5 Collision / consistency checks

- **House consistency:** `install`/`uninstall` matches `continuity-hook.sh` exactly. `status` matches
  it too. No divergence introduced.
- **`read` as a subcommand:** `read` is a POSIX shell builtin, but the collision is void — the word
  is a _subcommand argument_, never a PATH lookup (`<bin> tap read`). No shell resolution occurs.
- **Port-method drift:** the port keeps `removeTap()` / `readCapture()`. Method names are internal
  and derive nothing; only the four typed words are public surface. Aligning `removeTap` →
  `uninstallTap` is optional hygiene, not part of this verdict.
- **Blast radius, measured:** the change is `'remove'` → `'uninstall'` in `TapVerb` (:21), the
  `VERBS` set (:30), the `TapResult` variant (:26), the `case` (:106-108), the error string (:89),
  the header comment (:7), plus tests. 4 call sites as filed. Cheap now.

### 3.6 What this changes

**`event-tap verb pair` clears §Blocked.** The verb set is derived: `install` · `uninstall` · `read`
· `status`. One word changes from what ships (`remove` → `uninstall`); `read` and `status` are
confirmed as-is and need no edit. The work is now name-unblocked and can be scheduled as an ordinary
slice — it is not this record's to execute.

---

## 4. Provenance

Trial prompts and every raw output: `/tmp/cold-oracle/{d1,d1b,d1c,d1d,d2,d2b,pc1,pc2}.txt`,
`/tmp/cold-oracle/out/*.txt`, rig at `/tmp/cold-oracle/run.sh`. Ephemeral — the tables above are the
record. **51 valid trials**: 6 control (PC1 3 · PC2 3), 31 D1 (A 8 · B 9 · C 8 · D 6), 14 D2
(A 9 · B 5). A further 10 `529 Overloaded` responses were discarded and re-run, never tallied.
