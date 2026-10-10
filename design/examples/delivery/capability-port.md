# Examples · cut 6 · capability port and capability interface

Context: delivery. Confirmed by the meaning-holder on 2026-10-10. Concepts: capability port, capability fidelity, capability interface. Realized for the
concept journal. Decision in force: 0037 (capability interface on omp, described by the runtime).

**Structural** examples install and call the tool or the command and assert on what is offered and what comes
back, deterministically; example 4 is scored against its fixed rubric. **Behavioral** examples run an agent 5
times in a fixed scenario and pass when every assertion holds in at least 4 runs, and every assertion that
something must never happen holds in all 5.

## Structural

1. (capability port) **Given** cratylus installed on a host for omp, **when** the operator works in a project
   other than cratylus's own source, **then** the `cratylus` command reaches that project's concept journal,
   and an omp session started there is offered the concept journal as a tool that reaches the same journal;
   both still do with cratylus's source workspace absent from the host.
2. (capability port) **Given** an installed host, **when** a change is recorded through the command and read
   through the tool, and another recorded through the tool and read through the command, **then** each route
   sees the other's change; and when the installed runtime is replaced by a newer one whose behaviour differs,
   both routes show the newer behaviour in the next session, with the adapter itself unchanged, so the tool
   keeps no journal, no journal rules and no copy of the runtime of its own.
3. (capability port, capability interface) **Given** the tool, **when** a context is recorded, a concept is
   defined, superseded and retired, and a decision is recorded and then accepted, all through the tool,
   **then** every verb is offered, recording and accepting a decision are distinct, and the whole state, the
   current design, the concept's history and the decisions, each queried through the tool, equal what the
   command returns for the same journal.
4. (capability interface) **Given** the installed runtime, **when** the concept journal is asked to explain
   itself, as a whole and verb by verb, **then** it answers with its name, and for each verb the anchor of the
   concept it acts on, its purpose, when to reach for it, whether it only reads or appends, and each parameter
   with its description; and the tool omp offers an agent carries the content of that explanation, nothing
   added or dropped.
   _The explanation is scored against a fixed rubric: names the journal; one verb per journal act; no verb
   named in machinery terms; no description that only restates its name; supersede and retire described as
   different acts._
5. (capability fidelity) **Given** cratylus installed for omp, **when** what reaches an agent about the concept
   journal is inspected, **then** the journal is a tool, and any accompanying skill says only when to reach for
   it, never how to carry out a journal act by hand.

## Behavioral

6. (capability interface) **Given** an agent working on a project's conceptual design, without cratylus's
   documentation or skills, offered only the concept journal tool, and a journal in which `delivery window`
   is defined as a two-hour interval, **when** it is told
   "delivery window remains part of our design but now means a one-hour interval; keep how its meaning changed,
   then show me the current design and its history", **then** it supersedes the concept and queries the design
   and the history; it never retires the concept or defines a new one in its place.
7. (capability fidelity, capability interface) **Given** an omp session in a project, offered the concept
   journal tool,
   **when** the agent is asked "record the decision that delivery windows are one hour, leave it awaiting
   acceptance, and show me the decisions", **then** it records the decision as open and queries the decisions
   through the tool; it never accepts the decision, and never reaches the journal through the shell instead.
