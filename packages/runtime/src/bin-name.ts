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
// site interpolates it. An earlier pass recorded this consolidation as DONE while
// the literal still stood in seven places; this module is what makes the claim true.
//
// THE ONE IRREDUCIBLE SECOND COPY is `cratylus`'s `bin` key: npm reads
// that manifest with no TypeScript in the loop, so it cannot be computed. Their
// agreement is a TEST obligation, not a compiler one —
// `canon/test/bin-name-single-home.test.ts` holds it, so a rename cannot
// half-land.
//
// THE MIGRATION LANDED 2026-08-05: `cratylus` → `cratylus`, one commit
// after the scope rename and deliberately not with it, so a host-side failure
// stays attributable to the bin and not to 500 renamed files.
//
// WHY `cratylus` AND NOT `cratylus`. There are two bins, and the brevity
// budget was spent on the wrong one in this shard's first guess (`cratylus` +
// `cratylus-forge`). The build-time bin is TYPED BY HUMANS — seven subcommands,
// muscle memory, docs — so it takes the bare mark, `cratylus`. This one is
// invoked almost entirely by GENERATED ARTIFACTS: the projected
// `scripts/<capability>.mjs` shims and the generated hook `.sh` workers. Saving
// a token on a machine-written call site to spend one on the human-typed surface
// is backwards. Explicitness is also a virtue in a name you read while debugging
// a shim on a host at 2am.
//
// `invoke` — the package that ships this bin — could not BE the bin: pyinvoke
// already installs `invoke` and `inv` on PATH. The package name is scoped and
// safe; a bin name is global and unscoped, which is a strictly harder occupancy
// problem and why the two were derived separately.
//
// FLIPPING THIS ONE SYMBOL IS STILL THE WHOLE RENAME — that is what this module
// bought, and the migration proved it: `RUNTIME_CONFIG_NAME` and `TAP_ID` are
// template-derived from this value and moved without being touched.
// ─────────────────────────────────────────────────────────────────────────────

/** THE command's name on PATH — there is exactly one now. Every other site — cac
 *  branding, error prefixes, the projected thin shim, the memory-nudge hook worker,
 *  the carry-on gate written into a harness's settings — interpolates this rather
 *  than repeating the literal.
 *
 *  IT LIVES HERE because the runtime is the contract leaf: it depends on nothing, so
 *  every package that needs the name can import it without inverting an edge. It was
 *  `cratylus` when there were two commands; merging them made that name a lie. */
export const CLI_BIN = 'cratylus';
