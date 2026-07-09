# Review round 2 — decoupling / ports-&-adapters (2 adversarial reviewers)

## Reviewer 1 (DI/ports) — gap analysis

Target: fan-in to a pure `agent-contract` (types + ports: `AcceptPolicy · SeedProvider · BundleArtifact ·
HarnessAdapter`), imports NOBODY; ENGINE/CANON/MEMORY each depend only on it; concretes wired ONCE at a
CLI composition-root. My north-star keeps 5-6 peer-to-peer edges where this keeps ZERO.
Over-coupled edges (cited): G1 `anatomy→forge` types (and `project-human.ts:11` imports the VALUE
`projectHumanOrgan`, not pure types); G2 new `forge→agent-memory` seed import (runs against "reduce deps");
G3 bundle string seam `genus/memory.md:5`; G4 `adapter→memory` path rewrite (adapter must not know the tool);
G5 anatomy CLIs hard-import concrete adapters (`project-cli.ts:29` claude, `project-cli-codex.ts:24` codex);
G6 policy injection is the one right inversion but the port type lives in forge + repo-guard baked in
`cold-oracle.sh:29`; G7 NO composition-root node exists in any diagram.

## Reviewer 2 (purpose/interchangeability) — owned verdicts

- **V-init:** `deploy/init.ts:1,3,111,138,140,201+` bakes `polis`/`politeia`/`mind-society` — ENGINE hardcoding
  one corpus's founding identity. Founding prose is CANON; `init` must consume a corpus-supplied template
  (same injection shape as V2 policy). Peer of V2 in the ledger. (Live iff corpus-swap is a goal.)
- **V-mem-contract:** the tool's command surface copied verbatim into `genus/memory.md:26,42,44-51` triples
  the CLI contract (cli.ts · forge · corpus prose) — DRY defect regardless of interchange. Invocation strings
  = one referenced contract; prose keeps only the reasoning the tool can't encode.
- **V-pkg:** agent-memory stays a leaf package IFF the `forge imports seed.ts` edge is actually BUILT (add
  real `exports` — none today). A package nobody imports as code is a build artifact with a 2nd contract home.
- **V-diagram-§3:** the "depended on by both, acyclic" note states a TARGET DAG as present fact; reality is
  string/bundle seam only. Split current vs target.
- **V-F5 = (A) projection-time substitution** (matches nico); the verbatim-body stance is the defect, not an
  invariant. Target diagram must show F5 as an OPEN node, not resolved-clean.
- **V-adapter-path:** tool-blind adapter is correct; `deploy.ts:78` already parameterizes `<skill>=<spec>`;
  the adapter needs only a skills-dir, never the tool name. Redraw G4 as adapter→skills-dir + spec-driven.

## Consolidated forks

- **nico decides (converged, not polled):** F5 = (A). Mechanism questions (composition-root location, bundle
  descriptor ownership, generic path-token resolver, anatomy-selects-adapter-by-name-not-import, repo-guard→
  injected data, policy-port granularity, single filename-set token) — answered by nico as design authority.
- **Operator's (value/scope — bounds the whole redesign):** which interchange axes are goals →
  {corpus, memory, harness, engine} + harness target scope. Both reviewers reserved this upstream.
  VISION reading: harness = core goal; "a library of composable primitives" ⇒ likely ONE canon (corpus-swap
  probably NOT a goal); engine-swap unmentioned. Tension: Operator's "as pluggable as possible" pushes wider.
  → put to Operator.
