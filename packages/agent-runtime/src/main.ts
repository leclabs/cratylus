// ─────────────────────────────────────────────────────────────────────────────
// The runtime MAIN — the thin cac CLI over the loader+dispatch node app.
//
// This module EXPORTS runMain; it does not invoke it. The invoking bin lives in
// the installable CLI package, which DECLARES its capability packages as real
// dependencies and passes them in — so capability resolution succeeds because the
// dependency is declared, not because a flat co-install happened to co-locate a
// sibling (the ambient-resolution defect this replaces).
//
// Mirrors agent-forge's `cac`-based thin-CLI: cac owns branding + `--help` /
// `--version`; the dynamic `<capability> <verb> [args]` stream is routed by the
// dispatcher (the verb space is plugin-driven, so it is NOT a fixed cac command
// table). `runMain` bootstraps the host from host-installed capability packages,
// dispatches, and maps the pure {@link DispatchResult} to stdio + exit code.
//
// BIN NAME `agent-runtime` is a PLACEHOLDER — the brand derivation has not
// converged; it lives in exactly one place so the rebrand stays a one-line change.
// ─────────────────────────────────────────────────────────────────────────────

import { cac } from 'cac';
import { dispatchTap } from './capabilities/event-tap/index.js';
import { dispatch } from './dispatch.js';
import { RuntimeHost, bootstrap } from './loader.js';
import type { RuntimePlugin } from './plugin.js';

/** The runtime bin version. A constant (not read from package.json): the bundled
 *  bin ships without its manifest, so a runtime package.json read is unsafe. */
export const VERSION = '0.0.0';

const BIN = 'agent-runtime';

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
  const cli = cac(BIN);
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
  // discovered `@leclabs/*` plugin), and its verbs carry their own flag grammar
  // (`--events`, `--sink`, `--settings`) a generic method-reflecting dispatcher
  // cannot know. So the tap routes to its dedicated verb surface directly, ahead of
  // the install-discovered dispatch — no host bootstrap needed. A throw (unknown
  // verb / unknown event / missing flag) is a loud code-1 failure.
  //
  // BOTH the capability word and its shorthand route here. `eventTap` is the
  // capability's canonical name in `CAPABILITIES` — the word the dispatch grammar
  // `<capability> <verb>` actually speaks, and therefore the word a PROJECTED THIN
  // SHIM spawns (the emitter is `f(capability)`, so an `eventTap` cell yields
  // `spawnSync('agent-runtime', ['eventTap', …])`). Routing only the `tap`
  // shorthand made the tap reachable by an operator typing at a shell but DEAD to
  // every agent coming through its own skill's shim: `eventTap` fell through to the
  // discovered dispatch, where no plugin binds it, and died `unknown capability`.
  if (first === 'tap' || first === 'eventTap') {
    try {
      const result = dispatchTap([...argv.slice(1)]);
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      process.exitCode = 0;
    } catch (err) {
      process.stderr.write(
        `${BIN}: ${err instanceof Error ? err.message : String(err)}\n`,
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
