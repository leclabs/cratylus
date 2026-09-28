import type { Skill, SkillExpression } from '../../manifest.js';

// THE NOTEBOOK'S OWN RULES, and no one else's. This cell routes the reader's notebook
// intents to the `note` capability and is the one home of the three kinds: the
// runtime carries a kind as a label it never interprets, so nothing else spells them.
//
// It rectifies an earlier ledger skill kept outside this corpus. That one addressed a
// note by a sequential number, grew a note in place by appending "derived" material
// beside a frozen definition, treated a withdrawal as one more kind, and taught its
// reader the mechanics of how the ledger was stored. Here a note is addressed by its
// title, every change is a whole new version, withdrawal is a verb, and the reader meets
// only notes. No kind is privileged to block: any live note that names a plan or unit
// owes a ruling, whatever its kind.
//
// COMPOSES NOTHING. The `runtime` capability below is the real coupling; its verbs take
// the notebook's words and nothing borrowed.

const NOTE_BLOCK = `note         ≜ show → capture → revise → retract → reconcile
route        ≜ \`scripts/note.mjs <verb>\` ⟨runtime-bound : every verb reaches the note capability⟩
verb         ∈ { show · capture · revise · retract · reconcile }
notebook     ≜ the set of notes ⟨ideas, questions ∧ decisions ¬ yet canonical⟩
n            ≜ a note ⟨n ∈ notebook⟩
title(n)     ≜ the note's name
kind(n)      ∈ { idea · question · decision } ⟨a label the runtime never interprets⟩
topic(n)     ≜ what the note is about ⟨the notebook groups by kind, then topic⟩
body(n)      ≜ the note's whole statement
blocks(n)    ≜ the plans ∧ units n names ⟨a plan by its name · a unit as \`u of plan p\`, bare u only where the unit's name is its own⟩
live(n)      ≜ n captured ∧ ¬ retracted
versions(n)  ≜ the competing versions of n a merge left standing
diverged(n)  ⇔ versions(n) disagree
owed(n)      ⇔ live(n) ∧ blocks(n) ≠ ∅ ⟨an owed ruling⟩
by           ≜ \`--author <who> --reason <why> --cause <what caused it>\` ⟨every write carries it⟩

show(n?)     ≜ \`scripts/note.mjs show [<title>]\` ↦ owed rulings ∧ diverged notes first, then the notebook by kind, then topic ∨ n in full ⟨every version of a diverged n⟩
capture(n)   ≜ \`scripts/note.mjs capture <title> --kind <k> --topic <t> --body <b> [--blocks <plan or unit>]… <by>\`
revise(n)    ≜ \`scripts/note.mjs revise <title> [--title <new title>] [--kind <k>] [--topic <t>] [--body <b>] [--blocks <plan or unit>]… <by>\` ⟨a field left out carries over ; \`--blocks ''\` ↦ blocks(n) = ∅⟩
retract(n)   ≜ \`scripts/note.mjs retract <title> <by>\`
reconcile(n) ≜ \`scripts/note.mjs reconcile <title> [--title …] [--kind …] [--topic …] [--body …] [--blocks …]… <by>\` ↦ one version over every version ⟨each field the versions disagree on is given⟩

a note's title is its name ⟨one live note per title⟩ ∴ n is addressed by title(n) as show prints it ⟨∄ matching on a fragment of its body⟩
anyone ⊨ capture ∧ revise ∧ retract ∧ reconcile
capture ⊨ ∄ admission bar ⟨the note's shape ∧ one live note per title suffice⟩
changed(n) ⇒ revise(n) ⟨¬ edited in place ; \`--title\` retitles n⟩
owed(n) ⇒ n blocks every t ∈ blocks(n) ⟨whatever its kind⟩ until retract(n) ∨ revise(n) ↦ blocks(n) = ∅
diverged(n) ⇒ n blocks ⋃ { blocks(v) | v ∈ versions(n) } until reconcile(n)
diverged(n) ⇒ reconcile(n) ≺ every other write to n
verb ∉ { show · capture · revise · retract · reconcile } ⇒ ⊥ ⟨loud⟩` as SkillExpression;

export const note: Skill = {
  name: 'note',
  description: `use this skill to keep the project's notebook of notes not yet canonical, whenever one surfaces in the work or to see what is still owed: show the whole notebook or one note, capture a note under its title with a kind, topic and body, revise it (retitle it too), retract it, or reconcile one a merge left in competing versions. Anyone may capture, with no admission bar, and any live note that names a plan or unit blocks it until it is retracted or revised to block nothing.`,
  formalBlock: NOTE_BLOCK,
  runtime: { capability: 'note' },
  composition: () => [],
};
