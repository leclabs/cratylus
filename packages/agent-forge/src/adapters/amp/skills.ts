import { serializeFrontmatter } from '../../core/index.js';
import type { Skill } from '../../core/index.js';
import { parseFrontmatter } from '../../core/index.js';

/**
 * Spec-form SKILL.md for the shared `.agents/skills/` tree [AM4]: Agent
 * Skills spec fields only (dashed keys per the spec's own frontmatter
 * convention), same shape the shared reader (and every other client honoring
 * this dir) expects. IR-only fields with no spec-frontmatter slot are the
 * caller's warned drop, never fabricated here.
 */
export function serializeAmpSkill(cell: Skill): string {
  const fm: Record<string, unknown> = {
    name: cell.name,
    description: cell.description,
  };
  if (cell.allowed_tools) fm['allowed-tools'] = cell.allowed_tools;
  if (cell.license !== undefined) fm.license = cell.license;
  if (cell.compatibility !== undefined) fm.compatibility = cell.compatibility;
  if (cell.metadata !== undefined) fm.metadata = cell.metadata;
  if (cell.disable_model_invocation !== undefined)
    fm['disable-model-invocation'] = cell.disable_model_invocation;
  return serializeFrontmatter(fm, cell.body);
}

/** The dashed-frontmatter counterpart of `serializeAmpSkill`, for read(). */
export function parseAmpSkill(text: string, defaultName: string): Skill {
  const { frontmatter, body } = parseFrontmatter<Record<string, unknown>>(text);
  const name =
    typeof frontmatter.name === 'string' ? frontmatter.name : defaultName;
  const description =
    typeof frontmatter.description === 'string' ? frontmatter.description : '';
  const cell: Skill = { name, description, body };
  if (frontmatter['allowed-tools'])
    cell.allowed_tools = frontmatter['allowed-tools'] as string[];
  if (frontmatter.license !== undefined)
    cell.license = frontmatter.license as string;
  if (frontmatter.compatibility !== undefined)
    cell.compatibility = frontmatter.compatibility as Skill['compatibility'];
  if (frontmatter.metadata !== undefined)
    cell.metadata = frontmatter.metadata as Skill['metadata'];
  if (frontmatter['disable-model-invocation'] !== undefined)
    cell.disable_model_invocation = frontmatter[
      'disable-model-invocation'
    ] as boolean;
  return cell;
}

/** Fields with no Amp/spec frontmatter home — dropped loudly by the caller. */
export const AMP_LOSSY_FIELDS = ['files', 'paths', 'user_invocable'] as const;
