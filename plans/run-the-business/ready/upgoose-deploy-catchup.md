# upgoose-deploy-catchup

R=LLM. lead: Mav/Nico (fleet).

obj ≜ deploy the rebuilt corpus to `upgoose` — the one fleet host asleep during the 2026-06-22
rollout (the other 5 — fire/forge/spark/ash/upmav — are live + verified).

do ≜ when upgoose is awake (it sleeps often):
`uv run --with markdown-it-py python toolkit/deploy.py --scope user --host upgoose.lan --user lcaraccioli --kind skill`
then `--kind agent`. (FLEET SSH RULE: upmav/upgoose = `lcaraccioli@*.lan`, NOT the default user.)

acc ⊨ ssh lcaraccioli@upgoose.lan: `~/.claude/skills/memory/episodic.mjs` present · 11 rebuilt SOULs
(grep zero-trust + the `## Memory` {name}-substituted protocol) · sidecar SELF/MEMORY/EPISODIC untouched.
