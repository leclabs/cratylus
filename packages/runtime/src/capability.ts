// ─────────────────────────────────────────────────────────────────────────────
// The runtime capability keyspace.
// ─────────────────────────────────────────────────────────────────────────────

export const CAPABILITIES = ['concepts', 'workPackage'] as const;

export type Capability = (typeof CAPABILITIES)[number];

export const CAPABILITY_SUMMARIES = {
  concepts:
    'Read and record a project’s conceptual design: each bounded context told whole in its overview first (its subject, its concepts, its open decisions and the cuts in flight, the changes to the design being built now), then its decisions and each concept’s history; and record each change to a context, a concept or a decision as a new version with its reason, never an edit',
  workPackage:
    'Slice a cut, one reviewable change, into work packages and keep its ledger: each package’s outputs, the files it alone writes, no other builder changes; every concept served and every example owned; each builder’s commits kept to its own outputs; where the cut stands, from what its agents were given and returned; and its rounds and the agents’ work on it counted',
} as const satisfies Readonly<Record<Capability, string>>;
