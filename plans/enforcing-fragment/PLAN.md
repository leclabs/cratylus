# enforcing-fragment — PLAN

> Working handle, **not** an anchor. Reader = LLM. Any anchor this plan mints is derived by
> signify at the time, never inherited from this directory name.

**Status: PROPOSED — and `1aa1779` is now UNDER QUESTION by a later probe. Do not execute until
§The execution-locus problem is resolved.**

## The execution-locus problem — found after `1aa1779`, unresolved

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

| id  | shard                                                                             | wave |
| --- | --------------------------------------------------------------------------------- | ---- |
| S1  | `events` becomes a field a dimension fragment may carry; `enforcing(f)` derivable | 0    |
| S2  | claude adapter emits a per-agent mechanism for each enforcing fragment in `ir(a)` | 1    |
| S3  | `deploy` refuses loudly on a non-realizable event, naming f · e · adapter         | 1    |
| S4  | the five hook cells become enforcing guardrail fragments; `HookCell` retires      | 2    |
| S5  | retire the runtime `agent_type` allowlist — scope now comes from composition      | 3    |

S5 is the acceptance test for the whole plan: if scoping is real, deleting the grep changes
nothing observable.

## Open — decide before S4

- **Does `rule` survive?** It activates by `scope`, and I have not probed whether that is a
  distinct concept or the same conflation `hook` was. Do not migrate `rule` on momentum.
- **Where does the realization payload live?** A fragment carrying `command`/`workers` may be
  right, or the payload may belong to the adapter. Unprobed.
- **`vcs.commit.post` has no `CanonicalEvent` peer** and currently warns-and-skips. Under S3 it
  must refuse loudly instead — confirm that is wanted before changing a live behaviour.

## Separate, do NOT ride along

The `guardrails` catalog is mis-signified: `honesty` and `helpfulness` STEER, and the cold read
of `guardrail` excludes steering ("they only stop it from leaving the road"). They belong under
objective/values. That is catalog work with its own probes and must not travel inside a
structural migration.
