# full-fleet-redeploy

**State:** completed (2026-06-18) — **full fleet deployed (6/6; apps dropped per C4).** · **Lead:** Nico (drove the deploy by proxy) · **Source:** the salience fix (`d46af93`) deployed only to the local host's 4 affected agents.

**DONE.** When the fleet network returned, deployed the 4 remaining hosts at HEAD `8c33b8a`: forge ✓ spark ✓ ash ✓ upgoose ✓ — joining fire ✓ + upmav ✓. Every host's `nico.md` **sha256-matches the render**, salience fix present, 11 agents + 10 skills, 33 sidecars preserved. Two host quirks handled: **ash** needed a host-key refresh (`ssh-keygen -R` + re-scan — it was reimaged while down); **upgoose** needed `--user lcaraccioli` (not the default `lex`). The whole society now runs the current corpus.

## Intent

Propagate the verbatim-salience fix (recommendation-style now in the principal defs) to the rest of the fleet,
so every host's nico/mav/reviewer/principal-ic SOUL carries the anti-menu disposition.

## Approach

Per-host sequential `deploy.py --scope user` (no shell loops). **Re-resolve at the deployed HEAD first** —
this session's lesson: a stale `.render` deploys stale defs; verify the _deployed_ artifact, never the deploy
exit message. Hosts: upgoose/upmav (asleep often), forge/apps/spark, ash, fire.

## Progress (2026-06-17, Nico — /wake session)

- **fire** ✓ — 11 agents + 10 skills, local user scope; deployed defs byte-identical to render, anti-menu rule present, 33 sidecars preserved.
- **upmav.lan** ✓ — 11 agents + 10 skills (user `lcaraccioli`, macOS 26.5.1); 4 sampled defs sha256-match the render, anti-menu rule present, 33 sidecars preserved. (Host resolves as `upmav.lan`, NOT bare `upmav`; sleeps often.)
- **Remaining:** forge, spark, ash; upgoose (asleep). **apps dropped** (C4 closed 6/7 — off the live plan). Same per-host recipe: re-resolve at HEAD → verify → `deploy.py --kind agent|skill --scope user --host <h> [--user <u>]`.
- **2026-06-17 (complete-plan-execution session) — BLOCKED on reachability.** forge/spark/ash + their `.lan`
  variants all probed **unreachable** via ssh (`ConnectTimeout=2`, BatchMode); upgoose asleep. Could not deploy.
  Note also: this session's corpus work is **deploy-neutral** — `resolve.py` on `main` @ `9071c49` yields
  agent defs **byte-identical** to the deployed set (the edits were to method-meta cells + recommendation-style's
  _description_, never the verbatim `## Protocol`). So this redeploy remains purely the salience-fix propagation
  to the unreached hosts; no new def content is pending. Awaits host reachability / next cadence.

## Done when — ✅ MET

- `grep "never a tiered menu" ~/.claude/agents/nico.md` → 1 on every host. ✓ (all 6 verified)
- Every host's deployed defs sha256-match the render. ✓
