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
import { discoverConfigured } from '@leclabs/agent-runtime/loader';
import { runMain } from '@leclabs/agent-runtime/main';

const BIN = 'agent-runtime';

/**
 * The capability set this CLI SHIPS WITH — the zero-config default, each a
 * declared dependency above. It is a default, not a fixture: a host that declares
 * providers in its runtime config overrides this entirely, which is what makes a
 * MemoryStrategy genuinely swappable rather than plugin-shaped.
 */
const BUNDLED = [memory];

const fail = (err: unknown): void => {
  process.stderr.write(
    `${BIN}: ${err instanceof Error ? (err.stack ?? err.message) : String(err)}\n`,
  );
  process.exitCode = 1;
};

// Provider resolution must fail through the SAME reporting path as everything
// else: a top-level await that throws surfaces as an unhandled rejection and a
// node stack trace, which reads as a crash rather than "your config names a
// provider that is not installed here".
try {
  const plugins = (await discoverConfigured()) ?? BUNDLED;
  await runMain(process.argv.slice(2), { plugins });
} catch (err) {
  fail(err);
}
