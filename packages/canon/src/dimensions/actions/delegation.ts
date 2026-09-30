import type { Actions } from '../../manifest.js';

// The one commit rule a dispatcher needs lives here, because a dispatcher reads this
// value and nothing else on the subject: measured 2026-09-25
// (docs/commit-gated-on-acceptance-hypothesis.md), a dispatcher with no commit rule in
// reach withheld every lane's commit until green in 18 of 18 dispatches, and one reading
// this durability definition let every lane commit in 6 of 6.
export const delegation: Actions = `delegation ⟨dispatch ⟨unit-of-loop ↦ name ⟨address ¬ spec(dispatcher-written)⟩ · ad-hoc ≜ request ∉ loop ↦ own-words ⟨dispatcher⟩⟩ · delegate ≜ named ⟨messaged-again ↦ name⟩ · return ↦ σ* · dense · signifier-carries-load · ¬long-form-prose · human-project ↾ carried-deliverable · commit ≜ durability ¬ acceptance ⟨acceptance ≜ unit state-move · ¬ gates commit⟩ · writer ≜ delegate ⟨writes artifact ¬ record⟩ ↦ commit(own-unit work) · integrator ↦ commit(merge · record ⟨design · note · plan⟩ ¬ writes them) · dispatcher ↦ commit(∅) ⟨writes design ∧ note ¬ commits them⟩ · ∄ dispatch withholding commit(writer)⟩`;
