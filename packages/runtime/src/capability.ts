// ─────────────────────────────────────────────────────────────────────────────
// The runtime capability keyspace.
// ─────────────────────────────────────────────────────────────────────────────

export const CAPABILITIES = ['eventTap', 'concepts', 'workPackage'] as const;

export type Capability = (typeof CAPABILITIES)[number];

export const CAPABILITY_SUMMARIES = {
  eventTap: 'Attach a passive observer to the host harness’s lifecycle events',
  concepts:
    'Keep the concept journal: the conceptual design and its decisions, each bounded context’s concepts appended version by version with the reason each was written and never edited, from which the current design, every concept’s history and the open decisions are read',
  workPackage:
    'Slice a cut into work packages and hand them out level by level: each package’s outputs no other builder changes, every concept served and every example owned, the builders’ commits kept to their own outputs, and the cut’s rounds, whole-check runs and agent runs counted',
} as const satisfies Readonly<Record<Capability, string>>;
