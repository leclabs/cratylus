# Design · delivery context

The concepts of cratylus's **delivery** bounded context: how the corpus and its capabilities reach a harness.
omp is the one supported harness. Concepts change only by supersession until the concept journal holds them.

## Concepts

- **capability fidelity** · a capability reaches the harness at the highest fidelity the harness offers: its
  own native facility first, then cratylus's own extension to the harness, and prose only where neither is
  possible; a skill carries only when to reach for a capability, never a reimplementation of it in prose, so
  agents call a capability as a tool rather than follow instructions about it. · _built from:_ capability port · _decided in:_ 0009
- **capability port** · each capability has one implementation in cratylus, reachable from the cratylus
  command line; a harness reaches it through a thin adapter that calls that implementation and adds no
  behavior of its own, so every harness gets the same capability and supporting another harness never
  reimplements one. · _primitive_ · _decided in:_ 0009
- **owned root** · everything cratylus places on a host lives under one root it owns, and the harness's own
  surfaces only refer into it, so what cratylus placed is known by construction, never inferred file by file.
  · _primitive_ · _decided in:_ 0021
- **upgrade** · installing over an earlier installation replaces the owned root whole and rewrites its
  references, leaving exactly what the new version places and everything the host owns. · _built from:_ owned
  root · _decided in:_ 0021

## Contracts with other contexts

- **workflow → delivery:** the concept journal is reachable from the cratylus command line, and in omp as a
  tool that a cratylus extension adds as a thin adapter over that same command, not as prose a skill restates.
