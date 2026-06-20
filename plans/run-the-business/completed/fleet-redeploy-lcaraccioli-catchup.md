# fleet-redeploy-lcaraccioli-catchup

**Owner.** Mav. **Origin.** csf-canonicalization (delivery tail). **Status.** DONE 2026-06-20.

**Objective.** Bring the lcaraccioli hosts **upmav** and **upgoose** up to the σ\*\_R corpus
(`origin/main` @ `96d334a`+). They were off-network (TCP timeout) during the csf fleet redeploy
(2026-06-20); the other four hosts (fire/ash/forge/spark) were believed live.

**Resolution.** Both lcaraccioli hosts reachable (macOS, `$HOME=/Users/lcaraccioli`) and deployed.
**Scope grew on contact:** the catch-up surfaced that the csf redeploy had **silently mis-deployed the
whole remote fleet** — a `--home` footgun put every remote host's corpus into a junk `<home>/{agents,skills}`
tree _beside_ the real `~/.claude`, so the live trees still held the stale C4-era corpus (10 skills, no
`elicit`/`probe`/`self-extend`). All five remote hosts corrected:

- **Root cause.** `deploy.py --home <HOME>` for a remote host treated `<HOME>` as the `.claude` dir
  _verbatim_ (only the literal default `~/.claude` got `$HOME` expanded + `.claude` appended). The task's
  `--home /Users/lcaraccioli` therefore wrote `/Users/lcaraccioli/{agents,skills}`. Deploy printed
  "copied"; the live `~/.claude` was untouched. (Diverged from local `user_scope`, which appends `.claude`.)
- **Fix (durable).** `place/ssh.py::_resolve_claude_dir` now appends `.claude` to any explicit `--home`
  that is not already the `.claude` dir, **loudly** (a `NOTE`); a `.claude`-suffixed path stays verbatim
  (back-compat). Test `test_place.py` §4. Doc: `toolkit/AGENTS.md ## Deploy` (omitting `--home` is correct
  everywhere; verify what LANDED, not what deploy printed).
- **Hosts corrected** (11 agent defs + 13 polis skills each, `elicit`/`probe`/`self-extend` present,
  `principal-ic` carries the consensus-quality-pick prose, junk trees removed): **upmav, upgoose**
  (lcaraccioli) · **ash** (`/Users/lex`) · **forge, spark** (`/home/lex`). **fire** (local) was already
  correct (the bug is remote-only). Whole 6-host fleet now on σ\*\_R.

**Acceptance.** MET on all hosts. Note: deploy ships **13** host skills (the 14th rendered cell,
`canonical-semantic-factorization`, is not host-invocable). The anchor `consensus-quality-pick` renders as
the prose surface form "consensus quality pick" at strong-llm-lean (grep the words, not the hyphens).
