// ─────────────────────────────────────────────────────────────────────────────
// What a lifecycle event IS to the runtime — and, deliberately, nothing about
// WHICH ones exist.
//
// THIS MODULE HELD 28 EVENT NAMES until 2026-08-05. `@cratylus/schema` held the
// same 28, generated from a JSON file. Identical as sets AND in order, with nothing
// enforcing it, and it never surfaced because the two consumer sets were fully
// disjoint. The header here argued the vocabulary was "OWNED HERE, by the runtime
// host … never re-invented per target", and every clause of that was true except
// the ownership: ARCHITECTURE says of this package "It knows no harness and no
// corpus", and a name for a moment is a signification, which is the corpus's
// (`MODEL.md:22` — `shape ⊥ vocabulary : shape @ schema · names @ corpus`).
//
// SO THE MEMBERS LEFT AND THE CHANNEL THEY ARRIVE BY WAS ALREADY BUILT.
// ARCHITECTURE property 4: "Runtime depends on nothing. It is the deployed base,
// and everything corpus-specific reaches it as configuration the projection
// emitted." `runtime-config.ts` is that configuration; deploy is now its producer.
// This package still imports nothing, and now it also ASSUMES nothing.
//
// THE SIGN IS `EventName`, WHICH IS WHAT SCHEMA CALLS IT. Two packages that cannot
// share a type still must not mint two signs for one concept — that is the defect
// `α(cᵢ) = α(cⱼ) ⇒ D(cᵢ) = D(cⱼ)` forbids, and `LifecycleEvent` beside schema's
// `EventName` was exactly it. The independent declaration is forced by property 4;
// the second NAME never was.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A lifecycle EVENT NAME — one harness-neutral moment an observer can be attached
 * to (`session.start`, `turn.end`, `tool.use.pre`, …), named in the corpus's
 * vocabulary rather than any harness's.
 *
 * OPEN, and that is the point: which names are valid is a fact this host READS
 * (`RuntimeConfig.events.vocabulary`), never one it carries. Every runtime port
 * that names an event (e.g. {@link import('./ports/event-tap.js').EventTapHost})
 * speaks this type, and every validation of one goes through the host config.
 */
export type EventName = string;
