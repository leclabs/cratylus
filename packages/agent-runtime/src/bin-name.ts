// ─────────────────────────────────────────────────────────────────────────────
// THE BIN NAME — the one home.
//
// The name under which the runtime's executable is installed on a host's PATH.
// It is not a string the runtime alone owns: four packages speak it, and three of
// them speak it from INSIDE an emitted artifact (a projected `scripts/<cap>.mjs`,
// a generated hook `.sh`) where no compiler can see it. A rename that missed one
// produced a deployed script that failed at runtime on a host, not at build.
//
// So it lives HERE, in the contract leaf every other package already depends on
// (agent-cli → runtime; agent-forge → runtime; agent-canon → runtime), and every
// site interpolates it. `install-parity` S4 recorded this as done when the literal
// still stood in seven places; this module is what makes the claim true.
//
// THE ONE IRREDUCIBLE SECOND COPY is `@leclabs/agent-cli`'s `bin` key: npm reads
// that manifest with no TypeScript in the loop, so it cannot be computed. Their
// agreement is a TEST obligation, not a compiler one —
// `agent-canon/test/bin-name-single-home.test.ts` holds it, so a rename cannot
// half-land.
//
// The value is a PLACEHOLDER: the brand anchor is cratylism-gated and has not
// converged. Nothing here decides it. Flipping this one symbol is the whole
// rename.
// ─────────────────────────────────────────────────────────────────────────────

/** The runtime executable's name on PATH. The single source of truth: every other
 *  site — cac branding, error prefixes, the projected thin shim, the memory-nudge
 *  hook worker — interpolates this rather than repeating the literal. */
export const RUNTIME_BIN = 'agent-runtime';
