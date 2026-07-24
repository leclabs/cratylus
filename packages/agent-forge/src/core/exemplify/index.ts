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
  readManifest,
} from './pipeline.js';
export { DIMENSION_FIELD } from './dimension-fields.js';
export {
  classifyRegister,
  humanMarkerHits,
  type Register,
} from './register.js';
export {
  renderBody,
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
  type DimensionElicitPlan,
  type DimensionEvidence,
  type DimensionFragmentSpec,
  type DimensionInheritPlan,
  type DimensionPlan,
  type FragmentPlan,
  type RenderedVector,
} from './vector.js';
