import type { SkillCell } from '../toolkit/skill-cell.js';

export const dream: SkillCell = {
  name: 'dream',
  trigger: `/dream`,
  delineation: `use this skill to consolidate an agent's memory — fold the raw EPISODIC stream (the tool computes each record's scope node from its cwd), then route by type: agent-intrinsic identity/facts to SEMANTIC, generalized cross-project wisdom to PROCEDURAL (only what no projection already carries), scoped knowledge and next-steps to the node's AGENTS.md, networked reference to the vault, the rest dropped; consumed raw is drained; SOUL is never written.`,
  verb: `Dream Skill`,
  formalBlock: `node ~/.claude/skills/memory/episodic.mjs read --home \${AGENT_HOME}`,
  composition: ['exemplify', 'materialize'],
  body: `

# Dream Skill

dream ≜ the memory-consolidation ritual : EPISODIC → { AGENTS.md@node, SEMANTIC, PROCEDURAL, vault, EPISODIC } · applies [[exemplify]] then materializes via [[materialize]]

The agent's "sleep" — sleep-dependent consolidation (replay → schema) run as an explicit step. dream is step 1 of the [[wake]] sequence. Symbol table: \`references/formal-symbolic-notation.md\`.

Absorbed declarations (this skill is self-sufficient — no concept is referenced out):

- **memory** ≜ the agent's organ-home: the store-set \`{ SEMANTIC, PROCEDURAL, EPISODIC }\` (at \`\${AGENT_HOME}/<store>.md\`/\`.jsonl\`) plus the bundled \`episodic.mjs\` runtime, verb-set \`V = {encode, read, node, fold, drain, migrate, audit, lock}\`. \`encode\` is down-and-in (events recorded as they happen); \`dream\` is the **up-and-out** counterpart in the same home. **promotion-is-move**: a promoted item must be gone from its raw source. Store meanings: \`SEMANTIC\` = identity facts + durable agent-intrinsic knowledge (the hot index); \`PROCEDURAL\` = inductively generalized cross-project wisdom no projection already carries; \`EPISODIC\` = the raw time-ordered event stream + forward-looking next-steps. \`SOUL\` (the archetype) is **not** a dream output — the archetype changes only in the commons.
- **node** ≜ the record's scope, COMPUTED never captured: \`node(cwd, host)\` = the nearest ancestor of the record's \`cwd\` (reflexive) holding a boundary marker (\`.git\` → project · package manifest → package · \`PLAN.md\` → plan · \`$HOME\` → user; markerless cwd = its own boundary; \`.git\` FILE resolves through to the primary checkout; cwd-less records → the \`legacy\` bucket). The tool's \`fold\` verb computes it — the dream never reasons a scope, it consumes the manifest.
- **fold-then-route** ≜ [[memory]]'s placement law — pass 1 (tool): \`fold\` emits the byte-deterministic manifest \`{ id ↦ node | legacy, marker-basis }\`; pass 2 (dream): type/voice picks the organ within the manifest's node, multi-scope items split, a cross-project lesson generalizes to agent-intrinsic under the **projection-dedup bar** (already carried by SOUL/skills/gates ⇒ not stored). An \`AGENTS.md\` at a node IS the semantic organ at that scope; writing it is consolidation (dedup · net-current · move-not-copy). A caller-supplied scope anywhere is an inert tag, never routing.
- **reboot-seed-not-journal** (self-application) ≜ the product is a **reboot seed**, never a journal; the dream must itself round-trip — a wake-time read of the residue must reconstruct the agent's working state equivalent-or-better.
- **context-not-prose** (R=LLM) ≜ emit at densest-faithful, symbol-bearing register; never human narration. \`¬graspable-in-one-glance(entry) ⇒ distill-further(entry) ∨ drop(entry)\`.
- **palimpsest** ≜ a scar carried up as narrative, or a stale fact left overwriting a newer one. The anti-pattern dream removes: a superseded resident fact is **deleted**, not layered over.

Resolve from context:

- \`\${AGENT_HOME}\` — the agent's absolute sidecar home; the stores live at \`\${AGENT_HOME}/{SEMANTIC.md, PROCEDURAL.md, EPISODIC.jsonl}\`. Resolve per host from \`~\` (\`~/.claude/agents/<name>\`), never a baked absolute path.

**Precondition (shared partition):** \`lock acquire\` on \`\${AGENT_HOME}/dream.lock\` (O_EXCL; stale = age > 2h) before any write to {SEMANTIC, PROCEDURAL} or any drain — same-host sessions of one agent share these regardless of project. Held by a live other ⇒ skip consolidation this wake (raw is preserved; encode stays always-legal).

## 1. Fold + distillation

Pass 1 is the tool's: \`fold\` computes every record's node — the dream consumes the manifest, it never reasons a scope. Then read the records and distil:

\`\`\`text
node ~/.claude/skills/memory/episodic.mjs fold --home \${AGENT_HOME}   -- manifest: { id ↦ node | legacy, marker-basis }
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

route over the fold manifest — the node is given, type/voice picks the organ. The route is TOTAL:

\`\`\`text
route : I → { AGENTS.md@node, SEMANTIC, PROCEDURAL, vault, EPISODIC, drop }
node(i) = plan node    ↦ plans/<plan>/AGENTS.md   -- semantic AND next-steps/open-threads: the thread lives with the plan, depalimpsested on write
node(i) = project/package node ↦ <node>/AGENTS.md ( voluminous ⇒ <repo>/docs/ -- the vault rule at scope )
node(i) = $HOME ∨ legacy :
    identity ∨ agent-intrinsic-durable(i) ↦ SEMANTIC   ( ¬resident-worthy ⇒ vault )
    generalized-wisdom(i)                 ↦ PROCEDURAL  ( projection-carries(i) ⇒ drop -- the dedup bar )
    networked-ref(i)                      ↦ vault
    next-step(i)                          ↦ EPISODIC    -- own-node forward residue only
scaffold                                  ↦ drop

INVARIANT (pollution-free, hard) : node(i) ∉ {$HOME, legacy} ⇒ i ∉ SEMANTIC ∧ i ∉ PROCEDURAL
    a cross-project lesson extracted FROM project work generalizes (the law rises, the fact stays at its node)
IN-REPO LAW : dream writes in a repo = versioned AGENTS.md at nodes, nothing else; raw telemetry never
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
EPISODIC ──dream──→ { AGENTS.md@node, SEMANTIC, PROCEDURAL, EPISODIC, vault }

periodically : SEMANTIC ──dream──→ { SEMANTIC, PROCEDURAL, vault }   -- depalimpsest resident set vs current ground-truth, ¬only drop stale
    generalized-wisdom(i)          ⇒ i → PROCEDURAL ( projection-carries(i) ⇒ ∅ )
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
