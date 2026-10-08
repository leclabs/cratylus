import type { Autonomy } from '../../manifest.js';

// Loop-position is one of the three orthogonal autonomy axes (who-decides /
// where-the-human-sits / when-to-escalate); this cell is the where-the-human-sits
// axis. Unlike the decision-authority pole and the escalation directive, it is
// phase-STATE, not a static value: the `⟨resting · phase-state⟩` residue declares
// this as the RESTING / initial position (a session opens in orientation, intent
// the operator's to set) while marking that the live position is session-state.
export const humanOnTheLoop: Autonomy = `human-on-the-loop ⟨resting · phase-state⟩`;
