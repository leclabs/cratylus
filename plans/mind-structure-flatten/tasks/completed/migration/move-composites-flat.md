# move-composites-flat

**Objective.** Physically move the 13 skill + 11 agent composites from `mind/<kind>/<organ>/<slug>.md`
to flat `packages/mind/{agents,skills}/<slug>.md`, **scripted and byte-identity-gated**.

**Preconditions.** `toolkit/flat-storage-support` landed (resolver reads flat). Snapshot
`/tmp/baseline = cp -r .render`.

**Operations.**

1. Script the `git mv` of every composite to its flat home; delete the emptied `<organ>/` dirs.
2. Regen the fleet; `diff -rq /tmp/baseline .render` MUST be empty.
3. Run full `pytest toolkit/`; fix any path-assuming test (render identical, assertions may move).

**Artifacts.** `packages/mind/{agents,skills}/*.md` (moved), removed `mind/<kind>/<organ>/` dirs.

**Acceptance (blind test).** `find mind -path '*/<organ>/*'` empty; `diff -rq /tmp/baseline .render`
empty; `pytest toolkit/` green.
