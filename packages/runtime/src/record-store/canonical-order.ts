// ─────────────────────────────────────────────────────────────────────────────
// CANONICAL ORDER — the one order a set-valued payload field is written in.
//
// A payload is compared as written: two heads converge only when they carry the
// same whole state. A set written as a list in its caller's order would make two
// branches writing the same set in different orders read as diverged. So every
// domain writes a set's members through `canonicalOrder` when it builds a
// payload, and the fold goes on comparing payloads as written, reordering nothing
// on read.
//
// The members are the references a payload stores — entity identities, never
// names — so relabelling an entity can never reorder a set that names it. A
// duplicate is kept, not absorbed: that a set names a member once is the domain's
// law to refuse, and a silent dedupe here would hide the write that broke it.
// ─────────────────────────────────────────────────────────────────────────────

/** `references` in canonical order: sorted by code unit, duplicates kept. */
export function canonicalOrder(references: readonly string[]): string[] {
  return [...references].sort();
}
