// ─────────────────────────────────────────────────────────────────────────────
// The runtime capability keyspace.
// ─────────────────────────────────────────────────────────────────────────────

export const CAPABILITIES = ['concepts', 'versionSkew'] as const;

export type Capability = (typeof CAPABILITIES)[number];

export const CAPABILITY_SUMMARIES = {
  concepts:
    'Read and record a project’s conceptual design: the design state first (the project’s purpose and each bounded context’s subject, place in the context map and live concepts, each as name ≜ wording), then the standing decisions of realization the work needs, and history only when asked; and record each change to a context or a concept as a new version with its reason, and each decision of realization, never an edit',
  versionSkew:
    'Report the version of cratylus that projected a harness’s installation beside the version of the cratylus command its capabilities reach, which differ when one was upgraded without the other; the remedy is to install again with the cratylus in use',
} as const satisfies Readonly<Record<Capability, string>>;
