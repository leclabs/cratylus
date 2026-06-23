# asleep-host-catchup

R=LLM. lead: Mav/Nico (fleet).

obj ≜ catch up the fleet hosts that were **asleep** during the 2026-06-22 deploys — **ash** (lex) and
**upgoose** (lcaraccioli). The other four (fire/forge/spark/upmav) are live + verified on `main` @ `ba6eb49`
(rebuild + the episodic raw-store fix + the doc de-palimpsest).

do ≜ when a host is awake (probe with **ssh, not ping** — macOS answers ICMP while asleep via Power-Nap):

- **ash** (user `lex`): `uv run --with markdown-it-py python toolkit/deploy.py --scope user --host ash --user lex --kind skill` then `--kind agent`.
- **upgoose** (user `lcaraccioli`): `… --host upgoose.lan --user lcaraccioli --kind skill` then `--kind agent`.
  (FLEET SSH RULE: upmav/upgoose = `lcaraccioli@*.lan`, NOT the default user.)

acc ⊨ per host: deployed `nico.md` SOUL has `human-on-the-loop` ×1 and `principal-self` ×0 · memory skill
`episodic.mjs` has `rawFile` (the raw-store fix) · self-authored SELF/MEMORY/EPISODIC layers untouched
(deploy reports "layers present, untouched"). Then **founder-store hygiene check** (see note): grep each
host's `nico`/`mav` `MEMORY.md` for `principal-self` and stale `lexicon/` used-as-current; if a store is a
heavy palimpsest (cf. forge's mav at 891 lines), de-palimpsest it in place (CE∧ME, preserve host-specific
durable lessons), else leave the clean seed stubs.

note ≜ **structural finding (2026-06-22):** founder memory stores are **per-host and UNSYNCED** (`~/.claude`
is not a synced repo; md5s diverge) — yet they are meant to be ONE individual's (user-scoped, "travels with
the agent"). They have forked: fire's are the canonical/active ones; remotes are mostly clean seed stubs
EXCEPT where a founder actually works (forge's mav). The deep fix is a working **fleet organ sync** (Mav's
machinery) so per-host divergence can't re-accumulate — a separate initiative, not this catch-up.
