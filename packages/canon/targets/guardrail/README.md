# stance guardrail — the harness half of the principal stance

A standing **Stop hook** that **structurally refuses** a turn in which an agent collapses
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

- **Source** — the forge `Hook` in `packages/canon/src/hook-cells.ts` (`turn.end` → Stop; command = `$HOME/.claude/hooks/stance-guardrail/stance-guardrail.sh`;
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
  anybody. Each harness carries the scope in the form it offers, and the worker takes the first
  it finds:
  - **omp** places a dispatcher inside the persona's own scope, so it passes `stance_scope` in the
    envelope. A bare launch carries the dispatcher and no manifest, so it is silent by placement
    rather than by a branch.
  - **Claude Code** places no dispatcher, and its hook payload names the running agent as
    `agent_type` (on the main thread of a `--agent` session; a bare session
    names none). With no `stance_scope`, the worker reads `<harness home>/personas/<agent_type>` as
    the scope, where the harness home is the directory above the hooks root it was deployed into.
    A bare session, a built-in agent and a host's own agent have no manifest there and stay silent.
    An `agent_type` that is not a single directory name is refused, never joined into a path.

  The stance manifest is staged once for both harnesses by forge's `core/enrollment.ts`, and the
  persona root is read back from the adapter's own `scopedRel`, so no worker carries an agent list
  or spells the manifest's path. **Scope is fixed by composition**: a manifest lists exactly the
  guards its composed agent includes (a cell declares `binds`, the composition that binds an
  agent to it), and a cell that binds nothing, such as the drift notice, is never listed. A
  harness that cannot name the running agent carries a guard as a steer and warns once per cell
  at projection and install.

- **WHERE A GUARD BINDS.** A composing persona's own main session, and no subagent it dispatches: a
  subagent is bounded by what it was handed, judged by its assay and the whole check, and supervised
  by the main session. Claude Code fires settings hooks and a subagent's own front-matter hooks
  inside a subagent, and the payload there carries `agent_id`, present only inside a subagent. Each
  of the three workers exits 0 on such a payload before it asks its judge and prints nothing: a guard
  that does not bind there is not dark. The Stop guard binds `turn.end` alone.

- **WHAT THE STOP WORKER JUDGES.** The main session's `transcript_path`. A
  Claude Code Stop fires before the final assistant message reaches the transcript, so that
  message is taken from the payload's `last_assistant_message`. A turn that is only text is
  judged, and a tool turn is judged on its close.

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
- **A REFUSAL HOLDS, EXCEPT AT THE TURN END, AND THERE ONLY FOR ONE STOP.** Every turn is judged,
  a turn identical to a refused one included, and a BLOCK blocks the stop. The turn end is the one
  exception to a refused act staying refused: refusing it holds back no effect, it only makes the
  agent redo its turn. A stop that follows a block of this guard (`stop_hook_active`) continues a
  run of blocks; a stop that follows none starts a new run at 0. When the judge's BLOCK survives
  the evidence checks and the run already holds a block and this turn is byte-identical to the one
  last blocked in it, or the run already holds 3 blocks, the stop is let through and the guard
  says so: `STANCE GUARDRAIL` names the stop as let through UNRESOLVED, the finding standing, with
  the judge's reason. A run that cannot be counted (its record unreadable or the state dir
  unwritable) lets a following stop through the same way, because a bound that cannot be counted
  cannot hold; a fresh stop there still blocks. The 3 is a constant in the cell, and no
  environment variable sets it. The bound is on one stop, never on the session: the next stop that
  follows no block is judged and blocked like any other.
- **A JUDGE IS SENT ONLY WHAT ITS ONE DECISION NEEDS.** The rubric is the stance test in a few
  sentences over the contract it applies to (the `handoff` value, quoted from its cell) and the
  output block, at most 2 KB. The Stop payload is facts under plain labels and no sentence
  telling the judge what to conclude: the loop position in force with the utterance that set it,
  the operator's latest instruction, the agent's turn, and the Layer-1 span when there is one.
  `stance-judge.sh` adds nothing around it.
- **A JUDGEMENT FITS THE TIME ITS HARNESS ALLOWS A GUARD.** omp kills an extension handler at
  30 s and a Claude Code cell runs 60 s, and the judge's time follows what it is sent. What each
  worker sends is bounded by one cap, 12000 bytes, declared once in the stance cell: the Stop
  worker keeps the close of the turn (the text after the last tool call, which every rule that
  can fire reads) and the tail of the operator message, and the pre and purview workers keep
  both ends of a menu or a dispatch prompt. Every cut is marked `[ELIDED: …]` in the payload,
  cuts fall on character boundaries, and a BLOCK's EVIDENCE is checked against what the judge was
  sent, so a span in elided text is discarded like any span that is not there. No deadline or
  cell timeout was raised to make it fit.

## Components

| file                       | role                                                                                                                                                                                                                                                                                                  |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stance-guardrail.sh`      | the Stop **worker**: gates (scope-enrollment · loop · fail-open), extracts the last assistant turn from the transcript, calls the judge, emits `{"decision":"block","reason":…}` on collapse.                                                                                                         |
| `stance-judge.sh`          | the default **judge backend** (contract: payload on stdin, rubric path argv[1] → `VERDICT: PASS\|BLOCK [+REASON]`). Sends the rubric and the payload to headless `claude -p --model haiku` and nothing around them. Swappable via `$STANCE_JUDGE_CMD` — the only LLM-coupled, non-deterministic part. |
| `stance-judge-prompt.md`   | the **rubric** — the stance contract the judge applies.                                                                                                                                                                                                                                               |
| `test-stance-guardrail.sh` | **prove-it-bites** — hermetic (fixture repo + crafted transcripts + deterministic fixture judge), plus an optional live-`claude` smoke. Set `STANCE_WORKER_DIR=<host>/.claude/hooks/stance-guardrail` to prove the **deployed** artifact.                                                             |

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
