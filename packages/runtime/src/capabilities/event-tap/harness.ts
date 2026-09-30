// ─────────────────────────────────────────────────────────────────────────────
// WHICH HARNESS INVOKED THE TAP, and which harnesses have a tap strategy at all.
//
// `eventTap` used to be Claude by default: every verb read or wrote Claude's
// `settings.json`, whichever harness the caller was. From an omp session that wrote
// `<cwd>/.claude/settings.json` — a file omp never reads — and `status` then
// reported `attached: true` for a tap that captured nothing. The tap now asks who
// is calling and refuses when that harness has no strategy, instead of attaching
// to a harness the caller is not.
//
// WHY THE INVOKING ENVIRONMENT, NOT THE HOST CONFIG. The host runtime config holds
// one stanza per harness DEPLOYED on the host (`harnesses.<harness>.native`),
// because one host runs several harnesses off the same runtime. On the host that
// hits this bug — Claude Code and omp both installed — the config holds both, so it
// cannot say which of the two is calling; it answers "which harnesses exist here",
// not "which one am I inside". The process environment is the only signal that
// travels with the invocation itself: the deployed shim spawns the CLI with the
// caller's environment (`stdio: 'inherit'`, no `env`), so what the harness exported
// to its tool subprocesses reaches this process.
//
// WHAT EACH HARNESS EXPORTS, observed from inside a running omp session's tool
// environment: omp sets `OMPCODE=1` AND `CLAUDECODE=1` — the second is Claude Code's
// own marker, which omp exports for compatibility with tooling that sniffs it. So
// `CLAUDECODE` alone proves nothing (omp sessions carry it), while `OMPCODE` is
// omp's own and is never set by Claude Code. The order below is therefore
// load-bearing: omp is tested FIRST, and Claude only when omp's marker is absent.
// ─────────────────────────────────────────────────────────────────────────────

import { CLI_BIN } from '../../bin-name.js';
import { EventTapHostClaude } from './claude.js';

/**
 * The harnesses that have a tap strategy, each by the name its adapter and its
 * host-config stanza use, mapped to how the operator knows it. The one roster:
 * forge asks it at projection, and the dispatcher asks it at install.
 */
export const EVENT_TAP_HARNESSES: Readonly<Record<string, string>> = {
  [EventTapHostClaude.harness]: 'Claude Code',
};

/** Whether `harness` has a tap strategy — a name in {@link EVENT_TAP_HARNESSES}. */
export function hasEventTapStrategy(harness: string): boolean {
  return Object.hasOwn(EVENT_TAP_HARNESSES, harness);
}

/** The environment variable a harness exports to its tool subprocesses, in the
 *  order they are tested — omp first, because it also exports Claude's. */
const HARNESS_MARKERS: readonly (readonly [
  harness: string,
  variable: string,
])[] = [
  ['omp', 'OMPCODE'],
  [EventTapHostClaude.harness, 'CLAUDECODE'],
];

/**
 * The harness whose session this process runs inside, or `undefined` when the
 * environment names none (a bare shell, CI). A caller with no harness in its
 * environment is not refused: the tap targets Claude's settings there, as it always
 * has.
 */
export function invokingHarness(env: NodeJS.ProcessEnv): string | undefined {
  for (const [harness, variable] of HARNESS_MARKERS) {
    const value = env[variable];
    if (value !== undefined && value.trim() !== '') return harness;
  }
  return undefined;
}

/**
 * The refusal for a harness with no tap strategy: names the harness, says what is
 * lost and which harness has a tap, and says nothing was written.
 */
export function noEventTapStrategy(verb: string, harness: string): string {
  const has = Object.values(EVENT_TAP_HARNESSES).join(', ');
  return `eventTap ${verb}: ${harness} has no event-tap strategy — only ${has} has a tap today. ${harness} reads no hook config this tap can write, so an install here would capture no events while reporting itself attached; nothing was written. Run \`${CLI_BIN} eventTap\` from a ${has} session, or from a shell outside ${harness}.`;
}
