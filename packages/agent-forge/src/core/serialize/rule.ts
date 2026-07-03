import {
  parseFrontmatter,
  serializeFrontmatter,
} from '../engine/frontmatter.js';
import type { Rule } from '../ir/types.js';

/**
 * Parse a rule file (markdown with optional YAML frontmatter) into a Rule.
 * `id` defaults to the filename without extension; if frontmatter contains
 * an `id`, it overrides.
 */
export function parseRule(text: string, defaultId: string): Rule {
  const { frontmatter, body } = parseFrontmatter<Partial<Rule>>(text);
  const rule: Rule = {
    id: typeof frontmatter.id === 'string' ? frontmatter.id : defaultId,
    body,
  };
  if (frontmatter.targets) rule.targets = frontmatter.targets;
  if (frontmatter.excludes) rule.excludes = frontmatter.excludes;
  if (frontmatter.concat !== undefined) rule.concat = frontmatter.concat;
  if (frontmatter.order !== undefined) rule.order = frontmatter.order;
  if (frontmatter.description !== undefined)
    rule.description = frontmatter.description;
  if (frontmatter.globs !== undefined) rule.globs = frontmatter.globs;
  if (frontmatter.activation !== undefined)
    rule.activation = frontmatter.activation;
  if (frontmatter.alwaysApply !== undefined)
    rule.alwaysApply = frontmatter.alwaysApply;
  if (frontmatter.dir !== undefined) rule.dir = frontmatter.dir;
  return rule;
}

/**
 * Serialize a Rule into a markdown file string. The `id` is omitted from
 * frontmatter (it is encoded in the filename).
 */
export function serializeRule(rule: Rule): string {
  const fm: Record<string, unknown> = {};
  if (rule.targets) fm.targets = rule.targets;
  if (rule.excludes) fm.excludes = rule.excludes;
  if (rule.concat !== undefined) fm.concat = rule.concat;
  if (rule.order !== undefined) fm.order = rule.order;
  if (rule.description !== undefined) fm.description = rule.description;
  if (rule.globs !== undefined) fm.globs = rule.globs;
  if (rule.activation !== undefined) fm.activation = rule.activation;
  if (rule.alwaysApply !== undefined) fm.alwaysApply = rule.alwaysApply;
  if (rule.dir !== undefined) fm.dir = rule.dir;
  return serializeFrontmatter(fm, rule.body);
}
