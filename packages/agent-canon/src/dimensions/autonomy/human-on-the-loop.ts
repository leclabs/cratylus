import type { Autonomy } from '@leclabs/agent-forge/anatomy';

// Loop-position is one of the three orthogonal autonomy axes (who-decides /
// where-the-human-sits / when-to-escalate); this cell is the where-the-human-sits
// axis. Unlike the decision-authority pole and the escalation directive, it is
// phase-STATE, not a static value: the `⟨resting · phase-state⟩` residue declares
// this as the RESTING / initial position (a session opens in orientation, intent
// the operator's to set) while marking that the live position shifts —
// `carry-on` elevates it to out-of-the-loop, held until the bound praxis
// completes or an unresolvable fork re-enters on-the-loop. See skills/carry-on.
export const humanOnTheLoop: Autonomy = `human-on-the-loop ⟨resting · phase-state⟩`;
