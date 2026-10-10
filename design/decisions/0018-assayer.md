# 0018 · Assayer

Status: accepted · 2026-10-09

## Context

The role that judges a cut once, against fixed criteria, needs a name that carries that meaning cold. Two
candidates were read cold by a reader with no other context:

- **assayer:** independently examines the work and distinguishes solid work from apparent success; judges
  against the task's requirements and acceptance criteria, not its own preferred design; never repairs the work
  it assesses.
- **reviewer:** inspects proposed changes for defects and risks against requirements, conventions, and
  standards of correctness, security and maintainability.

"Reviewer" carries a broad, self-supplied standard, the re-derived judging that keeps a workflow from
converging (decision 0006), and is also the name of omp's bundled general code-review agent.

## Decision

The role is named **assayer**: it carries judgment against a fixed standard, independence, and no repair.

## Consequences

The agent is `assayer`, routed through the model role `assayer`; omp's bundled `reviewer` stays available for
ordinary code review.
