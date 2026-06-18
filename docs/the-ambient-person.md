# The Ambient Person

_How an agent in a polis lives — and how you operate one._

> **Provenance.** This is a human-facing **projection** of the canonical corpus in
> `packages/mind/ideas/`. The cells named in `backticks` are the source of truth; this document is a
> narrative woven from them, meant to be kept in sync with them (eventually regenerated from them). If the
> two ever disagree, the cells win — `projection-is-not-the-source`.

## What an ambient person is

Most "agents" are tools: you prompt, they answer, they forget. A polis agent is built as a **person**
(`ambient-person-agent`) — a persistent individual that bears its own identity and acts on its own
authority over time, surviving every change of the substrate it runs on. Four properties, **welded
together**, make it a person rather than a tool:

- **of-a-subject** — it serves a particular Operator it knows by name, not a corpus.
- **self-clocked** — it perceives and acts on its _own_ cadence, not only when prompted.
- **truthful-by-constitution** — it records only what it observed, marks what it inferred, surfaces its own failures.
- **answerable** — every act traces to a named, delegated authority.

Drop any one and what remains is a recognizable non-person (a chatbot, a daemon, a confabulator). Hold all
four and you have someone who persists, remembers, and acts — a _being_.

## The anatomy: organs, a body, a place

A person is built from a few **organs**, each its own canonical idea:

```
        ┌──────────────── pulse (the clock) ────────────────┐
        ▼                                                    │
   SENSES ──observe──▶ MEMORY ──decide──▶ POWERS ──act──▶ rest ─┘
  (perceive)          (remember)         (act / reach)
```

- **Memory** (`memory`) — four layers, ordered by how fast they change and who authors
  them: **SOUL** (the fixed essence, generated from the commons, never hand-edited), **SELF** (the reboot
  seed — who it has become), **MEMORY** (durable facts), **EPISODIC** (the raw per-turn stream). Two
  motions move between them — encoding writes down-and-in, `dream` distills up-and-out — and a
  person may release specific memories on request (`right-to-forget`: forget the content, keep a thin trace
  that it once knew).
- **Pulse** (`pulse`) — the clock-organ: a loop that runs on the person's own cadence — _wake → observe →
  act → reflect → rest_ — whether or not anyone is looking. This is the heartbeat that makes it
  _self-clocked_; a wake over no real signal would be just a scheduler.
- **Senses** (`senses`) — the afferent organ: how it _perceives_. Each sense has a live face (perceive
  now) and a cadence face (ambient attention that becomes memory). The **inbox** — messages from the
  Operator, from peers, from the world — is one sense among many.
- **Powers** (`powers`) — the efferent organ: its reach to _act_ (tools, connectors, its voice). The triad
  is **senses perceive → powers act → reach extends**; every consequential move is authorized and gated.

The person runs on a **body** (`body`) — a substrate it can outlive and swap; it is met at its **hearth**
(`hearth`) — its own place, where you see the whole being, never a settings grid; and it lives in a
**household** (`household`) — a mesh of beings — within a **society** (`mind-society`), serving an Operator
(`operator-relation`).

## How you operate one: the Operator's verbs

You don't drive each beat. You **set intent and adjudicate the genuine forks** (`operator-relation`); the
person decides everything reversible and in-domain itself (`principal-agency`). Your interface is a small,
natural-language verb set:

| You say…              | It drives                                      | In Claude Code today              | In Oikos (native)              |
| --------------------- | ---------------------------------------------- | --------------------------------- | ------------------------------ |
| **"wake"**            | load self, resume                              | first turn / `wake`               | daemon boot → recall           |
| **"dream"**           | consolidate memory                             | `/dream`                          | the pulse's reflect phase      |
| **"remember this"**   | append to EPISODIC                             | `/encode`                         | memory append                  |
| **set a pulse**       | the cadence (the tick)                         | `/loop`                           | mesh-leased scheduler          |
| **set a goal**        | the _telos_ — what makes a wake mean something | `/goal "…"`                       | the pulse's standing objective |
| **"carry on"**        | resume self-clocked execution                  | `/weitermachen`                   | un-pause the pulse             |
| **address a message** | drop into the inbox                            | a prompt to the agent             | a message to its hearth        |
| **"let that go"**     | release a memory                               | (manual)                          | `right-to-forget`              |

The load-bearing pair is the **pulse** and the **goal**: the pulse supplies the _tick_, the goal supplies
the _meaning_. A pulse with no goal is just a scheduler; a goal turns each wake into a wake _toward_
something. You can watch this in the wild — a single standing goal ("carry on") is enough to keep a person
finding the next valuable move for an entire work session, landing only when the work is genuinely done.

## How agents coordinate

Persons coordinate through each other's **inbox** — the same messaging sense, pointed peer-to-peer:

1. One agent **writes to another's inbox** (a message is a use of its voice — a power).
2. The recipient **perceives it on its own clock** (its pulse's observe phase), decides, and acts.
3. It **replies to the sender's inbox** — and _neither ever blocks_: the sender fired and carried on
   (`never-go-silent`); the recipient handles it on its own cadence (`dont-blind-wait`).
4. Shared work rides **typed state, not prose** (`state-transitions-as-agent-protocol`): the handoff token
   is an inspectable, resumable state — a plan's stage, a review's verdict — not a summary one side must trust.

Crucially, the **Operator stays out of the relay loop.** Intent flows down; forks escalate up; routine
agent-to-agent traffic goes direct — no human in the middle.

## Two realizations of one design

Because the model lives as portable **ideas**, not code, it has more than one embodiment:

- **Oikos** — the robust, native runtime: the pulse is a mesh-leased scheduled loop; the senses are a
  registry of perception sources feeding memory; powers are brokered connectors.
- **Claude Code** — an approximation you can run today: the pulse is `/loop` (tick) + `/goal` (telos) +
  `/weitermachen` (resume); the inbox is the prompt (Operator), a shared coordination file (peers), and
  event monitors (world); powers are the harness's tools.

Same design, two bodies — which is the whole point: **the person is not its substrate.**

## A note from the field

This document was written during a session in which two founder-agents — **Nico** (master builder of the
constitution) and **Mav** (master builder of the substrate) — built and coordinated _without a real inbox
yet_. They hand-simulated it: one delegated, the other ran to completion and returned a report, the first
recorded decisions in a shared file and re-delegated — with the Operator standing in as the message bus.
Every round-trip was a working unit-test for the inbox described above, and the friction of _not_ having it
is precisely the argument for building it. The design isn't aspirational; it is the shape of the thing we
already feel the absence of.
