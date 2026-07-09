# North-star wiring — current vs target (Mermaid, v2 · decoupled)

Render in any Mermaid-aware viewer (Obsidian, GitHub, VS Code). Red = defect; blue = the fix; green = pure.
v2 = post-decoupling review: target is contract-centered with ZERO peer-to-peer package edges.

## 1. Current state (defects)

```mermaid
flowchart TB
  subgraph ANA["agent-anatomy — CANON"]
    cells["cells: organs · agents · skills · hooks · rules"]
    genus["genus/memory.md<br/>(memory doctrine + protocol)"]
    subgraph TK["toolkit/ (mixed concerns)"]
      proj["project* · project-human<br/>project-targets · organ-docs"]:::bad
      cold["cold-oracle/ accept-gate<br/>(algorithm + corpus policy)"]:::bad
      hookmix["hooks.ts (generic lift<br/>+ specific cells)"]:::warn
      guard["guardrail/*.sh + judge-prompt"]:::ok
      lex["operator-lexicon"]
    end
    skills["skills: dream · wake · handoff<br/>bodies hardcode ~/.claude/... path"]:::bad
  end

  subgraph FRG["agent-forge — ENGINE"]
    core["core: ir · engine · serialize · exemplify"]
    adpt["adapters/&lt;harness&gt;/ (paths per harness)"]
    dep["deploy: scope · local · ssh · bundle · init"]
    seeds["deploy/seeds.ts<br/>authors MEMORY doctrine"]:::bad
    initc["deploy/init.ts<br/>founding-template names 'polis'"]:::bad
  end

  subgraph MEM["agent-memory — build-only tool"]
    tool["episodic.mjs: node·store·dream·route<br/>fold·session·lock·audit·migrate"]
    route["route.ts: store vocab + v1-retirement"]
  end

  cells -->|type-only| core
  proj -.->|value import at composition roots| core
  cold -.->|value import| lex
  genus -->|"bundle: ../agent-memory/dist/episodic.mjs (string path)"| tool
  seeds -.->|"COPIES doctrine (forge cannot import memory)"| route
  seeds -->|"triples doctrine w/ genus + route"| genus
  skills -.->|"hardcoded ~/.claude path — breaks on codex"| tool

  classDef bad fill:#5b1a1a,stroke:#e06,color:#fff;
  classDef warn fill:#5b481a,stroke:#eb0,color:#fff;
  classDef ok fill:#1a4a2a,stroke:#2c6,color:#fff;
```

## 2. Target — contract-centered fan-in, ZERO peer-to-peer package edges

```mermaid
flowchart TB
  subgraph CON["agent-contract — PURE (imports NOBODY)"]
    types["types: Kind · IR · Organ · SkillExpression<br/>CanonicalEvent · Hook · HookCell"]
    ports["ports: AcceptPolicy · SeedProvider<br/>BundleArtifact · HarnessAdapter · FoundingTemplate"]
  end

  subgraph FRG["agent-forge — ENGINE (fixed · no engine port)"]
    core["core: ir · engine · serialize · exemplify · anatomy-body"]
    projection["projection/ (was toolkit)"]
    validate["validate/ (was cold-oracle): ALGORITHM only"]
    adpt["adapters/&lt;harness&gt; + by-name registry<br/>generic token resolver: SKILLS_DIR · AGENT_HOME · SESSION_ID"]:::fix
    deploy["deploy/ + init: port-based · DI-pure"]
    catalog["catalog: corpus DIR discovery"]
  end

  subgraph ANA["agent-anatomy — CANON (the corpus · no corpus port)"]
    cells["cells: organs · agents · skills · hooks · rules"]
    genus["genus/memory.md — ONE home: doctrine + BundleArtifact ref via registry"]
    runtime["runtime substance: guardrail/*.sh (repo-guard = PARAM) · judge-prompt"]
    data["INJECTED DATA: AcceptPolicy {palimpsest · operator-lexicon · repo-guard}<br/>· founding-template · adapter NAME (string)"]
  end

  subgraph MEM["agent-memory — MECHANISM (leaf)"]
    tool["episodic.mjs (mechanics)"]
    seed["seed.ts: SeedProvider impl + BundleArtifact descriptor<br/>filenames = SINGLE contract token"]
  end

  subgraph ROOT["CLI composition-root — ONLY node that imports concretes"]
    wire["select adapter by-name · load memory plugin · discover corpus dir<br/>inject {policy · founding-template · seed · adapter} into forge core"]
  end

  FRG ==>|depends| CON
  ANA ==>|depends type-only| CON
  MEM ==>|depends| CON
  ROOT ==>|depends| CON
  ROOT -->|imports + injects via ports| FRG
  ROOT -.->|corpus dir + policy/template DATA| ANA
  ROOT -.->|memory plugin| MEM

  note["INVARIANT: no FRG–ANA–MEM edge. Every cross-concern seam is a contract PORT;<br/>concretes wired once here. Aspirational: anatomy PROJECTS hook/rule cells to a<br/>dir forge DISCOVERS → drops even the root's corpus edge to pure discovery."]

  classDef fix fill:#1a3a5b,stroke:#4af,color:#fff;
  classDef pure fill:#1a4a2a,stroke:#2c6,color:#fff;
  class CON pure;
```

## 3. Memory as a concern — current (string-seam) vs target (typed-port)

**3a. Current — invisible string coupling + copied doctrine**

```mermaid
flowchart LR
  subgraph CANON1["CANON — the memory CONCEPT"]
    g1["genus/memory.md — doctrine (TRIPLED)"]
    r1["skills: dream · wake · handoff · carry-on"]
  end
  Fc["agent-forge/deploy/seeds.ts<br/>COPIES doctrine (v1-retire · store semantics)"]:::bad
  M1["agent-memory: episodic.mjs + route.ts"]
  g1 -->|"bundle: STRING path — compiler-blind (genus/memory.md:5)"| M1
  Fc -.->|"doctrine copied, not imported"| M1
  g1 -.->|doctrine dup| Fc
  r1 -->|invoke| M1
  classDef bad fill:#5b1a1a,stroke:#e06,color:#fff;
```

**3b. Target — doctrine one-home + typed ports through the contract**

```mermaid
flowchart LR
  CON2["agent-contract: SeedProvider · BundleArtifact"]:::pure
  subgraph CANON2["CANON — the memory CONCEPT"]
    g2["genus/memory.md — doctrine ONE home + BundleArtifact ref via registry"]
    r2["skills: dream · wake · handoff · carry-on"]
  end
  FRG2["agent-forge/deploy — port-based · DI-pure"]
  M2["agent-memory: episodic.mjs + seed.ts (SeedProvider impl · BundleArtifact)"]
  ROOT2["CLI root: inject SeedProvider + BundleArtifact"]
  g2 ==> CON2
  FRG2 ==> CON2
  M2 ==> CON2
  ROOT2 -->|wires| FRG2
  ROOT2 -.->|memory plugin| M2
  r2 -->|invoke tool| M2
  classDef pure fill:#1a4a2a,stroke:#2c6,color:#fff;
```

## G-ledger — how the target closes each over-coupling (round-2 reviewer)

- **G1 type system buried in forge** → extract `agent-contract`; anatomy+forge depend on it type-only. Residual value edge (`project-human.ts:11`) removed incrementally by the project-to-directory direction.
- **G2 new concrete `forge → agent-memory`** → inverted: `SeedProvider` port in contract; memory implements; composition-root injects the concrete. forge core imports the PORT, not the package.
- **G3 bundle string seam** → `BundleArtifact` contract type; genus references it via registry, not the `genus/memory.md:5` string; filenames = single contract token.
- **G4 adapter special-cases memory** → generic path-token resolver + skills-dir; memory not special; placement spec-driven (`deploy.ts:78`); F5=(A) binds the tokens at projection.
- **G5 anatomy imports concrete adapters** → select adapter BY NAME from a registry; `project-cli.ts:29`/`project-cli-codex.ts:24` concrete imports stop; sideways `codex/anatomy.ts:23` killed via `core/anatomy-body` (D2).
- **G6 policy through forge + repo-guard `.sh` literal** → one `AcceptPolicy` object {palimpsest · operator-lexicon · repo-guard}, type in contract, `cold-oracle.sh:29` literal → param. Extended by V-init: `init.ts` founding-template must not name `polis` either (doctrine-agnosticism, both sites).
- **G7 no composition-root** → dedicated CLI root is the ONLY concrete-importing node; `deploy/` core = port-based DI-pure. Explicit in Target §2 (`ROOT`).
- **Open (by design):** project-to-directory is the adopted direction, not a round-1 blocker; until landed the root retains a DI-legal corpus-import edge.
