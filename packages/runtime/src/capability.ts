// ─────────────────────────────────────────────────────────────────────────────
// The runtime capability keyspace.
// ─────────────────────────────────────────────────────────────────────────────

export const CAPABILITIES = ['eventTap', 'concepts'] as const;

export type Capability = (typeof CAPABILITIES)[number];

export const CAPABILITY_SUMMARIES = {
  eventTap: 'Attach a passive observer to the host harness’s lifecycle events',
  concepts:
    'Keep the concept journal: the conceptual design and its decisions, each bounded context’s concepts appended version by version with the reason each was written and never edited, from which the current design, every concept’s history and the open decisions are read',
} as const satisfies Readonly<Record<Capability, string>>;
