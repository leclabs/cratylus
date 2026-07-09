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
