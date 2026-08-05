// ─────────────────────────────────────────────────────────────────────────────
// The installable BIN — the single entry point a consumer gets from one global
// install.
//
// WHY THIS PACKAGE EXISTS. Capability resolution used to be AMBIENT: the runtime
// dynamic-`import()`ed `@cratylus/memory` as a bare specifier while declaring
// no dependency on it. That resolved only because the retired installer
// flat-co-installed both packages into ONE node_modules, making them siblings. A
// consumer running a plain global install of the runtime therefore got NO memory
// capability, and an isolated store (pnpm's global dir) broke resolution outright.
//
// The runtime cannot simply declare the capability itself: every capability
// package depends on the runtime for its contracts, so that edge would cycle. The
// fix is a third package — this one — that depends on BOTH and wires them by
// STATIC import. Resolution now succeeds because the dependency is DECLARED.
//
// THIS PACKAGE OWNS THE `bin` KEY, and that manifest entry is the one copy of the
// bin name no TypeScript can compute (npm reads it with no compiler in the loop).
// Everything else here imports `RUNTIME_BIN` from the runtime's `./bin-name`
// module; the manifest's agreement with it is held by a test
// (`canon/test/bin-name-single-home.test.ts`), so a rename cannot half-land.
//
// THE NAME. This package was `invoke` until 2026-08-05 — a sign that claimed
// THE CLI while shipping one of two, and disagreed with its own bin. `invoke` was
// not chosen: it survived a blind reverse decode that killed the entire forward
// slate (`assembly`, `bin`, `entry`, `composition`, `cli` all ≤6/10 cold), and the
// decoder's own noun proposals then failed the occupancy check against this repo.
// It wins on a property no noun had — a VERB decodes as a LEAF. Nothing depends on
// an action, so a cold reader places this package at the top of the DAG unprompted,
// which is exactly where it sits, and reads it as a discrete call rather than a
// resident process.
// ─────────────────────────────────────────────────────────────────────────────

import { fileURLToPath } from 'node:url';
import { runtimePlugin as memory } from '@cratylus/memory';
import { RUNTIME_BIN } from '@cratylus/runtime/bin-name';
import { discoverConfigured } from '@cratylus/runtime/loader';
import { runMain } from '@cratylus/runtime/main';
import { runInstall } from './install.js';

/**
 * The capability set this CLI SHIPS WITH — the zero-config default, each a
 * declared dependency above. It is a default, not a fixture: a host that declares
 * providers in its runtime config overrides this entirely, which is what makes a
 * MemoryStrategy genuinely swappable rather than plugin-shaped.
 */
const BUNDLED = [memory];

const fail = (err: unknown): void => {
  process.stderr.write(
    `${RUNTIME_BIN}: ${err instanceof Error ? (err.stack ?? err.message) : String(err)}\n`,
  );
  process.exitCode = 1;
};

const argv = process.argv.slice(2);

// `install` IS THIS BIN'S OWN VERB, not a capability, and it is routed HERE rather
// than in the runtime's dispatcher for two reasons that are the same reason.
//
// It authors the host-side half of the `bin` key — the pair ⟨bin name, executable
// path⟩ — and this package is the one that owns that key. The runtime knows the
// NAME (`bin-name.ts`, its one home) and must not learn how a host binds it; a
// dispatcher verb would put the binding in the contract leaf, which is the package
// ARCHITECTURE requires to depend on nothing.
//
// And it must run BEFORE provider discovery. Install is the recovery path: it has
// to work on a host whose runtime config names a provider that is not installed,
// or whose checkout just moved. A verb that needed a healthy host to repair a
// broken one would be useless exactly when it is needed.
if (argv[0] === 'install') {
  process.exitCode = runInstall(argv.slice(1), {
    entry: fileURLToPath(import.meta.url),
    log: (line) => process.stdout.write(`${line}\n`),
    warn: (line) => process.stderr.write(`${line}\n`),
  });
} else {
  // Provider resolution must fail through the SAME reporting path as everything
  // else: a top-level await that throws surfaces as an unhandled rejection and a
  // node stack trace, which reads as a crash rather than "your config names a
  // provider that is not installed here".
  try {
    const plugins = (await discoverConfigured()) ?? BUNDLED;
    await runMain(argv, { plugins });
  } catch (err) {
    fail(err);
  }
}
