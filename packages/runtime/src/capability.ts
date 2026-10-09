// ─────────────────────────────────────────────────────────────────────────────
// The runtime capability keyspace.
// ─────────────────────────────────────────────────────────────────────────────

export const CAPABILITIES = ['eventTap', 'design'] as const;

export type Capability = (typeof CAPABILITIES)[number];

export const CAPABILITY_SUMMARIES = {
  eventTap: 'Attach a passive observer to the host harness’s lifecycle events',
  design: 'Define, amend and trace the concepts a design is made of',
} as const satisfies Readonly<Record<Capability, string>>;
