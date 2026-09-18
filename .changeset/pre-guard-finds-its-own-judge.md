---
'@cratylus/canon': patch
---

`stance-guardrail-pre` resolves its judge from its own hooks root, not from `~/.claude`

The pre-guard named `$HOME/.claude/hooks/stance-guardrail` outright for its judge, its rubric
and its miss log. The copy deployed under `~/.omp/hooks/` therefore reached across into the
CLAUDE tree at fire time, and on a host with no claude deployment found nothing, failed open,
and appended its misses to a directory that does not exist — a cell whose whole claim is
harness-neutrality, coupled to one vendor's home by four literals.

Every hooks root holds both hook dirs as siblings, so `../stance-guardrail` is true at every
site this file can land. The sibling Stop worker already derives its own directory this way;
this is the same derivation, one level up. The `STANCE_GUARD_DIR` / `STANCE_RUBRIC` /
`STANCE_JUDGE_CMD` / `STANCE_GUARD_LOG` overrides are unchanged and still win.

Traced on the omp-deployed copy after redeploy: `HOOKS_ROOT=/home/lex/.omp/hooks`,
`JUDGE_CMD=sh /home/lex/.omp/hooks/stance-guardrail/stance-judge.sh`, where it previously
resolved `/home/lex/.claude/hooks/stance-guardrail/stance-judge.sh`.
