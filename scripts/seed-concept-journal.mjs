#!/usr/bin/env node
// One-time seeding of a repository's concept journal from the cratylus repository's design files
// (workflow.md, delivery.md, decisions/NNNN-*.md). Not part of the `cratylus concepts` capability: it
// records only by running that command line's appending verbs through the bin built beside it.
//
//   node scripts/seed-concept-journal.mjs [--from <dir>]
//
// Run with the target repository as the working directory; <dir> defaults to its design/.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const bin = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../packages/cli/dist/cratylus.js',
);

function fail(message) {
  process.stderr.write(`seed-concept-journal: ${message}\n`);
  process.exit(1);
}

function unfold(text) {
  return text.replace(/\s*\n\s*/g, ' ');
}

function section(text, heading, file) {
  const found = new RegExp(
    `^## ${heading}\\r?\\n([\\s\\S]*?)(?=^## |$(?![\\s\\S]))`,
    'm',
  ).exec(text);
  if (!found) fail(`${file} has no section "## ${heading}"`);
  return found[1].trim();
}

function read(path) {
  if (!existsSync(path)) fail(`${path} does not exist`);
  return readFileSync(path, 'utf8');
}

function parseArguments(argv) {
  let from;
  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index];
    if (argument === '--from' && index + 1 < argv.length) from = argv[++index];
    else if (argument.startsWith('--from=')) from = argument.slice(7);
    else fail(`unexpected argument ${argument}`);
  }
  return from;
}

function topLevel() {
  const result = spawnSync('git', ['rev-parse', '--show-toplevel'], {
    encoding: 'utf8',
  });
  if (result.status !== 0) fail('not inside a git repository');
  return result.stdout.trim();
}

function contextsOf(workflow, file) {
  const contexts = [
    ...section(workflow, 'Context map', file).matchAll(
      /^\|\s*\*\*(.+?)\*\*\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*$/gm,
    ),
  ].map(([, name, subject, relation]) => ({
    name,
    subject,
    relation: relation === 'this file' ? '' : relation,
  }));
  if (contexts.length === 0) fail(`${file} has no contexts in its context map`);
  return contexts;
}

function contractsOf(delivery, file) {
  return section(delivery, 'Contracts with other contexts', file)
    .split(/(?=^- )/m)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => unfold(block.replace(/^- /, '')));
}

function conceptsOf(text, context, file) {
  return section(text, 'Concepts', file)
    .split(/(?=^- \*\*)/m)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const unfolded = unfold(block);
      const match =
        /^- \*\*(.+?)\*\* · (.+?) · (_primitive_|_built from:_ (.+?)) · _decided in:_ (\d{4})$/.exec(
          unfolded,
        );
      if (!match) fail(`${file}: cannot parse concept: ${unfolded}`);
      return {
        name: match[1],
        context,
        wording: match[2],
        builtFrom: match[4]?.split(',').map((part) => part.trim()) ?? [],
        decisionId: match[5],
      };
    });
}

function decisionsOf(directory, concepts) {
  return readdirSync(directory)
    .filter((name) => /^\d{4}-.+\.md$/.test(name))
    .sort()
    .map((name) => {
      const file = join(directory, name);
      const text = read(file);
      const heading = /^# (\d{4}) · (.+)$/m.exec(text);
      if (!heading) fail(`${file} has no "# NNNN · <title>" heading`);
      const owners = [
        ...new Set(
          concepts
            .filter((concept) => concept.decisionId === heading[1])
            .map((concept) => concept.context),
        ),
      ];
      if (owners.length > 1)
        fail(`decision ${heading[1]} decides concepts of ${owners.join(', ')}`);
      return {
        id: heading[1],
        title: heading[2].trim(),
        context: owners[0] ?? 'workflow',
        situation: section(text, 'Context', file),
        decision: section(text, 'Decision', file),
        consequences: section(text, 'Consequences', file),
      };
    });
}

// Every value is passed as `--flag=value`, so no value is ever read as a flag.
function concepts(verb, name, flags) {
  const args = flags.map(([flag, value]) => `--${flag}=${value}`);
  const result = spawnSync(
    process.execPath,
    [bin, 'concepts', verb, name, ...args],
    {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'inherit'],
    },
  );
  if (result.error) fail(`${verb}: ${result.error.message}`);
  if (result.status !== 0) fail(`cratylus concepts ${verb} ${name} refused`);
}

const root = topLevel();
const from = resolve(
  parseArguments(process.argv.slice(2)) ?? join(root, 'design'),
);
const journal = join(root, 'design/journal');
if (existsSync(journal) && readdirSync(journal).length > 0)
  fail(`${journal} already holds entries; seeding happens once`);

// Parse and validate every source before appending anything.
const workflowFile = join(from, 'workflow.md');
const deliveryFile = join(from, 'delivery.md');
const workflow = read(workflowFile);
const delivery = read(deliveryFile);
const contexts = contextsOf(workflow, workflowFile);
const deliveryContext = contexts.find((context) => context.name === 'delivery');
if (!deliveryContext) fail(`${workflowFile} maps no delivery context`);
deliveryContext.relation = [
  deliveryContext.relation,
  ...contractsOf(delivery, deliveryFile),
]
  .filter(Boolean)
  .join(' ');
const allConcepts = [
  ...conceptsOf(workflow, 'workflow', workflowFile),
  ...conceptsOf(delivery, 'delivery', deliveryFile),
];
const decisions = decisionsOf(join(from, 'decisions'), allConcepts);
const titles = new Map(
  decisions.map((decision) => [decision.id, decision.title]),
);
for (const concept of allConcepts) {
  if (!titles.has(concept.decisionId))
    fail(
      `${concept.name} is decided in ${concept.decisionId}, which has no decision file`,
    );
  if (!contexts.some((context) => context.name === concept.context))
    fail(`${concept.context} is not in the context map`);
}

for (const context of contexts) {
  concepts('context', context.name, [
    ['subject', context.subject],
    ...(context.relation ? [['relation', context.relation]] : []),
  ]);
}
for (const decision of decisions) {
  concepts('decide', decision.id, [
    ['context', decision.context],
    ['title', decision.title],
    ['situation', decision.situation],
    ['decision', decision.decision],
    ['consequences', decision.consequences],
    ['status', 'accepted'],
  ]);
}
for (const concept of allConcepts) {
  concepts('define', concept.name, [
    ['context', concept.context],
    ['wording', concept.wording],
    [
      'reason',
      `decided in ${concept.decisionId}: ${titles.get(concept.decisionId)}`,
    ],
    ...concept.builtFrom.map((name) => ['built-from', name]),
  ]);
}
process.stdout.write(
  `seeded ${contexts.length} contexts, ${allConcepts.length} concepts, ${decisions.length} decisions\n`,
);
