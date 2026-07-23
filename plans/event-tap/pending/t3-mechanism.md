# T3 — mechanism (pending · wave 1 · deps T1)

## Objective

Build the companion tool `packages/agent-canon/src/toolkit/event-tap/event-tap.sh`
(`install|inspect|uninstall|status`) and the **passive logger** it installs at runtime, plus a
hermetic falsifier test proving the logger **cannot block**.

## Dep-fed inputs

- **T1** (`content(t1-derive-verbs)`) — the settled verb set + their signs. Use verbatim.

## Static inputs (pinned)

- `.scratchpad/tap-skill-draft.md` (§2 mechanism contract) — the interface + flags.
- `packages/agent-canon/src/toolkit/guardrail/stance-guardrail.sh` — the exemplar for the
  `settings.json` `{hooks}` merge + the surgical group teardown (the exact pattern used for the T2b probe).
- `packages/agent-canon/src/toolkit/continuity/continuity-hook.sh` — the `install|uninstall|status` shape.
- `packages/agent-canon/test/memory-nudge.test.ts` — the vitest worker-test pattern (`execFileSync('sh', …)`, hermetic tmpdir, `it.runIf(hasJq)`); a passive worker asserts `expect(out).not.toContain('"decision"')` (L87).

## Constraints

- **Non-interference is constitutive.** The installed logger `cat`s stdin → appends
  `{ts,event,agent_type,agent_id,tool,keys,raw}` to the capture → **emits ∅, exits 0**. It can never
  block/deny/mutate. The logger's bytes live inside `event-tap.sh` (heredoc it writes on `install`).
- `install`: merge the logger into the settings layer for the chosen `--events` (default: a sensible
  boundary set), `--scope project|global` (**default project**; `--global` prints a privacy WARN),
  optional `--match <tool-regex>`; **idempotent** (never double-adds). `inspect`: jq over the capture
  (`--event --field --keys --tail`). `uninstall`: surgically drop only the tap's own groups + **wipe
  the capture** + **restore prior settings** (zero residue). `status`: live? / captured? / age? (nag > 2h).
- Harness-agnostic where the tool allows: under the Claude adapter the settings layer IS
  `settings.json` `{hooks}`; keep the adapter-specific bit isolated so a future adapter can swap it.
- Reuse `archive-before-rewrite` on the settings file; POSIX sh; jq-guarded (fail-open, never wedge).

## Outputs

- `toolkit/event-tap/event-tap.sh` (executable) + `test/event-tap.test.ts` (vitest-wired, rides `pnpm test`).

## Accept (blind falsifier)

REJECTED if: the logger emits ANY stdout or a `"decision"` on any synthetic event (blocks); OR
`uninstall` leaves a group, a non-empty capture, or a changed settings file; OR `install` run twice
double-adds; OR the test is not hermetic (touches host settings/git). ACCEPTED when the test suite
shows: logger-on-synthetic-event → empty stdout + exit 0 (prove-CANNOT-block, non-vacuous); install
idempotent; uninstall → zero residue + settings restored; inspect round-trips a captured field.
