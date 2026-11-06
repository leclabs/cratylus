// ─────────────────────────────────────────────────────────────────────────────
// THE BIN NAME — the one home.
//
// The name under which the command is installed on a host's PATH. Several packages
// speak it, some from INSIDE an emitted artifact (a projected shim, a generated hook
// worker, the host config name) where no compiler can see it, so a repeated literal
// that a rename missed would fail at runtime on a host, not at build.
//
// So it lives HERE, in the contract leaf every other package already depends on
// (cli → runtime; forge → runtime; canon → runtime), and every site interpolates
// it. Changing this one symbol is the whole rename: `RUNTIME_CONFIG_NAME` is
// template-derived from it.
//
// THE ONE IRREDUCIBLE SECOND COPY is `cratylus`'s `bin` key: npm reads
// that manifest with no TypeScript in the loop, so it cannot be computed. Their
// agreement is a TEST obligation, not a compiler one —
// `canon/test/bin-name-single-home.test.ts` holds it, so a rename cannot
// half-land.
// ─────────────────────────────────────────────────────────────────────────────

/** THE command's name on PATH. Every other site — the program's branding, error
 *  prefixes, the projected thin shim, the host config name — interpolates this
 *  rather than repeating the literal.
 *
 *  IT LIVES HERE because the runtime is the contract leaf: it depends on nothing, so
 *  every package that needs the name can import it without inverting an edge. */
export const CLI_BIN = 'cratylus';
