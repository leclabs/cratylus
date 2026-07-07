import type { SkillCell } from '../toolkit/skill-cell.js';

export const introspect: SkillCell = {
  name: 'introspect',
  delineation: `per-organ def(o) vs independently-observed rt(o) · match · why(divergence) ∈ K · emit def-vs-runtime-table · summary material-divergences`,
  formalBlock: `DECLARATIONS

A          — the agent introspecting itself
O          — A's organ set: the SOUL anatomy \`##\` sections —
             { persona · role · formality · audience-adaptation · transparency ·
               autonomy · provenance · objective · engineering-principles · guardrails ·
               capabilities · situation-awareness · actions · modalities · model ·
               memory · trigger · framing · reasoning-strategy · satisficing ·
               output-format · self-evaluation · … }
V          — the organ-value space : one value · a value-set · \`unobservable\`

src_def    — DEFINITION sources : A's in-prompt SOUL (\`##\` sections) ∪ the canonical organ-vector agent/<A>.md (one selected value per organ)
src_rt     — RUNTIME sources, observed THIS session, INDEPENDENT of src_def : the live tool/action set · the live model (\`model\` organ) · the system prompt as given · the autonomy mode + any transient elevation · the deployed def front-matter (color · mark) · env · granted permissions

def        — def : O → V          the value organ o is DEFINED to hold (from src_def)
rt         — rt  : O → V          the value actually IN EFFECT (from src_rt)
match      — match : O → bool
div        — the divergent organs
K          — the divergence-cause taxonomy
why        — why : div → K        a cause assigned to each divergence

-- K members --
harness-override    — runtime substituted a value (tool gating · model pin · env)
deploy-drift        — stale/partial deploy : deployed def differs from source vector
profile-projection  — def projected at a reader/profile that reshaped the value
transient-elevation — a session act flipped it (e.g. carry-on : autonomy human-on-the-loop ↦ human-out-of-the-loop)
composer-dropped    — projection lost a facet (the color/mark regression class)
env-conditioned     — a host/env fact changed the effective value
unobservable        — runtime value not inspectable ; report as such, never guess

=== introspect : (A) → report ===

observe-independently — rt(o) read from src_rt ALONE ; rt(o) ≜ def(o) FORBIDDEN (vacuous — hides every divergence)

def(o)   ∈ V                                  , o ∈ O
rt(o)    ∈ V                                  , o ∈ O    -- OBSERVED, never inferred
match(o) ≜ ( def(o) = rt(o) )                            -- equal in EFFECT, not in spelling
div      ≜ { o ∈ O | ¬ match(o) }
why(o)   ∈ K                                  , o ∈ div  -- honest \`unobservable\` allowed

row(o)   ≜ ( o, def(o), rt(o), match(o), why(o) when o ∈ div )
report   ≜ ( { row(o) | o ∈ O } , summary(div, why) )

-- emit one row per organ ; the summary lists only the MATERIAL divergences + causes`,
  composition: [],
  body: `

# introspect

introspect ≜ agent def-vs-runtime self-audit · per organ: DEFINED value vs INDEPENDENTLY-OBSERVED runtime · name the cause of every divergence.

Standalone self-audit — no sibling composed; the agent reads its own anatomy two ways and reconciles. Cardinal rule: **observe runtime independently — never read it off the definition** (assuming rt=def is the blind spot that hides drift — a SOUL declaring \`provenance → cyan\` while the deployed def carries no \`color\`). Resolve from context:

- \`A\` — the agent running this skill (self); its anatomy = the organ \`##\` sections of its in-prompt SOUL.
- \`\${AGENT_HOME}\` — A's sidecar home; deployed def \`~/.claude/agents/<A>.md\`, canonical source vector the corpus \`agent/<A>.md\`.

Symbol table: \`src/toolkit/operator-lexicon.ts\`.

\`\`\`text
DECLARATIONS

A          — the agent introspecting itself
O          — A's organ set: the SOUL anatomy \`##\` sections —
             { persona · role · formality · audience-adaptation · transparency ·
               autonomy · provenance · objective · engineering-principles · guardrails ·
               capabilities · situation-awareness · actions · modalities · model ·
               memory · trigger · framing · reasoning-strategy · satisficing ·
               output-format · self-evaluation · … }
V          — the organ-value space : one value · a value-set · \`unobservable\`

src_def    — DEFINITION sources : A's in-prompt SOUL (\`##\` sections) ∪ the canonical organ-vector agent/<A>.md (one selected value per organ)
src_rt     — RUNTIME sources, observed THIS session, INDEPENDENT of src_def : the live tool/action set · the live model (\`model\` organ) · the system prompt as given · the autonomy mode + any transient elevation · the deployed def front-matter (color · mark) · env · granted permissions

def        — def : O → V          the value organ o is DEFINED to hold (from src_def)
rt         — rt  : O → V          the value actually IN EFFECT (from src_rt)
match      — match : O → bool
div        — the divergent organs
K          — the divergence-cause taxonomy
why        — why : div → K        a cause assigned to each divergence

-- K members --
harness-override    — runtime substituted a value (tool gating · model pin · env)
deploy-drift        — stale/partial deploy : deployed def differs from source vector
profile-projection  — def projected at a reader/profile that reshaped the value
transient-elevation — a session act flipped it (e.g. carry-on : autonomy human-on-the-loop ↦ human-out-of-the-loop)
composer-dropped    — projection lost a facet (the color/mark regression class)
env-conditioned     — a host/env fact changed the effective value
unobservable        — runtime value not inspectable ; report as such, never guess

=== introspect : (A) → report ===

observe-independently — rt(o) read from src_rt ALONE ; rt(o) ≜ def(o) FORBIDDEN (vacuous — hides every divergence)

def(o)   ∈ V                                  , o ∈ O
rt(o)    ∈ V                                  , o ∈ O    -- OBSERVED, never inferred
match(o) ≜ ( def(o) = rt(o) )                            -- equal in EFFECT, not in spelling
div      ≜ { o ∈ O | ¬ match(o) }
why(o)   ∈ K                                  , o ∈ div  -- honest \`unobservable\` allowed

row(o)   ≜ ( o, def(o), rt(o), match(o), why(o) when o ∈ div )
report   ≜ ( { row(o) | o ∈ O } , summary(div, why) )

-- emit one row per organ ; the summary lists only the MATERIAL divergences + causes
\`\`\`

## Procedure

1. **Enumerate \`O\`** — A's organs from the \`##\` sections of its in-prompt SOUL.
2. **Read \`def(o)\`** — the selected value per organ (the SOUL section; cross-check the canonical \`agent/<A>.md\` vector when reachable).
3. **Observe \`rt(o)\` independently** — per organ inspect the actual runtime: actions vs the real tool set · model vs the live model · autonomy vs the mode + any carry-on elevation · provenance vs the deployed-def \`color\`/mark · modalities/trigger/env vs session reality. Never copy \`def(o)\`.
4. **Compare + diagnose** — compute \`match(o)\`; for each \`o ∈ div\`, assign \`why(o) ∈ K\`.
5. **Emit \`report\`** — a per-organ table \`organ | defined | runtime | match? | why\`, then a summary of material divergences. Mark any \`unobservable\` honestly rather than guessing.

## Boundary

Read-only self-audit: introspect REPORTS def-vs-runtime; neither edits the organ-vector (/create-agent) nor redeploys to reconcile drift (toolkit deploy). Mints no organ values — \`O\` and \`K\` are read from the live anatomy.
`,
};
