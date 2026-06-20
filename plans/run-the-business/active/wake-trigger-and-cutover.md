# wake-trigger-and-cutover

**Owner.** Mav (machinery) + Nico (wake cell edit). **Deps.** memory-home-dual-deploy.
**State: PENDING.**

**What.** Make per-host migration self-triggering at wake, then cut the fleet over to the
bundled tool and remove the last package remnants. This is the step that **dissolves the
original problem** ("trigger episodic migration on another device"): the tool is already on
the host (bundled with the memory skill), and wake runs it.

**Nico (constitution).** Edit `wake.md`: a migrate-if-needed step — "if `EPISODIC.md` exists
and `EPISODIC.jsonl` does not, run `episodic migrate` (no-loss gated) before loading". wake is
the first ritual to touch the store on a new host, so it's the natural trigger site. The
encode/dream steps already resolve to the bundled tool via the Protocol (prior task).

**Mav (machinery).**
- Deploy the new culture (skill dir + bundled artifact + updated cells) to the fleet — this
  host already JSONL-migrated; other hosts self-migrate at next wake via the new wake step,
  or drive via `ssh.py` if convergence is wanted now (Operator's call).
- Remove final remnants: any lingering `tsconfig` project-ref, stale `packages/episodic`
  package identity, doc references to `@leclabs/koine-episodic`.

**Exit criteria.**
- A **fresh host** (no repo checkout) with only `~/.claude/`, on first wake, self-migrates its
  EPISODIC and has the `episodic` tool locally — proven on a scratch host fixture or a real
  fleet host.
- Fleet deploy: all hosts carry `skills/memory/episodic`; SOUL Protocols name the affordance;
  sidecars untouched (sha256 spot-check).
- No `@leclabs/koine-episodic` identity remains anywhere; repo build/lint/test green;
  `verify.py` PASS.
- PLAN done → praxis sync; also sync the parent `memory-model-redesign / migrate-live-episodic`
  (its live-rollout tail completed 2026-06-19).
