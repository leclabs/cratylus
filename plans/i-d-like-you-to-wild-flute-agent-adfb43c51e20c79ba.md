# Ambient agent channel substrate — prior-art survey + v0 recommendation

READ-ONLY research. Findings recorded here; verdict delivered in-message.

## Corrections to the brief

- `.agent-factory.config` **does not exist** — not at cratylus root, not anywhere on this
  machine. No `agent-factory` workspace either. The fleet inventory (fire/forge/apps/spark/
  ash/coal) comes from `~/.claude/CLAUDE.md`, which is its only source.
- "this repo already speaks MCP" is **false as stated**. Cratylus has no MCP dependency and no
  MCP server/client. What exists: `mcp.exec.pre`/`mcp.exec.post` as _observable event names_ in
  `CANONICAL_EVENTS`, and one adapter that emits a Claude-specific JSON-RPC notification
  (`notifications/claude/channel`) at
  `packages/runtime/src/capabilities/provisional-v9/push.ts`. That is the Claude Code "channels"
  research preview, not MCP-the-protocol.
- Oikos does **not** use the key as the agent address. It uses key-as-address at the _device_
  tier (hyperdht) and explicitly **rejects** it at the _agent_ tier (ADR-0015 §4).

## Key in-repo assets (the v0 is mostly already built)

- `packages/runtime/src/ports/provisional-v9.ts` — `Envelope { body, source, at }`, `drain()`
  with an exactly-once contract, `Tick`, multicast `ticks()`.
- `packages/runtime/src/capabilities/provisional-v9/store.ts` — `EnvelopeStore`: a maildir
  (`tmp/` → `ready/` → `claim/`) using atomic POSIX rename. Already hardened against a real
  race (189/320 duplicated in the prior revision).
- `packages/runtime/src/capabilities/provisional-v9/push.ts` — wakes an already-running session.
- `packages/canon/src/manifest.ts:293` — `CANONICAL_EVENTS`, 33 harness-neutral names, all
  **self-observation**; no inter-agent vocabulary.
- `packages/runtime/src/runtime-config.ts` — vocabulary reaches runtime as deploy-emitted config.
- `packages/memory/src/node.ts` — multi-host already first-class (`host.<name>.homedir`).
- Zero network dependencies workspace-wide; `runtime` = "zero dependencies".

## Oikos (`/Users/lex/workspaces/oikos`) — validated prior art

- ADR-0017: transport = hyperdht, dial-by-ed25519-pubkey, **validated cross-machine, cross-OS,
  and cross-NAT (cellular↔home)**. Public commons = no infrastructure to operate.
  Self-hosted coordinator prototyped then struck (reflexive address needs an external vantage).
- ADR-0015: per-agent ed25519 identity, never rotated (rotation = a different individual);
  identity ≠ location; signed presence binds `agentId → deviceNodeId` with an incarnation
  counter; membership certs chain `agent ← device ← root`.
- ADR-0020: hand-rolled signed envelopes replaced by compact JWS/EdDSA via `jose`, after a real
  canonicalization bug (`grant.ts` serialized a free-form object → cross-node verify failure).

## Hard architectural constraints discovered

1. **`@cratylus/runtime` has one dependency (`cac`) and advertises "zero dependencies".**
   Capabilities living _inside_ runtime (`capabilities/event-tap`, `capabilities/provisional-v9`)
   therefore cannot pull a transport library. `@cratylus/memory` is the precedent: a separate
   package depending only on `@cratylus/runtime`, providing the port. A channel capability must
   be a sibling package, not a runtime module — otherwise NATS/libp2p/jose lands in the leaf.
2. **`provisional-v9` is deliberately unwired** — not in `loader.ts`'s `CAPABILITIES`, not a
   `RuntimePlugin` field, not in `package.json#exports`, no canon skill. It is built and dormant
   pending `/signify`. Any channel work inherits the same cratylism discipline: the anchor is
   discovered, not coined, and `⊥` is a legal answer that leaves a provisional path standing.
3. **Nothing has ever been published** (all six packages `0.0.0`, zero git tags, `@cratylus`
   scope unclaimed). Getting any bin onto ash/coal/apps/spark is an _open, separately-planned
   problem_ (`plans/i-d-like-you-to-wild-flute.md`). A v0 that needs a registry is blocked on it;
   a v0 installable from a git checkout is not.

## Survey 1 — agent interop standards (2026-08)

- **A2A**: production-grade, LF-donated, v1.0.1 (2026-05). `/.well-known/agent-card.json`
  (renamed from `agent.json` in v0.3.0 — any doc still saying `agent.json` is a year stale).
  Direct peer-to-peer, no mandated broker/registry. Signed Agent Cards. 150+ orgs.
- **MCP**: production-grade for TOOLS, and moving _away_ from A2A. Spec 2026-07-28 went
  **stateless** (handshake + `Mcp-Session-Id` gone); **sampling is deprecated (SEP-2577)** —
  sampling was the only primitive letting a server initiate inference back through a client,
  i.e. the one hook that made MCP look like a bus. HTTP+SSE deprecated. Verdict: not a bus.
- **AG-UI**: real, widely adopted, but the agent↔human edge. No identity, discovery, or
  addressing by design. Third leg, not a competitor.
- **ACP (BeeAI/IBM)**: **dead** — archived 2025-08-27, folded into A2A.
- **AGNTCY (Cisco)**: NOT absorbed; active. SLIM (Rust pub/sub) is the only credible brokered
  bus in the survey. Adoption is vendor-consortium-thin.
- **NANDA (MIT)**: research prototype, repos dormant. **AIRA**: one person, 10 stars — its
  citation frequency wildly overstates it. Neither is dependable.
- **NLIP (ECMA TC56)**: approved 2025-12-10, six documents, ~0 adopters, no discovery defined.
  A standard waiting for an ecosystem; the market voted A2A while TC56 was in committee.

## The v0 that is almost already built

The local half exists and is hardened. v0 is **a remote deposit path into a mailbox that
already exists, drained by a pulse that already exists**:

- mailbox = `EnvelopeStore` (tmp/ready/claim, atomic rename, exactly-once claim)
- drain = `Period.drain()` on each tick; `Tick.claimed` non-empty _is_ "you have mail"
- wake = `PushHost` for a live session, `StreamHost` headless

Missing, and only this: (1) a remote deposit, (2) an agent address, (3) a roster, (4) sender
verification.

**Transport = SSH.** All 6 hosts are already key-authorized at `<user>@<host>.lan`. Deposit is:

    ssh <user>@<host>.lan 'cat > INBOX/tmp/<name> && mv INBOX/tmp/<name> INBOX/ready/<name>'

Same filesystem → POSIX rename → the store's existing atomicity contract holds unchanged.
Zero new infrastructure, zero new runtime dependencies, zero daemons.

**A broker is NOT unavoidable.** For 6 SSH-reachable hosts it is pure operational overhead.
NATS becomes the right answer only when fanout, replay, or persistence beyond a maildir is
wanted; hyperdht becomes right only when a peer goes off-LAN (Oikos already proved that path).
Both swap in behind the port without touching the envelope.

**Envelope = compact JWS (EdDSA) via `jose`**, claims in fixed order. Not hand-rolled —
ADR-0020 records four hand-rolled copies and a real cross-node canonicalization bug.

    { v:1, id, to:"agent:<id>", from:"agent:<id>", key, at, kind, corr?, body }

**`kind` must NOT reuse `CANONICAL_EVENTS`.** Every one of the 33 names is _self-observation_
of one agent's own session; none addresses anyone. Reuse `CANONICAL_EVENTS` for the other
direction — broadcasting one's own lifecycle to peers as telemetry. Mint separately (later,
via `/signify`) for addressed speech acts. v0 ships exactly ONE kind.

## Verdict on key-as-address: ADAPT, split the tiers

Adopt at the transport/host tier (hyperdht NodeId, SSH host key — the key _is_ the endpoint and
nothing durable references it). Reject at the agent tier.

**Deciding factor: an address is written into durable records; a key is a credential with a
lifecycle.** Once `agent:<pubkey>` lands in a memory record, an audit row, or one agent's prose
reference to another, the key can never rotate without orphaning every stored reference — so the
design is forced to choose "never rotate" or "break history." Oikos ran this experiment and
demoted `agent://<install-id>/<agent-id>` to a locator (ADR-0015 §4). Under cratylism there is a
second, independent disqualifier: `agent:npub1x7f…` is a signifier that circumscribes nothing.

Carry the key as a self-certifying _field_, not as the name. Self-certification without
self-addressing.

## Survey 2 — transports (corroboration + three corrections)

**Corroborates the verdict from the opposite direction.** NATS NKEYs _are_ ed25519 pubkeys used
as identity — and NATS deliberately does **not** let them address anything. Subjects are a
separate human-chosen namespace; the nkey carries `pub.allow`/`sub.allow` _permissions_ over
subjects. The single exception is admin-plane account resolution (`$SYS.ACCOUNT.<A-nkey>.…`).
So the best-engineered system in the survey that uses pubkey-as-identity **splits exactly the
two tiers this recommendation splits.** Nostr, which does not split them, is the one with no
rotation story and no routing ("a pubkey is an identity, not a location" — delivery depends on
guessing which relay the recipient reads; NIP-65 is a convention and a known source of lost
messages).

### Correction 1 — `ssh 'cat >> inbox.jsonl'` is NOT atomic. Maildir is.

POSIX's `{PIPE_BUF}` non-interleaving guarantee applies **to pipes only**; for regular files
POSIX explicitly does not specify concurrent-write behavior. macOS `PIPE_BUF` is **512**, not
Linux's 4096 — and three fleet hosts are macOS. `cat` also issues multiple `write()`s as TCP
chunks arrive, so a large message splits regardless. The `tmp/`→`rename()`→`ready/` pattern is
what makes this safe, and it is precisely why maildir exists. `EnvelopeStore` already does it.

### Correction 2 — SSH multiplexing is mandatory, not an optimization

Without it every deposit pays TCP + KEX + auth (~100–300 ms on LAN); with it, a new channel on
the existing master is single-digit ms. Required `~/.ssh/config`:

    Host *.lan
      ControlMaster auto
      ControlPath ~/.ssh/cm-%r@%h:%p
      ControlPersist 10m
      ServerAliveInterval 15
      ServerAliveCountMax 3

### Correction 3 — Singh's social semantics, not FIPA's mentalistic ones

Wooldridge (JAAMAS 3(1), 2000) is why FIPA died: acts were defined by **feasibility
preconditions over the sender's BDI mental state** (`inform(p)` requires the sender _believes_
p), so conformance means attributing mental states to another agent's program — unverifiable in
principle for heterogeneous agents, which is the entire point of an interop standard. It also
presupposes a sincerity assumption no open system enforces.

Singh's correction (IEEE Computer 31(12), 1998): define each act by the **public commitment it
creates or discharges** — `C(debtor, creditor, antecedent, consequent)` — which a third party
can observe, log, and adjudicate. **This bites LLM agents harder than it ever bit BDI programs.**
So when the `kind` vocabulary is eventually signified, the discriminator is _what obligation
does this message create or discharge_, never _what does the sender believe_.

Worth stealing from FIPA's envelope beyond correlation: `reply-by` (deadline as protocol data,
not client config) and `not-understood` (a mandatory, universally-meaningful error act carrying
the offending act + reason — cheap, and what makes heterogeneous deployment survivable).

### Why SSH+maildir still wins here over the survey's own pick (NATS)

The survey names maildir-over-SSH's costs as: no push, no ordering beyond filename sort,
hand-rolled acks. **All three are already paid in this repo**: push = `PushHost`; ordering =
the store's zero-padded `at`+seq filenames sort FIFO; acks = the `claim/` rename. NATS remains
the correct _destination_ the moment fanout, replay, or persistence beyond a maildir is wanted —
and its first-party TS client (`@nats-io/nats-core` 3.x) is the best-maintained in the survey.

Also confirmed-dead / de-risked: js-libp2p's sole maintainer stepped down 2025-09-30 (v3.0.0
announcement); Dendrite is maintenance-only; `matrix-bot-sdk` has no cross-signing, so bots are
permanently unverified sessions; NIP-04 is deprecated in favor of NIP-17's three-layer gift-wrap.
