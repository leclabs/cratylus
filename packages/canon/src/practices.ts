// ─────────────────────────────────────────────────────────────────────────────
// THE PRACTICES THIS CORPUS OFFERS, and the plumbing they all depend on.
//
// A practice is a way of working an install offers as ONE choice: the agents, skills
// and hooks that carry it, installed together. Which practices exist is declared
// here, as data on the plugin; an install only offers them, and projection renders
// whichever are chosen (`AgentPlugin.practices`).
//
// WHAT A PRACTICE LISTS, AND WHAT IT DOES NOT. It lists its AGENTS, the roles they
// dispatch to included, because a practice is closed under dispatch and the closure
// is checked against `Agent.dispatches`. The architect role dispatches the planner,
// implementer, assayer and integrator, so every practice that places an architect
// lists those four beside it. It lists SKILLS only where no agent carries them: a
// skill an agent is given travels with the agent, and whatever a skill composes
// travels with it. A guard (a hook cell that binds a composition) is listed nowhere:
// it is registered exactly when a rendered agent composes what it binds.
//
// The practice names are signs of THIS corpus's own making; the consumer-facing
// description is the one line an install shows beside each.
// ─────────────────────────────────────────────────────────────────────────────

import type { Plumbing, Practice } from '@cratylus/schema';

/** The architect role's dispatch, as agent names: what a practice that places an
 *  architect-holder must also place. */
const WRITERS = ['planner', 'implementer', 'assayer', 'integrator'] as const;

export const PRACTICES: readonly Practice[] = [
  {
    name: 'cdd',
    description:
      'Concept-driven development: an architect holds the design and hands it out, a planner cuts it into units, an implementer builds each one, an assayer judges it against the design, and an integrator makes the approved work whole.',
    agents: ['mav', 'architect', ...WRITERS],
    preselected: true,
  },
  {
    name: 'corpus-authoring',
    description:
      'Author the corpus of named concepts itself: discover the signs a model already holds, canonize them, and write the agents and skills that carry them.',
    agents: ['nico', ...WRITERS],
    skills: [
      'signify',
      'probe',
      'elicit',
      'conceptualize',
      'exemplify',
      'materialize',
      'formalize',
      'create-agent',
      'create-skill',
      'introspect',
    ],
  },
  {
    name: 'film-production',
    description:
      'Make films with software: a film-floor architect holds what the craft requires and hands the building to the same planner-to-integrator line.',
    agents: ['kino', ...WRITERS],
  },
  {
    name: 'carry-on',
    description:
      'Say "carry on" and the agent returns to autonomous execution under the authority it already holds, with no other agent installed.',
    agents: [],
    skills: ['carry-on'],
  },
];

/**
 * What every practice is installed with and none is offered as. The event tap and
 * what it composes are what the runtime's lifecycle capture stands on; the drift
 * notice is a session-wide hook that binds no agent and tells the operator when a
 * deployed tree has fallen behind the corpus it was projected from.
 */
export const PLUMBING: Plumbing = {
  skills: ['event-tap'],
  hooks: ['deploy-drift-notice'],
};
