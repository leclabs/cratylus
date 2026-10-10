# 0019 · Assayer jury

Status: accepted · 2026-10-09

## Context

Judgment was given to one assayer. A judge from the same model family as the work's builders shares their blind
spots, and a model judging output like its own tends to favour it. A panel of judges from different model
families is measurably more reliable and less biased than one larger judge (Verga et al., _Replacing Judges
with Juries_, 2024). The jury was first introduced informally, with a placeholder agent named `juror` that no
concept defined.

## Decision

Judgment is made by **two assayers on models of different families**, each judging independently. Where they
agree, their findings stand. Where they disagree, the disagreement goes to the architect as a meaning question.
There is no separate juror role: both members hold the assayer role and differ only in the model they run on.

## Consequences

The `judgment` concept is superseded; cut 2 is paused, so no build moves under it, and none of its examples
depend on the number of judges. The `juror` placeholder agent and model role are removed. The second assayer is
dispatched as the `assayer` agent with a model of another family (currently `openai-codex/gpt-6-astra:max`;
the first runs on `anthropic/claude-opus-5-5:xhigh`).
