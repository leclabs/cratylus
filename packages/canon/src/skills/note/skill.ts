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

const NOTE_BLOCK =
  `note         ≜ show → capture → revise → resolve → retract → reconcile
route        ≜ \`scripts/note.mjs <verb>\` ⟨runtime-bound : every verb reaches the note capability⟩
verb         ∈ { show · capture · revise · resolve · retract · reconcile }
notebook     ≜ the set of notes ⟨ideas, questions ∧ decisions ¬ yet canonical⟩
n            ≜ a note ⟨n ∈ notebook⟩
title(n)     ≜ the note's name
kind(n)      ∈ { idea · question · decision } ⟨a label the runtime never interprets⟩
topic(n)     ≜ what the note is about ⟨the notebook groups by kind, then topic⟩
body(n)      ≜ the note's whole statement
blocks(n)    ≜ the plans ∧ units n names ⟨a plan by its name · a unit as \`u of plan p\`, bare u only where the unit's name is its own⟩
live(n)      ≜ n captured ∧ ¬ resolved ∧ ¬ retracted
versions(n)  ≜ the competing versions of n a merge left standing
diverged(n)  ⇔ versions(n) disagree
owed(n)      ⇔ live(n) ∧ blocks(n) ≠ ∅ ⟨an owed ruling⟩
holders(t)   ≜ { n | live(n) ∧ title(n) = t } ∪ { n | diverged(n) ∧ ∃ v ∈ versions(n) : title(v) = t }
incoherent(t) ⇔ |holders(t)| > 1 ⟨a merge left title t held by more than one note ; show prints each holder with its identity beside t⟩
by           ≜ \`--author <who> --reason <why> --cause <what caused it>\` ⟨every write carries it⟩

show(n?)     ≜ \`scripts/note.mjs show [<title>]\` ↦ owed rulings, diverged notes ∧ incoherent titles first, then the notebook by kind, then topic ∨ n in full ⟨every version of a diverged n · every holder of an incoherent title⟩
capture(n)   ≜ \`scripts/note.mjs capture <title> --kind <k> --topic <t> --body <b> [--blocks <plan or unit>]… <by>\`
revise(n)    ≜ \`scripts/note.mjs revise <title> [--title <new title>] [--kind <k>] [--topic <t>] [--body <b>] [--blocks <plan or unit>]… <by>\` ⟨a field left out carries over ; \`--blocks ''\` ↦ blocks(n) = ∅⟩
resolve(n)   ≜ \`scripts/note.mjs resolve <title> (--concept <anchor> ∨ --unit <u of plan p>) <by>\` ⟨n taken up ↦ what now carries it : exactly one flag, a live concept or a live unit⟩
retract(n)   ≜ \`scripts/note.mjs retract <title> <by>\` ⟨n withdrawn with nothing carrying it⟩
reconcile(n) ≜ \`scripts/note.mjs reconcile <title> [--title …] [--kind …] [--topic …] [--body …] [--blocks …]… [--concept … ∨ --unit …] <by>\` ↦ one version over every version ⟨each field the versions disagree on is given, a carrier included : versions that disagree on whether n is resolved, or on what carries it, need one⟩

a note's title is its name ⟨one live note per title⟩ ∴ n is addressed by title(n) as show prints it ⟨∄ matching on a fragment of its body⟩
anyone ⊨ capture ∧ revise ∧ resolve ∧ retract ∧ reconcile
capture ⊨ ∄ admission bar ⟨the note's shape ∧ one live note per title suffice⟩
changed(n) ⇒ revise(n) ⟨¬ edited in place ; \`--title\` retitles n⟩
owed(n) ⇒ n blocks every x ∈ blocks(n) ⟨whatever its kind⟩ until resolve(n) ∨ retract(n) ∨ revise(n) ↦ blocks(n) = ∅
diverged(n) ⇒ n blocks ⋃ { blocks(v) | v ∈ versions(n) } until reconcile(n)
diverged(n) ⇒ reconcile(n) ≺ every other write to n
incoherent(t) ⇒ for ONE h ∈ holders(t) ⟨h named exactly as show prints it, identity included⟩ : live(h) ⇒ revise(h) with \`--title\` ∨ retract(h) · diverged(h) ⇒ reconcile(h) ; until ¬ incoherent(t)
reconcile ↾ diverged(n) ⟨one note's competing versions ; never a title merely held by more than one note⟩
verb ∉ { show · capture · revise · resolve · retract · reconcile } ⇒ ⊥ ⟨loud⟩` as SkillExpression;

export const note: Skill = {
  name: 'note',
  description: `use this skill to keep the project's notebook of notes not yet canonical, whenever one surfaces in the work or to see what is still owed: show the whole notebook or one note, capture a note under its title with a kind, topic and body, revise it (retitle it too), resolve one taken up to the concept or unit that now carries it, retract one withdrawn with nothing carrying it, or reconcile one a merge left in competing versions; where a merge left one title held by two notes, repair one holder, named as show prints it: retitle or retract a live one, reconcile a diverged one. Anyone may capture, with no admission bar, and any live note that names a plan or unit blocks it until it is resolved, retracted or revised to block nothing.`,
  formalBlock: NOTE_BLOCK,
  runtime: { capability: 'note' },
  composition: () => [],
};
