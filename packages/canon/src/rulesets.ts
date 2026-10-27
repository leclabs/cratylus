// ─────────────────────────────────────────────────────────────────────────────
// The canon's rulesets: the named sets of rules an install offers, each taken
// whole, rule by rule, or not at all; and the rulesets the agents' practice
// departs by, which every install places with the agents.
// ─────────────────────────────────────────────────────────────────────────────

import type { Ruleset } from '@cratylus/schema';
import { behaviourDrivenDevelopment } from './rules/behaviour-driven-development.js';
import { commitDiscipline } from './rules/commit-discipline.js';
import { conventionalCommits } from './rules/conventional-commits.js';
import { establishedLibraries } from './rules/established-libraries.js';
import { gitflow } from './rules/gitflow.js';
import { greenField } from './rules/green-field.js';

export const RULESETS: readonly Ruleset[] = [
  gitflow,
  conventionalCommits,
  commitDiscipline,
  establishedLibraries,
  greenField,
];

export const PRACTICE_RULESETS: readonly Ruleset[] = [
  behaviourDrivenDevelopment,
];
