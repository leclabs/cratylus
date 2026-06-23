# T8 fleet-redeploy

R=LLM. lead: Nico (+ Mav steward). dep: T5, T6, T7. **Absorbs the retired `asleep-host-catchup`.**

obj ≜ ship the finished corpus to **all 6 hosts** — superseding the old per-host catch-up (the new corpus is
what ash + upgoose needed anyway).

do ≜ `pnpm --filter episodic build` → `resolve.py` → `glossary.py` → `verify.py` (PASS gate) → per-host
`deploy.py --scope user` (`--kind skill` AND `--kind agent`, atomic per host):

- local/lex: fire · forge · spark · ash (`--host <h> --user lex`, ash may be asleep — probe **ssh, not ping**).
- lcaraccioli/.lan: upmav · upgoose (`--host <h>.lan --user lcaraccioli`).

acc ⊨ per host: deployed SOULs + skills match `.render` (sha256 + grep a known new line); memory skill
`episodic.mjs` intact (`rawFile`); self-authored SELF/MEMORY/EPISODIC layers untouched. Founder-store hygiene
check on nico/mav MEMORY (de-palimpsest if heavy). Verify what LANDED, not the deploy message. → `completed/`.
