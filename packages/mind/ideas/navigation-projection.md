---
kind: concept
delineation: A computed view over the idea-graph — community clusters, centrality hubs, surprising bridges — that serves as a navigable map for finding the right anchor; a second class of projection, distinct from regenerating an artifact, computed over the graph rather than rendered from a node.
---

# Navigation Projection

Like any view, the map is lossy — never the graph ([[projection-is-not-the-source]]).

Its algorithms (Louvain clustering, betweenness centrality, bridge detection) are adopted wholesale; they compute _over_ the graph, not _in_ it. An independent extraction of the same corpus cross-checks the map, but its topology metrics describe _its_ reconstruction, not the source-of-truth graph. Mine the map for candidate gaps; verify every metric against the real composition graph before trusting it.
