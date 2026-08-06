// ─────────────────────────────────────────────────────────────────────────────
// The runtime MAIN — the thin cac CLI over the loader+dispatch node app.
//
// This module EXPORTS runMain; it does not invoke it. The invoking bin lives in
// the installable CLI package, which DECLARES its capability packages as real
// dependencies and passes them in — so capability resolution succeeds because the
// dependency is declared, not because a flat co-install happened to co-locate a
// sibling (the ambient-resolution defect this replaces).
//
// Mirrors forge's `cac`-based thin-CLI: cac owns branding + `--help` /
// `--version`; the dynamic `<capability> <verb> [args]` stream is routed by the
// dispatcher (the verb space is plugin-driven, so it is NOT a fixed cac command
// table). `runMain` bootstraps the host from host-installed capability packages,
// dispatches, and maps the pure {@link DispatchResult} to stdio + exit code.
//
// The BIN NAME is a PLACEHOLDER pending the brand derivation, and it is IMPORTED,
// not written here: its one home is `./bin-name.ts`. See that module for why the
// single home is load-bearing (three of its four consumers speak it from inside a
// compiler-invisible emitted string).
// ─────────────────────────────────────────────────────────────────────────────

import { createRequire } from 'node:module';
import { cac } from 'cac';
import { RUNTIME_BIN } from './bin-name.js';
import { dispatchCarryOn } from './capabilities/carry-on/index.js';
import { dispatchEventTap } from './capabilities/event-tap/index.js';
import { dispatch } from './dispatch.js';
import { RuntimeHost, bootstrap } from './loader.js';
import type { RuntimePlugin } from './plugin.js';

/** The runtime bin version. A constant (not read from package.json): the bundled
 *  bin ships without its manifest, so a runtime package.json read is unsafe. */
/**
 * This package's version, read from the manifest that DEFINES it.
 *
 * It was the literal `'0.0.0'`, and `0.1.0` shipped to npm with every CLI still reporting
 * `0.0.0` — confirmed by installing the published tarball on another host. A version is a
 * CLAIM ABOUT THE ARTIFACT, and it had no home: `changeset version` rewrites the manifest
 * and cannot rewrite a string in TypeScript, so the two were guaranteed to diverge at the
 * first release and to stay diverged forever.
 *
 * Read by package SELF-REFERENCE rather than a relative path, which is the form
 * `bin-name.ts` already uses and for the same reason: tsup inlines this module into
 * `dist/<entry>/index.js`, so `../package.json` would resolve from the wrong depth once
 * bundled. Node resolves a self-reference through the package's own `exports`.
 */
export const VERSION: string = createRequire(import.meta.url)(
  '@cratylus/runtime/package.json',
).version;

/** Bin entrypoint: brand + help/version via cac, else bootstrap → dispatch → stdio. */
/** Options for {@link runMain}. `plugins` are DECLARED capability plugins supplied
 *  by the installable CLI package; when present they are registered directly and
 *  ambient discovery is skipped, which is what makes an isolated install work. */
export interface RunMainOpts {
  readonly plugins?: readonly RuntimePlugin[];
}

export async function runMain(
  argv: readonly string[],
  opts: RunMainOpts = {},
): Promise<void> {
  const cli = cac(RUNTIME_BIN);
  cli.command(
    '[capability] [verb]',
    'Dispatch <verb> to the <capability> plugin registered on this host',
  );
  cli.help();
  cli.version(VERSION);

  const first = argv[0];
  if (first === undefined || first === '--help' || first === '-h') {
    cli.outputHelp();
    process.exitCode = 0;
    return;
  }
  if (first === '--version' || first === '-v') {
    process.stdout.write(`${VERSION}\n`);
    process.exitCode = 0;
    return;
  }

  // The event-tap capability ships INSIDE the runtime (a subpath module, not a
  // discovered `@cratylus/*` plugin), and its verbs carry their own flag grammar
  // (`--events`, `--sink`, `--settings`) a generic method-reflecting dispatcher
  // cannot know. So the tap routes to its dedicated verb surface directly, ahead of
  // the install-discovered dispatch — no host bootstrap needed. A throw (unknown
  // verb / unknown event / missing flag) is a loud code-1 failure.
  //
  // ONE WORD ROUTES HERE, and it is the capability's own: `eventTap`, its member in
  // `CAPABILITIES`. That is the word the dispatch grammar `<capability> <verb>`
  // speaks, and therefore the word a PROJECTED THIN SHIM spawns (the emitter is
  // `f(capability)`, so an `eventTap` cell yields
  // `spawnSync(RUNTIME_BIN, ['eventTap', …])`). Routing only the `tap` shorthand once
  // made the tap reachable by an operator typing at a shell but DEAD to every agent
  // coming through its own skill's shim: `eventTap` fell through to the discovered
  // dispatch, where no plugin binds it, and died `unknown capability`.
  //
  // The `tap` shorthand is now GONE rather than merely un-preferred. It was never a
  // third name for this capability — it fails to circumscribe one (a passive siphon
  // on WHICH stream?), and a second accepted word is a second thing an operator can
  // learn, cite, and be wrong about. Typing `tap` now falls to the discovered
  // dispatch and raises `UnknownCapabilityError`, naming the bound set — the
  // kernel's own fail-loud contract, applied to its own vocabulary.
  if (first === 'eventTap') {
    try {
      const result = dispatchEventTap([...argv.slice(1)]);
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      process.exitCode = 0;
    } catch (err) {
      process.stderr.write(
        `${RUNTIME_BIN}: ${err instanceof Error ? err.message : String(err)}\n`,
      );
      process.exitCode = 1;
    }
    return;
  }

  // The carry-on capability ships INSIDE the runtime on the same terms as the tap
  // (a subpath module, its own flag grammar: --plan-root/--states/--event/…), so it
  // routes to its dedicated verb surface ahead of the install-discovered dispatch.
  //
  // EXIT CODES ARE THE HARNESS CONTRACT HERE, and they are not decoration. The
  // `terminus` verb is what the INSTALLED GATE runs at turn end: it refuses a stop
  // through its stdout payload (`decision: 'block'`) at exit 0, never through an
  // exit code. A THROW is therefore always fail-OPEN — a gate that cannot answer
  // (missing config, unreadable plan root) reports the failure and lets the turn
  // end, because a mechanism that wedges a session on its own breakage is worse
  // than one that misses a block and says so.
  if (first === 'carryOn') {
    try {
      const result = dispatchCarryOn([...argv.slice(1)]);
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      process.exitCode = 0;
    } catch (err) {
      process.stderr.write(
        `${RUNTIME_BIN}: ${err instanceof Error ? err.message : String(err)}\n`,
      );
      process.exitCode = 1;
    }
    return;
  }

  const host =
    opts.plugins && opts.plugins.length > 0
      ? opts.plugins.reduce((h, p) => h.register(p), new RuntimeHost())
      : await bootstrap();
  const { code, out, err } = await dispatch(host, argv);
  if (out) process.stdout.write(out);
  if (err) process.stderr.write(err);
  process.exitCode = code;
}
