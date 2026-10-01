// ─────────────────────────────────────────────────────────────────────────────
// THE CAPABILITY KEYSPACE — every capability the runtime ships, each named once.
//
// The four are built in: each is a module of this package, known when the
// runtime is built, and `main.ts` routes each to its own verb surface. Nothing is
// discovered, registered or loaded, and none is scoped to an agent session —
// `design`, `plan` and `note` are repository-scoped (attribution rides
// `--author`, the repository is the working directory), and `eventTap` reads the
// host's harness settings.
//
// A LEAF, like `bin-name`: the CLI reads this to decide which first words are
// capability verbs, and must not drag the capabilities' lineage in to learn it.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The capability keyspace, in declaration order — the `<capability>` axis of
 * `cratylus <capability> <verb>`.
 */
export const CAPABILITIES = ['eventTap', 'design', 'plan', 'note'] as const;

/** A capability name — one member of {@link CAPABILITIES}. */
export type Capability = (typeof CAPABILITIES)[number];

/**
 * What each capability is, in one line — the summary its help prints. Keyed by
 * {@link Capability}, so a capability cannot be added undescribed nor a
 * description left without its capability.
 */
export const CAPABILITY_SUMMARIES = {
  eventTap: 'Attach a passive observer to the host harness’s lifecycle events',
  design: 'Define, amend and trace the concepts a design is made of',
  plan: 'Decompose a design into units of work and keep each unit’s ledger',
  note: 'Capture, revise and retract notes, the ideas, questions and decisions not yet canonical',
} as const satisfies Readonly<Record<Capability, string>>;
