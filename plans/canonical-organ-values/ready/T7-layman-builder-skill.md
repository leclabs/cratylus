# T7 layman-builder-skill

R=LLM. lead: Nico. dep: best after T3/T5 (needs the final organ set + values) but authorable in parallel;
gated by T8 deploy.

obj ≜ a new skill — **rendered for an agent reader** (`σ*_LLM`) — that lets a **non-engineer human** build a
custom agent by answering a **series of layman questions**, one comprehensive question per organ, with the
**default answer offered as the first option**.

do ≜ author `packages/mind/skill/<anchor>.md` (kind: skill). The skill drives the agent to interview the human:
one plain-language question per organ ("How chatty should it be?" → comportment; "How much should it act on
its own vs check with you?" → address; "What's its job?" → mandate; …), each presenting the organ's values as
choices in layman terms with the **recommended default first**, then composes the answers into an
`agent/<name>.md` selection vector + deploys. Reuse [[self-extend]] if it already covers this; otherwise this
is its layman-facing complement. The skill BODY is dense agent-facing instructions; the QUESTIONS it emits are
layman-facing. Map every organ → its question + option-glosses (default first).

acc ⊨ skill projects (verify PASS, operative gate); a dry run produces a valid selection vector from layman
answers; defaults are first; covers all surviving organs. → `completed/`.
