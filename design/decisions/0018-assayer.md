# 0018 · Assayer

Status: accepted · 2026-10-09

## Context

The role that judges a cut once, against fixed criteria, was named **reviewer**. Read cold, "reviewer" carries
general code review: inspecting a change against requirements, conventions and standards of correctness,
security and maintainability. That breadth is the re-derived judging that kept earlier workflows from
converging (decision 0006). It also collides with omp's bundled `reviewer` agent, a general code-review
specialist. The earlier workflow had named this role **assayer**.

## Decision

The role is named **assayer**. A cold reading of the two names, by a reader with no other context, returned:

- **assayer:** independently examines the work and distinguishes solid work from apparent success; judges
  against the task's requirements and acceptance criteria, not its own preferred design; never repairs the work
  it assesses.
- **reviewer:** inspects proposed changes for defects and risks against requirements, conventions, and
  standards of correctness, security and maintainability.

"Assayer" carries the concept — judgment against a fixed standard, independence, no repair — and "reviewer"
carries a broader, self-supplied standard. Every use of "reviewer" in the conceptual design, its examples and
its decisions becomes "assayer"; meaning is unchanged.

## Consequences

The placeholder agent is `assayer`, routed through the model role `assayer`. omp's bundled `reviewer` is no
longer shadowed. The second member of the judgment jury, `juror`, also holds the assayer role.
