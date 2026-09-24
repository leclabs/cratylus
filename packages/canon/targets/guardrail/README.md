# stance guardrail — the harness half of the principal stance

A standing **Stop / SubagentStop hook** that **structurally refuses** a turn in which an agent collapses
out of the **intent-driven-expert (fiduciary-agent) stance** — the harness enforcement that makes the
stance _invariant_, not merely prompted.

## Why it exists

Encoding the principal stance as **identity** (Nico's half — the `principal-ic` stance reworked into a
constitutive `you-ARE` statement, `c8c451c`; that agent has since been retired, the stance it carried
has not) raises the threshold but is **not truly invariant**: enough operator pushback erodes any
prompt-level stance, because RLHF corrigibility reads a correction as _"defer more."_ True invariance
needs the **harness** to refuse the collapsed turn. This is that refusal. (The embryo was this
session's ad-hoc Stop-hook, which twice caught a principal-self agent collapsing into deference and
blocked the turn; this generalizes it into a standing, gated guardrail.)

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

## How it's installed (forge-native)

The hook is **sourced, projected, and deployed by forge** — no hand-rolled `jq` toggle:

- **Source** — the forge `Hook` in `packages/canon/src/hook-cells.ts` (`turn.end` → Stop,
  `subagent.end` → SubagentStop; command = `$HOME/.claude/hooks/stance-guardrail/stance-guardrail.sh`;
  timeout 60).
- **Project** — `pnpm canon:project` emits a `settings.json` `{hooks}` fragment + stages these workers
  under `.cratylus/claude/hooks/stance-guardrail/`.
- **Deploy** — `pnpm canon:deploy:hooks` (`cratylus deploy --kind hooks`) ships the workers to
  `~/.claude/hooks/stance-guardrail/` and **merges** the hooks block into the host `settings.json`
  (idempotent, non-destructive — never clobbers permissions/env/other hooks).

## Safety model (enrolled by placement, silent otherwise)

- **SCOPE-ENROLLED — enrollment is PRESENCE.** The projection lands
  `<scope>/stance/manifest.json` in each persona's own scope, and the worker judges a scope
  carrying one and no other. Composing the cell enrolls the persona; nothing central lists
  anybody. A bare launch carries the dispatcher and no manifest, so it is silent by placement
  rather than by a branch.
- **NO REPO OPT-IN, NO ALLOWLIST.** Both are gone. The opt-in asked whether a guard may run in a
  DIRECTORY, which is a category error — a stance belongs to the agent, not the checkout — and it
  made the stance optional at runtime for an agent already launched as itself, which is the
  ambient form this harness half exists to prevent. The allowlist was a runtime self-filter over
  an enrollment the corpus already derives, and it had drifted: every projected persona carried
  the guard while the shell default named `nico mav`, leaving `architect` and `kino` holding
  principal authority and never once judged. **The off switch is launching `omp` instead of a
  persona** — declining to be the agent, rather than being it unjudged.
- **FAILS OPEN, NEVER SILENTLY-CLEAN.** Any error (no transcript, judge failure, no `jq`) → allow
  the stop, because a guardrail that wedges work on its own flakiness is worse than a missed
  block. But an enrolled scope whose judge could not answer announces itself via `dark` and
  records a DARK row in the verdict log: silence is reserved for NOT ENROLLED.
- **LOOP-SAFE.** A block budget bounds re-entry; judging itself is never skipped.

## Components

| file                       | role                                                                                                                                                                                                                                         |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stance-guardrail.sh`      | the Stop/SubagentStop **worker**: gates (scope-enrollment · loop · fail-open), extracts the last assistant turn from the transcript, calls the judge, emits `{"decision":"block","reason":…}` on collapse.                                   |
| `stance-judge.sh`          | the default **judge backend** (contract: turn on stdin, rubric path argv[1] → `VERDICT: PASS\|BLOCK [+REASON]`). Calls headless `claude -p --model haiku`. Swappable via `$STANCE_JUDGE_CMD` — the only LLM-coupled, non-deterministic part. |
| `stance-judge-prompt.md`   | the **rubric** — the stance contract the judge applies.                                                                                                                                                                                      |
| `test-stance-guardrail.sh` | **prove-it-bites** — hermetic (fixture repo + crafted transcripts + deterministic fixture judge), plus an optional live-`claude` smoke. Set `STANCE_WORKER_DIR=<host>/.claude/hooks/stance-guardrail` to prove the **deployed** artifact.    |

> Retired: `stance-guard-toggle.sh` (the `jq` + `settings.local.json` hand-edit), when
> installation moved to forge; then the runtime opt-in flag and the agent allowlist, when
> enrollment moved into each persona's own scope. Nothing is toggled by hand any more —
> projecting a persona enrolls it.

## Usage

```sh
pnpm canon:deploy:hooks               # project + ship the workers (forge)
pnpm stance-guard:test                # prove it bites (set STANCE_WORKER_DIR for the deployed artifact)
cratylus deploy --harness omp --check # who is enrolled: one stance/manifest.json per persona scope
```

Tuning env vars (all optional): `STANCE_JUDGE_CMD` (swap the whole backend), `STANCE_JUDGE_BIN`,
`STANCE_JUDGE_MODEL`, `STANCE_RUBRIC`, `STANCE_WORKER_DIR`.
