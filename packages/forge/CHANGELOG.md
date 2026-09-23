# @cratylus/forge

## 0.5.0

### Minor Changes

- b0bc847: An agent declares the skills it operates through

  `autoloadSkills` was a reader with nothing to read. OMP honours the field natively for a spawned
  subagent, and the generic `omp-agent` launcher already rendered it as required reading for a main
  session — the consuming half existed on **both** paths. The producing half did not, because the
  corpus had nowhere to declare it. The branch was live code with zero live inputs: every deployed
  definition carried exactly `name` and `description`.

  `Agent.skills` is an optional list of skill NAMES, modelled on the existing optional `preamble`.

  It is deliberately **not a dimension**, for two independent reasons. Structurally, a dimension's
  value is a branded σ\* fragment `agentBody` emits into the Target, while a skill name is an
  address a host resolves — declaring it as a dimension would mint one empty fragment per skill.
  Conceptually, a dimension is a persona trait, and which skills an agent loads is apparatus; the
  catalog would misrepresent it and hand every agent one more required `null` to spell.

  The omp adapter emits it as a third front-matter key, each name through the same `yamlString` the
  description uses. Absent or empty emits nothing, leaving the two-key document unchanged. The
  claude and codex adapters are untouched: neither harness has a field that loads a skill from an
  agent definition, and emitting a key a harness ignores is noise.

  This closes the gap that made every skill binding advisory. A main-session persona now carries
  its required skills in the system prompt on every turn rather than waiting for a description to
  match, and a spawned subagent gets them injected before its first prompt.

- a1944fc: An omp agent is ONE definition omp itself discovers, read back by ONE launcher

  `cratylus project --harness omp` projected each persona to `~/.agents/<name>/APPEND_SYSTEM.md` — a
  file omp reads only when a flag names it — plus a per-agent `omp-launch` script to name it. Two
  consequences, both silent:

  - **The composed agent could be launched and could not be DISPATCHED.** omp discovers user-level
    task agents from `~/.omp/agent/agents/*.md` and nowhere else, so a persona carried as a launch
    ARGUMENT was invisible to `task`. The same name meant an agent in one direction and nothing in
    the other.
  - **N agents shipped N byte-identical launchers.** Every `omp-launch` differed only in the
    directory it happened to sit in, so each one was a copy the deploy had to keep converging, and
    each new agent added another.

  Both close on the same artifact. The definition is now `~/.omp/agent/agents/<name>.md`: YAML
  front-matter carrying the `name` and `description` omp requires, and a body that IS the system
  prompt. Dispatched as a subagent, omp parses it natively. Launched as a MAIN session — for which
  omp has no `--agent` flag at all — the generic `~/.omp/agent/omp-agent` reads the same bytes.

  The launcher resolves the agent at RUN time, from `$1` or, when reached through a symlink named
  after the agent, from argv[0] itself (busybox-style, and it does not consume `$1`, so
  `mav --model x` passes the flag through). It splits the front-matter off, prepends the identity
  assertion omp's own base prompt would otherwise win, renders any `autoloadSkills` as required
  reading — omp honours that field ONLY for a spawned subagent, so without this one definition would
  mean two different things depending on how it was reached — and hands the result to
  `--append-system-prompt` as an argument. A definition that is not there is a named refusal and a
  nonzero exit, never a fall-through to a bare `omp` wearing the persona's name.

  **The description is now a quoted YAML scalar.** A plain one may not contain `: `, and `nico`'s
  description does ("its conceptual architecture and canon: dimension catalogs") — unquoted, the
  document is a scanner error omp survives only by falling back to a naive `key: value` line parser,
  warning once per discovery pass and invisible until a description grows something the fallback
  loses too.

  **Per-persona scopes moved in with the harness**, from `~/.agents/<name>/` to
  `~/.omp/agent/personas/<name>/`. What was left out there once the persona file moved was an
  `omp.yml` and a TypeScript module omp alone loads — harness-specific bytes in a harness-NEUTRAL
  root, and a directory the one launcher could only reach by hard-coding the harness home's own depth
  into shell. The scoping guarantee is unchanged and is still the whole point: nothing scans
  `personas/`, so a mechanism module there loads under that persona's own `--config` overlay and
  under no other, and a bare `omp` reads only the session root's own `extensions/`.

  Skills are untouched: still one copy at `~/.agents/skills/<name>`, which omp reads natively on
  every launch.

### Patch Changes

- 317ba47: The omp stance judge has a deadline of its own, and an absent one is asked once

  An unreachable judge does not fail — it **hangs**. `askJudge` awaited `completeSimple` with no
  bound, and omp kills an extension handler at 30 s, so a judge that had stopped answering cost
  every turn end the full budget and then surfaced as `Extension error: handler timed out` — which
  reads as the guard being broken rather than the judge being away.

  Found by a plain status check rather than by a test: launching a persona through `omp-launch`
  printed the extension error, and isolating it showed the worker returning in **30 ms** while a
  **one-word** prompt to the configured `advisor` role did not return in 20 s. The endpoint was
  down; the code had no way to say so.

  Two bounds, both on the fail-open path a judge that cannot answer belongs on:

  - **`JUDGE_TIMEOUT_MS = 12_000`** — a deadline well inside omp's 30 s handler kill. A healthy
    local judge answers this rubric in about two seconds, so the margin is wide enough that a
    slow answer is still heard, and a dead one no longer reaches the host's killer.
  - **`judgeAway`** — tripped when the deadline fires and read on every later turn. An endpoint
    that is away stays away; re-proving it on each turn end buys nothing and taxes the whole
    session. One timeout, not one per turn.

  Verified against a live down endpoint: the same launch that printed
  `handler timed out after 30000ms` now completes with no extension error and no refusal, the
  guard having correctly declined to judge what it could not reach.

- 848288e: The omp stance gate reads its verdict where the worker writes it, and fails open again

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

- 4e6e7aa: The omp shim hands the stance worker its payload, so `agent_end` judges the turn

  The stance guardrail has never judged an omp turn. It is deployed, opted in
  (`agentfactory.stanceGuard=true`), scoped to `mav` and `nico`, and registered on `agent_end` —
  and it was firing `sh stance-guardrail.sh` with no stdin. The workers are written to the Claude
  hook contract: a JSON envelope on stdin naming a JSONL transcript. `input="$(cat)"` read empty,
  the worker exited at its first guard, and every turn of every omp session reported nothing.
  A gate that is installed, enabled, and judging NOTHING is indistinguishable from a gate that
  finds no fault, which is how the agents' declared laws went unenforced without anyone noticing.

  `ExecOptions` is signal · timeout · cwd — there is no stdin — so the shim materializes the
  envelope itself: a temp dir per fire, the turn written as the transcript lines the worker's
  `jq` already parses, and the envelope arriving by redirect. Only the SHAPE is translated;
  the extraction semantics (whole turn since the last real user message, tool activity marked,
  text-only projection for the evidence check) stay in their one home inside the worker.

  The identity in the envelope is read from PLACEMENT — the module's own grandparent directory
  names the scope — so a persona copy reports that persona and the session root reports a name
  that matches no allowlist. No runtime identity check was added.

  omp takes no result from `agent_end`, so a verdict reaches the session by queueing a
  continuation, which is the same shape as refusing the stop. Delivery is bounded to a CHANGED
  verdict: `dark` says the judge is unreachable and keeps saying it, and re-opening the turn
  forever on an informational fact is a livelock. A block's reason carries a per-session count
  and the worker's no-progress detector turns a genuine repeat into a different notice, so a real
  block is never suppressed.

  Verified end to end on a live `mav` session: the judge received a correctly assembled
  `=== OPERATOR === / === AGENT ===` payload, a stub BLOCK produced
  `{"decision":"block",…}` through the evidence check, and an interactive session took the
  continuation (two `agent_end` fires). With the real judge the worker now reports
  `STANCE GUARDRAIL — DARK: the judge did not answer` instead of silence.

- e2b2263: A harness-invariant hook asset deploys once, to the vendor-neutral `.agents` root

  The stance rubric is one 27 kB file every projection scores against, byte-for-byte identical
  across claude, codex and omp — and it was being copied into `<harness>/hooks/stance-guardrail/`
  three times. The duplication was the smaller half of the cost. The larger half is that the text
  had **no address any other realization could name**: an advisor roster entry wanting the same
  rubric would have had to `@`-import it out of a sibling harness's tree, which is exactly the
  cross-harness reach `harness-independence` forbids. A shared asset has one address, and the
  neutral root is the one place every harness may read without reaching into another.

  `HookWorker.shared` declares it, `SHARED_STAGE_DIR` stages it, and deploy places it at
  `../.agents/<id>/` — the same relative-escape shape the scoped mechanism modules already use,
  so the manifest keeps it attributable and prune retires it with its hook. The workers resolve
  it by DERIVATION (`.agents` is the sibling of every harness home, three `dirname`s up), never
  by a baked `$HOME`, so a sandboxed `--home` deploy resolves correctly — the same discipline
  that repaired the `$HOME/.claude` leak, applied before it could become one.

  **The criterion is `byte-identical ∧ ¬executable`, and the gate is what corrected it.** The
  first cut said byte-identical alone, and it immediately caught two assets that must NOT move:
  the worker scripts are byte-identical too, and are positionally coupled to the harness in two
  ways their bytes cannot show — each harness's registration addresses its own copy by path, and
  each worker resolves `stance-judge.sh` as a sibling. That judge is genuinely harness-specific
  (it names the harness's own CLI through `{{fact:harness-judge-bin}}`), so a single shared
  worker could not know whose judge to run without the registration passing it in. That trade
  relocates harness-specificity into a shared file's arguments and buys only the deduplication of
  two scripts that belong beside the registration invoking them. An entry point a harness invokes
  is executable; a rubric is not.

  The gate holds both directions and is non-vacuous in both arms: the corpus must contain a shared
  data asset and a harness-specific one, or the rule is green over nothing.

  Verified on a sandboxed two-harness deploy — one rubric on disk, claude and omp both resolving
  `<home>/.agents/stance-guardrail/stance-judge-prompt.md`, including from the pre-guard — and
  live on omp, where the guard blocked twice reading the shared rubric with a tripwire `claude`
  first on `PATH` never invoked.

- 0cca8bc: A persona's overlay sets `personality: none` — the cell is the only voice

  omp's default prompt renders a personality block chosen by the `personality` setting
  (`default`, `friendly`, `pragmatic`, `none`). A composed persona already states its register
  completely: `formality` carries the prose contract, `audience-adaptation` sets density against
  the interlocutor, and `transparency` and `handoff` fix what a reply discloses and how it ends. A
  preset rendered beside those is a second, uncoordinated statement of the same thing — two homes
  for one concept, in the same prompt.

  `none` rather than a better-fitting preset, because **omp runs every subagent with `none`
  regardless**. Left at a preset, one definition means two different voices depending on whether it
  was launched as a main session or dispatched as a subagent — the exact defect that the single
  agent definition closes for identity and that the launcher's `autoloadSkills` rendering closes
  for required reading. Closing it on the register axis too is what makes a persona sound the same
  from either direction.

  The setting lands in the generated `--config` overlay and not in the agent cell, because it is
  genuinely a session setting rather than a dimension of the persona. Conflating the two is the
  category error this change exists to correct.

- 415a112: omp judges in-process; no harness depends on another harness's CLI

  `claude -p` was never an acceptable judge for omp, and it was not acceptable for codex
  either. The backend hardcoded `judge_bin="${STANCE_JUDGE_BIN:-claude}"`, so every harness's
  stance guard required a third vendor's CLI installed, on PATH, and separately
  authenticated. When that OAuth lapsed on the author's host, every verdict on every harness
  failed open in silence — deployed, opted in, correctly scoped, judging nothing.

  **The judge seam is now explicit, and the procedure still has one home.** A host that holds a
  model runs the worker twice around a judgment it makes itself: once with `STANCE_EMIT_PAYLOAD`
  to collect the gated, layer-1-annotated payload and the rubric that scores it, then again with
  `STANCE_VERDICT_FILE` naming its answer. Everything either pass touches before the seam is
  read-only, so the counters, the hash and the verdict log see exactly one pass. The gating,
  extraction, deterministic pre-filter, evidence verification and block accounting stay in the
  worker; only the model call moves.

  **omp's shim takes that seam.** The emitted extension module resolves `modelRoles.advisor`
  (then `smol`, then `tiny`, then the live session model) through `ctx.modelRegistry`, gets auth
  from omp's own registry, and calls `completeSimple` — static-imported from `@oh-my-pi/pi-ai`,
  which omp's loader aliases to its own bundled build. Measured against `omp` v18.1.19: the real
  26.8 kB rubric judged in 1991 ms on a local model, and a live `mav` session blocked, re-opened
  the turn, and settled with a tripwire `claude` first on `PATH` never once invoked.

  The richer `judgment` module (`TextJudge`, `chatTextBackend`, `NoulQuestion`) exists in omp's
  source but is **not** in the bundled compat entrypoint the shipped binary carries; importing it
  silently kills the module load. `completeSimple` is what the binary exposes and what a judge
  needs.

  **The judge binary is now a projection fact, not a literal.** `harness-judge-bin` joins the
  closed `ProjectionFact` set; each adapter answers with its own name — claude `claude`, codex
  `codex`, omp the **empty string**, because it judges in-process and names no subprocess at all.
  An empty value is a real answer and the backend reads it as one, failing open rather than
  falling back to somebody else's CLI.

  **A gate holds the law.** `canon/harness-independence.test.ts` fails if any committed worker
  names another harness's home in executable shell, or if a cell template names a vendor CLI
  where a projection fact belongs. Both legs were convicted before admission: a
  `$HOME/.claude/...` line injected into a committed worker and a `:-claude}` default restored to
  the cell each produced exactly one finding, and removing them returned the gate to green.
  Comments are exempt — a rule that forbids naming `claude` in a sentence would delete the record
  of the repair along with the bug.

- 693a056: `turn.end` binds omp's `session_stop`, so the turn-end bound is a bound again

  `agent_end` is documented _"notification-only"_ and takes no result. A turn-end cell mapped there
  cannot REFUSE — the best the shim could do was queue a `sendUserMessage` continuation, which is a
  steer wearing a bound's name. `MODEL.md` calls that a degradation; nothing reported one, because
  the adapter believed the event was realizable.

  omp has the real thing and the adapter was not using it. `session_stop` is _"awaited before
  settle"_, and its result type is `{decision?: "block"; reason?: string}` whose own doc-comment
  reads **"Claude/Codex-compatible block decision"**. The event carries `messages`,
  `last_assistant_message`, `session_id`, and — decisively — **`stop_hook_active`**, the re-entry
  flag the workers read and which `agent_end` has no field for, so the guard's own loop-safety was
  dead on this harness.

  Measured against the installed binary: a handler returning `{decision: "block", reason}` re-opened
  the turn and fired again with `stop_hook_active=true`, exactly as the claude `Stop` contract does.
  Then end to end with the deployed worker and the real rubric on a `mav` overlay — the first
  `session_stop` blocked, omp re-opened the turn, the agent re-assumed the stance, and the second
  fire settled.

  Also here:

  - **Two refusal shapes, one table.** A tool wrapper reads `{block, reason}`; the stop pass reads
    `{decision: "block", reason}`. Emitting either at the other site is silently ignored — a gate
    that returns and refuses nothing. `OMP_REFUSAL_SHAPE` maps each blocking event to its spelling
    and replaces `OMP_BLOCKING_EVENTS`, whose keys were the same list in a second place.
  - **`subagent.end` keeps the continuation channel**, because `session_stop` never fires for
    subagents (`agent-session.ts`: `if (this.#agentKind === "sub" || …) return false`) and
    `tool_result` takes no verdict.
  - **The emitted module imports `ExtensionAPI`, not `HookAPI`.** omp's `docs/hooks.md` states the
    package root does not re-export `HookAPI`. Type-only, so the wrong name was erased before it
    could throw; it would have failed the first person to typecheck an emitted module.

- Updated dependencies [b0bc847]
- Updated dependencies [e2b2263]
- Updated dependencies [415a112]
  - @cratylus/schema@0.2.0

## 0.4.1

### Patch Changes

- 805d19b: omp launcher resolves its own path through symlinks

  `omp-launch` computed `dirname "$0"` and passed `--config <that dir>/omp.yml`.
  Linked into a `PATH` dir - the one way an operator runs a persona by name - `$0`
  is the link, and omp refused to start: `Config overlay not found:
~/.local/bin/omp.yml`. The script now walks `readlink` to the real file before
  resolving its directory, with hops capped so a link cycle fails instead of
  hanging.

## 0.4.0

### Minor Changes

- fee5ade: the omp persona is a launch spec under `~/.agents/`, not a profile

  **The profile carrier is withdrawn.** Projecting a persona into `~/.omp/profiles/<n>/agent/`
  carried identity in an ENVIRONMENT: an omp profile silos auth, MCP, model prefs, sessions and
  config, inheriting nothing from the default profile but keybindings. Measured — ten
  deploy-created profiles on one host held zero credential rows each and could not see that
  host's own MCP servers, and on another the persona's `mcp.json` was a byte-duplicate of a
  17-server org config, copied by hand because profile scope silos it.

  Identity is now the LAUNCH SPEC and environment stays the profile:

  | artifact         | destination                                     |
  | ---------------- | ----------------------------------------------- |
  | skills           | `~/.agents/skills/<skill>` (read natively)      |
  | face             | `~/.agents/<agent>/APPEND_SYSTEM.md`            |
  | overlay          | `~/.agents/<agent>/omp.yml`                     |
  | mechanism module | `~/.agents/<agent>/extensions/<bin>-session.ts` |
  | session module   | `~/.omp/agent/extensions/<bin>-session.ts`      |
  | launcher         | `~/.agents/<agent>/omp-launch` (0755)           |

  `~/.agents/` is not cratylus's invention: omp reads it through a vendor-neutral `.agent[s]`
  provider, and Cursor reads `~/.agents/skills/` too. So skills land ONCE instead of being fanned
  into every profile scope, and `omp --profile work` goes back to meaning what it says.

  **Two runtime defects in the emitted mechanism, both caught by running the real binary.** The
  module called `pi.exec(cmd, { shell: true })`, but `HookAPI.exec(command, args, options?)`
  requires `args` and spreads it — so every registration in every module threw at load; it now
  calls `pi.exec("sh", ["-c", cmd])`. And a missing worker exited 127, which the blocking branch
  read as a refusal, so `ask` and `task` were blocked with `No such file` as the reason; 127 now
  fails open, as the cells themselves specify.

  Port changes, breaking for anyone implementing `HarnessAdapter` outside this package:
  `enforcingRel` is now **`scopedRel`** (it places modules, overlays and launchers),
  `HarnessProjection` gained `executable?`, and `skillRel` returns a single destination for omp.

  **Deploy no longer seeds memory sidecars.** The canon's memory cells are gone, so
  `SEMANTIC.md` / `PROCEDURAL.md` / `EPISODIC.jsonl` are no longer written into `~/.agents/<name>/`.
  Files a previous deploy already seeded are LEFT IN PLACE — deploy never recorded them in its
  prune manifest, deliberately, and an operator's stored memory is not ours to delete.

- ca1b9aa: omp deploys its mechanism, and its skills land where omp reads them

  Three defects on one seam, all measured on hosts running the canon under omp.

  **No mechanism reached an omp host.** `project` branched on `HarnessAdapter.hooks` alone,
  so a harness whose hook surface is a program rather than a config file looked like a
  harness with no surface: all five scope-activated cells (stance gate, its pre-gate, the
  deploy-drift notice, the memory-consolidation nudge, the resume notice) were warned about
  and dropped. The port gains `scopeActivatedSurface(hooks, agentNames)` beside `hooks()` —
  `hooks()` keeps meaning "a settings fragment a host merges" — and omp realizes it as one
  extension module per scope: the session root plus every projected agent's profile, because
  its native config root is profile-scoped. `enforcingRel(file, scope)` is the destination
  map deploy asks, and scoped artifacts stage under `enforcing/<scope>/` in the render tree.

  **Skills were deployed to a path omp never scans.** The placer used the render tree's own
  staging layout (`skills/<name>`) as every harness's destination; omp's native provider
  reads `<agent-dir>/skills`, profile-scoped. `HarnessAdapter.skillRel(name, agents)` is now
  required and PLURAL, and the placer, the audit and `deploy --check` all ask it.

  **The runtime shim asserted a claude bridge inside every harness's projection.**
  `sessionEnvVars` is now an adapter fact; the emitter takes it and names no vendor. omp
  declares `[]` — it sets no session variable for a child process — so its shim refuses with
  exit 3 naming `$AGENT_SESSION_ID` / `$AGENT_SESSION_ID_FROM` instead of running
  sessionless, which is what the phantom-sibling lock failures were made of.

  `deploy --check` also passed only `agentExt`, so it audited claude's destinations on every
  harness; it now passes the whole layout. The claude and codex projections are byte-identical
  across this change.

  BREAKING for anyone implementing `HarnessAdapter` outside this package: `skillRel` and
  `sessionEnvVars` are required members, and `runtimeShimContent` / `emitRuntimeShim` take
  the harness's session-variable list rather than defaulting to claude's.

- 844811e: the canon ships two agents, and both inherit the harness's memory

  The roster is `mav` and `nico`. `arch-doc-writer`, `boz`, `developer`, `investigator`,
  `planner`, `principal-engineer-reviewer`, `principal-ic` and `tester` are deleted — not
  deprecated, not moved behind a flag.

  Both survivors declare `memory: null`, the explicit omit-to-inherit sentinel: the dimension is
  OMITTED from the projected face, so the agent has whatever memory its harness provides. The
  corpus used to declare `long-term-memory ⟨episodic · semantic · procedural⟩` and fund it with
  the `wake` and `dream` cells; those cells are retired, and a host with a real backend does this
  better than a projected claim. `dimensions/memory/*` stays on disk as an unreferenced axis
  library — four of its five fragments already were.

  Consumers of the published corpus lose eight agent definitions. The retired faces and their
  launch specs ARE swept from a host on the next `cratylus deploy` — but only because this
  release also fixes the prune: its containment guard took ONE root, and omp's destinations are
  `../.agents/…`, a sibling of the harness home, so every record resolved outside that root and
  was silently skipped. Measured on a sandbox host — ten projected personas, redeployed from a
  two-agent corpus, kept all ten faces, all ten launch specs and every retired skill, and the
  deploy reported success. `applyPrune` now takes the neutral root as a second entitled root, and
  attribution is still by manifest record, so a file this tool never wrote is untouchable in
  either root.

## 0.3.0

### Minor Changes

- d31a769: omp is a harness: an agent can now BE a declared being on it

  `cratylus project --harness omp` and `cratylus deploy --harness omp` land a
  projected persona at `~/.omp/profiles/<name>/agent/APPEND_SYSTEM.md`, which omp
  auto-discovers and appends to its base system prompt. Measured on `omp/17.2.9`:
  launched in a blank cwd with `--no-skills` and the corpus nowhere on disk,
  `omp --profile tester` answers "My name is tester."

  **`--profile <name>` is this harness's `--agent <name>`.** It is the only name an
  omp launch carries — there is no `--agent` flag, `SessionStartEvent` has no
  payload, and the one near-miss (`agentId`) is SDK-only IRC routing reachable from
  neither the CLI nor an extension. The profile also exports `OMP_PROFILE` into the
  environment and roots a private config tree, which is what makes the rest work.

  **The per-agent scope is a DIRECTORY**, and that is the new shape. Claude attaches
  a hook inside a subagent's front-matter; codex declares hooks globally and narrows
  with a generated `matcher` regex. omp needs neither: its native config root is
  profile-scoped, so a module written to `profiles/<agent>/agent/extensions/` loads
  under that profile and no other. Composition is realized by WHERE the file is, so
  enforcement needs no selector and no runtime self-filter — the ambient form
  `MODEL.md` forbids outright. Every event omp can fire, this adapter can scope,
  which closes the bootstrap's finding that everything degraded to `steer` there.

  Three things the harness's own naming gets wrong, each corrected against its
  source rather than its doc comments: `turn.end` is `agent_end`, not `turn_end`
  (omp's "turn" is a MODEL turn and would have fired several times per exchange);
  `prompt.submit` is `before_agent_start`, not `turn_start` (which carries no prompt
  text); and `agent_start`/`agent_end` are the main loop, never subagents.

  ### `HarnessAdapter.agentRel` — the destination layout is the adapter's

  New required member: where an agent's definition lands ON THE HOST, relative to
  the harness home. The render tree's staging layout and a harness's own layout are
  two different facts, and deploy had them as one — `agents/<name><agentExt>`,
  hardcoded at four sites. Claude and codex both happen to match it, so the
  assumption held for two harnesses and was invisible until a third keyed its
  persona by a per-agent directory.

  ### Fixed: codex's per-agent enforcing constraints reached the host as nothing

  `enforcingSurface` was called with only its bindings while every implementation
  needed the `anchor → HarnessMechanism` map to know what command to wire. Codex's
  took the map as an optional parameter and the adapter wired it at arity one, so
  every binding hit `if (!m) continue` and the function returned `null` for all
  input — measured, not inferred. It stayed green throughout because the unit tests
  call the function directly with a map the production path never supplied. The port
  now threads it, and `enforcingSurface` may return many projections rather than one.

## 0.2.0

### Minor Changes

- 3e9c103: The command ships from one package, and `forge` becomes a library.

  **Breaking, and marked `minor` deliberately.** Pre-1.0, a `minor` bump IS the breaking signal —
  changesets reads `major` on a `0.x` package as a jump to `1.0.0`, which would claim a stability this
  project has not earned while every sibling is still `0.x`.

  **`cratylus` is the package a consumer installs.** It was `@cratylus/invoke`, which
  ARCHITECTURE already described as the composition root; it now carries the build-time entry beside
  the run-time one rather than a third package appearing. **One command.** `cratylus-run` is gone: a second bin existed only because the two surfaces lived
  in two packages and each built its own `cac`. Capability verbs (`cratylus memory encode`) route to
  the runtime, everything else to the projector. The "two DAGs" the split defended are a fact about
  IMPORTS, and imports are what the bundler and the package manager already handle.

  `@cratylus/runtime` renames `runMain` to `runCli` and `RUNTIME_BIN` to `CLI_BIN` — there is one
  command, so the name that said otherwise was a lie. `CLI_BIN` lives in the runtime because it is the
  contract leaf: it depends on nothing, so every package imports the name without inverting an edge.
  The host runtime config follows it to `~/.cratylus.json`.

  It also gains a library face: `import { defineConfig } from 'cratylus'`. A consumer never reaches
  into `@cratylus/forge/config`, so the internal package split stays ours to change.

  **`@cratylus/forge` no longer declares a `bin`** — breaking for anyone invoking it as a program
  rather than importing it. Two manifests declaring one bin name is an install conflict, not a second
  home, so the name has exactly one home and it is the hub's manifest. `CLI_BIN` is handed down by
  whatever mounts the CLI instead of derived from a manifest forge no longer has; that is a parameter,
  not a second spelling. `./cli` is added to the exports map so the hub can mount it.

  **The config file is `cratylus.config.ts`,** and its factory is `defineConfig`. `agents.config.ts`
  named one of four Kinds while governing all four, ignored the near-universal tool-named convention,
  and claimed the most contested filename in the ecosystem. `CONFIG_FILE` now derives from the bin
  name — the config is named after the tool, so it carries the same single-home obligation.

  **`deploy` defaults its render tree** to `.cratylus/<harness>`, what `project` writes. The ordinary
  invocation is `cratylus deploy`; `--agents-dir` / `--skills-dir` / `--hooks-dir` remain as
  overrides, and a missing tree refuses by naming `cratylus project` rather than by demanding a flag.

  **`@cratylus/schema` drops its `@cratylus/runtime` dependency.** It imported nothing from it — the
  edge was repaired in the source on 2026-08-05 and the manifest entry was left behind, so installing
  the shapes package also downloaded the runtime. Schema is the package the whole graph sits on top
  of; its own README already said "this package imports nothing" while its manifest disagreed.

  **`cratylus install` is new** — the zero-config path for an operator with no project. It resolves a
  corpus (the config where one exists, otherwise the corpus the mounting package names), detects the
  harness, renders to a temp tree and places it at user scope. `graphify install [--platform P]` is
  the prior art. Two harnesses on a host refuses and names both rather than choosing one silently.

### Patch Changes

- Updated dependencies [3e9c103]
  - @cratylus/runtime@0.2.0
  - @cratylus/schema@0.1.2

## 0.1.1

### Patch Changes

- a019716: Every CLI reports the version its manifest declares.

  `0.1.0` shipped with `cratylus-run --version` and `cratylus --version` answering `0.0.0`: the
  number was a literal in TypeScript, and `changeset version` rewrites manifests rather than
  source, so the two diverged at the first release and would have stayed diverged. Each now
  reads its own manifest by package self-reference, and a gate holds the shape.

- Updated dependencies [a019716]
  - @cratylus/runtime@0.1.1
  - @cratylus/schema@0.1.1

## 0.1.0

### Minor Changes

- 6b471c4: Initial public release of Cratylus — the latent-lexicography toolchain.

  `0.1.0` rather than `1.0.0` deliberately: under semver, `0.x` signals a surface that may still break,
  and several concepts are still being cut. The names, however, are settled —
  scope, packages, and both bin names went through the full round-trip (forward argmin, blind reverse
  decode, occupancy check) before this release, because a name is free until first publish and never
  after.

  - `cratylus` — the build-time command: author, resolve, project and deploy a corpus.
  - `cratylus-run` — the run-time command a deployed agent's shims invoke for a capability.

### Patch Changes

- Updated dependencies [6b471c4]
  - @cratylus/runtime@0.1.0
  - @cratylus/schema@0.1.0
