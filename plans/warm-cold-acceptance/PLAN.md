# PLAN · warm-cold-acceptance

_Derived mirror of runtime state (the folders are authoritative; this doc is downstream)._
_Target: agent-factory (github:leclabs/agent-factory, ~/workspaces/polis). Authored from CLEAN
context — corpus-agnostic by design; enumeration is a runtime task, no fragment was read to author this._

## Intent

Formally encode and enforce the **warm≡cold acceptance criterion** for operating on agent-factory's
own source: a fragment's meaning is its cold-blind decode `R_cold(f)` (naive isolated LLM, zero
project context); a warm in-repo reading MUST equal it; divergence is a PROJECT DEFECT, corrected by
realigning the project toward cold-truth — never by bending the fragment to the warm corpus. Target
state: `∀ f . decode_warm(f | K) ≡ R_cold(f) ≡ intent`, with all parties (operator + both nico faces)
commuting through the oracle `R_cold`.

## Why (the flaw this closes)

A warm session inside the noisy corpus inverted the source of truth — it treated the accreted context
as the arbiter and DEFERRED to it, instead of recognizing warm≢cold divergence as the project's own
noise. The corpus is the DEFENDANT; the cold-blind read is the ORACLE. The project never wrote down its
own acceptance test, so a warm session had no defense against its own noise. This plan writes it down
and gives it teeth.

## Waves (topo schedule)

```
wave 0 (frontier · ready):  T0 encode-law   T1 build-oracle   T2 enumerate-shard
wave 1 (pending):           Ts reconcile-parallel-work  [dep T1] — absorb the warm face's premature work
                            T3 sweep-realign            [deps T0,T1,T2,Ts] — fan-out generator (N shards)
wave 2 (pending):           T4 ratify-commutation       [dep  T3]
wave 3 (pending):           T5 wire-standing-gate       [dep  T4]
```

_Ts runs before T3 so already-satisfied work is adopted (not re-dispatched) and competing homes are
coalesced. Artifacts are judged by the oracle gate; the warm face's assertions are trusted for nothing._

## Tasks — ALL COMPLETE (2026-07-03)

| id  | state   | deps        | one-line                                                                                                           |
| --- | ------- | ----------- | ------------------------------------------------------------------------------------------------------------------ |
| T0  | ✅ done | —           | law = `organs/engineering-principles/cold-decode-oracle.ts`; adopted from dc3ba69 via oracle (Ts), not re-authored |
| T1  | ✅ done | —           | oracle `bin/cold-oracle.sh` — isolated cwd + creds-only config + tool-less + mood-neutral prompt; isolation proven |
| T2  | ✅ done | —           | 27 MECE shards over 159 organ-frags + 15 skills + 12 agents → `completed/T2-worklist.md`                           |
| Ts  | ✅ done | T1          | dc3ba69 re-gated: cold-decode-oracle→T0, provenance realign→T3-shard both PASS, adopted; nothing on assertion      |
| T3  | ✅ done | T0,T1,T2,Ts | 36 fragments oracled, **0 corpus defects**; 2 defects found+fixed in the HARNESS (mood-confound · truncation)      |
| T4  | ✅ done | T3          | 4-way commutation **divergence 0/4** (operator ratified); test case #0 green (plan passes its own criterion)       |
| T5  | ✅ done | T4          | corpus-side: exemplify accept EXECUTES the oracle (`coldpass` in `valid`); infra → Mav (`T5-infra-handoff-mav.md`) |

## Resolution

Verdict: **the corpus is uniformly `warm ≡ cold ≡ intent`**. The self-sufficiency discipline already held it
there. The plan's real yield was (a) writing the acceptance test down as an enforced law + executable gate,
and (b) a meta-finding — the only divergences the sweep surfaced were in the ORACLE INSTRUMENT itself; an
untrusted oracle would have driven a false mass-realignment of 4 clean skills. Zero-trust on the gate caught
it. DoD (a)-(e) all met; (d) split corpus-side (done) + infra (Mav). Live in SOURCE until next `anatomy:deploy`.

## Definition of Done

- (a) law encoded AND self-passing (`R_cold(law) ≡ intent`);
- (b) oracle harness invocable + proven-isolated;
- (c) `∀ f . warm(f) ≡ R_cold(f) ≡ intent`;
- (d) standing gate wired + blocking (rejects planted noise);
- (e) THE PLAN ITSELF passes a cold-blind read — first artifact to satisfy its own criterion.

## Coordination

Lands in ~/workspaces/polis where the warm nico face is LIVE. Staged here (~/workspaces/blank) to avoid
a sibling `git add -A` sweeping half-authored files. Instantiation into polis/plans/ + any commit/push
are GATED to the Operator (irreversible-outward). The warm face executes; the plan's oracle gates
protect it from its own noise at every step.
