// ─────────────────────────────────────────────────────────────────────────────
// The hub's LIBRARY face — what a consumer's `cratylus.config.ts` imports.
//
// A consumer installs ONE package and imports from it: `defineConfig` comes from
// `cratylus`, not from `@cratylus/forge/config`. Reaching past the hub into the
// projector would make every consumer's config depend on the internal package
// split, and that split is ours to change.
//
// This is the same seam the bins already draw, in the other direction: the hub
// composes, and nothing downstream of it needs to know what it composed FROM.
// ─────────────────────────────────────────────────────────────────────────────

export { type CratylusConfig, defineConfig } from '@cratylus/forge/config';
