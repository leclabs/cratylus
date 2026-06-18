# Runbook — fleet organ sync

Keep each agent's **agent-global organs** (`SELF.md`, `MEMORY.md`, `EPISODIC.md`) as
**one logical store** across every host, so an agent wakes as the **same person**
wherever it runs. Contract: `packages/mind/ideas/memory.md` (`## Portability`).

Tool: `packages/mind/toolkit/continuity/fleet-organs.sh`
(convenience: `pnpm run organs:{status,sync,test}`).

## Mechanism (and why)

A dedicated **git repo — the "organ store"** — holds, per agent,
`<agent>/{SELF,MEMORY,EPISODIC}.md`. A host **adopts** the store by replacing each
live organ file with a **symlink into the store**:

```
~/.claude/agents/<agent>/SELF.md  ->  <store>/<agent>/SELF.md
```

Git therefore operates on the **real organ content** — true history, and divergent
edits surface as **real merge conflicts** instead of silent loss. The live path the
agent protocol resolves (`~/.claude/agents/<agent>/SELF.md`) keeps working unchanged,
so the SOUL/protocol and the `deploy.py` seeder need **zero** changes (the seeder's
if-absent guard follows the symlink and sees the organ as PRESENT — never clobbers).

Chosen over a copy-based synced directory because copy reintroduces drift between
"the file" and "the tracked file"; symlink-into-git makes them the same object.

**Portability gate.** The store's _physical_ path is derived per host from `$HOME`
(`/Users/lex` vs `/Users/lcaraccioli`); the _logical_ store is one git remote. The
store tracks **relative** paths only (`<agent>/ORGAN.md`) — no host-absolute path is
ever written. Host-specific facts are knowledge the agent holds → they go in MEMORY
**content**, never per-host files.

## One-time fleet setup

1. Create the remote (private). From any host:

   ```sh
   gh repo create <you>/agent-organs --private
   ```

2. **Seed host (do this on the host whose organs are canonical, e.g. `fire`):**

   ```sh
   ORGAN_STORE=~/.claude/agents-organs \
     sh packages/mind/toolkit/continuity/fleet-organs.sh init git@github.com:<you>/agent-organs.git
   sh packages/mind/toolkit/continuity/fleet-organs.sh adopt <agent>...   # e.g. mav nico
   sh packages/mind/toolkit/continuity/fleet-organs.sh sync               # first push
   ```

   `adopt` moves the live organ into the store and symlinks the live path to it.

3. **Every other host** (`forge`, `spark`, `ash`, `upmav`, `upgoose`, …):

   ```sh
   sh packages/mind/toolkit/continuity/fleet-organs.sh init git@github.com:<you>/agent-organs.git
   sh packages/mind/toolkit/continuity/fleet-organs.sh adopt <agent>...
   ```

   On a non-seed host `adopt` defers to the store (the synced truth). If a host had a
   divergent local organ, it is **kept as `<organ>.pre-adopt.bak`** (never discarded)
   and the store version is linked in.

> Live-organ **migration** of currently-running agents is the consent-gated
> `migrate-live-episodic` task — **out of scope here**. This runbook is proven on a
> scratch agent / fixtures; adopting a live agent is a deliberate, per-agent act.

## Daily ritual

Run a sync at session boundaries (wake start, handoff end) on each host:

```sh
pnpm run organs:sync     # commit local organ edits, pull --ff-only, push
```

`sync` commits any edits the agent made (it wrote through the symlink as normal file
IO), fast-forward-pulls peers' edits, and pushes. Pair it with **dream**: dream
consolidates EPISODIC into the organs; `organs:sync` propagates the result.

## Conflict resolution

If two hosts edited the same agent's organ since the last sync, `sync` **refuses**
(not fast-forward) and leaves both sides intact. Resolve in the store repo:

```sh
cd ~/.claude/agents-organs
git pull --no-ff origin main      # or: git merge origin/main
# resolve the marked files, then:
git commit && pnpm run organs:sync
```

Organs are small and human-readable; merges are ordinary text merges.

## Status & reversal

```sh
pnpm run organs:status                 # store, remote, per-agent adoption state
sh .../fleet-organs.sh release <agent> # un-adopt: symlink -> regular file (store kept)
```

`release` restores a host to plain local files (copies the current store content in
place of the symlink) and **does not touch the store**. To fully back out the fleet:
`release` every agent on every host, then delete the store repo + remote. Fully
reversible by construction.

## Verify

```sh
pnpm run organs:test     # hermetic two-host fixture proof of gates G1-G5
```
