# canonical-organ-values

Re-derive the organ value catalog from blind model introspection; purge bespoke per-agent values for a
generalized opinionated LLM-reader set. Charter + acceptance: `AGENTS.md`.

## Status mirror

| Task                      | State     | Concern                                                                                    |
| ------------------------- | --------- | ------------------------------------------------------------------------------------------ |
| `T1 blind-audit-r1`       | completed | Fan out 1 blind subagent/organ: canonical values + reference + justification + open/closed |
| `T2 blind-audit-r2`       | completed | Second blind set, same questions; verify consistency vs R1                                 |
| `T3 probe-and-classify`   | completed | Probe low-confidence organs; emit authoritative open-vs-closed + closed enums              |
| `T4 open-value-gen`       | completed | Blind-source generalized opinionated value-sets for open organs (LLM-reader rendered)      |
| `T5 purge-bespoke`        | completed | Remove bespoke values; install survivors; rewire 11 agents + READMEs; exemplify; verify    |
| `T6 rename-carry-on`      | completed | `weitermachen.md → carry-on.md`; H1 carry-on; keep weitermachen as trigger word            |
| `T7 layman-builder-skill` | completed | New skill: agent-reader, layman Q&A per organ, default = first option                      |
| `T8 fleet-redeploy`       | pending   | resolve→glossary→verify PASS→deploy 6 hosts (absorbs asleep-host-catchup); verify landed   |

**Dep order:** T1→T2→T3→T4→T5→T8; T6, T7 independent (gated only by T8's deploy).

## Log

- 2026-06-23 — plan created (HOoTL). Preceded by the holders reverse-index refactor (`b7d5a0a`) and RTB
  retirement. Starting T1.
