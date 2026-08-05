# stance guardrail — the harness half of principal-stance (P4)

A standing **Stop / SubagentStop hook** that **structurally refuses** a turn in which an agent collapses
out of the **intent-driven-expert (fiduciary-agent) stance** — the harness enforcement that makes the
stance _invariant_, not merely prompted.

## Why it exists

Encoding the principal stance as **identity** (Nico's half — the principal-ic stance reworked into a constitutive
`you-ARE` statement, `c8c451c`) raises the threshold but is **not truly invariant**: enough operator
pushback erodes any prompt-level stance, because RLHF corrigibility reads a correction as _"defer more."_
True invariance needs the **harness** to refuse the collapsed turn. This is that refusal. (The embryo was
this session's ad-hoc Stop-hook, which twice caught a principal-ic-intrinsic agent collapsing into deference and blocked the
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

## How it's installed (AGENT-FORGE-NATIVE — T6.3)

The hook is **sourced, projected, and deployed by forge** — no hand-rolled `jq` toggle:

- **Source** — the forge `Hook` in `packages/canon/src/toolkit/hooks.ts` (`turn.end` → Stop,
  `subagent.end` → SubagentStop; command = `$HOME/.claude/hooks/stance-guardrail/stance-guardrail.sh`;
  timeout 60).
- **Project** — `pnpm canon:project` emits a `settings.json` `{hooks}` fragment + stages these workers
  under `.render-ts/hooks/stance-guardrail/`.
- **Deploy** — `pnpm canon:deploy:hooks` (`cratylus deploy --kind hooks`) ships the workers to
  `~/.claude/hooks/stance-guardrail/` and **merges** the hooks block into the host `settings.json`
  (idempotent, non-destructive — never clobbers permissions/env/other hooks).

## Safety model (off-by-default-safe, like the continuity hook)

- **OFF BY DEFAULT — a RUNTIME gate.** Registration in `settings.json` is **inert**: the worker re-checks
  the per-repo opt-in `git config --bool agentfactory.stanceGuard true` (lives in `.git/config`, never checked in;
  a fresh clone is opted out) at fire time and exits 0 unless the repo opted in. Deploying the hook to a
  host changes **no host's behavior** until that host's repo opts in.
- **AGENT-SCOPED.** Fires only for agents on the allowlist (`git config agentfactory.stanceGuardAgents`, default
  `nico mav` — the principal-ic-intrinsic agents). Set `*` for all.
- **FAILS OPEN.** Any error (no transcript, judge failure, no `jq`, no `claude`) → allow the stop. A
  guardrail that wedges work on its own flakiness is worse than a missed block.
- **LOOP-SAFE.** Honors `stop_hook_active` so a block can never re-wedge a turn.

## Components

| file                       | role                                                                                                                                                                                                                                         |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stance-guardrail.sh`      | the Stop/SubagentStop **worker**: gates (opt-in · agent-scope · loop · fail-open), extracts the last assistant turn from the transcript, calls the judge, emits `{"decision":"block","reason":…}` on collapse.                               |
| `stance-judge.sh`          | the default **judge backend** (contract: turn on stdin, rubric path argv[1] → `VERDICT: PASS\|BLOCK [+REASON]`). Calls headless `claude -p --model haiku`. Swappable via `$STANCE_JUDGE_CMD` — the only LLM-coupled, non-deterministic part. |
| `stance-judge-prompt.md`   | the **rubric** — the stance contract the judge applies.                                                                                                                                                                                      |
| `test-stance-guardrail.sh` | **prove-it-bites** — hermetic (fixture repo + crafted transcripts + deterministic fixture judge), plus an optional live-`claude` smoke. Set `STANCE_WORKER_DIR=<host>/.claude/hooks/stance-guardrail` to prove the **deployed** artifact.    |

> Retired in T6.3: `stance-guard-toggle.sh` (the `jq` + `settings.local.json` hand-edit). Registration is
> now forge's; only the runtime opt-in flag remains, toggled by plain `git config`.

## Usage

```sh
pnpm canon:deploy:hooks               # project + ship the workers + merge into settings.json (forge)
pnpm stance-guard:on                 # opt THIS repo in (git config agentfactory.stanceGuard true)
pnpm stance-guard:off                # opt out (worker goes dormant)
pnpm stance-guard:status             # show the flag
pnpm stance-guard:test               # prove it bites (set STANCE_WORKER_DIR for the deployed artifact)
git config agentfactory.stanceGuardAgents '*'   # widen the agent allowlist (default: nico mav)
```

Tuning env vars (all optional): `STANCE_JUDGE_CMD` (swap the whole backend), `STANCE_JUDGE_BIN`,
`STANCE_JUDGE_MODEL` (default `haiku`), `STANCE_RUBRIC`, `STANCE_GUARD_AGENTS`, `STANCE_WORKER_DIR`.
