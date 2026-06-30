import type { ErrorObject, ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import { Ajv2020 } from 'ajv/dist/2020.js';
import type {
  Agent,
  Command,
  EnvVars,
  Hook,
  IR,
  Manifest,
  McpServer,
  Permissions,
  Rule,
  Skill,
} from './generated.js';
import {
  agentSchema,
  commandSchema,
  envSchema,
  hookSchema,
  irSchema,
  manifestSchema,
  mcpServerSchema,
  permissionsSchema,
  ruleSchema,
  skillSchema,
} from './schemas.js';

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

// Register sub-schemas first so $refs in irSchema resolve.
ajv.addSchema(manifestSchema);
ajv.addSchema(ruleSchema);
ajv.addSchema(skillSchema);
ajv.addSchema(commandSchema);
ajv.addSchema(agentSchema);
ajv.addSchema(hookSchema);
ajv.addSchema(mcpServerSchema);
ajv.addSchema(permissionsSchema);
ajv.addSchema(envSchema);

export const validateIR = ajv.compile<IR>(irSchema);
// getSchema returns ValidateFunction | undefined; each id was just addSchema'd
// above, so absence is a programming error — assert it as a checked invariant.
function mustGetSchema<T>(id: string): ValidateFunction<T> {
  const v = ajv.getSchema<T>(id);
  if (!v) throw new Error(`koine: schema not registered: ${id}`);
  return v;
}

export const validateManifest = mustGetSchema<Manifest>(manifestSchema.$id);
export const validateRule = mustGetSchema<Rule>(ruleSchema.$id);
export const validateSkill = mustGetSchema<Skill>(skillSchema.$id);
export const validateCommand = mustGetSchema<Command>(commandSchema.$id);
export const validateAgent = mustGetSchema<Agent>(agentSchema.$id);
export const validateHook = mustGetSchema<Hook>(hookSchema.$id);
export const validateMcpServer = mustGetSchema<McpServer>(mcpServerSchema.$id);
export const validatePermissions = mustGetSchema<Permissions>(
  permissionsSchema.$id,
);
export const validateEnv = mustGetSchema<EnvVars>(envSchema.$id);

export { ajv };

export type ValidationError = {
  path: string;
  message: string;
  keyword: string;
};

export function formatErrors(
  errors: ValidateFunction['errors'],
): ValidationError[] {
  if (!errors) return [];
  return errors.map((e: ErrorObject) => ({
    path: e.instancePath || '/',
    message: e.message ?? 'invalid',
    keyword: e.keyword,
  }));
}
