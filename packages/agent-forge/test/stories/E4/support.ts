/**
 * Shared fixtures + comparators for the E4 (roundtrip) story suite.
 *
 * Ground truth: plans/interop-hardening/completed/harness-landscape-research.RETURN.md
 * (§1 capability matrix, §2 config-contract sheets, §3 divergences). Citation
 * keys like [CC6] resolve in that document's §5 source ledger.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type {
  CanonicalEvent,
  IR,
  Manifest,
  Scope,
} from '../../../src/core/index.js';
import type { ResourceType } from '../../../src/core/index.js';

const HERE = dirname(fileURLToPath(import.meta.url));
export const SCHEMA_DIR = join(HERE, '../../../src/core/schema');

/** Schemas that live outside `core/schema` because they are owned by a module
 *  of their own — `hook.schema.json` travels with `core/hook`'s generator. */
const SCHEMA_DIR_OF: Record<string, string> = {
  hook: join(HERE, '../../../src/core/hook'),
};

export function readSchema(name: string): Record<string, unknown> {
  const dir = SCHEMA_DIR_OF[name] ?? SCHEMA_DIR;
  return JSON.parse(
    readFileSync(join(dir, `${name}.schema.json`), 'utf8'),
  ) as Record<string, unknown>;
}

/**
 * The 28 canonical events, derived from the schema enum (the source of truth
 * behind src/core/hook/generated.ts) rather than hardcoded.
 */
export function canonicalEvents(): CanonicalEvent[] {
  const schema = readSchema('hook') as {
    $defs: { CanonicalEvent: { enum: CanonicalEvent[] } };
  };
  return schema.$defs.CanonicalEvent.enum;
}

export function manifest(target: string, scope: Scope = 'project'): Manifest {
  return { agentForge: 1, scope, targets: [target] };
}

/**
 * One fixture per resource type, exercising every schema-defined content field
 * of the type (verified by the E4.S1 field-coverage story against the schema
 * JSON). `mcp` carries both discriminated variants (stdio + remote).
 */
export const FIXTURES: Record<ResourceType, Partial<IR>> = {
  rules: {
    rules: [{ id: 'main', body: '# Rules\n\nBe terse. Avoid emoji.' }],
  },
  skills: {
    skills: [
      {
        name: 'review',
        description: 'Review code',
        body: '# How to review\n\n1. read\n2. comment',
        allowed_tools: ['Read', 'Grep'],
        files: ['references/guide.md'],
      },
    ],
  },
  commands: {
    commands: [
      {
        name: 'plan',
        body: 'Make a plan.',
        description: 'Trigger planning',
        argument_hint: '<topic>',
        model: 'sonnet',
        allowed_tools: ['Read'],
      },
    ],
  },
  agents: {
    agents: [
      {
        name: 'planner',
        body: 'You are the planner.',
        description: 'Plans tasks',
        model: 'claude-sonnet-4-6',
        tools: ['Read', 'Bash'],
        color: 'blue',
      },
    ],
  },
  hooks: {
    hooks: [
      {
        id: 'fmt',
        events: ['tool.use.pre'],
        matcher: 'Edit',
        command: './fmt.sh',
        timeout: 30,
      },
    ],
  },
  mcp: {
    mcp_servers: [
      {
        name: 'github',
        transport: 'stdio',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        env: { GITHUB_TOKEN: 'xxx' },
      },
      {
        name: 'remote-api',
        transport: 'http',
        url: 'https://example.com/mcp',
        headers: { Authorization: 'Bearer x' },
      },
    ],
  },
  permissions: {
    permissions: {
      allow: ['Read(*)'],
      deny: ['Bash(rm -rf:*)'],
      ask: ['WebFetch(*)'],
    },
  },
  env: {
    env: { DEBUG: 'true', API_URL: 'https://example.com' },
  },
};

/** IR property name per capability resource type. */
export const IR_KEY: Record<ResourceType, keyof IR> = {
  rules: 'rules',
  skills: 'skills',
  commands: 'commands',
  agents: 'agents',
  hooks: 'hooks',
  mcp: 'mcp_servers',
  permissions: 'permissions',
  env: 'env',
};

/** Schema file per resource type (env has no fixed properties — a string map). */
export const SCHEMA_NAME: Record<ResourceType, string> = {
  rules: 'rule',
  skills: 'skill',
  commands: 'command',
  agents: 'agent',
  hooks: 'hook',
  mcp: 'mcp-server',
  permissions: 'permissions',
  env: 'env',
};

/**
 * Schema fields excluded from the round-trip comparison, with rationale.
 * Everything else must survive `import(compile(r))` field-for-field.
 *
 * - `targets`/`excludes` (all types): IR-level routing directives, consumed by
 *   the engine at compile time — never target content.
 * - Rule `concat`/`order`: concatenation directives, likewise consumed when the
 *   target file is assembled.
 * - Hook `id`: source-filename artifact; native hook dialects have no id slot,
 *   so read() regenerates ids. Every semantic field (events, matcher, command,
 *   timeout) is compared.
 * - E9 schema-extension fields (2026-07, `ir-schema-expressiveness`): the IR
 *   now models the richest documented dialects ahead of adapter mapping —
 *   rule activation/placement (E9.S2/E7.S7), agent + skill frontmatter surface
 *   (E9.S6), mcp dialect knobs (E9.S1). Adapter emit/lift for these is owned
 *   by the E7/E8 shards (their tracked tests pin it); when a mapping lands,
 *   move the field from here into the fixtures so the matrix compares it.
 */
export const EXCLUDED_FIELDS: Record<string, readonly string[]> = {
  common: ['targets', 'excludes'],
  rules: [
    'concat',
    'order',
    // E9.S2 / E7.S7 activation + placement
    'description',
    'globs',
    'activation',
    'alwaysApply',
    'dir',
  ],
  hooks: ['id'],
  // E9.S6 agent frontmatter surface
  agents: [
    'permission_mode',
    'max_turns',
    'temperature',
    'mode',
    'memory',
    'effort',
  ],
  // E9.S6 skill frontmatter surface
  skills: [
    'license',
    'compatibility',
    'metadata',
    'paths',
    'user_invocable',
    'disable_model_invocation',
  ],
  // E9.S1 mcp dialect knobs
  mcp: [
    'disabled',
    'autoApprove',
    'includeTools',
    'excludeTools',
    'trust',
    'timeout',
    'http_headers',
    'bearer_token_env_var',
    'auth',
  ],
};

function excludedFor(type: ResourceType): readonly string[] {
  return [...EXCLUDED_FIELDS.common, ...(EXCLUDED_FIELDS[type] ?? [])];
}

/**
 * Deep-normalize for comparison: drop excluded fields, trim trailing
 * whitespace on strings (serializers may append a final newline), and sort
 * object keys so key order never masquerades as a semantic difference.
 */
export function comparable(value: unknown, type: ResourceType): unknown {
  const excluded = excludedFor(type);
  const norm = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(norm);
    if (v && typeof v === 'object') {
      const out: Record<string, unknown> = {};
      for (const k of Object.keys(v as Record<string, unknown>).sort()) {
        if (excluded.includes(k)) continue;
        out[k] = norm((v as Record<string, unknown>)[k]);
      }
      return out;
    }
    return typeof v === 'string' ? v.trimEnd() : v;
  };
  return norm(value);
}

/** Read every file under `dir` into a { relativePath: content } map. */
export function snapshotTree(dir: string): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (p: string): void => {
    for (const entry of readdirSync(p, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      const q = join(p, entry.name);
      if (entry.isDirectory()) walk(q);
      else out[q.slice(dir.length)] = readFileSync(q, 'utf8');
    }
  };
  walk(dir);
  return out;
}
