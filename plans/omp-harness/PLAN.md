# omp-harness

> Cratylus targets Oh My Pi. Three of its built-ins replace things this corpus built by hand.

## Why omp, and why now

**It is not just a third harness.** Three of its native features are things `cratylus` either
built bespoke or has open plans for, and adopting them deletes code rather than adding it:

| omp built-in                                                 | what it replaces here                      | evidence (measured on `omp/17.2.9`)                                                                                                                                               |
| ------------------------------------------------------------ | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `memory.backend = off\|local\|hindsight\|mnemopi`            | the bespoke memory strategy                | **`hindsight` is a first-class backend** — the exact system the W4 research evaluated and rejected only because wiring it ourselves cost more than it returned                    |
| `providers.memoryModel = online\|qwen3-1.7b\|llama3.2:3b\|…` | "a separate LLM binding for consolidation" | W4's research named this as the thing to harvest from hindsight/Letta; omp ships it, including local models                                                                       |
| `/collab` + `omp join <link>`                                | `provisional-mailbox`                      | a relay channel (`collab.relayUrl = wss://my.omp.sh`) whose link carries a key in its fragment — peer main-agent collaboration, which is `provisional-mailbox`'s stated intention |

**Multi-vendor inference is the second reason.** omp fronts Anthropic, OpenAI, Gemini,
Copilot, Azure, Groq and more, with per-role model selection (`--model`, `--smol`, `--slow`,
`--plan`). A corpus whose thesis is that anchors hold _across a declared model population_
gets a cheap population to test against.

## What omp already gives us, and what it does not

**Does:** `~/.omp/agent/agents` and `./.omp/agents` (agent dirs, the deploy target);
`omp agents unpack`; skills discovery with `--skills` / `--no-skills`; `-e/--extension` and
`--hook` loading; `omp plugin install|link`; `--profile` + `--alias` (an isolated profile
with a generated shell shortcut); `--append-system-prompt`; and **`--from-claude`**, which
imports a Claude Code session.

**Does not:** launch AS a declared agent. `omp agents` manages _bundled task agents_ — the
subagent sense, like Claude's — and there is no `--agent` flag. That gap is the extension.

## Shards

| state         | task                         | concern                                                                               |
| ------------- | ---------------------------- | ------------------------------------------------------------------------------------- |
| **completed** | `t-omp-persona-bootstrap`    | hand-adapt projected artifacts + an alias; prove the harness carries a persona at all |
| **ready**     | `t-omp-agent-extension`      | launch AS a declared agent — the `claude --agent` equivalent                          |
| pending       | `t-cross-harness-continuity` | wake and handoff work across claude ↔ omp; `--from-claude` is the seam                |
| pending       | `t-adopt-omp-memory`         | omp's memory backend replaces the bespoke strategy                                    |
| pending       | `t-adopt-collab`             | `/collab` replaces `provisional-mailbox`                                              |
| pending       | `t-omp-deploy-installs-ext`  | `cratylus deploy --harness omp` installs the extension                                |

## The ordering, and why the bootstrap changed it

The bootstrap came first and was deliberately **manual and throwaway**. It answered one question
cheaply — _does an omp session carrying a cratylus persona behave like the agent?_ — before any
adapter was written. **The answer is yes**; [`DELTA.md`](./DELTA.md) carries the evidence and the
adapter's specification.

**The bootstrap falsified this section's own ordering claim.** It said the three adoptions were
_independent of each other_. They are not. `MODEL.md` makes a fragment `bound` only when its events
are **scopable to a named agent**, and no omp surface names an agent — every persona vector it has
is keyed to a launch, a directory, or a profile. So on omp today **every enforcing fragment
degrades to `steer`**, not because the events cannot fire (nearly all of them can, and
`tool_call` can even block) but because there is no identity to scope them to.

`t-omp-agent-extension` is therefore not one adoption among three. It **gates every `bound`
mechanism on this harness**, and it is promoted to `ready` ahead of continuity for that reason.

Continuity still precedes the remaining adoptions, because it is the **acceptance criterion for
the whole integration**: an agent that cannot wake in omp as the individual it was in Claude Code
is not the same being, and that is the one property this corpus exists to hold. It also inherits a
correction from the bootstrap — a corpus this well-signified **masks** the persona's contribution,
so any test of "did the persona carry?" must run where the corpus is not on disk.

`t-omp-deploy-installs-ext` is last because it ships what the extension shard builds.

## The standing risk

**Adopting a harness built-in trades control for reach.** `memory.backend` is omp's shape,
not `MemoryStrategy`'s, and `/collab` is a relay this corpus does not run
(`wss://my.omp.sh`). ARCHITECTURE's fidelity ladder already names the right posture —
**proxy** where the harness has the facility, **provide** where it does not, **declare**
where neither — so each adoption shard owes an explicit answer to _what happens on a harness
that lacks this_, and the answer may not be "then it does not work".
