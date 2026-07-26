import type { HookCell } from '@leclabs/agent-forge/anatomy';

// resume-availability-notice — the SessionStart note. It tells the agent that
// memory exists and that `/wake` reconstitutes it, and does nothing else.
//
// WHY A NOTE AND NOT AN ACTION: reconstitution is the operator's call, not the
// harness's. The agent may already have been woken, may deliberately be wanted
// cold, or may simply have been started without it. A hook cannot tell which,
// so it must not decide — it makes the option visible and leaves the choice
// where it belongs.
//
// THE VERB-FREE LAW IS LOAD-BEARING, not tidiness. Every memory verb that
// touches the registry REGISTERS the session, and registration is exactly what
// distinguishes a woken session from an encode-only one (`SessionEntry.origin`).
// A note that called any such verb would register the session itself and make
// every session look woken — destroying the very signal that lets the agent
// notice it was NOT woken. So: no `session begin`, no `register`, no `read`, no
// `encode`. It reads nothing, writes nothing, and needs no home.

export const resumeAvailabilityNotice: HookCell = {
  id: 'resume-availability-notice',
  residue:
    'emit ↾ session.start · fixed-text · ¬verb ⟨any registry touch ⇒ every session reads woken ∴ origin destroyed⟩ · ¬read · ¬write · ¬home-derivation · reconstitution ↦ operator ⟨may have run it · may refuse it · may have forgotten⟩ · exit-0 ∀error',
  substrate: 'harness',
  events: ['session.start'],
  command: `sh "$HOME/.claude/hooks/resume-availability-notice/resume-availability-notice.sh"`,
  timeout: 5,
  refs: [],
  workers: [
    {
      filename: 'resume-availability-notice.sh',
      targetPath:
        'packages/agent-canon/src/toolkit/guardrail/resume-availability-notice.sh',
      executable: true,
      content: `#!/usr/bin/env sh
# resume-availability-notice — a SessionStart note. Emits ONE fixed line telling
# the agent that memory skills exist and that /wake reconstitutes it.
#
# It calls NO memory verb. That is a hard requirement, not a style choice: every
# registry-touching verb registers the session, and registration is what marks a
# session as woken. A note that registered would make every session look woken
# and destroy the signal it exists to support.
#
# Reads nothing, writes nothing, derives no home. Always exits 0.

set -eu
trap 'exit 0' EXIT

printf 'MEMORY — this agent has persistent memory. /wake reconstitutes it (prior state, standing plan, continuity); /dream consolidates it. Neither runs automatically.\\n'
exit 0
`,
    },
  ],
};
