# p4-stance-protocol-tail

The standalone tail of the Persona Protocol / P4 stance work (shipped 2026-06-30, `main @ 0982cf2`):
per-turn Persona Protocol genus block + `founder-genus → principal-ic-intrinsic` rename, deployed to
fire/forge/spark/ash/upmav with `stanceGuard` flipped on globally.

Remaining:

- **apps fleet-catchup** — `apps` was unreachable during the fleet deploy; run
  `agent-forge deploy --host apps` (agent + skill + hooks) when it is up, then
  `git config --global agentfactory.stanceGuard true` there.
- **upgoose** — deliberately excluded canary; `deploy --host upgoose` + `stanceGuard` if we want it in.
- **stance SELF-cleanup** — the SOUL carries the stance live (Persona Protocol carrier + stance-guardrail
  invariance, over the `autonomy` mission-command footing), so the old memory patches are redundant.
  mav's SELF Law 25 brake: **removed by the Operator on upmav (2026-07-01)** — its retirement condition is
  met. Blind gate (2/2) confirms intent-driven autonomy is a **facet of the existing `autonomy` organ**
  (mission command / Auftragstaktik), never a missing "execution organ" (a pre-P4 placeholder); coining one
  would violate the industry-standard-alignment invariant. Trim nico's custodial-deference SELF notes at
  next dream. Move-not-copy.
- **latent DRY improvement (surfaced, queued)** — the mission-command substance (own the _how_, serve intent
  over literal words, escalate only a genuine fork) is under-expressed in the `autonomy/human-on-the-loop`
  value cell; it currently leaks into the README gloss + provenance + Persona Protocol. Homing it into the
  value cell is DRY-correct but changes every agent's SOUL projection — a deliberate, separately-landed +
  deployed change, not part of this tail.
