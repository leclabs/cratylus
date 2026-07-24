// ─────────────────────────────────────────────────────────────────────────────
// The installable BIN — the single entry point a consumer gets from one global
// install.
//
// WHY THIS PACKAGE EXISTS. Capability resolution used to be AMBIENT: the runtime
// dynamic-`import()`ed `@leclabs/agent-memory` as a bare specifier while declaring
// no dependency on it. That resolved only because the retired installer
// flat-co-installed both packages into ONE node_modules, making them siblings. A
// consumer running a plain global install of the runtime therefore got NO memory
// capability, and an isolated store (pnpm's global dir) broke resolution outright.
//
// The runtime cannot simply declare the capability itself: every capability
// package depends on the runtime for its contracts, so that edge would cycle. The
// fix is a third package — this one — that depends on BOTH and wires them by
// STATIC import. Resolution now succeeds because the dependency is DECLARED.
// ─────────────────────────────────────────────────────────────────────────────

import { runtimePlugin as memory } from '@leclabs/agent-memory';
import { runMain } from '@leclabs/agent-runtime/main';

const BIN = 'agent-runtime';

/** The capability set this CLI ships with, each a declared dependency above. */
const PLUGINS = [memory];

runMain(process.argv.slice(2), { plugins: PLUGINS }).catch((err: unknown) => {
  process.stderr.write(
    `${BIN}: ${err instanceof Error ? (err.stack ?? err.message) : String(err)}\n`,
  );
  process.exitCode = 1;
});
