import type { SkillCell } from '../toolkit/skill-cell.js';

export const introspect: SkillCell = {
  name: 'introspect',
  trigger: `/introspect`,
  delineation: `use this skill to introspect an agent's organ configuration — recover each organ's DEFINED value (its SOUL / organ-vector selection) and INDEPENDENTLY observe the runtime value actually in effect this session, compare organ-by-organ, and for every divergence name the cause (harness override · deploy drift · profile projection · transient elevation like carry-on · composer-dropped facet · unobservable); emits a per-organ def-vs-runtime table plus a summary of material divergences. Reach for it to self-audit configuration or to chase a definition↔runtime mismatch (the color/mark regression class).`,
  verb: `introspect`,
  formalBlock: `DECLARATIONS

A          — the agent introspecting itself
O          — A's organ set: the anatomy sections of its SOUL
             {persona, role, formality, audience-adaptation, transparency,
              autonomy, provenance, objective, engineering-principles, guardrails,
              capabilities, situation-awareness, actions, modalities, model,
              memory, trigger, framing, reasoning-strategy, satisficing,
              output-format, self-evaluation, ...}
V          — the space of organ values (one value, a set of values, or \`unobservable\`)

src_def    — DEFINITION sources: A's in-prompt SOUL (## organ sections) and the
             canonical organ-vector agent/<A>.md (one selected value per organ)
src_rt     — RUNTIME sources, observed THIS session, INDEPENDENT of src_def:
             the actual tool / action set, the live model (the \`model\` organ), the
             system prompt as given, the autonomy mode + any transient elevation,
             the deployed def front-matter (color / mark), env, granted permissions

def        — def : O → V          the value organ o is DEFINED to hold (from src_def)
rt         — rt  : O → V          the value actually IN EFFECT (from src_rt)
match      — match : O → bool
div        — the divergent organs
K          — the divergence-cause taxonomy
why        — why : div → K        a cause assigned to each divergence

K-members:
  harness-override    — the runtime substituted a value (tool gating, model pin, env)
  deploy-drift        — stale or partial deploy: deployed def differs from source vector
  profile-projection  — def projected at a reader / profile that reshaped the value
  transient-elevation — a session act flipped it (e.g. carry-on: autonomy
                        human-on-the-loop becomes human-out-of-the-loop)
  composer-dropped    — projection lost a facet (the color / mark regression class)
  env-conditioned     — a host / env fact changed the effective value
  unobservable        — runtime value not inspectable; report as such, never guess

=== introspect : (A) → report ===

observe-independently — rt(o) is read from src_rt ALONE; defining rt(o) ≜ def(o)
                        is FORBIDDEN (vacuous — it would hide every divergence)

def(o)   ∈ V                                  , o ∈ O
rt(o)    ∈ V                                  , o ∈ O    -- OBSERVED, never inferred
match(o) ≜ ( def(o) = rt(o) )                            -- equal in EFFECT, not in spelling
div      ≜ { o ∈ O | ¬ match(o) }
why(o)   ∈ K                                  , o ∈ div  -- honest \`unobservable\` allowed

row(o)   ≜ ( o, def(o), rt(o), match(o), why(o) when o ∈ div )
report   ≜ ( { row(o) | o ∈ O } , summary(div, why) )

-- emit one row per organ; the summary lists only the MATERIAL divergences + causes`,
  composition: [],
  body: `

# introspect

introspect ≜ the agent's definition-vs-runtime self-audit: per organ, compare the DEFINED value against an INDEPENDENTLY-OBSERVED runtime value, and name the cause of every divergence.

A standalone self-audit — no sibling skill is composed; the agent reads its own anatomy two ways and reconciles them. The cardinal rule: **observe the runtime independently — never read it off the definition.** Assuming runtime equals the def is the exact blind spot that hides drift (a SOUL declaring \`provenance → cyan\` while the deployed def carries no \`color\` at all). Resolve from context:

- \`A\` — the agent running this skill (self); its anatomy is the organ sections of its in-prompt SOUL.
- \`\${AGENT_HOME}\` — A's sidecar home; the deployed def is \`~/.claude/agents/<A>.md\`, the canonical source vector is the corpus \`agent/<A>.md\`.

Symbol table: \`references/formal-symbolic-notation.md\`.

\`\`\`text
DECLARATIONS

A          — the agent introspecting itself
O          — A's organ set: the anatomy sections of its SOUL
             {persona, role, formality, audience-adaptation, transparency,
              autonomy, provenance, objective, engineering-principles, guardrails,
              capabilities, situation-awareness, actions, modalities, model,
              memory, trigger, framing, reasoning-strategy, satisficing,
              output-format, self-evaluation, ...}
V          — the space of organ values (one value, a set of values, or \`unobservable\`)

src_def    — DEFINITION sources: A's in-prompt SOUL (## organ sections) and the
             canonical organ-vector agent/<A>.md (one selected value per organ)
src_rt     — RUNTIME sources, observed THIS session, INDEPENDENT of src_def:
             the actual tool / action set, the live model (the \`model\` organ), the
             system prompt as given, the autonomy mode + any transient elevation,
             the deployed def front-matter (color / mark), env, granted permissions

def        — def : O → V          the value organ o is DEFINED to hold (from src_def)
rt         — rt  : O → V          the value actually IN EFFECT (from src_rt)
match      — match : O → bool
div        — the divergent organs
K          — the divergence-cause taxonomy
why        — why : div → K        a cause assigned to each divergence

K-members:
  harness-override    — the runtime substituted a value (tool gating, model pin, env)
  deploy-drift        — stale or partial deploy: deployed def differs from source vector
  profile-projection  — def projected at a reader / profile that reshaped the value
  transient-elevation — a session act flipped it (e.g. carry-on: autonomy
                        human-on-the-loop becomes human-out-of-the-loop)
  composer-dropped    — projection lost a facet (the color / mark regression class)
  env-conditioned     — a host / env fact changed the effective value
  unobservable        — runtime value not inspectable; report as such, never guess

=== introspect : (A) → report ===

observe-independently — rt(o) is read from src_rt ALONE; defining rt(o) ≜ def(o)
                        is FORBIDDEN (vacuous — it would hide every divergence)

def(o)   ∈ V                                  , o ∈ O
rt(o)    ∈ V                                  , o ∈ O    -- OBSERVED, never inferred
match(o) ≜ ( def(o) = rt(o) )                            -- equal in EFFECT, not in spelling
div      ≜ { o ∈ O | ¬ match(o) }
why(o)   ∈ K                                  , o ∈ div  -- honest \`unobservable\` allowed

row(o)   ≜ ( o, def(o), rt(o), match(o), why(o) when o ∈ div )
report   ≜ ( { row(o) | o ∈ O } , summary(div, why) )

-- emit one row per organ; the summary lists only the MATERIAL divergences + causes
\`\`\`

## Procedure

1. **Enumerate \`O\`** — list A's organs from the \`##\` sections of its in-prompt SOUL.
2. **Read \`def(o)\`** — the selected value per organ (the SOUL section; cross-check the canonical \`agent/<A>.md\` vector when reachable).
3. **Observe \`rt(o)\` independently** — for each organ inspect the actual runtime: actions against the real tool set, model against the live model, autonomy against the mode + any carry-on elevation, provenance against the deployed-def \`color\` / mark, modalities / trigger / env against session reality. Never copy \`def(o)\`.
4. **Compare + diagnose** — compute \`match(o)\`; for each \`o ∈ div\`, assign \`why(o) ∈ K\`.
5. **Emit \`report\`** — a per-organ table \`organ | defined | runtime | match? | why\`, then a summary of material divergences. Mark any \`unobservable\` honestly rather than guessing.

## Boundary

A read-only self-audit: introspect REPORTS def-vs-runtime; it neither edits the organ-vector (that is /create-agent) nor redeploys to reconcile drift (that is the toolkit deploy). It mints no organ values — \`O\` and \`K\` are read from the live anatomy.
`,
};
