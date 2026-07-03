/**
 * The exemplify/optimize pipeline — the mechanical frame of the documented
 * import → optimize → compile flow. The semantic stages (conceptualize →
 * signify → materialize) are LLM passes authored into the plan this module
 * gates; see `types.ts` (SEMANTIC SEAM) for the boundary.
 */

export { canonicalText, fragmentDigest } from './digest.js';
export {
  checkCoverage,
  exemplify,
  optimize,
  optimizeRules,
  readManifest,
} from './pipeline.js';
export { ORGAN_FIELD } from './organ-fields.js';
export {
  classifyRegister,
  humanMarkerHits,
  type Register,
} from './register.js';
export {
  renderFormalBlock,
  renderSkillCell,
  renderSkillCellBody,
  type SkillCellSpec,
  type SkillDeclaration,
} from './skill-cell.js';
export {
  ExemplifyRefusal,
  type ArtifactSpec,
  type ConceptRecord,
  type DeltaEntry,
  type ExemplifyInput,
  type OptimizeInput,
  type OptimizeResult,
  type RouteEntry,
  type RoutingManifest,
} from './types.js';
export {
  elevateAgent,
  renderAgentVector,
  type ElevateOptions,
  type ElevateResult,
  type ElevationSpec,
  type OrganElicitPlan,
  type OrganEvidence,
  type OrganFragmentSpec,
  type OrganInheritPlan,
  type OrganPlan,
  type OrganValuePlan,
  type RenderedVector,
} from './vector.js';
