---
kind: skill
delineation: Create and work durable, sharded plans (sharded-plan-layout dirs) — reached by planning intent, not a command grammar; task state is the folder a task-file sits in (pending/ready/active/completed), PLAN.md mirrors it, and `list` is the one explicit affordance.
trigger: /praxis
---

# /praxis — durable sharded plans

A skill for creating and working **durable, sharded plans** on disk. An agent reaches it by planning intent — "start a plan for X", "pick the auth plan back up", "fold these plans together" — not by memorizing a command set. Each plan is a [[sharded-plan-layout]] directory; the agent resumes from it and works it as it normally would.

praxis ≜ invokes [[sharded-plan-layout]]

## What it helps with

Surfaced by intent, not commands — state what you want and the skill does the matching plan-operation:

- **start a plan** — scaffold a fresh [[sharded-plan-layout]] dir from the stated intent.
- **resume a plan** — re-attach to an existing plan and draw from the ready frontier.
- **advance a task** — the `mv` of [[sharded-plan-layout]]; on completion promote the now-unblocked dependents and re-mirror PLAN.md.
- **merge plans** — fold several in-scope plans into one.

The one explicit affordance is **`/praxis list`** — enumerate the sharded plans in scope so you (or the agent) can see what exists and pick one up. Everything else is best reached by stating the intent.

## Which commit last touched a plan — ask git, never store it

Don't keep a commit hash in the plan: a file cannot contain its own commit's hash, so a stored marker is stale the instant it's written. The association is a **query over git**, the real history:

- last commit that updated a plan — `git log -1 --format='%H %cI' -- {plansDirectory}/{plan}/`
- last commit that touched one task — same, scoped to the task file, with `--follow` so it tracks the file across its ready→active→completed moves.

git history is the runtime truth; the plan's commit association is _derived on demand_, never a mirror that can drift ([[doc-mirrors-runtime-truth]]). If a fast local lookup is ever wanted, cache it **out of the versioned tree** (a gitignored sidecar written by a post-commit hook) — a regenerable cache, never committed, never authoritative. To mark a deliberate milestone (not just "last touched"), tag or `git notes` the commit _after_ it exists — which sidesteps the chicken-and-egg entirely.

## Harness: claude-code

claude-code assigns each plan session a generated name; `list` can show it beside the sharded-plan dir so a later session re-attaches to the same durable plan. Use the built-in `/plan` mode for in-session planning; PLAN.md is the durable mirror that outlives the session.

## See also

- [[sharded-plan-layout]] — the directory structure praxis manages.
- [[shard-by-orthogonal-concern]] — why a plan decomposes into independent units.
