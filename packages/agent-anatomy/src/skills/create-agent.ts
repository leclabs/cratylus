import type { SkillCell } from '../toolkit/skill-cell.js';

export const createAgent: SkillCell = {
  name: 'create-agent',
  trigger: `/create-agent`,
  delineation: `author a custom agent as an organ-selection vector — pick each organ's value from the canonical catalog (closed enums + generalized open sets), compose the agent/<name>.md vector, then resolve → verify → deploy; knows the organ anatomy. Can interview a non-engineer in plain language (one question per organ, recommending the fittest) when a human is driving.`,
  verb: `create-agent`,
  formalBlock: ``,
  composition: [],
  body: `

# create-agent

create-agent ≜ select one value per organ from the canonical catalog, compose the \`agent/<name>.md\` selection vector \`⊕{organ ↦ value}\`, then resolve → verify → deploy.

Reader binding (signify READER BINDING): the emitted vector is ρ=LLM — register=LLM, \`σ*_LLM\` anchors, \`organ <value>\` lines, no explanatory prose. The interview channel alone is ρ=human by the model (its sole reader is the human); there the enumerated catalog (\`agent-forge catalog\`) doubles as the plain-language script when a human is driving.

An agent is an **organ-selection vector**, not prose. The catalog is fixed and opinionated: most organs are **closed** model-native enums (pick one member); a few are **open** with a generalized opinionated set (pick the fittest). Do not mint new values inline — a genuine gap beyond the catalog is a corpus-mutation for the owner via exemplify, not a wizard answer.

## Protocol

1. Fix the agent's **name** and one-line purpose.
2. For each organ, enumerate its values with \`agent-forge catalog\` and select the fittest for the purpose. When a human is driving, present each organ's options with their one-line \`definiens\` and recommend the fittest; for \`set\` organs accept any subset.
3. Assemble the vector \`⊕{organ ↦ value}\`; write \`agent/<name>.md\` (front-matter \`kind: agent\`; H1 the name; body the \`organ <value>\` lines, multi as \`organ { <a> · <b> }\`).
4. \`provenance\` (lineage mark) + \`substrate\` (model/runtime) are **instance-bound** — auto-set (mint a fresh mark; default \`substrate\` to \`claude\`) unless told otherwise.
5. Resolve → verify (PASS gate; \`gate_agent_organ_refs\` must be clean) → deploy. For domain capabilities beyond the organ catalog, author skills via create-skill.

## The catalog (discover, never embed)

The value options are **not listed here** — they are the live corpus, enumerated on demand so this skill never drifts from it. Run \`agent-forge catalog\` (human table, grouped by organ) or \`agent-forge catalog --json\` (per organ: \`{ axis, kind, arity, values: [{ slug, definiens }] }\`). Each organ's \`kind\` says how to pick — \`enum\` (closed: one member) · \`open\`/\`coined\` (extensible: the fittest) — and \`arity\` says how many — \`scalar\` (one) · \`set\` (a subset). Choose per the agent's purpose from each value's \`definiens\`. \`provenance\` + \`substrate\` are instance-bound (step 4), not catalog picks. A genuine gap beyond the catalog is a corpus mutation via exemplify by the owner, never a wizard answer.

## Boundary

Configures an agent's **organs** from the canonical catalog only; mints no values (a real gap → exemplify by the corpus owner). Domain **skills** are create-skill's job.
`,
};
