# fleet-deploy-catchup

R=LLM. lead: Nico/Mav (fleet).

obj ≜ deploy the **canonical-organ-values** corpus (`main` @ `5eaaa45`) to the 5 fleet hosts that were
**unreachable** from fire during the 2026-06-23 rollout — forge · spark · ash (user `lex`) · upmav · upgoose
(user `lcaraccioli`, `.lan`). `fire` is live + verified. Probe with **ssh, not ping** (macOS Power-Nap
answers ICMP while asleep). Network/VPN to the fleet was down at rollout time.

do ≜ per host when ssh-reachable, from `packages/mind` (build episodic + resolve first if stale):

- forge / spark / ash: `uv run --with markdown-it-py python toolkit/deploy.py --scope user --host <h> --user lex --kind skill` then `--kind agent`.
- upmav / upgoose: `… --host <h>.lan --user lcaraccioli --kind skill` then `--kind agent`.
- **Prune the renamed skill:** `ssh <user>@<host> rm -rf ~/.claude/skills/weitermachen` (deploy never prunes; carry-on replaced it).

acc ⊨ per host: deployed `nico.md` SOUL has `mandate [[curate]]` ×1, ZERO bespoke (`grep -cE 'own-makers-office|frame-as-|ontologist|e2e-delivery' = 0`), `episodic.mjs` named ×1; skills include `carry-on` + `build-agent`, `weitermachen` dir absent; `skills/memory/episodic.mjs` present (`rawFile`); sha256 of landed `nico.md` == fire's `.render`; self-authored SELF/MEMORY/EPISODIC untouched. Then founder-store hygiene (de-palimpsest nico/mav MEMORY if heavy). Verify what LANDED, not the deploy message.

## Outcome (done 2026-06-23)

All 5 remote hosts (forge · spark · ash · upmav · upgoose) became reachable and were deployed + verified — fleet now 6/6 on the canonical-organ-values corpus. Per host: nico.md sha256 == fire .render (df337e…), zero bespoke, 11 agents, carry-on + build-agent present, weitermachen pruned, memory/episodic.mjs intact, self-authored layers untouched.
