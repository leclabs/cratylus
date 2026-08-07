---
'@cratylus/forge': minor
'cratylus': patch
---

omp is a harness: an agent can now BE a declared being on it

`cratylus project --harness omp` and `cratylus deploy --harness omp` land a
projected persona at `~/.omp/profiles/<name>/agent/APPEND_SYSTEM.md`, which omp
auto-discovers and appends to its base system prompt. Measured on `omp/17.2.9`:
launched in a blank cwd with `--no-skills` and the corpus nowhere on disk,
`omp --profile tester` answers "My name is tester."

**`--profile <name>` is this harness's `--agent <name>`.** It is the only name an
omp launch carries — there is no `--agent` flag, `SessionStartEvent` has no
payload, and the one near-miss (`agentId`) is SDK-only IRC routing reachable from
neither the CLI nor an extension. The profile also exports `OMP_PROFILE` into the
environment and roots a private config tree, which is what makes the rest work.

**The per-agent scope is a DIRECTORY**, and that is the new shape. Claude attaches
a hook inside a subagent's front-matter; codex declares hooks globally and narrows
with a generated `matcher` regex. omp needs neither: its native config root is
profile-scoped, so a module written to `profiles/<agent>/agent/extensions/` loads
under that profile and no other. Composition is realized by WHERE the file is, so
enforcement needs no selector and no runtime self-filter — the ambient form
`MODEL.md` forbids outright. Every event omp can fire, this adapter can scope,
which closes the bootstrap's finding that everything degraded to `steer` there.

Three things the harness's own naming gets wrong, each corrected against its
source rather than its doc comments: `turn.end` is `agent_end`, not `turn_end`
(omp's "turn" is a MODEL turn and would have fired several times per exchange);
`prompt.submit` is `before_agent_start`, not `turn_start` (which carries no prompt
text); and `agent_start`/`agent_end` are the main loop, never subagents.

### `HarnessAdapter.agentRel` — the destination layout is the adapter's

New required member: where an agent's definition lands ON THE HOST, relative to
the harness home. The render tree's staging layout and a harness's own layout are
two different facts, and deploy had them as one — `agents/<name><agentExt>`,
hardcoded at four sites. Claude and codex both happen to match it, so the
assumption held for two harnesses and was invisible until a third keyed its
persona by a per-agent directory.

### Fixed: codex's per-agent enforcing constraints reached the host as nothing

`enforcingSurface` was called with only its bindings while every implementation
needed the `anchor → HarnessMechanism` map to know what command to wire. Codex's
took the map as an optional parameter and the adapter wired it at arity one, so
every binding hit `if (!m) continue` and the function returned `null` for all
input — measured, not inferred. It stayed green throughout because the unit tests
call the function directly with a map the production path never supplied. The port
now threads it, and `enforcingSurface` may return many projections rather than one.
