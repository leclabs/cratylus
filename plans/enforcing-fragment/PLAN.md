# enforcing-fragment — PLAN

> Working handle, **not** an anchor. Reader = LLM. Any anchor this plan mints is derived by
> signify at the time, never inherited from this directory name.

**Status: PROPOSED — tracks the deliberate MODEL↔source divergence opened by `1aa1779`.**

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
