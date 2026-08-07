// ─────────────────────────────────────────────────────────────────────────────
// THE BUILD-TIME CLI'S BIN NAME — DERIVED, not declared a second time.
//
// This package ships an executable. Its name lives in `package.json`'s `bin`
// key, because that is the key NPM READS when it links the program onto a host's
// PATH — no TypeScript in the loop, no opportunity for anything else to be the
// truth. Every module below that needs the name has, until now, had nowhere to
// get it: `git grep cratylus -- packages/forge/src` returned nothing, and the one
// place that needed it — a SessionStart hook worker asking "is this host running
// what the corpus renders?" — spelled the literal into a shell string.
//
// WHY THIS IS A DERIVATION AND `RUNTIME_BIN` IS A CHECK, which is the asymmetry
// the corpus had not noticed. `packages/runtime/src/bin-name.ts` says of its own
// manifest key: "npm reads that manifest with no TypeScript in the loop, so it
// CANNOT BE COMPUTED. Their agreement is a TEST obligation, not a compiler one."
// That is true of the direction it was asserting — constant ⟼ manifest, which
// would need a code generator writing a file npm reads before any build has run.
// It is FALSE of the reverse. manifest ⟼ constant is a two-line read, and the
// manifest is the better home for the same reason it was the irreducible one:
// it is what npm obeys, so a constant disagreeing with it is always the wrong
// one. There is nothing here to hold in agreement, because there is only one
// authored spelling of the name in the package.
//
// SO THE GATE THAT WOULD HAVE HELD THEM AGREEING IS NOT WRITTEN. What is written
// instead is `binNameOf` — the derivation, isolated from its live input so a
// fixture can feed it a synthetic manifest and prove it reads the key rather
// than remembering a name (`test/project/projection-facts.test.ts`).
//
// IT ASKS NODE FOR ITS OWN MANIFEST rather than reading `../package.json`, and
// that is load-bearing under a bundler. `tsup` inlines this module into whichever
// entry imports it, so a path relative to THIS file's source location is a path
// relative to `dist/<entry>/index.js` at run time and resolves to nothing. A
// package self-reference (`@cratylus/forge/package.json`, exported by the
// manifest it names) is resolved by Node from the importing file's PACKAGE
// SCOPE, which survives bundling, `dist` vs `src`, and installation under
// `node_modules` — the three layouts this module is read from.
//
// EXACTLY ONE `bin` ENTRY OR IT REFUSES. "The CLI's name" is only a name while
// there is one of it; a package shipping two executables has no such thing, and
// answering with the first key would silently pick one. A shortfall that is
// legible is declared, never guessed.
// ─────────────────────────────────────────────────────────────────────────────

import { createRequire } from 'node:module';

/** The one field of a manifest this module reads: npm's `bin` map, name → entry. */
interface BinManifest {
  readonly bin?: Readonly<Record<string, string>>;
}

/**
 * The single executable name a parsed manifest declares.
 *
 * PURE, and separated from the read for exactly one reason: a derivation whose
 * only input is the live corpus is green whether it derives or remembers. This
 * takes the manifest as an argument, so a fixture can hand it a different one.
 *
 * `where` names the manifest in the refusal — a message reporting "no bin" with
 * no path sends the reader hunting for which package it was about.
 */
export function binNameOf(manifest: unknown, where: string): string {
  const names = Object.keys((manifest as BinManifest | null)?.bin ?? {});
  if (names.length !== 1) {
    throw new Error(
      `binNameOf: ${where} declares ${names.length} \`bin\` entries (${names.join(', ') || 'none'}) — a package's CLI name is derivable only from exactly one.`,
    );
  }
  return names[0] as string;
}

/** This package's own manifest, addressed as a package self-reference. */
const SELF_MANIFEST = '@cratylus/forge/package.json';

/**
 * The build-time CLI's name on PATH — read from the `bin` key that puts it there.
 *
 * The ONE home. Nothing else in this repository may spell it: a worker template
 * that needs it names the projection fact `deploy-bin`, and the projector
 * substitutes this value.
 */
export const FORGE_BIN: string =
  process.env.CRATYLUS_BUILD_BIN ??
  binNameOf(createRequire(import.meta.url)(SELF_MANIFEST), SELF_MANIFEST);

// THE BIN MOVED OUT OF THIS PACKAGE, and the derivation had to follow it. `forge` is
// a LIBRARY now — the `cratylus` command ships from the hub package, because two
// manifests declaring one bin name is an install conflict, not a second home.
//
// So forge can no longer read its own name off its own manifest: it has none. The
// hub, which does, hands it down. That is a PARAMETER, not a second spelling — the
// value still originates in exactly one `bin` key that npm reads, and this module
// still refuses to invent one. The self-manifest branch survives for any consumer
// mounting this CLI from a package that does declare a bin of its own.
