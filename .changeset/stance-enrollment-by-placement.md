---
'@cratylus/canon': minor
---

The stance guardrail is enrolled by placement, and it says when it did not run.

**Breaking.** Three ways of deciding who gets judged are gone. The per-repo
opt-in `agentfactory.stanceGuard` is deleted, with `stance-guard:on`, `:off` and
`:status` — it asked whether a guard may run in a _directory_, and a stance
belongs to the agent, not the checkout. The agent allowlist and its
`STANCE_GUARD_AGENTS` override are deleted — a runtime self-filter over an
enrollment the corpus already derives, which had drifted so far that `architect`
and `kino` held principal authority and were never once judged. Enrollment is
now the presence of `<scope>/stance/manifest.json`, which the projection places
in each persona's own scope. The off switch is launching the harness without a
persona.

**Breaking.** `praxis-continuity` and `targets/continuity/` are retired with the
praxis plan mirror they nudged about, along with the `continuity:install`,
`continuity:uninstall` and `continuity:status` scripts. The plan-set mechanism
survives its cell: `tooling/praxis/praxis.sh` is now
`tooling/plan-set/plan-set.sh`, reached as `pnpm plan`.

A turn the judge could not answer now leaves a `DARK` row in the per-session
verdict log rather than nothing at all, so an unjudged turn and an absent
session stop reading identically off disk.

The evidence check no longer discards the collapse it exists to catch. It
compared a quoted span to the turn with `grep -qF` and no `--`, so evidence
opening with a markdown bullet was parsed as an option — and a tail-enumeration
collapse _is_ a bullet list. Both sides are now flattened identically and
compared with `--`, authenticating the judge's words rather than its list
syntax.
