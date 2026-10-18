// ─────────────────────────────────────────────────────────────────────────────
// The corpus's rulesets: standard working conventions an install offers, each
// whole, rule by rule, or not at all.
// ─────────────────────────────────────────────────────────────────────────────

import type { Ruleset } from '@cratylus/schema';
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
