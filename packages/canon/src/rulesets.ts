// ─────────────────────────────────────────────────────────────────────────────
// The canon's rulesets: the named sets of rules an install offers, each taken
// whole, rule by rule, or not at all.
// ─────────────────────────────────────────────────────────────────────────────

import type { Ruleset } from '@cratylus/schema';
import { behaviourDrivenDevelopment } from './rules/behaviour-driven-development.js';
import { cleanCutover } from './rules/clean-cutover.js';
import { commitDiscipline } from './rules/commit-discipline.js';
import { contextEngineering } from './rules/context-engineering.js';
import { conventionalCommits } from './rules/conventional-commits.js';
import { establishedLibraries } from './rules/established-libraries.js';
import { gitflow } from './rules/gitflow.js';

export const RULESETS: readonly Ruleset[] = [
  behaviourDrivenDevelopment,
  contextEngineering,
  gitflow,
  conventionalCommits,
  commitDiscipline,
  establishedLibraries,
  cleanCutover,
];
