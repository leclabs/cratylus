---
'@cratylus/forge': patch
---

The omp stance gate reads its verdict where the worker writes it, and fails open again

The gate did not merely miss collapses on omp — it **refused every `ask` and every `task` call
without judging one**, with an empty reason. `ExecResult` is `{stdout, stderr, code, killed}`;
the emitted module read `r.exitCode`, which is not a member. `undefined === 127` is false and
`undefined !== 0` is TRUE, so both guards inverted and every blocking registration returned
`{block: true, reason: ""}` whatever the worker decided. Measured against the installed binary:
`pi.exec("sh", ["-c", "exit 3"])` answers `{"stdout":"","stderr":"","code":3,"killed":false}`.

The `127` line existed to prevent exactly this — its own comment names "a governance mechanism
bricking the session it was supposed to govern" — and it was reading the same absent field, so
the guard against the catastrophe _was_ the catastrophe. A persona whose `ask` and `task` are
both bricked is unusable, which is how the deployed modules came to be deleted by hand from
`.agents/<name>/extensions/`, leaving the whole gate dark on the harness.

Four defects, one seam:

- **the verdict is on STDOUT.** The workers speak the Claude hook contract — JSON on stdout and
  `exit 0` on every path, allow and deny alike. A nonzero `code` is a malfunction, never a
  refusal (`fail-open ∀error`), and the two verdict shapes (`permissionDecision: "deny"`,
  `decision: "block"`) are what a refusal looks like. Anything unparseable is silence.
- **every worker-reading registration gets an envelope.** `OMP_PAYLOAD_EVENTS` held `agent_end`
  alone, on the argument that a `tool_result` "stays a bare fire rather than being handed a turn
  that is not one". A bare fire hands the worker an EMPTY stdin — the exact failure the previous
  changeset was written to fix. Measured: a registration with no envelope runs the worker with
  `read_bytes=0`, so the `ask`, `task` and subagent legs judged nothing while reading as coverage.
- **the envelope names the tool the WORKER matches on.** `tool_name: "ask"` reaches the worker's
  `case` and falls through to its `*)` allow branch, so the pre-guard permitted every call it was
  installed to judge. omp's `task` arguments are `{context, tasks[]}` and the worker reads
  `.prompt`, so a dispatch also arrived with nothing judgeable — a pass indistinguishable from a
  considered verdict. Both are translated, because the worker's wire format is the contract and
  the shim is what writes it here.
- **a finished dispatch IS a turn.** `subagent.end` lands on `tool_result`, whose event carries
  no message list. The prompt that launched the delegate plus the text it returned is exactly the
  pair the rubric judges.

Verified against the live binary, driving the deployed module's own registered handlers: an
in-remit `ask` menu and a dispatch-echo `task` both come back `{block: true, reason: "STANCE
GUARDRAIL (pre) — denied …"}` with the judge receiving the assembled menu and the normalized
dispatch; a subagent result arrives as a `sendUserMessage` continuation. Fail-open holds on all
three paths that previously refused: judge PASS, guard opted out, and worker absent each return
no block, where the old form returned `{"block":true,"reason":""}`.
