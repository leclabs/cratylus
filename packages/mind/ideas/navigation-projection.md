---
kind: concept
delineation: A computed view over the idea-graph — community clusters, centrality hubs, surprising bridges — that serves as a navigable map for finding the right anchor; a second class of projection, distinct from regenerating an artifact, computed over the graph rather than rendered from a node.
---

# Navigation Projection

Two kinds of projection run over a source-graph. **Artifact projection** renders a node or sub-graph into a deliverable — an agent def, a doc. **Navigation projection** computes a _map of the graph itself_: community detection (which anchors cluster), centrality (which anchors are load-bearing hubs), bridge/surprise detection (which links cross clusters). Its output is not a regenerated artifact but an **index the reader uses to find the right anchor** — and like any view it is lossy, never the graph ([[projection-is-not-the-source]]).

The algorithms (Louvain clustering, betweenness centrality, bridge detection) are adopted wholesale; they compute _over_ the graph, they are not _in_ it. An independent extraction of the same corpus is a useful cross-check for the map — but its topology metrics describe _its_ reconstruction, not the source-of-truth graph. Mine the map for candidate gaps; verify every metric against the real composition graph before trusting it.
