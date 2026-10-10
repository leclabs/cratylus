// ─────────────────────────────────────────────────────────────────────────────
// The runtime capability keyspace.
// ─────────────────────────────────────────────────────────────────────────────

export const CAPABILITIES = ['eventTap', 'concepts'] as const;

export type Capability = (typeof CAPABILITIES)[number];

export const CAPABILITY_SUMMARIES = {
  eventTap: 'Attach a passive observer to the host harness’s lifecycle events',
  concepts:
    'Keep the concept journal: each bounded context’s concepts and decisions, appended with reasons, and the current state to reconstitute from',
} as const satisfies Readonly<Record<Capability, string>>;
