# nothing gates deployed-artifact freshness — no check compares the projection on the host against the corpus, so the agent can run a superseded projection of its own governing cell with no signal

> FILED, not specified. A stub: symptom + locus + provenance, no census, no
> acceptance. It exists so the defect was not chased when it was found. Whoever
> promotes it to `ready` owes it a real spec (`/praxis upsert`).

**Symptom.** nothing gates deployed-artifact freshness — no check compares the projection on the host against the corpus, so the agent can run a superseded projection of its own governing cell with no signal

**Locus.** _(unfilled — the filer may not have known)_

**Provenance.** Filed 2026-08-06 from `13e5f394`, while executing `wake-orientation`.

## VERDICT — REJECTED AS FILED, RECTIFIED 2026-08-06

**"Nothing compares the projection on the host against the corpus" is FALSE.**

`packages/canon/src/hooks/deploy-drift-notice.ts` is exactly that comparator. It is deployed
at `~/.claude/hooks/deploy-drift-notice/`, wired into `settings.json` under `SessionStart`,
and it works — run against this tree it detected a `skills/praxis/SKILL.md` edit rendered but
not deployed, and printed the exact superseded line the session was operating under, correctly
labelling `-` lines as false premises rather than background.

**The real defect is narrower, and survives:**

1. It is **advisory, never a gate** — its own residue says `¬block · exit-0 ∀error`. A host
   running superseded doctrine is told once and may proceed.
2. It fires **only at `session.start`**. A cell edited MID-session is stale for the remainder
   of that session with no further signal — which is precisely how a 16-hour-old projection of
   an agent's own governing cell came to be executed. The provenance behind this filing is
   therefore evidence for the _timing_ gap, not for absence of the check.

Re-spec accordingly: the question is whether drift should red the pipeline (a corpus-side
gate on `rendered ≡ deployed`) and whether re-projection mid-session should re-arm the notice.
Do not build a second comparator — this one is correct.
