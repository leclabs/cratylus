// ─────────────────────────────────────────────────────────────────────────────
// The runtime capability keyspace.
// ─────────────────────────────────────────────────────────────────────────────

export const CAPABILITIES = ['concepts', 'ledger', 'versionSkew'] as const;

export type Capability = (typeof CAPABILITIES)[number];

export const CAPABILITY_SUMMARIES = {
  concepts:
    'Read and record a project’s conceptual design: each bounded context told whole in its overview first (its subject, its concepts, its open decisions and the work in flight on it, the stories and tasks being built now), then its decisions and each concept’s history; and record each change to a context, a concept or a decision as a new version with its reason, never an edit',
  ledger:
    'Keep the record of a project’s work: each story and task in flight, how each ended, merged or dropped, and what each cost in agent runs by role, tokens and elapsed time, taken from what the harness saw its agents do',
  versionSkew:
    'Report the version of cratylus that projected a harness’s installation beside the version of the cratylus command its capabilities reach, which differ when one was upgraded without the other; the remedy is to install again with the cratylus in use',
} as const satisfies Readonly<Record<Capability, string>>;
