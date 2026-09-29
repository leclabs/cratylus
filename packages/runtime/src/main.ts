// ─────────────────────────────────────────────────────────────────────────────
// The runtime MAIN — the thin cac CLI over the capabilities the runtime ships.
//
// This module EXPORTS runCli; it does not invoke it. The invoking bin lives in
// the installable CLI package, which hands the runtime every argv whose first
// word is a member of `CAPABILITIES`.
//
// Mirrors forge's `cac`-based thin-CLI: cac owns branding + `--help` /
// `--version`. The `<capability> <verb> [args]` stream is routed through ONE
// table typed over `Capability`, so a capability without a route does not
// compile: each member reaches its own verb surface, which owns its verbs' flag
// grammar. `eventTap` prints its JSON result; `design`, `plan` and `note` print
// their view. A refusal is a loud code-1 failure, printed as `cratylus: <message>`.
//
// The BIN NAME is a PLACEHOLDER pending the brand derivation, and it is IMPORTED,
// not written here: its one home is `./bin-name.ts`. See that module for why the
// single home is load-bearing (three of its four consumers speak it from inside a
// compiler-invisible emitted string).
// ─────────────────────────────────────────────────────────────────────────────

import { createRequire } from 'node:module';
import { cac } from 'cac';
import { CLI_BIN } from './bin-name.js';
import { dispatchDesign } from './capabilities/design/index.js';
import { dispatchEventTap } from './capabilities/event-tap/index.js';
import { dispatchNote } from './capabilities/note/index.js';
import { dispatchPlan } from './capabilities/plan/index.js';
import { CAPABILITIES, type Capability } from './capability.js';

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

/**
 * Each capability's verb surface: its verb and arguments in, the text it prints
 * out. A refusal throws.
 *
 * ONE WORD ROUTES EACH, and it is the capability's own member of `CAPABILITIES` —
 * `eventTap`, never the kebab dir name nor an abbreviation. That is the word the
 * grammar `<capability> <verb>` speaks, and therefore the word a PROJECTED THIN
 * SHIM spawns (the emitter is `f(capability)`, so an `eventTap` cell yields
 * `spawnSync(CLI_BIN, ['eventTap', …])`).
 */
const ROUTES: { readonly [C in Capability]: (argv: string[]) => string } = {
  eventTap: (argv) => JSON.stringify(dispatchEventTap(argv), null, 2),
  design: dispatchDesign,
  plan: dispatchPlan,
  note: dispatchNote,
};

function isCapability(word: string): word is Capability {
  return (CAPABILITIES as readonly string[]).includes(word);
}

/**
 * A reader that closes stdout early — `cratylus design show | head -1` — has
 * taken all it wants, which is not a failure: the process ends quietly with the
 * exit code it already holds. Any other stdout error stays loud.
 */
function endOnClosedStdout(error: NodeJS.ErrnoException): void {
  if (error.code !== 'EPIPE') throw error;
  process.exit();
}

function refuse(message: string): void {
  process.stderr.write(`${CLI_BIN}: ${message}\n`);
  process.exitCode = 1;
}

/** Bin entrypoint: brand + help/version via cac, else route → stdio + exit code. */
export async function runCli(argv: readonly string[]): Promise<void> {
  if (!process.stdout.listeners('error').includes(endOnClosedStdout))
    process.stdout.on('error', endOnClosedStdout);
  const cli = cac(CLI_BIN);
  cli.command(
    '[capability] [verb]',
    `Run <verb> of <capability>, one of ${CAPABILITIES.join(', ')}`,
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
  if (!isCapability(first)) {
    refuse(
      `unknown capability '${first}' — the capabilities are ${CAPABILITIES.join(', ')}`,
    );
    return;
  }
  try {
    process.stdout.write(`${ROUTES[first](argv.slice(1))}\n`);
    process.exitCode = 0;
  } catch (err) {
    refuse(err instanceof Error ? err.message : String(err));
  }
}
