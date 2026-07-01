# p4-stance-protocol-tail

The standalone tail of the Persona Protocol / P4 stance work (shipped 2026-06-30, `main @ 0982cf2`):
per-turn Persona Protocol genus block + `founder-genus → principal-ic-intrinsic` rename, deployed to
fire/forge/spark/ash/upmav with `stanceGuard` flipped on globally.

Remaining:

- **apps fleet-catchup** — `apps` was unreachable during the fleet deploy; run
  `agent-forge deploy --host apps` (agent + skill + hooks) when it is up, then
  `git config --global agentfactory.stanceGuard true` there.
- **upgoose** — deliberately excluded canary; `deploy --host upgoose` + `stanceGuard` if we want it in.
- **stance SELF-cleanup** — the SOUL now carries the stance live (Persona Protocol carrier + stance-guardrail
  invariance), so the old memory patches are redundant: retire mav's SELF Law 25 brake (mav, on its next
  wake) and trim nico's custodial-deference SELF notes (next dream). Move-not-copy.
