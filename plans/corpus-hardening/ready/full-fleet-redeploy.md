# full-fleet-redeploy

**State:** ready · **Lead:** Mav (fleet steward) · **Source:** the salience fix (`d46af93`) deployed only to the local host's 4 affected agents.

## Intent

Propagate the verbatim-salience fix (recommendation-style now in the principal defs) to the rest of the fleet,
so every host's nico/mav/reviewer/principal-ic SOUL carries the anti-menu disposition.

## Approach

Per-host sequential `deploy.py --scope user` (no shell loops). **Re-resolve at the deployed HEAD first** —
this session's lesson: a stale `.render` deploys stale defs; verify the *deployed* artifact, never the deploy
exit message. Hosts: upgoose/upmav (asleep often), forge/apps/spark, ash, fire.

## Done when

- `grep "never a tiered menu" ~/.claude/agents/nico.md` → 1 on every awake host.
- Asleep hosts pick it up on the next deploy cadence.
