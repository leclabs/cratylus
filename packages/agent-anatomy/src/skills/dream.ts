import type { SkillCell } from '../toolkit/skill-cell.js';

export const dream: SkillCell = {
  name: 'dream',
  trigger: `/dream`,
  delineation: `use this skill to consolidate an agent's memory — distil the raw EPISODIC stream and route each item by two orthogonal axes (type/voice picks the organ, scope picks the instance): identity rises to SELF, durable knowledge to MEMORY, directives to the scoped AGENTS.md, networked reference to the vault, next-steps stay in EPISODIC, the rest is dropped; consumed raw is cleared; SOUL is never written.`,
  verb: `Dream Skill`,
  formalBlock: `node ~/.claude/skills/memory/episodic.mjs read --home \${AGENT_HOME}`,
  composition: ['exemplify', 'materialize'],
  body: `

# Dream Skill

dream ≜ the memory-consolidation ritual : EPISODIC → { SELF, MEMORY, AGENTS.md, vault, EPISODIC } · applies [[exemplify]] then materializes via [[materialize]]

The agent's "sleep" — sleep-dependent consolidation (replay → schema) run as an explicit step. dream is step 1 of the [[wake]] sequence. Symbol table: \`references/formal-symbolic-notation.md\`.

Absorbed declarations (this skill is self-sufficient — no concept is referenced out):

- **memory** ≜ the agent's organ-home: the layer-set \`{ SELF, MEMORY, EPISODIC }\` (each at \`\${AGENT_HOME}/<layer>.md\`/\`.jsonl\`) plus the bundled \`episodic.mjs\` store, verb-set \`V = {encode, read, drain, migrate, audit}\`. \`encode\` is down-and-in (events recorded as they happen); \`dream\` is the **up-and-out** counterpart in the same home. **promotion-is-move**: a promoted item must be gone from its raw source. Layer meanings: \`SELF\` = the agent's identity/standing dispositions; \`MEMORY\` = durable resident knowledge (the hot index); \`EPISODIC\` = the raw time-ordered event stream + forward-looking next-steps. \`SOUL\` (the archetype) is **not** a dream output — the archetype changes only in the commons.
- **scope** ≜ the record's second axis, tagged at encode: \`scope(i) ∈ { user, project:<key>, plan:<key>/<plan> }\` (\`<key>\` = repo basename). The lattice \`user ⊃ project ⊃ plan\`; the law is **least-scope** — a memory homes at the narrowest scope containing every context it is relevant to; widening demands evidence. Raw capture is single-store (always the agent home log); scope is a ROUTING tag, never a raw-store selector.
- **two-axis routing** ≜ [[memory]]'s placement law — each consolidated item is placed by two orthogonal axes: **type/voice → organ** (identity vs durable-knowledge vs networked-ref vs next-step), **scope → instance** (which SELF/MEMORY/AGENTS.md/vault). An \`AGENTS.md\` at project/plan scope IS the semantic organ at that scope — part of the memory system; writing it is consolidation (dedup · net-current · move-not-copy — MEMORY's laws, applied mechanically). dream adds the two consolidation-only outcomes the resident store has no slot for: \`EPISODIC\` (kept) and \`drop\`.
- **reboot-seed-not-journal** (self-application) ≜ the product is a **reboot seed**, never a journal; the dream must itself round-trip — a wake-time read of the residue must reconstruct the agent's working state equivalent-or-better.
- **context-not-prose** (R=LLM) ≜ emit at densest-faithful, symbol-bearing register; never human narration. \`¬graspable-in-one-glance(entry) ⇒ distill-further(entry) ∨ drop(entry)\`.
- **palimpsest** ≜ a scar carried up as narrative, or a stale fact left overwriting a newer one. The anti-pattern dream removes: a superseded resident fact is **deleted**, not layered over.

Resolve from context:

- \`\${AGENT_HOME}\` — the agent's absolute sidecar home; each layer lives at \`\${AGENT_HOME}/<layer>.md\` for \`<layer> ∈ {SELF, MEMORY, EPISODIC}\`. Resolve per host from \`~\` (\`~/.claude/agents/<name>\`), never a baked absolute path.

## 1. Distillation

Read the raw stream via the store's \`read\` verb (the store is the source of truth):

\`\`\`text
node ~/.claude/skills/memory/episodic.mjs read --home \${AGENT_HOME}
\`\`\`

\`\`\`text
E ≜ raw items read from \${AGENT_HOME}/EPISODIC.jsonl

dream ≜ exemplify : E → I                                -- consolidation is exemplify applied to the raw stream

∀ i ∈ I :
    i = densest-faithful-point(i)                        -- context-not-prose: densest faithful, ¬narration
    instances-governing-exemplar(i) ⇒ i ↦ pointer        -- cite, don't copy
\`\`\`

## 2. Routing

route(I) by the two-axis routing — scope picks the instance FIRST, then type/voice picks the organ:

\`\`\`text
route : I → homes ∪ { EPISODIC, drop }         -- re-judge scope(i) at dream (least-scope), the encode tag is the prior
scope(i) = plan:<key>/<plan> ↦ plans/<plan>/AGENTS.md    -- semantic AND next-steps/open-threads: the thread lives with the plan
scope(i) = project:<key>     ↦ <repo>/AGENTS.md          ( voluminous ⇒ <repo>/docs/ -- the vault rule at scope )
scope(i) = user :
    identity-level(i)  ↦ SELF
    durable(i)         ↦ MEMORY    ( ¬resident-worthy ⇒ vault     -- hot index → cold corpus )
    networked-ref(i)   ↦ vault
    next-step          ↦ EPISODIC   -- forward-looking, not yet durable
scaffold               ↦ drop       -- graduates nowhere

INVARIANT (pollution-free, hard) : scope(i) ∈ {project, plan} ⇒ i ∉ SELF ∧ i ∉ MEMORY
    a cross-project lesson extracted FROM project work is re-tagged user by the dream reasoning —
    the generalized law rises, the project fact stays at scope
AGENTS.md write = consolidation : dedup · net-current (no scar) · move-not-copy
\`\`\`

## 3. Clearing

Clear drained raw via the runtime's \`drain\` verb — \`node ~/.claude/skills/memory/episodic.mjs drain --home \${AGENT_HOME}\` (archives a rotated keep-newest-N backup under \`.bak/\` first) — never a hand-rolled copy/truncate. This realizes promotion-is-move: a promoted item is gone from its raw source.

\`\`\`text
consumed raw → ∅            ∴ EPISODIC never grows unbounded   (drain: verified .bak archive, then clear)
∀ home : home keeps only its proper residue
\`\`\`

## 4. Integrated Cascade

\`\`\`text
EPISODIC ──dream──→ { SELF, MEMORY, EPISODIC, AGENTS.md, vault }

periodically : MEMORY ──dream──→ { SELF, MEMORY, vault }   -- depalimpsest resident set vs current ground-truth, ¬only drop stale
    identity-level(i)              ⇒ i → SELF
    durable ∧ ¬resident-worthy(i)  ⇒ i → vault     -- hot index → cold corpus
    superseded(i)                  ⇒ ∅              -- a newer resident fact overturned i's referent — palimpsest, ¬merely stale
    stale(i)                       ⇒ ∅

acceptance ≜ a wake-time read biases the very next action   -- reboot-seed-not-journal: round-trips equivalent-or-better
¬graspable-in-one-glance(entry) ⇒ distill-further(entry) ∨ drop(entry)
\`\`\`

## See also

- [[exemplify]] · [[materialize]] — the consolidation pipeline dream applies to the raw stream.
- [[wake]] — the read-and-resume counterpart; dream is step 1 of its sequence.
`,
};
