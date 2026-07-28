# enforcing-fragment — PLAN

> Working handle, **not** an anchor. Reader = LLM. Any anchor this plan mints is derived by
> signify at the time, never inherited from this directory name.

**Status: S0–S3 LANDED. S4 BLOCKED on an operator fork — its premise is falsified by measurement
(only 2 of the 5 hook cells are agent-scoped, so `HookCell` cannot retire by migration alone). See
`pending/s4-hookcell-retire.md` §The fork. The original execution-locus blocker is RESOLVED and its
premise refuted; this is a NEW and different fork.**

| shard | state     | what landed                                                         |
| ----- | --------- | ------------------------------------------------------------------- |
| S0    | completed | `c5e84fc` — `guardrails` loses `\| null`; tsc is the catch-all      |
| S1    | completed | `fb49ee2` — `Value = Fragment \| Enforcing`; `enforcing(f)` derived |
| S2    | completed | `fd3e3f3` — scope DERIVED from composition; `bindings.json`         |
| S3    | completed | `3cab6a0` — substrate-relative refusal, three cases                 |
| S4    | BLOCKED   | premise falsified — operator fork owed                              |

## Resolution — the fork dissolved, and the blocking premise was unsound

Three cold probes on independent framings (general design; policy-system migration history;
inline-vs-external binding), each licensed to return "not a real fork". They converged.

**1. The blocking argument was unsound.** It ran: `guardrail` requires the SEPARATE locus, but
`fragment` is inline by definition, so a fragment carrying `events` may be structurally incapable of
being a guardrail — and `1aa1779` may have retired the one Kind whose locus was right.

**Execution locus is not what binds.** Out-of-loopness is a _correlate_ of enforceability, not its
cause. Decisive counterexample: a subagent runs in a separate context and returns text the parent
may ignore — outside the loop, purely advisory; while a hook vetoing a tool call binds absolutely.
Both are "separate". The properties that do the work are that the mechanism is **not
argumentatively addressable from inside the context** and that it sits **causally between decision
and effect**. Inline-ness disqualifies a DECLARATION from binding, which was never its job.
**`1aa1779` did not retire the wrong Kind.** The `execution locus` axis — named by an earlier probe
as the one axis surviving once trigger is factored out — is itself mis-cut.

**2. The real seam is BINDING, not declaration-vs-mechanism.** There are three seams, not two:
the **rule** (predicate/logic), the **binding** (scope, params, strength), and the **mediation**
(the chokepoint presenting subjects to the rule). Splitting rule↔binding is cheap and near-universal;
nobody migrates away from it. Fusing rule↔mediation is what pays. Kubernetes'
`ValidatingAdmissionPolicy` (GA 1.30) is the shape: the policy carries identity + logic together,
the `PolicyBinding` carries only scope and params — **logic never leaves the named unit.**

**3. ∴ ONE cell, two faces.** Two independently-authored artifacts guarantee silent divergence, and
a declaration that overstates what is enforced is worse than none — it manufactures trust in an
invariant that does not exist. `HookCell` was made a Kind for its realization payload, not because
it is a different sort of thing. It was already a fragment carrying `events` plus its own
realization. **S4 unblocks unchanged in direction.**

**4. What this REPRIORITIZES.** The fatal failure mode of any split constraint is **incomplete
mediation** — the governed object never reaches the mechanism — and it is fatal because it is
SILENT (declaration correct, enforcement never runs, nothing on the declaration side reveals it).
An entire literature exists on LSM missing-hook placement for this reason; Spring `@PreAuthorize`
is inert under self-invocation; a NetworkPolicy is accepted by the apiserver and enforced by nobody
without a CNI that implements it. **Our `agent_type` grep is that shape.** So S2 (composition
binding) is the plan's centre of gravity, not S4; and the old S5 is not an epilogue acceptance test
but the completion of the mediation fix — folded into S4.

**Split failures are silent-allow; bundled failures are loud-deny. Prefer the loud one.**

**5. The seam must be TYPED, and gated at build time.** Gatekeeper links a Constraint to its
template by an untyped string `kind`; a typo yields a constraint matching nothing, failing open.
The convergent modern rule is _split the authoring artifact, fuse the runtime artifact, put a
compiler or verifier on the seam_ (seccomp → BPF verifier; ConstraintTemplate → generated CEL;
a CHECK compiled into the insert path). **S3 is our verifier, and it is load-bearing, not polish.**

**Carried forward unchanged:** KEEP `matcher` — attachment has an expressiveness ceiling, and
`matcher` is the residual dynamic binding (the `PolicyBinding` face). Removing it re-introduces
fragile-pointcut fragility.

**Owed to the canon (do not lose):** `promulgation` (a rule that binds conduct must be published to
the bound party — an unannounced veto cannot guide, only punish) and `congruence` (the announced
rule must be the enforced rule) are the two candidate anchors for the declaration↔realization
relation. Cold-probe confidence on the _concepts_ is high; on these being the terminal _signs_,
moderate. They need a signify pass before use — do not adopt on momentum.

## Appendix — the execution-locus problem as originally framed (superseded by §Resolution)

Two cold probes, run to settle whether `rule` is a real Kind, generalized past it.

**First:** the four-way taxonomy "conflates two orthogonal axes — what the cell IS vs how it gets
TRIGGERED." `activation : Kind → ActivationMode` is therefore the category error itself, and
`1aa1779` treated only its symptom: I retired `hook` from `Kind` but left the type-level
activation mapping standing. `rule` is very likely the same conflation — it needs a CONTENT-level
property the others lack to survive, and none is stated.

**Second, and this is the hard one.** Asked what survives once trigger is factored out, the
oracle named exactly one axis: **execution locus** — whether the artifact is read INLINE (folded
into the current context, the same reasoning loop then follows it) or resolves to a SEPARATE
context or process (code running outside the model's reasoning, results handed back).

By that axis our kinds cut differently than they are declared:

| declared kind                 | execution locus                                         |
| ----------------------------- | ------------------------------------------------------- |
| `fragment` · `skill` · `rule` | INLINE — instructions injected into one context         |
| `agent` · (retired) `hook`    | SEPARATE — a new context, or code outside the reasoning |

**The tension with `1aa1779`.** The cold read of `guardrail` is "constraints that apply REGARDLESS
of what the agent's internal reasoning concludes." That requires the SEPARATE locus — it is
constitutive, not incidental, because an inline guardrail is only an instruction the reasoning can
talk itself out of. But `fragment` is inline BY DEFINITION. So "a fragment carrying `events`" may
be structurally incapable of being a guardrail, and `1aa1779` may have retired the one Kind whose
locus was actually right.

**The possibility that reframes it:** `HookCell` already carries BOTH loci — `residue` is the
σ\*-signified declaration (inline, gateable by `accept()`), and `command`/`workers` are the
external realization. That is not obviously a category error; it may be the correct structure for
an enforcing constraint, with the ONLY real defect being the missing composition edge
(agent → guardrail) and the ambient scoping.

**∴ the open question is not "how do we make fragments enforcing" but:** is an enforcing
constraint ONE cell carrying two loci, or TWO artifacts linked by reference? That is precisely the
ConstraintTemplate/Constraint split question, and a research pass on attachment-vs-selector and on
whether bundling mechanism with declaration is a known mistake is in flight. Resolve on its
return; do not build either way first.

## Research verdict — attachment is right, and it has a documented failure mode we must arm

**My selector worry is a named problem, not an invention.** It is the **fragile pointcut problem**
(Kellens et al., ECOOP 2006): _"one cannot tell whether a change to the base code is safe simply by
examining the base program in isolation."_ Sullivan et al. (FSE 2005) state the enforcement
consequence: an out-of-date pointcut _"will silently malfunction, as the non-advising of a join
point does not manifest a syntax or type error."_ That is exactly our `agent_type` grep — scope
lives in the enforcement code, invisible from the agent it governs, failing silently.

**The correction that matters: ATTACHMENT FAILS OPEN TOO.** I had treated attachment as dissolving
the fail-open question. It does not.

- Spring Security: _"unannotated methods are not secured. To protect against this, declare a
  catch-all authorization rule."_
- AppArmor: _"Tasks on the system that do not have a profile defined for them run in an
  **unconfined state**."_

Two unrelated systems, identical weakness, and **both prescribe a catch-all underneath. Neither
recommends attachment alone.**

**Our catch-all is better than theirs — but it is not currently armed.** `COMPOSED(a)` requires
`∀on : |S_on| ∈ arity(on)`. If `arity(guardrails) ≠ null`, an agent composed without a guardrail
fails `accept()` **at author time** — a static refusal, where Spring and AppArmor get only a
runtime backstop. Measured: all 10 agents currently declare guardrails, but the type is
`readonly Guardrails[] | null`, so nothing stops the eleventh. **Zero-migration hardening.**

**Two costs, priced.** Obliviousness is a non-cost here — a guardrail that "applies REGARDLESS of
the agent's reasoning" is the opposite of an oblivious base program, so Kiczales & Mezini's
objection does not bite. Fan-out is real and measured: Sullivan's HyperCast refactor took aspects
from 240 lines to 30 each, bought with ~180 edits across 18 governed classes.

**KEEP `matcher`.** Attachment has an expressiveness ceiling — a static mark cannot express a
runtime-conditional policy (Noguera et al., RAM-SE 2010). `matcher` is the residual selector for
the dynamic part, and removing it would re-introduce fragility by forcing dynamic conditions back
into pointcut-shaped code.

**Still open:** the `command`/`workers` split — whether declaration and mechanism belong in one
cell or two linked artifacts. The research narrowed but did not settle it.

## Settled without research — apply with the next MODEL revision

**1. The refusal law is too blunt, and would refuse a CORRECT configuration.** `1aa1779` says:

    enforcing(f) ∧ ∃e ∈ events(f) : ¬realizable(e,adapter) ⇒ deploy REFUSES

There are three cases, not two, and it conflates the last two:

| case                                      | correct behaviour                                 |
| ----------------------------------------- | ------------------------------------------------- |
| the adapter realizes `e`                  | emit the mechanism                                |
| the adapter SHOULD realize `e` and cannot | REFUSE, loudly, naming f · e · adapter            |
| `e` belongs to a DIFFERENT substrate      | not this adapter's concern — ROUTE, do not refuse |

`HookSubstrate = 'harness' \| 'git'` already exists (`anatomy/hook-cell.ts:35`), and
`vcs.commit.post` is precisely case 3: it has no `CanonicalEvent` peer because it is not a harness
event at all. Under the law as written, deploying to the claude adapter would refuse on a
perfectly correct git-substrate constraint. The law needs to be substrate-relative:

    enforcing(f) ∧ substrate(f) = substrate(adapter) ∧ ¬realizable(e,adapter) ⇒ REFUSE

This is independent of the execution-locus question and holds under either resolution.

**2. Which parts of `1aa1779` are actually under question** — the next session should not re-litigate
the whole change:

| clause                                                      | status                                                                            |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `ENFORCED` scoping — composition IS the scope, ¬ ambient    | **SETTLED** — true under every candidate structure                                |
| refuse-loudly rather than silent-drop                       | **SETTLED** — needs the substrate qualifier above                                 |
| `Kind ≜ {fragment, agent, rule, skill}` (hook retired)      | **UNDER QUESTION** — execution locus                                              |
| `events : fragment ⇀ ℘(Event)` — on `fragment` specifically | **UNDER QUESTION** — a fragment is inline by definition                           |
| `activation : Kind → ActivationMode` left standing          | **KNOWN-WRONG** — the probe calls this the category error; untouched by `1aa1779` |

## Intent

MODEL now says a guardrail fragment carries its own `events` and `hook` is not a Kind. Source
still carries `HookCell` and five hook cells. Alignment is one-directional — the source comes up
to the grounding — so this plan is that migration, filed rather than left implicit, because an
untracked divergence is the failure MODEL's own ENFORCED clause was just written against.

## What MODEL now requires

```
events : fragment ⇀ ℘(Event) ⟨PARTIAL⟩
enforcing(f) ⇔ events(f) ≠ ∅
ENFORCED : enforcing(f) ∧ f ∈ ir(a) ⇒ scoped(mechanism(f,adapter), a) ⟨¬ ambient⟩
           ∃e ∈ events(f) : ¬realizable(e,adapter) ⇒ deploy REFUSES ⟨named⟩ ∧ ¬ silent-drop
```

## Census — measured

| fact                                                                                      | source                                   |
| ----------------------------------------------------------------------------------------- | ---------------------------------------- |
| `CanonicalEvent`: 28 harness-agnostic values, schema-owned, leaf module                   | `agent-forge/src/core/hook/generated.ts` |
| It self-describes as "canon, not a Claude detail… the vendor-neutral PIVOT"               | `core/hook/index.ts:1-6`                 |
| `HookEvent = CanonicalEvent \| 'vcs.commit.post'` — a non-realizable event already exists | `anatomy/hook-cell.ts:32`                |
| `HookCell` already carries `residue` — the σ\*-signified identity `accept()` gates        | `anatomy/hook-cell.ts:54`                |
| Hooks deploy to ONE global `settings.json` block, keyed by event                          | `adapters/claude/hooks.ts`               |
| Agent scoping exists only as a runtime `agent_type` grep in shell                         | `hooks/stance-guardrail-pre.ts:92`       |
| Agent frontmatter emits `name`, `description`, `color`                                    | `adapters/claude/anatomy.ts:54-57`       |

**A `HookCell` is already a fragment carrying `events` plus its own realization.** It was made a
Kind because of the realization payload (`command`, `workers`), not because it is a different
sort of thing. That is the whole migration in one sentence.

## Shards

**CUT — task files carry the specs; this table is a mirror, never a spec.**

| id  | shard                                                                                 | wave | state   |
| --- | ------------------------------------------------------------------------------------- | ---- | ------- |
| S0  | `guardrail-catch-all` — drop `\| null` from `Agent.guardrails`; tsc is the gate       | 0    | ready   |
| S1  | `fragment-events` — a fragment may carry `events`+`substrate`; `enforcing(f)` derived | 0    | ready   |
| S2  | `composition-binding` — per-agent mechanism from `ir(a)`; the mediation fix           | 1    | pending |
| S3  | `deploy-refusal` — substrate-relative refusal naming f · e · adapter; the verifier    | 1    | pending |
| S4  | `hookcell-retire` — five cells migrate, `HookCell` dies, `agent_type` grep dies       | 2    | pending |

Waves: `{S0,S1}` → `{S2,S3}` → `{S4}`. S4 is terminal, so its singleton wave is legal; it absorbs
the sketch's S5 because the grep lives _inside_ a cell S4 migrates — disjoint outputs are
unachievable across that boundary.

**Two sketch claims corrected by measurement:**

- S0 is **not** zero-migration. `packages/agent-forge/test/project/fixtures/agents/probe.ts:18` sets `guardrails: null` in a fixture whose stated design is "every dimension is null". One file, but the claim was false.
- A guardrail-less agent does **not** fail `accept()` — `COMPOSED` self-describes as "light; tsc enforces dimension/arity". The gate is the TYPE, which is earlier and stronger. `ANATOMY.arity` is descriptive only, read by no validator; arming it would change nothing.

## Open — not blocking, decide in place

- **Does `rule` survive?** It activates by `scope`, unprobed against the conflation `hook` failed. Explicitly OUT of S4. Note that the rule/binding/mediation factorization now gives a sharper test than existed when this question was filed.
- **`activation : Kind → ActivationMode` is KNOWN-WRONG** and untouched by `1aa1779`. The three-seam factorization is the replacement; this is a MODEL revision, owed.
- **`vcs.commit.post` currently warns-and-skips** and will refuse under S3 — a live behaviour change on a real cell. Correct under the law, but confirm before landing.

## Separate, do NOT ride along

The `guardrails` catalog is mis-signified: `honesty` and `helpfulness` STEER, and the cold read
of `guardrail` excludes steering ("they only stop it from leaving the road"). They belong under
objective/values. That is catalog work with its own probes and must not travel inside a
structural migration.
