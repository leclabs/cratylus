# NORTH-STAR — target architecture (converging via iterative cold review)

Author: nico (design authority). Reviewed across 5 adversarial-mav rounds + isolated Ω\* cold reads. ρ=LLM.
Grounding: `ENGINE ⊥ MODEL` (ENGINE.md); "canon is source of truth, targets are projections" (VISION).

> **READ §5 (packages/ports) + §6 (memory packaging) + §7 (memory MODEL) — the NET-CURRENT sections.** §5 =
> the 3-package architecture. §6 = memory as a standalone installed tool at `~/.agents/<name>` (`genus/memory.md`
> deleted, V8/F5 dissolved). **§7 = the memory MODEL: the 4-part CoALA taxonomy (Working·Episodic·Semantic·
> Procedural); `vault`/cross-host EXTRACTED as out-of-scope.** §7 supersedes the "5 homes" framing in §0.2/§5.3/§6.
> §0–§4 are the reasoning trail, superseded by §5/§6/§7 on conflict.

---

## 0. Package charters (revised by debate — MECE)

> **SUPERSEDED by §5.1** — §0/§0.1/§0.2 predate the round-5 drop of `agent-contract`. The authoritative
> charter is the §5.1 three-package table. Any "agent-contract" / "forge imports agent-memory" phrasing below
> is stale trail; read §5.1.

| package                                         | question                                        | owns                                                                                                                                                                                            | may import                                                                                                  |
| ----------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **agent-forge** = ENGINE                        | how is a cell manufactured/validated/shipped?   | IR · compose · adapters · **deploy** · **projection** · catalog-discovery · the accept-gate **ALGORITHM** · CLI                                                                                 | node · own core · **`agent-contract`** (composition-root, not core, imports agent-memory + adapters — §2.3) |
| **agent-anatomy** = CANON                       | what cells exist + what an agent IS at runtime? | corpus cells · runtime substance (hook `.sh`, judge prompt, bundles) · **the accept-gate POLICY-DATA** (palimpsest tokens · operator-lexicon · repo-guard) injected into forge's gate           | `type` from forge + value at its **composition roots**                                                      |
| **agent-memory** = memory MECHANISM (leaf tool) | what is the deterministic memory mechanism?     | the memory tool over ALL homes (episodic·semantic·procedural·AGENTS·vault) — store/retrieve/land/replace/forget + `seed.ts`. NOT the memory _concept_, NOT doctrine, NOT the routing reasoning. | node only (recall/embeddings live in the vault adapter, not the core)                                       |

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

**§0.2 — MEMORY MECHANISM covers all homes, via WIRE+GENERALIZE not a new service (Operator #2, round-3).**
Operator #2 ("all memories abstractly accessible via the tool") SUPERSEDES §0.1's "episodic-only mechanism"
— but grounded in code + industry, the deliverable is to WIRE the write-engine THAT ALREADY EXISTS, not build
a uniform CRUD service (anti-complexity).

- **WIRE = build a data-adapter, not surface a closure (F1):** `dream.ts:200` `applyRoutes(store, path,
Classifier)` lands content into homes via an INJECTED in-process classifier (`route.ts:82-89`) — the P2 cut
  realized. But the classifier is a JS CLOSURE the out-of-process agent IS; a CLI subprocess can't receive it.
  So the `apply`/`land` verb accepts the agent's route-decisions as DATA (`apply --routes '[{id,targets[]}]'`)
  and the classifier collapses to an id→decision lookup — a data-driven adapter around `compact`+`appendToHome`,
  NOT zero-logic. ZERO callers + no CLI verb today (`cli.ts:595-611`).
- **Homes, not CoALA-4 types:** keep the 5 real homes `route.ts:25` (SEMANTIC·PROCEDURAL·AGENTS@node·vault·
  EPISODIC). Type (why: episodic/semantic/procedural/working) and home (where) are TWO axes; don't collapse.
- **Two families by STORE-SHAPE, not CoALA-type (F2/F3):** (a) the ONE record log = EPISODIC (append/read +
  existing `drain`/`compact` by-id = forget); (b) the FOUR prose homes = {SEMANTIC · PROCEDURAL · AGENTS@node ·
  vault} — ALL append-only today (`dream.ts:224`), all with the identical depalimpsest gap
  (`skills/dream.ts:22,42` requires supersede). Prose gets ONE new verb **`replace`** = agent authors the WHOLE
  new file, tool atomic-writes (the `compact` tmp+rename, `dream.ts:149-159`). On prose `replace ≡ forget` —
  do NOT mint a separate `forget`. **Pin (F4): `replace` is whole-file only — no sub-file/line/anchor addressing.**
- **Reads stay agent-direct (F5-read):** "accessible via the tool" = the WRITES the agent can't do
  atomically/by-id (encode·land·replace·drain) + EPISODIC read (needs the liveness/scope filter). Resident-prose
  READ stays a plain agent file-read (`wake.ts:9`) — routing a whole-file read through a subprocess is
  indirection for zero capability, against the tool's charter ("only the act the agent can't do by hand",
  `genus/memory.md:55`).
- **Lock obligation (F5):** the new prose-write verbs touch the lock-guarded {SEMANTIC·PROCEDURAL} partition
  (`genus/memory.md:51`); they MUST inherit the ritual's `lock acquire/release` (as `drain` does) — a CLI
  `apply`/`replace` outside the lock corrupts under concurrent dreams.
- **P2 line:** tool owns storage/retrieval/atomic-land/replace; AGENT authors the record CONTENT + owns the
  consolidation STRATEGY (the route-decision). = Letta `core_memory_replace`-with-agent-text.
- **recall (embedding search) stays OUT of the portable core** — it breaks "runs anywhere, no install"
  (`genus/memory.md:42`, V1 no-subprocess); a vault-adapter capability, not a core per-type op.
- **working memory = the context window, NO store** (CoALA; `genus/memory.md:22`). Closed.
- **Transport:** CLI portable core NOW; MCP a LATER P4 adapter over the same core. **P5 `--describe`: DEFERRED**
  — no standard requires it for the CLI phase; its only consumer is the later MCP adapter (anti-complexity).
- **SeedProvider fold:** the seed ACT (init-if-absent) folds into the memory tool; seed CONTENT stays CANON.

**Boundary invariants (corrected):**

- **forge MUST NOT import anatomy** — reason: cycle + doctrine-agnosticism (NOT a blanket "node-only" box; that
  wrongly excluded the harmless memory tool and forced V1's bad cut). [M1-O4]
- **forge CORE imports only `agent-contract`**; the **composition-root** (not core) imports concretes —
  agent-memory's `seed()` + the selected adapter (§2.3). memory exposes real `exports`; DAG-safe (memory imports nobody).
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

| #      | violation                                                                                                                                                               | resolution                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **V1** | `deploy/seeds.ts` authors memory-store CONTENT; doctrine TRIPLED (`seeds.ts:37` ≡ `genus/memory.md:19` ≡ `route.ts:11`); forge can't import memory ⇒ copy [B1,D4,A2,A3] | **3-way split** (M3+M1+M2): (a) **content/doctrine → `genus/memory.md`** (the organ = ONE home; kills the triple); (b) **stores seed as minimal scaffold** (header + "empty; dream fills"), no doctrine paragraph (`episodicSeed` already `''`); (c) **mechanism facts → pure `agent-memory/src/seed.ts`** (filenames · seed-if-absent · v1-retirement); **the composition-root calls it** (§5.1; forge core stays memory-free); placement stays portable — local write (`local.ts:63`) + ssh `cat` heredoc (`ssh.ts:155`), **no subprocess, no remote node** [M1-O3].                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **V2** | projection + accept-gate in anatomy [C1]                                                                                                                                | **projection tooling → forge** (`project*`, `project-human`, `project-targets`, `organ-docs`, `project.ts` — already import forge downward). **accept-gate SPLIT** [M1-O1, the strongest objection]: pure **leg-witness algorithm** (`canonical/signified/coldBlindStatic/partitioned/parsimonious/regenerable`) → forge; **doctrine POLICY** (palimpsest tokens `accept.ts:166-169`, operator-lexicon, repo-guard `cold-oracle.sh:29`) stays anatomy, **injected**: `universalCell(cell, homes, policy)`. Forge defines the interface; anatomy supplies corpus values. Prevents planting `polis` inside the "doctrine-agnostic" engine.                                                                                                                                                                                                                                                                                                                                                                                 |
| **V3** | `hooks.ts` straddles [C1]                                                                                                                                               | generic `hookIrOf` → forge (doctrine-free); specific hook CELLS stay anatomy; **the composition root `hookSources` is the honest residual value-edge** (anatomy knows which cells exist; forge must not) [M1-O5] — or project-to-directory for the ENGINE-pure form.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **V4** | prose re-specifies tool [C3-Inv2]                                                                                                                                       | **REFINED** [M3]: delete the algorithm's **internals** (marker enum · liveness _predicate_ `age<2h` · lock O_EXCL/2h · drain `.bak`/`--keep` · record schema — the agent reads a bare `live` word, never computes it). **KEEP the CONTRACT the agent's reasoning consumes**: `scope = node(cwd)` causality + cwd-coupling (`genus/memory.md:24,26`), `node∉{HOME,legacy} ⇒ ∉{SEMANTIC,PROCEDURAL}`, encode-never-judges-scope, why `audit` can fail. Blanket-delete would strip the routing model's grounding.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **V5** | citation cruft [C3-Inv1]                                                                                                                                                | **KILL** (unanimous, confirmed): `[[wikilink]]` syntax, the orphaned `REF_RE` parser + `hasProseFormula`/CITE-TWICE arm (`skill-shape.test.ts:86` — guards dead syntax, matches zero live cells), the unimplemented docs:check gate.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **F1** | keep/kill the prose `≜`-formula sibling reference?                                                                                                                      | **RESOLVED by isolated Ω\*** (not the warm mav read). Cold reader decodes `dream ≜ read⟨EPISODIC⟩ ↦ exemplify ↦ materialize` as a **coherent self-sufficient definition** (generic ops, no external lookup needed); positive control passed. ⇒ the prose `≜` formula is the skill's **DEFINITION** (load-bearing, cold-valid — **KEEP**); the composition **EDGE** lives in the ESM `composition` field (single checked home — **KEEP**). **Different concerns, not palimpsest.** My draft's premise ("skills can't import") was FALSE; M3's kill-verdict was warm over-read. The `≜`-composition convention **STANDS**.                                                                                                                                                                                                                                                                                                                                                                                                 |
| **V6** | invisible coupling [D3]                                                                                                                                                 | **SHRUNK** [M1-O6, M2-O1]: kill the unified manifest (MECE violation). Bundle-path silent break is **already caught** (`bundle.ts:39-51` `BundleMissingError`) → reduce to ONE exported bundle-path constant covering BOTH the forge-side refs (`bundle.ts:47`, `cli/commands/deploy.ts:78`) AND the anatomy-side `genus/memory.md:5` `bundle:` declaration (the memory-concern seam surfaced by the Operator probe). **A1 config-reader dedup CUT** — non-finding: forge & memory read DISJOINT field-sets, no shared logic, every shared home breaks an invariant. Corpus-dir stays runtime discovery.                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **V7** | impurity/dup [C2 §C/D]                                                                                                                                                  | **DISSOLVED** into per-item [M2-O3/O4/O6]: dream-partition, config-merge, ulid, migration extractions **REJECTED as purity-theater** (seams already injected: `rename`, `resolveNode`, `monotonicFactory`). Seed purity **subsumed by V1**. `organTitle` dedup **subsumed by D2**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **D2** | codex→claude sideways edge                                                                                                                                              | move the real payload `agentBody`+`organTitle`+`organField` (not just the already-neutral `skillBody`) to a neutral home (mint `core/anatomy-body`, NOT `core/exemplify` — charter stretch); **subsumes A4** (`organTitle` twin in `project-human.ts:29` collapses) [M2-O5].                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **F3** | ambiguous cells                                                                                                                                                         | `hook-cell`/`rule-cell` **types → forge** (audit `rule-cell.ts` for corpus literals first); **operator-lexicon STAYS anatomy** (doctrine data, injected into the gate — moving it to forge is invariant-#3 in the open) [M1-O2].                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **V8** | **harness-specifics leak into canon bodies + deploy is claude-only** [C4] — "author once, realize everywhere" is FALSE today; only claude deploys end-to-end            | **§6 SUPERSEDES the memory half of this** (memory paths become GENERIC — tool on PATH + `~/.agents/<name>` — so nothing to template for memory; only the SESSION-ID stays a per-face seam, bound at register). The templating fix below still applies to NON-memory face bodies (hooks etc.). **Two-part fix.** (1) **Body path-binding through the adapter:** canon bodies must reference the tool/home/session via harness-neutral tokens (`${SKILLS_DIR}` · `${AGENT_HOME}` · `${SESSION_ID}`), resolved per-harness. Kills the ~/.claude literals in `genus/memory.md:24,26,42,44-51`, `wake.ts:6-9`, `handoff.ts:16`, hook cells `$HOME/.claude/hooks/`, and `CLAUDE_SESSION_ID`. (2) **Adapter-parameterize deploy:** `deploy/{scope,local,ssh,init}` + `found` must place through the SELECTED adapter's `paths.ts`, not a hardcoded `.claude/` root; wire the existing-but-orphaned codex (and other) projectors into deploy; the memory `bundle` lands at the per-harness skills-dir. **See fork F5-strategy.** |

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

> **SUPERSEDED by §5.1/§5.2** — this block frames `agent-contract` as THE structural target; round-5 DROPPED
> that package (types → forge kernel; one port `HarnessAdapter`; concretes wired at the composition-root). The
> violation ROWS below (V1, V-pkg, …) remain the wave-2 execution spec; ignore the "extract agent-contract" /
> "forge imports it" framing.

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

## 2.2 Round-3 deltas — memory service + SRP audit (judged trust-but-verify)

**Adopted (verified real):**

| #                   | violation                                                                                                                                                                                                                                                                         | resolution                                                                                                                                                                                                         |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **V-mem-service**   | the memory MECHANISM is split by home: episodic is tool-wired, but the resident-home write-engine `applyRoutes` (`dream.ts:200`) is DEAD (no caller, no CLI verb) → the agent hand-edits SEMANTIC/PROCEDURAL markdown; append-only cannot depalimpsest (`skills/dream.ts:22,42`). | wire `applyRoutes` as an `apply`/`land` CLI verb + add **replace/forget** for resident prose; wake/dream read homes via the tool; preserve the 5 homes; recall stays vault-only; `--describe` verb (P5). See §0.2. |
| **V-init-extended** | `deploy/init.ts` leaks MORE than `polis`: `PLAN_STATES` (`:36`) duplicates praxis CANON (`skills/praxis.ts:5`), and `foundingAgentsMd`/`foundingPlanMd` (`:108,150`) are wholesale CANON founding-prose in the ENGINE.                                                            | the `FoundingTemplate` port carries the ENTIRE founding body from CANON; `PLAN_STATES` is sourced from the praxis canon, not hardcoded in forge. (Extends V-init beyond the token.)                                |

**Rejected (trust-but-verify — findings that did NOT survive):**

- **Two-accept-gates (SRP-A):** REJECTED. `exemplify()` (forge pipeline) and `universalCell` (anatomy cell
  gate) share the word "accept" but are distinct concerns — `exemplify` is the SKILL's factorization gate
  (Operator: "exemplify is a skill, obvious"). Not a duplication to unify.
- **`HUMAN_MARKERS` doctrine-leak (SRP-B):** REJECTED. Content (`register.ts:15`) = `please`/`thanks`/`!` —
  GENERAL human-register detection mechanism, legitimately engine-intrinsic; not corpus doctrine like `polis`.
- **`AcceptPolicy` over-bundle:** REJECTED. {palimpsest · operator-lexicon · repo-guard} is ONE cohesive
  corpus-policy object; splitting into 3 ports invents complexity. `operator-lexicon` stays injected policy
  data (round-1 F3 holds; the σ\* glyph set is per-corpus notation, not general mechanism).

## 2.3 Round-4 — port surface corrected + cross-round reconciliation (SUPERSEDED by §5)

> **SUPERSEDED by §5.1** — round-4 kept `agent-contract` as the shared TYPE kernel (a 4th package); round-5
> DROPPED the package (the kernel is IN forge). Read "agent-contract" below as "forge's TYPE kernel." The
> Cockburn port-vs-data distinction and C1–C5 reconciliation still hold; the 4th-package framing does not.

Cold SRP review: I over-stated the "5 ports." Corrected (Cockburn: a port = a behavioral driven/driving
interface with ≥2 adapters; a single-impl config is DATA, a shape is a TYPE):

| contract member                                               | what it really is                            | why                                                                                                                       |
| ------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **HarnessAdapter**                                            | the ONE behavioral **PORT**                  | ≥2 impls (claude·codex·15 more), methods vary                                                                             |
| **AcceptPolicy** {palimpsest · operator-lexicon · repo-guard} | injected **DATA** (a shape-TYPE in contract) | config the gate consumes; not a behavioral interface                                                                      |
| **FoundingTemplate** (founding prose + PLAN_STATES)           | injected **DATA**                            | corpus content the engine emits; not an interface                                                                         |
| **BundleArtifact**                                            | a descriptor **TYPE** (DTO)                  | R1-Q5 already said "type"; no behavior                                                                                    |
| ~~SeedProvider~~                                              | **DROPPED** — not a port                     | post-V1(b) strip: single impl, no corpus content flows, nothing varies → a plain `seed(dir,name)` verb on the memory tool |

⇒ **`agent-contract` = the shared TYPE kernel** (the anatomy type system + the DTO/data shapes) **+ one
behavioral port (`HarnessAdapter`)**. It earns its keep as Fowler _separated-interface_ (removes anatomy's
whole-package dep on forge) — minimal, not gold-plated.

**Cross-round reconciliation (supersedes earlier text where it conflicts):**

- **C1/C3 — forge↔memory:** forge **CORE never imports agent-memory** (stays memory-free; zero-peer-edges
  holds). The seed seam lives at the **composition-root** (allowed to import concretes) OR as bytes shipped by
  deploy; the memory tool OWNS `seed()`. The stale sites (V1, V-pkg, §0.1 "both forge … depend on") say "forge
  imports it" — read as **composition-root imports it, forge core memory-free** (all now carry §5.1 markers).
- **C2 — SeedProvider:** folds to a memory-tool `seed()` verb (per §0.2), NOT a contract port.
- **C4 — BundleArtifact:** TYPE, not port; drop from any "ports" list (DIAGRAM updated).
- **C5 — `PRINCIPLES.md §3`:** marked SUPERSEDED (asserted recall-in-core + uniform `MemoryStore` CRUD, both
  overturned by §0.2/§2.2).

## 3. Target-state wiring

```
agent-anatomy (CANON)                    agent-forge (ENGINE)                     agent-memory (tool)
 organs·agents·skills·hooks(CELLS)·       core/{ir,engine,serialize,adapter,       cli: …existing…
 rules·genus (ONE home for memory          exemplify}                              + pure seed.ts (filenames·
 doctrine)                                anatomy·catalog                            seed-if-absent·v1-retire)
 runtime substance: guardrail/*.sh·       adapters/<harness>/*
 judge-prompt·bundles                     core/anatomy-body (agentBody·organTitle·   composition-root
 accept POLICY-DATA (palimpsest·           organField — was sideways)               calls memory seed()
 operator-lexicon·repo-guard) ──inject──▶ projection/ (was toolkit):                + places bundle
 composition roots (hookSources,           project·project-human·project-targets    ▲
 project-human) ──value/or project-dir──▶ validate/ (was cold-oracle): ALGORITHM    │ (forge CORE is
                                           only; policy injected                    │  memory-free)
                                          deploy/{…,init} placement-only ───────────┘
   bundle-path: ONE exported constant ▲ (BundleMissingError already guards)
```

Net: anatomy carries zero manufacture tooling AND is the single home for memory doctrine; forge owns all
projection/validation/deploy but the gate's DOCTRINE is injected (never planted in the engine); memory owns
all memory mechanics; the one real silent seam (bundle path) becomes a typed constant.

## 4. Debate ledger — see §resolutions; all objections ADOPTED except:

- **M3-F1 kill-the-≜-formula: REBUTTED** by isolated Ω\* (self-sufficient definition ≠ palimpsest); wikilink-kill portion adopted.
- **M1-O6 config→shared-reader vs M2-O1 config-is-non-finding: sided with M2** (disjoint field sets; stronger evidence). A1 cut.
  No surviving unaddressed objection. Convergence: 3/3 mav + nico, F1 by instrument.

---

## 5. NET-CURRENT (AUTHORITATIVE — de-palimpsested; supersedes §0–§4 on any conflict)

§0–§4 are the reasoning trail across 5 rounds. This section is the single source of truth.

### 5.1 Three packages (NO 4th `agent-contract` — dropped, anti-complexity)

`agent-contract` was proposed to reach "zero peer-to-peer edges." But D-scope fixes corpus+engine (only
HARNESS is interchangeable), and every concrete decoupling is reachable without a 4th package — which would
only add build/version overhead to flip one benign, ACYCLIC, type-only edge. So: **3 packages.** (Operator
may override if strict zero-peer-edges is a hard requirement.)

| box                                           | ONE responsibility                             | owns                                                                                                                                                                                                                        | must NOT hold                                                  |
| --------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **agent-forge** (ENGINE + shared TYPE kernel) | manufacture · validate · ship                  | IR · compose · projection · deploy · accept-gate ALGORITHM · CLI · the shared TYPE kernel (anatomy types + DTO/data shapes) · the ONE port `HarnessAdapter` · sub-modules `adapters/<harness>` + the CLI `composition-root` | corpus doctrine · memory mechanism · corpus identity (`polis`) |
| **agent-anatomy** (CANON)                     | what cells exist + the runtime individual      | corpus cells · runtime substance (guardrail `.sh` · judge-prompt) · memory CONCEPT (genus doctrine + dream/wake rituals) · the injected DATA VALUES (AcceptPolicy · FoundingTemplate · adapter-name)                        | projection/deploy tooling · memory mechanics                   |
| **agent-memory** (MECHANISM, leaf)            | the deterministic memory tool over all 5 homes | store/retrieve/land/replace/drain + `seed()` + `BundleArtifact` descriptor                                                                                                                                                  | reasoning · content authoring · doctrine                       |

Dependency edges (acyclic): `anatomy → forge` is 172/175 `import type` (erase at compile); the THREE runtime
value-imports (`project-human.ts:11` `projectHumanOrgan`; `project-cli.ts:24-29` claude serializers;
`project-cli-codex.ts:20-24` codex serializers — ALL projection/adapter tooling) die when projection moves into
forge (V2), leaving anatomy→forge purely type-only. `forge CORE` imports NEITHER anatomy NOR memory. The **composition-root**
(forge CLI, the only concrete-importing node) calls `memory.seed()`, selects the adapter by name, discovers the
corpus dir. `anatomy → memory` bundle seam = one typed constant. Memory imports nobody.

### 5.2 The one port + the injected data (Cockburn-correct)

- **`HarnessAdapter`** — the ONLY behavioral port (≥2 impls: claude·codex·15 more; methods vary). Lives in forge.
- **AcceptPolicy** {palimpsest-tokens · operator-lexicon · repo-guard} and **FoundingTemplate** (founding prose +
  `PLAN_STATES`) — injected **DATA** (shape-types in forge, VALUES authored in anatomy). Not ports.
- **BundleArtifact** — a descriptor **TYPE** (DTO). Not a port.
- Doctrine-agnosticism (TARGET-tense): the accept POLICY tokens `polis/oikos/conatus`
  (`toolkit/cold-oracle/accept.ts:166-169`, in **anatomy** today) STAY in anatomy as injected DATA when the accept
  ALGORITHM relocates to forge (V2) — forge never gains them. The actual live engine leak is `init.ts` (founding
  prose + `PLAN_STATES`, forge today) → ported to CANON via the FoundingTemplate DATA.

### 5.3 Memory — net design

> **§6 SUPERSEDES the memory LOCATION/PACKAGING below** (standalone installed tool at `~/.agents/<name>`, not a
> forge-bundled leaf; `genus/memory.md` deleted). The verb×home MECE + reads-direct + recall-vault design here
> STANDS; only "where memory lives + how it ships" is overridden by §6.

- **5 homes** (`route.ts:25`): EPISODIC (record log) + SEMANTIC · PROCEDURAL · AGENTS@node · vault (prose).
- **Verb × home (MECE — no overlap):**
  - EPISODIC: `encode` (append) · `read` (filtered) · `drain`/`compact` (by-id forget). — unchanged.
  - `apply --routes '[{id,targets[]}]'` = ADD-NEW: consumes the agent's route-decisions as DATA (agent IS the
    classifier, out-of-process — F1), appends NEW EPISODIC-derived content → {AGENTS@node · vault} + retain/drop.
    A data-adapter around `compact`+`appendToHome`. **`apply` NEVER writes SEMANTIC/PROCEDURAL** — their update is
    ALWAYS a supersede (curated prose), so append there would re-introduce palimpsest.
  - `replace` = SUPERSEDE, for ALL FOUR prose homes (SEMANTIC · PROCEDURAL · AGENTS@node · vault): agent authors
    the WHOLE new file → tool atomic-writes (`compact` tmp+rename). Whole-file only (no sub-file addressing).
    `replace ≡ forget` on prose. Reuses the `RouteTarget` selector `{store, node?, path?}` — no new shape.
  - MECE: `apply` ADDS-NEW (AGENTS@node/vault/EPISODIC-retain); `replace` SUPERSEDES (any prose home). AGENTS@node
    - vault take both (append a new directive/note vs supersede a stale one); SEMANTIC/PROCEDURAL are replace-only.
- **Reads stay agent-direct** — resident prose is read whole by the agent (`wake.ts:9`); routing a whole-file read
  through a subprocess is zero-capability indirection, against the tool's charter (`genus/memory.md:55`). This is
  industry-aligned: Letta core memory is IN-CONTEXT, never read via a tool call. "Accessible via the tool" is
  satisfied by the WRITE/edit ops (the acts the agent can't do atomically/by-id).
- **recall (embeddings)** — vault-adapter only; OUT of the portable core (preserves runs-anywhere).
- **working memory** = the context window; NO store.
- **Lock:** the new prose-write verbs inherit the ritual's `lock acquire/release` (shared {SEMANTIC·PROCEDURAL}).
- **`--describe`: DEFERRED** to the MCP transport — the CLI-phase agent discovers the taxonomy from the genus
  doctrine it reads at wake (P5 satisfied by the genus for the CLI phase; the verb only serves a programmatic client).
- Consolidation = the injected classifier's judgment (agent = strategy; tool = mechanism), `route.ts:82-89`.

### 5.4 Principles (P1–P5, glossed so this doc is self-sufficient)

P1 SINGLE-RESPONSIBILITY · P2 MECHANISM(tool)/STRATEGY(agent) SEPARATION · P3 UNIFORM-ABSTRACTION per
operation-FAMILY (not a god-interface) · P4 PORTS-&-ADAPTERS where a boundary genuinely varies · P5
SELF-DESCRIBING (the taxonomy is discoverable — **§6: via the memory module's shipped protocol** the agent
reads at wake, since `genus/memory.md` is deleted; a `--describe` verb when MCP lands).

### 5.5 Status

**Design converged** — both round-6 terminal cold reviewers judged the ARCHITECTURE clean (drop-`agent-contract`
verified against the real import graph; memory minimal + Letta/mem0/CoALA-aligned; SRP per box). Round-6 also
de-palimpsested the doc-set (§0–§4 marked superseded at each stale site; §5-accuracy nits fixed). Wave-2
execution (agent-contract-free; V-ledger in §2) remains Operator-gated.

---

## 6. Memory as a standalone harness-neutral module (D2 — supersedes the genus/bundle framing)

Operator-driven revision, reviewer-converged (round-2). Supersedes, each carrying an inline §6 marker:
§0.1 (genus bundle-seam/doctrine-home), §5.1 agent-memory + anatomy rows + dependency-edges, §5.2 BundleArtifact,
§5.4-P5 ("discoverable via the genus"), V6-bundle, V8/F5-strategy, V-pkg, §2.3 SeedProvider, §2.1
V-mem-contract/V-adapter-path. **V4's reasoning-contract is NOT deleted — it RELOCATES into the memory module's
own shipped protocol (§6.2).** Being/faces now lands in `MODEL.md` (BEING/FACE invariant).

### 6.1 Being / faces (→ also MODEL.md)

An agent is a persistent **BEING**; harnesses are its projected **FACES**. **Memory is the continuity that
makes the many faces one being.** ⇒ memory CANNOT live under any one harness's dir — a `~/.claude/...` memory
home would make the claude-face and codex-face _different beings_. Memory is **harness-independent infrastructure**.
(The being/faces ontology is a MODEL/constitution concept — "what an agent IS"; the module merely _implements_
the continuity.)

### 6.2 A canonical component distributed as a standalone tool (like `graphify` / `uv tool install`)

- **agent-memory is a CANONICAL component** — its protocol/skills are authored ONCE (in the package), so
  "centralize in canon" (VISION) holds; it is merely **DISTRIBUTED as a standalone installed tool** rather than
  projected per-harness. Not a competing canon — the memory canon, packaged as infra.
- The **`memory`** CLI (renamed from `episodic` — a grey-field holdover; manages all 5 homes, not one store),
  **host-bootstrapped once** (human-run, like the repo's own `uv tool install graphifyy` + `graphify install`
  prereqs — NOT `gh`, which is config; memory is data/state). `agent-memory/package.json` gains a `bin`.
- Store at the **harness-neutral** home **`~/.agents/<name>/`** (bare — matching the repo's existing
  `~/.agents/skills/` tree; NOT `$XDG_DATA_HOME`, which diverges when unset; reserve/avoid the `skills` name).
- **Doctrine split (V4 + VISION reconciled):** the tool owns deterministic **MECHANISM** (store/land/replace/
  lock/session/scope-computation) and self-describes it (`--help`). The **authored CONSOLIDATION PROTOCOL** —
  the dream/wake reasoning, the ENCODE-salience filter + `scope=node(cwd)` causality the agent CONSUMES (the V4
  contract, `genus/memory.md:26,34`) — is authored in the module and **shipped with it as the memory skills the
  agent reads at wake**. genus's content RELOCATES here; it is not deleted-into-nothing.
- **agent-anatomy references memory via ONE thing** — the `longTermMemory` organ σ\* enum
  (`organs/memory/long-term-memory.ts`). No build-edge to the module (a standalone tool is referenced by name +
  runtime-checked, like any host prereq) — intentional maximal decoupling.
- **`genus/memory.md` = DELETED from anatomy** (encapsulation-boundary-test: a doctrine file that must change
  when the store-path changes = palimpsest). Its MECHANISM re-spec → the tool's `--help`; its AUTHORED contract
  → the module's shipped skills (above).
- **No forge→memory code dependency, no seed import, no bundle.** Provisioning is at **wake-register**
  (`memory init --home ~/.agents/<name>` — before `audit`/`read`, not lazy-first-encode); the seed CONTENT
  (`seeds.ts:33-66`) relocates into `memory init`. Deploy's only memory concern is a **prerequisite check**
  (`which memory` + a **version-compat assert** — the host-installed tool floats, so pin a min-version vs the
  corpus). ⇒ V-pkg / SeedProvider / the bundle constant DISSOLVE — **and the now-orphaned `stageBundle` /
  `BundleMissingError` / `baseRoot` staging mechanism (memory was its SOLE consumer, `genus/memory.md:5`) is
  deleted in the same wave.**
- **No-install charter reconciled:** the CORE stays dependency-free (runs under `node`, no npm/build); "install"
  = a one-time host bootstrap placing the tool + `~/.agents`, not a per-project dependency install. Recall
  stays out of core (its embeddings deps would break dependency-freeness) — that invariant holds.

### 6.3 Harness-genericity — V8/F5 DISSOLVES (coupling removed, not templated)

The tool was already built path-agnostic (`--home` required, zero `.claude` in `agent-memory/src`). D2 removes
the coupling we layered on top:

- **HOME is fully generic:** `~/.agents/<name>` is derivable from the agent NAME — no harness input. The `memory`
  tool on PATH + `--home` needs no per-harness templating. V8's in-body path leak is genuinely GONE here.
- **SESSION-ID is irreducibly per-harness — bound at `register`, NOT hand-waved (FLAW-A fix).** Today
  `store.ts:53` derives the session only from `CLAUDE_SESSION_ID`; a codex/aider face sets none → records go
  **sessionless** → the liveness filter treats sessionless as always-inheritable (`cli.ts:289`) → a live
  codex-face's next-steps bleed into a concurrent claude-face (the memiso defect, reintroduced across faces).
  **Fix:** `memory session register` **binds a session id — harness-native where one exists, else tool-minted
  (uuid)** — persisted for the face's session. No face ever writes sessionless. This is the one honest per-face
  seam (each adapter maps its native id, or none → mint); it is not full body-templating.

### 6.4 Session-lifecycle / consolidation trigger (SESSION-LIFECYCLE.md v2)

- **Consolidation = agent hot-path** (agent calls `apply`/`replace` in-turn) **nudged by a threshold-gated
  `turn.end` (Stop) hook** (cheap shell count of unconsolidated `EPISODIC.jsonl` records; watermark below the
  harness compaction point). Fires HOT ∧ LIVE. `PreCompact` REJECTED (command-only, no reasoning-injection;
  against all industry convergence).
- **Cold `session.start` catch-up = the data-safe FLOOR** (durable per-turn `encode` ⇒ nothing lost; the 8
  hook-less adapters get only this floor — hot consolidation is honestly a claude-plus-few capability).
- **`session.end` → mechanical `release` only.** `/handoff` → explicit on-demand. Sleep-time sidecar DEFERRED.
- **Braid RELOCATES to the module:** `wake`/`handoff` → thin orchestrators (`register → memory.reconstitute →
orient → resume`; `praxis-sync → memory.consolidate → release`). Memory exposes named entrypoints; its OWN
  hook names its consolidation. No agent skill names `episodic.mjs`; `orient` stays a praxis concern.

### 6.5 Per-box responsibilities (memory, revised)

| box                                                           | memory responsibility                                                                                                                                                                                     |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **agent-anatomy** (CANON)                                     | the `longTermMemory` organ enum ONLY. No memory doctrine/skills/tool.                                                                                                                                     |
| **agent-memory** (canonical component, distributed as a tool) | EVERYTHING memory: `memory` CLI (mechanism) + the authored consolidation skills/protocol + store `~/.agents/<name>/` + the per-face lifecycle hook. Imports nobody.                                       |
| **agent-forge** (ENGINE)                                      | projects the FACES per-harness (adapter `paths.ts`, incl. installing the per-face `AGENT_SESSION_ID` map + the `turn.end` nudge hook); treats `memory` as a host PREREQUISITE (`which memory` + version). |
| **MODEL**                                                     | the BEING/FACE invariant (one being → many faces; memory-home ∉ any face).                                                                                                                                |

### 6.6 Boundary + status

- **Single-host is the stated boundary** for the hot local stores + the O_EXCL lock (`lock.ts:57` is local-fs
  only; a synced home would void it). **Cross-HOST continuity flows through the `vault`** (home #5, the networked
  cold store) — the local `~/.agents/<name>/` is the hot per-host working set. "One being across hosts" = via
  the vault, not by syncing the locked home.
- **The per-face lifecycle surface** (the `turn.end` nudge hook, the `AGENT_SESSION_ID` binding) is registered
  per-harness by the adapter — so "harness-independent" is precise about the STORE+TOOL, while the trigger
  surface is a small per-face projection.
- Status: D2 reviewer-converged (round-2, 2 cold reviewers). Being/faces landed in MODEL. Wave-2 execution
  (rename `episodic`→`memory`, `bin` + host-bootstrap, relocate genus content + seed into the module, delete
  the stranded bundle mechanism, `register`-mint session-id, per-face nudge hook) remains Operator-gated.

---

## 7. Memory model = the 4-part CoALA cognitive taxonomy (AUTHORITATIVE; vault EXTRACTED)

Operator-directed (weighed, endorsed on merits — CoALA / Sumers 2023, the convergent standard the round-6
reviewer independently grounded). **Supersedes the "5 homes / type×home two-axis" framing** in §0.2, §5.3, §6.

### 7.1 The taxonomy (the agent's PRIVATE memory)

| type           | store                         | note                                               |
| -------------- | ----------------------------- | -------------------------------------------------- |
| **Working**    | none — the context window     | transient reasoning state; never persisted (CoALA) |
| **Episodic**   | `EPISODIC.jsonl` (record log) | raw per-turn events; the encode target             |
| **Semantic**   | `SEMANTIC.md` (prose)         | facts + identity                                   |
| **Procedural** | `PROCEDURAL.md` (prose)       | generalized cross-project wisdom                   |

That is the whole model the memory module OWNS — three private stores + working (no store), at
`~/.agents/<name>/`. "Session memory" = a **view over episodic** (the current session's records, already
session-tagged), not a 5th type.

### 7.2 EXTRACTED (palimpsest — out of scope)

- **`vault` (cross-host / networked cold corpus) → DELETE.** Cross-host continuity is an **anti-pattern for this
  library** (Operator, prior epoch) — an orthogonal END-USER concern (a vault-vendor integration we may
  _recommend_ later, never own). Remove `vault` from `route.ts` `StoreName`/`V2_STORES`, the `dream.ts` vault
  case, and the genus description. **Single-host is simply the model** — this RETRACTS §6.6's "cross-host via
  vault" (which wrongly preserved the anti-pattern); the O_EXCL lock's local-fs assumption is now just correct,
  not a "boundary."
- **`AGENTS@node` → RECLASSIFY (not a private store).** Project-scoped externalization — a durable lesson written
  OUT to a project's shared, git-versioned `AGENTS.md`. Orthogonal to the private cognitive taxonomy; a
  consolidation route-OUT (a documentation act), NOT a memory home the module owns/reconstitutes. Behavior kept;
  reclassified. (nico judgment — Operator may extract entirely.)

### 7.3 Simplifications this forces

- The `replace` (prose-supersede) verb now covers **TWO** prose stores (SEMANTIC · PROCEDURAL), not four —
  §6/SESSION-LIFECYCLE's "4 prose homes" reduces accordingly. `apply` lands EPISODIC + (route-out) the AGENTS
  externalization.
- The two-family split is cleaner: ONE record log (episodic) + TWO resident-prose stores (semantic/procedural).
- `recall`/embeddings stays out of core (unchanged); working = context (unchanged).
