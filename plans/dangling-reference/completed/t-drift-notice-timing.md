# t-drift-notice-timing

**Wave 0.** The deployed-vs-rendered comparator is correct and under-armed. Output is
`packages/canon/src/hooks/deploy-drift-notice.ts` and its projected worker.

## Intent

**A filing said "nothing gates deployed-artifact freshness". That is FALSE and is withdrawn
here.** `deploy-drift-notice` is exactly that comparator: deployed to
`~/.claude/hooks/deploy-drift-notice/`, wired into `settings.json` under `SessionStart`, and
working — run against this tree it detected a rendered-but-undeployed `praxis` cell and
printed the exact superseded line the session was operating under, correctly labelling `-`
lines as false premises rather than background.

**Two real gaps survive the withdrawal:**

1. **Advisory, never a gate.** Its residue says `¬block · exit-0 ∀error`. A host running
   superseded doctrine is told once and may proceed. Nothing in `pnpm verify` reds when
   `rendered ≢ deployed`.
2. **Fires only at `session.start`.** A cell edited MID-session is stale for the remainder of
   that session with no further signal. This is not hypothetical: it is how a 16-hour-old
   projection of an agent's own governing cell came to be executed, and it happened again in
   the session that authored this plan — a `praxis` edit landed and the running session kept
   the superseded law until the next start.

The second is the sharper one. The first is a design question with a real cost on the other
side (a red pipeline for an un-deployed host is hostile to a fresh clone).

## Inputs

- `packages/canon/src/hooks/deploy-drift-notice.ts` — its residue line and the comparator it
  delegates to (`verdict ↦ comparator ⟨corpus-owned · ¬face-computed⟩`).
- `packages/canon/src/manifest.ts` — the `events` vocabulary, for which event(s) can re-arm it.
- The projected worker under `~/.claude/hooks/deploy-drift-notice/`.

## Constraints

- **Do not build a second comparator. This one is correct** — the work is when it runs and
  what its verdict is allowed to do.
- **Silence-when-clean is MANDATORY and must survive.** Its own residue argues why: a notice
  that fires every session trains the reader to skip it, which is worse than absent.
- A re-arm must not make the notice fire repeatedly within one session for the same drift;
  the trigger is a CHANGE in the verdict, not the verdict being non-empty.
- If the decision is to red the pipeline, that is a RULING (it changes what a fresh clone
  experiences) — surface it, do not take it inside this shard.

## Deps

(none — wave 0)

## Outputs

- `packages/canon/src/hooks/deploy-drift-notice.ts`
- `packages/canon/src/toolkit/**` (its worker, if the re-arm needs one)

## Accept

1. A projection landing mid-session produces a drift signal without waiting for the next
   `session.start` — demonstrated by a test that edits a cell, re-projects, and observes the
   signal.
2. Clean state still emits NOTHING. A test asserts silence on `deployed ≡ rendered`.
3. The same drift does not re-notify within a session absent a verdict change.
4. `pnpm verify` green.
