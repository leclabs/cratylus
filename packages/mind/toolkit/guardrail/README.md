# stance guardrail — the harness half of principal-stance (P4)

A standing **Stop / SubagentStop hook** that **structurally refuses** a turn in which an agent collapses
out of the **intent-driven-expert (fiduciary-agent) stance** — the harness enforcement that makes the
stance _invariant_, not merely prompted.

## Why it exists

Encoding the principal stance as **identity** (Nico's half — founder-genus reworked into a constitutive
`you-ARE` statement, `c8c451c`) raises the threshold but is **not truly invariant**: enough operator
pushback erodes any prompt-level stance, because RLHF corrigibility reads a correction as _"defer more."_
True invariance needs the **harness** to refuse the collapsed turn. This is that refusal. (The embryo was
this session's ad-hoc Stop-hook, which twice caught a founder collapsing into deference and blocked the
turn; this generalizes it into a standing, gated guardrail.)

Identity is the **carrier**; this guardrail makes it **invariant**.

## What it blocks (collapse signals)

On Stop, an LLM judge applies `stance-judge-prompt.md` to the last assistant turn and **blocks** when it
detects:

1. **Permission-seeking for in-remit, reversible work** — "should I…?", "want me to…?", option-menus for a
   settled, in-domain, reversible decision.
2. **Deferring expert judgment** the agent owns (naming / design / architecture / sequencing / how) back to
   the operator.
3. **Echoing / order-taking** — transcribing the operator's literal words or bespoke terms into the artifact
   instead of extracting and serving the underlying intent; sycophantic capitulation to a correction.

## What it does NOT block (the reserved set — PASS)

- **Surfacing a genuine irreversible-outward act for consent** — deploy/push/publish/external-send/durable
  delete. Naming such a gate and pausing for sign-off **is** the stance working.
- **Routing a genuine _intent_ ambiguity to `/elicit`** — asking WHAT/WHY (intent), never HOW (the agent's
  domain).
- Normal completion (reporting decisions + rationale, flagging findings, declaring done).

The judge is instructed to be **conservative**: when genuinely unsure between legitimate-consent and
in-remit permission-seeking, it PASSes. A false block wedges real work; a missed block is recoverable.

## Safety model (off-by-default-safe, like the continuity hook)

- **OFF BY DEFAULT.** Inert unless the repo opts in: `git config --bool polis.stanceGuard true` (lives in
  `.git/config`, never checked in; a fresh clone is opted out). Installing here changes **no other host**.
- **AGENT-SCOPED.** Fires only for agents on the allowlist (default `nico mav` — the founders). Set `*` for all.
- **FAILS OPEN.** Any error (no transcript, judge failure, no `jq`, no `claude`) → allow the stop. A
  guardrail that wedges work on its own flakiness is worse than a missed block.
- **LOOP-SAFE.** Honors `stop_hook_active` so a block can never re-wedge a turn.

## Components

| file                       | role                                                                                                                                                                                                                                         |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stance-guardrail.sh`      | the Stop/SubagentStop **worker**: gates (opt-in · agent-scope · loop · fail-open), extracts the last assistant turn from the transcript, calls the judge, emits `{"decision":"block","reason":…}` on collapse.                               |
| `stance-judge.sh`          | the default **judge backend** (contract: turn on stdin, rubric path argv[1] → `VERDICT: PASS\|BLOCK [+REASON]`). Calls headless `claude -p --model haiku`. Swappable via `$STANCE_JUDGE_CMD` — the only LLM-coupled, non-deterministic part. |
| `stance-judge-prompt.md`   | the **rubric** — the stance contract the judge applies.                                                                                                                                                                                      |
| `stance-guard-toggle.sh`   | opt the repo in/out: sets the git-config flag **and** writes the Stop+SubagentStop hook into `.claude/settings.local.json` (gitignored, local-only).                                                                                         |
| `test-stance-guardrail.sh` | **prove-it-bites** — hermetic (fixture repo + crafted transcripts + deterministic fixture judge), plus an optional live-`claude` smoke.                                                                                                      |

## Usage

```sh
pnpm stance-guard:install            # flag on + write the local-only hook (allowlist: nico mav)
pnpm stance-guard:install nico mav x # custom allowlist
pnpm stance-guard:status             # flag + allowlist + whether the settings hook is present
pnpm stance-guard:uninstall          # clear the flag (worker goes dormant; hook entry kept)
pnpm stance-guard:test               # prove it bites
# stance-guard-toggle.sh purge       # also remove the settings.local.json hook entry
```

Tuning env vars (all optional): `STANCE_JUDGE_CMD` (swap the whole backend), `STANCE_JUDGE_BIN`,
`STANCE_JUDGE_MODEL` (default `haiku`), `STANCE_RUBRIC`, `STANCE_GUARD_AGENTS`.
