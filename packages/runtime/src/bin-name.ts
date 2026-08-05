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
// (invoke → runtime; forge → runtime; canon → runtime), and every
// site interpolates it. `install-parity` S4 recorded this as done when the literal
// still stood in seven places; this module is what makes the claim true.
//
// THE ONE IRREDUCIBLE SECOND COPY is `@cratylus/invoke`'s `bin` key: npm reads
// that manifest with no TypeScript in the loop, so it cannot be computed. Their
// agreement is a TEST obligation, not a compiler one —
// `canon/test/bin-name-single-home.test.ts` holds it, so a rename cannot
// half-land.
//
// THE BRAND ANCHOR HAS NOW CONVERGED — `Cratylus`, landed 2026-08-05 with the
// scope rename (`@leclabs/agent-*` → `@cratylus/*`). This value did NOT move with
// it, deliberately. A package name is free while nothing is published; a bin name
// is a MIGRATION, because deployed skill shims on hosts already invoke
// `agent-runtime <capability>` and a flip strands them until redeploy. Renaming
// packages and bins in one commit would also make a host-side failure
// unattributable.
//
// So this literal is the last artifact still wearing the retired `agent-` prefix,
// alongside forge's `agent-forge`. They move together, once, with a redeploy —
// see `plans/decomplect/ready/t-bin-name-migration.md`. Flipping this one symbol
// is still the whole rename; that is what this module bought.
// ─────────────────────────────────────────────────────────────────────────────

/** The runtime executable's name on PATH. The single source of truth: every other
 *  site — cac branding, error prefixes, the projected thin shim, the memory-nudge
 *  hook worker — interpolates this rather than repeating the literal. */
export const RUNTIME_BIN = 'agent-runtime';
