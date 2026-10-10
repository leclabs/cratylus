// ─────────────────────────────────────────────────────────────────────────────
// The runtime capability keyspace.
// ─────────────────────────────────────────────────────────────────────────────

export const CAPABILITIES = ['eventTap', 'design', 'concepts'] as const;

export type Capability = (typeof CAPABILITIES)[number];

export const CAPABILITY_SUMMARIES = {
  eventTap: 'Attach a passive observer to the host harness’s lifecycle events',
  design: 'Define, amend and trace the concepts a design is made of',
  concepts:
    'Keep the concept journal: each bounded context’s concepts and decisions, appended with reasons, and the current state to reconstitute from',
} as const satisfies Readonly<Record<Capability, string>>;
