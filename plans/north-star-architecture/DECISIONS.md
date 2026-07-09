# North-star decisions (nico, design authority — for Operator review)

Guard-corrected: these are in-remit reversible DESIGN calls, decided from VISION intent, not polled.

## D-scope — interchange axes

- **harness** = core goal (VISION "realize everywhere").
- **memory** = behind a port (decoupling seam; not because we'll swap the tool, because forge must not hard-edge a concrete).
- **corpus** = anatomy is THE canon (VISION "a library of primitives"); NO corpus port.
- **engine** = forge is THE engine; NO engine port.
- **but** ENGINE doctrine-agnosticism (ENGINE.md charter) REQUIRES policy + founding-template INJECTION
  regardless — so `agent-contract` + the injection ports are charter-mandated, not optional.

## D-contract — extract `agent-contract` (pure package, imports nobody)

Types (Kind · IR · Organ · SkillExpression · CanonicalEvent · Hook · HookCell) + ports:
`AcceptPolicy` · `SeedProvider` · `BundleArtifact` · `HarnessAdapter`. ENGINE/CANON/MEMORY depend ONLY on it.
Target: ZERO peer-to-peer package edges; concretes wired once at the CLI composition-root.

## D-harness — claude + codex end-to-end now

Generalize deploy through the selected adapter's paths; wire codex into deploy; kill sideways codex→claude
(`codex/anatomy.ts:23`). Other 15 adapters: projectors tested, deploy mechanical-to-add later.

## D-F5 = (A) projection-time substitution (converged)

Adapter binds `${SKILLS_DIR}·${AGENT_HOME}·${SESSION_ID}` → concrete per-harness at deploy. Refines the
thin-generator law: `SKILL.md = f(name, block, composition, adapter-path-bindings)`.

## Mechanism answers (nico owns; grounded)

- **R1-Q3 composition root:** YES, dedicated. `deploy/` CORE = port-based (DI-pure); the CLI entry is the
  composition root that imports concretes (selected adapter + memory plugin + corpus dir) and injects them.
- **R1-Q5 bundle:** `BundleArtifact` is a contract TYPE; the memory plugin declares its descriptor; genus
  references it via the registry, not a hardcoded string path.
- **R1-Q6 / R2 adapter-path:** adapter exposes a GENERIC path-token resolver + skills-dir; memory is NOT
  special; placement is spec-driven (`deploy.ts:78` already `<skill>=<spec>`). Redraw G4 accordingly.
- **R1-Q7 anatomy→adapters:** anatomy CLIs SELECT an adapter by NAME from a registry (HarnessAdapter port);
  never import concrete adapter modules (`project-cli.ts:29`, `project-cli-codex.ts:24` must stop). Harness
  knowledge is ENGINE's, not CANON's.
- **R1-Q8 repo-guard:** injected `AcceptPolicy` DATA (env/operator-supplied); the `.sh` takes it as a param,
  no `cold-oracle.sh:29` literal.
- **R1-Q9 policy granularity:** ONE `AcceptPolicy` object {palimpsest-tokens · operator-lexicon · repo-guard};
  operator-lexicon injects through the same port (it is corpus policy data).
- **R1-Q10 filename set:** SINGLE contract token; memory-seed + deploy + genus all reference it. No twin.
- **R1-Q11 project-to-directory:** IN-SCOPE as the DIRECTION where it removes G1/G5 cleanly (hook/rule cells
  projected to a directory forge discovers); adopt incrementally, not a round-1 hard blocker.
- **R2 owned verdicts:** all accepted — V-init (reframed: LIVE as ENGINE doctrine-agnosticism, NOT gated on
  corpus-swap — forge must not name `polis`), V-mem-contract, V-pkg (BUILD the forge→memory port edge; add
  `agent-memory` `exports`), V-diagram-§3 split current-vs-target, V-adapter-path.

## Round-3 — memory service + SRP (judged trust-but-verify; see NORTH-STAR §0.2/§2.2)

Answers to the two reviewers' questions:

- **Memory scope (M-mem Q1 / SRP Q1):** Operator #2 SUPERSEDES §0.1 "episodic-only" — memory covers all 5
  homes. But the deliverable = WIRE+GENERALIZE the dead `applyRoutes` engine, NOT build a uniform CRUD
  service (anti-complexity). §0.1's "concept in CANON / mechanism in agent-memory" split HOLDS; the mechanism
  now spans all homes.
- **Uniform CRUD vs two-family (M-mem Q2):** two-family (record homes: append/read/forget · resident-prose:
  land/replace/forget). Procedural = prose-edit, not CRUD.
- **AGENTS + vault (M-mem Q3):** PRESERVED — 5 homes, not CoALA-4. Type × home are two axes.
- **Consolidation cut (M-mem Q4):** service-owns-the-mechanism, injected-classifier reasons (= existing
  `applyRoutes` + `Classifier`, mem0-style). Tool never reasons; agent authors content + strategy.
- **recall/embeddings (M-mem Q5):** OUT of the portable core — vault-adapter capability (preserve
  runs-anywhere-no-install, `genus/memory.md:42`).
- **replace/depalimpsest (M-mem Q6):** IN scope — tool-mediated replace/forget on resident prose (append-only
  can't supersede; `skills/dream.ts:22,42`). Curated-prose quality preserved: agent authors the prose, tool
  owns land/replace atomicity.
- **Transport / MCP (M-mem Q7):** CLI portable core NOW; MCP a later P4 adapter over the same core.
- **`--describe` (M-mem Q8):** IN scope (P5, cheap).
- **working memory (M-mem lens5):** NO store (= context window). Closed.
- **SeedProvider fold (M-mem lens5):** seed ACT folds into the memory tool; seed CONTENT stays CANON.
- **Two accept gates (SRP Q3):** distinct concerns, NOT unified — exemplify is the skill (Operator). REJECTED.
- **HUMAN_MARKERS (SRP Q4):** general register-detection mechanism, stays engine. REJECTED as a leak.
- **operator-lexicon (SRP Q5):** injected AcceptPolicy DATA (per-corpus glyph notation), NOT moved to forge.
  `AcceptPolicy` stays one cohesive object (over-bundle split REJECTED — invents complexity).
- **init.ts (SRP Q6):** V-init-EXTENDED to the whole founding-prose body + `PLAN_STATES` (not just tokens).
- **§3 grain (SRP Q7):** adapters = a sub-module of forge (not a package peer); composition-root = TARGET
  (absent today). Table grain corrected.
- **Findings B/C scope (SRP Q8):** in-remit — folded into the ledger (V-init-extended); HUMAN_MARKERS rejected.

## Round-5 — convergence pass (SUPERSEDES D-contract above; see NORTH-STAR §5)

- **`agent-contract` DROPPED (holistic anti-complexity, verified).** 3 packages, not 4. Concrete decouplings
  (inject doctrine · memory-free forge core · adapter-by-name registry · type-only anatomy→forge) don't need a
  4th package; D-scope fixes corpus+engine. Shared TYPES + the ONE port `HarnessAdapter` live in forge's
  hardened type kernel. (D-contract's "4 ports incl SeedProvider" list is void.) Operator may override if
  strict zero-peer-edges is a hard requirement.
- **Memory verb×home MECE (Q2/Q3):** `apply --routes` (DATA) appends EPISODIC→{AGENTS@node·vault}+retain/drop
  and NEVER writes SEMANTIC/PROCEDURAL; `replace` (whole-file, reuses `RouteTarget` selector) supersedes prose.
  No overlap, no palimpsest reintroduced.
- **`--describe` DEFERRED** to MCP transport (reconciles the 3-way): CLI-phase discoverability is served by the
  genus doctrine the agent reads at wake; P5 met for the CLI phase. (§0.2/§2.2/DECISIONS earlier disagreed →
  §5 is authoritative: deferred.)
- **Reads-direct is industry-aligned, not a bar-miss:** Letta core memory is in-context (never tool-read);
  "accessible via the tool" = the WRITE/edit ops. Resident-prose read stays agent-direct. (Operator may correct
  if #2 literally intends tool-mediated reads.)
- **F5 = (A) is CONVERGED** (not an open Operator call) — §2's "needs a call" wording is stale; §5 authoritative.
- Doc-set de-palimpsested into NORTH-STAR §5 (single per-box table + net design). §0–§4 = reasoning trail.
