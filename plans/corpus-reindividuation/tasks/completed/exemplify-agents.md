# exemplify-agents

R=LLM.

obj ≜ `/exemplify` the agent corpus → canonical `packages/mind/{kind}/{α}.md` + R3 manifests.

dep ≜ ∅ (ready). pre ≜ read `references/kinds-and-invariants.md` (kind-set + home convention =
exemplify's home_slug resolution).

ops:

1. ∥ 1 nico subagent / file ∈ `packages/mind/agents/*.md` (file==boundary). each invokes `/exemplify`:
   D=file; R=LLM; s=file; home_slug=`{kind}/{α}` per contract.
2. trust the skill: produce→name→accept gates round-trip + MECE; materialize emits composites by
   reference; manifest reuse/mint dedups vs existing homes.

art → `packages/mind/{kind}/{α}.md` + `.manifests/<agent>.json`.

acc (blind) ⊨ ∀ agent: exemplify accept=valid; manifest concepts ∈ routes∪delta (¬unrouted); parents
reference fragments ¬inline-redefine.
