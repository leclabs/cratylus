import type { Skill, SkillExpression } from '@leclabs/agent-forge/anatomy';
import { introspect } from '../introspect/skill.js';

const EVENT_TAP_BLOCK = `event-tap    ≜ install → observe → read → remove
capability   ≜ eventTap ⟨runtime-bound ; every verb reached as \`scripts/eventTap.mjs <verb>\`⟩
verb         ∈ { install · remove · read · status }
lifecycle    ≜ the harness-neutral moment taxonomy ⟨session.start · session.end · prompt.submit · turn.end · tool.use.pre · tool.use.post · subagent.start · context.compact.pre · … ⟩
E            ⊆ lifecycle
sink         ≜ append-only capture path ⟨one record per line⟩
record       ≜ ⟨event ∈ lifecycle, payload⟩
order(read)  ≜ position ⟨∄ fabricated timestamp⟩
target       ≜ the harness settings file ⟨\`--settings <path>\` ; absent ↦ $CLAUDE_SETTINGS_PATH ∨ the cwd default⟩
target₀      ≜ target before install
foreign      ≜ every target key ∧ every hook entry this tap did not write
attached     : target → 𝔹

install(E, sink) ≜ \`scripts/eventTap.mjs install --events <e₁,e₂,…> --sink <path>\` ∴ attached(target)
remove           ≜ \`scripts/eventTap.mjs remove\` ∴ ¬ attached(target)
read             ≜ \`scripts/eventTap.mjs read\` ↦ { record }
status           ≜ \`scripts/eventTap.mjs status\` ↦ ⟨attached(target), E⟩

passive ⊨ ¬ block ∧ ¬ deny ∧ ¬ mutate(host-control-flow) ⟨observe only ; ∀ verb⟩
remove ∘ install ⊨ target ≡ target₀ ∧ foreign preserved ⟨zero residue⟩
e ∈ E ∧ e ∉ lifecycle ⇒ ⊥ ⟨loud⟩
verb ∉ { install · remove · read · status } ⇒ ⊥ ⟨loud⟩
E = ∅ ⇒ ¬ attached(target)
¬ attached(target) ⇒ read ↦ ∅
status ≜ derived from target ⟨¬ in-memory ∴ a fresh process reads the same truth⟩
observe ≜ the host writes each occurrence of E to sink ⟨∄ agent turn between fire ∧ capture⟩
self-observation ≜ install ↾ own-lifecycle ∴ read ⊨ evidence(own-behavior) ⟨¬ recollection⟩
install ⊨ remove owed ⟨an unremoved tap outlives the question it was installed to answer⟩` as SkillExpression;

export const eventTap: Skill = {
  name: 'event-tap',
  description: `use this skill to attach a passive observer to an agent's own lifecycle — install a tap on a chosen set of harness-neutral events (session.start, turn.end, tool.use.pre, …), let the host append each occurrence to a capture sink, read the captured records back as evidence of what actually happened, and remove the tap with zero residue; the four verbs are install, remove, read, status, and the tap never blocks, denies, or alters what it observes.`,
  formalBlock: EVENT_TAP_BLOCK,
  runtime: { capability: 'eventTap' },
  composition: () => [introspect],
};
