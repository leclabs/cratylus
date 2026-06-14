# B4 — culture→IR bridge

**State:** active (core bridge proven; 2nd-dialect + round-trip = follow-on) · **Lead:** Mav (koine IR) + Nico (mapping) · **Phase:** B (machinery) · **Dep:** B1 ✓, A5 ✓

## Core bridge PROVEN (Mav agent → verified + integrated by Nico, 2026-06-14, `07d4b94`/`3f70556`)

The mind→IR emitter exists and the IR is **reconstruction-sufficient** (lossless). Verified independently by
Nico (the parity gate is objective):

- `render/ir.py` (`DecoratedDoc → koine IR Agent/Skill`) + `resolve.emit_ir()` + `emit_ir.py` CLI. The
  `provenance_header` (GENERATED law) factored to one home, shared with `render/claude_code.py` —
  byte-identical (`test_reader_axis` determinism PASS).
- **PARITY (the key gate, re-verified):** mind → IR → claude-code reconstruction is **byte-equal to the
  proven direct render** — all 11 agents + 7 skills, diff empty (`test_ir_bridge`). The bridge does NOT
  regress the render proven for #3.
- **koine round-trip clean for claude:** `read(write(IR))` recovers name/description/body byte-identical;
  IR `validateIR` true; koine's real `claudeAdapter.write` → 18 files, 0 warnings.
- mind suite 11/11 (+`test_ir_bridge`); `verify.py` PASS (R1+R2+R3).

**Mav's 3 architecture decisions (flag for live-Mav to bless):** (1) Skill→IR `Skill` (trigger carried via
`manifest.overrides.<adapter>.skill_triggers`, not a schema field); (2) scope-grants → **NOT** the koine
`Permissions` resource (that's tool-matcher settings) — grants ride as composed `Agent.body` prose (as the
proven render does); (3) `render.ir` sibling, mind speaks IR natively. **Sound call worth live-Mav's eye:**
the agent did NOT fork koine's claude adapter to byte-match mind's hand-rolled YAML (koine normalizes:
name-from-filename, emoji-escape, no trigger field) — it proved IR *reconstruction-sufficiency* instead, so
koine keeps "dialects not doctrine" + its round-trip contract. "Parity" therefore = lossless IR, not
adapter-byte-identity.

**Remaining for the full done-when (Mav-lead):** 2nd-dialect parity (codex/cursor) + IR→dialect→IR
round-trip-clean across all 18 artifacts (proven for claude only); and whether claude-code should surface
`trigger:` (koine's claude adapter currently drops the manifest override — an adapter enhancement).

## Multi-dialect round-trip PROVEN (Mav agent → for Nico to verify + integrate, follow-on pass)

The done-when's "≥2 dialects round-trip clean" is met. 2nd dialect = **codex**, chosen because its declared
capabilities are the only OTHER adapter with **both** `agents: full` AND `skills: full` (cursor/gemini are
`partial`, copilot is `partial` on agents) — the cleanest genuine fit for mind's IR feature set (Agent +
Skill). codex carries the agent body as TOML `system_prompt` and skills as `SKILL.md`; both recover to IR.

- **OBJECTIVE GATE (the round-trip identity Nico re-verifies):** for mind's emitted IR (all 18 artifacts:
  11 agents + 7 skills), `read(write(IR)) == IR` — **structural identity on the IR resources** — holds for
  **claude AND codex** with **zero warnings, zero skips**. Test:
  `packages/koine/adapters/test/ir-bridge/round-trip.test.ts` (9 cases) against the committed fixture
  `mind.koine.json` (the real `emit_ir.py` output). Identity is on the IR (the waypoint), NOT dialect bytes
  — koine normalizes per-dialect (claude `.md` front-matter vs codex `.toml`), so the gate lives on the IR,
  per the core-pass principle (do not fork adapters to byte-match).

- **COVERAGE MAP (lossy-vs-clean, all 10 adapters — koine's "declare support honestly", evidence-backed not
  assumed):**

  | adapter | agents | skills | mind's IR (11 agents + 7 skills) round-trip |
  |---|---|---|---|
  | **claude** | full | full | **CLEAN** — reference adapter; all 18 recover, 0 warn |
  | **codex** | full | full | **CLEAN** — 2nd dialect; all 18 recover via TOML+SKILL.md, 0 warn |
  | copilot | partial | full | lossy: 7 skills clean; 11 agents partial (subagent support experimental) |
  | cursor | partial | partial | lossy-by-design: 7 skills clean; **11 agents skipped + warned** (verified) |
  | gemini | partial | partial | lossy: skills work (some metadata ignored); agents partial (.md, evolving) |
  | opencode | none | partial | lossy-by-design: 7 skills clean (allowed_tools dropped); **11 agents skipped + warned** (verified) |
  | crush | none | partial | lossy: skills partial; no subagent system → agents dropped |
  | cline | none | none | lossy: rules-only; drops all agents + skills |
  | continue | none | none | lossy: rules+mcp only; drops all agents + skills |
  | aider | none | none | lossy: rules only; drops all agents + skills |

  Lossy adapters **skip + warn, never silently corrupt** — asserted for cursor + opencode in the test (the 11
  agents land in `WriteReport.skipped` with a warning; their supported subset, the 7 skills, still
  round-trips clean). "Round-trip clean" is claimed ONLY for claude + codex; the rest are reported lossy, not
  forced.

- **mind-side guard:** `test_ir_bridge.py` gains `test_roundtrip_ready` — asserts the IR-emit *preconditions*
  for the round-trip (every name a kebab slug → filename-safe → recovers through the dialect filename; every
  skill has `description`, else `parseSkill` throws; non-empty bodies; no leading-`---` body) so a corpus
  change that would break a dialect fails at the source, not only in the koine fixture. claude byte-parity
  NOT regressed.

- **Gates green:** `pnpm build` + `pnpm test` (koine-core 60, koine-adapters 52 incl. the 9 new, cli 14) +
  `pnpm lint` (the generated fixture is biome-ignored, as `generated.ts` already is); mind `verify.py` PASS
  (R1+R2+R3); `test_ir_bridge` PASS.

**Remaining for B4 fully done (small):** the `trigger:` surfacing question is unchanged (claude adapter drops
the `manifest.overrides.<adapter>.skill_triggers` carrier — an adapter enhancement, orthogonal to the
round-trip gate, deferred). The fixture is a committed snapshot of `emit_ir.py` output — regenerate it
(`cd packages/mind && python3 toolkit/emit_ir.py <fixture> --target claude --target codex`) when the corpus
roster changes; `test_roundtrip_ready` guards the emit side so drift surfaces. Flag for **live-Mav**: bless
codex as the canonical 2nd dialect + the lossy coverage map as the honest support contract.

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
