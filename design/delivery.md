# Design · delivery context

The concepts of cratylus's **delivery** bounded context: how the corpus and its capabilities reach a harness.
omp is the one supported harness. Concepts change only by supersession until the concept journal holds them.

## Concepts

- **capability fidelity** · a capability reaches the harness at the highest fidelity the harness offers: its
  own native facility first, then cratylus's own extension to the harness, and prose only where neither is
  possible; a skill carries only when to reach for a capability, never a reimplementation of it in prose, so
  agents call a capability as a tool rather than follow instructions about it. · _primitive_
- **owned root** · everything cratylus places on a host lives under one root it owns, and the harness's own
  surfaces only refer into it, so what cratylus placed is known by construction, never inferred file by file.
  · _primitive_
- **upgrade** · installing over an earlier installation replaces the owned root whole and rewrites its
  references, leaving exactly what the new version places and everything the host owns. · _built from:_ owned
  root

## Contracts with other contexts

- **workflow → delivery:** the concept journal is reachable in omp as a tool that cratylus adds to the harness
  as an extension, not as prose a skill restates.
