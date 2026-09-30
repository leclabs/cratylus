import { fileOps as fileOps_actions } from '../dimensions/actions/file-ops.js';
import { missionCommand } from '../dimensions/autonomy/mission-command.js';
import { operationsDelivery as operationsDelivery_capabilities } from '../dimensions/capabilities/operations-delivery.js';
import { verificationTesting as verificationTesting_capabilities } from '../dimensions/capabilities/verification-testing.js';
import { honesty as honesty_guardrails } from '../dimensions/guardrails/honesty.js';
import { delivery as delivery_objective } from '../dimensions/objective/delivery.js';
import { react as react_reasoningStrategy } from '../dimensions/reasoning-strategy/react.js';
import { integrator as integrator_role } from '../dimensions/role/integrator.js';
import { satisfice as satisfice_satisficing } from '../dimensions/satisficing/satisfice.js';
import { executableTestOracle as executableTestOracle_selfEvaluation } from '../dimensions/self-evaluation/executable-test-oracle.js';
import type { RoleCell } from './hold.js';

// THE RUNG THAT MAKES APPROVED WORK WHOLE. It carries no `software-engineering`, and
// the absence is the same decision as `writes ≠ artifact` in its contract: this position
// combines and checks, and a holder whose capabilities included building would be one
// good intention away from repairing a red on the line.
//
// `deliver`, and it is the plan-side conduct of the loop, the skill that says what
// arrives here, in what order, and what goes back. Skill routing gives it with `design`,
// `plan` and `note`, so the position reads the records it commits without being handed
// them.

export const integratorRole: RoleCell = {
  sign: integrator_role,
  skills: ['deliver'],
  vector: {
    // `mission-command` and no `principal-self`: it is dispatched with a unit and a
    // commit, acts inside that intent, and answers with a fact. The one decision that
    // is not its own, releasing to main, it asks the operator for.
    autonomy: [missionCommand],
    // `delivery`: what this position produces is the integrated green whole, and a
    // combination it could not check is a delivery that did not happen. The phrase
    // carries the whole objective, so it is cited whole rather than paraphrased.
    objective: delivery_objective,
    guardrails: [honesty_guardrails],
    // `verification-testing` is the check itself; `operations-delivery` is the line and
    // the release it asks for. `software-engineering` is deliberately absent: see above.
    capabilities: [
      verificationTesting_capabilities,
      operationsDelivery_capabilities,
    ],
    // `file-ops`, for the git acts the contract reserves (combine, commit by pathspec):
    // its `vcs` factor is what tells a holder a commit is durability and not acceptance.
    actions: [fileOps_actions],
    reasoningStrategy: react_reasoningStrategy,
    // `satisfice`: one check per combination is the whole remit. Running it again, or
    // widening it, is a second concept and would spend the architect's wait for nothing.
    satisficing: satisfice_satisficing,
    // The oracle is the project's own check, executed: it runs it, and a green it did
    // not observe is not one it reports.
    selfEvaluation: executableTestOracle_selfEvaluation,
  },
};
