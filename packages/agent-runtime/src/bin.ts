// ─────────────────────────────────────────────────────────────────────────────
// The runtime BIN — a thin cac CLI over the loader+dispatch node app.
//
// Mirrors agent-forge's `cac`-based thin-CLI: cac owns branding + `--help` /
// `--version`; the dynamic `<capability> <verb> [args]` stream is routed by the
// dispatcher (the verb space is plugin-driven, so it is NOT a fixed cac command
// table). `runMain` bootstraps the host from host-installed capability packages,
// dispatches, and maps the pure {@link DispatchResult} to stdio + exit code.
//
// BIN NAME `agent-runtime` is a PLACEHOLDER — S9 (FORK-4) rebrands it.
// ─────────────────────────────────────────────────────────────────────────────

import { cac } from 'cac';
import { dispatchTap } from './capabilities/event-tap/index.js';
import { dispatch } from './dispatch.js';
import { bootstrap } from './loader.js';

/** The runtime bin version. A constant (not read from package.json): the bundled
 *  bin ships without its manifest, so a runtime package.json read is unsafe. */
export const VERSION = '0.0.0';

const BIN = 'agent-runtime';

/** Bin entrypoint: brand + help/version via cac, else bootstrap → dispatch → stdio. */
export async function runMain(argv: readonly string[]): Promise<void> {
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
  // cannot know. So `tap <verb>` routes to its dedicated verb surface directly,
  // ahead of the install-discovered dispatch — no host bootstrap needed. A throw
  // (unknown verb / unknown event / missing flag) is a loud code-1 failure.
  if (first === 'tap') {
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

  const host = await bootstrap();
  const { code, out, err } = await dispatch(host, argv);
  if (out) process.stdout.write(out);
  if (err) process.stderr.write(err);
  process.exitCode = code;
}

runMain(process.argv.slice(2)).catch((err: unknown) => {
  process.stderr.write(
    `${BIN}: ${err instanceof Error ? (err.stack ?? err.message) : String(err)}\n`,
  );
  process.exitCode = 1;
});
