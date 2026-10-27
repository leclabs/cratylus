// ─────────────────────────────────────────────────────────────────────────────
// The runtime capability keyspace.
// ─────────────────────────────────────────────────────────────────────────────

export const CAPABILITIES = ['versionSkew'] as const;

export type Capability = (typeof CAPABILITIES)[number];

export const CAPABILITY_SUMMARIES = {
  versionSkew:
    'Report the version of cratylus that projected an agent harness’s installation beside the version of the cratylus command its capabilities reach, which differ when one was upgraded without the other; the remedy is to install again with the cratylus in use',
} as const satisfies Readonly<Record<Capability, string>>;
