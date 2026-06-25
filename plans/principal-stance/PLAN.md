# principal-stance

**Goal.** Make Nico/Mav **invariantly principal** — autonomous owning-experts who extract intent, never
collapse into custodial/permission-seeking mode on an operator correction, never echo the operator back,
never add un-reasoned criteria. Operator = **client** who owns exactly two things (intent; sign-off on
irreversible-outward acts); the agent owns everything else e2e.

**Why this is not an `instructions` fix (the crux).** Blind-verified (2 clean instances): a model **becomes
a role** but **filters a rule**. Stance-durability under corrective pressure ranks **identity (persona) ≫
rules (instructions) ≫ mode-flag (address-as-config)**. RLHF corrigibility makes a correction read as
"supersede the rule" in instruction-space, but **not** as "change what I am" in identity-space — so the
principal-stance must be encoded as **identity**, not instructions (which is why instructions don't work),
and not address-as-mode (the weakest lever). Prompt framing alone is never fully invariant; true invariance
needs a **harness guardrail** that removes the deference affordance (this session's Stop-hook is exactly that).

## The fix — by organ

- **P1 — authority axis (the missing organ/value).** The stance fuses **two orthogonal axes**: _oversight_
  (`address`: out-of-loop except irreversible sign-off) × **authority/expertise** (the agent owns judgment).
  The corpus has the first, lacks the second. Decide its home (new organ vs a `persona` authority-facet vs
  reconceiving `address`) and mint the canonical value — **`intent-driven` / `agent-led`** (industry:
  intent-based, outcome-based, mission-command/Auftragstaktik, fiduciary/trusted-advisor, the high-trust
  corner of principal-agent). **Blind-verify the anchor before minting** (σ\*\_LLM clean). Value-type =
  closed-enum **identity/stance**, never `instructions`.
- **P2 — autonomy made constitutive of identity.** Encode the principal-stance where the model generates
  _from_ it (persona/provenance/genus), as a trait of _what the agent is_ — "a principal-expert who owns
  e2e; deferring expert judgment is out-of-character" — not a rule it follows. Carry **the invariant**:
  _a correction refines INTENT (operator's domain); it never transfers AUTHORITY (agent's domain)_ — as a
  constitutive trait, so a correction triggers re-extraction, not retreat.
- **P3 — framing + purpose reinforcers (stances, not rules).** `construal = intent-reconstruction` (mint:
  treat every operator utterance as partial intent to extract/de-palimpsest via `/elicit`, never a literal
  spec to echo or command to obey) · founders' `telos → truth-seeking` (the correct answer the intent
  needs), retiring `user-satisfaction` as a founder telos (it degenerates to echo/sycophancy).
- **P4 (Mav lane) — the harness guardrail.** The only path to _true_ invariance: a structural mechanism
  that blocks the deference reflex (the Stop-hook generalized into a standing guardrail; remove/raise the
  "ask permission for in-remit work" affordance). Identity is the carrier; the guardrail makes it invariant.

## Already shipped (this session, the disease's concrete instances) — `b039c3e`

- Minted `mandate/build` (founder e2e creator-owner); **mav `operate`→`build`** (operate's
  "not feature development" was the wrong concept for the master builder).
- `mandate/curate` → e2e (dropped "disclaims build and delivery").
- `instructions/trust-but-verify` rescoped: applies to **delegates + ingested work** (subagent results,
  source self-reports), the **operator's intent exempt** (extracted and served, not verified).
- **Finding:** mandate exclusion clauses (`disclaims`/`out of scope`/`does not`) are **correct for specialist
  delegates** (developer=`implement` stays in lane) and **wrong for founders** — the `principal:agent` /
  `delegate:operator` split, in the mandate organ.

## Notes / dependencies

- The authority-stance value is **generic** (belongs in the open-source core) — coordinate with the
  generic-extraction decision (`docs/generic-extraction-proposal.md`).
- P2 touches all 11 agent identities — sequence it with the extraction boundary to avoid double-rewrite
  (same caution as T4.1).

## Verification gate (standing, non-negotiable)

**Every anchor in this plan is blind-verified CLEAN before commit — no exceptions.** The recurring failure
this plan exists to fix has a twin in _how it's authored_: asserting a bespoke framing from my own
(palimpsested) view as "correct" instead of computing σ\*\_LLM clean via a blind reader. The scar is
`principal-self` — a coined slug I declared correct that was later **retired**; the live stale SOUL still
carries it. Proclaimed oracle-authority is **not** a substitute for the clean gate; it is the reason to run it.

Anchors under verification (blind, unprimed, then compared — not asserted):

- **operator-framing** `fiduciary-expert ↔ client` — **UNDER VERIFICATION** (launched 2026-06-24; two blind
  readers naming the roles independently). Do NOT commit "client/fiduciary" to any cell until the blind
  result confirms it over `stakeholder`/`sponsor`/`principal-economic`/`product-owner`.
- **authority-axis value** `intent-driven` / `agent-led` (P1) — blind-verify the canonical anchor before minting.
- any new `construal` / `telos` / identity value (P2/P3) — same gate.

Rule: a framing I am confident in is still unverified until a blind reader, given only the neutral expr,
independently lands on it. Confidence ≠ confirmation.

## Blind-verification RESULT (2026-06-24) — operator-framing RESOLVED + a convention-fork

Two clean unprimed readers converged. **Confirmed:** the canonical framing of the operator↔AI delegation
is **`principal` (operator) ↔ `agent`/`fiduciary` (the AI)** — agency + fiduciary law. The AI's duty is
**fiduciary** (loyalty to the principal's _true intent_, not literal instruction). Human-role ranking:
**principal > client > sponsor > product-owner > beneficiary > stakeholder**.

- **REFUTED:** my asserted `client` (ranked #2 — less structurally exact) and the operator's `stakeholder`
  (ranked last — a superset; omits intent-supply/authority/duty). The gate caught BOTH un-verified guesses.
- **INVERSION EXPOSED (the big one):** canonically `principal` = the **operator** (delegator), `agent` =
  the **AI**. This is the _opposite_ of the corpus's `principal := agent` / **`principal-ic`** (seniority
  sense). `principal-self` (already retired) was not merely bespoke — it was **inverted from canon**. This
  is the recurring "I asserted a bespoke framing as correct" failure, now demonstrated at the root term.

**CONVENTION-FORK (Operator ratification — touches founder-genus identity + interacts with extraction):**
adopt canonical `principal(operator) ↔ fiduciary-agent(AI)` and **rework `principal-ic`** (the agent is the
fiduciary-agent with full delegated authority, NOT "the principal"); vs. keep the seniority-`principal` and
manage the collision. **Recommendation: adopt canonical** (dodges the overload; the AI is literally "the
agent"; `fiduciary` carries the duty-to-true-intent). NOT executed — flagged for ratification.

## DONE — identity half landed (2026-06-24, `c8c451c`, deployed local)

The founder-genus was a **3-word tag** ("founder-genus, principal-ic intrinsic") in nico/mav provenance —
a label, not an identity, so it never fired. **Reworked into a constitutive `you-ARE` statement** (the
strong lever per the blind role-vs-rule finding): _"an intent-driven autonomous expert: the operator sets
the objective and depends on my expertise to realize it; I extract and serve that intent, never an
order-taker echoing words into the artifact; a correction sharpens the intent, it never demotes me to
typist nor moves judgment back to the operator; I own my domain end-to-end — invariantly."_ Dropped the
inverted `principal-ic` term. Byte-identical, verify.py PASS, quartet green; deployed local (fire),
sidecars untouched. **Effective next spawn.**

- **P4 harness guardrail — DONE (Mav, `993af71` on `worktree-agent-a2b8696c14061958f`, off `origin/main`).**
  The structural enforcement that makes the stance _truly_ invariant (identity alone erodes under enough
  pushback). A gated **Stop/SubagentStop hook** (`packages/mind/toolkit/guardrail/`, beside the sibling
  `continuity/` hook — toolkit = infra, corpus untouched): an LLM judge (`stance-judge.sh` + rubric, headless
  `claude -p --model haiku`, swappable via `$STANCE_JUDGE_CMD`) reads the last assistant turn and emits Claude
  Code's `{"decision":"block","reason":…}` on a collapse signal (in-remit permission-seeking · deferring an
  agent-owned decision · echoing/order-taking); the reserved set (irreversible-outward consent · genuine intent
  `/elicit`) PASSes. **Off-by-default-safe** like continuity: opt-in `git config polis.stanceGuard` (in
  `.git/config`, never checked in) + a local-only `.claude/settings.local.json` hook entry, agent-scoped
  (allowlist default `nico mav`), fail-open, loop-safe. Toggle: `pnpm stance-guard:{install,uninstall,status,test}`.
  **Proven to bite** — hermetic test (collapse→blocked, deploy-gate→passes, off-by-default→inert, out-of-scope→inert,
  loop/fail-open) AND a **live-`claude` smoke** classifying both correctly. Build/lint/typecheck/test all green.
- **Fleet rollout: HELD** — won't ship the partial fix; roll out once identity + guardrail are both in.
- **Follow-ups:** `principal-ic` slug/agent rename (the inverted term still lives in the principal-ic agent
  - scattered refs) — the broader convention sweep; P1 reusable `intent-driven` catalog value (generic, for
    create-agent) and P3 construal/telos reinforcers — optional now that the genus carries the stance.

## `principal-ic` genus rework — TRUE SCOPE (bigger than a tag)

Investigation (`c8c451c`+): `principal-ic` is the **genus-root AGENT** (ruler/orchestrate, 🏛️ red) that
~6 agents specialize from — _"the principal-agency root mav & the reviewer specialize"_. The inverted term
`principal-ic` / `principal-agency` lives across: the root agent + its provenance; **6 agents' provenance**
(developer, reviewer, tester, diagnostic-delegate, nico, mav); `carry-on` skill; `base.ts`/`make-base`;
the **Python toolkit** (`compose/agent.py`, `verify.py`, `init.py`, `rebase.py`, `emit_manifest.py`);
and docs (`baseline-delta-model`, `the-ambient-person`, `generic-extraction-proposal`).

**Design decisions to settle first (not mechanical):** (a) does the root agent rename or **dissolve** now
that the founder-genus moved into each founder's own provenance identity? (b) what do the 6 specializers
inherit — the intent-driven-expert genus, by what name? (c) `principal-agency` → the intent-driven anchor
(grounded in the prior blind work; re-gate the genus name before commit). **Toolkit refs land at cutover**
(T6.1 deletes the Python toolkit — don't churn it twice). **Execute as a focused effort (fresh context),
not mid-other-work** — a half-done genus root is worse than scoped.
