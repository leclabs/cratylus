# NORTH-STAR — target architecture (v1, post-debate · CONVERGED)

Author: nico (design authority). Reviewers: 3 adversarial mavs (M1 boundaries/DI · M2 purity/dedup ·
M3 memory/citation). F1 resolved by an isolated Ω\* cold read. ρ=LLM.
Grounding: `ENGINE ⊥ MODEL` (ENGINE.md); "canon is source of truth, targets are projections" (VISION).
Status: converged; pending Operator sign-off before wave-2 execution.

---

## 0. Package charters (revised by debate — MECE)

| package                                         | question                                        | owns                                                                                                                                                                                  | may import                                                               |
| ----------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **agent-forge** = ENGINE                        | how is a cell manufactured/validated/shipped?   | IR · compose · adapters · **deploy** · **projection** · catalog-discovery · the accept-gate **ALGORITHM** · CLI                                                                       | node · own core · **agent-memory _as a doctrine-agnostic tool_** (M1-O4) |
| **agent-anatomy** = CANON                       | what cells exist + what an agent IS at runtime? | corpus cells · runtime substance (hook `.sh`, judge prompt, bundles) · **the accept-gate POLICY-DATA** (palimpsest tokens · operator-lexicon · repo-guard) injected into forge's gate | `type` from forge + value at its **composition roots**                   |
| **agent-memory** = memory MECHANISM (leaf tool) | what is the deterministic memory mechanism?     | the `episodic` tool + a pure `seed.ts` (filenames · seed-if-absent · v1-retirement). NOT the memory _concept_, NOT doctrine.                                                          | node only                                                                |

**§0.1 — MEMORY IS A CROSS-CUTTING CONCERN, NOT A PACKAGE (corrected after Operator probe).**
The memory _concept_ lives in CANON (anatomy), across three cell layers; `agent-memory` is only the mechanism.
| memory layer | home | role |
|---|---|---|
| model + protocol + **the `bundle:` that ships the tool** | `genus/memory.md` (anatomy, `kind:structure`) | the organ HOME + doctrine (ONE home) + deploys `episodic.mjs` to `~/.claude/skills/memory/` |
| lifecycle **rituals** | `skills/{dream,wake,handoff,carry-on}.ts` (anatomy) | the protocol the agent RUNS; invoke the tool; `wake≜dream`, `handoff≜praxis·dream` |
| organ-value cells | `organs/memory/*.ts` (anatomy) | the anatomy enum slot |
| deterministic **mechanism** | `agent-memory` (leaf tool) | `episodic.mjs` — invoked by the rituals, bundled by the genus |
Discipline governing the ritual skills = **V4** (express protocol + invoke + carry the reasoning-contract;
never re-derive mechanics) + **V1** (doctrine's one home = the genus) + the **bundle seam** (V6, extended below).
**DAG (clean, acyclic):** `agent-memory` imports nobody → it is BOTTOM-layer infra that BOTH forge (seed
vocabulary, V1) AND anatomy (`genus bundle:`) depend on. Not an ENGINE⊥MODEL peer — a shared leaf tool.

**Boundary invariants (corrected):**

- **forge MUST NOT import anatomy** — reason: cycle + doctrine-agnosticism (NOT a blanket "node-only" box; that
  wrongly excluded the harmless memory tool and forced V1's bad cut). [M1-O4]
- **forge MAY import agent-memory** as a tool — DAG-safe (memory imports nobody). Requires memory to expose real `exports`.
- **anatomy → forge is `type`-only EXCEPT the composition roots** that instantiate corpus cells against generic
  forge lifts (`hookSources`, `project-human` value-import forge TODAY — `project-human.ts:11`, `project-cli.ts:31`).
  The draft's flat "type-only" claim was FALSE. [M1-O5] Aspirational ENGINE-pure form: anatomy PROJECTS its
  hook/rule cells to a directory forge's deploy DISCOVERS (as it already discovers agents/skills) → zero import.

## 1. Current-state wiring (censused)

```
agent-anatomy (CANON)                                    agent-forge (ENGINE)          agent-memory (tool)
 organs·agents·skills·hooks·rules·genus                   core/{ir,engine,serialize,    cli·node·store·dream·
 toolkit/ ─ project* · project-human · project-targets ─▶ adapter,exemplify}           route·fold·session·
          ─ cold-oracle/{accept,residue,…}  (accept GATE) anatomy·catalog·adapters/*   lock·audit·migrate
          ─ hooks.ts (generic lift + specific cells)      deploy/{deploy,scope,local,
          ─ guardrail/*.sh · judge-prompt  ✔stay          ssh,hooks,bundle,init,
          ─ operator-lexicon·hook-cell·rule-cell          seeds ⟵ MEMORY DOCTRINE}     ⟵ copied doctrine
   │ type-only + value at composition roots ─────────────▶  ▲ forge cannot import memory ⇒ seed content COPIED
   └ bundle path string ────────────────────────────────────────────────────────────▶ episodic.mjs (D3 silent seam)
 accept-gate value-imports corpus policy: accept.ts:166-169 polis/oikos/conatus · residue.ts:43 operator-lexicon · cold-oracle.sh:29 repo-path
```

## 2. Violation → resolution (final)

| #      | violation                                                                                                                                                               | resolution                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **V1** | `deploy/seeds.ts` authors memory-store CONTENT; doctrine TRIPLED (`seeds.ts:37` ≡ `genus/memory.md:19` ≡ `route.ts:11`); forge can't import memory ⇒ copy [B1,D4,A2,A3] | **3-way split** (M3+M1+M2): (a) **content/doctrine → `genus/memory.md`** (the organ = ONE home; kills the triple); (b) **stores seed as minimal scaffold** (header + "empty; dream fills"), no doctrine paragraph (`episodicSeed` already `''`); (c) **mechanism facts → pure `agent-memory/src/seed.ts`** (filenames · seed-if-absent · v1-retirement); **forge imports it** (charter now admits memory-as-tool); placement stays portable — local write (`local.ts:63`) + ssh `cat` heredoc (`ssh.ts:155`), **no subprocess, no remote node** [M1-O3].                                                                                                                                                                   |
| **V2** | projection + accept-gate in anatomy [C1]                                                                                                                                | **projection tooling → forge** (`project*`, `project-human`, `project-targets`, `organ-docs`, `project.ts` — already import forge downward). **accept-gate SPLIT** [M1-O1, the strongest objection]: pure **leg-witness algorithm** (`canonical/signified/coldBlindStatic/partitioned/parsimonious/regenerable`) → forge; **doctrine POLICY** (palimpsest tokens `accept.ts:166-169`, operator-lexicon, repo-guard `cold-oracle.sh:29`) stays anatomy, **injected**: `universalCell(cell, homes, policy)`. Forge defines the interface; anatomy supplies corpus values. Prevents planting `polis` inside the "doctrine-agnostic" engine.                                                                                   |
| **V3** | `hooks.ts` straddles [C1]                                                                                                                                               | generic `hookIrOf` → forge (doctrine-free); specific hook CELLS stay anatomy; **the composition root `hookSources` is the honest residual value-edge** (anatomy knows which cells exist; forge must not) [M1-O5] — or project-to-directory for the ENGINE-pure form.                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **V4** | prose re-specifies tool [C3-Inv2]                                                                                                                                       | **REFINED** [M3]: delete the algorithm's **internals** (marker enum · liveness _predicate_ `age<2h` · lock O_EXCL/2h · drain `.bak`/`--keep` · record schema — the agent reads a bare `live` word, never computes it). **KEEP the CONTRACT the agent's reasoning consumes**: `scope = node(cwd)` causality + cwd-coupling (`genus/memory.md:24,26`), `node∉{HOME,legacy} ⇒ ∉{SEMANTIC,PROCEDURAL}`, encode-never-judges-scope, why `audit` can fail. Blanket-delete would strip the routing model's grounding.                                                                                                                                                                                                             |
| **V5** | citation cruft [C3-Inv1]                                                                                                                                                | **KILL** (unanimous, confirmed): `[[wikilink]]` syntax, the orphaned `REF_RE` parser + `hasProseFormula`/CITE-TWICE arm (`skill-shape.test.ts:86` — guards dead syntax, matches zero live cells), the unimplemented docs:check gate.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **F1** | keep/kill the prose `≜`-formula sibling reference?                                                                                                                      | **RESOLVED by isolated Ω\*** (not the warm mav read). Cold reader decodes `dream ≜ read⟨EPISODIC⟩ ↦ exemplify ↦ materialize` as a **coherent self-sufficient definition** (generic ops, no external lookup needed); positive control passed. ⇒ the prose `≜` formula is the skill's **DEFINITION** (load-bearing, cold-valid — **KEEP**); the composition **EDGE** lives in the ESM `composition` field (single checked home — **KEEP**). **Different concerns, not palimpsest.** My draft's premise ("skills can't import") was FALSE; M3's kill-verdict was warm over-read. The `≜`-composition convention **STANDS**.                                                                                                   |
| **V6** | invisible coupling [D3]                                                                                                                                                 | **SHRUNK** [M1-O6, M2-O1]: kill the unified manifest (MECE violation). Bundle-path silent break is **already caught** (`bundle.ts:39-51` `BundleMissingError`) → reduce to ONE exported bundle-path constant covering BOTH the forge-side refs (`bundle.ts:47`, `cli/commands/deploy.ts:78`) AND the anatomy-side `genus/memory.md:5` `bundle:` declaration (the memory-concern seam surfaced by the Operator probe). **A1 config-reader dedup CUT** — non-finding: forge & memory read DISJOINT field-sets, no shared logic, every shared home breaks an invariant. Corpus-dir stays runtime discovery.                                                                                                                   |
| **V7** | impurity/dup [C2 §C/D]                                                                                                                                                  | **DISSOLVED** into per-item [M2-O3/O4/O6]: dream-partition, config-merge, ulid, migration extractions **REJECTED as purity-theater** (seams already injected: `rename`, `resolveNode`, `monotonicFactory`). Seed purity **subsumed by V1**. `organTitle` dedup **subsumed by D2**.                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **D2** | codex→claude sideways edge                                                                                                                                              | move the real payload `agentBody`+`organTitle`+`organField` (not just the already-neutral `skillBody`) to a neutral home (mint `core/anatomy-body`, NOT `core/exemplify` — charter stretch); **subsumes A4** (`organTitle` twin in `project-human.ts:29` collapses) [M2-O5].                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **F3** | ambiguous cells                                                                                                                                                         | `hook-cell`/`rule-cell` **types → forge** (audit `rule-cell.ts` for corpus literals first); **operator-lexicon STAYS anatomy** (doctrine data, injected into the gate — moving it to forge is invariant-#3 in the open) [M1-O2].                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **V8** | **harness-specifics leak into canon bodies + deploy is claude-only** [C4] — "author once, realize everywhere" is FALSE today; only claude deploys end-to-end            | **Two-part fix.** (1) **Body path-binding through the adapter:** canon bodies must reference the tool/home/session via harness-neutral tokens (`${SKILLS_DIR}` · `${AGENT_HOME}` · `${SESSION_ID}`), resolved per-harness. Kills the ~/.claude literals in `genus/memory.md:24,26,42,44-51`, `wake.ts:6-9`, `handoff.ts:16`, hook cells `$HOME/.claude/hooks/`, and `CLAUDE_SESSION_ID`. (2) **Adapter-parameterize deploy:** `deploy/{scope,local,ssh,init}` + `found` must place through the SELECTED adapter's `paths.ts`, not a hardcoded `.claude/` root; wire the existing-but-orphaned codex (and other) projectors into deploy; the memory `bundle` lands at the per-harness skills-dir. **See fork F5-strategy.** |

**Design fork F5-strategy (V8, needs a call):** how are the neutral tokens bound?

- **(A) projection-time substitution** — the adapter rewrites `${SKILLS_DIR}` etc. → concrete per-harness
  absolute paths at deploy. Bodies ship self-contained + correct. Cost: refines the thin-generator law to
  `SKILL.md = f(name, block, composition, adapter-path-bindings)` — projection now touches body content
  (today `skill-cell.ts:77` is deliberately verbatim). Aligns with VISION ("runtime = a PROJECTION").
- **(B) runtime indirection** — bodies keep env tokens; a per-agent shim the deploy installs sets
  `${AGENT_HOME}`/`${SKILLS_DIR}`/`${SESSION_ID}` per host. Preserves verbatim bodies. Cost: needs a reliable
  runtime binding that does NOT exist today (AGENT_HOME was UNSET at my own wake — I had to derive it).
- **nico lean: (A).** The deployed artifact should be concrete per its harness (VISION: deterministic
  deployment artifacts); the "verbatim body" stance is exactly what F5 shows is the defect. But this is an
  ENGINE-shape decision — Operator call + possibly a dedicated mav round.

## 2.1 Decoupling deltas — ports & adapters (round-2 reviewers; see DECISIONS.md)

Structural move **D-contract:** extract a pure `agent-contract` package (types + ports `AcceptPolicy ·
SeedProvider · BundleArtifact · HarnessAdapter · FoundingTemplate`, imports NOBODY); forge/anatomy/memory
each depend ONLY on it; concretes wired once at the CLI composition-root ⇒ **zero peer-to-peer package edges.**

| #                    | violation                                                                                                                                                                                                                                       | resolution                                                                                                                                                                                                                                                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **V-init** (LIVE)    | `deploy/init.ts:1,3,15,38,111,138,140,161,201` hardcodes the corpus mythology `polis`/`politeia`/`mind-society`. ENGINE-doctrine-agnosticism forbids the engine naming any concrete corpus token (peer of V2, NOT gated on corpus-swap).        | founding prose is CANON → `FoundingTemplate` port; `init.ts` emits structure + placeholders, injected with anatomy-supplied content at the composition-root. Forge carries zero corpus literals.                                                                                                                            |
| **V-mem-contract**   | the `episodic` CLI contract is tripled: `cli.ts` (authority) · forge identity (`bundle.ts:47`, `cli/commands/deploy.ts:78`) · CANON prose restating every verb (`genus/memory.md:5,26,42,44-51`, `wake.ts:6-9`, `handoff.ts:16`, `dream.ts:9`). | CLI surface = ONE referenced contract; `BundleArtifact` carries the descriptor; genus references it via registry, not the `../agent-memory/dist/episodic.mjs` string. Prose keeps only tool-can't-encode reasoning (routing policy, `route.ts:82-89`). **Residual: verb vocabulary stays in CANON prose — see invariants.** |
| **V-pkg**            | `agent-memory/package.json` has NO `exports`; forge's "dep" is copied vocabulary (`seeds.ts:75-76` ≡ `route.ts`) + a bundle string, not an import. A package no one imports as code is a build artifact with a duplicated contract.             | add `agent-memory` `exports` exposing a `SeedProvider` impl of the contract port; forge imports it (DAG-safe: memory→contract only). Kills the copied vocabulary (D4 cause). The port edge is what justifies memory as a leaf package.                                                                                      |
| **V-diagram-§3**     | `DIAGRAM.md §3` states "depended on by BOTH … acyclic" as PRESENT fact; reality is a string/bundle seam, no code import.                                                                                                                        | split current (string+copied-vocab seam) vs target (typed `SeedProvider`/`BundleArtifact` import via `agent-contract`).                                                                                                                                                                                                     |
| **V-adapter-path**   | `DIAGRAM.md:78` draws `adapter → tool path rewrite` — adapter knowing the tool's concrete path re-couples engine→tool identity.                                                                                                                 | tool-BLIND adapter: `HarnessAdapter` exposes a generic path-token resolver + skills-dir; memory placed spec-driven (`deploy.ts:78` `<skill>=<spec>`). Bundle lands like any skill.                                                                                                                                          |
| **V-harness-select** | anatomy value-imports concrete adapters (`project-cli.ts:29` claude, `project-cli-codex.ts:24` codex) + sideways `codex/anatomy.ts:23`. CANON knowing concrete harnesses; codex a claude-derivative.                                            | anatomy CLIs SELECT an adapter by NAME from the registry (`HarnessAdapter` port); never import concrete modules. Kill sideways edge via `core/anatomy-body` relocation (D2). Harness knowledge is ENGINE's.                                                                                                                 |

**Substitutability verdict (under the decisions):**

- **Harness — swappable YES**, execution-gated on: (a) F5(A) actually rewriting bodies at projection
  (refines the verbatim-emit law `skill-cell.ts:77`); (b) all `~/.claude` literals → tokens; (c) D2 relocation
  - sideways edge gone. Codex-end-to-end is the acid test.
- **Memory — swappable for FORGE** (code contract via ports), **bounded SEMANTIC dependency for CANON** (verb
  vocabulary in ritual prose). This is **by-design per D-scope** (episodic = the singular mechanism), NOT a
  defect. Literal tool-swap-without-touching-CANON would require injecting the verb vocabulary too — out of scope.

**Two invariants (or the coupling returns):**

1. `agent-contract` stays PURE — zero string literals of any package/tool/corpus identity (no `episodic.mjs`
   in `BundleArtifact`, no `polis` in `AcceptPolicy`), else peer coupling reappears through the contract.
2. The composition-root may import the memory plugin + adapters + `agent-contract`, but must **discover** the
   anatomy corpus as a DIRECTORY (`catalog/index.ts:12`), never statically import the anatomy package — else
   the forbidden forge→anatomy cycle returns.

## 3. Target-state wiring

```
agent-anatomy (CANON)                    agent-forge (ENGINE)                     agent-memory (tool)
 organs·agents·skills·hooks(CELLS)·       core/{ir,engine,serialize,adapter,       cli: …existing…
 rules·genus (ONE home for memory          exemplify}                              + pure seed.ts (filenames·
 doctrine)                                anatomy·catalog                            seed-if-absent·v1-retire)
 runtime substance: guardrail/*.sh·       adapters/<harness>/*                     ▲ forge imports seed.ts
 judge-prompt·bundles                     core/anatomy-body (agentBody·organTitle· │  (tool dep, DAG-safe)
 accept POLICY-DATA (palimpsest·           organField — was sideways)              │
 operator-lexicon·repo-guard) ──inject──▶ projection/ (was toolkit):               │
 composition roots (hookSources,           project·project-human·project-targets   │
 project-human) ──value/or project-dir──▶ validate/ (was cold-oracle): ALGORITHM   │
                                           only; policy injected                   │
                                          deploy/{…,init} placement-only ──imports seed.ts──┘
   bundle-path: ONE exported constant ▲ (BundleMissingError already guards)
```

Net: anatomy carries zero manufacture tooling AND is the single home for memory doctrine; forge owns all
projection/validation/deploy but the gate's DOCTRINE is injected (never planted in the engine); memory owns
all memory mechanics; the one real silent seam (bundle path) becomes a typed constant.

## 4. Debate ledger — see §resolutions; all objections ADOPTED except:

- **M3-F1 kill-the-≜-formula: REBUTTED** by isolated Ω\* (self-sufficient definition ≠ palimpsest); wikilink-kill portion adopted.
- **M1-O6 config→shared-reader vs M2-O1 config-is-non-finding: sided with M2** (disjoint field sets; stronger evidence). A1 cut.
  No surviving unaddressed objection. Convergence: 3/3 mav + nico, F1 by instrument.
