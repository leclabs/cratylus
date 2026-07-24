import type { Autonomy } from '@leclabs/agent-forge/anatomy';

// Loop-position is phase-STATE, not a static value: it changes within a session
// (orientation = on-the-loop; execution = out-of-the-loop). This value declares the
// RESTING / initial position — a session opens in orientation, where intent is the
// operator's to set. The LIVE position is session state, transitioned to
// out-of-the-loop by `carry-on` and held (persisting) until the bound praxis
// completes or an unresolvable fork re-enters on-the-loop. See skills/carry-on.
export const humanOnTheLoop: Autonomy = `human-on-the-loop`;
