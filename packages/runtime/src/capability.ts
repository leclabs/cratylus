// ─────────────────────────────────────────────────────────────────────────────
// The runtime capability keyspace.
// ─────────────────────────────────────────────────────────────────────────────

export const CAPABILITIES = ['concepts', 'versionSkew'] as const;

export type Capability = (typeof CAPABILITIES)[number];

export const CAPABILITY_SUMMARIES = {
  concepts:
    'Read and record a project’s conceptual model: at a session’s start, the design, the read that recovers it (each bounded context’s subject, place in the context map and live concepts with the concepts each is built from), with the design state as its short summary (the project’s purpose first, and each live concept as name ≜ residue), then the standing decisions of realization the work needs, and the history where how something came to be matters; and record each change to a context or a concept as a new version with its reason, and each decision of realization, each as an entry of its own; the record runs from the journal’s latest closing of the books, which carries what stands forward and leaves the closed period to version control',
  versionSkew:
    'Report the version of cratylus that projected an agent harness’s installation beside the version of the cratylus command its capabilities reach, which differ when one was upgraded without the other; the remedy is to install again with the cratylus in use',
} as const satisfies Readonly<Record<Capability, string>>;
