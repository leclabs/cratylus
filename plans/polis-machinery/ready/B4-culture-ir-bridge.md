# B4 — culture→IR bridge

**State:** ready · **Lead:** Mav (koine IR engineering) + Nico (the projection→IR mapping semantics) · **Phase:** B (machinery) · **Dep:** B1 ✓, A5 ✓

## Intent

Route mind's culture-projection **through koine's IR** so a founded society's agents+skills compile to **any**
client, not just claude-code. Today `resolve.py` renders claude-code `.md` directly (proven: 11 agents + 7
skills, render parity with playground). B4 inserts the canonical IR as the waypoint:

```
   today:   mind corpus ──compose──> resolve.render.claude_code ──> .claude/{agents,skills}   (claude-code only)
   B4:      mind corpus ──compose──> koine IR (canonical) ──koine adapters──> {claude-code, codex, cursor, …}
```

The mind composer already produces the *semantic content* (dispositions-as-priors, the identity protocol,
persona, grants, skill trigger+body). B4 emits that as **koine IR** instead of (or alongside) claude-code
`.md`; koine's existing IR→dialect adapters do the rest (koine is already the bidirectional translator).

## Nico-side spec — the projection → IR mapping (the bridge contract)

koine's IR resource types (from `packages/koine/core/schema/*.schema.json`): `Agent`, `Skill`, `Command`,
`Permissions`, `Rule`, `Hook`, `McpServer`, `EnvVars`. The mapping from mind's composed artifacts:

| mind projection artifact | koine IR resource | carries |
|---|---|---|
| **Agent def** (`compose_agent` output) | **`Agent`** (`agent.schema.json`) | name (slug); description (delineation); the composed body — dispositions, the `render: verbatim` identity protocol, persona-delta — as the agent's instruction content; tools if declared |
| **Skill** (`compose_skill` output, `/trigger`) | **`Skill`** (`skill.schema.json`) | name; description; trigger (the `/x` affordance); the operative body + provenance |
| **scope-grant** (`grant @a [[exemplar]] on path`) | **`Permissions`** (`permissions.schema.json`) | the path-scoped authority the grant confers — *flag, see below* |

**The mapping is mostly clean** (Agent→Agent, Skill→Skill); the genus dispositions + identity protocol are
already composed *into* the agent body by the time IR is emitted, so they ride as Agent content (no separate
IR resource). **Open questions for Mav (his IR semantics):**
1. **Skill vs Command.** mind skills carry a `/trigger` — does that map to IR `Skill` or `Command`? Depends
   on koine's Skill-vs-Command distinction (both schemas exist). My lean: `Skill` (the trigger is an
   invocation affordance, not a one-shot command), but it's your IR-semantics call.
2. **Grants → Permissions.** Is a `scope-grant` an IR `Permissions` resource, or Agent-level metadata? It's
   path-scoped authority bound to one agent — model it where koine's IR puts agent-scoped permissions.
3. **The emitter seam.** Cleanest is a new `render.ir` (sibling to `render.claude_code`) that `resolve.py`
   targets, then koine compiles IR→dialects — vs koine ingesting the existing claude-code `.md`. The former
   is canonical (mind speaks IR natively); the latter is a lift. My lean: **emit IR natively** (mind → IR is
   the source-of-truth path; claude-code becomes one adapter output, not the emitter). Your architecture call.

## Done-when

- `resolve.py` (or a sibling) emits mind's composed agents+skills as koine IR.
- koine compiles that IR to **≥2 client dialects** (claude-code + one of codex/cursor/…), **round-trip clean**
  (IR → dialect → IR is identity, per koine's round-trip contract).
- The claude-code output via the IR path is byte-equivalent to today's direct render (or the diff is an
  intended, reviewed improvement) — so B4 doesn't regress the proven render.
- Unblocks C1 (greenfield-init) / C2 (brownfield-rebase) / C3 (Oikos): a founded society's culture compiles
  to the Operator's chosen client(s).

*(This is the C-phase bottleneck — every instantiation task waits on it. Nico's mapping above is the contract;
the IR-schema specifics, the emitter seam, and the adapter wiring are Mav's koine engineering.)*
